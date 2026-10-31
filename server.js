const http=require("http"),express=require("express"),{Server}=require("socket.io");
const app=express();app.get("/",(q,s)=>s.sendFile(__dirname+"/index.html"));
app.use(express.json({limit:"10kb"}));
app.get("/:f",(q,s,next)=>/^icon-(192|512)\.png$/.test(q.params.f)?s.sendFile(__dirname+"/"+q.params.f):next());
app.get("/manifest.json",(q,s)=>s.json({name:"مافيا",short_name:"مافيا",start_url:"/",display:"standalone",background_color:"#0b1020",theme_color:"#0b1020",lang:"ar",dir:"rtl",icons:[{src:"/icon-192.png",sizes:"192x192",type:"image/png"},{src:"/icon-512.png",sizes:"512x512",type:"image/png"}]}));
app.get("/ice",(q,s)=>{const l=[{urls:"stun:stun.l.google.com:19302"}];if(process.env.TURN_URL)l.push({urls:process.env.TURN_URL.split(","),username:process.env.TURN_USER,credential:process.env.TURN_PASS});s.json(l)});
const PAGE=(t,b)=>`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t}</title><style>body{background:#0b1020;color:#f3ead8;font-family:system-ui,sans-serif;line-height:1.8;max-width:640px;margin:0 auto;padding:20px}h1,h2{color:#f1d38a}a{color:#f1d38a}input,button{font:inherit;padding:8px;margin:4px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #3a2c22;padding:6px;text-align:right}</style></head><body>${b}</body></html>`;
app.get("/privacy",(q,s)=>s.send(PAGE("الخصوصية والشروط",`<h1>الخصوصية والشروط</h1>
<h2>البيانات اللي بنحفظها</h2><p>اسم المستخدم، وكلمة السر مشفّرة (ما بنقدر نشوفها)، وإحصائيات اللعب والعملات والأغراض اللي اشتريتها. رسائل الشات بتظهر لأعضاء الغرفة فقط وما بنحفظها بعد انتهاء الغرفة.</p>
<h2>المحادثة الصوتية</h2><p>الصوت بيتنقل مباشرة بين اللاعبين ولا بنسجّله ولا بنحفظه على السيرفر. المايك ما بيشتغل إلا إذا ضغطت عليه.</p>
<h2>قواعد اللعب</h2><p>ممنوع الإساءة والتحرش والكراهية والغش. ممكن نكتم أو نحظر أي حساب بيخالف القواعد.</p>
<h2>المتجر والعملات</h2><p>الأغراض شكلية فقط وما بتعطي أي أفضلية باللعب.</p>
<h2>حذف الحساب</h2><p>تواصل مع إدارة الموقع لحذف حسابك وبياناتك.</p>
<p><a href="/">رجوع للعبة</a></p>`)));
const adm=k=>process.env.ADMIN_KEY&&process.env.ADMIN_KEY.length>=8&&k===process.env.ADMIN_KEY;
app.get("/admin",(q,s)=>s.send(PAGE("إدارة",`<h1>إدارة مافيا</h1><input id="k" type="password" placeholder="مفتاح الإدارة"><button id="ld">عرض اللاعبين</button><div id="o"></div>
<script>
var K="";function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function load(){K=document.getElementById("k").value;fetch("/admin/users?key="+encodeURIComponent(K)).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(l){
document.getElementById("o").innerHTML="<table><tr><th>الاسم</th><th>م</th><th>فوز</th><th>عملات</th><th></th></tr>"+l.map(function(u){return"<tr><td>"+esc(u.name)+(u.banned?" (محظور)":"")+"</td><td>"+(Math.floor(u.xp/100)+1)+"</td><td>"+u.wins+"</td><td>"+u.coins+"</td><td><button data-n=\""+esc(u.name)+"\" data-b=\""+(u.banned?0:1)+"\">"+(u.banned?"فك الحظر":"حظر")+"</button></td></tr>"}).join("")+"</table>"}).catch(function(){document.getElementById("o").textContent="مفتاح غلط أو الإدارة غير مفعّلة."})}
document.getElementById("ld").onclick=load;
document.getElementById("o").onclick=function(e){var b=e.target.closest("button");if(!b)return;fetch("/admin/ban",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:K,name:b.dataset.n,ban:b.dataset.b==="1"})}).then(load)};
</script>`)));
app.get("/admin/users",(q,s)=>adm(q.query.key)?s.json(Object.values(db.users).map(x=>({name:x.name,xp:x.xp,wins:x.wins,coins:x.coins,banned:!!x.banned}))):s.sendStatus(403));
app.post("/admin/ban",(q,s)=>{const b=q.body||{};if(!adm(b.key))return s.sendStatus(403);
 const k=String(b.name||"").toLowerCase(),x=db.users[k];if(!x)return s.sendStatus(404);
 x.banned=!!b.ban;if(x.banned)for(const t in db.tokens)if(db.tokens[t]===k)delete db.tokens[t];save();s.json({ok:1})});
