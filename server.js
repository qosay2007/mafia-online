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
const adm=k=>{k=String(k||"");if(process.env.ADMIN_KEY&&process.env.ADMIN_KEY.length>=8&&k===process.env.ADMIN_KEY)return true;const u=db.users[db.tokens[k]];return !!(u&&u.admin&&!u.banned)};
const tries={};const limited=ip=>{const n=Date.now(),a=(tries[ip]||[]).filter(t=>n-t<6e5);a.push(n);tries[ip]=a;return a.length>10};
if(app.set)app.set("trust proxy",1);
app.post("/admin/login",(q,s)=>{if(limited(q.ip))return s.sendStatus(429);const b=q.body||{},k=String(b.name||"").toLowerCase(),x=db.users[k];
 if(!x||!x.admin||x.banned||x.hash!==hash(String(b.pass||"").slice(0,40),x.salt))return s.sendStatus(403);
 const t=crypto.randomBytes(16).toString("hex");db.tokens[t]=k;save();s.json({key:t})});
app.get("/admin",(q,s)=>s.send(PAGE("إدارة",`<h1>إدارة مافيا</h1><div><input id="an" placeholder="اسم الأدمن"><input id="ap" type="password" placeholder="كلمة السر"><button id="al">دخول</button></div><div><input id="k" type="password" placeholder="أو مفتاح الإدارة"><button id="ld">عرض اللاعبين</button></div><div id="o"></div>
<script>
var K="";function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function load(){if(!K)K=document.getElementById("k").value;fetch("/admin/users?key="+encodeURIComponent(K)).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(l){
document.getElementById("o").innerHTML="<table><tr><th>الاسم</th><th>م</th><th>فوز</th><th>عملات</th><th></th></tr>"+l.map(function(u){return"<tr><td>"+esc(u.name)+(u.banned?" (محظور)":"")+"</td><td>"+(Math.floor(u.xp/100)+1)+"</td><td>"+u.wins+"</td><td>"+u.coins+"</td><td><button data-n=\""+esc(u.name)+"\" data-b=\""+(u.banned?0:1)+"\">"+(u.banned?"فك الحظر":"حظر")+"</button> <button data-n=\"" +esc(u.name)+"\" data-r=\"1\">كلمة سر جديدة</button></td></tr>"}).join("")+"</table>"}).catch(function(){document.getElementById("o").textContent="مفتاح غلط أو الإدارة غير مفعّلة."})}
document.getElementById("ld").onclick=function(){K="";load()};
document.getElementById("al").onclick=function(){fetch("/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:document.getElementById("an").value,pass:document.getElementById("ap").value})}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){K=j.key;load()}).catch(function(){document.getElementById("o").textContent="اسم أو كلمة سر غلط."})};
document.getElementById("o").onclick=function(e){var b=e.target.closest("button");if(!b)return;if(b.dataset.r){fetch("/admin/reset",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:K,name:b.dataset.n})}).then(function(r){return r.json()}).then(function(j){alert("كلمة السر الجديدة لـ "+b.dataset.n+": "+j.pass)});return}fetch("/admin/ban",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:K,name:b.dataset.n,ban:b.dataset.b==="1"})}).then(load)};
</script>`)));
app.get("/admin/stats",(q,s)=>adm(q.query.key)?s.json({users:Object.keys(db.users).length,online:io.engine?io.engine.clientsCount:0,rooms:Object.keys(rooms).length,activeToday:Object.values(db.users).filter(x=>x.ld===day()).length}):s.sendStatus(403));
app.get("/admin/users",(q,s)=>adm(q.query.key)?s.json(Object.values(db.users).map(x=>({name:x.name,xp:x.xp,wins:x.wins,coins:x.coins,banned:!!x.banned}))):s.sendStatus(403));
app.post("/admin/reset",(q,s)=>{const b=q.body||{};if(!adm(b.key))return s.sendStatus(403);
 const k=String(b.name||"").toLowerCase(),x=db.users[k];if(!x)return s.sendStatus(404);
 const p=crypto.randomBytes(5).toString("hex");x.salt=crypto.randomBytes(8).toString("hex");x.hash=hash(p,x.salt);
 for(const t in db.tokens)if(db.tokens[t]===k)delete db.tokens[t];save();s.json({pass:p})});
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
const SHOP={f_gold:{t:"frame",n:"إطار ذهبي",c:150,v:"#d4a84b"},f_ruby:{t:"frame",n:"إطار ياقوتي",c:200,v:"#c2203b"},f_emerald:{t:"frame",n:"إطار زمردي",c:200,v:"#2fae6a"},f_night:{t:"frame",n:"إطار الليل",c:300,v:"#7a8cff"},n_gold:{t:"color",n:"اسم ذهبي",c:100,v:"#f1d38a"},n_red:{t:"color",n:"اسم أحمر",c:100,v:"#ff6b6b"},n_cyan:{t:"color",n:"اسم سماوي",c:100,v:"#6be3ff"},f_crescent:{t:"frame",n:"إطار الهلال",c:250,v:"#e8d9a0"},f_lantern:{t:"frame",n:"إطار الفانوس",c:250,v:"#ff9f43"},n_green:{t:"color",n:"اسم أخضر",c:100,v:"#7be07b"},n_purple:{t:"color",n:"اسم بنفسجي",c:100,v:"#c792ff"}};
const day=()=>new Date().toISOString().slice(0,10),wk=()=>Math.floor(Date.now()/6048e5);
const dmof=x=>{const d=day();if(!x.dm||x.dm.d!==d)x.dm={d,g:0,w:0,c1:false,c2:false};return x.dm};
const prof=x=>({name:x.name,coins:x.coins,xp:x.xp,lv:Math.floor(x.xp/100)+1,wins:x.wins,games:x.games,items:x.items,eq:x.eq,av:x.av||null,rs:x.rs||{},ref:x.ref||null,dr:{can:x.ld!==day(),st:x.st||0},dm:dmof(x)});
const sus=(r,id,n)=>{r.susp[id]=(r.susp[id]||0)+n};
const urec=q=>q.user&&db.users[q.user];
const lvl=q=>{const x=urec(q);return x?Math.floor(x.xp/100)+1:0};
const cos=(q,t)=>{const x=urec(q),id=x&&x.eq&&x.eq[t];return id&&SHOP[id]?SHOP[id].v:null};
const BAD=["كلب","حمار","غبي","fuck","shit","bitch"];
const clean=t=>BAD.reduce((a,w)=>a.split(w).join("***"),t);
const rooms={},T={night:25000,talk:40000,vote:25000};
const ORDER=["mafia","doctor","detective","citizen","sniper","journalist","citizen","mafia","jailer","joker","lawyer","mayor"];
const RN={mafia:"مافيا",doctor:"دكتور",detective:"محقق",citizen:"مواطن",sniper:"قناص",journalist:"صحفي",jailer:"سجّان",joker:"جوكر",lawyer:"محامي",mayor:"رئيس البلدية"};
const AV8=["mafia","citizen","doctor","detective","sniper","joker","journalist","jailer"];
const LAST=["خلّوا بالكم، أنا كنت بريء!","الله يسامحكم... دوّروا عالمافيا.","وداعاً، لا تضيّعوا الفرصة."];
const tm=r=>r.set&&r.set.mode==="fast"?.5:1;
const BOTN=["سامر","ليلى","أبو خالد","هدى","زياد","رنا","مالك","نور","كرم","يوسف","دانة","طارق","لمى","عمر"];

