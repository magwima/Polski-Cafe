const {G,V,D}=DATA;
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const P=["ja","ty","on / ona","my","wy","oni / one"], PE=["I","you","he / she","we","you (plural)","they"];
const EXT=typeof chrome!=="undefined"&&!!(chrome.runtime&&chrome.runtime.id);
const POPUP=new URLSearchParams(location.search).has("popup");
if(POPUP)document.body.classList.add("popup");
const TOOLKIT="https://claude.ai/artifact/MDwqHkUMucCsiEa1zgJf1T";
const TK={u01:["cases","Why endings change"],u02:["cases","Why endings change"],u03:["cases","Why endings change"],u09:["l3","Sentence patterns"],u10:["cases","Why endings change"],
 u04:["qr","Quick reference: numbers"],u05:["l3","Common adjectives"],u06:["l3","Building sentences"],u07:["l8","Mini-conversations"],u08:["swoj","swój — the one rule"],
 u11:["aspect","“Doing” vs “done” verbs"],u12:["aspect","“Doing” vs “done” verbs"],u13:["l7","The small pronouns"],u14:["l7","The small pronouns"],u15:["l5","The future"],
 u16:["l3","Connectors"],u17:["aspect","“Doing” vs “done” verbs"],u18:["qr","Quick reference: numbers"],u19:["l5","The future"],u20:["l3","Connectors"],u21:["l4","The past tense"],u22:["cases","Why endings change"]};

/* ---------- levels ---------- */
const LV={
 b:{key:"b",name:"Beginner",sprout:"🌱",short:"Short sentences, present tense",lives:5,min:1,max:4,decoys:1,past:[0,1,2,3,4,5],tenses:["present"],opts:3,fopts:3,gopts:3,typedGaps:false,typedWords:false,accents:false,timer:0,hint:true,xp:10,prev:null,
    info:"Short everyday sentences in the present tense, plus textbook lessons 1, 2, 3, 9 and 10. 5 lives and a hint on every question."},
 i:{key:"i",name:"Intermediate",sprout:"🌿",short:"Past tense, longer sentences",lives:3,min:3,max:6,decoys:3,past:[0,1,2,3,4,5],tenses:["present","past"],opts:3,fopts:4,gopts:4,typedGaps:false,typedWords:false,accents:false,timer:0,hint:false,xp:15,prev:"b",
    info:"Longer sentences, the past tense with man/woman forms, more decoys, and textbook lessons 4–8 and 11–13. 3 lives, no hints."},
 f:{key:"f",name:"Fluent",sprout:"🌳",short:"Every tense, typed, timed",lives:2,min:4,max:12,decoys:4,past:[0,1,2,3,4,5,6,7,8,9,10,11],tenses:["present","past","fut","pfut"],opts:4,fopts:4,gopts:4,typedGaps:true,typedWords:true,accents:true,timer:20,hint:false,xp:20,prev:"i",
    info:"Every tense, textbook lessons 14–22 with typed answers, Polish letters must be right, a timer and 2 lives. Includes the exam round."}
};
const UNLOCK=7,NEED=3,INT=[1,3,7,14,30];

/* ---------- storage ---------- */
const KEY="pwk-game-v1";
const today=(d=new Date())=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const addDays=(n)=>{const d=new Date();d.setDate(d.getDate()+n);return today(d)};
const defaults=()=>({v:2,xp:0,streak:0,last:"",best:{},srs:{},stats:{units:{},verbs:{},types:{}},days:{},acc:{},unl:{},mastered:0,rounds:0,lv:"b",topic:"all",updatedAt:0,
 set:{gender:"any",sound:true,timer:"normal",theme:"auto",text:"normal",remind:true,ai:true,goal:20},placed:false});
function migrate(o){
 const d=defaults();const s=Object.assign(d,o);s.set=Object.assign(defaults().set,o.set||{});s.stats=Object.assign(defaults().stats,o.stats||{});
 if(o.remind===false)s.set.remind=false;
 if(Array.isArray(o.miss)&&o.miss.length){o.miss.forEach(q=>{try{s.srs[key(q)]={q,box:0,due:today()}}catch(e){}});}
 delete s.miss;delete s.remind;
 if(s.v!==3){["i","f"].forEach(l=>{const p=LV[l].prev;const b=Math.max(0,...Object.entries(s.best).filter(([k])=>k.startsWith(p+":")).map(([,v])=>v));if(b>=UNLOCK)s.unl[l]=true});s.v=3}
 if(!LV[s.lv])s.lv="b";
 return s;
}
let S=defaults();
let SYNC="local",DBREF=null,pushT=null;
function key(q){if(q.type==="gap")return "g:"+q.g.s;if(q.type==="word")return "w:"+q.w.pl;if(q.type==="forms")return "f:"+q.verb+q.who+q.label;if(q.type==="reply")return "r:"+q.ans+q.r.prev[0];return q.type+":"+(q.s?q.s.pl:"")}
try{const r=localStorage.getItem(KEY);if(r)S=migrate(JSON.parse(r))}catch(e){S=defaults()}
function save(){
 S.updatedAt=Date.now();
 const ks=Object.keys(S.srs);if(ks.length>160){ks.sort((a,b)=>S.srs[b].box-S.srs[a].box).slice(0,ks.length-160).forEach(k=>delete S.srs[k])}
 try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
 if(EXT&&chrome.storage)try{chrome.storage.local.set({pwk:{last:S.last,streak:S.streak,remind:S.set.remind!==false}})}catch(e){}
 if(DBREF){clearTimeout(pushT);pushT=setTimeout(()=>{DBREF.set({s:JSON.stringify(S),updatedAt:S.updatedAt}).catch(()=>{})},1500)}
}
async function initSync(){
 if(EXT||!window.claude||typeof window.claude.use!=="function")return;
 try{const db=await window.claude.use("db");if(!db)return;await window.claude.use("user");
  const ref=db.doc("data/users/me");const snap=await ref.get();
  if(snap.exists){const d=snap.data();if(d&&d.s&&(d.updatedAt||0)>(S.updatedAt||0)){S=migrate(JSON.parse(d.s));try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}applySettings();if(!R)render()}}
  DBREF=ref;SYNC="on";if(!snap.exists||(snap.data()||{}).updatedAt<S.updatedAt)ref.set({s:JSON.stringify(S),updatedAt:S.updatedAt||Date.now()}).catch(()=>{});
  if(VIEW==="settings")render();
 }catch(e){SYNC="local"}
}
let AI=null;
async function initAI(){if(EXT||!window.claude||typeof window.claude.use!=="function")return;try{AI=await window.claude.use("sample");if(AI&&!R&&["play","settings"].includes(VIEW))render()}catch(e){AI=null}}
const aiOn=()=>!!AI&&S.set.ai!==false;
function aiErr(e){const c=e&&e.code;return c==="not_granted"||c==="sampling_disabled"||c==="not_declared"?"Claude features aren't allowed on this page right now.":c==="rate_limited"||c==="queue_overflow"?"Claude is busy — wait a moment and try again.":c==="prompt_too_large"?"That was too long for Claude to check.":"Couldn't reach Claude just now."}
function genderLine(){return S.set.gender==="m"?"The learner is a man (so first-person past forms are masculine, e.g. byłem).":S.set.gender==="f"?"The learner is a woman (so first-person past forms are feminine, e.g. byłam).":""}
function aiJudge(q,user){
 const [ans]=answerOf(q),L=R.L;
 const task=q.type==="gap"?`Fill the gap in: "${q.g.s}"${q.g.cue?` (cue: ${q.g.cue})`:""}. The learner typed only the missing word(s). The sentence means: "${q.g.en}".`:q.type==="word"?`Translate this English word or phrase into Polish: "${q.w.en}".`:q.type==="build"?`Arrange Polish word tiles into a sentence meaning: "${q.s.en}".`:q.type==="listen"?`Write down the Polish sentence they heard (dictation).`:`Translate into Polish: "${q.s.en}".`;
 const prompt=`You check answers in a Polish learning game for English speakers. ${task}
Expected answer: "${q.type==="gap"?q.g.a:ans}".
Learner's answer: "${user}".
Level: ${LV[R.lv]?LV[R.lv].name:"Beginner"}. ${L.accents?"Polish letters (ą, ć, ę, ł, ń, ó, ś, ź, ż) must be correct.":"Ignore missing or wrong Polish accent marks."} ${genderLine()}
${q.type==="listen"?"For dictation the answer must be the same sentence; ignore punctuation and capital letters.":"Accept any answer that is correct, natural Polish with the same meaning: different word order, dropped pronouns and synonyms are fine. Be strict about grammatical endings and verb forms."}
Reply with JSON only: {"correct": true or false, "explanation": "1–2 short sentences in plain English for the learner; if wrong, name the exact mistake", "corrected": "the learner's answer minimally corrected, or an empty string if correct"}`;
 return AI.json(prompt,{modelTier:"quick"});
}
function aiGrade(q,user,ok,a,en,why,btn){
 if(ok||!aiOn()){return false}
 const tgt=q.type==="gap"?q.g.a:q.type==="word"?q.w.pl:(q.s.alts[0]||"");
 if(user.replace(/\s/g,"").length<tgt.replace(/\s/g,"").length*.5)return false;
 R.locked=true;stopTimer();if(btn){btn.disabled=true;btn.textContent="Checking with Claude…"}
 aiJudge(q,user).then(res=>{
  if(res&&res.correct===true){const k=key(q);(S.acc[k]=S.acc[k]||[]).push(norm(user));grade(true,a,en,"Claude: "+(res.explanation||"That works too."),true)}
  else grade(false,a,en,[res&&res.explanation?"Claude: "+res.explanation:"",res&&res.corrected?"Corrected: "+res.corrected:"",why].filter(Boolean).join(" "))
 }).catch(e=>grade(false,a,en,[aiErr(e),why].filter(Boolean).join(" ")));
 return true;
}
function markPlayed(){const T=today(),y=addDays(-1);if(S.last!==T){S.streak=S.last===y?S.streak+1:1;S.last=T}}
function applySettings(){const r=document.documentElement;if(S.set.theme==="auto")r.removeAttribute("data-theme");else r.setAttribute("data-theme",S.set.theme);r.setAttribute("data-text",S.set.text)}
applySettings();

