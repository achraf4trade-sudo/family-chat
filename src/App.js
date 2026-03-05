import { useState, useRef, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc } from "firebase/firestore";

const USERS = [
  { id: "achraf", name: "Achraf", role: "Dad",         emoji: "👨", color: "#3B82F6", bg: "#eff6ff" },
  { id: "loubna", name: "Loubna", role: "Mum",         emoji: "👩", color: "#EC4899", bg: "#fdf2f8" },
  { id: "soltan", name: "Soltan", role: "Son 🎮",      emoji: "🧒", color: "#10B981", bg: "#ecfdf5" },
  { id: "hasnae", name: "Hasnae", role: "Daughter 🌸", emoji: "👧", color: "#F59E0B", bg: "#fffbeb" },
];
const DEVICE_PRESETS = {
  achraf: { device:"phone",  label:"📱 Dad's Phone" },
  loubna: { device:"phone",  label:"📱 Mum's Phone" },
  soltan: { device:"tablet", label:"📟 Soltan's Tablet" },
  hasnae: { device:"tablet", label:"📟 Hasnae's Tablet" },
};
const EMOJI_REACTIONS = ["❤️","😂","😮","👍","🎉","🔥"];
const STICKERS = ["🌈","⭐","🦄","🍕","🎮","🐶","🐱","🦁","🎨","🎵","🏆","🌟","🌺","🦋","🍦","🎀"];
const fmt = d => d&&d.toDate ? d.toDate().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});

const TRIVIA = [
  {q:"What is the capital of France?", a:"Paris", opts:["London","Paris","Berlin","Madrid"]},
  {q:"How many legs does a spider have?", a:"8", opts:["6","8","10","4"]},
  {q:"What color is the sun?", a:"Yellow", opts:["Red","Blue","Yellow","White"]},
  {q:"What is 7 × 8?", a:"56", opts:["54","56","48","63"]},
  {q:"Which animal is the fastest?", a:"Cheetah", opts:["Lion","Horse","Cheetah","Eagle"]},
  {q:"How many continents are there?", a:"7", opts:["5","6","7","8"]},
  {q:"What is the largest ocean?", a:"Pacific", opts:["Atlantic","Indian","Pacific","Arctic"]},
  {q:"What is 15 + 27?", a:"42", opts:["40","41","42","43"]},
];
const MATH_QS = [
  {q:"5 + 3 = ?", a:8}, {q:"12 - 7 = ?", a:5}, {q:"4 × 6 = ?", a:24},
  {q:"20 ÷ 4 = ?", a:5}, {q:"9 + 13 = ?", a:22}, {q:"8 × 7 = ?", a:56},
  {q:"100 - 37 = ?", a:63}, {q:"6 × 6 = ?", a:36}, {q:"45 ÷ 9 = ?", a:5},
  {q:"17 + 25 = ?", a:42},
];