const rnd=a=>a[Math.floor(Math.random()*a.length)];
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const team=p=>p.role==="mafia"?"m":"c";
const alive=r=>r.players.filter(p=>p.alive);
const humans=r=>r.players.filter(p=>!p.bot);
function view(r,me){return{code:r.code,phase:r.phase,day:r.day,deadline:r.deadline,host:r.host===me.id,you:me.id,winner:r.winner,
 players:r.players.map(q=>({id:q.id,name:q.name,alive:q.alive,bot:!!q.bot,av:(urec(q)&&urec(q).av)||null,lv:lvl(q),fr:cos(q,"frame"),nc:cos(q,"color"),role:(r.phase==="over"||!q.alive||q===me||(me.role==="mafia"&&q.role==="mafia"))?q.role:null})),log:r.log.slice(-60),n:r.log.length,set:r.set,sum:r.phase==="over"?r.sum:undefined,mlog:me.role==="mafia"?r.mlog.slice(-30):[],gain:me.gain||0}}
function push(r){humans(r).forEach(p=>io.to(p.id).emit("state",view(r,p)))}
function say(r,t,who){r.log.push({who:who||"",t});if(!who&&r.sum)r.sum.push(t)}
function note(p,t){if(!p.bot)io.to(p.id).emit("note",t)}
function setPhase(r,ph,ms,fn){clearTimeout(r.timer);r.phase=ph;r.deadline=Date.now()+ms;r.acts={};r.votes={};push(r);r.timer=setTimeout(fn,ms)}