/* ---------- text helpers ---------- */
const norm=s=>s.toLowerCase().replace(/[.,!?…„”"“:;()«»]/g," ").replace(/\s[–—-]\s/g," ").replace(/\s+/g," ").trim();
const deacc=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ł/g,"l");
const cleanEn=e=>e.replace(/\s*\([^)]*→[^)]*\)/g,"").trim();
const words=pl=>pl.replace(/[.,!?…„”"“:;]/g," ").split(/\s+/).filter(w=>w&&!/^[–—-]$/.test(w));
const NAMES=new Set(["Ania","Anię","Kasia","Tomek","Emma","SMS","OK"]);
const DROP=new Set(["ja","ty","my","wy"]);
const MOV=new Set(["jutro","dziś","dzisiaj","wczoraj","teraz","zawsze","często","rano","wieczorem","potem","tu","tutaj"]);
const toks=s=>norm(s).split(" ").filter(Boolean);
function sameMov(a,b){
 if(a.join(" ")===b.join(" "))return true;
 if(a.length!==b.length)return false;
 const am=a.filter(t=>MOV.has(t)),bm=b.filter(t=>MOV.has(t));
 if(!am.length||am.slice().sort().join()!==bm.slice().sort().join())return false;
 if(a.filter(t=>!MOV.has(t)).join(" ")!==b.filter(t=>!MOV.has(t)).join(" "))return false;
 for(let i=1;i<a.length;i++)if(MOV.has(a[i])&&a[i-1]==="nie")return false;
 return true;
}
const dropP=a=>a.length>1&&DROP.has(a[0])?a.slice(1):a;
function matchOne(user,target){
 const u=toks(user),t=toks(target);
 if(sameMov(u,t)||sameMov(dropP(u),dropP(t)))return "exact";
 const ud=u.map(deacc),td=t.map(deacc);
 if(sameMov(ud,td)||sameMov(dropP(ud),dropP(td)))return "accent";
 return false;
}
function check(user,alts,q){
 const k=key(q),n=norm(user);
 if((S.acc[k]||[]).includes(n))return "exact";
 let best=false;for(const a of alts){const m=matchOne(user,a);if(m==="exact")return "exact";if(m)best=m}
 return best;
}
function diffHTML(user,target){
 const u=user.trim().split(/\s+/).filter(Boolean),t=target.trim().split(/\s+/).filter(Boolean);
 const a=u.map(x=>deacc(norm(x))),b=t.map(x=>deacc(norm(x)));
 const L=Array.from({length:a.length+1},()=>new Array(b.length+1).fill(0));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)L[i][j]=a[i]===b[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
 const inU=new Array(a.length).fill(null),inT=new Array(b.length).fill(false);let i=0,j=0;
 while(i<a.length&&j<b.length){if(a[i]===b[j]){inU[i]=j;inT[j]=true;i++;j++}else if(L[i+1][j]>=L[i][j+1])i++;else j++}
 const uw=u.map((w,k)=>inU[k]===null?`<del>${esc(w)}</del>`:norm(w)!==norm(t[inU[k]])?`<mark title="check the Polish letters">${esc(w)}</mark>`:esc(w)).join(" ");
 const tw=t.map((w,k)=>inT[k]?esc(w):`<ins>${esc(w)}</ins>`).join(" ");
 return `<div class="diff"><p><span class="dl">You</span>${uw||"—"}</p><p><span class="dl">Answer</span>${tw}</p></div>`;
}

/* ---------- speech ---------- */
const canSpeak="speechSynthesis" in window;
let PLV=null;
function loadVoices(){if(!canSpeak)return;try{PLV=speechSynthesis.getVoices().find(v=>(v.lang||"").toLowerCase().replace("_","-").startsWith("pl"))||null}catch(e){}}
if(canSpeak){loadVoices();try{speechSynthesis.addEventListener("voiceschanged",()=>{const had=!!PLV;loadVoices();if(!had&&PLV&&!R&&VIEW==="play")render()})}catch(e){}}
const canListen=()=>!!PLV;
function speak(t,slow){if(!canSpeak)return;try{const u=new SpeechSynthesisUtterance(t);u.lang="pl-PL";if(PLV)u.voice=PLV;u.rate=slow?.6:.9;speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}}
const spk=t=>canSpeak?`<button class="spk" data-say="${esc(t)}" aria-label="Hear it in Polish">🔊</button>`:"";

/* ---------- item pools ---------- */
const SENT=[],seen=new Set();
function addSent(pl,en,k,alts){pl=pl.trim();if(seen.has(pl))return;seen.add(pl);SENT.push({pl,en:cleanEn(en),k,alts:alts||[pl],n:words(pl).length})}
for(const [k,v] of Object.entries(V)){
 v.pr.forEach(([en,pl])=>{const alts=pl.split(" / ").map(s=>s.trim());addSent(alts[0],en,k,alts)});
 v.ex.forEach(([pl,en])=>addSent(pl,en,k));
 v.dlg.forEach(([pl,en])=>addSent(pl,en,k));
}
D.forEach(d=>d.l.forEach(([pl,en])=>addSent(pl,en,"dlg")));
U.forEach(u=>u.ex.forEach(([pl,en])=>addSent(pl,en,u.id)));
const okSent=s=>!/[\/…+]/.test(s.pl)&&!/^Make /.test(s.en);
const PASTY=/(łem|łam|łeś|łaś|ł|ła|li|ły|liśmy|łyśmy)$/;
const hasPast=s=>words(s.pl).some(w=>PASTY.test(w.toLowerCase())&&w.length>3);
const BASE=SENT.filter(okSent);
const ALLWORDS=[...new Set(BASE.flatMap(s=>words(s.pl).map(w=>w.toLowerCase())))];
const REPLY=[];
const addDlg=(lines,k)=>{for(let i=0;i<lines.length-1;i++)REPLY.push({prev:lines[i],next:lines[i+1][0],en:lines[i+1][1],k,n:words(lines[i+1][0]).length})};
Object.entries(V).forEach(([k,v])=>addDlg(v.dlg,k));
D.forEach(d=>addDlg(d.l,"dlg"));
const GAPS=U.flatMap(u=>u.gap.map(g=>({u:u.id,n:u.n,ulv:u.lv,s:g[0],cue:g[1],a:g[2],d:g[3],en:g[4],why:g[5]})));
const WORDS=U.flatMap(u=>u.w.map(([pl,en])=>({u:u.id,n:u.n,ulv:u.lv,pl,en})));

let FOCUS=null;
function genderOK(s){const g=S.set.gender,e=s.en||"";if(g==="m")return !/\((f|woman)\)/.test(e);if(g==="f")return !/\((m|man)\)/.test(e);return true}
function topicKeys(){if(FOCUS)return FOCUS;if(S.topic==="all")return null;const g=G.find(g=>g[0]===S.topic);return g?new Set(g[1]):null}
function byTopic(arr){const t=topicKeys();if(!t)return arr;const f=arr.filter(x=>t.has(x.k));return f.length>=4?f:arr}
function levelSents(L){
 let a=BASE.filter(s=>s.n>=L.min&&s.n<=L.max&&genderOK(s));
 if(L.key==="b")a=a.filter(s=>!hasPast(s)&&!/będ/.test(s.pl));
 return a.length>=10?a:BASE.filter(genderOK);
}
function unitPool(arr,src){if(src&&src[0]==="u")return arr.filter(x=>x.u===src);if(src==="exam")return arr;const f=arr.filter(x=>x.ulv===S.lv);return f.length?f:arr}

/* ---------- question makers ---------- */
function pastForms(v){const [jm,jf,on,ona,oni,one]=v.past,s=v.refl?" się":"";
 return [["ja (man)",jm,"I (man)"],["ja (woman)",jf,"I (woman)"],["ty (to a man)",jm.replace(/em$/,"eś"),"you (man)"],["ty (to a woman)",jf.replace(/am$/,"aś"),"you (woman)"],["on",on,"he"],["ona",ona,"she"],["my (men / mixed)",oni+"śmy","we"],["my (women)",one+"śmy","we (women)"],["wy (men / mixed)",oni+"ście","you all"],["wy (women)",one+"ście","you all (women)"],["oni",oni,"they (men / mixed)"],["one",one,"they (women / things)"]].map(r=>[r[0],r[1]+s,r[2]])}
function tilesFor(s,L){const w=words(s.pl);
 const tiles=w.map((x,i)=>i===0&&!NAMES.has(x)?x.charAt(0).toLowerCase()+x.slice(1):x);
 const low=new Set(tiles.map(t=>t.toLowerCase()));let pool=ALLWORDS.filter(x=>!low.has(x));
 if(L.key==="f"){const st=tiles.map(t=>deacc(t.toLowerCase()).slice(0,4));pool=shuffle(pool.filter(x=>st.includes(deacc(x).slice(0,4)))).concat(shuffle(pool))}else pool=shuffle(pool);
 return {target:tiles,tiles:shuffle(tiles.concat([...new Set(pool)].slice(0,L.decoys)))}}
function qBuild(L){const s=pick(byTopic(levelSents(L).filter(s=>s.n>=2)));return Object.assign({type:"build",s},tilesFor(s,L))}
function qType(L){return {type:"type",s:pick(byTopic(levelSents(L)))}}
function qListen(L){const pool=byTopic(levelSents(L).filter(s=>s.n>=2&&s.n<=(L.key==="b"?5:9)));const s=pick(pool);
 if(L.key==="b"){const others=shuffle(pool.filter(x=>x.pl!==s.pl&&Math.abs(x.n-s.n)<=2)).slice(0,2).map(x=>x.pl);return {type:"listen",mode:"pick",s,ans:s.pl,opts:shuffle([s.pl].concat(others))}}
 if(L.key==="i")return Object.assign({type:"listen",mode:"tiles",s},tilesFor(s,L));
 return {type:"listen",mode:"type",s}}
function qForms(L){const t=topicKeys();let keys=Object.keys(V);if(t){const f=keys.filter(k=>t.has(k));if(f.length)keys=f}
 const k=pick(keys),v=V[k];const tenses=[];
 if(L.tenses.includes("present"))tenses.push(["present",v.presIsFut?"future":"present"]);
 if(L.tenses.includes("past"))tenses.push(["past","past"]);
 if(L.tenses.includes("fut")&&v.fut)tenses.push(["fut","future (będę…)"]);
 if(L.tenses.includes("pfut")&&v.pfut)tenses.push(["pfut","one-off future"]);
 const [tk,label]=pick(tenses);let rows;
 if(tk==="past"){const g=S.set.gender;rows=pastForms(v).filter((r,i)=>L.past.includes(i)&&!(g==="m"&&i===1)&&!(g==="f"&&i===0))}
 else{const arr=tk==="present"?v.pres:tk==="fut"?v.fut:v.pfut;rows=arr.map((f,i)=>[P[i],f,PE[i]])}
 const i=Math.floor(Math.random()*rows.length),ans=rows[i][1];
 let others=rows.map(r=>r[1]);
 if(L.key==="f")others=others.concat(v.pres,pastForms(v).map(r=>r[1]),v.pfut||[],v.fut||[]);
 others=[...new Set(others.filter(f=>f!==ans))];
 const verb=tk==="pfut"&&v.pf?v.pf:v.t;
 return {type:"forms",k,verb,m:v.m,who:rows[i][0],whoEn:rows[i][2],label,ans,opts:shuffle([ans].concat(shuffle(others).slice(0,L.fopts-1)))}}
const isQ=s=>/\?\s*$/.test(s);
function qReply(L){const r=pick(byTopic(REPLY));const need=L.opts-1;
 let wrong=shuffle(DD[r.prev[0]]||[]).slice(0,need);
 if(wrong.length<need){const lim=Math.max(2,Math.round(r.n*.5));
  let cand=[...new Set(REPLY.filter(x=>x.k!==r.k&&x.next!==r.next&&x.next!==r.prev[0]&&isQ(x.next)===isQ(r.next)&&Math.abs(x.n-r.n)<=lim).map(x=>x.next))];
  if(cand.length<need)cand=[...new Set(REPLY.filter(x=>x.next!==r.next&&x.next!==r.prev[0]).map(x=>x.next))];
  wrong=wrong.concat(shuffle(cand.filter(c=>!wrong.includes(c))).slice(0,need-wrong.length))}
 return {type:"reply",r,ans:r.next,opts:shuffle([r.next].concat(wrong))}}
function qGap(L,src){const g=pick(unitPool(GAPS,src));const typed=!!L.typedGaps;return {type:"gap",g,typed,ans:g.a,opts:typed?null:shuffle([g.a].concat(shuffle(g.d).slice(0,L.gopts-1)))}}
function qWord(L,src){const w=pick(unitPool(WORDS,src));const typed=!!L.typedWords;
 const others=shuffle(WORDS.filter(x=>x.en!==w.en&&x.pl!==w.pl&&x.ulv===w.ulv)).slice(0,L.fopts-1);
 return {type:"word",w,typed,ans:w.en,opts:typed?null:shuffle([w.en].concat(others.map(o=>o.en)))}}
const MAKE={build:qBuild,type:qType,listen:qListen,forms:qForms,reply:qReply,gap:qGap,word:qWord};
const VERBGAMES=[["build","Build it","Put the Polish word tiles in order.","tiles"],["type","Say it in Polish","Read the English, type the Polish.","typing"],["listen","Listen","Hear a sentence, then pick, build or type it.","listening"],["forms","Verb forms","The right form for the person and tense.","choice"],["reply","What comes next?","Pick the natural reply in a conversation.","dialogue"]];
const BOOKGAMES=[["gap","Grammar challenge","Fill the gap with the right form, using this level's lesson rules.","textbook"],["word","Words","Vocabulary from this level's lessons.","vocabulary"],["mix","Mixed round","A bit of everything.","10 questions"]];
const EXAM=["exam","Exam round","15 questions from every lesson and game, like a certificate test. 3 lives.","15 questions"];
const ALLMODES=VERBGAMES.concat(BOOKGAMES,[EXAM]);
const modeName=m=>(ALLMODES.find(x=>x[0]===m)||[0,m])[1];

/* ---------- progress helpers ---------- */
const dueList=()=>Object.entries(S.srs).filter(([,e])=>e.due<=today());
const passedGames=l=>Object.entries(S.best).filter(([k,v])=>k.startsWith(l+":")&&v>=UNLOCK).map(([k])=>k.slice(2));
const unlocked=l=>!LV[l].prev||!!S.unl[l]||passedGames(LV[l].prev).length>=NEED;
const acc=e=>e&&e.t?e.r/e.t:null;
function weakUnit(){const us=U.filter(u=>u.lv===S.lv);
 const tried=us.filter(u=>(S.stats.units[u.id]||{}).t>=3).sort((a,b)=>acc(S.stats.units[a.id])-acc(S.stats.units[b.id]));
 if(tried.length&&acc(S.stats.units[tried[0].id])<.8)return tried[0];
 return us.find(u=>!(S.stats.units[u.id]||{}).t)||tried[0]||null}
function effTimer(L){if(!L.timer||S.set.timer==="off")return 0;return L.timer*(S.set.timer==="long"?2:1)}
const cloneQ=q=>{const c=JSON.parse(JSON.stringify(q));delete c.pickd;delete c.hinted;delete c.user;return c};
function bump(o,k,ok){if(!k)return;const e=o[k]||(o[k]={r:0,t:0});e.t++;if(ok)e.r++}
function statKeys(q){return {u:q.type==="gap"?q.g.u:q.type==="word"?q.w.u:(q.s&&q.s.k&&q.s.k[0]==="u"&&U.some(x=>x.id===q.s.k))?q.s.k:null,
 v:q.type==="forms"?q.k:q.s&&V[q.s.k]?q.s.k:q.r&&V[q.r.k]?q.r.k:null,t:q.type}}

/* ---------- views ---------- */
let VIEW="play",R=null,TM=null,LESSON=null;
function stopTimer(){if(TM){clearInterval(TM);TM=null}}
const ICON={play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>',
 lessons:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM13 4h5.5c.8 0 1.5.7 1.5 1.5v13c0 .8-.7 1.5-1.5 1.5H13z" fill="currentColor"/></svg>',
 progress:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V11h3.5v9zm6.25 0V4h3.5v16zM16.5 20v-6H20v6z" fill="currentColor"/></svg>',
 gear:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.5 7.5 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.5 7.5 0 0 0 0 2l-2 1.6 2 3.4 2.4-1c.5.4 1.1.8 1.7 1l.4 2.5h4l.4-2.5c.6-.2 1.2-.6 1.7-1l2.4 1 2-3.4zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg>'};
function tabbar(active){return `<nav class="tabbar" aria-label="Main">${[["play","Play"],["lessons","Lessons"],["progress","Progress"]].map(([k,l])=>`<button data-tab="${k}" ${active===k?'aria-current="page"':""}>${ICON[k]}<span>${l}</span></button>`).join("")}</nav>`}
function header(){return `<div class="brandrow"><div class="brand"><span class="mini"><i>Nie</i><i>mam</i><i>czasu</i><i>gra</i></span></div><div class="hdr-actions">${EXT&&POPUP?`<button class="tabbtn" id="tab">Open in a tab ↗</button>`:""}<button class="iconbtn" id="gear" aria-label="Settings">${ICON.gear}</button></div></div>`}
function render(){stopTimer();hideSheet();closeModal();document.body.classList.toggle("has-tabs",["play","lessons","progress","settings","lesson","talk"].includes(VIEW));document.body.classList.toggle("chatting",VIEW==="chat");
 ({play:viewPlay,lessons:viewLessons,progress:viewProgress,settings:viewSettings,lesson:viewLesson,talk:viewTalk,chat:viewChat,talkdone:viewTalkDone})[VIEW]();window.scrollTo(0,0)}
function go(v){VIEW=v;R=null;render()}
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-tab]");if(t){go(t.dataset.tab);return}
 const g=e.target.closest("#gear");if(g){go("settings");return}
 const tb=e.target.closest("#tab");if(tb){chrome.tabs.create({url:chrome.runtime.getURL("game.html")});window.close();return}
 const sp=e.target.closest("[data-say]");if(sp){speak(sp.dataset.say,sp.dataset.slow==="1");return}
});