app.get("/img/:n",(q,s)=>/^[a-z]+\.jpg$/.test(q.params.n)?s.sendFile(__dirname+"/"+q.params.n):s.sendStatus(404));
const srv=http.createServer(app),io=new Server(srv);
const crypto=require("crypto"),fs=require("fs"),DB=(process.env.DATA_DIR||__dirname)+"/data.json";
let db={users:{},tokens:{}},dirty=false;try{db=JSON.parse(fs.readFileSync(DB,"utf8"))}catch(e){}
const save=()=>{dirty=true};
const SB=process.env.SUPABASE_URL,SK=process.env.SUPABASE_KEY,SH={apikey:SK,Authorization:"Bearer "+SK,"Content-Type":"application/json"};
async function sbLoad(){const r=await fetch(SB+"/rest/v1/kv?key=eq.db&select=value",{headers:SH});if(!r.ok)throw new Error("supabase load failed: "+r.status);const j=await r.json();if(j[0])db=j[0].value}
async function persist(){try{
 if(SB&&SK){const r=await fetch(SB+"/rest/v1/kv",{method:"POST",headers:{...SH,Prefer:"resolution=merge-duplicates"},body:JSON.stringify({key:"db",value:db})});if(!r.ok)dirty=true}
 else fs.writeFile(DB,JSON.stringify(db),()=>{})}catch(e){dirty=true}}
