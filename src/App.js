/* eslint-disable */
import { useState, useRef, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, updateDoc, doc, setDoc
} from "firebase/firestore";

// ── CONSTANTS ─────────────────────────────────────────────────────
const USERS = [
  { id:"achraf", name:"Achraf", role:"Dad",         emoji:"👨", color:"#3B82F6", bg:"#eff6ff", birthday:"03-15" },
  { id:"loubna", name:"Loubna", role:"Mum",         emoji:"👩", color:"#EC4899", bg:"#fdf2f8", birthday:"07-22" },
  { id:"soltan", name:"Soltan", role:"Son 🎮",      emoji:"🧒", color:"#10B981", bg:"#ecfdf5", birthday:"11-05" },
  { id:"hasnae", name:"Hasnae", role:"Daughter 🌸", emoji:"👧", color:"#F59E0B", bg:"#fffbeb", birthday:"04-12" },
];
const DEVICE_PRESETS = {
  achraf:{ device:"phone",  label:"📱 Dad's Phone" },
  loubna:{ device:"phone",  label:"📱 Mum's Phone" },
  soltan:{ device:"tablet", label:"📟 Soltan's Tablet" },
  hasnae:{ device:"tablet", label:"📟 Hasnae's Tablet" },
};
const EMOJI_REACTIONS = ["❤️","😂","😮","👍","🎉","🔥","😢","😍","🤩","👏","💯","🥳"];
const STICKER_PACKS = {
  "✨ Fun":   ["🌈","⭐","🦄","🍕","🎮","🐶","🐱","🦁","🎨","🎵","🏆","🌟","🌺","🦋","🍦","🎀","🎪","🎭","🎬","🎤"],
  "❤️ Love":  ["❤️","💕","💖","💗","💓","💞","💝","💘","💟","🥰","😘","💏","👨‍👩‍👧‍👦","🏠","🌹","💐","🌷","🍀","✨","💫"],
  "😄 Faces": ["😂","🤣","😅","😊","🥹","😍","🤩","🥳","😎","🤓","🧐","😏","🤔","😴","🥱","😤","🤯","🥸","😵","🤑"],
  "🌍 World": ["🌍","🌏","🌎","⛰️","🏔️","🌋","🏝️","🏜️","🌊","🌅","🌄","🌃","🌆","🌇","🌉","🎑","🏞️","🌌","🌠","🎆"],
  "🍔 Food":  ["🍕","🍔","🌮","🍜","🍣","🍦","🎂","🍰","🧁","🍩","🍪","🍫","🍬","🍭","🥤","🧃","🍵","☕","🥛","🍷"],
  "🏅 Sports":["⚽","🏀","🎾","🏈","⚾","🎱","🏓","🏸","🥊","🎯","🎳","⛳","🏆","🥇","🎖️","🏅","🎗️","🏋️","🤸","⛷️"],
};
const QUIZ_QUESTIONS = [
  {q:"What is the capital of France?",opts:["London","Paris","Berlin","Madrid"],a:"Paris"},
  {q:"How many legs does a spider have?",opts:["6","8","10","4"],a:"8"},
  {q:"What is 7 × 8?",opts:["54","56","48","63"],a:"56"},
  {q:"Which is the fastest land animal?",opts:["Lion","Horse","Cheetah","Eagle"],a:"Cheetah"},
  {q:"How many continents are there?",opts:["5","6","7","8"],a:"7"},
  {q:"What is the largest ocean?",opts:["Atlantic","Indian","Pacific","Arctic"],a:"Pacific"},
  {q:"What is 15 + 27?",opts:["40","41","42","43"],a:"42"},
  {q:"Which planet is closest to the sun?",opts:["Venus","Mars","Mercury","Earth"],a:"Mercury"},
  {q:"How many sides does a hexagon have?",opts:["5","6","7","8"],a:"6"},
  {q:"What is 144 ÷ 12?",opts:["11","12","13","14"],a:"12"},
  {q:"What is the capital of Morocco?",opts:["Casablanca","Rabat","Marrakech","Fes"],a:"Rabat"},
  {q:"How many teeth does an adult human have?",opts:["28","30","32","34"],a:"32"},
  {q:"What is the boiling point of water (°C)?",opts:["90","95","100","110"],a:"100"},
  {q:"Which is the smallest planet?",opts:["Mars","Mercury","Pluto","Venus"],a:"Mercury"},
  {q:"How many hours in 3 days?",opts:["60","72","84","48"],a:"72"},
];

// ── EDUCATION QUESTIONS ───────────────────────────────────────────
const EDU_QUESTIONS = {
  year2: [
    {q:"What is 5 + 7?",opts:["10","11","12","13"],a:"12",subject:"➕ Maths"},
    {q:"How many sides does a triangle have?",opts:["2","3","4","5"],a:"3",subject:"📐 Maths"},
    {q:"What is 10 - 4?",opts:["5","6","7","8"],a:"6",subject:"➕ Maths"},
    {q:"Which animal says 'Moo'?",opts:["Dog","Cat","Cow","Sheep"],a:"Cow",subject:"🐾 Science"},
    {q:"What colour is the sky on a sunny day?",opts:["Green","Blue","Red","Yellow"],a:"Blue",subject:"🌍 Science"},
    {q:"How many days in a week?",opts:["5","6","7","8"],a:"7",subject:"📅 General"},
    {q:"What is 3 × 2?",opts:["4","5","6","7"],a:"6",subject:"➕ Maths"},
    {q:"Which is the biggest?",opts:["Cat","Mouse","Elephant","Dog"],a:"Elephant",subject:"🐾 Science"},
    {q:"What comes after Wednesday?",opts:["Tuesday","Thursday","Friday","Monday"],a:"Thursday",subject:"📅 General"},
    {q:"How many legs does a dog have?",opts:["2","4","6","8"],a:"4",subject:"🐾 Science"},
  ],
  year5: [
    {q:"What is 12 × 12?",opts:["132","144","124","148"],a:"144",subject:"➕ Maths"},
    {q:"What is the capital of England?",opts:["Manchester","Birmingham","London","Leeds"],a:"London",subject:"🌍 Geography"},
    {q:"What is 256 ÷ 8?",opts:["30","32","34","36"],a:"32",subject:"➕ Maths"},
    {q:"What planet is known as the Red Planet?",opts:["Jupiter","Venus","Mars","Saturn"],a:"Mars",subject:"🚀 Science"},
    {q:"What is the powerhouse of the cell?",opts:["Nucleus","Mitochondria","Ribosome","Cell wall"],a:"Mitochondria",subject:"🔬 Science"},
    {q:"What is 15% of 200?",opts:["25","30","35","40"],a:"30",subject:"➕ Maths"},
    {q:"How many metres in a kilometre?",opts:["100","500","1000","10000"],a:"1000",subject:"📏 Maths"},
    {q:"Which gas do plants absorb?",opts:["Oxygen","Nitrogen","Carbon Dioxide","Hydrogen"],a:"Carbon Dioxide",subject:"🌿 Science"},
    {q:"What is the largest country by area?",opts:["China","USA","Canada","Russia"],a:"Russia",subject:"🌍 Geography"},
    {q:"What is 7²?",opts:["42","47","49","56"],a:"49",subject:"➕ Maths"},
  ],
};

const WORDS = ["FAMILY","SMILE","HAPPY","HEART","STARS","GAMES","PIZZA","MUSIC","DANCE","MAGIC","BRAVE","CLOUD","LIGHT","DREAM","SWEET","OCEAN","TIGER","PIANO","BREAD","STONE"];
const CARD_EMOJIS = ["🐶","🐱","🦁","🐸","🦋","🌸","⭐","🎮","🍕","🎨","🏆","🌈","🦄","🎵","🐬","🌺"];
const WORDLE_WORDS = ["HAPPY","SMILE","BRAVE","DANCE","LIGHT","OCEAN","TIGER","DREAM","SWEET","MAGIC","PIANO","FLAME","GLOBE","NIGHT","RIVER","STORM","CLOUD","BREAD","STONE","HEART"];
const SPIN_ITEMS = ["👨 Dad pays!","👩 Mum chooses!","🧒 Soltan's pick!","👧 Hasnae's pick!","🍕 Pizza night!","🎮 Game time!","🎬 Movie night!","🍦 Ice cream!","🌳 Park trip!","📖 Story time!","🎵 Dance party!","😴 Early bed!"];
const UNO_COLORS = ["red","green","blue","yellow"];
const UNO_VALUES = ["0","1","2","3","4","5","6","7","8","9","⛔","↩️","+2"];
const UNO_COLOR_MAP = {red:"#EF4444",green:"#10B981",blue:"#3B82F6",yellow:"#F59E0B"};

const fmt = d => d&&d.toDate ? d.toDate().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});

// ── HELPER: ADD LEADERBOARD POINTS ────────────────────────────────
const addPoints = async (userId, pts) => {
  try {
    const ref = doc(db,"leaderboard","scores");
    await setDoc(ref, {[userId]: pts}, {merge:true});
    // We use merge:true so it adds — but since Firestore doesn't support increment without import,
    // we track per-game wins as whole number overrides. Simple enough for a family app.
  } catch(e) {}
};

// ── BIRTHDAY BANNER ───────────────────────────────────────────────
function BirthdayBanner() {
  const today = new Date();
  const mm = String(today.getMonth()+1).padStart(2,"0");
  const dd = String(today.getDate()).padStart(2,"0");
  const todayStr = mm+"-"+dd;
  const upcoming = USERS.map(u=>{
    const [bm,bd] = u.birthday.split("-");
    const bDate = new Date(today.getFullYear(), parseInt(bm)-1, parseInt(bd));
    if(bDate < today) bDate.setFullYear(today.getFullYear()+1);
    const days = Math.ceil((bDate - today)/86400000);
    return {...u, days, isToday: u.birthday===todayStr};
  }).filter(u=>u.days<=7||u.isToday).sort((a,b)=>a.days-b.days);
  if(!upcoming.length) return null;
  const next = upcoming[0];
  return (
    <div style={{background:"linear-gradient(135deg,#FF6B6B,#FF8E53)",padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:24}}>🎂</span>
      <div style={{color:"white",fontWeight:800,fontSize:13}}>
        {next.isToday ? `🥳 Happy Birthday ${next.emoji} ${next.name}! Today is your special day!`
          : `${next.emoji} ${next.name}'s birthday in ${next.days} day${next.days!==1?"s":""}! 🎉`}
      </div>
    </div>
  );
}

// ── GREETING BANNER ───────────────────────────────────────────────
function GreetingBanner({ activeUser }) {
  const hour = new Date().getHours();
  const user = USERS.find(u=>u.id===activeUser);
  let msg, emoji, bg;
  if(hour>=5&&hour<12)       { msg="Good Morning";   emoji="🌅"; bg="linear-gradient(135deg,#FF9A56,#FFCD3C)"; }
  else if(hour>=12&&hour<17) { msg="Good Afternoon"; emoji="☀️"; bg="linear-gradient(135deg,#56CCF2,#2F80ED)"; }
  else if(hour>=17&&hour<21) { msg="Good Evening";   emoji="🌆"; bg="linear-gradient(135deg,#F093FB,#F5576C)"; }
  else                       { msg="Good Night";     emoji="🌙"; bg="linear-gradient(135deg,#4776E6,#8E54E9)"; }
  return (
    <div style={{background:bg,padding:"8px 16px",display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:18}}>{emoji}</span>
      <span style={{color:"white",fontWeight:800,fontSize:12}}>{msg}, {user?.name}! {user?.emoji}</span>
    </div>
  );
}

// ── LEADERBOARD ───────────────────────────────────────────────────
function LeaderboardPanel({ activeUser, onClose }) {
  const [scores,setScores] = useState({});
  const user = USERS.find(u=>u.id===activeUser);
  useEffect(()=>{ return onSnapshot(doc(db,"leaderboard","scores"),snap=>{ if(snap.exists()) setScores(snap.data()); }); },[]);
  const sorted = USERS.map(u=>({...u,pts:scores[u.id]||0})).sort((a,b)=>b.pts-a.pts);
  const medals = ["🥇","🥈","🥉","4️⃣"];
  return (
    <div style={{flex:1,overflowY:"auto",padding:20,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:22,fontWeight:900,textAlign:"center",marginBottom:4,color:user?.color}}>🏆 Family Leaderboard</div>
      <div style={{fontSize:12,color:"#aaa",fontWeight:700,textAlign:"center",marginBottom:20}}>Points from games & completing tasks!</div>
      {sorted.map((u,i)=>(
        <div key={u.id} style={{display:"flex",alignItems:"center",gap:14,background:i===0?"linear-gradient(135deg,#FFF9C4,#FFF3A0)":"white",border:"2px solid "+(i===0?"#F59E0B":u.color+"44"),borderRadius:16,padding:"14px 18px",marginBottom:10,boxShadow:i===0?"0 4px 20px #F59E0B33":"none"}}>
          <div style={{fontSize:28}}>{medals[i]}</div>
          <div style={{fontSize:32}}>{u.emoji}</div>
          <div style={{flex:1}}><div style={{fontWeight:900,fontSize:16,color:u.color}}>{u.name}</div><div style={{fontSize:11,color:"#aaa",fontWeight:700}}>{u.role}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:26,fontWeight:900,color:u.color}}>{u.pts}</div><div style={{fontSize:10,color:"#aaa",fontWeight:700}}>pts</div></div>
        </div>
      ))}
      <div style={{background:"#f8f8f8",borderRadius:16,padding:14,marginTop:8,fontSize:12,color:"#888",fontWeight:700,textAlign:"center"}}>Win games 🎮 · Answer quizzes ❓ · Complete tasks ✓</div>
      <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:16}}>← Back</button>
    </div>
  );
}