function levelCards(){return `<div class="levels" id="levels">${Object.entries(LV).map(([k,l])=>{const u=unlocked(k);const pg=l.prev?passedGames(l.prev).length:0;
 return `<button class="lv${u?"":" locked"}" data-l="${k}" aria-pressed="${S.lv===k}"><span class="sprout" aria-hidden="true">${u?l.sprout:"🔒"}</span><b>${l.name}</b><span>${u?l.short:`${Math.min(pg,NEED)} of ${NEED} games at ${UNLOCK}+ in ${LV[l.prev].name}`}</span></button>`}).join("")}</div><p class="lvinfo" id="lvinfo">${esc(LV[S.lv].info)}</p>`}
function bindLevels(){$("#levels").onclick=e=>{const b=e.target.closest(".lv");if(!b)return;const k=b.dataset.l;
 if(!unlocked(k)){const i=$("#lvinfo"),p=LV[k].prev,have=passedGames(p);i.classList.add("lock");
  i.textContent=`${LV[k].name} is locked. Score ${UNLOCK}/10 in ${NEED} different ${LV[p].name} games or lessons to open it (you have ${have.length}${have.length?": "+have.map(g=>g.startsWith("unit:")?"Lekcja "+U.find(u=>u.id===g.slice(5)).n:modeName(g)).join(", "):""}).`;return}
 S.lv=k;save();render()}}