setInterval(()=>{if(dirty){dirty=false;persist()}},5000);
process.on("SIGTERM",async()=>{if(dirty)await persist();process.exit(0)});
const hash=(p,s)=>crypto.scryptSync(p,s,32).toString("hex");
const SHOP={f_gold:{t:"frame",n:"إطار ذهبي",c:150,v:"#d4a84b"},f_ruby:{t:"frame",n:"إطار ياقوتي",c:200,v:"#c2203b"},f_emerald:{t:"frame",n:"إطار زمردي",c:200,v:"#2fae6a"},f_night:{t:"frame",n:"إطار الليل",c:300,v:"#7a8cff"},n_gold:{t:"color",n:"اسم ذهبي",c:100,v:"#f1d38a"},n_red:{t:"color",n:"اسم أحمر",c:100,v:"#ff6b6b"},n_cyan:{t:"color",n:"اسم سماوي",c:100,v:"#6be3ff"}};
const prof=x=>({name:x.name,coins:x.coins,xp:x.xp,lv:Math.floor(x.xp/100)+1,wins:x.wins,games:x.games,items:x.items,eq:x.eq});
const urec=q=>q.user&&db.users[q.user];
const lvl=q=>{const x=urec(q);return x?Math.floor(x.xp/100)+1:0};
const cos=(q,t)=>{const x=urec(q),id=x&&x.eq&&x.eq[t];return id&&SHOP[id]?SHOP[id].v:null};
const BAD=["كلب","حمار","غبي","fuck","shit","bitch"];
const clean=t=>BAD.reduce((a,w)=>a.split(w).join("***"),t);
const rooms={},T={night:25000,talk:40000,vote:25000};
const ORDER=["mafia","doctor","detective","citizen","sniper","journalist","citizen","mafia","jailer","joker"];
const RN={mafia:"مافيا",doctor:"دكتور",detective:"محقق",citizen:"مواطن",sniper:"قناص",journalist:"صحفي",jailer:"سجّان",joker:"جوكر"};
const BOTN=["سامر","ليلى","أبو خالد","هدى","زياد","رنا","مالك","نور","كرم"];
const ACC=["بشك بـ{n}، تصرفاته غريبة.","{n} ساكت كثير، ليش؟","أنا رح أصوّت على {n}.","مين شاف شو عمل {n} الليلة؟"];
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const team=p=>p.role==="mafia"?"m":"c";
const alive=r=>r.players.filter(p=>p.alive);
const humans=r=>r.players.filter(p=>!p.bot);
function view(r,me){return{code:r.code,phase:r.phase,day:r.day,deadline:r.deadline,host:r.host===me.id,you:me.id,winner:r.winner,
 players:r.players.map(q=>({id:q.id,name:q.name,alive:q.alive,bot:!!q.bot,lv:lvl(q),fr:cos(q,"frame"),nc:cos(q,"color"),role:(r.phase==="over"||!q.alive||q===me||(me.role==="mafia"&&q.role==="mafia"))?q.role:null})),log:r.log.slice(-60),n:r.log.length,mlog:me.role==="mafia"?r.mlog.slice(-30):[],gain:me.gain||0}}
function push(r){humans(r).forEach(p=>io.to(p.id).emit("state",view(r,p)))}
function say(r,t,who){r.log.push({who:who||"",t})}
function note(p,t){if(!p.bot)io.to(p.id).emit("note",t)}
function setPhase(r,ph,ms,fn){clearTimeout(r.timer);r.phase=ph;r.deadline=Date.now()+ms;r.acts={};r.votes={};push(r);r.timer=setTimeout(fn,ms)}

