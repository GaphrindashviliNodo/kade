import{initializeApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{initializeFirestore,persistentLocalCache,collection,query,orderBy,onSnapshot}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ჩაანაცვლე შენი Firebase პროექტის მონაცემებით (kadeadmin.js-შიც იგივე)
const cfg={apiKey:"AIzaSyCgBxb2hSc4oqUgg3tZlUHaa8JU8x6TU_A",authDomain:"kade-k2.firebaseapp.com",projectId:"kade-k2",appId:"1:157514087829:web:32f02c6023af7393480a9c"};
const db=initializeFirestore(initializeApp(cfg),{localCache:persistentLocalCache()});

const T={
ka:{tag:"ქართული და ევროპული ღვინის კატალოგი",search:"ძიება სახელით, ჯიშით, მწარმოებლით",all:"ყველა",empty:"ღვინო ვერ მოიძებნა",bottle:"ბოთლი",glass:"ჭიქა",types:{red:"წითელი",white:"თეთრი",amber:"ქარვისფერი",rose:"ვარდისფერი",sparkling:"მოვარვარე",dessert:"დესერტული"}},
ru:{tag:"Каталог грузинских и европейских вин",search:"Поиск по названию, сорту, производителю",all:"Все",empty:"Вино не найдено",bottle:"Бутылка",glass:"Бокал",types:{red:"Красное",white:"Белое",amber:"Янтарное",rose:"Розовое",sparkling:"Игристое",dessert:"Десертное"}},
en:{tag:"Georgian and European wine catalogue",search:"Search by name, grape, producer",all:"All",empty:"No wines found",bottle:"Bottle",glass:"Glass",types:{red:"Red",white:"White",amber:"Amber",rose:"Rosé",sparkling:"Sparkling",dessert:"Dessert"}}};

const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const first=localStorage.getItem("kl")||(navigator.language||"").slice(0,2);
let lang=T[first]?first:"ka",type="all",wines=[];

function render(){
  const t=T[lang],q=$("#q").value.trim().toLowerCase();
  document.documentElement.lang=lang;
  $("#tag").textContent=t.tag;$("#q").placeholder=t.search;
  document.querySelectorAll(".lang button").forEach(b=>b.classList.toggle("on",b.dataset.l===lang));
  $("#chips").innerHTML=["all",...Object.keys(t.types)].map(k=>`<button data-t="${k}" class="${k===type?"on":""}">${k==="all"?t.all:t.types[k]}</button>`).join("");
  const list=wines.filter(w=>w.active!==false&&(type==="all"||w.type===type)&&(!q||JSON.stringify([w.name,w.grape,w.producer,w.country]).toLowerCase().includes(q)));
  $("#grid").innerHTML=list.map(w=>`
  <article class="card" style="--c:var(--${esc(w.type)})">
    <div class="ph">${w.img?`<img loading="lazy" src="${w.img}" alt="">`:"🍷"}</div>
    <div class="in">
      <span class="tp">${esc(t.types[w.type])}</span>
      <h2>${esc(w.name?.[lang]||w.name?.en||w.name?.ka)}</h2>
      <div class="meta">${[w.country,w.grape,w.producer,w.year].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join("")}</div>
      ${w.desc?.[lang]?`<p class="ds">${esc(w.desc[lang])}</p>`:""}
      <div class="pr"><span>${t.bottle}<b>${esc(w.bottle)} ₾</b></span>${w.glass&&w.glassPrice?`<span>${t.glass}<b>${esc(w.glassPrice)} ₾</b></span>`:""}</div>
    </div>
  </article>`).join("");
  $("#empty").hidden=list.length>0;$("#empty").textContent=t.empty;
}

document.addEventListener("click",e=>{
  const l=e.target.dataset?.l,k=e.target.dataset?.t;
  if(l){lang=l;localStorage.setItem("kl",l);render()}
  if(k){type=k;render()}
});
$("#q").oninput=render;
onSnapshot(query(collection(db,"wines"),orderBy("order","desc")),s=>{wines=s.docs.map(d=>({id:d.id,...d.data()}));render()});
render();