function begin(r){
 while(r.players.length<Math.min(12,Math.max(r.set.size,r.players.length))){const used=r.players.map(p=>p.name);r.players.push({id:"bot"+Math.random(),name:rnd(BOTN.filter(n=>!used.includes(n))),alive:true,bot:true})}
 const roles=shuf(ORDER.slice(0,r.players.length));
 r.players.forEach((p,i)=>{p.role=roles[i];p.shot=false;p.alive=true});
 r.susp={};r.jw=false;r.winner=null;r.day=0;r.mlog=[];r.rep={};r.acc=null;r.claims={};r.sum=[];r.imm=null;r.last=null;r.players.forEach(p=>{p.gain=0;p.muted=false;p.lastw=false;p.pi=Math.floor(Math.random()*3)});night(r);
}
function night(r){r.players.forEach(p=>p.lastw=false);r.day++;say(r,"بدأ الليل "+r.day+"... المدينة نايمة.");setPhase(r,"night",T.night*tm(r),()=>dawn(r))}
function dawn(r){
 const al=alive(r),A=r.acts,by=ro=>al.filter(p=>p.role===ro),tgt=id=>al.find(p=>p.id===id),oth=x=>al.filter(p=>p!==x);
 const jl=by("jailer")[0];let jailed=null;
 if(jl)jailed=jl.bot?rnd(oth(jl)):tgt(A[jl.id]&&A[jl.id].t);
 if(jailed===jl)jailed=null;
 const ok=p=>p&&p!==jailed,kills=[];let save=null,mT=null,sT=null,lT=null;
 const mf=by("mafia").filter(ok);
 if(mf.length){const h=mf.find(p=>{const t=!p.bot&&tgt(A[p.id]&&A[p.id].t);return t&&t.role!=="mafia"});
  mT=h?tgt(A[h.id].t):rnd(al.filter(p=>p.role!=="mafia"));kills.push(mT)}
 const dr=by("doctor")[0];if(ok(dr))save=dr.bot?rnd(al):tgt(A[dr.id]&&A[dr.id].t);
 const dt=by("detective")[0];
 if(ok(dt)&&!dt.bot){const t=tgt(A[dt.id]&&A[dt.id].t);if(t&&t!==dt)note(dt,t.name+(t.role==="mafia"?" من المافيا!":" مش من المافيا."))}
 const jn=by("journalist")[0];
 if(ok(jn)&&!jn.bot){const a=tgt(A[jn.id]&&A[jn.id].t),b=tgt(A[jn.id]&&A[jn.id].t2);
  if(a&&b&&a!==b&&a!==jn&&b!==jn)note(jn,a.name+" و"+b.name+(team(a)===team(b)?" بنفس الفريق.":" مش بنفس الفريق."))}
 const sn=by("sniper")[0];
 if(ok(sn)&&!sn.shot){let t=null;if(!sn.bot)t=tgt(A[sn.id]&&A[sn.id].t);else if(r.day>1&&Math.random()<.4)t=rnd(oth(sn));
  if(t&&t!==sn){sn.shot=true;sT=t;kills.push(t)}}
 const lw=by("lawyer")[0];r.imm=null;
 if(ok(lw)){const t=lw.bot?rnd(oth(lw)):tgt(A[lw.id]&&A[lw.id].t);if(t&&t!==lw){r.imm=t.id;lT=t}}
 if(jailed)note(jailed,"انسجنت الليلة، قدرتك ممنوعة.");
 if(r.sum){const P=[];if(mT)P.push("المافيا استهدفت "+mT.name);if(save)P.push("الدكتور حمى "+save.name);if(jailed)P.push("السجّان سجن "+jailed.name);if(sT)P.push("القناص أطلق على "+sT.name);if(lT)P.push("المحامي حمى "+lT.name);r.sum.push("🌙 الليلة "+r.day+": "+(P.join("، ")||"ما صار شي"))}
 const dead=[];let saved=false;
 kills.forEach(k=>{if(k===save)saved=true;else if(k.alive){k.alive=false;dead.push(k)}});
 if(!dead.length)say(r,saved?"طلع الصباح... الدكتور أنقذ ضحية الليلة وما مات حدا!":"طلع الصباح، والليلة كانت هادية.");
 dead.forEach(k=>say(r,"طلع الصباح ولقوا "+k.name+" مقتول. كان "+RN[k.role]+"."));
 if(fin(r))return;
 setPhase(r,"talk",T.talk*tm(r),()=>ballot(r));botTalk(r,dead);
}
const ACC=[["مش متأكد بس {n} تصرفاته بتخوّف.","خلّونا نراقب {n}، في شي مش مريح.","ما بحب أتهم بدون دليل، بس {n} غريب."],
 ["{n} هو المافيا والله! واضح!","بكفّي لف ودوران، صوّتوا على {n}!","أنا متأكد إنه {n} بيكذب علينا."],
 ["شو رأيكم بـ{n}؟ حسيته ساكت زيادة.","لاحظت إنه {n} ما حكى كثير.","ممكن نفكر بـ{n}؟"]];