function begin(r){
 while(r.players.length<6){const used=r.players.map(p=>p.name);r.players.push({id:"bot"+Math.random(),name:rnd(BOTN.filter(n=>!used.includes(n))),alive:true,bot:true})}
 const roles=shuf(ORDER.slice(0,r.players.length));
 r.players.forEach((p,i)=>{p.role=roles[i];p.shot=false;p.alive=true});
 r.susp={};r.jw=false;r.winner=null;r.day=0;r.mlog=[];r.rep={};r.players.forEach(p=>{p.gain=0;p.muted=false});night(r);
}
function night(r){r.day++;say(r,"بدأ الليل "+r.day+"... المدينة نايمة.");setPhase(r,"night",T.night,()=>dawn(r))}
function dawn(r){
 const al=alive(r),A=r.acts,by=ro=>al.filter(p=>p.role===ro),tgt=id=>al.find(p=>p.id===id),oth=x=>al.filter(p=>p!==x);
 const jl=by("jailer")[0];let jailed=null;
 if(jl)jailed=jl.bot?rnd(oth(jl)):tgt(A[jl.id]&&A[jl.id].t);
 if(jailed===jl)jailed=null;
 const ok=p=>p&&p!==jailed,kills=[];let save=null;
 const mf=by("mafia").filter(ok);
 if(mf.length){const h=mf.find(p=>{const t=!p.bot&&tgt(A[p.id]&&A[p.id].t);return t&&t.role!=="mafia"});
  kills.push(h?tgt(A[h.id].t):rnd(al.filter(p=>p.role!=="mafia")))}
 const dr=by("doctor")[0];if(ok(dr))save=dr.bot?rnd(al):tgt(A[dr.id]&&A[dr.id].t);
 const dt=by("detective")[0];
 if(ok(dt)&&!dt.bot){const t=tgt(A[dt.id]&&A[dt.id].t);if(t&&t!==dt)note(dt,t.name+(t.role==="mafia"?" من المافيا!":" مش من المافيا."))}
 const jn=by("journalist")[0];
 if(ok(jn)&&!jn.bot){const a=tgt(A[jn.id]&&A[jn.id].t),b=tgt(A[jn.id]&&A[jn.id].t2);
  if(a&&b&&a!==b&&a!==jn&&b!==jn)note(jn,a.name+" و"+b.name+(team(a)===team(b)?" بنفس الفريق.":" مش بنفس الفريق."))}
 const sn=by("sniper")[0];
 if(ok(sn)&&!sn.shot){let t=null;if(!sn.bot)t=tgt(A[sn.id]&&A[sn.id].t);else if(r.day>1&&Math.random()<.4)t=rnd(oth(sn));
  if(t&&t!==sn){sn.shot=true;kills.push(t)}}
 if(jailed)note(jailed,"انسجنت الليلة، قدرتك ممنوعة.");
 const dead=[];let saved=false;
 kills.forEach(k=>{if(k===save)saved=true;else if(k.alive){k.alive=false;dead.push(k)}});
 if(!dead.length)say(r,saved?"طلع الصباح... الدكتور أنقذ ضحية الليلة وما مات حدا!":"طلع الصباح، والليلة كانت هادية.");
 dead.forEach(k=>say(r,"طلع الصباح ولقوا "+k.name+" مقتول. كان "+RN[k.role]+"."));
 if(fin(r))return;
 setPhase(r,"talk",T.talk,()=>ballot(r));botTalk(r);
}
function botTalk(r){
 shuf(alive(r).filter(p=>p.bot)).slice(0,5).forEach((b,i)=>setTimeout(()=>{
  if(r.phase!=="talk"||!b.alive)return;
  const c=alive(r).filter(p=>p!==b&&(b.role!=="mafia"||p.role!=="mafia"));if(!c.length)return;
  const t=rnd(c);say(r,rnd(ACC).replace("{n}",t.name),b.name);r.susp[t.id]=(r.susp[t.id]||0)+1;push(r)},4000+i*5500));
}
function ballot(r){say(r,"وقت التصويت!");setPhase(r,"vote",T.vote,()=>tally(r))}
function tally(r){
 const al=alive(r),c={};
 al.forEach(v=>{let t;
  if(v.bot){const cand=al.filter(p=>p!==v&&!(v.role==="mafia"&&p.role==="mafia"));
   const w=cand.map(p=>1+(r.susp[p.id]||0));let x=Math.random()*w.reduce((a,b)=>a+b,0);t=cand.find((p,i)=>(x-=w[i])<=0)||cand[0]}
  else t=al.find(p=>p.id===r.votes[v.id]&&p!==v);
  if(t)c[t.id]=(c[t.id]||0)+1});
 const e=Object.entries(c).sort((a,b)=>b[1]-a[1]);
 if(!e.length||(e[1]&&e[0][1]===e[1][1]))say(r,"تعادل أو ما حدا صوّت، ما حدا انطرد.");
 else{const o=r.players.find(p=>p.id===e[0][0]);o.alive=false;say(r,o.name+" انطرد بـ"+e[0][1]+" أصوات. كان "+RN[o.role]+".");if(o.role==="joker")r.jw=true}
 if(fin(r))return;night(r);
}
function fin(r){
 const m=alive(r).filter(p=>p.role==="mafia").length,o=alive(r).length-m;
 const w=r.jw?"j":m===0?"c":m>=o?"m":null;if(!w)return false;
 clearTimeout(r.timer);r.winner=w;r.phase="over";r.deadline=0;reward(r,w);push(r);return true;
}
function reward(r,w){
 r.players.forEach(p=>{const us=!p.bot&&urec(p);if(!us)return;
  const won=w==="c"?(p.role!=="mafia"&&p.role!=="joker"):w==="m"?p.role==="mafia":p.role==="joker";
  const g=10+(won?25:0);us.games++;if(won)us.wins++;us.coins+=g;us.xp+=g;p.gain=g;io.to(p.id).emit("profile",prof(us))});
 save();
}
function drop(r){clearTimeout(r.timer);delete rooms[r.code]}