function TicTacToe({ activeUser, onClose }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xUser, setXUser] = useState(null);
  const [oUser, setOUser] = useState(null);
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState(null);
  const [setup, setSetup] = useState(true);
  const checkWinner = b => {
    const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for(var l of lines) if(b[l[0]]&&b[l[0]]===b[l[1]]&&b[l[0]]===b[l[2]]) return b[l[0]];
    if(b.every(Boolean)) return "Draw";
    return null;
  };
  const click = i => {
    if(board[i]||winner) return;
    if(turn==="X"&&activeUser!==xUser) return;
    if(turn==="O"&&activeUser!==oUser) return;
    const nb=[...board]; nb[i]=turn;
    const w=checkWinner(nb);
    setBoard(nb); setWinner(w);
    if(!w) setTurn(turn==="X"?"O":"X");
  };
  const xu=USERS.find(u=>u.id===xUser), ou=USERS.find(u=>u.id===oUser);
  if(setup) return (
    <div style={{padding:20,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:24,fontWeight:900,marginBottom:16,textAlign:"center"}}>🎯 Tic Tac Toe</div>
      <div style={{marginBottom:12,fontWeight:800,color:"#555"}}>Who plays X?</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {USERS.map(u=><button key={u.id} onClick={()=>setXUser(u.id)} style={{padding:"8px 14px",borderRadius:20,border:"2px solid "+(xUser===u.id?u.color:"#ddd"),background:xUser===u.id?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:xUser===u.id?u.color:"#888"}}>{u.emoji} {u.name}</button>)}
      </div>
      <div style={{marginBottom:12,fontWeight:800,color:"#555"}}>Who plays O?</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:24}}>
        {USERS.filter(u=>u.id!==xUser).map(u=><button key={u.id} onClick={()=>setOUser(u.id)} style={{padding:"8px 14px",borderRadius:20,border:"2px solid "+(oUser===u.id?u.color:"#ddd"),background:oUser===u.id?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:oUser===u.id?u.color:"#888"}}>{u.emoji} {u.name}</button>)}
      </div>
      <button disabled={!xUser||!oUser} onClick={()=>setSetup(false)} style={{width:"100%",padding:"12px",borderRadius:20,background:xUser&&oUser?"#3B82F6":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:16,cursor:xUser&&oUser?"pointer":"default",fontFamily:"inherit"}}>Start Game 🎯</button>
      <button onClick={onClose} style={{width:"100%",padding:"10px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button>
    </div>
  );
  return (
    <div style={{padding:20,fontFamily:"'Nunito',sans-serif",textAlign:"center"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:8}}>🎯 Tic Tac Toe</div>
      <div style={{fontSize:13,fontWeight:800,marginBottom:16,color:"#888"}}>
        {xu&&<span style={{color:xu.color}}>{xu.emoji} {xu.name} = X</span>} &nbsp;vs&nbsp; {ou&&<span style={{color:ou.color}}>{ou.emoji} {ou.name} = O</span>}
      </div>
      {!winner&&<div style={{fontSize:14,fontWeight:800,marginBottom:12,color:turn==="X"?xu?.color:ou?.color}}>
        {turn==="X"?xu?.emoji+" "+xu?.name:ou?.emoji+" "+ou?.name}'s turn ({turn})
        {activeUser!==(turn==="X"?xUser:oUser)&&<span style={{color:"#aaa"}}> — waiting...</span>}
      </div>}
      {winner&&<div style={{fontSize:18,fontWeight:900,marginBottom:12,color:winner==="Draw"?"#888":winner==="X"?xu?.color:ou?.color}}>
        {winner==="Draw"?"🤝 Draw!":`🏆 ${winner==="X"?xu?.name:ou?.name} wins!`}
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,maxWidth:240,margin:"0 auto 16px"}}>
        {board.map((cell,i)=>(
          <button key={i} onClick={()=>click(i)} style={{height:72,borderRadius:16,border:"2px solid #eee",background:cell?"white":"#f8f8f8",fontSize:28,fontWeight:900,cursor:"pointer",color:cell==="X"?xu?.color:ou?.color,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>{cell}</button>
        ))}
      </div>
      <button onClick={()=>{setBoard(Array(9).fill(null));setWinner(null);setTurn("X");}} style={{padding:"8px 20px",borderRadius:20,background:"#3B82F6",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginRight:8}}>Restart 🔄</button>
      <button onClick={onClose} style={{padding:"8px 20px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Close</button>
    </div>
  );
}

function MathQuiz({ activeUser, onClose }) {
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const q = MATH_QS[qi];
  const u = USERS.find(u=>u.id===activeUser);
  const submit = () => {
    const correct=parseInt(answer)===q.a;
    setFeedback(correct);
    if(correct) setScore(s=>s+1);
    setTimeout(()=>{ setFeedback(null); setAnswer(""); if(qi+1>=MATH_QS.length) setDone(true); else setQi(i=>i+1); },1000);
  };
  if(done) return (
    <div style={{padding:24,textAlign:"center",fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:48,marginBottom:8}}>🏆</div>
      <div style={{fontSize:22,fontWeight:900,marginBottom:8}}>{u?.name}'s Score</div>
      <div style={{fontSize:48,fontWeight:900,color:u?.color,marginBottom:16}}>{score}/{MATH_QS.length}</div>
      <div style={{fontSize:16,color:"#888",marginBottom:24}}>{score>=8?"Amazing! 🌟":score>=5?"Good job! 👍":"Keep practicing! 💪"}</div>
      <button onClick={()=>{setQi(0);setScore(0);setDone(false);}} style={{padding:"10px 24px",borderRadius:20,background:u?.color,color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginRight:8}}>Play Again 🔄</button>
      <button onClick={onClose} style={{padding:"10px 24px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Close</button>
    </div>
  );
  return (
    <div style={{padding:24,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:4,textAlign:"center"}}>🔢 Math Quiz</div>
      <div style={{fontSize:13,color:"#aaa",fontWeight:700,textAlign:"center",marginBottom:20}}>Question {qi+1}/{MATH_QS.length} · Score: {score}</div>
      <div style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:20,padding:"20px",textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:28,fontWeight:900,color:u?.color}}>{q.q}</div>
      </div>
      <input value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>e.key==="Enter"&&answer&&submit()} placeholder="Your answer..." type="number"
        style={{width:"100%",border:"2px solid "+(feedback===null?"#ddd":feedback?"#10B981":"#EF4444"),borderRadius:20,padding:"12px 16px",fontSize:18,fontFamily:"inherit",fontWeight:700,outline:"none",boxSizing:"border-box",background:feedback===null?"white":feedback?"#ecfdf5":"#fef2f2",textAlign:"center",marginBottom:12}}/>
      {feedback!==null&&<div style={{textAlign:"center",fontSize:18,fontWeight:900,color:feedback?"#10B981":"#EF4444",marginBottom:8}}>{feedback?"✅ Correct!":"❌ Answer: "+q.a}</div>}
      <button onClick={submit} disabled={!answer} style={{width:"100%",padding:"12px",borderRadius:20,background:answer?u?.color:"#ddd",color:"white",border:"none",fontWeight:900,fontSize:16,cursor:answer?"pointer":"default",fontFamily:"inherit"}}>Submit ➤</button>
      <button onClick={onClose} style={{width:"100%",padding:"10px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Close</button>
    </div>
  );
}

function Trivia({ activeUser, onClose }) {
  const [qi, setQi] = useState(()=>Math.floor(Math.random()*TRIVIA.length));
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [count, setCount] = useState(0);
  const q = TRIVIA[qi];
  const u = USERS.find(u=>u.id===activeUser);
  const pick = opt => {
    if(answered) return;
    setAnswered(opt);
    if(opt===q.a) setScore(s=>s+1);
    setTimeout(()=>{ setAnswered(null); setQi(Math.floor(Math.random()*TRIVIA.length)); setCount(c=>c+1); },1200);
  };
  if(count>=8) return (
    <div style={{padding:24,textAlign:"center",fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:48,marginBottom:8}}>🧠</div>
      <div style={{fontSize:22,fontWeight:900,marginBottom:8}}>{u?.name}'s Trivia Score</div>
      <div style={{fontSize:48,fontWeight:900,color:u?.color,marginBottom:16}}>{score}/8</div>
      <div style={{fontSize:16,color:"#888",marginBottom:24}}>{score>=7?"Genius! 🌟":score>=5?"Smart! 👍":"Keep learning! 📚"}</div>
      <button onClick={()=>{setScore(0);setCount(0);setAnswered(null);}} style={{padding:"10px 24px",borderRadius:20,background:u?.color,color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginRight:8}}>Play Again 🔄</button>
      <button onClick={onClose} style={{padding:"10px 24px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Close</button>
    </div>
  );
  return (
    <div style={{padding:24,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:4,textAlign:"center"}}>🧠 Trivia</div>
      <div style={{fontSize:13,color:"#aaa",fontWeight:700,textAlign:"center",marginBottom:20}}>Q {count+1}/8 · Score: {score}</div>
      <div style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:20,padding:20,marginBottom:16}}>
        <div style={{fontSize:17,fontWeight:800,color:"#1e1e1e",textAlign:"center"}}>{q.q}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        {q.opts.map(opt=>{
          var bg="white",border="2px solid #eee",color="#1e1e1e";
          if(answered===opt){bg=opt===q.a?"#ecfdf5":"#fef2f2";border="2px solid "+(opt===q.a?"#10B981":"#EF4444");color=opt===q.a?"#10B981":"#EF4444";}
          else if(answered&&opt===q.a){bg="#ecfdf5";border="2px solid #10B981";color="#10B981";}
          return <button key={opt} onClick={()=>pick(opt)} style={{padding:"12px 8px",borderRadius:16,border,background:bg,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",color}}>{opt}</button>;
        })}
      </div>
      <button onClick={onClose} style={{width:"100%",padding:"10px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Close</button>
    </div>
  );
}

function Drawing({ onClose }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#3B82F6");
  const [size, setSize] = useState(4);
  const [showWord, setShowWord] = useState(false);
  const [word] = useState(()=>{const w=["cat","house","tree","sun","car","fish","apple","star","moon","flower"];return w[Math.floor(Math.random()*w.length)];});
  const colors=["#3B82F6","#EC4899","#10B981","#F59E0B","#EF4444","#8B5CF6","#000000","#ffffff"];
  const getPos = e => { const r=canvasRef.current.getBoundingClientRect(); if(e.touches) return {x:e.touches[0].clientX-r.left,y:e.touches[0].clientY-r.top}; return {x:e.clientX-r.left,y:e.clientY-r.top}; };
  const start = e => { e.preventDefault(); setDrawing(true); const {x,y}=getPos(e); const ctx=canvasRef.current.getContext("2d"); ctx.beginPath(); ctx.moveTo(x,y); };
  const move = e => { e.preventDefault(); if(!drawing) return; const {x,y}=getPos(e); const ctx=canvasRef.current.getContext("2d"); ctx.strokeStyle=color; ctx.lineWidth=size; ctx.lineCap="round"; ctx.lineTo(x,y); ctx.stroke(); };
  const end = () => setDrawing(false);
  const clear = () => { const ctx=canvasRef.current.getContext("2d"); ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height); };
  return (
    <div style={{padding:16,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:20,fontWeight:900,marginBottom:8,textAlign:"center"}}>🎨 Draw & Guess</div>
      <div style={{textAlign:"center",marginBottom:10}}>
        <button onClick={()=>setShowWord(!showWord)} style={{padding:"6px 16px",borderRadius:20,background:"#3B82F6",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>{showWord?"Hide Word 🙈":"Show My Word 👁"}</button>
        {showWord&&<div style={{fontSize:20,fontWeight:900,color:"#3B82F6",marginTop:8}}>Draw: <span style={{textTransform:"uppercase"}}>{word}</span></div>}
      </div>
      <canvas ref={canvasRef} width={320} height={220} style={{border:"2px solid #eee",borderRadius:16,display:"block",margin:"0 auto 12px",background:"white",touchAction:"none",cursor:"crosshair"}}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
      <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginBottom:10}}>
        {colors.map(c=><button key={c} onClick={()=>setColor(c)} style={{width:28,height:28,borderRadius:"50%",background:c,border:color===c?"3px solid #333":"2px solid #ddd",cursor:"pointer"}}/>)}
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:12,alignItems:"center"}}>
        <span style={{fontSize:12,fontWeight:700,color:"#888"}}>Size:</span>
        {[2,4,8,14].map(s=><button key={s} onClick={()=>setSize(s)} style={{width:s+16,height:s+16,borderRadius:"50%",background:"#333",border:size===s?"3px solid #3B82F6":"2px solid #ddd",cursor:"pointer"}}/>)}
        <button onClick={clear} style={{padding:"4px 14px",borderRadius:20,background:"#fef2f2",border:"2px solid #EF4444",color:"#EF4444",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:12,marginLeft:8}}>Clear 🗑</button>
      </div>
      <button onClick={onClose} style={{width:"100%",padding:"10px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Close</button>
    </div>
  );
}

export default function FamilyChat() {
  const [screen, setScreen] = useState("launcher");
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [targetUser, setTargetUser] = useState(null);
  const [showEmoji, setShowEmoji] = useState(null);
  const [showStickers, setShowStickers] = useState(false);
  const [filter, setFilter] = useState("all");
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recordTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRefs = useRef({});

  useEffect(()=>{
    var q=query(collection(db,"messages"),orderBy("time","asc"));
    var unsub=onSnapshot(q,snap=>{ var msgs=[]; snap.forEach(d=>msgs.push(Object.assign({id:d.id},d.data()))); setMessages(msgs); setLoading(false); });
    return ()=>unsub();
  },[]);

  useEffect(()=>{ messagesEndRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,screen]);

  useEffect(()=>{
    if(recording){ recordTimerRef.current=setInterval(()=>setRecordingTime(t=>t+1),1000); }
    else{ clearInterval(recordTimerRef.current); setRecordingTime(0); }
    return ()=>clearInterval(recordTimerRef.current);
  },[recording]);

  var user=USERS.find(u=>u.id===activeUser);
  var isTablet=activeUser&&DEVICE_PRESETS[activeUser].device==="tablet";
  var allVisible=messages.filter(m=>{ if(!m.to) return true; return m.sender===activeUser||m.to===activeUser; });
  var dmVisible=messages.filter(m=>m.to!=null&&(m.to===activeUser||m.sender===activeUser));
  var shownMessages=filter==="all"?allVisible:dmVisible;
  var dmCount=messages.filter(m=>m.to===activeUser).length;

  var sendMessage=(text,photo)=>{
    var t=text!==undefined?text:input, p=photo||null;
    if(!t.trim()&&!p) return;
    addDoc(collection(db,"messages"),{sender:activeUser,to:targetUser||null,text:t.trim(),time:serverTimestamp(),reactions:{},photo:p,isVoice:false,audioData:null,voiceDuration:0});
    setInput(""); setShowStickers(false); setTargetUser(null);
  };

  var handlePhotoUpload=e=>{ var file=e.target.files[0]; if(!file) return; var r=new FileReader(); r.onload=ev=>sendMessage("",ev.target.result); r.readAsDataURL(file); };

  var startRecording=()=>{ navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{ audioChunksRef.current=[]; var mr=new MediaRecorder(stream); mediaRecorderRef.current=mr; mr.ondataavailable=e=>{ if(e.data.size>0) audioChunksRef.current.push(e.data); }; mr.start(); setRecording(true); }).catch(()=>alert("Microphone access denied.")); };

  var stopRecording=()=>{
    if(!mediaRecorderRef.current) return;
    var dur=Math.max(recordingTime,1);
    mediaRecorderRef.current.onstop=()=>{ var blob=new Blob(audioChunksRef.current,{type:"audio/webm"}); var r=new FileReader(); r.onload=ev=>{ addDoc(collection(db,"messages"),{sender:activeUser,to:targetUser||null,text:"",time:serverTimestamp(),reactions:{},photo:null,isVoice:true,audioData:ev.target.result,voiceDuration:dur}); setTargetUser(null); }; r.readAsDataURL(blob); mediaRecorderRef.current.stream.getTracks().forEach(t=>t.stop()); };
    mediaRecorderRef.current.stop(); setRecording(false);
  };

  var toggleReaction=(msgId,emoji)=>{ var msg=messages.find(m=>m.id===msgId); if(!msg) return; var reactors=(msg.reactions&&msg.reactions[emoji])||[]; var already=reactors.includes(activeUser); var updated=already?reactors.filter(u=>u!==activeUser):reactors.concat([activeUser]); var nr=Object.assign({},msg.reactions||{}); nr[emoji]=updated; updateDoc(doc(db,"messages",msgId),{reactions:nr}); setShowEmoji(null); };

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
            <div style={{fontSize:11,background:u.bg,color:u.color,borderRadius:20,padding:"2px 10px",fontWeight:700,marginTop:4}}>{DEVICE_PRESETS[u.id].label}</div>
          </button>
        ))}
      </div>
      <div style={{marginTop:32,fontSize:12,color:"#7c3aed",fontWeight:600}}>Tap your profile to open your chat</div>
    </div>
  );

  if(activeGame) return (
    <div style={{minHeight:"100vh",background:"#f8f8f8",fontFamily:"'Nunito',sans-serif",display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{background:"linear-gradient(135deg,"+user.color+","+user.color+"bb)",padding:"14px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 4px 16px rgba(0,0,0,0.18)"}}>
        <button onClick={()=>setActiveGame(null)} style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",fontSize:18,cursor:"pointer"}}>‹</button>
        <div style={{fontSize:18,fontWeight:900,color:"white"}}>🎮 Games</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:16}}>
        <div style={{background:"white",borderRadius:24,boxShadow:"0 4px 20px rgba(0,0,0,0.1)",overflow:"hidden",maxWidth:400,margin:"0 auto"}}>
          {activeGame==="ttt"&&<TicTacToe activeUser={activeUser} onClose={()=>setActiveGame(null)}/>}
          {activeGame==="math"&&<MathQuiz activeUser={activeUser} onClose={()=>setActiveGame(null)}/>}
          {activeGame==="trivia"&&<Trivia activeUser={activeUser} onClose={()=>setActiveGame(null)}/>}
          {activeGame==="draw"&&<Drawing onClose={()=>setActiveGame(null)}/>}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Nunito',sans-serif",minHeight:"100vh",background:user.bg,display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{background:"linear-gradient(135deg,"+user.color+","+user.color+"bb)",padding:"14px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 4px 16px rgba(0,0,0,0.18)",position:"sticky",top:0,zIndex:20}}>
        <button onClick={()=>setScreen("launcher")} style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",fontSize:18,cursor:"pointer"}}>‹</button>
        <div style={{fontSize:32}}>👨‍👩‍👧‍👦</div>
        <div><div style={{fontSize:18,fontWeight:900,color:"white"}}>Family Chat</div><div style={{fontSize:11,color:"rgba(255,255,255,0.8)",fontWeight:700}}>Achraf · Loubna · Soltan · Hasnae</div></div>
        <button onClick={()=>setScreen("games")} style={{marginLeft:"auto",background:"rgba(255,255,255,0.25)",border:"none",borderRadius:20,padding:"6px 14px",color:"white",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>🎮 Games</button>
      </div>

      {screen==="games"?(
        <div style={{flex:1,padding:20,display:"flex",flexDirection:"column",gap:16}}>
          <div style={{fontSize:22,fontWeight:900,color:user.color,textAlign:"center",marginBottom:8}}>🎮 Family Games</div>
          {[{id:"ttt",icon:"🎯",name:"Tic Tac Toe",desc:"2 players, take turns!"},{id:"math",icon:"🔢",name:"Math Quiz",desc:"Test your math skills!"},{id:"trivia",icon:"🧠",name:"Trivia",desc:"8 fun questions!"},{id:"draw",icon:"🎨",name:"Draw & Guess",desc:"Draw a word for the family!"}].map(g=>(
            <button key={g.id} onClick={()=>setActiveGame(g.id)} style={{background:"white",border:"2px solid "+user.color,borderRadius:20,padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,boxShadow:"0 4px 16px "+user.color+"22",fontFamily:"inherit"}}>
              <div style={{fontSize:36}}>{g.icon}</div>
              <div style={{textAlign:"left"}}><div style={{fontWeight:900,fontSize:16,color:user.color}}>{g.name}</div><div style={{fontSize:12,color:"#888",fontWeight:600}}>{g.desc}</div></div>
            </button>
          ))}
          <button onClick={()=>setScreen("chat")} style={{padding:"12px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>← Back to Chat</button>
        </div>
      ):(
        <>
          <div style={{display:"flex",borderBottom:"2px solid #eee",background:"white"}}>
            <button onClick={()=>setFilter("all")} style={{flex:1,padding:"10px 0",border:"none",background:"none",fontFamily:"inherit",fontWeight:800,fontSize:13,cursor:"pointer",color:filter==="all"?user.color:"#aaa",borderBottom:filter==="all"?"3px solid "+user.color:"3px solid transparent"}}>👥 Group</button>
            <button onClick={()=>setFilter("dm")} style={{flex:1,padding:"10px 0",border:"none",background:"none",fontFamily:"inherit",fontWeight:800,fontSize:13,cursor:"pointer",color:filter==="dm"?user.color:"#aaa",borderBottom:filter==="dm"?"3px solid "+user.color:"3px solid transparent"}}>{"💌 My DMs"+(dmCount?" ("+dmCount+")":"")}</button>
          </div>
          {isTablet&&<div style={{background:user.color+"18",borderBottom:"2px dashed "+user.color+"44",padding:"7px 16px",textAlign:"center",fontSize:13,fontWeight:800,color:user.color}}>{user.emoji} Hey {user.name}! {filter==="dm"?"Here are your personal messages 💌":"Say hi to the family 👋"}</div>}
          <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
            {loading&&<div style={{textAlign:"center",padding:40,color:"#aaa",fontWeight:700}}>Loading... 💬</div>}
            {!loading&&shownMessages.length===0&&<div style={{textAlign:"center",padding:40,color:"#aaa",fontWeight:700}}>No messages yet! Say hello 👋</div>}
            {shownMessages.map((msg,i)=>{
              var sender=USERS.find(u=>u.id===msg.sender); if(!sender) return null;
              var recipient=msg.to?USERS.find(u=>u.id===msg.to):null;
              var isMe=msg.sender===activeUser, isDM=!!msg.to;
              var showAvatar=i===0||shownMessages[i-1].sender!==msg.sender;
              return (
                <div key={msg.id} style={{display:"flex",flexDirection:isMe?"row-reverse":"row",alignItems:"flex-end",gap:8}}>
                  <div style={{width:isTablet?42:36,height:isTablet?42:36,borderRadius:"50%",background:sender.bg,border:"2px solid "+sender.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isTablet?24:20,flexShrink:0,opacity:showAvatar?1:0}}>{sender.emoji}</div>
                  <div style={{maxWidth:"70%",display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start",gap:2}}>
                    {showAvatar&&!isMe&&<div style={{fontSize:11,fontWeight:800,color:sender.color,paddingLeft:4}}>{sender.name}</div>}
                    {isDM&&recipient&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:800,color:isMe?sender.color:recipient.color,padding:"2px 10px",background:isMe?sender.color+"18":recipient.color+"18",borderRadius:20,border:"1.5px solid "+(isMe?sender.color:recipient.color)+"44",marginBottom:2,alignSelf:isMe?"flex-end":"flex-start"}}>{isMe?"💌 to "+recipient.emoji+" "+recipient.name:sender.emoji+" "+sender.name+" → 💌 you"}</div>}
                    <div onClick={()=>setShowEmoji(showEmoji===msg.id?null:msg.id)} style={{background:isMe?sender.color+"33":"white",border:"2px solid "+(isDM&&recipient?(isMe?sender.color:recipient.color):sender.color),borderRadius:isMe?"20px 4px 20px 20px":"4px 20px 20px 20px",padding:"10px 14px",cursor:"pointer",boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
                      {msg.photo&&<img src={msg.photo} alt="shared" style={{maxWidth:200,maxHeight:200,borderRadius:12,display:"block",marginBottom:msg.text?8:0}}/>}
                      {msg.isVoice&&msg.audioData&&(
                        <div style={{display:"flex",alignItems:"center",gap:8,minWidth:160}}>
                          <button onClick={e=>{e.stopPropagation();var a=audioRefs.current[msg.id];if(a){if(a.paused)a.play();else{a.pause();a.currentTime=0;}}}} style={{width:32,height:32,borderRadius:"50%",background:sender.color,border:"none",color:"white",cursor:"pointer",fontSize:14,flexShrink:0}}>▶</button>
                          <audio ref={el=>{audioRefs.current[msg.id]=el;}} src={msg.audioData} style={{display:"none"}}/>
                          <div style={{flex:1}}><div style={{height:4,background:sender.color+"33",borderRadius:4}}><div style={{height:"100%",width:"40%",background:sender.color,borderRadius:4}}/></div><div style={{fontSize:10,color:"#888",marginTop:3,fontWeight:700}}>{msg.voiceDuration}s</div></div>
                        </div>
                      )}
                      {msg.text&&<div style={{fontSize:msg.text.length<=2?(isTablet?48:40):(isTablet?18:15),fontWeight:600,color:"#1e1e1e",lineHeight:1.5}}>{msg.text}</div>}
                    </div>
                    <div style={{fontSize:10,color:"#bbb",fontWeight:600,padding:"0 4px"}}>{fmt(msg.time)}</div>
                    {msg.reactions&&Object.keys(msg.reactions).length>0&&(
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",padding:"2px 4px"}}>
                        {Object.entries(msg.reactions).map(([emoji,users])=>users&&users.length>0?(<span key={emoji} onClick={()=>toggleReaction(msg.id,emoji)} style={{background:"white",border:"2px solid #eee",borderRadius:20,padding:"2px 8px",fontSize:13,cursor:"pointer",fontWeight:700}}>{emoji} {users.length}</span>):null)}
                      </div>
                    )}
                    {showEmoji===msg.id&&(
                      <div style={{display:"flex",gap:4,background:"white",borderRadius:30,padding:"6px 10px",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",border:"2px solid #eee",zIndex:10}}>
                        {EMOJI_REACTIONS.map(e=><span key={e} onClick={()=>toggleReaction(msg.id,e)} style={{fontSize:isTablet?26:20,cursor:"pointer",padding:2}}>{e}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef}/>
          </div>
          {showStickers&&(
            <div style={{background:"white",borderTop:"2px solid #eee",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:8,maxHeight:130,overflowY:"auto"}}>
              {STICKERS.map(s=><span key={s} onClick={()=>sendMessage(s)} style={{fontSize:isTablet?34:26,cursor:"pointer",padding:4,borderRadius:10,background:"#f5f5f5"}}>{s}</span>)}
            </div>
          )}
          <div style={{background:"white",borderTop:"1px solid #f0f0f0",padding:"8px 16px",display:"flex",alignItems:"center",gap:8,overflowX:"auto"}}>
            <span style={{fontSize:12,fontWeight:800,color:"#aaa",flexShrink:0}}>Send to:</span>
            <button onClick={()=>setTargetUser(null)} style={{flexShrink:0,padding:"5px 12px",borderRadius:20,border:"2px solid "+(!targetUser?user.color:"#ddd"),background:!targetUser?user.color+"18":"white",fontWeight:800,fontSize:12,color:!targetUser?user.color:"#888",cursor:"pointer",fontFamily:"inherit"}}>👥 Everyone</button>
            {USERS.filter(u=>u.id!==activeUser).map(u=>(
              <button key={u.id} onClick={()=>setTargetUser(targetUser===u.id?null:u.id)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,border:"2px solid "+(targetUser===u.id?u.color:"#ddd"),background:targetUser===u.id?u.color+"18":"white",fontWeight:800,fontSize:12,color:targetUser===u.id?u.color:"#888",cursor:"pointer",fontFamily:"inherit"}}>{u.emoji} {u.name}</button>
            ))}
          </div>
          <div style={{background:"white",borderTop:"2px solid #eee",padding:isTablet?"14px 16px":"10px 14px",display:"flex",alignItems:"center",gap:isTablet?10:8,boxShadow:"0 -4px 20px rgba(0,0,0,0.06)"}}>
            <button onClick={()=>setShowStickers(!showStickers)} style={{width:isTablet?48:40,height:isTablet?48:40,borderRadius:"50%",border:"2px solid "+user.color,background:showStickers?user.color+"22":"white",fontSize:isTablet?24:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>🌟</button>
            <button onClick={()=>fileInputRef.current.click()} style={{width:isTablet?48:40,height:isTablet?48:40,borderRadius:"50%",border:"2px solid "+user.color,background:"white",fontSize:isTablet?24:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>📷</button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhotoUpload}/>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage(input)}
              placeholder={targetUser?"💌 to "+USERS.find(u=>u.id===targetUser)?.name+"...":"Message everyone... 💬"}
              style={{flex:1,border:"2px solid "+(targetUser?USERS.find(u=>u.id===targetUser)?.color:user.color),borderRadius:25,padding:isTablet?"12px 18px":"10px 16px",fontSize:isTablet?17:15,fontFamily:"inherit",fontWeight:600,outline:"none",background:targetUser?USERS.find(u=>u.id===targetUser)?.bg:user.bg,color:"#1e1e1e"}}/>
            <button onClick={()=>recording?stopRecording():startRecording()} style={{width:isTablet?48:40,height:isTablet?48:40,borderRadius:"50%",border:"2px solid "+(recording?"#EF4444":user.color),background:recording?"#FEE2E2":"white",fontSize:isTablet?24:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{recording?"🔴":"🎙️"}</button>
            <button onClick={()=>sendMessage(input)} style={{width:isTablet?52:44,height:isTablet?52:44,borderRadius:"50%",background:"linear-gradient(135deg,"+user.color+","+user.color+"aa)",border:"none",fontSize:isTablet?24:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"white"}}>➤</button>
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
      <style>{"@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}"}</style>
    </div>
  );
}