function gameRow([m,t,d,tag]){const b=S.best[S.lv+":"+m];const dis=m==="listen"&&!canListen();
 return `<button class="mode" data-m="${m}" ${dis?"disabled":""}><b>${t}</b><span>${dis?"Needs a Polish voice on this device — add one in your system's speech settings.":d}${b&&!dis?` Best: ${b}/10.`:""}</span><em>${tag}</em></button>`}
function goalRing(){const n=S.days[today()]||0,g=S.set.goal,p=Math.min(10,Math.round(n/g*10));return `<span class="goal" aria-label="${n} of ${g} questions today"><span class="ring big${n>=g?" done":""}" style="--p:${p}"><i>${n>=g?"✓":n}</i></span><small>${n>=g?"goal done":`of ${g} today`}</small></span>`}
function viewPlay(){
 const due=dueList().length,wu=weakUnit();
 const fresh=!S.placed&&!S.rounds&&!S.xp;
 const plan=[due?`${Math.min(due,5)} review${due===1?"":"s"}`:null,wu?`focus: Lekcja ${wu.n}, ${wu.g.split(/;| \(/)[0].toLowerCase()}`:null,"mixed practice"].filter(Boolean).join(" · ");
 $("#app").innerHTML=header()+`
 <div class="stats"><div class="stat xp"><strong>${S.xp}</strong><span>XP</span></div><div class="stat"><strong>${S.streak}</strong><span>day streak</span></div><div class="stat"><strong>${due}</strong><span>reviews due</span></div></div>
 ${fresh?`<div class="welcome"><b>New here? Find your level first.</b><span>12 quick questions, about 2 minutes. If you already know some Polish, it unlocks the right level for you.</span><div class="row2"><button class="main-btn" id="placeBtn">Take the test</button><button class="ghost" id="skipPlace">Start at Beginner</button></div></div>`:""}
 <button class="today" id="todayBtn"><span class="tcol"><span class="tl">Today's round</span><b>${S.last===today()?"Play another":"Start"} — 10 questions</b><span class="tp">${esc(plan)}</span></span>${goalRing()}</button>
 <h2>Level</h2>${levelCards()}
 <div class="sechead"><h2>Sentence &amp; verb games</h2><label class="vsel"><span>Verbs</span><select id="topic">${[["all","All verbs"]].concat(G.map(g=>[g[0],g[0]])).map(([v,l])=>`<option value="${esc(v)}" ${S.topic===v?"selected":""}>${esc(l)}</option>`).join("")}</select></label></div>
 <div class="modes">${VERBGAMES.map(gameRow).join("")}</div>
 <h2>Textbook games</h2><div class="modes">${BOOKGAMES.concat(S.lv==="f"?[EXAM]:[]).map(gameRow).join("")}</div>
 ${aiOn()?`<h2>With Claude</h2><div class="modes"><button class="mode claude" id="talkBtn"><b>Talk with Claude</b><span>Real conversations in Polish at your level — a café, a new neighbour, a job interview. Claude corrects you as you go.</span><em>conversation</em></button></div>`:""}
 ${due>5?`<button class="linkbtn" id="reviewAll">Review all ${due} due items</button>`:""}`+tabbar("play");
 bindLevels();
 $("#todayBtn").onclick=()=>start("today");
 if($("#placeBtn")){$("#placeBtn").onclick=()=>start("place");$("#skipPlace").onclick=()=>{S.placed=true;save();render()}}
 if($("#talkBtn"))$("#talkBtn").onclick=()=>go("talk");
 $("#topic").onchange=e=>{S.topic=e.target.value;save()};
 document.querySelectorAll(".modes").forEach(m=>m.onclick=e=>{const b=e.target.closest(".mode[data-m]");if(b&&!b.disabled)start(b.dataset.m)});
 if($("#reviewAll"))$("#reviewAll").onclick=()=>start("review");
}
function ring(v){const p=Math.round((v||0)*10);return `<span class="ring" style="--p:${p}" aria-label="${v?v+" out of 10":"not started"}"><i>${v||""}</i></span>`}
function viewLessons(){
 $("#app").innerHTML=header()+`<h1 class="ph">Lessons</h1><p class="small">Grammar and topics from <i>Krok po kroku A2–B1</i>. Read the rule, then practise it. Lessons in a locked level can be read but not practised yet.</p>`+
 Object.entries(LV).map(([k,l])=>`<div class="lgroup"><h2>${l.name}${unlocked(k)?"":" <span class='lk'>🔒</span>"}</h2><div class="units">${U.filter(u=>u.lv===k).map(u=>{const b=S.best[k+":unit:"+u.id];return `<button class="unit" data-u="${u.id}">${ring(b)}<b>Lekcja ${u.n} · ${esc(u.t)}</b><span class="ug">${esc(u.g)}</span></button>`}).join("")}</div></div>`).join("")+tabbar("lessons");
 document.querySelectorAll(".units").forEach(x=>x.onclick=e=>{const b=e.target.closest(".unit");if(b){LESSON=b.dataset.u;go("lesson")}});
}
function viewLesson(){
 const u=U.find(x=>x.id===LESSON),b=S.best[u.lv+":unit:"+u.id],can=unlocked(u.lv),tk=TK[u.id];
 $("#app").innerHTML=`<div class="bar"><button class="quit" id="back">← Lessons</button><span class="kind" style="margin:0">Lekcja ${u.n} · ${esc(LV[u.lv].name)}</span></div>
 <h1 class="uh">${esc(u.t)}</h1><p class="lede">${esc(u.en)}</p><span class="tense">${esc(u.g)}</span>
 <div class="teach">${u.teach.map(p=>`<p>${esc(p)}</p>`).join("")}</div>
 ${tk?`<a class="tklink" href="${TOOLKIT}#${tk[0]}" target="_blank" rel="noopener">📘 More in your toolkit: ${esc(tk[1])} ↗</a>`:""}
 <h2>Examples</h2><ul class="exlist">${u.ex.map(([pl,en])=>`<li><div><b>${esc(pl)}</b><span>${esc(en)}</span></div>${spk(pl)}</li>`).join("")}</ul>
 <h2>Words from this lesson</h2><ul class="exlist words">${u.w.map(([pl,en])=>`<li><div><b>${esc(pl)}</b><span>${esc(en)}</span></div>${spk(pl)}</li>`).join("")}</ul>
 <div class="act"><button class="main-btn" id="goUnit" ${can?"":"disabled"}>${can?`Practise this lesson${b?` (best ${b}/10)`:""}`:`Unlock ${LV[u.lv].name} to practise`}</button></div>`+tabbar("lessons");
 $("#back").onclick=()=>go("lessons");if(can)$("#goUnit").onclick=()=>start("unit",u.id);
}
function viewProgress(){
 const due=dueList().length,st=S.stats;
 const days=[];for(let i=13;i>=0;i--){const d=addDays(-i);days.push([d,S.days[d]||0])}const mx=Math.max(S.set.goal,...days.map(d=>d[1]));
 const units=U.map(u=>[u,st.units[u.id]]).filter(([,e])=>e&&e.t).sort((a,b)=>acc(a[1])-acc(b[1]));
 const verbs=Object.entries(st.verbs).filter(([k,e])=>V[k]&&e.t>=3).sort((a,b)=>acc(a[1])-acc(b[1])).slice(0,6);
 const weakV=verbs.filter(([,e])=>acc(e)<.85);
 const lvRows=Object.entries(LV).filter(([,l])=>l.prev).map(([k,l])=>{const have=passedGames(l.prev);return `<li><b>${l.name}</b><span>${unlocked(k)?"Unlocked ✓":`${Math.min(have.length,NEED)} of ${NEED} ${LV[l.prev].name} games or lessons at ${UNLOCK}/10+`}</span></li>`}).join("");
 $("#app").innerHTML=header()+`<h1 class="ph">Progress</h1>
 <div class="stats five"><div class="stat xp"><strong>${S.xp}</strong><span>XP</span></div><div class="stat"><strong>${S.streak}</strong><span>day streak</span></div><div class="stat"><strong>${S.rounds}</strong><span>rounds</span></div><div class="stat"><strong>${S.mastered||0}</strong><span>mastered</span></div><div class="stat"><strong>${due}</strong><span>due today</span></div></div>
 <h2>Last 14 days</h2><div class="days" role="img" aria-label="Questions answered each day for the last 14 days">${days.map(([d,n])=>`<i style="height:${Math.max(4,n/mx*56)}px" class="${n>=S.set.goal?"on goal":n?"on":""}" title="${d}: ${n} questions"></i>`).join("")}</div>
 <h2>Levels</h2><ul class="plist">${lvRows}</ul>
 <h2>Lessons</h2>${Object.entries(LV).map(([k,l])=>`<p class="plabel">${l.name}</p><div class="rings">${U.filter(u=>u.lv===k).map(u=>`<button class="rbtn" data-u="${u.id}" title="Lekcja ${u.n}: ${esc(u.t)}">${ring(S.best[k+":unit:"+u.id])}<span>${u.n}</span></button>`).join("")}</div>`).join("")}
 <h2>Accuracy by grammar point</h2>${units.length?`<ul class="bars">${units.slice(0,10).map(([u,e])=>{const p=Math.round(acc(e)*100);return `<li><div class="bl"><b>Lekcja ${u.n}</b> <span>${esc(u.g)}</span></div><div class="bt"><i style="width:${p}%" class="${p<60?"low":p<80?"mid":""}"></i></div><span class="bp">${p}%</span><button class="mini-go" data-u="${u.id}" aria-label="Practise Lekcja ${u.n}">Practise</button></li>`}).join("")}</ul>`:`<p class="small">Play some Grammar challenge or lesson rounds and your strongest and weakest points will show up here.</p>`}
 <h2>Verbs to work on</h2>${verbs.length?`<ul class="bars">${verbs.map(([k,e])=>{const p=Math.round(acc(e)*100);return `<li><div class="bl"><b>${esc(V[k].t)}</b> <span>${esc(V[k].m)}</span></div><div class="bt"><i style="width:${p}%" class="${p<60?"low":p<80?"mid":""}"></i></div><span class="bp">${p}%</span></li>`}).join("")}</ul>${weakV.length?`<button class="main-btn" id="practV">Practise these verbs</button>`:`<p class="small">All your practised verbs are above 85%. Nice.</p>`}`:`<p class="small">Answer a few verb questions (at least 3 per verb) to see which ones need work.</p>`}`+tabbar("progress");
 document.querySelectorAll(".rbtn,.mini-go").forEach(b=>b.onclick=()=>{const u=U.find(x=>x.id===b.dataset.u);if(b.classList.contains("mini-go")&&unlocked(u.lv))start("unit",u.id);else{LESSON=u.id;go("lesson")}});
 if($("#practV"))$("#practV").onclick=()=>start("verbs",weakV.map(([k])=>k));
}
function seg(name,label,opts,help){return `<div class="setrow"><div><b>${label}</b>${help?`<span>${help}</span>`:""}</div><div class="seg" role="radiogroup" aria-label="${esc(label)}">${opts.map(([v,l])=>`<button role="radio" aria-checked="${String(S.set[name])===String(v)}" data-set="${name}" data-v="${v}">${l}</button>`).join("")}</div></div>`}
function viewSettings(){
 $("#app").innerHTML=`<div class="bar"><button class="quit" id="back">← Back</button><span class="kind" style="margin:0">Settings</span></div><h1 class="ph">Settings</h1>
 ${seg("gender","You are","m,A man;f,A woman;any,Show both".split(";").map(x=>x.split(",")),"Sentences and past-tense forms for “I” will use your form, e.g. byłem / byłam.")}
 ${seg("sound","Read answers aloud","true,On;false,Off".split(";").map(x=>x.split(",")),canSpeak?(PLV?"Uses your device's Polish voice.":"No Polish voice found on this device, so it may sound off."):"This browser can't speak.")}
 ${seg("goal","Daily goal","10,10;20,20;30,30;50,50".split(";").map(x=>x.split(",")),"Questions per day. Shown as a ring on the Play tab.")}
 ${AI?seg("ai","Claude checks my answers","true,On;false,Off".split(";").map(x=>x.split(",")),"When a typed or built answer doesn't match, Claude decides whether it's still correct and explains any mistake. Uses a little of your Claude usage."):""}
 ${seg("timer","Timer (Fluent and exam)","normal,Normal;long,Longer;off,Off".split(";").map(x=>x.split(",")),"Longer doubles the time. Off removes it.")}
 ${seg("theme","Appearance","auto,Auto;light,Light;dark,Dark".split(";").map(x=>x.split(",")))}
 ${seg("text","Text size","normal,Normal;large,Large".split(";").map(x=>x.split(",")))}
 ${EXT?seg("remind","Evening reminder","true,On;false,Off".split(";").map(x=>x.split(",")),"One notification between 18:00 and 22:00 if you haven't played that day."):""}
 <div class="setrow"><div><b>Saving</b><span>${EXT?"Saved in this Chrome profile.":SYNC==="on"?"Synced to your Claude account, so the link has the same progress on every device.":"Saved in this browser only."}</span></div></div>
 <div class="setrow"><div><b>Your toolkit</b><span>The full sentence-building reference.</span></div><a class="tabbtn" href="${TOOLKIT}" target="_blank" rel="noopener">Open ↗</a></div>
 <div class="setrow"><div><b>Placement test</b><span>12 questions to find the right level. It can only unlock levels, never lock them.</span></div><button class="ghost small-btn" id="replace">Take it</button></div>
 <div class="setrow danger"><div><b>Reset progress</b><span>Clears XP, streak, levels, reviews and stats.</span></div><button class="ghost small-btn" id="reset">Reset</button></div>`+tabbar("");
 $("#back").onclick=()=>go("play");$("#replace").onclick=()=>start("place");
 document.querySelectorAll("[data-set]").forEach(b=>b.onclick=()=>{let v=b.dataset.v;if(v==="true")v=true;else if(v==="false")v=false;else if(/^\d+$/.test(v))v=+v;S.set[b.dataset.set]=v;save();applySettings();render()});
 $("#reset").onclick=()=>ask("Reset all progress?","This clears XP, streak, unlocked levels, reviews and stats. Your settings stay.","Reset",()=>{const keep=S.set;S=defaults();S.set=keep;save();go("play")});
}