io.on("connection",s=>{
 let r=null,me=null,u=null,fails=0;
 s.on("join",d=>{
  if(r)return;d=d||{};if(u&&db.users[u]&&db.users[u].banned)return s.emit("err","هذا الحساب محظور.");const name=String(d.name||"لاعب").trim().slice(0,14)||"لاعب";
  if(d.room){r=rooms[String(d.room).toUpperCase()];
   if(!r||r.phase!=="lobby"){r=null;return s.emit("err","الغرفة مش موجودة أو اللعبة بدأت.")}}
  else{let c;do{c=Math.random().toString(36).slice(2,6).toUpperCase()}while(rooms[c]);
   r={code:c,players:[],phase:"lobby",day:0,log:[],host:s.id,susp:{},mlog:[],rep:{}};rooms[c]=r}
  if(humans(r).length>=10){r=null;return s.emit("err","الغرفة ممتلئة.")}
  me={id:s.id,name:u?db.users[u].name:clean(name),alive:true,user:u,cid:String(d.cid||"")};r.players.push(me);s.join(r.code);say(r,me.name+" دخل الغرفة.");push(r)});
 s.on("start",()=>{if(r&&r.host===s.id&&r.phase==="lobby")begin(r)});
 s.on("again",()=>{if(!r||r.host!==s.id||r.phase!=="over")return;
  r.players=humans(r);r.players.forEach(p=>{p.alive=true;p.role=undefined;p.gain=0});r.log=[];r.mlog=[];r.phase="lobby";r.day=0;push(r)});
 s.on("act",d=>{if(r&&me&&r.phase==="night"&&me.alive&&d&&typeof d==="object")r.acts[s.id]={t:String(d.t||""),t2:String(d.t2||"")}});
 s.on("vote",t=>{if(r&&me&&r.phase==="vote"&&me.alive)r.votes[s.id]=String(t)});
 s.on("chat",t=>{
  if(!r||!me)return;if(me.muted||Date.now()-(me.last||0)<800)return;me.last=Date.now();const v=clean(String(t||"").trim().slice(0,120));if(!v)return;
  if(!["lobby","talk","vote","over"].includes(r.phase)||(!me.alive&&r.phase!=="lobby"&&r.phase!=="over"))return;
  say(r,v,me.name);
  if(r.phase!=="lobby"&&r.phase!=="over")r.players.forEach(p=>{if(p.alive&&p!==me&&v.includes(p.name))r.susp[p.id]=(r.susp[p.id]||0)+2});
  push(r)});
 const tok=k=>{const t=crypto.randomBytes(16).toString("hex");db.tokens[t]=k;save();return t};
 const shopMsg=()=>u&&s.emit("shop",{items:SHOP,profile:prof(db.users[u])});
 s.on("auth",d=>{
  d=d||{};if(fails>8)return s.emit("err","محاولات كثيرة، جرّب لاحقاً.");
  const name=String(d.name||"").trim().slice(0,14),pw=String(d.pass||"").slice(0,40),k=name.toLowerCase();
  if(name.length<2||pw.length<4)return s.emit("err","الاسم حرفين على الأقل وكلمة السر 4 أحرف على الأقل.");
  if(d.mode==="register"){
   if(db.users[k]||clean(name)!==name)return s.emit("err","الاسم مستخدم أو غير مسموح.");
   const salt=crypto.randomBytes(8).toString("hex");
   db.users[k]={name,salt,hash:hash(pw,salt),coins:50,xp:0,wins:0,games:0,items:[],eq:{}};
  }else{const x=db.users[k];if(!x||x.hash!==hash(pw,x.salt)){fails++;return s.emit("err","اسم أو كلمة سر غلط.")}if(x.banned)return s.emit("err","هذا الحساب محظور.")}
  u=k;s.emit("authed",{token:tok(k),profile:prof(db.users[k])})});
 s.on("resume",t=>{const k=db.tokens[String(t)];if(k&&db.users[k]&&!db.users[k].banned){u=k;s.emit("authed",{token:String(t),profile:prof(db.users[k])})}else s.emit("authfail")});
 s.on("logout",t=>{delete db.tokens[String(t)];u=null;save()});
 s.on("shop",shopMsg);
 s.on("buy",id=>{const it=SHOP[id],us=u&&db.users[u];
  if(!it||!us||us.items.includes(id)||us.coins<it.c)return s.emit("err","ما بتقدر تشتري هالغرض.");
  us.coins-=it.c;us.items.push(id);save();shopMsg()});
 s.on("equip",d=>{const it=d&&SHOP[d.id],us=u&&db.users[u];if(!it||!us||!us.items.includes(d.id))return;
  us.eq[it.t]=us.eq[it.t]===d.id?null:d.id;save();shopMsg();if(r)push(r)});
 s.on("top",()=>s.emit("top",Object.values(db.users).sort((a,b)=>b.wins-a.wins||b.xp-a.xp).slice(0,10).map(x=>({name:x.name,wins:x.wins,lv:Math.floor(x.xp/100)+1}))));
 s.on("report",id=>{if(!r||!me||r.phase==="lobby")return;
  const t=r.players.find(p=>p.id===id&&!p.bot&&p!==me);if(!t)return;
  const l=r.rep[t.id]||(r.rep[t.id]=[]);if(l.includes(s.id))return;l.push(s.id);
  if(l.length>=3&&!t.muted){t.muted=true;say(r,t.name+" انكتم بسبب بلاغات اللاعبين.")}push(r)});
 s.on("mchat",t=>{if(!r||!me||!me.alive||me.role!=="mafia"||me.muted||r.phase==="lobby"||r.phase==="over")return;
  if(Date.now()-(me.mlast||0)<800)return;me.mlast=Date.now();
  const v=clean(String(t||"").trim().slice(0,120));if(v){r.mlog.push({who:me.name,t:v});push(r)}});
 s.on("rejoin",cid=>{if(r||!cid)return;cid=String(cid);
  for(const k in rooms){const q=rooms[k],p=q.players.find(x=>x.cid===cid&&x.left);
   if(p){r=q;me=p;if(q.host===p.id)q.host=s.id;p.id=s.id;p.bot=false;p.left=false;s.join(q.code);say(q,p.name+" رجع للعبة.");push(q);return}}});
 s.on("rtc",d=>{if(!r||!me||!d||typeof d.to!=="string")return;
  const t=r.players.find(p=>p.id===d.to&&!p.bot);if(t)io.to(t.id).emit("rtc",{from:s.id,data:d.data})});
 s.on("disconnect",()=>{
  if(!r||!me)return;
  if(r.phase==="lobby"||r.phase==="over"){r.players=r.players.filter(p=>p!==me)}else{me.bot=true;me.left=true}
  if(!humans(r).length)return drop(r);
  if(r.host===s.id)r.host=humans(r)[0].id;
  say(r,me.name+" خرج.");push(r)});
});
(async()=>{
 if(SB&&SK){try{await sbLoad();console.log("storage: supabase")}catch(e){console.log(e.message);process.exit(1)}}
 srv.listen(process.env.PORT||3000,()=>console.log("Mafia server on",process.env.PORT||3000));
})();