const DEF=["أنا؟ لا والله مش أنا!","ليش بتتهموني؟ دوّروا عند غيري.","أنا مواطن وبحلف، لا تظلموني.","طيب شو الدليل عليّ؟"];
const AGR=["معك، {n} فعلاً مشبوه.","كمان أنا حاسس بنفس الشي عن {n}.","صح، {n} لازم نركّز عليه."];
const DIS=["لا ما بظن {n} هيك، لسا بدري.","ظلمتوا {n}، ما في دليل.","استنوا شوي، {n} مش واضح عليه."];
const DEAD=["الله يرحمه {n}... مين عملها؟","فقدنا {n}، لازم نكون حذرين.","{n} كان بريء أكيد، لازم نلاقي المافيا."];
const QUIET=["خلّونا نسمع من الكل.","مين ما حكى لسا؟","أنا بسمع وبراقب."];
const REPLY=["كلامك منطقي.","ما فهمت قصدك، وضّح أكتر.","طيب وإنت مين بتشك فيه؟","ممكن، خلّينا نشوف مين بيدافع زيادة."];
const VOTE=["أنا مصوّت على {n}.","صوتي لـ{n}، آسف.","بصوّت على {n}، حاسس فيه شي."];
function pickT(r,b){const c=alive(r).filter(p=>p!==b&&!(b.role==="mafia"&&p.role==="mafia"));if(!c.length)return null;
 const hd=r.set&&r.set.diff==="hard"?2:1,w=c.map(p=>1+(r.susp[p.id]||0)*hd);let x=Math.random()*w.reduce((a,v)=>a+v,0);return c.find((p,i)=>(x-=w[i])<=0)||c[0]}