/* ---------- modal ---------- */
function ask(title,body,okLabel,onOk){const m=$("#modal");m.innerHTML=`<div class="mbox" role="dialog" aria-modal="true" aria-labelledby="mt"><h3 id="mt">${esc(title)}</h3><p>${esc(body)}</p><div class="row2"><button class="ghost" id="mNo">Keep going</button><button class="main-btn warn" id="mYes">${esc(okLabel)}</button></div></div>`;
 m.classList.add("show");$("#mNo").focus();$("#mNo").onclick=closeModal;$("#mYes").onclick=()=>{closeModal();onOk()};m.onclick=e=>{if(e.target===m)closeModal()}}
function closeModal(){const m=$("#modal");if(m){m.classList.remove("show");m.innerHTML=""}}

/* ---------- rounds ---------- */
function start(mode,src){
 FOCUS=null;let L=LV[S.lv],lv=S.lv,qs=[];
 if(mode==="unit"){const u=U.find(x=>x.id===src);L=LV[u.lv];lv=u.lv;for(let i=0;i<10;i++)qs.push(i<7?qGap(L,src):qWord(L,src));qs=shuffle(qs)}
 else if(mode==="review"){L=Object.assign({},LV.b,{lives:3,hint:false});qs=shuffle(dueList()).slice(0,10).map(([,e])=>cloneQ(e.q))}
 else if(mode==="exam"){L=Object.assign({},LV.f,{lives:3,timer:25});lv="f";for(let i=0;i<15;i++){const m=pick(["gap","gap","gap","word","build","type","forms"]);qs.push(MAKE[m](L,"exam"))}}
 else if(mode==="today"){qs=shuffle(dueList()).slice(0,5).map(([,e])=>cloneQ(e.q));const wu=weakUnit();const nw=wu?Math.min(3,10-qs.length):0;for(let i=0;i<nw;i++)qs.push(qGap(L,wu.id));
  const kinds=["build","type","forms","reply","gap","word"].concat(canListen()?["listen"]:[]);while(qs.length<10)qs.push(MAKE[pick(kinds)](L));qs=shuffle(qs)}
 else if(mode==="verbs"){FOCUS=new Set(src);for(let i=0;i<10;i++)qs.push(MAKE[pick(["forms","forms","type","build"])](L))}
 else if(mode==="place"){L=Object.assign({},LV.b,{lives:99,hint:false,timer:0,xp:5});qs=placeQs()}
 else for(let i=0;i<10;i++){const m=mode==="mix"?pick(["build","type","forms","reply","gap","word"].concat(canListen()?["listen"]:[])):mode;qs.push(MAKE[m](L))}
 if(!qs.length){go("play");return}
 R={mode,src,L,lv,qs,i:0,hearts:L.lives,right:0,wrongList:[],xp:0,bands:{},dayStart:S.days[today()]||0};VIEW="game";document.body.classList.remove("has-tabs");renderQ();
}
function placeQs(){const keepLv=S.lv,keepT=S.topic;S.topic="all";const qs=[];
 ["b","b","b","b","i","i","i","i","f","f","f","f"].forEach((lv,i)=>{S.lv=lv;const L=Object.assign({},LV[lv],{typedGaps:false,typedWords:false,timer:0,hint:false});const q=i%2?qForms(L):qGap(L);q.band=lv;qs.push(q)});
 S.lv=keepLv;S.topic=keepT;return qs}
function answerOf(q){
 if(q.type==="gap")return [q.g.s.replace("___",q.g.a),q.g.en];
 if(q.type==="word")return q.typed?[q.w.pl,q.w.en]:[q.w.en,q.w.pl];
 if(q.type==="build"||q.type==="type"||q.type==="listen")return [q.s.alts.join("  /  "),q.s.en];
 if(q.type==="forms")return [q.ans,`${q.whoEn} — ${q.verb}, ${q.label}`];
 return [q.ans,q.r.en]}