// ── PHOTO ALBUM ───────────────────────────────────────────────────
function PhotoAlbum({ activeUser, onClose }) {
  const [photos,setPhotos] = useState([]);
  const [selected,setSelected] = useState(null);
  const fileRef = useRef(null);
  const user = USERS.find(u=>u.id===activeUser);
  useEffect(()=>{ return onSnapshot(query(collection(db,"album"),orderBy("time","desc")),snap=>{ const p=[]; snap.forEach(d=>p.push({id:d.id,...d.data()})); setPhotos(p); }); },[]);
  const upload = e => {
    const file=e.target.files[0]; if(!file) return;
    const r=new FileReader();
    r.onload=async ev=>{ await addDoc(collection(db,"album"),{photo:ev.target.result,uploader:activeUser,time:serverTimestamp()}); };
    r.readAsDataURL(file);
  };
  return (
    <div style={{flex:1,overflowY:"auto",padding:16,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:20,fontWeight:900,textAlign:"center",marginBottom:4,color:user?.color}}>📸 Family Album</div>
      <div style={{fontSize:12,color:"#aaa",fontWeight:700,textAlign:"center",marginBottom:14}}>Our precious memories 💕</div>
      <button onClick={()=>fileRef.current.click()} style={{width:"100%",padding:"12px",borderRadius:20,background:user?.color,color:"white",border:"none",fontWeight:900,cursor:"pointer",fontFamily:"inherit",marginBottom:14,fontSize:15}}>📷 Add Photo</button>
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={upload}/>
      {photos.length===0&&<div style={{textAlign:"center",padding:40,color:"#aaa",fontWeight:700}}>No photos yet! Add your first memory 📸</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {photos.map(p=>{ const up=USERS.find(u=>u.id===p.uploader); return (
          <div key={p.id} onClick={()=>setSelected(p)} style={{borderRadius:16,overflow:"hidden",border:"2px solid "+up?.color+"44",cursor:"pointer",position:"relative"}}>
            <img src={p.photo} alt="memory" style={{width:"100%",height:120,objectFit:"cover",display:"block"}}/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,0.6))",padding:"4px 8px",fontSize:11,color:"white",fontWeight:700}}>{up?.emoji} {up?.name}</div>
          </div>
        ); })}
      </div>
      {selected&&(
        <div onClick={()=>setSelected(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{maxWidth:400,width:"100%"}}>
            <img src={selected.photo} alt="full" style={{width:"100%",borderRadius:16,display:"block"}}/>
            <div style={{color:"white",textAlign:"center",marginTop:10,fontSize:13,fontWeight:700}}>Tap to close</div>
          </div>
        </div>
      )}
      <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:16}}>← Back</button>
    </div>
  );
}

// ── FAMILY JOURNAL ────────────────────────────────────────────────
function JournalPanel({ activeUser, onClose }) {
  const [entries,setEntries] = useState([]);
  const [writing,setWriting] = useState(false);
  const [text,setText] = useState("");
  const [mood,setMood] = useState("😊");
  const user = USERS.find(u=>u.id===activeUser);
  const MOODS = ["😊","😂","😍","🥳","😴","😤","🥹","🤩"];
  useEffect(()=>{ return onSnapshot(query(collection(db,"journal"),orderBy("time","desc")),snap=>{ const e=[]; snap.forEach(d=>e.push({id:d.id,...d.data()})); setEntries(e); }); },[]);
  const save = async () => {
    if(!text.trim()) return;
    await addDoc(collection(db,"journal"),{text:text.trim(),mood,author:activeUser,time:serverTimestamp()});
    setText(""); setMood("😊"); setWriting(false);
  };
  return (
    <div style={{flex:1,overflowY:"auto",padding:16,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:20,fontWeight:900,textAlign:"center",marginBottom:4,color:user?.color}}>📖 Family Journal</div>
      <div style={{fontSize:12,color:"#aaa",fontWeight:700,textAlign:"center",marginBottom:14}}>Write thoughts & memories</div>
      <button onClick={()=>setWriting(!writing)} style={{width:"100%",padding:"12px",borderRadius:20,background:user?.color,color:"white",border:"none",fontWeight:900,cursor:"pointer",fontFamily:"inherit",marginBottom:14}}>{writing?"✕ Cancel":"✏️ Write Entry"}</button>
      {writing&&(
        <div style={{background:"white",borderRadius:16,padding:16,marginBottom:16,border:"2px solid "+user?.color}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
            {MOODS.map(m=><span key={m} onClick={()=>setMood(m)} style={{fontSize:24,cursor:"pointer",padding:4,borderRadius:10,background:mood===m?"#f0f0f0":"transparent",border:mood===m?"2px solid #ddd":"2px solid transparent"}}>{m}</span>)}
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="What's on your mind today?" rows={4}
            style={{width:"100%",border:"2px solid "+user?.color,borderRadius:12,padding:"10px 14px",fontSize:14,fontFamily:"inherit",fontWeight:600,outline:"none",boxSizing:"border-box",resize:"none",marginBottom:10}}/>
          <button onClick={save} disabled={!text.trim()} style={{width:"100%",padding:"10px",borderRadius:20,background:text.trim()?user?.color:"#ddd",color:"white",border:"none",fontWeight:900,cursor:text.trim()?"pointer":"default",fontFamily:"inherit"}}>Save Entry 📖</button>
        </div>
      )}
      {entries.map(e=>{ const author=USERS.find(u=>u.id===e.author); const date=e.time?.toDate?.()?.toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"})||"Just now"; return (
        <div key={e.id} style={{background:"white",border:"2px solid "+author?.color+"33",borderRadius:16,padding:"14px 16px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{fontSize:24}}>{e.mood}</span>
            <div><div style={{fontWeight:800,fontSize:13,color:author?.color}}>{author?.emoji} {author?.name}</div><div style={{fontSize:10,color:"#bbb",fontWeight:600}}>{date}</div></div>
          </div>
          <div style={{fontSize:14,color:"#1e1e1e",lineHeight:1.6,fontWeight:600}}>{e.text}</div>
        </div>
      ); })}
      {entries.length===0&&!writing&&<div style={{textAlign:"center",padding:40,color:"#aaa",fontWeight:700}}>No entries yet! ✏️</div>}
      <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>← Back</button>
    </div>
  );
}

// ── YOUTUBE MODAL ─────────────────────────────────────────────────
function YoutubeModal({ onSend, onClose }) {
  const [url,setUrl] = useState("");
  const valid = url.includes("youtube.com")||url.includes("youtu.be");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"white",borderRadius:24,padding:24,width:"100%",maxWidth:360,fontFamily:"'Nunito',sans-serif"}}>
        <div style={{fontSize:20,fontWeight:900,marginBottom:16,textAlign:"center"}}>🎵 Share YouTube</div>
        <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste YouTube link here..."
          style={{width:"100%",border:"2px solid #EF4444",borderRadius:12,padding:"10px 14px",fontSize:14,fontFamily:"inherit",fontWeight:700,outline:"none",boxSizing:"border-box",marginBottom:16}}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          <button onClick={()=>valid&&onSend(url)} disabled={!valid} style={{flex:1,padding:"11px",borderRadius:20,background:valid?"#EF4444":"#ddd",color:"white",border:"none",fontWeight:900,cursor:valid?"pointer":"default",fontFamily:"inherit"}}>Share 🎵</button>
        </div>
      </div>
    </div>
  );
}