function botSpeak(r,b){
 if(r.phase!=="talk"||!b.alive)return;
 const al=alive(r),x=Math.random(),mates=b.role==="mafia"?al.filter(p=>p!==b&&p.role==="mafia"):[];
 if((r.susp[b.id]||0)>=2&&x<.6){say(r,rnd(DEF),b.name);sus(r,b.id,-1)}
 else if(r.acc&&r.acc.t!==b.id&&r.acc.by!==b.id&&x<.5){
  const tg=r.players.find(p=>p.id===r.acc.t);
  if(tg&&tg.alive){
   if(mates.includes(tg)||Math.random()<.35)say(r,rnd(DIS).replace("{n}",tg.name),b.name);
   else{say(r,rnd(AGR).replace("{n}",tg.name),b.name);sus(r,tg.id,1)}}}
 else if(x<.72&&!r.claims[b.id]&&["detective","doctor","mafia"].includes(b.role)){
  const cr=b.role==="mafia"?rnd(["detective","doctor"]):b.role;r.claims[b.id]=cr;
  say(r,"أنا "+RN[cr]+"! صدّقوني، وعندي معلومات.",b.name);
  const o=Object.keys(r.claims).find(id=>id!==b.id&&r.claims[id]===cr&&alive(r).some(p=>p.id===id));
  if(o){sus(r,b.id,2);sus(r,o,2);setTimeout(()=>{if(r.phase==="talk"){const q=rnd(alive(r).filter(p=>p.bot&&p!==b));if(q){say(r,"في اتنين بيدّعوا إنهم "+RN[cr]+"، واحد منهم كذاب!",q.name);push(r)}}},2500)}}
 else if(x<.88){const t=pickT(r,b);
  if(t){say(r,rnd(ACC[b.pi||0]).replace("{n}",t.name),b.name);sus(r,t.id,1);r.acc={by:b.id,t:t.id};
   if(t.bot&&Math.random()<.7)setTimeout(()=>{if(r.phase==="talk"&&t.alive){say(r,rnd(DEF),t.name);push(r)}},2000+Math.random()*2000)}}
 else say(r,rnd(QUIET),b.name);
 push(r)}
function botTalk(r,dead){
 const bots=()=>alive(r).filter(p=>p.bot),total=7+Math.floor(Math.random()*4);let i=0;
 if(dead&&dead.length)setTimeout(()=>{const b=bots();if(r.phase==="talk"&&b.length){say(r,rnd(DEAD).replace("{n}",dead[0].name),rnd(b).name);push(r)}},2500);
 const tick=()=>{if(r.phase!=="talk")return;const b=bots();if(b.length&&i++<total)botSpeak(r,rnd(b));if(i<total)r.tt=setTimeout(tick,3000+Math.random()*3500)};
 r.tt=setTimeout(tick,5000);
}
function ballot(r){clearTimeout(r.tt);say(r,"وقت التصويت!");setPhase(r,"vote",T.vote*tm(r),()=>tally(r));
 alive(r).filter(p=>p.bot).forEach((b,i)=>{const t=pickT(r,b);b.vt=t?t.id:null;
  if(t&&Math.random()<.7)setTimeout(()=>{if(r.phase==="vote"&&b.alive){say(r,rnd(VOTE).replace("{n}",t.name),b.name);push(r)}},2500+i*1700+Math.random()*1200)})}
function tally(r){
 const al=alive(r),c={};
 al.forEach(v=>{let t;
  if(v.bot){t=al.find(p=>p.id===v.vt&&p!==v)||pickT(r,v)}
  else t=al.find(p=>p.id===r.votes[v.id]&&p!==v);
  if(t)c[t.id]=(c[t.id]||0)+(v.role==="mayor"?2:1)});
 const e=Object.entries(c).sort((a,b)=>b[1]-a[1]);
 if(!e.length||(e[1]&&e[0][1]===e[1][1]))say(r,"تعادل أو ما حدا صوّت، ما حدا انطرد.");
 else{const o=r.players.find(p=>p.id===e[0][0]);
  if(o.id===r.imm){say(r,"المحاكمة انتهت بدون طرد.")}
  else{o.alive=false;say(r,o.name+" انطرد بـ"+e[0][1]+" أصوات. كان "+RN[o.role]+".");if(o.role==="joker")r.jw=true;r.last=o}}
 if(r.sum&&e.length)r.sum.push("🗳 التصويت: "+e.map(([id,n])=>(r.players.find(p=>p.id===id)||{}).name+" "+n).join("، "));
 if(fin(r))return;
 const L=r.last;r.last=null;
 if(L){if(L.bot)say(r,rnd(LAST),L.name);else{L.lastw=true;say(r,L.name+" عنده كلمة أخيرة...");return setPhase(r,"last",9000*tm(r),()=>night(r))}}
 night(r);
}
function fin(r){
 const m=alive(r).filter(p=>p.role==="mafia").length,o=alive(r).length-m;
 const w=r.jw?"j":m===0?"c":m>=o?"m":null;if(!w)return false;
 clearTimeout(r.timer);r.winner=w;r.phase="over";r.deadline=0;reward(r,w);push(r);return true;
}
function reward(r,w){
 r.players.forEach(p=>{const us=!p.bot&&urec(p);if(!us)return;
  const won=w==="c"?(p.role!=="mafia"&&p.role!=="joker"):w==="m"?p.role==="mafia":p.role==="joker";
  const g=10+(won?25:0);us.games++;if(won)us.wins++;us.coins+=g;us.xp+=g;const rs=us.rs||(us.rs={}),q=rs[p.role]||(rs[p.role]={g:0,w:0});q.g++;if(won)q.w++;
  if(us.games===1&&us.ref&&db.users[us.ref]&&!us.refd){us.refd=1;us.coins+=50;db.users[us.ref].coins+=50}
  const m=dmof(us);m.g++;if(won){m.w++;const k=wk();if(!us.wk||us.wk.k!==k)us.wk={k,w:0};us.wk.w++}p.gain=g;io.to(p.id).emit("profile",prof(us))});
 save();
}
function drop(r){clearTimeout(r.timer);delete rooms[r.code]}