const typeBox=`<textarea id="inp" rows="2" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your Polish answer" placeholder="Type in Polish"></textarea><div class="keys" aria-label="Polish letters">${["ą","ć","ę","ł","ń","ó","ś","ź","ż"].map(c=>`<button data-k="${c}" aria-label="Insert ${c}">${c}</button>`).join("")}</div>`;
const tileBox=q=>`<div class="line" id="line" aria-label="Your sentence"></div><div class="tray" id="tray">${q.tiles.map((t,i)=>`<button class="tile" data-i="${i}">${esc(t)}</button>`).join("")}</div>`;
const optBox=q=>`<div class="opts">${q.opts.map((o,n)=>`<button class="opt" data-o="${esc(o)}"><span class="on">${n+1}</span>${esc(o)}</button>`).join("")}</div>`;
const checkBtn=`<div class="act"><button class="main-btn" id="check" disabled>Check</button></div>`;
function renderQ(){
 stopTimer();hideSheet();const q=R.qs[R.i],L=R.L;q.hinted=false;q.user=null;
 const name=R.mode==="place"?"Placement test":R.mode==="unit"?"Lekcja "+U.find(u=>u.id===R.src).n:R.mode==="today"?"Today's round":R.mode==="review"?"Review":R.mode==="exam"?"Exam":R.mode==="verbs"?"Verb practice":LV[R.lv].name;
 const lost=Math.max(0,L.lives-R.hearts);
 let h=`<div class="bar"><button class="quit" id="quit">✕ Quit</button><div class="prog" role="progressbar" aria-label="Question ${R.i+1} of ${R.qs.length}" aria-valuemin="0" aria-valuemax="${R.qs.length}" aria-valuenow="${R.i}"><i style="width:${R.i/R.qs.length*100}%"></i></div><span class="hearts${R.mode==="place"?" hidden":""}" role="img" aria-label="${R.hearts} of ${L.lives} lives left"><span aria-hidden="true">${"♥".repeat(R.hearts)}<span class="gone">${"♥".repeat(lost)}</span></span></span></div>${effTimer(L)?`<div class="timer" id="timer" aria-hidden="true"><i></i></div>`:""}<span class="lvtag">${esc(name)} · ${R.i+1} of ${R.qs.length}</span>`;
 const hint=L.hint&&["build","forms","reply","gap","word","listen"].includes(q.type)&&!(q.type==="listen"&&q.mode==="type")&&!((q.type==="gap"||q.type==="word")&&q.typed)?`<button class="hintbtn" id="hint">💡 Hint</button>`:"";
 if(q.type==="build")h+=`<p class="kind">Build the sentence</p><p class="prompt">${esc(q.s.en)}</p>${tileBox(q)}${hint}${checkBtn}`;
 if(q.type==="type")h+=`<p class="kind">Say it in Polish</p><p class="prompt">${esc(q.s.en)}</p>${typeBox}${checkBtn}`;
 if(q.type==="listen")h+=`<p class="kind">Listen</p><p class="sub">${q.mode==="pick"?"Which sentence did you hear?":q.mode==="tiles"?"Build the sentence you hear.":"Type what you hear."}</p><div class="playrow"><button class="playbtn" data-say="${esc(q.s.pl)}">▶ Play</button><button class="playbtn slow" data-say="${esc(q.s.pl)}" data-slow="1">🐢 Slower</button></div>${q.mode==="pick"?optBox(q):q.mode==="tiles"?tileBox(q)+checkBtn:typeBox+checkBtn}${hint}`;
 if(q.type==="forms")h+=`<p class="kind">Verb forms</p><p class="verbname">${esc(q.verb)} <span class="muted">${esc(q.m)}</span></p><p class="big">${esc(q.who)}</p><span class="tense">${esc(q.label)}</span>${optBox(q)}${hint}`;
 if(q.type==="reply")h+=`<p class="kind">What comes next?</p><div class="said">${esc(q.r.prev[0])}<small>${esc(q.r.prev[1])}</small></div><p class="sub">Pick the natural, correct reply.</p>${optBox(q)}${hint}`;
 if(q.type==="gap"){const g=q.g;h+=`<p class="kind">Grammar challenge <span class="unitref">Lekcja ${g.n}</span></p><p class="prompt">${esc(g.s).replace("___",`<span class="blank">${q.typed?"?":""}</span>`)}</p>${g.cue?`<p class="cue">${esc(g.cue)}</p>`:""}<p class="sub">${esc(g.en)}</p>${q.typed?typeBox:optBox(q)}${hint}<div class="why hidden" id="why">${esc(g.why||"")}</div>${q.typed?checkBtn:""}`}
 if(q.type==="word"){const w=q.w;h+=q.typed?`<p class="kind">Words <span class="unitref">Lekcja ${w.n}</span></p><p class="sub">How do you say this in Polish?</p><p class="prompt">${esc(w.en)}</p>${typeBox}${checkBtn}`:`<p class="kind">Words <span class="unitref">Lekcja ${w.n}</span></p><p class="sub">What does this mean?</p><p class="big wordbig">${esc(w.pl)} ${spk(w.pl)}</p>${optBox(q)}${hint}`}
 $("#app").innerHTML=h;window.scrollTo(0,0);$("#app").style.paddingBottom="";
 $("#quit").onclick=()=>{if(R.i===0&&!R.locked){stopTimer();go("play");return}ask("Quit this round?","Your answers so far won't count towards your best score. Reviews you've done are still saved.","Quit",()=>{stopTimer();go(R&&R.mode==="unit"?"lesson":"play")})};
 if(q.type==="listen")setTimeout(()=>speak(q.s.pl),250);
 // tiles
 if($("#tray")){const line=$("#line"),tray=$("#tray"),chk=$("#check");q.pickd=[];
  const upd=()=>{line.innerHTML=q.pickd.map((ti,n)=>`<button class="tile" data-n="${n}">${esc(q.tiles[ti])}</button>`).join("");tray.querySelectorAll(".tile").forEach(b=>b.classList.toggle("used",q.pickd.includes(+b.dataset.i)));chk.disabled=!q.pickd.length};
  tray.onclick=e=>{const b=e.target.closest(".tile");if(!b||b.classList.contains("used")||R.locked)return;q.pickd.push(+b.dataset.i);upd()};
  line.onclick=e=>{const b=e.target.closest(".tile");if(!b||R.locked)return;q.pickd.splice(+b.dataset.n,1);upd()};
  if($("#hint"))$("#hint").onclick=()=>{q.hinted=true;let n=0;while(n<q.pickd.length&&q.tiles[q.pickd[n]]===q.target[n])n++;q.pickd=q.pickd.slice(0,n);if(n<q.target.length){const idx=q.tiles.findIndex((t,i)=>t===q.target[n]&&!q.pickd.includes(i));if(idx>=0)q.pickd.push(idx)}upd()};
  chk.onclick=()=>{if(R.locked)return;const got=q.pickd.map(i=>q.tiles[i]).join(" ");q.user=got;const m=check(got,[q.target.join(" ")].concat(q.s.alts),q);const [a,en]=answerOf(q);
   if(!aiGrade(q,got,m==="exact",a,en,"",chk))grade(m==="exact",a,en,"")}}
 // typed
 if($("#inp")){const inp=$("#inp"),chk=$("#check");setTimeout(()=>inp.focus({preventScroll:true}),50);
  inp.oninput=()=>{chk.disabled=!inp.value.trim()};
  document.querySelector(".keys").onclick=e=>{const b=e.target.closest("button");if(!b)return;inp.setRangeText(b.dataset.k,inp.selectionStart,inp.selectionEnd,"end");inp.focus();inp.oninput()};
  inp.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(!chk.disabled&&!R.locked)chk.click()}};
  chk.onclick=()=>{if(R.locked)return;const val=inp.value.trim();q.user=val;const alts=q.type==="gap"?[q.g.a]:q.type==="word"?[q.w.pl]:q.s.alts;
   let m=check(val,alts,q);let ok=m==="exact"||(m==="accent"&&!L.accents);
   const [a,en]=answerOf(q);const why=q.type==="gap"&&q.g.why?"Why: "+q.g.why:"";
   const tip=[m==="accent"?(ok?"Correct — just watch the Polish letters.":"So close — at this level the Polish letters (ą, ę, ł…) have to be right."):"",why].filter(Boolean).join(" ");
   if(!(m===false&&aiGrade(q,val,ok,a,en,why,chk)))grade(ok,a,en,tip)}}
 // options
 if($(".opts")){document.querySelector(".opts").onclick=e=>{const b=e.target.closest(".opt");if(!b||R.locked||b.disabled)return;
  const ok=b.dataset.o===q.ans;document.querySelectorAll(".opt").forEach(o=>{o.disabled=true;if(o.dataset.o===q.ans)o.classList.add("right")});if(!ok)b.classList.add("wrong");
  const [a,en]=answerOf(q);grade(ok,a,en,q.type==="gap"&&q.g.why?"Why: "+q.g.why:"")};
  if($("#hint"))$("#hint").onclick=e=>{q.hinted=true;if($("#why")&&$("#why").textContent)$("#why").classList.remove("hidden");const wrong=[...document.querySelectorAll(".opt:not(:disabled)")].filter(o=>o.dataset.o!==q.ans);if(wrong.length)pick(wrong).disabled=true;e.target.disabled=true}}
 R.locked=false;
 const T=effTimer(L);if(T){let left=T;const bar=$("#timer i"),box=$("#timer");
  TM=setInterval(()=>{left--;bar.style.width=(left/T*100)+"%";box.classList.toggle("low",left<=5);if(left<=0){stopTimer();if(!R.locked){document.querySelectorAll(".opt").forEach(o=>{o.disabled=true;if(o.dataset.o===q.ans)o.classList.add("right")});const [a,en]=answerOf(q);q.user=null;grade(false,a,en,"Time's up.")}}},1000)}
}
function grade(ok,ans,en,tip,aiOK){
 stopTimer();R.locked=true;const q=R.qs[R.i],k=key(q),T=today(),place=R.mode==="place";
 R.prev={srs:S.srs[k]?JSON.parse(JSON.stringify(S.srs[k])):null,mastered:S.mastered};
 if(place){if(ok)R.bands[q.band]=(R.bands[q.band]||0)+1}
 else{const sk=statKeys(q);bump(S.stats.units,sk.u,ok);bump(S.stats.verbs,sk.v,ok);bump(S.stats.types,sk.t,ok);S.days[T]=(S.days[T]||0)+1}
 if(ok){R.right++;R.xp+=q.hinted?Math.ceil(R.L.xp/2):R.L.xp;if(!place)srsRight(k)}
 else{if(!place)R.hearts--;R.wrongList.push([ans,en]);if(!place)S.srs[k]={q:cloneQ(q),box:0,due:T};
  const a=$("#app .line")||$("#app .opts")||$("#inp");if(a){a.classList.remove("shake");void a.offsetWidth;a.classList.add("shake")}}
 save();showSheet(ok,ans,en,tip,false,aiOK);
 if(ok&&S.set.sound&&q.type!=="forms"&&q.type!=="listen"&&(q.type!=="word"||q.typed)&&q.type!=="reply")speak(ans.split("  /  ")[0]);
 if(ok&&S.set.sound&&q.type==="reply")speak(ans);
}
function srsRight(k){const e=S.srs[k];if(!e)return;e.box++;if(e.box>INT.length){delete S.srs[k];S.mastered=(S.mastered||0)+1}else e.due=addDays(INT[e.box-1])}
function showSheet(ok,ans,en,tip,overridden,aiOK){
 const q=R.qs[R.i],last=R.i===R.qs.length-1||R.hearts<=0;
 const canOverride=R.mode!=="place"&&!ok&&q.user&&["build","type","listen","gap","word"].includes(q.type);
 const sh=$("#sheet");sh.classList.toggle("bad",!ok);
 const first=ans.split("  /  ")[0];
 $("#sheetIn").innerHTML=`<h3>${overridden?"Counted as correct":aiOK?"Correct — Claude accepted it":ok?pick(["Dobrze!","Super!","Świetnie!","Brawo!","Tak jest!"]):"Not quite"}</h3>
 ${!ok&&q.user?diffHTML(q.user,q.type==="gap"?q.g.a:first)+(q.type==="gap"||ans.includes("  /  ")?`<p class="ans small-ans">${esc(ans)} ${spk(first)}</p>`:`<p class="ans small-ans">${spk(first)} <span class="muted">Hear it</span></p>`):`<p class="ans">${ok?"":"<span class='muted'>Answer:</span> "}<span>${esc(ans)}</span>${spk(first)}</p>`}
 <p class="en">${esc(en)}</p>${tip?`<p class="tip">${esc(tip)}</p>`:""}
 <div class="sheetbtns">${canOverride&&!overridden?`<button class="ghost" id="override">My answer was right</button>`:""}<button class="main-btn" id="next">${last&&!overridden?(R.hearts<=0?"See results":"Finish"):R.i===R.qs.length-1?"Finish":"Continue"}</button></div>`;
 sh.classList.add("show");const act=$("#app .act");if(act)act.classList.add("hidden");requestAnimationFrame(()=>{$("#app").style.paddingBottom=(sh.offsetHeight+24)+"px"});
 const nb=$("#next");nb.focus({preventScroll:true});nb.onclick=next;
 if($("#override"))$("#override").onclick=()=>{const k=key(q);
  if(R.prev.srs){S.srs[k]=R.prev.srs;srsRight(k)}else delete S.srs[k];
  const sk=statKeys(q);[[S.stats.units,sk.u],[S.stats.verbs,sk.v],[S.stats.types,sk.t]].forEach(([o,x])=>{if(x&&o[x])o[x].r++});
  (S.acc[k]=S.acc[k]||[]).push(norm(q.user));R.right++;R.hearts=Math.min(R.L.lives,R.hearts+1);R.xp+=R.L.xp;R.wrongList.pop();save();
  showSheet(true,ans,en,"Saved — this answer will be accepted from now on.",true)};
}
function next(){if(R.hearts<=0||R.i>=R.qs.length-1)return results();R.i++;renderQ()}
function hideSheet(){const s=$("#sheet");if(s)s.classList.remove("show");const a=$("#app");if(a)a.style.paddingBottom=""}
function results(){
 stopTimer();hideSheet();
 if(R.mode==="place"){const b=R.bands.b||0,i=R.bands.i||0,f=R.bands.f||0;const lv=b>=3&&i>=3&&f>=3?"f":b>=3&&i>=3?"i":"b";
  if(lv!=="b")S.unl.i=true;if(lv==="f")S.unl.f=true;S.lv=lv;S.placed=true;save();VIEW="results";
  $("#app").innerHTML=`<p class="kind">Placement test</p><p class="score">${R.right}<small> / ${R.qs.length}</small></p>
  <p class="lede">We've placed you at <b>${LV[lv].name}</b>. ${lv==="b"?"Start here and the next level unlocks as you go.":lv==="i"?"Beginner is still open whenever you want an easier round.":"All three levels are open to you."}</p>
  <ul class="plist"><li><b>Beginner questions</b><span>${b} / 4</span></li><li><b>Intermediate questions</b><span>${i} / 4</span></li><li><b>Fluent questions</b><span>${f} / 4</span></li></ul>
  <div class="rbtns"><button class="main-btn" id="home">Start playing</button></div>`;window.scrollTo(0,0);$("#home").onclick=()=>go("play");return}const n=R.qs.length,perfect=R.right===n&&!["review","today"].includes(R.mode);if(perfect)R.xp+=20;
 S.xp+=R.xp;S.rounds++;markPlayed();const T=today();
 const goalNow=(S.days[T]||0)>=S.set.goal&&R.dayStart<S.set.goal;
 let unlockMsg="",newBest=false;const counts=["build","type","listen","forms","reply","gap","word","mix","exam","unit"].includes(R.mode);
 if(counts){const bk=R.lv+":"+(R.mode==="unit"?"unit:"+R.src:R.mode),prev=S.best[bk]||0,sc=Math.round(R.right/n*10);
  const nx=Object.keys(LV).find(l=>LV[l].prev===R.lv),was=nx&&unlocked(nx);
  if(sc>prev)S.best[bk]=sc;newBest=sc>prev&&prev>0;
  if(nx&&!was&&unlocked(nx)){S.unl[nx]=true;unlockMsg=`${LV[nx].name} is now unlocked.`}
  else if(nx&&!was&&sc>=UNLOCK){const h=passedGames(R.lv).length;unlockMsg=`${h} of ${NEED} games done towards ${LV[nx].name}.`}}
 save();
 const pct=R.right/n;
 const msg=R.mode==="exam"?(pct>=.6?"Exam passed — that's a solid B1 result.":"Not a pass yet — 60% is the mark. Your mistakes are in the review pile."):R.hearts<=0?"Out of lives. Your mistakes will come back for review.":perfect?"Perfect round. +20 bonus XP.":pct>=.7?"Solid work. Keep the streak going tomorrow.":"Every mistake comes back in your reviews, spaced out so it sticks.";
 const um=R.mode==="unit"?U.find(u=>u.id===R.src):null;
 const title=um?`Lekcja ${um.n} · ${um.t}`:R.mode==="today"?"Today's round":R.mode==="review"?"Review":R.mode==="exam"?"Exam round":R.mode==="verbs"?"Verb practice":`${LV[R.lv].name} · ${modeName(R.mode)}`;
 VIEW="results";
 $("#app").innerHTML=`<p class="kind">${esc(title)}</p><p class="score">${R.right}<small> / ${n}</small></p><p class="lede">${esc(msg)} You earned ${R.xp} XP.${newBest?" New best!":""}</p>
 ${goalNow?`<p class="lvinfo goalmsg">🎯 Daily goal reached — ${S.set.goal} questions today.</p>`:""}
 ${unlockMsg?`<p class="lvinfo">🌱 ${esc(unlockMsg)}</p>`:""}
 ${R.wrongList.length?`<h2>To remember</h2><ul class="misslist">${R.wrongList.map(([a,e])=>`<li><div><b>${esc(a)}</b><span>${esc(e)}</span></div>${spk(a.split("  /  ")[0])}</li>`).join("")}</ul>`:""}
 <div class="rbtns"><button class="main-btn" id="again">Play again</button>${um?`<button class="ghost" id="rule">Read the rule again</button>`:""}<button class="ghost" id="home">Home</button></div>`;
 window.scrollTo(0,0);const m=R.mode,src=R.src;
 $("#again").onclick=()=>start(m==="review"&&!dueList().length?"today":m,src);$("#home").onclick=()=>go("play");
 if($("#rule"))$("#rule").onclick=()=>{LESSON=src;go("lesson")};
}
document.addEventListener("keydown",e=>{
 if($("#modal")&&$("#modal").classList.contains("show")){if(e.key==="Escape")closeModal();return}
 if(e.key==="Enter"&&$("#sheet").classList.contains("show")&&e.target.id!=="next"&&e.target.id!=="override"){e.preventDefault();next();return}
 if(R&&VIEW==="game"&&!R.locked&&/^[1-4]$/.test(e.key)&&e.target.tagName!=="TEXTAREA"){const o=document.querySelectorAll(".opt:not(:disabled)")[+e.key-1];if(o)o.click()}});