// ── YOUTUBE MESSAGE ───────────────────────────────────────────────
function YoutubeMessage({ msg }) {
  const url = msg.youtubeUrl; if(!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
  const videoId = match?.[1];
  const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  return (
    <div style={{borderRadius:12,overflow:"hidden",border:"2px solid #EF4444",maxWidth:240,cursor:"pointer"}} onClick={()=>window.open(url,"_blank")}>
      {thumb&&<img src={thumb} alt="yt" style={{width:"100%",display:"block"}}/>}
      <div style={{background:"#FEF2F2",padding:"8px 10px",display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:18}}>▶️</span>
        <div><div style={{fontSize:11,fontWeight:800,color:"#EF4444"}}>YouTube Video</div><div style={{fontSize:10,color:"#888",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:170}}>{url}</div></div>
      </div>
    </div>
  );
}

// ── SPIN THE WHEEL ────────────────────────────────────────────────
function SpinWheel({ onClose }) {
  const [spinning,setSpinning] = useState(false);
  const [result,setResult] = useState(null);
  const [rotation,setRotation] = useState(0);
  const canvasRef = useRef(null);
  const COLORS = ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F","#BB8FCE","#85C1E9","#82E0AA","#F1948A"];

  const drawWheel = (rot) => {
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"), cx=150, cy=150, r=138;
    const slice=(2*Math.PI)/SPIN_ITEMS.length;
    ctx.clearRect(0,0,300,300);
    SPIN_ITEMS.forEach((item,i)=>{
      const start=rot+i*slice;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,start+slice); ctx.closePath();
      ctx.fillStyle=COLORS[i%COLORS.length]; ctx.fill(); ctx.strokeStyle="white"; ctx.lineWidth=2; ctx.stroke();
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(start+slice/2);
      ctx.textAlign="right"; ctx.fillStyle="white"; ctx.font="bold 10px Nunito,sans-serif";
      ctx.fillText(item,r-6,4); ctx.restore();
    });
    ctx.beginPath(); ctx.moveTo(cx+r+12,cy); ctx.lineTo(cx+r-8,cy-8); ctx.lineTo(cx+r-8,cy+8); ctx.closePath(); ctx.fillStyle="#222"; ctx.fill();
  };

  useEffect(()=>{ drawWheel(0); },[]);

  const spin = () => {
    if(spinning) return; setSpinning(true); setResult(null);
    const extra=Math.random()*2*Math.PI+8*Math.PI, target=rotation+extra, start=Date.now(), dur=3500;
    const animate=()=>{
      const t=Date.now()-start, p=Math.min(t/dur,1), ease=1-Math.pow(1-p,3), cur=rotation+(target-rotation)*ease;
      drawWheel(cur);
      if(p<1){ requestAnimationFrame(animate); }
      else {
        const finalRot=target%(2*Math.PI); setRotation(finalRot);
        const slice=(2*Math.PI)/SPIN_ITEMS.length;
        const idx=Math.floor(SPIN_ITEMS.length-((finalRot/slice)%SPIN_ITEMS.length))%SPIN_ITEMS.length;
        setResult(SPIN_ITEMS[Math.abs(idx)%SPIN_ITEMS.length]); setSpinning(false);
      }
    };
    requestAnimationFrame(animate);
  };

  return (
    <div style={{padding:16,fontFamily:"'Nunito',sans-serif",textAlign:"center"}}>
      <div style={{fontSize:20,fontWeight:900,marginBottom:4}}>🎰 Spin the Wheel!</div>
      <div style={{fontSize:12,color:"#aaa",fontWeight:700,marginBottom:12}}>What will the family do next?</div>
      <canvas ref={canvasRef} width={300} height={300} onClick={spin} style={{maxWidth:"100%",cursor:"pointer",borderRadius:"50%",boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}/>
      <div style={{marginTop:12}}>
        <button onClick={spin} disabled={spinning} style={{padding:"12px 32px",borderRadius:24,background:spinning?"#ddd":"linear-gradient(135deg,#FF6B6B,#FF8E53)",color:"white",border:"none",fontWeight:900,fontSize:16,cursor:spinning?"default":"pointer",fontFamily:"inherit"}}>
          {spinning?"Spinning... 🌀":"🎰 SPIN!"}
        </button>
      </div>
      {result&&<div style={{marginTop:12,background:"linear-gradient(135deg,#FFF9C4,#FFF3A0)",border:"2px solid #F59E0B",borderRadius:16,padding:"12px 20px",fontSize:16,fontWeight:900,color:"#92400E"}}>🎉 {result}</div>}
      <button onClick={onClose} style={{width:"100%",padding:"10px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:12}}>Close</button>
    </div>
  );
}

// ── WORDLE ────────────────────────────────────────────────────────
function WordleGame({ activeUser, onClose }) {
  const [gs,setGs] = useState(null);
  const [setup,setSetup] = useState(true);
  const [guess,setGuess] = useState("");
  useEffect(()=>{ if(setup)return; return onSnapshot(doc(db,"games","wordle"),snap=>{ if(snap.exists()) setGs(snap.data()); }); },[setup]);
  const startGame = async () => {
    const word=WORDLE_WORDS[Math.floor(Math.random()*WORDLE_WORDS.length)];
    await setDoc(doc(db,"games","wordle"),{word,guesses:[],gameOver:false,winner:null});
    setSetup(false);
  };
  const submitGuess = async () => {
    if(!gs||guess.length!==5||gs.gameOver) return;
    const g=guess.toUpperCase();
    const newGuesses=[...(gs.guesses||[]),{word:g,player:activeUser}];
    const won=g===gs.word, lost=!won&&newGuesses.length>=6;
    await updateDoc(doc(db,"games","wordle"),{guesses:newGuesses,gameOver:won||lost,winner:won?activeUser:null});
    if(won) addPoints(activeUser,5);
    setGuess("");
  };
  const getColors = (gw,target) => gw.split("").map((l,i)=>{ if(l===target[i]) return "#10B981"; if(target.includes(l)) return "#F59E0B"; return "#9CA3AF"; });
  if(setup) return (
    <div style={{padding:20,fontFamily:"'Nunito',sans-serif",textAlign:"center"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:8}}>🟩 Family Wordle</div>
      <div style={{background:"#ecfdf5",borderRadius:12,padding:"10px 14px",marginBottom:20,fontSize:12,fontWeight:700,color:"#10B981"}}>Guess the 5-letter word in 6 tries!<br/>🟩 Right spot &nbsp; 🟨 Wrong spot &nbsp; ⬜ Not in word</div>
      <button onClick={startGame} style={{width:"100%",padding:"12px",borderRadius:20,background:"#10B981",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Start Wordle 🟩</button>
      <button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button>
    </div>
  );
  if(!gs) return <div style={{padding:40,textAlign:"center",color:"#aaa"}}>Loading... ⏳</div>;
  const rows=[...(gs.guesses||[]),...Array(Math.max(0,6-(gs.guesses||[]).length)).fill(null)];
  const wu=gs.winner?USERS.find(u=>u.id===gs.winner):null;
  return (
    <div style={{padding:16,fontFamily:"'Nunito',sans-serif",textAlign:"center"}}>
      <div style={{fontSize:18,fontWeight:900,marginBottom:10}}>🟩 Family Wordle</div>
      <div style={{display:"inline-flex",flexDirection:"column",gap:4,marginBottom:14}}>
        {rows.map((g,row)=>{ const colors=g?getColors(g.word,gs.word):null; const player=g?USERS.find(u=>u.id===g.player):null; return (
          <div key={row} style={{display:"flex",gap:4,alignItems:"center"}}>
            {Array(5).fill(0).map((_,col)=>{ const letter=g?.word[col]||""; const bg=colors?colors[col]:"#F3F4F6"; return <div key={col} style={{width:46,height:46,borderRadius:8,border:"2px solid "+(letter?"transparent":"#E5E7EB"),background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:colors?"white":"#1e1e1e"}}>{letter}</div>; })}
            {player&&<div style={{fontSize:16,marginLeft:4}}>{player.emoji}</div>}
          </div>
        ); })}
      </div>
      {gs.gameOver?(
        <div>
          {wu?<div style={{fontSize:16,fontWeight:900,color:"#10B981",marginBottom:8}}>🎉 {wu.emoji} {wu.name} got it! +5 pts</div>
             :<div style={{fontSize:16,fontWeight:900,color:"#EF4444",marginBottom:8}}>😢 Word was: <b>{gs.word}</b></div>}
          <button onClick={()=>setSetup(true)} style={{padding:"10px 24px",borderRadius:20,background:"#10B981",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Play Again 🔄</button>
        </div>
      ):(
        <div style={{display:"flex",gap:8,justifyContent:"center"}}>
          <input value={guess} onChange={e=>setGuess(e.target.value.toUpperCase().slice(0,5))} onKeyDown={e=>e.key==="Enter"&&submitGuess()}
            placeholder="5 letters..."
            style={{border:"2px solid #10B981",borderRadius:20,padding:"10px 16px",fontSize:16,fontFamily:"inherit",fontWeight:800,outline:"none",textAlign:"center",letterSpacing:6,width:180}}/>
          <button onClick={submitGuess} disabled={guess.length!==5} style={{padding:"10px 18px",borderRadius:20,background:guess.length===5?"#10B981":"#ddd",color:"white",border:"none",fontWeight:800,cursor:guess.length===5?"pointer":"default",fontFamily:"inherit"}}>Go!</button>
        </div>
      )}
      <button onClick={onClose} style={{display:"block",margin:"12px auto 0",padding:"8px 20px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Close</button>
    </div>
  );
}

// ── EDUCATION QUIZ ────────────────────────────────────────────────
function EduQuiz({ activeUser, onClose }) {
  const [year,setYear] = useState(null);
  const [qi,setQi] = useState(0);
  const [score,setScore] = useState(0);
  const [answered,setAnswered] = useState(null);
  const [done,setDone] = useState(false);
  const user = USERS.find(u=>u.id===activeUser);
  const questions = year?EDU_QUESTIONS[year]:[];
  const q = questions[qi];
  const answer = async(opt)=>{
    if(answered) return; setAnswered(opt);
    const correct=opt===q.a, newScore=correct?score+1:score;
    if(correct) setScore(newScore);
    setTimeout(()=>{ if(qi+1>=questions.length){ setDone(true); addPoints(activeUser,newScore); } else { setQi(qi+1); setAnswered(null); } },1200);
  };
  if(!year) return (
    <div style={{padding:20,fontFamily:"'Nunito',sans-serif",textAlign:"center"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:8}}>📚 Education Quiz</div>
      <div style={{fontSize:13,color:"#888",fontWeight:700,marginBottom:20}}>Choose your school year</div>
      <button onClick={()=>setYear("year2")} style={{width:"100%",padding:"18px",borderRadius:20,background:"linear-gradient(135deg,#10B981,#059669)",color:"white",border:"none",fontWeight:900,fontSize:16,cursor:"pointer",fontFamily:"inherit",marginBottom:12}}>🌟 Year 2 <span style={{fontSize:12}}>(Ages 6-7)</span></button>
      <button onClick={()=>setYear("year5")} style={{width:"100%",padding:"18px",borderRadius:20,background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",color:"white",border:"none",fontWeight:900,fontSize:16,cursor:"pointer",fontFamily:"inherit",marginBottom:12}}>🚀 Year 5 <span style={{fontSize:12}}>(Ages 9-10)</span></button>
      <button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
    </div>
  );
  if(done) return (
    <div style={{padding:24,textAlign:"center",fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:48,marginBottom:8}}>{score>=questions.length*0.8?"🏆":score>=questions.length*0.5?"🌟":"💪"}</div>
      <div style={{fontSize:20,fontWeight:900,marginBottom:4,color:user?.color}}>{score}/{questions.length} correct!</div>
      <div style={{fontSize:13,color:"#888",fontWeight:700,marginBottom:16}}>+{score} points earned!</div>
      <button onClick={()=>{setYear(null);setQi(0);setScore(0);setAnswered(null);setDone(false);}} style={{padding:"10px 24px",borderRadius:20,background:user?.color,color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginRight:8}}>Try Again 🔄</button>
      <button onClick={onClose} style={{padding:"10px 24px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Close</button>
    </div>
  );
  return (
    <div style={{padding:16,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:16,fontWeight:900,textAlign:"center",marginBottom:4}}>📚 {year==="year2"?"Year 2":"Year 5"} Quiz</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:12,color:"#aaa",fontWeight:700}}>Q {qi+1}/{questions.length}</div>
        <div style={{fontSize:12,fontWeight:800,color:user?.color}}>Score: {score} ⭐</div>
        <div style={{fontSize:10,background:"#f0f0f0",borderRadius:20,padding:"2px 8px",fontWeight:700,color:"#888"}}>{q.subject}</div>
      </div>
      <div style={{height:4,background:"#eee",borderRadius:2,marginBottom:12}}><div style={{height:"100%",width:((qi/questions.length)*100)+"%",background:year==="year2"?"#10B981":"#3B82F6",borderRadius:2,transition:"width 0.3s"}}/></div>
      <div style={{background:year==="year2"?"#ecfdf5":"#eff6ff",border:"2px solid "+(year==="year2"?"#10B981":"#3B82F6"),borderRadius:16,padding:16,marginBottom:14,textAlign:"center"}}>
        <div style={{fontSize:16,fontWeight:800,color:"#1e1e1e"}}>{q.q}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {q.opts.map(opt=>{ let bg="white",border="2px solid #eee",color="#1e1e1e"; if(answered){ if(opt===q.a){bg="#ecfdf5";border="2px solid #10B981";color="#10B981";}else if(opt===answered){bg="#fef2f2";border="2px solid #EF4444";color="#EF4444";} } return <button key={opt} onClick={()=>answer(opt)} disabled={!!answered} style={{padding:"12px 8px",borderRadius:14,border,background:bg,fontWeight:800,fontSize:13,cursor:answered?"default":"pointer",fontFamily:"inherit",color,transition:"all 0.2s"}}>{opt}</button>; })}
      </div>
      {answered&&<div style={{textAlign:"center",marginTop:10,fontSize:15,fontWeight:900,color:answered===q.a?"#10B981":"#EF4444"}}>{answered===q.a?"✅ Correct!":"❌ Answer: "+q.a}</div>}
    </div>
  );
}

// ── UNO STYLE CARD GAME ───────────────────────────────────────────
function UnoGame({ activeUser, onClose }) {
  const [gs,setGs] = useState(null);
  const [setup,setSetup] = useState(true);
  const [players,setPlayers] = useState([activeUser]);

  useEffect(()=>{ if(setup)return; return onSnapshot(doc(db,"games","uno"),snap=>{ if(snap.exists()) setGs(snap.data()); }); },[setup]);

  const makeCard = (color,value) => ({color,value,id:color+value+Math.random()});
  const makeDeck = () => {
    const deck=[];
    UNO_COLORS.forEach(c=>{ UNO_VALUES.forEach(v=>{ deck.push(makeCard(c,v)); if(v!=="0") deck.push(makeCard(c,v)); }); });
    return deck.sort(()=>Math.random()-0.5);
  };

  const startGame = async () => {
    const deck=makeDeck();
    const hands={};
    players.forEach((p,i)=>{ hands[p]=deck.splice(i*7,(i+1)*7).slice(0,7); });
    const topCard=deck.find(c=>!["⛔","↩️","+2"].includes(c.value))||deck[0];
    deck.splice(deck.indexOf(topCard),1);
    await setDoc(doc(db,"games","uno"),{hands,deck,topCard,players,currentTurn:players[0],direction:1,winner:null,lastAction:""});
    setSetup(false);
  };

  const playCard = async (card) => {
    if(!gs||gs.currentTurn!==activeUser||gs.winner) return;
    const top=gs.topCard;
    if(card.color!==top.color&&card.value!==top.value) return;
    const newHand=gs.hands[activeUser].filter(c=>c.id!==card.id);
    if(newHand.length===0){ await updateDoc(doc(db,"games","uno"),{[`hands.${activeUser}`]:newHand,topCard:card,winner:activeUser}); addPoints(activeUser,5); return; }
    const idx=gs.players.indexOf(activeUser);
    let nextIdx=(idx+gs.direction+gs.players.length)%gs.players.length;
    let skipNext=false, drawCount=0, newDir=gs.direction;
    if(card.value==="⛔"){ nextIdx=(nextIdx+gs.direction+gs.players.length)%gs.players.length; skipNext=true; }
    if(card.value==="↩️"){ newDir=-gs.direction; nextIdx=(idx-gs.direction+gs.players.length)%gs.players.length; }
    if(card.value==="+2"){ drawCount=2; }
    const newHands={...gs.hands,[activeUser]:newHand};
    if(drawCount>0&&gs.deck.length>=drawCount){ const drawn=gs.deck.slice(0,drawCount); const rem=gs.deck.slice(drawCount); newHands[gs.players[nextIdx]]=[...(newHands[gs.players[nextIdx]]||[]),...drawn]; await updateDoc(doc(db,"games","uno"),{hands:newHands,deck:rem,topCard:card,direction:newDir,currentTurn:gs.players[(nextIdx+gs.direction+gs.players.length)%gs.players.length],lastAction:`${activeUser} played +2!`}); }
    else { await updateDoc(doc(db,"games","uno"),{[`hands.${activeUser}`]:newHand,topCard:card,direction:newDir,currentTurn:gs.players[nextIdx],lastAction:`${activeUser} played ${card.value}`}); }
  };

  const drawCard = async () => {
    if(!gs||gs.currentTurn!==activeUser||gs.deck.length===0) return;
    const card=gs.deck[0];
    await updateDoc(doc(db,"games","uno"),{[`hands.${activeUser}`]:[...(gs.hands[activeUser]||[]),card],deck:gs.deck.slice(1),currentTurn:gs.players[(gs.players.indexOf(activeUser)+gs.direction+gs.players.length)%gs.players.length],lastAction:`${activeUser} drew a card`});
  };

  if(setup) return (
    <div style={{padding:20,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:8,textAlign:"center"}}>🃏 UNO Family</div>
      <div style={{background:"#fef2f2",borderRadius:12,padding:"8px 12px",marginBottom:16,fontSize:12,fontWeight:700,color:"#EF4444",textAlign:"center"}}>Match color or number to play! First to empty hand wins!</div>
      <div style={{marginBottom:10,fontWeight:800,color:"#555"}}>Who's playing? (2-4)</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{USERS.map(u=>{ const sel=players.includes(u.id); return <button key={u.id} onClick={()=>setPlayers(sel&&players.length>1?players.filter(p=>p!==u.id):[...players.filter(p=>p!==u.id),u.id])} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(sel?u.color:"#ddd"),background:sel?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:sel?u.color:"#888"}}>{u.emoji} {u.name}</button>; })}</div>
      <button disabled={players.length<2} onClick={startGame} style={{width:"100%",padding:"12px",borderRadius:20,background:players.length>=2?"#EF4444":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:players.length>=2?"pointer":"default",fontFamily:"inherit"}}>Deal Cards 🃏</button>
      <button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button>
    </div>
  );

  if(!gs) return <div style={{padding:40,textAlign:"center",color:"#aaa"}}>Loading... ⏳</div>;
  if(gs.winner){ const wu=USERS.find(u=>u.id===gs.winner); return <div style={{padding:24,textAlign:"center",fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:48}}>🃏</div><div style={{fontSize:20,fontWeight:900,color:wu?.color,marginBottom:8}}>🎉 {wu?.emoji} {wu?.name} wins UNO!</div><div style={{fontSize:14,color:"#888",marginBottom:16}}>+5 points!</div><button onClick={()=>setSetup(true)} style={{padding:"10px 24px",borderRadius:20,background:"#EF4444",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginRight:8}}>Play Again</button><button onClick={onClose} style={{padding:"10px 24px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Close</button></div>; }

  const myHand=gs.hands?.[activeUser]||[];
  const myTurn=gs.currentTurn===activeUser;
  const top=gs.topCard;
  const ctUser=USERS.find(u=>u.id===gs.currentTurn);

  return (
    <div style={{padding:12,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:16,fontWeight:900,textAlign:"center",marginBottom:6}}>🃏 UNO Family</div>
      {/* Player card counts */}
      <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:8,flexWrap:"wrap"}}>
        {gs.players.map(uid=>{ const u=USERS.find(x=>x.id===uid); return <div key={uid} style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"3px 8px",fontSize:11,fontWeight:800,color:u?.color}}>{u?.emoji} {gs.hands?.[uid]?.length||0}🃏</div>; })}
      </div>
      {/* Top card */}
      <div style={{textAlign:"center",marginBottom:10}}>
        <div style={{fontSize:11,color:"#aaa",fontWeight:700,marginBottom:4}}>Top card:</div>
        <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:56,height:80,borderRadius:10,background:UNO_COLOR_MAP[top?.color]||"#888",color:"white",fontSize:22,fontWeight:900,boxShadow:"0 4px 14px rgba(0,0,0,0.2)"}}>{top?.value}</div>
      </div>
      <div style={{textAlign:"center",fontSize:12,fontWeight:800,marginBottom:8,color:myTurn?"#10B981":"#aaa"}}>
        {myTurn?"🟢 Your turn! Play a matching card!":"⏳ "+ctUser?.name+"'s turn..."}
      </div>
      {gs.lastAction&&<div style={{textAlign:"center",fontSize:11,color:"#888",fontWeight:700,marginBottom:6,background:"#f5f5f5",borderRadius:10,padding:"3px 10px"}}>{gs.lastAction}</div>}
      {/* My hand */}
      <div style={{fontSize:11,fontWeight:800,color:"#888",marginBottom:6}}>Your hand ({myHand.length} cards):</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
        {myHand.map(card=>{ const canPlay=card.color===top?.color||card.value===top?.value; return (
          <div key={card.id} onClick={()=>myTurn&&canPlay&&playCard(card)} style={{display:"flex",alignItems:"center",justifyContent:"center",width:42,height:58,borderRadius:8,background:UNO_COLOR_MAP[card.color]||"#888",color:"white",fontSize:14,fontWeight:900,cursor:myTurn&&canPlay?"pointer":"default",boxShadow:myTurn&&canPlay?"0 0 0 3px #333":"none",opacity:myTurn&&!canPlay?0.5:1,transition:"all 0.15s"}}>{card.value}</div>
        ); })}
      </div>
      {myTurn&&<button onClick={drawCard} style={{width:"100%",padding:"10px",borderRadius:20,background:"#6B7280",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Draw Card 🎴</button>}
    </div>
  );
}

// ── EXISTING COMPONENTS (Reaction, Typing, Receipts, Reply, Poll) ─
function ReactionBurst({ emoji, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,900); return()=>clearTimeout(t); },[onDone]);
  return <div style={{position:"absolute",top:-20,left:"50%",transform:"translateX(-50%)",zIndex:50,pointerEvents:"none",animation:"burstUp 0.9s ease-out forwards",fontSize:28}}>{emoji}<style>{`@keyframes burstUp{0%{opacity:1;transform:translateX(-50%) scale(1) translateY(0)}100%{opacity:0;transform:translateX(-50%) scale(1.8) translateY(-40px)}}`}</style></div>;
}
function TypingDots({ color }) {
  return <div style={{display:"flex",gap:4,alignItems:"center",padding:"8px 14px",background:"white",borderRadius:"4px 20px 20px 20px",border:"2px solid #eee",width:"fit-content"}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:color,animation:`dot 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}<style>{`@keyframes dot{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style></div>;
}
function ReadReceipts({ sender }) {
  return <div style={{display:"flex",gap:2,marginTop:2}}>{USERS.filter(u=>u.id!==sender).map(u=><span key={u.id} style={{fontSize:10,opacity:0.5}}>{u.emoji}</span>)}</div>;
}
function ReplyPreview({ msg, onCancel }) {
  if(!msg) return null;
  const sender=USERS.find(u=>u.id===msg.sender);
  return <div style={{display:"flex",alignItems:"center",gap:8,background:"#f5f5f5",borderTop:"3px solid "+sender?.color,padding:"8px 14px"}}><div style={{flex:1}}><div style={{fontSize:11,fontWeight:800,color:sender?.color}}>{sender?.emoji} {sender?.name}</div><div style={{fontSize:12,color:"#666",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:220}}>{msg.isVoice?"🎙️ Voice":msg.photo?"📷 Photo":msg.text}</div></div><button onClick={onCancel} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#aaa"}}>✕</button></div>;
}
function PollMessage({ msg, activeUser }) {
  const poll=msg.poll; if(!poll) return null;
  const total=Object.values(poll.votes||{}).reduce((a,v)=>a+(v?.length||0),0);
  const myVote=Object.entries(poll.votes||{}).find(([,voters])=>voters?.includes(activeUser))?.[0];
  const vote=async(opt)=>{ if(myVote===opt)return; const nv={...poll.votes}; if(myVote)nv[myVote]=(nv[myVote]||[]).filter(u=>u!==activeUser); nv[opt]=[...(nv[opt]||[]),activeUser]; await updateDoc(doc(db,"messages",msg.id),{"poll.votes":nv}); };
  return <div style={{minWidth:200}}><div style={{fontWeight:800,fontSize:14,marginBottom:8}}>{poll.question}</div>{poll.options.map(opt=>{ const count=(poll.votes?.[opt]||[]).length,pct=total>0?Math.round(count/total*100):0,voted=myVote===opt; return <div key={opt} onClick={()=>vote(opt)} style={{marginBottom:6,cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:700,marginBottom:2}}><span style={{color:voted?"#3B82F6":"#555"}}>{voted?"✓ ":""}{opt}</span><span style={{color:"#aaa"}}>{pct}%</span></div><div style={{height:6,borderRadius:3,background:"#eee"}}><div style={{height:"100%",width:pct+"%",background:voted?"#3B82F6":"#94a3b8",borderRadius:3,transition:"width 0.4s"}}/></div></div>; })}<div style={{fontSize:10,color:"#aaa",marginTop:4,fontWeight:700}}>{total} vote{total!==1?"s":""}</div></div>;
}
function CreatePollModal({ onSend, onClose }) {
  const [question,setQuestion]=useState("");const [options,setOptions]=useState(["","",""]);
  const submit=()=>{ const v=options.filter(o=>o.trim()); if(!question.trim()||v.length<2)return; const votes={};v.forEach(o=>votes[o]=[]); onSend({question:question.trim(),options:v,votes}); };
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:"white",borderRadius:24,padding:24,width:"100%",maxWidth:380,fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:20,fontWeight:900,marginBottom:16,textAlign:"center"}}>📊 Create Poll</div><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask a question..." style={{width:"100%",border:"2px solid #3B82F6",borderRadius:12,padding:"10px 14px",fontSize:14,fontFamily:"inherit",fontWeight:700,outline:"none",boxSizing:"border-box",marginBottom:12}}/>{options.map((opt,i)=><input key={i} value={opt} onChange={e=>{const n=[...options];n[i]=e.target.value;setOptions(n);}} placeholder={`Option ${i+1}`} style={{width:"100%",border:"2px solid #eee",borderRadius:12,padding:"9px 14px",fontSize:13,fontFamily:"inherit",fontWeight:700,outline:"none",boxSizing:"border-box",marginBottom:8}}/>)}<button onClick={()=>setOptions([...options,""])} style={{fontSize:12,color:"#3B82F6",background:"none",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>+ Add option</button><div style={{display:"flex",gap:8}}><button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button><button onClick={submit} style={{flex:1,padding:"11px",borderRadius:20,background:"#3B82F6",color:"white",border:"none",fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>Send 📊</button></div></div></div>;
}

// ── TASKS PANEL ───────────────────────────────────────────────────
function TasksPanel({ activeUser, onClose }) {
  const [tasks,setTasks]=useState([]);const [input,setInput]=useState("");const [assignTo,setAssignTo]=useState(activeUser);
  const user=USERS.find(u=>u.id===activeUser);
  useEffect(()=>{ return onSnapshot(collection(db,"tasks"),snap=>{ const t=[]; snap.forEach(d=>t.push({id:d.id,...d.data()})); setTasks(t.sort((a,b)=>a.done?1:-1)); }); },[]);
  const addTask=async()=>{ if(!input.trim())return; await addDoc(collection(db,"tasks"),{text:input.trim(),assignee:assignTo,done:false,createdBy:activeUser,createdAt:serverTimestamp()}); setInput(""); };
  const toggleTask=async(task)=>{ await updateDoc(doc(db,"tasks",task.id),{done:!task.done}); if(!task.done) addPoints(activeUser,1); };
  return (
    <div style={{flex:1,overflowY:"auto",padding:16,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:20,fontWeight:900,marginBottom:4,color:user?.color,textAlign:"center"}}>📋 Family Tasks</div>
      <div style={{fontSize:12,color:"#aaa",fontWeight:700,textAlign:"center",marginBottom:14}}>Complete tasks = earn points! ⭐</div>
      <div style={{background:"white",borderRadius:16,padding:14,marginBottom:14,border:"2px solid #eee"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()} placeholder="Add a task..." style={{width:"100%",border:"2px solid "+user?.color,borderRadius:12,padding:"9px 14px",fontSize:14,fontFamily:"inherit",fontWeight:700,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>{USERS.map(u=><button key={u.id} onClick={()=>setAssignTo(u.id)} style={{padding:"5px 10px",borderRadius:20,border:"2px solid "+(assignTo===u.id?u.color:"#ddd"),background:assignTo===u.id?u.color+"22":"white",fontWeight:800,fontSize:11,cursor:"pointer",fontFamily:"inherit",color:assignTo===u.id?u.color:"#888"}}>{u.emoji} {u.name}</button>)}</div>
        <button onClick={addTask} disabled={!input.trim()} style={{width:"100%",padding:"10px",borderRadius:20,background:input.trim()?user?.color:"#ddd",color:"white",border:"none",fontWeight:900,cursor:input.trim()?"pointer":"default",fontFamily:"inherit"}}>Add ✓</button>
      </div>
      {tasks.map(task=>{ const a=USERS.find(u=>u.id===task.assignee); return <div key={task.id} onClick={()=>toggleTask(task)} style={{display:"flex",alignItems:"center",gap:10,background:"white",border:"2px solid "+(task.done?"#10B981":a?.color+"44"),borderRadius:12,padding:"10px 14px",marginBottom:6,cursor:"pointer",opacity:task.done?0.6:1}}><div style={{width:22,height:22,borderRadius:"50%",border:"2px solid "+(task.done?"#10B981":a?.color),background:task.done?"#10B981":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{task.done&&<span style={{color:"white",fontSize:12}}>✓</span>}</div><span style={{fontSize:12,fontWeight:800,color:a?.color}}>{a?.emoji}</span><span style={{flex:1,fontSize:13,fontWeight:700,textDecoration:task.done?"line-through":"none",color:task.done?"#aaa":"#1e1e1e"}}>{task.text}</span></div>; })}
      {tasks.length===0&&<div style={{textAlign:"center",padding:40,color:"#aaa",fontWeight:700}}>No tasks yet! ✨</div>}
      <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>← Back</button>
    </div>
  );
}

// ── EVENTS PANEL ──────────────────────────────────────────────────
function EventsPanel({ activeUser, onClose }) {
  const [events,setEvents]=useState([]);const [showForm,setShowForm]=useState(false);const [title,setTitle]=useState("");const [date,setDate]=useState("");const [desc,setDesc]=useState("");
  const user=USERS.find(u=>u.id===activeUser);
  const MC=["#3B82F6","#EC4899","#10B981","#F59E0B","#8B5CF6","#EF4444","#06B6D4","#84CC16","#F97316","#6366F1","#14B8A6","#F59E0B"];
  useEffect(()=>{ return onSnapshot(collection(db,"events"),snap=>{ const ev=[]; snap.forEach(d=>ev.push({id:d.id,...d.data()})); setEvents(ev.sort((a,b)=>(a.date||"").localeCompare(b.date||""))); }); },[]);
  const addEvent=async()=>{ if(!title.trim()||!date)return; await addDoc(collection(db,"events"),{title:title.trim(),date,desc:desc.trim(),createdBy:activeUser,createdAt:serverTimestamp()}); setTitle("");setDate("");setDesc("");setShowForm(false); };
  const today=new Date().toISOString().split("T")[0];
  const upcoming=events.filter(e=>e.date>=today),past=events.filter(e=>e.date<today);
  return (
    <div style={{flex:1,overflowY:"auto",padding:16,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:20,fontWeight:900,marginBottom:4,color:user?.color,textAlign:"center"}}>📅 Family Events</div>
      <button onClick={()=>setShowForm(!showForm)} style={{width:"100%",padding:"12px",borderRadius:20,background:user?.color,color:"white",border:"none",fontWeight:900,cursor:"pointer",fontFamily:"inherit",marginBottom:12}}>{showForm?"✕ Cancel":"+ Add Event 📅"}</button>
      {showForm&&<div style={{background:"white",borderRadius:16,padding:16,marginBottom:14,border:"2px solid "+user?.color}}><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Event title..." style={{width:"100%",border:"2px solid "+user?.color,borderRadius:12,padding:"9px 14px",fontSize:14,fontFamily:"inherit",fontWeight:700,outline:"none",boxSizing:"border-box",marginBottom:8}}/><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:"100%",border:"2px solid #eee",borderRadius:12,padding:"9px 14px",fontSize:14,fontFamily:"inherit",fontWeight:700,outline:"none",boxSizing:"border-box",marginBottom:8}}/><input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Details..." style={{width:"100%",border:"2px solid #eee",borderRadius:12,padding:"9px 14px",fontSize:14,fontFamily:"inherit",fontWeight:700,outline:"none",boxSizing:"border-box",marginBottom:10}}/><button onClick={addEvent} disabled={!title.trim()||!date} style={{width:"100%",padding:"10px",borderRadius:20,background:title.trim()&&date?user?.color:"#ddd",color:"white",border:"none",fontWeight:900,cursor:title.trim()&&date?"pointer":"default",fontFamily:"inherit"}}>Save 🎉</button></div>}
      {upcoming.length>0&&<div style={{marginBottom:14}}><div style={{fontWeight:800,color:user?.color,marginBottom:8}}>📅 Upcoming</div>{upcoming.map(ev=>{ const cr=USERS.find(u=>u.id===ev.createdBy),dObj=new Date(ev.date+"T00:00:00"),mc=MC[dObj.getMonth()],dl=Math.ceil((dObj-new Date())/86400000); return <div key={ev.id} style={{background:"white",border:"2px solid "+mc+"44",borderRadius:16,padding:"12px 14px",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{background:mc,borderRadius:10,padding:"4px 10px",color:"white",fontWeight:900,fontSize:12,textAlign:"center"}}><div>{dObj.toLocaleDateString([],{day:"numeric"})}</div><div style={{fontSize:9}}>{dObj.toLocaleDateString([],{month:"short"})}</div></div><div style={{flex:1}}><div style={{fontWeight:900,fontSize:14}}>{ev.title}</div>{ev.desc&&<div style={{fontSize:11,color:"#888"}}>{ev.desc}</div>}</div><div style={{fontSize:11,color:dl<=3?"#EF4444":dl<=7?"#F59E0B":"#aaa",fontWeight:800}}>{dl===0?"Today!":dl===1?"Tomorrow":dl+"d"}</div></div><div style={{fontSize:10,color:"#bbb",marginTop:4}}>by {cr?.emoji} {cr?.name}</div></div>; })}</div>}
      {past.length>0&&<div style={{opacity:0.6}}><div style={{fontWeight:800,color:"#aaa",marginBottom:8}}>⏰ Past</div>{past.slice(-3).map(ev=><div key={ev.id} style={{background:"#f5f5f5",borderRadius:12,padding:"10px 14px",marginBottom:6}}><div style={{fontWeight:800,fontSize:13,color:"#888"}}>{ev.title}</div><div style={{fontSize:11,color:"#bbb"}}>{ev.date}</div></div>)}</div>}
      {events.length===0&&<div style={{textAlign:"center",padding:40,color:"#aaa",fontWeight:700}}>No events yet! 🎉</div>}
      <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:12}}>← Back</button>
    </div>
  );
}

// ── EXISTING GAMES ────────────────────────────────────────────────
function TicTacToe({activeUser,onClose}) {
  const [gs,setGs]=useState(null);const [xUser,setXUser]=useState(null);const [oUser,setOUser]=useState(null);const [setup,setSetup]=useState(true);const SIZE=5;
  const checkWinner=(b)=>{ const check=(p,cells)=>p&&cells.every(idx=>b[idx]===p)?p:null; for(let r=0;r<SIZE;r++) for(let c=0;c<=SIZE-4;c++){const p=b[r*SIZE+c];const w=check(p,[1,2,3].map(i=>r*SIZE+c+i));if(w)return w;} for(let c=0;c<SIZE;c++) for(let r=0;r<=SIZE-4;r++){const p=b[r*SIZE+c];const w=check(p,[1,2,3].map(i=>(r+i)*SIZE+c));if(w)return w;} for(let r=0;r<=SIZE-4;r++) for(let c=0;c<=SIZE-4;c++){const p=b[r*SIZE+c];const w=check(p,[1,2,3].map(i=>(r+i)*SIZE+c+i));if(w)return w;} for(let r=3;r<SIZE;r++) for(let c=0;c<=SIZE-4;c++){const p=b[r*SIZE+c];const w=check(p,[1,2,3].map(i=>(r-i)*SIZE+c+i));if(w)return w;} if(b.every(Boolean))return "Draw"; return null; };
  useEffect(()=>{ if(setup)return; return onSnapshot(doc(db,"games","ttt5"),snap=>{if(snap.exists())setGs(snap.data());}); },[setup]);
  const startGame=async()=>{await setDoc(doc(db,"games","ttt5"),{board:Array(25).fill(null),turn:"X",xUser,oUser,winner:null,scores:{[xUser]:0,[oUser]:0}});setSetup(false);};
  const click=async i=>{ if(!gs||gs.board[i]||gs.winner)return; if(gs.turn==="X"&&activeUser!==gs.xUser)return; if(gs.turn==="O"&&activeUser!==gs.oUser)return; const nb=[...gs.board];nb[i]=gs.turn;const w=checkWinner(nb);const sc={...gs.scores};if(w&&w!=="Draw"){const winner=w==="X"?gs.xUser:gs.oUser;sc[winner]=(sc[winner]||0)+1;addPoints(winner,3);}await updateDoc(doc(db,"games","ttt5"),{board:nb,winner:w||null,turn:gs.turn==="X"?"O":"X",scores:sc}); };
  const restart=async()=>{await updateDoc(doc(db,"games","ttt5"),{board:Array(25).fill(null),winner:null,turn:"X"});};
  const xu=USERS.find(u=>u.id===(gs?.xUser||xUser)),ou=USERS.find(u=>u.id===(gs?.oUser||oUser));
  if(setup)return(<div style={{padding:20,fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:22,fontWeight:900,marginBottom:8,textAlign:"center"}}>🎯 Tic Tac Toe 5×5</div><div style={{marginBottom:10,fontWeight:800,color:"#555"}}>Who plays X?</div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>{USERS.map(u=><button key={u.id} onClick={()=>setXUser(u.id)} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(xUser===u.id?u.color:"#ddd"),background:xUser===u.id?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:xUser===u.id?u.color:"#888"}}>{u.emoji} {u.name}</button>)}</div><div style={{marginBottom:10,fontWeight:800,color:"#555"}}>Who plays O?</div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{USERS.filter(u=>u.id!==xUser).map(u=><button key={u.id} onClick={()=>setOUser(u.id)} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(oUser===u.id?u.color:"#ddd"),background:oUser===u.id?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:oUser===u.id?u.color:"#888"}}>{u.emoji} {u.name}</button>)}</div><button disabled={!xUser||!oUser} onClick={startGame} style={{width:"100%",padding:"12px",borderRadius:20,background:xUser&&oUser?"#3B82F6":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:xUser&&oUser?"pointer":"default",fontFamily:"inherit"}}>Start 🎯</button><button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button></div>);
  if(!gs)return<div style={{padding:40,textAlign:"center",color:"#aaa"}}>Loading...</div>;
  const myTurn=(gs.turn==="X"&&activeUser===gs.xUser)||(gs.turn==="O"&&activeUser===gs.oUser);
  return(<div style={{padding:16,fontFamily:"'Nunito',sans-serif",textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,marginBottom:6}}>🎯 Tic Tac Toe 5×5</div>{gs.scores&&<div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:10}}>{[gs.xUser,gs.oUser].map(uid=>{const u=USERS.find(x=>x.id===uid);return<div key={uid} style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"4px 12px",fontSize:13,fontWeight:800,color:u?.color}}>{u?.emoji} {gs.scores?.[uid]||0}</div>;})}</div>}{!gs.winner&&<div style={{fontSize:13,fontWeight:800,marginBottom:10,color:myTurn?"#10B981":"#aaa"}}>{myTurn?"🟢 Your turn!":"⏳ "+(gs.turn==="X"?xu?.name:ou?.name)+"'s turn..."}</div>}{gs.winner&&<div style={{fontSize:17,fontWeight:900,marginBottom:10,color:gs.winner==="Draw"?"#888":gs.winner==="X"?xu?.color:ou?.color}}>{gs.winner==="Draw"?"🤝 Draw!":`🏆 ${gs.winner==="X"?xu?.name:ou?.name} wins!`}</div>}<div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,maxWidth:280,margin:"0 auto 12px"}}>{gs.board.map((cell,i)=><button key={i} onClick={()=>click(i)} style={{height:50,borderRadius:10,border:"1.5px solid #eee",background:cell?"white":"#f8f8f8",fontSize:18,fontWeight:900,cursor:myTurn&&!cell&&!gs.winner?"pointer":"default",color:cell==="X"?xu?.color:ou?.color}}>{cell}</button>)}</div><button onClick={restart} style={{padding:"7px 18px",borderRadius:20,background:"#3B82F6",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginRight:8}}>Restart 🔄</button><button onClick={onClose} style={{padding:"7px 18px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Close</button></div>);
}

function QuizBattle({activeUser,onClose}) {
  const [gs,setGs]=useState(null);const [setup,setSetup]=useState(true);const [players,setPlayers]=useState([activeUser]);const [answered,setAnswered]=useState(false);
  useEffect(()=>{ if(setup)return; return onSnapshot(doc(db,"games","quiz"),snap=>{if(snap.exists()){setGs(snap.data());setAnswered(false);}}); },[setup]);
  const startGame=async()=>{ const scores={};players.forEach(p=>scores[p]=0); await setDoc(doc(db,"games","quiz"),{qi:0,scores,players,answers:{},phase:"question",winner:null}); setSetup(false); };
  const answer=async opt=>{ if(!gs||answered||gs.phase!=="question"||!gs.players.includes(activeUser))return; setAnswered(true); const q=QUIZ_QUESTIONS[gs.qi],na={...gs.answers,[activeUser]:opt},ns={...gs.scores}; if(opt===q.a)ns[activeUser]=(ns[activeUser]||0)+1; const allDone=gs.players.every(p=>na[p]); if(allDone){ const nxt=gs.qi+1; if(nxt>=QUIZ_QUESTIONS.length){const w=Object.entries(ns).sort((a,b)=>b[1]-a[1])[0][0];addPoints(w,3);await updateDoc(doc(db,"games","quiz"),{answers:na,scores:ns,phase:"done",winner:w});}else{setTimeout(async()=>await updateDoc(doc(db,"games","quiz"),{qi:nxt,answers:{},scores:ns,phase:"question"}),1500);await updateDoc(doc(db,"games","quiz"),{answers:na,scores:ns,phase:"reveal"});}}else await updateDoc(doc(db,"games","quiz"),{answers:na,scores:ns}); };
  if(setup)return(<div style={{padding:20,fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:22,fontWeight:900,marginBottom:8,textAlign:"center"}}>❓ Quiz Battle</div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{USERS.map(u=>{const sel=players.includes(u.id);return<button key={u.id} onClick={()=>setPlayers(sel?players.filter(p=>p!==u.id):[...players,u.id])} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(sel?u.color:"#ddd"),background:sel?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:sel?u.color:"#888"}}>{u.emoji} {u.name}</button>;})}</div><button disabled={players.length<2} onClick={startGame} style={{width:"100%",padding:"12px",borderRadius:20,background:players.length>=2?"#EC4899":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:players.length>=2?"pointer":"default",fontFamily:"inherit"}}>Start Quiz ❓</button><button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button></div>);
  if(!gs)return<div style={{padding:40,textAlign:"center",color:"#aaa"}}>Loading...</div>;
  if(gs.phase==="done"||gs.winner){const wu=USERS.find(u=>u.id===gs.winner);return(<div style={{padding:24,textAlign:"center",fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:48}}>🏆</div><div style={{fontSize:20,fontWeight:900,color:wu?.color,marginBottom:16}}>{wu?.emoji} {wu?.name} wins!</div><div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>{Object.entries(gs.scores).sort((a,b)=>b[1]-a[1]).map(([uid,sc])=>{const u=USERS.find(x=>x.id===uid);return<div key={uid} style={{display:"flex",alignItems:"center",gap:8,background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"8px 14px"}}><span style={{fontSize:20}}>{u?.emoji}</span><span style={{fontWeight:800,color:u?.color}}>{u?.name}</span><span style={{marginLeft:"auto",fontWeight:900,fontSize:18,color:u?.color}}>{sc}</span></div>;})}</div><button onClick={()=>setSetup(true)} style={{padding:"10px 24px",borderRadius:20,background:"#EC4899",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginRight:8}}>Play Again</button><button onClick={onClose} style={{padding:"10px 24px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Close</button></div>);}
  const q=QUIZ_QUESTIONS[gs.qi],myAnswer=gs.answers?.[activeUser];
  return(<div style={{padding:16,fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:18,fontWeight:900,marginBottom:4,textAlign:"center"}}>❓ Quiz Battle</div><div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>{gs.players.map(uid=>{const u=USERS.find(x=>x.id===uid);return<div key={uid} style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"3px 10px",fontSize:12,fontWeight:800,color:u?.color}}>{u?.emoji} {gs.scores?.[uid]||0}</div>;})}</div><div style={{fontSize:11,color:"#aaa",fontWeight:700,textAlign:"center",marginBottom:8}}>Q {gs.qi+1}/{QUIZ_QUESTIONS.length}</div><div style={{background:"#fdf2f8",border:"2px solid #EC4899",borderRadius:16,padding:16,marginBottom:14,textAlign:"center"}}><div style={{fontSize:16,fontWeight:800}}>{q.q}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{q.opts.map(opt=>{let bg="white",border="2px solid #eee",color="#1e1e1e";if(myAnswer){if(opt===q.a){bg="#ecfdf5";border="2px solid #10B981";color="#10B981";}else if(opt===myAnswer){bg="#fef2f2";border="2px solid #EF4444";color="#EF4444";}}return<button key={opt} onClick={()=>answer(opt)} disabled={!!myAnswer} style={{padding:"11px 8px",borderRadius:14,border,background:bg,fontWeight:800,fontSize:13,cursor:myAnswer?"default":"pointer",fontFamily:"inherit",color}}>{opt}</button>;})}</div></div>);
}

function MemoryGame({activeUser,onClose}) {
  const [gs,setGs]=useState(null);const [setup,setSetup]=useState(true);const [players,setPlayers]=useState([activeUser]);
  useEffect(()=>{ if(setup)return; return onSnapshot(doc(db,"games","memory"),snap=>{if(snap.exists())setGs(snap.data());}); },[setup]);
  const startGame=async()=>{ const cards=[...CARD_EMOJIS.slice(0,8),...CARD_EMOJIS.slice(0,8)].sort(()=>Math.random()-0.5).map((e,i)=>({id:i,emoji:e,flipped:false,matched:false})); const scores={};players.forEach(p=>scores[p]=0); await setDoc(doc(db,"games","memory"),{cards,scores,players,flipped:[],currentTurn:players[0],winner:null}); setSetup(false); };
  const flip=async i=>{ if(!gs||gs.currentTurn!==activeUser||gs.flipped.length>=2||gs.cards[i].flipped||gs.cards[i].matched)return; const nc=[...gs.cards];nc[i]={...nc[i],flipped:true};const nf=[...gs.flipped,i]; if(nf.length===2){const[a,b]=nf;if(nc[a].emoji===nc[b].emoji){nc[a]={...nc[a],matched:true};nc[b]={...nc[b],matched:true};const ns={...gs.scores,[activeUser]:(gs.scores[activeUser]||0)+1};const allDone=nc.every(c=>c.matched);const w=allDone?Object.entries(ns).sort((a,b)=>b[1]-a[1])[0][0]:null;if(w)addPoints(w,4);await updateDoc(doc(db,"games","memory"),{cards:nc,scores:ns,flipped:[],winner:w||null});}else{await updateDoc(doc(db,"games","memory"),{cards:nc,flipped:nf});const ni=(gs.players.indexOf(activeUser)+1)%gs.players.length;setTimeout(async()=>{const rc=[...nc];rc[a]={...rc[a],flipped:false};rc[b]={...rc[b],flipped:false};await updateDoc(doc(db,"games","memory"),{cards:rc,flipped:[],currentTurn:gs.players[ni]});},1000);return;}}await updateDoc(doc(db,"games","memory"),{cards:nc,flipped:nf}); };
  if(setup)return(<div style={{padding:20,fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:22,fontWeight:900,marginBottom:8,textAlign:"center"}}>🃏 Memory Game</div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{USERS.map(u=>{const sel=players.includes(u.id);return<button key={u.id} onClick={()=>setPlayers(sel?players.filter(p=>p!==u.id):[...players,u.id])} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(sel?u.color:"#ddd"),background:sel?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:sel?u.color:"#888"}}>{u.emoji} {u.name}</button>;})}</div><button disabled={players.length<2} onClick={startGame} style={{width:"100%",padding:"12px",borderRadius:20,background:players.length>=2?"#10B981":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:players.length>=2?"pointer":"default",fontFamily:"inherit"}}>Start 🃏</button><button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button></div>);
  if(!gs)return<div style={{padding:40,textAlign:"center",color:"#aaa"}}>Loading...</div>;
  if(gs.winner){const wu=USERS.find(u=>u.id===gs.winner);return(<div style={{padding:24,textAlign:"center",fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:48}}>🏆</div><div style={{fontSize:20,fontWeight:900,color:wu?.color,marginBottom:16}}>{wu?.emoji} {wu?.name} wins!</div><button onClick={()=>setSetup(true)} style={{padding:"10px 24px",borderRadius:20,background:"#10B981",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginRight:8}}>Again</button><button onClick={onClose} style={{padding:"10px 24px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Close</button></div>);}
  const myTurn=gs.currentTurn===activeUser,ct=USERS.find(u=>u.id===gs.currentTurn);
  return(<div style={{padding:12,fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:18,fontWeight:900,marginBottom:6,textAlign:"center"}}>🃏 Memory</div><div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>{gs.players.map(uid=>{const u=USERS.find(x=>x.id===uid);return<div key={uid} style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"3px 10px",fontSize:12,fontWeight:800,color:u?.color}}>{u?.emoji} {gs.scores?.[uid]||0}</div>;})}</div><div style={{textAlign:"center",fontSize:13,fontWeight:800,marginBottom:10,color:myTurn?"#10B981":"#aaa"}}>{myTurn?"🟢 Your turn!":"⏳ "+ct?.name+"'s turn..."}</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,maxWidth:280,margin:"0 auto"}}>{gs.cards.map((card,i)=><button key={i} onClick={()=>flip(i)} style={{height:56,borderRadius:12,border:"2px solid "+(card.matched?"#10B98144":"#eee"),background:card.flipped||card.matched?"white":"linear-gradient(135deg,#6366f1,#8b5cf6)",fontSize:card.flipped||card.matched?26:0,cursor:myTurn&&!card.flipped&&!card.matched?"pointer":"default",opacity:card.matched?0.4:1}}>{(card.flipped||card.matched)?card.emoji:""}</button>)}</div></div>);
}

function WordScramble({activeUser,onClose}) {
  const [gs,setGs]=useState(null);const [setup,setSetup]=useState(true);const [players,setPlayers]=useState([activeUser]);const [guess,setGuess]=useState("");const [feedback,setFeedback]=useState(null);
  useEffect(()=>{ if(setup)return; return onSnapshot(doc(db,"games","scramble"),snap=>{if(snap.exists())setGs(snap.data());}); },[setup]);
  const scramble=w=>[...w].sort(()=>Math.random()-0.5).join("");
  const startGame=async()=>{ const word=WORDS[Math.floor(Math.random()*WORDS.length)];const scores={};players.forEach(p=>scores[p]=0);await setDoc(doc(db,"games","scramble"),{word,scrambled:scramble(word),scores,players,solved:false,solvedBy:null,round:1});setSetup(false); };
  const submit=async()=>{ if(!gs||!guess.trim())return; if(guess.toUpperCase()===gs.word){const ns={...gs.scores,[activeUser]:(gs.scores[activeUser]||0)+1};setFeedback("correct");addPoints(activeUser,2);setTimeout(async()=>{const word=WORDS[Math.floor(Math.random()*WORDS.length)];await updateDoc(doc(db,"games","scramble"),{word,scrambled:scramble(word),scores:ns,solved:false,solvedBy:null,round:(gs.round||1)+1});setGuess("");setFeedback(null);},1500);await updateDoc(doc(db,"games","scramble"),{solved:true,solvedBy:activeUser,scores:ns});}else{setFeedback("wrong");setTimeout(()=>setFeedback(null),800);} };
  if(setup)return(<div style={{padding:20,fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:22,fontWeight:900,marginBottom:8,textAlign:"center"}}>🏆 Word Scramble</div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{USERS.map(u=>{const sel=players.includes(u.id);return<button key={u.id} onClick={()=>setPlayers(sel?players.filter(p=>p!==u.id):[...players,u.id])} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(sel?u.color:"#ddd"),background:sel?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:sel?u.color:"#888"}}>{u.emoji} {u.name}</button>;})}</div><button disabled={players.length<2} onClick={startGame} style={{width:"100%",padding:"12px",borderRadius:20,background:players.length>=2?"#F59E0B":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:players.length>=2?"pointer":"default",fontFamily:"inherit"}}>Start 🏆</button><button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button></div>);
  if(!gs)return<div style={{padding:40,textAlign:"center",color:"#aaa"}}>Loading...</div>;
  const solver=gs.solvedBy?USERS.find(u=>u.id===gs.solvedBy):null;
  return(<div style={{padding:16,fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:18,fontWeight:900,marginBottom:6,textAlign:"center"}}>🏆 Word Scramble — Round {gs.round||1}</div><div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>{gs.players.map(uid=>{const u=USERS.find(x=>x.id===uid);return<div key={uid} style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"3px 10px",fontSize:12,fontWeight:800,color:u?.color}}>{u?.emoji} {gs.scores?.[uid]||0}</div>;})}</div><div style={{background:"#fffbeb",border:"2px solid #F59E0B",borderRadius:16,padding:"16px",textAlign:"center",marginBottom:14}}><div style={{fontSize:32,fontWeight:900,letterSpacing:8,color:"#F59E0B"}}>{gs.scrambled}</div><div style={{fontSize:11,color:"#bbb"}}>{gs.word.length} letters</div></div>{gs.solved&&solver&&<div style={{textAlign:"center",fontSize:15,fontWeight:900,color:solver.color,marginBottom:10}}>🎉 {solver.name} got it! Word: {gs.word}</div>}{!gs.solved&&<><input value={guess} onChange={e=>setGuess(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Your answer..." style={{width:"100%",border:"2px solid "+(feedback==="correct"?"#10B981":feedback==="wrong"?"#EF4444":"#F59E0B"),borderRadius:20,padding:"11px 16px",fontSize:16,fontFamily:"inherit",fontWeight:800,outline:"none",boxSizing:"border-box",textAlign:"center",marginBottom:10,letterSpacing:4}}/><button onClick={submit} disabled={!guess.trim()} style={{width:"100%",padding:"11px",borderRadius:20,background:guess.trim()?"#F59E0B":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:guess.trim()?"pointer":"default",fontFamily:"inherit"}}>Submit ➤</button></>}<button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Close</button></div>);
}

function DiceBattle({activeUser,onClose}) {
  const [gs,setGs]=useState(null);const [setup,setSetup]=useState(true);const [players,setPlayers]=useState([activeUser]);const [rolling,setRolling]=useState(false);
  const DICE=["⚀","⚁","⚂","⚃","⚄","⚅"];
  useEffect(()=>{ if(setup)return; return onSnapshot(doc(db,"games","dice"),snap=>{if(snap.exists())setGs(snap.data());}); },[setup]);
  const startGame=async()=>{ const scores={};const rolls={};players.forEach(p=>{scores[p]=0;rolls[p]=null;}); await setDoc(doc(db,"games","dice"),{scores,rolls,players,round:1,maxRounds:5,phase:"rolling"}); setSetup(false); };
  const roll=async()=>{ if(!gs||rolling||gs.rolls?.[activeUser]!==null)return; setRolling(true); const val=Math.floor(Math.random()*6)+1; const nr={...gs.rolls,[activeUser]:val}; const allRolled=gs.players.every(p=>nr[p]!==null); if(allRolled){const w=gs.players.reduce((a,b)=>nr[a]>=nr[b]?a:b);const ns={...gs.scores};if(nr[w]>0&&gs.players.filter(p=>nr[p]===nr[w]).length===1)ns[w]=(ns[w]||0)+1;const nxt=gs.round+1;if(nxt>gs.maxRounds){const fw=gs.players.reduce((a,b)=>ns[a]>=ns[b]?a:b);addPoints(fw,3);await updateDoc(doc(db,"games","dice"),{rolls:nr,scores:ns,phase:"done",winner:fw});}else{await updateDoc(doc(db,"games","dice"),{rolls:nr,scores:ns,phase:"reveal"});setTimeout(async()=>{const er={};gs.players.forEach(p=>er[p]=null);await updateDoc(doc(db,"games","dice"),{rolls:er,phase:"rolling",round:nxt});},2000);}}else await updateDoc(doc(db,"games","dice"),{rolls:nr});setTimeout(()=>setRolling(false),400); };
  if(setup)return(<div style={{padding:20,fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:22,fontWeight:900,marginBottom:8,textAlign:"center"}}>🎲 Dice Battle</div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{USERS.map(u=>{const sel=players.includes(u.id);return<button key={u.id} onClick={()=>setPlayers(sel?players.filter(p=>p!==u.id):[...players,u.id])} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(sel?u.color:"#ddd"),background:sel?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:sel?u.color:"#888"}}>{u.emoji} {u.name}</button>;})}</div><button disabled={players.length<2} onClick={startGame} style={{width:"100%",padding:"12px",borderRadius:20,background:players.length>=2?"#3B82F6":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:players.length>=2?"pointer":"default",fontFamily:"inherit"}}>Start 🎲</button><button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button></div>);
  if(!gs)return<div style={{padding:40,textAlign:"center",color:"#aaa"}}>Loading...</div>;
  if(gs.phase==="done"){const wu=USERS.find(u=>u.id===gs.winner);return(<div style={{padding:24,textAlign:"center",fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:48}}>🎲</div><div style={{fontSize:20,fontWeight:900,color:wu?.color,marginBottom:16}}>{wu?.emoji} {wu?.name} wins!</div><button onClick={()=>setSetup(true)} style={{padding:"10px 24px",borderRadius:20,background:"#3B82F6",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginRight:8}}>Again</button><button onClick={onClose} style={{padding:"10px 24px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Close</button></div>);}
  const myRolled=gs.rolls?.[activeUser]!==null&&gs.rolls?.[activeUser]!==undefined;
  const highRoll=gs.rolls?gs.players.reduce((a,b)=>(gs.rolls[a]||0)>=(gs.rolls[b]||0)?a:b,gs.players[0]):null;
  return(<div style={{padding:16,fontFamily:"'Nunito',sans-serif",textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,marginBottom:4}}>🎲 Dice — Round {gs.round}/{gs.maxRounds}</div><div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>{gs.players.map(uid=>{const u=USERS.find(x=>x.id===uid);return<div key={uid} style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"4px 12px",fontSize:13,fontWeight:800,color:u?.color}}>{u?.emoji} {gs.scores?.[uid]||0}</div>;})}</div><div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:16}}>{gs.players.map(uid=>{const u=USERS.find(x=>x.id===uid);const val=gs.rolls?.[uid];const isH=gs.phase==="reveal"&&uid===highRoll;return(<div key={uid} style={{background:isH?u?.color:u?.bg,border:"3px solid "+u?.color,borderRadius:16,padding:"14px 18px",minWidth:70}}><div style={{fontSize:11,fontWeight:800,color:isH?"white":u?.color,marginBottom:2}}>{u?.emoji} {u?.name}</div><div style={{fontSize:40,lineHeight:1}}>{val!=null?DICE[val-1]:"🎲"}</div>{val!=null&&<div style={{fontSize:13,fontWeight:900,color:isH?"white":u?.color}}>{val}</div>}</div>);})}</div>{gs.phase==="rolling"&&!myRolled&&<button onClick={roll} disabled={rolling} style={{padding:"14px 32px",borderRadius:24,background:"#3B82F6",color:"white",border:"none",fontWeight:900,fontSize:16,cursor:"pointer",fontFamily:"inherit"}}>🎲 Roll!</button>}{gs.phase==="rolling"&&myRolled&&<div style={{color:"#10B981",fontWeight:800}}>✅ Rolled! Waiting... ⏳</div>}{gs.phase==="reveal"&&<div style={{fontWeight:900,fontSize:15,color:USERS.find(u=>u.id===highRoll)?.color}}>{highRoll===activeUser?"🎉 You win this round!":"🏆 "+USERS.find(u=>u.id===highRoll)?.name+" wins!"}</div>}</div>);
}

function DrawGuess({activeUser,onClose}) {
  const [gs,setGs]=useState(null);const [setup,setSetup]=useState(true);const [players,setPlayers]=useState([activeUser]);const [guess,setGuess]=useState("");const [isDrawing,setIsDrawing]=useState(false);
  const canvasRef=useRef(null);const lastPos=useRef(null);
  const DW=["Cat","House","Car","Tree","Sun","Fish","Bird","Pizza","Guitar","Ball","Crown","Moon","Star","Cloud","Flower","Cake","Boat","Train","Phone","Heart"];
  useEffect(()=>{ if(setup)return; return onSnapshot(doc(db,"games","draw"),snap=>{if(snap.exists()){const d=snap.data();setGs(d);if(d.canvasData&&canvasRef.current){const img=new Image();img.onload=()=>{const ctx=canvasRef.current?.getContext("2d");if(ctx){ctx.clearRect(0,0,300,220);ctx.drawImage(img,0,0);}};img.src=d.canvasData;}}}); },[setup]);
  const startGame=async()=>{ const scores={};players.forEach(p=>scores[p]=0);const word=DW[Math.floor(Math.random()*DW.length)];await setDoc(doc(db,"games","draw"),{scores,players,word,drawerIdx:0,drawer:players[0],guessed:false,guessedBy:null,canvasData:null,round:1});setSetup(false); };
  const getPos=(e,canvas)=>{ const rect=canvas.getBoundingClientRect();const sx=canvas.width/rect.width,sy=canvas.height/rect.height;const cx=e.touches?e.touches[0].clientX:e.clientX,cy=e.touches?e.touches[0].clientY:e.clientY;return{x:(cx-rect.left)*sx,y:(cy-rect.top)*sy}; };
  const startDraw=e=>{ if(gs?.drawer!==activeUser)return;setIsDrawing(true);lastPos.current=getPos(e,canvasRef.current); };
  const draw=e=>{ if(!isDrawing||gs?.drawer!==activeUser)return;e.preventDefault();const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext("2d"),pos=getPos(e,canvas);ctx.beginPath();ctx.moveTo(lastPos.current.x,lastPos.current.y);ctx.lineTo(pos.x,pos.y);ctx.strokeStyle="#1e1e1e";ctx.lineWidth=3;ctx.lineCap="round";ctx.stroke();lastPos.current=pos; };
  const endDraw=async()=>{ if(!isDrawing||!canvasRef.current)return;setIsDrawing(false);lastPos.current=null;if(gs?.drawer===activeUser){const data=canvasRef.current.toDataURL("image/png",0.4);await updateDoc(doc(db,"games","draw"),{canvasData:data});} };
  const clearCanvas=async()=>{ if(!canvasRef.current)return;canvasRef.current.getContext("2d").clearRect(0,0,300,220);await updateDoc(doc(db,"games","draw"),{canvasData:null}); };
  const submitGuess=async()=>{ if(!gs||!guess.trim()||gs.guessed)return;if(guess.toLowerCase().trim()===gs.word.toLowerCase()){const ns={...gs.scores,[activeUser]:(gs.scores[activeUser]||0)+2,[gs.drawer]:(gs.scores[gs.drawer]||0)+1};addPoints(activeUser,2);addPoints(gs.drawer,1);await updateDoc(doc(db,"games","draw"),{guessed:true,guessedBy:activeUser,scores:ns});}setGuess(""); };
  const nextRound=async()=>{ if(!gs)return;const ni=(gs.drawerIdx+1)%gs.players.length,word=DW[Math.floor(Math.random()*DW.length)];if(canvasRef.current)canvasRef.current.getContext("2d").clearRect(0,0,300,220);await updateDoc(doc(db,"games","draw"),{word,drawerIdx:ni,drawer:gs.players[ni],guessed:false,guessedBy:null,canvasData:null,round:(gs.round||1)+1}); };
  if(setup)return(<div style={{padding:20,fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:22,fontWeight:900,marginBottom:8,textAlign:"center"}}>🎨 Draw & Guess</div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{USERS.map(u=>{const sel=players.includes(u.id);return<button key={u.id} onClick={()=>setPlayers(sel?players.filter(p=>p!==u.id):[...players,u.id])} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(sel?u.color:"#ddd"),background:sel?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:sel?u.color:"#888"}}>{u.emoji} {u.name}</button>;})}</div><button disabled={players.length<2} onClick={startGame} style={{width:"100%",padding:"12px",borderRadius:20,background:players.length>=2?"#EC4899":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:players.length>=2?"pointer":"default",fontFamily:"inherit"}}>Start 🎨</button><button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button></div>);
  if(!gs)return<div style={{padding:40,textAlign:"center",color:"#aaa"}}>Loading...</div>;
  const isDrawer=gs.drawer===activeUser,drawerUser=USERS.find(u=>u.id===gs.drawer),guesserUser=gs.guessedBy?USERS.find(u=>u.id===gs.guessedBy):null;
  return(<div style={{padding:12,fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:18,fontWeight:900,marginBottom:4,textAlign:"center"}}>🎨 Draw & Guess — Round {gs.round||1}</div><div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>{gs.players.map(uid=>{const u=USERS.find(x=>x.id===uid);return<div key={uid} style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"3px 10px",fontSize:11,fontWeight:800,color:u?.color}}>{u?.emoji} {gs.scores?.[uid]||0}</div>;})}</div><div style={{textAlign:"center",fontSize:13,fontWeight:800,marginBottom:6,color:drawerUser?.color}}>{drawerUser?.emoji} {drawerUser?.name} is drawing{isDrawer&&<span style={{color:"#1e1e1e"}}> — word: <span style={{background:"#fef9c3",padding:"2px 8px",borderRadius:8}}>{gs.word}</span></span>}</div><canvas ref={canvasRef} width={300} height={220} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} style={{width:"100%",maxWidth:300,height:220,border:"2px solid #eee",borderRadius:16,background:"white",cursor:isDrawer?"crosshair":"default",display:"block",margin:"0 auto 8px",touchAction:"none"}}/>{isDrawer&&<button onClick={clearCanvas} style={{display:"block",margin:"0 auto 10px",padding:"5px 16px",borderRadius:20,border:"2px solid #eee",background:"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:12,color:"#888"}}>🗑️ Clear</button>}{!isDrawer&&!gs.guessed&&<div style={{display:"flex",gap:8}}><input value={guess} onChange={e=>setGuess(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitGuess()} placeholder="Your guess..." style={{flex:1,border:"2px solid #EC4899",borderRadius:20,padding:"9px 14px",fontSize:14,fontFamily:"inherit",fontWeight:700,outline:"none"}}/><button onClick={submitGuess} style={{padding:"9px 16px",borderRadius:20,background:"#EC4899",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Guess!</button></div>}{gs.guessed&&<div style={{textAlign:"center",marginTop:8}}><div style={{fontSize:16,fontWeight:900,color:"#10B981",marginBottom:8}}>🎉 {guesserUser?.name} guessed it! Word: <span style={{color:"#EC4899"}}>{gs.word}</span></div><button onClick={nextRound} style={{padding:"10px 24px",borderRadius:20,background:"#EC4899",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Next Round →</button></div>}</div>);
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function FamilyChat() {
  const [screen,setScreen]=useState("launcher");
  const [activeUser,setActiveUser]=useState(null);
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [targetUser,setTargetUser]=useState(null);
  const [showEmoji,setShowEmoji]=useState(null);
  const [showStickers,setShowStickers]=useState(false);
  const [activeStickerPack,setActiveStickerPack]=useState(Object.keys(STICKER_PACKS)[0]);
  const [filter,setFilter]=useState("all");
  const [recording,setRecording]=useState(false);
  const [recordingTime,setRecordingTime]=useState(0);
  const [loading,setLoading]=useState(true);
  const [activeGame,setActiveGame]=useState(null);
  const [replyTo,setReplyTo]=useState(null);
  const [showPollModal,setShowPollModal]=useState(false);
  const [showYoutubeModal,setShowYoutubeModal]=useState(false);
  const [typingUsers,setTypingUsers]=useState([]);
  const [reactionBursts,setReactionBursts]=useState({});
  const [activePanel,setActivePanel]=useState(null);

  const messagesEndRef=useRef(null);
  const fileInputRef=useRef(null);
  const recordTimerRef=useRef(null);
  const mediaRecorderRef=useRef(null);
  const audioChunksRef=useRef([]);
  const audioRefs=useRef({});
  const typingTimeoutRef=useRef(null);

  useEffect(()=>{ const q=query(collection(db,"messages"),orderBy("time","asc")); return onSnapshot(q,snap=>{ const msgs=[]; snap.forEach(d=>msgs.push(Object.assign({id:d.id},d.data()))); setMessages(msgs); setLoading(false); }); },[]);
  useEffect(()=>{ messagesEndRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,screen]);
  useEffect(()=>{ if(recording){recordTimerRef.current=setInterval(()=>setRecordingTime(t=>t+1),1000);}else{clearInterval(recordTimerRef.current);setRecordingTime(0);}return()=>clearInterval(recordTimerRef.current); },[recording]);
  useEffect(()=>{ if(!activeUser)return; return onSnapshot(doc(db,"typing","status"),snap=>{ if(snap.exists()){const data=snap.data(),now=Date.now(),typing=Object.entries(data).filter(([uid,ts])=>uid!==activeUser&&ts&&(now-ts)<4000).map(([uid])=>uid);setTypingUsers(typing);} }); },[activeUser]);

  const updateTyping=async()=>{ if(!activeUser)return; await setDoc(doc(db,"typing","status"),{[activeUser]:Date.now()},{merge:true}); clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current=setTimeout(async()=>{ await setDoc(doc(db,"typing","status"),{[activeUser]:null},{merge:true}); },3000); };

  const user=USERS.find(u=>u.id===activeUser);
  const isTablet=activeUser&&DEVICE_PRESETS[activeUser].device==="tablet";
  const allVisible=messages.filter(m=>!m.to||m.sender===activeUser||m.to===activeUser);
  const dmVisible=messages.filter(m=>m.to!=null&&(m.to===activeUser||m.sender===activeUser));
  const shownMessages=filter==="all"?allVisible:dmVisible;
  const dmCount=messages.filter(m=>m.to===activeUser).length;

  const sendMessage=(text,photo,poll,youtubeUrl)=>{
    const t=text!==undefined?text:input,p=photo||null;
    if(!t.trim()&&!p&&!poll&&!youtubeUrl)return;
    addDoc(collection(db,"messages"),{sender:activeUser,to:targetUser||null,text:t.trim(),time:serverTimestamp(),reactions:{},photo:p,isVoice:false,audioData:null,voiceDuration:0,poll:poll||null,youtubeUrl:youtubeUrl||null,replyTo:replyTo?{id:replyTo.id,sender:replyTo.sender,text:replyTo.text,isVoice:replyTo.isVoice,photo:!!replyTo.photo}:null});
    setInput("");setShowStickers(false);setTargetUser(null);setReplyTo(null);
    setDoc(doc(db,"typing","status"),{[activeUser]:null},{merge:true});
  };

  const handlePhotoUpload=e=>{ const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>sendMessage("",ev.target.result);r.readAsDataURL(file); };
  const startRecording=()=>{ navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{audioChunksRef.current=[];const mr=new MediaRecorder(stream);mediaRecorderRef.current=mr;mr.ondataavailable=e=>{if(e.data.size>0)audioChunksRef.current.push(e.data);};mr.start();setRecording(true);}).catch(()=>alert("Microphone access denied.")); };
  const stopRecording=()=>{ if(!mediaRecorderRef.current)return;const dur=Math.max(recordingTime,1);mediaRecorderRef.current.onstop=()=>{const blob=new Blob(audioChunksRef.current,{type:"audio/webm"});const r=new FileReader();r.onload=ev=>{addDoc(collection(db,"messages"),{sender:activeUser,to:targetUser||null,text:"",time:serverTimestamp(),reactions:{},photo:null,isVoice:true,audioData:ev.target.result,voiceDuration:dur,replyTo:null,poll:null,youtubeUrl:null});setTargetUser(null);};r.readAsDataURL(blob);mediaRecorderRef.current.stream.getTracks().forEach(t=>t.stop());};mediaRecorderRef.current.stop();setRecording(false); };
  const toggleReaction=(msgId,emoji)=>{ const msg=messages.find(m=>m.id===msgId);if(!msg)return;const reactors=(msg.reactions&&msg.reactions[emoji])||[];const already=reactors.includes(activeUser);const updated=already?reactors.filter(u=>u!==activeUser):reactors.concat([activeUser]);const nr=Object.assign({},msg.reactions||{});nr[emoji]=updated;updateDoc(doc(db,"messages",msgId),{reactions:nr});if(!already){setReactionBursts(prev=>({...prev,[msgId+emoji]:true}));setTimeout(()=>setReactionBursts(prev=>{const n={...prev};delete n[msgId+emoji];return n;}),900);}setShowEmoji(null); };

  const GAMES=[
    {id:"ttt",   icon:"🎯",name:"Tic Tac Toe 5×5",  color:"#3B82F6",desc:"4 in a row wins!"},
    {id:"quiz",  icon:"❓",name:"Quiz Battle",        color:"#EC4899",desc:"Answer together!"},
    {id:"memory",icon:"🃏",name:"Memory Cards",       color:"#10B981",desc:"Flip & match!"},
    {id:"word",  icon:"🏆",name:"Word Scramble",      color:"#F59E0B",desc:"Unscramble first!"},
    {id:"dice",  icon:"🎲",name:"Dice Battle",        color:"#8B5CF6",desc:"Highest roll wins!"},
    {id:"draw",  icon:"🎨",name:"Draw & Guess",       color:"#EF4444",desc:"Draw it, guess it!"},
    {id:"spin",  icon:"🎰",name:"Spin the Wheel",     color:"#F97316",desc:"What will it land on?"},
    {id:"wordle",icon:"🟩",name:"Family Wordle",      color:"#10B981",desc:"Guess the 5-letter word!"},
    {id:"uno",   icon:"🃏",name:"UNO Family",         color:"#EF4444",desc:"Match color or number!"},
    {id:"edu",   icon:"📚",name:"Education Quiz",     color:"#3B82F6",desc:"Year 2 & Year 5!"},
  ];

  // LAUNCHER
  if(screen==="launcher") return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",fontFamily:"'Nunito',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{fontSize:56,marginBottom:8}}>👨‍👩‍👧‍👦</div>
      <div style={{fontSize:28,fontWeight:900,color:"white",marginBottom:4}}>Family Chat</div>
      <div style={{fontSize:14,color:"#c4b5fd",fontWeight:600,marginBottom:40}}>عائلة أشرف</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,width:"100%",maxWidth:400}}>
        {USERS.map(u=>(
          <button key={u.id} onClick={()=>{setActiveUser(u.id);setScreen("chat");setFilter("all");}} style={{background:"white",border:"3px solid "+u.color,borderRadius:20,padding:"24px 16px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,boxShadow:"0 8px 32px "+u.color+"44"}}>
            <div style={{fontSize:40}}>{u.emoji}</div>
            <div style={{fontWeight:900,fontSize:16,color:u.color}}>{u.name}</div>
            <div style={{fontSize:11,color:"#888",fontWeight:700}}>{u.role}</div>
            <div style={{fontSize:11,background:u.bg,color:u.color,borderRadius:20,padding:"2px 10px",fontWeight:700}}>{DEVICE_PRESETS[u.id].label}</div>
          </button>
        ))}
      </div>
    </div>
  );

  // ACTIVE GAME
  if(activeGame) return (
    <div style={{minHeight:"100vh",background:"#f8f8f8",fontFamily:"'Nunito',sans-serif",display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{background:"linear-gradient(135deg,"+user.color+","+user.color+"bb)",padding:"14px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 4px 16px rgba(0,0,0,0.18)"}}>
        <button onClick={()=>setActiveGame(null)} style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",fontSize:18,cursor:"pointer"}}>‹</button>
        <div style={{fontSize:18,fontWeight:900,color:"white"}}>🎮 {GAMES.find(g=>g.id===activeGame)?.name}</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:16}}>
        <div style={{background:"white",borderRadius:24,boxShadow:"0 4px 20px rgba(0,0,0,0.1)",overflow:"hidden",maxWidth:420,margin:"0 auto"}}>
          {activeGame==="ttt"&&<TicTacToe activeUser={activeUser} onClose={()=>setActiveGame(null)}/>}
          {activeGame==="quiz"&&<QuizBattle activeUser={activeUser} onClose={()=>setActiveGame(null)}/>}
          {activeGame==="memory"&&<MemoryGame activeUser={activeUser} onClose={()=>setActiveGame(null)}/>}
          {activeGame==="word"&&<WordScramble activeUser={activeUser} onClose={()=>setActiveGame(null)}/>}
          {activeGame==="dice"&&<DiceBattle activeUser={activeUser} onClose={()=>setActiveGame(null)}/>}
          {activeGame==="draw"&&<DrawGuess activeUser={activeUser} onClose={()=>setActiveGame(null)}/>}
          {activeGame==="spin"&&<SpinWheel onClose={()=>setActiveGame(null)}/>}
          {activeGame==="wordle"&&<WordleGame activeUser={activeUser} onClose={()=>setActiveGame(null)}/>}
          {activeGame==="uno"&&<UnoGame activeUser={activeUser} onClose={()=>setActiveGame(null)}/>}
          {activeGame==="edu"&&<EduQuiz activeUser={activeUser} onClose={()=>setActiveGame(null)}/>}
        </div>
      </div>
    </div>
  );

  // PANELS
  const PanelWrap=({title,children})=><div style={{minHeight:"100vh",background:user?.bg,fontFamily:"'Nunito',sans-serif",display:"flex",flexDirection:"column"}}><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/><div style={{background:"linear-gradient(135deg,"+user?.color+","+user?.color+"bb)",padding:"14px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 4px 16px rgba(0,0,0,0.18)"}}><button onClick={()=>setActivePanel(null)} style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",fontSize:18,cursor:"pointer"}}>‹</button><div style={{fontSize:18,fontWeight:900,color:"white"}}>{title}</div></div>{children}</div>;

  if(activePanel==="tasks")       return <PanelWrap title="📋 Tasks"><TasksPanel activeUser={activeUser} onClose={()=>setActivePanel(null)}/></PanelWrap>;
  if(activePanel==="events")      return <PanelWrap title="📅 Events"><EventsPanel activeUser={activeUser} onClose={()=>setActivePanel(null)}/></PanelWrap>;
  if(activePanel==="album")       return <PanelWrap title="📸 Album"><PhotoAlbum activeUser={activeUser} onClose={()=>setActivePanel(null)}/></PanelWrap>;
  if(activePanel==="journal")     return <PanelWrap title="📖 Journal"><JournalPanel activeUser={activeUser} onClose={()=>setActivePanel(null)}/></PanelWrap>;
  if(activePanel==="leaderboard") return <PanelWrap title="🏆 Leaderboard"><LeaderboardPanel activeUser={activeUser} onClose={()=>setActivePanel(null)}/></PanelWrap>;

  // MAIN CHAT
  return (
    <div style={{fontFamily:"'Nunito',sans-serif",minHeight:"100vh",background:user.bg,display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,"+user.color+","+user.color+"bb)",padding:"10px 12px",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px rgba(0,0,0,0.18)",position:"sticky",top:0,zIndex:20}}>
        <button onClick={()=>setScreen("launcher")} style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:"50%",width:32,height:32,color:"white",fontSize:16,cursor:"pointer",flexShrink:0}}>‹</button>
        <div style={{fontSize:22}}>👨‍👩‍👧‍👦</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:15,fontWeight:900,color:"white"}}>Family Chat</div><div style={{fontSize:9,color:"rgba(255,255,255,0.8)",fontWeight:700}}>Achraf · Loubna · Soltan · Hasnae</div></div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap",justifyContent:"flex-end"}}>
          {[["📋","tasks"],["📅","events"],["📸","album"],["📖","journal"],["🏆","leaderboard"],["🎮","games"]].map(([icon,id])=>(
            <button key={id} onClick={()=>id==="games"?setScreen("games"):setActivePanel(id)} style={{background:"rgba(255,255,255,0.22)",border:"none",borderRadius:12,padding:"4px 7px",color:"white",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{icon}</button>
          ))}
        </div>
      </div>

      {/* Banners */}
      <BirthdayBanner/>
      <GreetingBanner activeUser={activeUser}/>

      {/* Games screen */}
      {screen==="games"?(
        <div style={{flex:1,padding:16,display:"flex",flexDirection:"column",gap:10,overflowY:"auto"}}>
          <div style={{fontSize:22,fontWeight:900,color:user.color,textAlign:"center",marginBottom:4}}>🎮 Family Games</div>
          {GAMES.map(g=>(
            <button key={g.id} onClick={()=>setActiveGame(g.id)} style={{background:"white",border:"2px solid "+g.color,borderRadius:18,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:"inherit"}}>
              <div style={{fontSize:28}}>{g.icon}</div>
              <div style={{textAlign:"left"}}><div style={{fontWeight:900,fontSize:14,color:g.color}}>{g.name}</div><div style={{fontSize:11,color:"#888",fontWeight:600}}>{g.desc}</div></div>
            </button>
          ))}
          <button onClick={()=>setScreen("chat")} style={{padding:"12px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>← Back to Chat</button>
        </div>
      ):(
        <>
          {/* Tabs */}
          <div style={{display:"flex",borderBottom:"2px solid #eee",background:"white"}}>
            <button onClick={()=>setFilter("all")} style={{flex:1,padding:"10px 0",border:"none",background:"none",fontFamily:"inherit",fontWeight:800,fontSize:13,cursor:"pointer",color:filter==="all"?user.color:"#aaa",borderBottom:filter==="all"?"3px solid "+user.color:"3px solid transparent"}}>👥 Group</button>
            <button onClick={()=>setFilter("dm")} style={{flex:1,padding:"10px 0",border:"none",background:"none",fontFamily:"inherit",fontWeight:800,fontSize:13,cursor:"pointer",color:filter==="dm"?user.color:"#aaa",borderBottom:filter==="dm"?"3px solid "+user.color:"3px solid transparent"}}>{"💌 DMs"+(dmCount?" ("+dmCount+")":"")}</button>
          </div>

          {isTablet&&<div style={{background:user.color+"18",borderBottom:"2px dashed "+user.color+"44",padding:"6px 16px",textAlign:"center",fontSize:12,fontWeight:800,color:user.color}}>{user.emoji} Hey {user.name}! 👋</div>}

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
            {loading&&<div style={{textAlign:"center",padding:40,color:"#aaa",fontWeight:700}}>Loading... 💬</div>}
            {!loading&&shownMessages.length===0&&<div style={{textAlign:"center",padding:40,color:"#aaa",fontWeight:700}}>No messages yet! Say hello 👋</div>}
            {shownMessages.map((msg,i)=>{
              const sender=USERS.find(u=>u.id===msg.sender); if(!sender) return null;
              const recipient=msg.to?USERS.find(u=>u.id===msg.to):null;
              const isMe=msg.sender===activeUser, isDM=!!msg.to;
              const showAvatar=i===0||shownMessages[i-1].sender!==msg.sender;
              const replyUser=msg.replyTo?USERS.find(u=>u.id===msg.replyTo.sender):null;
              return (
                <div key={msg.id} style={{display:"flex",flexDirection:isMe?"row-reverse":"row",alignItems:"flex-end",gap:8}}>
                  <div style={{width:isTablet?40:34,height:isTablet?40:34,borderRadius:"50%",background:sender.bg,border:"2px solid "+sender.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isTablet?22:18,flexShrink:0,opacity:showAvatar?1:0}}>{sender.emoji}</div>
                  <div style={{maxWidth:"72%",display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start",gap:2}}>
                    {showAvatar&&!isMe&&<div style={{fontSize:11,fontWeight:800,color:sender.color,paddingLeft:4}}>{sender.name}</div>}
                    {isDM&&recipient&&<div style={{fontSize:10,fontWeight:800,color:isMe?sender.color:recipient.color,padding:"2px 8px",background:isMe?sender.color+"18":recipient.color+"18",borderRadius:20,border:"1.5px solid "+(isMe?sender.color:recipient.color)+"44",marginBottom:2,alignSelf:isMe?"flex-end":"flex-start"}}>{isMe?"💌 to "+recipient.emoji+" "+recipient.name:sender.emoji+" → 💌 you"}</div>}
                    {msg.replyTo&&<div style={{background:"#f5f5f5",borderLeft:"3px solid "+(replyUser?.color||"#aaa"),borderRadius:"10px 10px 0 0",padding:"5px 10px",fontSize:11,fontWeight:700,color:"#888"}}><span style={{color:replyUser?.color}}>{replyUser?.emoji} {replyUser?.name}: </span>{msg.replyTo.isVoice?"🎙️":msg.replyTo.photo?"📷":msg.replyTo.text?.slice(0,50)}</div>}
                    <div style={{position:"relative"}}>
                      {reactionBursts[msg.id+(Object.keys(msg.reactions||{}).slice(-1)[0])]&&<ReactionBurst emoji={Object.keys(msg.reactions||{}).slice(-1)[0]} onDone={()=>{}}/>}
                      <div onClick={()=>setShowEmoji(showEmoji===msg.id?null:msg.id)} onDoubleClick={()=>setReplyTo(msg)}
                        style={{background:isMe?sender.color+"33":"white",border:"2px solid "+(isDM&&recipient?(isMe?sender.color:recipient.color):sender.color),borderRadius:isMe?"20px 4px 20px 20px":"4px 20px 20px 20px",padding:"10px 14px",cursor:"pointer",boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
                        {msg.poll&&<PollMessage msg={msg} activeUser={activeUser}/>}
                        {msg.youtubeUrl&&<YoutubeMessage msg={msg}/>}
                        {!msg.poll&&!msg.youtubeUrl&&<>
                          {msg.photo&&<img src={msg.photo} alt="shared" style={{maxWidth:200,maxHeight:200,borderRadius:12,display:"block",marginBottom:msg.text?8:0}}/>}
                          {msg.isVoice&&msg.audioData&&(<div style={{display:"flex",alignItems:"center",gap:8,minWidth:150}}>
                            <button onClick={e=>{e.stopPropagation();const a=audioRefs.current[msg.id];if(a){if(a.paused)a.play();else{a.pause();a.currentTime=0;}}}} style={{width:30,height:30,borderRadius:"50%",background:sender.color,border:"none",color:"white",cursor:"pointer",fontSize:12,flexShrink:0}}>▶</button>
                            <audio ref={el=>{audioRefs.current[msg.id]=el;}} src={msg.audioData} style={{display:"none"}}/>
                            <div style={{flex:1}}><div style={{height:4,background:sender.color+"33",borderRadius:4}}><div style={{height:"100%",width:"40%",background:sender.color,borderRadius:4}}/></div><div style={{fontSize:10,color:"#888",marginTop:2,fontWeight:700}}>{msg.voiceDuration}s</div></div>
                          </div>)}
                          {msg.text&&<div style={{fontSize:msg.text.length<=2?(isTablet?48:40):(isTablet?16:14),fontWeight:600,color:"#1e1e1e",lineHeight:1.5}}>{msg.text}</div>}
                        </>}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <div style={{fontSize:10,color:"#bbb",fontWeight:600}}>{fmt(msg.time)}</div>
                      {isMe&&<ReadReceipts sender={msg.sender}/>}
                      <button onClick={()=>setReplyTo(msg)} style={{fontSize:10,color:"#ccc",background:"none",border:"none",cursor:"pointer",padding:0}}>↩️</button>
                    </div>
                    {msg.reactions&&Object.keys(msg.reactions).length>0&&(
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",padding:"2px 0"}}>
                        {Object.entries(msg.reactions).map(([emoji,users])=>users&&users.length>0?<span key={emoji} onClick={()=>toggleReaction(msg.id,emoji)} style={{background:users.includes(activeUser)?user.color+"22":"white",border:"2px solid "+(users.includes(activeUser)?user.color:"#eee"),borderRadius:20,padding:"2px 8px",fontSize:13,cursor:"pointer",fontWeight:700}}>{emoji} {users.length}</span>:null)}
                      </div>
                    )}
                    {showEmoji===msg.id&&(
                      <div style={{display:"flex",flexWrap:"wrap",gap:4,background:"white",borderRadius:30,padding:"6px 10px",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",border:"2px solid #eee",zIndex:10,maxWidth:220}}>
                        {EMOJI_REACTIONS.map(e=><span key={e} onClick={()=>toggleReaction(msg.id,e)} style={{fontSize:isTablet?24:20,cursor:"pointer",padding:3}}>{e}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {typingUsers.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {typingUsers.map(uid=>{ const u=USERS.find(x=>x.id===uid); return <div key={uid} style={{display:"flex",alignItems:"flex-end",gap:8}}><div style={{width:30,height:30,borderRadius:"50%",background:u?.bg,border:"2px solid "+u?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{u?.emoji}</div><TypingDots color={u?.color||"#aaa"}/></div>; })}
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {replyTo&&<ReplyPreview msg={replyTo} onCancel={()=>setReplyTo(null)}/>}

          {/* Stickers */}
          {showStickers&&(
            <div style={{background:"white",borderTop:"2px solid #eee"}}>
              <div style={{display:"flex",overflowX:"auto",padding:"6px 10px",gap:6,borderBottom:"1px solid #f0f0f0"}}>
                {Object.keys(STICKER_PACKS).map(pack=><button key={pack} onClick={()=>setActiveStickerPack(pack)} style={{flexShrink:0,padding:"3px 8px",borderRadius:20,border:"2px solid "+(activeStickerPack===pack?user.color:"#eee"),background:activeStickerPack===pack?user.color+"18":"white",fontWeight:800,fontSize:10,color:activeStickerPack===pack?user.color:"#888",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{pack}</button>)}
              </div>
              <div style={{padding:"8px 10px",display:"flex",flexWrap:"wrap",gap:5,maxHeight:100,overflowY:"auto"}}>
                {STICKER_PACKS[activeStickerPack].map(s=><span key={s} onClick={()=>sendMessage(s)} style={{fontSize:isTablet?28:22,cursor:"pointer",padding:3,borderRadius:8,background:"#f5f5f5"}}>{s}</span>)}
              </div>
            </div>
          )}

          {/* Send-to + extras bar */}
          <div style={{background:"white",borderTop:"2px solid #eee",padding:"4px 10px",display:"flex",alignItems:"center",gap:4,overflowX:"auto"}}>
            <span style={{fontSize:10,fontWeight:800,color:"#aaa",flexShrink:0}}>To:</span>
            <button onClick={()=>setTargetUser(null)} style={{flexShrink:0,padding:"3px 7px",borderRadius:20,border:"2px solid "+(!targetUser?user.color:"#ddd"),background:!targetUser?user.color+"18":"white",fontWeight:800,fontSize:10,color:!targetUser?user.color:"#888",cursor:"pointer",fontFamily:"inherit"}}>👥</button>
            {USERS.filter(u=>u.id!==activeUser).map(u=><button key={u.id} onClick={()=>setTargetUser(targetUser===u.id?null:u.id)} style={{flexShrink:0,padding:"3px 7px",borderRadius:20,border:"2px solid "+(targetUser===u.id?u.color:"#ddd"),background:targetUser===u.id?u.color+"18":"white",fontWeight:800,fontSize:10,color:targetUser===u.id?u.color:"#888",cursor:"pointer",fontFamily:"inherit"}}>{u.emoji}</button>)}
            <div style={{flex:1}}/>
            <button onClick={()=>setShowPollModal(true)} style={{flexShrink:0,padding:"3px 7px",borderRadius:20,border:"2px solid #3B82F6",background:"#eff6ff",fontWeight:800,fontSize:10,color:"#3B82F6",cursor:"pointer",fontFamily:"inherit"}}>📊</button>
            <button onClick={()=>setShowYoutubeModal(true)} style={{flexShrink:0,padding:"3px 7px",borderRadius:20,border:"2px solid #EF4444",background:"#fef2f2",fontWeight:800,fontSize:10,color:"#EF4444",cursor:"pointer",fontFamily:"inherit"}}>🎵</button>
          </div>

          {/* Input bar */}
          <div style={{background:"white",borderTop:"2px solid #eee",padding:isTablet?"10px 12px":"7px 10px",display:"flex",alignItems:"center",gap:isTablet?8:5,boxShadow:"0 -4px 20px rgba(0,0,0,0.06)"}}>
            <button onClick={()=>setShowStickers(!showStickers)} style={{width:isTablet?44:34,height:isTablet?44:34,borderRadius:"50%",border:"2px solid "+user.color,background:showStickers?user.color+"22":"white",fontSize:isTablet?20:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>🌟</button>
            <button onClick={()=>fileInputRef.current.click()} style={{width:isTablet?44:34,height:isTablet?44:34,borderRadius:"50%",border:"2px solid "+user.color,background:"white",fontSize:isTablet?20:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>📷</button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhotoUpload}/>
            <input value={input} onChange={e=>{setInput(e.target.value);updateTyping();}} onKeyDown={e=>e.key==="Enter"&&sendMessage(input)}
              placeholder={targetUser?"💌 to "+USERS.find(u=>u.id===targetUser)?.name+"...":"Message everyone 💬"}
              style={{flex:1,border:"2px solid "+(targetUser?USERS.find(u=>u.id===targetUser)?.color:user.color),borderRadius:25,padding:isTablet?"10px 14px":"8px 12px",fontSize:isTablet?15:13,fontFamily:"inherit",fontWeight:600,outline:"none",background:targetUser?USERS.find(u=>u.id===targetUser)?.bg:user.bg,color:"#1e1e1e"}}/>
            <button onClick={()=>recording?stopRecording():startRecording()} style={{width:isTablet?44:34,height:isTablet?44:34,borderRadius:"50%",border:"2px solid "+(recording?"#EF4444":user.color),background:recording?"#FEE2E2":"white",fontSize:isTablet?20:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{recording?"🔴":"🎙️"}</button>
            <button onClick={()=>sendMessage(input)} style={{width:isTablet?48:38,height:isTablet?48:38,borderRadius:"50%",background:"linear-gradient(135deg,"+user.color+","+user.color+"aa)",border:"none",fontSize:isTablet?20:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"white",flexShrink:0}}>➤</button>
          </div>
        </>
      )}

      {recording&&(
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"white",borderRadius:20,padding:"20px 32px",boxShadow:"0 8px 40px rgba(0,0,0,0.2)",textAlign:"center",zIndex:100,border:"3px solid #EF4444"}}>
          <div style={{fontSize:40,marginBottom:8}}>🎙️</div>
          <div style={{fontWeight:800,fontSize:16,color:"#EF4444"}}>Recording... {recordingTime}s</div>
          <div style={{fontSize:12,color:"#888",marginTop:4}}>Tap mic again to send</div>
        </div>
      )}
      {showPollModal&&<CreatePollModal onSend={(poll)=>{sendMessage("",null,poll);setShowPollModal(false);}} onClose={()=>setShowPollModal(false)}/>}
      {showYoutubeModal&&<YoutubeModal onSend={(url)=>{sendMessage("",null,null,url);setShowYoutubeModal(false);}} onClose={()=>setShowYoutubeModal(false)}/>}
      <style>{`@keyframes burstUp{0%{opacity:1;transform:translateX(-50%) scale(1) translateY(0)}100%{opacity:0;transform:translateX(-50%) scale(2) translateY(-50px)}}`}</style>
    </div>
  );
}