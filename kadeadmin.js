import{initializeApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getAuth,signInWithEmailAndPassword,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{getFirestore,collection,addDoc,updateDoc,deleteDoc,doc,query,orderBy,onSnapshot}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ჩაანაცვლე შენი Firebase პროექტის მონაცემებით (kade.js-შიც იგივე)
const cfg={apiKey:"AIzaSyCgBxb2hSc4oqUgg3tZlUHaa8JU8x6TU_A",authDomain:"kade-k2.firebaseapp.com",projectId:"kade-k2",appId:"1:157514087829:web:32f02c6023af7393480a9c"};
const app=initializeApp(cfg),auth=getAuth(app),db=getFirestore(app),col=collection(db,"wines");
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let items=[],editId=null,unsub=null;

// შესვლა / გასვლა
$("#in").onclick=async()=>{
  $("#err").textContent="";
  try{await signInWithEmailAndPassword(auth,$("#em").value,$("#pw").value)}
  catch{$("#err").textContent="ელფოსტა ან პაროლი არასწორია"}
};
$("#out").onclick=()=>signOut(auth);
onAuthStateChanged(auth,u=>{
  $("#login").hidden=!!u;$("#panel").hidden=!u;
  if(u){unsub=onSnapshot(query(col,orderBy("order","desc")),s=>{items=s.docs.map(d=>({id:d.id,...d.data()}));draw()})}
  else if(unsub){unsub();unsub=null}
});

// ფოტოს შემცირება და base64-ად გადაყვანა (Firestore-ის 1 MB ლიმიტის გამო)
const shrink=f=>new Promise(r=>{
  const i=new Image();
  i.onload=()=>{const k=Math.min(1,700/Math.max(i.width,i.height)),c=document.createElement("canvas");
    c.width=i.width*k;c.height=i.height*k;c.getContext("2d").drawImage(i,0,0,c.width,c.height);
    r(c.toDataURL("image/jpeg",.8))};
  i.src=URL.createObjectURL(f);
});
$("#photo").onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  $("#pv").src=await shrink(f);$("#pv").hidden=false;
};
$("#glass").onchange=()=>{$("#gp").hidden=!$("#glass").checked};

function reset(){
  editId=null;$("#f").reset();$("#pv").hidden=true;$("#gp").hidden=true;
  $("#ft").textContent="ახალი ღვინო";$("#cancel").hidden=true;
}
$("#cancel").onclick=reset;

// დამატება / რედაქტირება
$("#f").onsubmit=async e=>{
  e.preventDefault();
  const d=Object.fromEntries(new FormData($("#f")));
  const w={
    name:{ka:d.nka,en:d.nen,ru:d.nru},desc:{ka:d.dka,en:d.den,ru:d.dru},
    type:d.type,country:d.country,grape:d.grape,producer:d.producer,year:d.year,
    bottle:+d.bottle,glass:!!d.glass,glassPrice:d.glass&&d.glassPrice?+d.glassPrice:null
  };
  const file=$("#photo").files[0];
  if(file)w.img=await shrink(file);
  $("#msg").textContent="";
  try{
    if(editId)await updateDoc(doc(db,"wines",editId),w);
    else await addDoc(col,{...w,active:true,order:Date.now()});
    reset();
  }catch(err){$("#msg").textContent="ვერ შეინახა: "+err.message}
};

// სია
function draw(){
  $("#list").innerHTML=items.map(w=>`
  <div class="it ${w.active===false?"off":""}" data-id="${w.id}">
    ${w.img?`<img src="${w.img}" alt="">`:`<div class="no">🍷</div>`}
    <div><b>${esc(w.name?.ka)}</b><small>${esc(w.name?.en)} / ${esc(w.name?.ru)}</small></div>
    <input class="p" type="number" step="0.01" min="0" value="${esc(w.bottle)}" data-a="price" title="ბოთლის ფასი ₾">
    <div class="acts">
      <button data-a="edit" class="ghost">რედაქტირება</button>
      <button data-a="stop" class="ghost">${w.active===false?"დაბრუნება":"სტოპი"}</button>
      <button data-a="del" class="ghost">წაშლა</button>
    </div>
  </div>`).join("");
}

$("#list").addEventListener("click",async e=>{
  const a=e.target.dataset.a,row=e.target.closest(".it");if(!a||!row||a==="price")return;
  const w=items.find(x=>x.id===row.dataset.id);
  if(a==="stop")await updateDoc(doc(db,"wines",w.id),{active:w.active===false});
  if(a==="del"&&confirm("წაიშალოს „"+w.name.ka+"“?"))await deleteDoc(doc(db,"wines",w.id));
  if(a==="edit"){
    editId=w.id;const f=$("#f");
    const set=(n,v)=>f.elements[n].value=v??"";
    set("nka",w.name?.ka);set("nen",w.name?.en);set("nru",w.name?.ru);
    set("dka",w.desc?.ka);set("den",w.desc?.en);set("dru",w.desc?.ru);
    set("type",w.type);set("country",w.country);set("grape",w.grape);set("producer",w.producer);set("year",w.year);
    set("bottle",w.bottle);f.elements.glass.checked=!!w.glass;set("glassPrice",w.glassPrice);
    $("#gp").hidden=!w.glass;$("#photo").value="";
    if(w.img){$("#pv").src=w.img;$("#pv").hidden=false}else $("#pv").hidden=true;
    $("#ft").textContent="რედაქტირება";$("#cancel").hidden=false;scrollTo({top:0,behavior:"smooth"});
  }
});

// ბოთლის ფასის სწრაფი შეცვლა სიიდან
$("#list").addEventListener("change",async e=>{
  if(e.target.dataset.a!=="price")return;
  const v=parseFloat(e.target.value);if(isNaN(v)||v<0)return;
  await updateDoc(doc(db,"wines",e.target.closest(".it").dataset.id),{bottle:v});
});