/* ---------- conversation practice with Claude ---------- */
const TALK=[
 ["cafe","☕","At a café","Order a drink and something to eat, then pay.","You are a friendly barista in a café in Warsaw. The learner is your customer."],
 ["neighbour","🏠","A new neighbour","Introduce yourself and chat about where you're from.","You are a friendly Polish neighbour meeting the learner, who has just moved in next door."],
 ["plans","🍺","Weekend plans","Make plans to meet up: when, where and what to do.","You are the learner's Polish friend, making plans together for the weekend."],
 ["directions","🗺️","Asking the way","Find your way to the station, a pharmacy or a museum.","You are a local on a street in Kraków. The learner stops you to ask for directions."],
 ["doctor","🩺","At the doctor's","Say how you feel and understand the advice.","You are a calm family doctor. The learner is your patient with a bad cold."],
 ["interview","💼","Job interview","Talk about your experience and ask about the job.","You are a recruiter at a language school interviewing the learner for a job as an English teacher."],
 ["free","💬","Free chat","Talk about anything you like.","You are a friendly Polish conversation partner. Follow the learner's choice of topics."]];
const TALKLV={b:"Use very short, simple sentences (under 10 words), present tense, very common words. One sentence plus one simple question.",
 i:"Use simple everyday Polish. Past and future tenses are fine. At most two sentences.",
 f:"Speak natural spoken Polish to a B1 learner. At most three sentences; an occasional idiom is fine."};