io.on("connection",s=>{
 let r=null,me=null,u=null,fails=0;
 const doJoin=d=>{
  if(r)return;d=d||{};if(u&&db.users[u]&&db.users[u].banned)return s.emit("err","هذا الحساب محظور.");const name=String(d.name||"لاعب").trim().slice(0,14)||"لاعب";
  if(d.room){r=rooms[String(d.room).toUpperCase()];
   if(!r||r.phase!=="lobby"){r=null;return s.emit("err","الغرفة مش موجودة أو اللعبة بدأت.")}}
  else{let c;do{c=Math.random().toString(36).slice(2,6).toUpperCase()}while(rooms[c]);
   r={code:c,players:[],phase:"lobby",day:0,log:[],host:s.id,susp:{},mlog:[],rep:{},pub:!!d.pub,set:{mode:"normal",diff:"easy",size:8}};rooms[c]=r}
  if(humans(r).length>=10){r=null;return s.emit("err","الغرفة ممتلئة.")}
  me={id:s.id,name:u?db.users[u].name:clean(name),alive:true,user:u,cid:String(d.cid||"")};r.players.push(me);s.join(r.code);say(r,me.name+" دخل الغرفة.");push(r)};
 s.on("join",doJoin);
 s.on("quick",d=>{if(r)return;d=d||{};const q=Object.values(rooms).find(x=>x.pub&&x.phase==="lobby"&&humans(x).length<10);doJoin({name:d.name,cid:d.cid,room:q&&q.code,pub:true})});
 s.on("rooms",()=>s.emit("rooms",Object.values(rooms).filter(q=>q.pub).slice(0,30).map(q=>({code:q.code,n:humans(q).length,size:q.set.size,phase:q.phase,mode:q.set.mode,host:(q.players.find(p=>p.id===q.host)||{}).name||""}))));
 s.on("leave",()=>{if(!r||!me)return;const q=r,m=me;r=null;me=null;s.leave(q.code);
  if(q.phase==="lobby"||q.phase==="over")q.players=q.players.filter(p=>p!==m);else{m.bot=true;m.left=true;m.cid=""}
  if(!humans(q).length)drop(q);else{if(q.host===s.id)q.host=humans(q)[0].id;say(q,m.name+" خرج.");push(q)}
  s.emit("left")});
 s.on("daily",()=>{const us=u&&db.users[u];if(!us||us.ld===day())return;
  const y=new Date(Date.now()-864e5).toISOString().slice(0,10);us.st=us.ld===y?(us.st||0)+1:1;us.ld=day();
  const g=20+5*Math.min(us.st,7);us.coins+=g;save();s.emit("profile",prof(us));s.emit("msg","استلمت "+g+" عملة! سلسلة أيام: "+us.st)});
 s.on("claim",n=>{const us=u&&db.users[u];if(!us)return;const m=dmof(us);
  if(n===1&&!m.c1&&m.g>=3){m.c1=true;us.coins+=25}else if(n===2&&!m.c2&&m.w>=1){m.c2=true;us.coins+=40}else return;
  save();s.emit("profile",prof(us))});
 s.on("avatar",id=>{const us=u&&db.users[u];if(us&&AV8.includes(id)){us.av=id;save();s.emit("profile",prof(us));if(r)push(r)}});
 s.on("start",()=>{if(r&&r.host===s.id&&r.phase==="lobby")begin(r)});
 s.on("again",()=>{if(!r||r.host!==s.id||r.phase!=="over")return;
  r.players=humans(r);r.players.forEach(p=>{p.alive=true;p.role=undefined;p.gain=0});r.log=[];r.mlog=[];r.sum=undefined;r.phase="lobby";r.day=0;push(r)});
 s.on("act",d=>{if(r&&me&&r.phase==="night"&&me.alive&&d&&typeof d==="object")r.acts[s.id]={t:String(d.t||""),t2:String(d.t2||"")}});
 s.on("vote",t=>{if(r&&me&&r.phase==="vote"&&me.alive)r.votes[s.id]=String(t)});
 s.on("chat",t=>{
  if(!r||!me)return;if(me.muted||Date.now()-(me.last||0)<800)return;me.last=Date.now();const v=clean(String(t||"").trim().slice(0,120));if(!v)return;
  if(r.phase==="last"){if(!me.lastw)return}else if(!["lobby","talk","vote","over"].includes(r.phase)||(!me.alive&&r.phase!=="lobby"&&r.phase!=="over"))return;
  say(r,v,me.name);
  if(r.phase==="talk"||r.phase==="vote"){const hit=r.players.filter(p=>p.alive&&p!==me&&v.includes(p.name));
   hit.forEach(p=>{sus(r,p.id,2);r.acc={by:me.id,t:p.id};if(p.bot)setTimeout(()=>{if(p.alive&&(r.phase==="talk"||r.phase==="vote")){say(r,rnd(DEF),p.name);push(r)}},1200+Math.random()*1200)});
   const bs=alive(r).filter(p=>p.bot&&!hit.includes(p));
   if(bs.length&&Math.random()<.6)setTimeout(()=>{const b=rnd(bs);if(b.alive&&(r.phase==="talk"||r.phase==="vote")){say(r,hit.length?rnd(AGR).replace("{n}",hit[0].name):rnd(REPLY),b.name);if(hit.length)sus(r,hit[0].id,1);push(r)}},2200+Math.random()*2500)}
  push(r)});
 const tok=k=>{const t=crypto.randomBytes(16).toString("hex");db.tokens[t]=k;save();return t};
 const shopMsg=()=>u&&s.emit("shop",{items:SHOP,profile:prof(db.users[u])});
 s.on("auth",d=>{
  d=d||{};if(fails>8)return s.emit("err","محاولات كثيرة، جرّب لاحقاً.");
  const name=String(d.name||"").trim().slice(0,14),pw=String(d.pass||"").slice(0,40),k=name.toLowerCase();
  if(name.length<2||pw.length<4)return s.emit("err","الاسم حرفين على الأقل وكلمة السر 4 أحرف على الأقل.");
  if(d.mode==="register"&&!d.terms)return s.emit("err","لازم توافق على الشروط وسياسة الخصوصية.");
  if(d.mode==="register"){
   if(db.users[k]||clean(name)!==name)return s.emit("err","الاسم مستخدم أو غير مسموح.");
   const salt=crypto.randomBytes(8).toString("hex");
   db.users[k]={name,salt,hash:hash(pw,salt),coins:50,xp:0,wins:0,games:0,items:[],eq:{},email:(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.email||"").trim())?String(d.email).trim().slice(0,120):null),ref:(()=>{const rk=String(d.ref||"").trim().toLowerCase();return rk&&rk!==k&&db.users[rk]?rk:null})()};
  }else{const x=db.users[k];if(!x||x.hash!==hash(pw,x.salt)){fails++;return s.emit("err","اسم أو كلمة سر غلط.")}if(x.banned)return s.emit("err","هذا الحساب محظور.")}
  u=k;s.emit("authed",{token:tok(k),profile:prof(db.users[k])})});
 s.on("resume",t=>{const k=db.tokens[String(t)];if(k&&db.users[k]&&!db.users[k].banned){u=k;s.emit("authed",{token:String(t),profile:prof(db.users[k])})}else s.emit("authfail")});
 s.on("chpw",d=>{const us=u&&db.users[u];if(!us||!d)return;const o=String(d.old||"").slice(0,40),n=String(d.new||"").slice(0,40);
  if(us.hash!==hash(o,us.salt))return s.emit("err","كلمة السر الحالية غلط.");
  if(n.length<4)return s.emit("err","كلمة السر الجديدة 4 أحرف على الأقل.");
  us.salt=crypto.randomBytes(8).toString("hex");us.hash=hash(n,us.salt);save();s.emit("msg","تم تغيير كلمة السر.")});
 s.on("logout",t=>{delete db.tokens[String(t)];u=null;save()});
 s.on("shop",shopMsg);
 s.on("buy",id=>{const it=SHOP[id],us=u&&db.users[u];
  if(!it||!us||us.items.includes(id)||us.coins<it.c)return s.emit("err","ما بتقدر تشتري هالغرض.");
  us.coins-=it.c;us.items.push(id);save();shopMsg()});
 s.on("equip",d=>{const it=d&&SHOP[d.id],us=u&&db.users[u];if(!it||!us||!us.items.includes(d.id))return;
  us.eq[it.t]=us.eq[it.t]===d.id?null:d.id;save();shopMsg();if(r)push(r)});
 s.on("top",d=>{const w=d==="week",k=wk();
  const l=Object.values(db.users).map(x=>({name:x.name,wins:w?((x.wk&&x.wk.k===k)?x.wk.w:0):x.wins,xp:x.xp,lv:Math.floor(x.xp/100)+1})).filter(x=>x.wins>0).sort((a,b)=>b.wins-a.wins||b.xp-a.xp).slice(0,10).map(x=>({name:x.name,wins:x.wins,lv:x.lv}));
  s.emit("top",{w,l})});
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
 s.on("settings",d=>{if(!r||r.host!==s.id||r.phase!=="lobby"||!d)return;
  if(["normal","fast"].includes(d.mode))r.set.mode=d.mode;if(["easy","hard"].includes(d.diff))r.set.diff=d.diff;
  const z=+d.size;if(z>=6&&z<=12)r.set.size=z;push(r)});
 s.on("rtc",d=>{if(!r||!me||!d||typeof d.to!=="string")return;
  const t=r.players.find(p=>p.id===d.to&&!p.bot);if(t)io.to(t.id).emit("rtc",{from:s.id,data:d.data})});
 s.on("disconnect",()=>{
  if(!r||!me)return;
  if(r.phase==="lobby"||r.phase==="over"){r.players=r.players.filter(p=>p!==me)}else{me.bot=true;me.left=true}
  if(!humans(r).length)return drop(r);
  if(r.host===s.id)r.host=humans(r)[0].id;
  say(r,me.name+" خرج.");push(r)});
});
function seedAdmin(){const n=String(process.env.ADMIN_USER||"").trim(),p=process.env.ADMIN_PASS;if(!n||!p)return;
 const k=n.toLowerCase();let x=db.users[k];
 if(!x){const salt=crypto.randomBytes(8).toString("hex");x=db.users[k]={name:n,salt,hash:hash(p,salt),coins:50,xp:0,wins:0,games:0,items:[],eq:{}}}
 else if(x.hash!==hash(p,x.salt)){x.salt=crypto.randomBytes(8).toString("hex");x.hash=hash(p,x.salt)}
 x.admin=true;x.banned=false;save();console.log("admin account ready:",n)}
(async()=>{
 if(SB&&SK){try{await sbLoad();console.log("storage: supabase")}catch(e){console.log(e.message);process.exit(1)}}
 seedAdmin();
 srv.listen(process.env.PORT||3000,()=>console.log("Mafia server on",process.env.PORT||3000));
})();