const MAXTURNS=12;
let C=null;
function viewTalk(){
 $("#app").innerHTML=`<div class="bar"><button class="quit" id="back">← Play</button><span class="kind" style="margin:0">Talk with Claude</span></div>
 <h1 class="ph">Talk with Claude</h1><p class="small">Pick a situation. Claude plays the other person in Polish at <b>${LV[S.lv].name}</b> level, corrects your messages as you go, and gives you a summary at the end. Your mistakes go into your reviews.</p>
 <div class="modes">${TALK.map(t=>`<button class="mode" data-sc="${t[0]}"><b>${t[1]} ${esc(t[2])}</b><span>${esc(t[3])}</span></button>`).join("")}</div>`+tabbar("play");
 $("#back").onclick=()=>go("play");
 document.querySelector(".modes").onclick=e=>{const b=e.target.closest("[data-sc]");if(b){C={sc:TALK.find(t=>t[0]===b.dataset.sc),hist:[],busy:false,err:"",lv:S.lv};VIEW="chat";render();aiTurn()}};
}
function transcript(h){return h.map(t=>(t.who==="me"?"Learner: ":"You: ")+t.pl).join("\n")}
function aiTurn(){
 if(!C||C.busy)return;C.busy=true;C.err="";drawChat();
 const last=C.hist[C.hist.length-1],judging=last&&last.who==="me";
 const prompt=`You are role-playing in a Polish conversation-practice game for an English speaker. ${C.sc[4]} Stay in character. Level: ${LV[C.lv].name}. ${TALKLV[C.lv]} Use "ty" unless your role clearly calls for pan/pani. ${genderLine()}
Conversation so far:
${C.hist.length?transcript(C.hist):"(nothing yet: open the conversation with a short greeting and a simple question that fits the situation)"}
${judging?"First judge the learner's LAST message only: is it correct, natural Polish for what they meant? Small spelling slips count; missing Polish accents do not. Then reply in character and keep the conversation going.":""}
Reply with JSON only: {"reply":"your next line, in Polish","english":"English translation of your line","ok":${judging?"true or false":"true"},"note":"${judging?"if the learner's last message had a mistake, one short plain-English explanation of it; otherwise an empty string":""}","corrected":"${judging?"the learner's last message corrected, or an empty string if it was fine":""}"}`;
 AI.json(prompt,{modelTier:"default"}).then(r=>{
  if(!C)return;
  if(judging&&r&&r.ok===false){last.ok=false;last.note=String(r.note||"");last.corrected=String(r.corrected||"")}else if(judging)last.ok=true;
  if(r&&r.reply){C.hist.push({who:"ai",pl:String(r.reply),en:String(r.english||"")});if(S.set.sound)speak(String(r.reply))}
  C.busy=false;drawChat();
 }).catch(e=>{if(!C)return;C.busy=false;C.err=aiErr(e);drawChat()});
}
function mineCount(){return C?C.hist.filter(t=>t.who==="me").length:0}
function viewChat(){if(!C){go("talk");return}
 $("#app").innerHTML=`<div class="bar chatbar"><button class="quit" id="leave">← Leave</button><span class="kind" style="margin:0;flex:1">${C.sc[1]} ${esc(C.sc[2])} · ${LV[C.lv].name}</span><button class="tabbtn" id="finish">Finish</button></div>
 <div class="chat" id="chat" aria-live="polite"></div>
 <div class="composer" id="composer"><div class="keys" aria-label="Polish letters">${["ą","ć","ę","ł","ń","ó","ś","ź","ż"].map(c=>`<button data-k="${c}" aria-label="Insert ${c}">${c}</button>`).join("")}<button class="helpme" id="helpme">💡 Help me reply</button></div>
 <div class="crow"><textarea id="msg" rows="2" placeholder="Write in Polish…" aria-label="Your message in Polish" autocomplete="off" spellcheck="false"></textarea><button class="main-btn send" id="send" aria-label="Send">Send</button></div></div>`;
 const msg=$("#msg");
 $("#leave").onclick=()=>{if(!mineCount()){C=null;go("talk");return}ask("Leave this conversation?","You'll lose it without a summary. Tap Finish instead to get feedback and save your mistakes.","Leave",()=>{C=null;go("talk")})};
 $("#finish").onclick=finishTalk;
 $("#send").onclick=()=>{const v=msg.value.trim();if(!v||C.busy||mineCount()>=MAXTURNS)return;C.hist.push({who:"me",pl:v});msg.value="";C.hint="";aiTurn()};
 msg.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#send").click()}};
 document.querySelector("#composer .keys").onclick=e=>{const b=e.target.closest("[data-k]");if(!b)return;msg.setRangeText(b.dataset.k,msg.selectionStart,msg.selectionEnd,"end");msg.focus()};
 $("#helpme").onclick=()=>{if(C.busy)return;const b=$("#helpme");b.disabled=true;b.textContent="Thinking…";
  AI.json(`A learner of Polish (${LV[C.lv].name} level) is in this role-play: ${C.sc[4]}\nConversation:\n${transcript(C.hist)}\nSuggest ONE short, natural reply the learner could say next. ${TALKLV[C.lv]} ${genderLine()} Reply with JSON only: {"polish":"the suggested reply","english":"its English meaning"}`,{modelTier:"quick"})
  .then(r=>{C.hint=r&&r.polish?r:null;drawChat()}).catch(e=>{C.err=aiErr(e);drawChat()})};
 drawChat();setTimeout(()=>msg.focus({preventScroll:true}),60);
}
function drawChat(){
 const box=$("#chat");if(!box)return;
 box.innerHTML=C.hist.map((t,i)=>t.who==="ai"?`<div class="bub ai"><p>${esc(t.pl)}</p><div class="bubtools">${spk(t.pl)}<button class="entog" data-i="${i}">${t.showEn?"Hide English":"English"}</button></div>${t.showEn?`<p class="bubEn">${esc(t.en)}</p>`:""}</div>`
  :`<div class="bub me"><p>${esc(t.pl)}</p></div>${t.ok===false?`<div class="fix"><b>✎ ${esc(t.corrected||"")}</b>${t.note?`<span>${esc(t.note)}</span>`:""}</div>`:t.ok===true?`<div class="fix ok">✓ Good</div>`:""}`).join("")
  +(C.busy?`<div class="bub ai typing" aria-label="Claude is writing"><span></span><span></span><span></span></div>`:"")
  +(C.err?`<div class="fix err">${esc(C.err)} <button class="linkbtn" id="retry">Try again</button></div>`:"")
  +(C.hint?`<div class="hintcard"><b>Try saying:</b> ${esc(C.hint.polish)}<span>${esc(C.hint.english)}</span><button class="linkbtn" id="useHint">Use this</button></div>`:"")
  +(mineCount()>=MAXTURNS?`<div class="fix">That's ${MAXTURNS} messages — tap <b>Finish</b> for your feedback.</div>`:"");
 box.querySelectorAll(".entog").forEach(b=>b.onclick=()=>{const t=C.hist[+b.dataset.i];t.showEn=!t.showEn;drawChat()});
 if($("#retry"))$("#retry").onclick=()=>aiTurn();
 if($("#useHint"))$("#useHint").onclick=()=>{$("#msg").value=C.hint.polish;C.hint="";drawChat();$("#msg").focus()};
 const hb=$("#helpme");if(hb){hb.disabled=C.busy;hb.textContent="💡 Help me reply"}
 const sb=$("#send");if(sb)sb.disabled=C.busy||mineCount()>=MAXTURNS;
 const fb=$("#finish");if(fb)fb.disabled=C.busy||!mineCount();
 window.scrollTo(0,document.body.scrollHeight);
}
function finishTalk(){
 if(!C||C.busy||!mineCount())return;const n=mineCount();C.busy=true;
 const fb=$("#finish");if(fb){fb.disabled=true;fb.textContent="Reviewing…"}
 AI.json(`You review a Polish conversation-practice session for an English speaker at ${LV[C.lv].name} level. Situation: ${C.sc[4]}
Transcript ("Learner" is the student; "You" is the partner):
${transcript(C.hist)}
${genderLine()}
Reply with JSON only: {"summary":"2–3 encouraging, specific sentences in English about how the learner did","mistakes":[{"wrong":"the learner's original words","right":"the corrected Polish sentence","english":"English meaning of the corrected sentence","why":"a short reason"}]}
Include at most 5 mistakes, only real ones from the learner's messages; use [] if there were none.`,{modelTier:"default"}).then(r=>{
  const ms=(r&&Array.isArray(r.mistakes)?r.mistakes:[]).filter(m=>m&&m.right).slice(0,5);
  const T=today();
  ms.forEach(m=>{const pl=String(m.right).trim();const q={type:"type",s:{pl,en:String(m.english||"(from your conversation)"),k:"talk",alts:[pl],n:words(pl).length}};S.srs[key(q)]={q,box:0,due:T}});
  const xp=n*5+(n>=4?10:0);S.xp+=xp;S.rounds++;S.days[T]=(S.days[T]||0)+n;markPlayed();save();
  C.done={summary:String(r&&r.summary||""),mistakes:ms,xp};C.busy=false;VIEW="talkdone";render();
 }).catch(e=>{C.busy=false;C.err=aiErr(e);if(fb){fb.disabled=false;fb.textContent="Finish"}drawChat()});
}
function viewTalkDone(){if(!C||!C.done){go("talk");return}const d=C.done;
 $("#app").innerHTML=`<p class="kind">${C.sc[1]} ${esc(C.sc[2])} · ${LV[C.lv].name}</p><h1 class="ph">Nice conversation!</h1><p class="lede">${esc(d.summary)} You earned ${d.xp} XP.</p>
 ${d.mistakes.length?`<h2>Worth remembering</h2><ul class="misslist">${d.mistakes.map(m=>`<li><div><span class="wrongline">${esc(m.wrong||"")}</span><b>${esc(m.right)}</b><span>${esc(m.english||"")}${m.why?" — "+esc(m.why):""}</span></div>${spk(m.right)}</li>`).join("")}</ul><p class="small">${d.mistakes.length===1?"This sentence is":`These ${d.mistakes.length} sentences are`} now in your reviews.</p>`:`<p class="lvinfo">No mistakes worth saving — well done.</p>`}
 <div class="rbtns"><button class="main-btn" id="again">Talk again</button><button class="ghost" id="other">Another situation</button><button class="ghost" id="home">Home</button></div>`;
 window.scrollTo(0,0);
 $("#again").onclick=()=>{C={sc:C.sc,hist:[],busy:false,err:"",lv:S.lv};VIEW="chat";render();aiTurn()};
 $("#other").onclick=()=>{C=null;go("talk")};$("#home").onclick=()=>{C=null;go("play")};
}

render();
initSync();initAI();
