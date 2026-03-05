import { useState, useRef, useEffect, useCallback } from "react";
import { db } from "./firebase";
import {
  collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, updateDoc, doc, setDoc, getDoc
} from "firebase/firestore";

// ── CONSTANTS ────────────────────────────────────────────────────
const USERS = [
  { id:"achraf", name:"Achraf", role:"Dad",         emoji:"👨", color:"#3B82F6", bg:"#eff6ff" },
  { id:"loubna", name:"Loubna", role:"Mum",         emoji:"👩", color:"#EC4899", bg:"#fdf2f8" },
  { id:"soltan", name:"Soltan", role:"Son 🎮",      emoji:"🧒", color:"#10B981", bg:"#ecfdf5" },
  { id:"hasnae", name:"Hasnae", role:"Daughter 🌸", emoji:"👧", color:"#F59E0B", bg:"#fffbeb" },
];
const DEVICE_PRESETS = {
  achraf:{ device:"phone",  label:"📱 Dad's Phone" },
  loubna:{ device:"phone",  label:"📱 Mum's Phone" },
  soltan:{ device:"tablet", label:"📟 Soltan's Tablet" },
  hasnae:{ device:"tablet", label:"📟 Hasnae's Tablet" },
};

const EMOJI_REACTIONS = ["❤️","😂","😮","👍","🎉","🔥","😢","😍","🤩","👏","💯","🥳"];

const STICKER_PACKS = {
  "✨ Fun": ["🌈","⭐","🦄","🍕","🎮","🐶","🐱","🦁","🎨","🎵","🏆","🌟","🌺","🦋","🍦","🎀","🎪","🎭","🎬","🎤"],
  "❤️ Love": ["❤️","💕","💖","💗","💓","💞","💝","💘","💟","🥰","😘","💏","👨‍👩‍👧‍👦","🏠","🌹","💐","🌷","🍀","✨","💫"],
  "😄 Faces": ["😂","🤣","😅","😊","🥹","😍","🤩","🥳","😎","🤓","🧐","😏","🤔","😴","🥱","😤","🤯","🥸","😵","🤑"],
  "🌍 World": ["🌍","🌏","🌎","⛰️","🏔️","🌋","🏝️","🏜️","🌊","🌅","🌄","🌃","🌆","🌇","🌉","🎑","🏞️","🌌","🌠","🎆"],
  "🍔 Food": ["🍕","🍔","🌮","🍜","🍣","🍦","🎂","🍰","🧁","🍩","🍪","🍫","🍬","🍭","🥤","🧃","🍵","☕","🥛","🍷"],
  "🏅 Sports": ["⚽","🏀","🎾","🏈","⚾","🎱","🏓","🏸","🥊","🎯","🎳","⛳","🏆","🥇","🎖️","🏅","🎗️","🏋️","🤸","⛷️"],
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
const WORDS = ["FAMILY","SMILE","HAPPY","HEART","STARS","GAMES","PIZZA","MUSIC","DANCE","MAGIC","BRAVE","CLOUD","LIGHT","DREAM","SWEET","OCEAN","TIGER","PIANO","BREAD","STONE"];
const CARD_EMOJIS = ["🐶","🐱","🦁","🐸","🦋","🌸","⭐","🎮","🍕","🎨","🏆","🌈","🦄","🎵","🐬","🌺"];

const fmt = d => d&&d.toDate ? d.toDate().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
const fmtDate = d => d&&d.toDate ? d.toDate().toLocaleDateString([],{month:"short",day:"numeric"}) : "";

// ── ANIMATED REACTION BURST ──────────────────────────────────────
function ReactionBurst({ emoji, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,900); return()=>clearTimeout(t); },[onDone]);
  return (
    <div style={{position:"absolute",top:-20,left:"50%",transform:"translateX(-50%)",zIndex:50,pointerEvents:"none",animation:"burstUp 0.9s ease-out forwards",fontSize:28}}>
      {emoji}
      <style>{`@keyframes burstUp{0%{opacity:1;transform:translateX(-50%) scale(1) translateY(0)}100%{opacity:0;transform:translateX(-50%) scale(1.8) translateY(-40px)}}`}</style>
    </div>
  );
}

// ── TYPING INDICATOR ─────────────────────────────────────────────
function TypingDots({ color }) {
  return (
    <div style={{display:"flex",gap:4,alignItems:"center",padding:"8px 14px",background:"white",borderRadius:"4px 20px 20px 20px",border:"2px solid #eee",width:"fit-content"}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{width:8,height:8,borderRadius:"50%",background:color,animation:`dot 1.2s ${i*0.2}s infinite ease-in-out`}}/>
      ))}
      <style>{`@keyframes dot{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ── READ RECEIPTS ────────────────────────────────────────────────
function ReadReceipts({ msgId, sender, activeUser }) {
  const others = USERS.filter(u=>u.id!==sender);
  // In real app, you'd track read per-message in Firestore. Here we simulate with a visual.
  return (
    <div style={{display:"flex",gap:2,marginTop:2}}>
      {others.map(u=>(
        <span key={u.id} style={{fontSize:10,opacity:0.5}} title={u.name+" saw this"}>{u.emoji}</span>
      ))}
    </div>
  );
}

// ── REPLY PREVIEW ────────────────────────────────────────────────
function ReplyPreview({ msg, onCancel }) {
  if(!msg) return null;
  const sender = USERS.find(u=>u.id===msg.sender);
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,background:"#f5f5f5",borderTop:"3px solid "+sender?.color,padding:"8px 14px",borderRadius:"0"}}>
      <div style={{flex:1}}>
        <div style={{fontSize:11,fontWeight:800,color:sender?.color}}>{sender?.emoji} {sender?.name}</div>
        <div style={{fontSize:12,color:"#666",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:220}}>
          {msg.isVoice?"🎙️ Voice message":msg.photo?"📷 Photo":msg.text}
        </div>
      </div>
      <button onClick={onCancel} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#aaa"}}>✕</button>
    </div>
  );
}

// ── POLL COMPONENT ───────────────────────────────────────────────
function PollMessage({ msg, activeUser }) {
  const poll = msg.poll;
  if(!poll) return null;
  const total = Object.values(poll.votes||{}).reduce((a,v)=>a+(v?.length||0),0);
  const myVote = Object.entries(poll.votes||{}).find(([,voters])=>voters?.includes(activeUser))?.[0];

  const vote = async (opt) => {
    if(myVote===opt) return;
    const newVotes = {...poll.votes};
    // remove from previous
    if(myVote) newVotes[myVote]=(newVotes[myVote]||[]).filter(u=>u!==activeUser);
    newVotes[opt]=[...(newVotes[opt]||[]),activeUser];
    await updateDoc(doc(db,"messages",msg.id),{"poll.votes":newVotes});
  };

  return (
    <div style={{minWidth:200}}>
      <div style={{fontWeight:800,fontSize:14,marginBottom:8,color:"#1e1e1e"}}>{poll.question}</div>
      {poll.options.map(opt=>{
        const count=(poll.votes?.[opt]||[]).length;
        const pct=total>0?Math.round(count/total*100):0;
        const voted=myVote===opt;
        return (
          <div key={opt} onClick={()=>vote(opt)} style={{marginBottom:6,cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:700,marginBottom:2}}>
              <span style={{color:voted?"#3B82F6":"#555"}}>{voted?"✓ ":""}{opt}</span>
              <span style={{color:"#aaa"}}>{pct}%</span>
            </div>
            <div style={{height:6,borderRadius:3,background:"#eee",overflow:"hidden"}}>
              <div style={{height:"100%",width:pct+"%",background:voted?"#3B82F6":"#94a3b8",borderRadius:3,transition:"width 0.4s"}}/>
            </div>
          </div>
        );
      })}
      <div style={{fontSize:10,color:"#aaa",marginTop:4,fontWeight:700}}>{total} vote{total!==1?"s":""}</div>
    </div>
  );
}

// ── CREATE POLL MODAL ────────────────────────────────────────────
function CreatePollModal({ onSend, onClose }) {
  const [question,setQuestion]=useState("");
  const [options,setOptions]=useState(["","",""]);

  const submit=()=>{
    const validOpts=options.filter(o=>o.trim());
    if(!question.trim()||validOpts.length<2) return;
    const votes={};
    validOpts.forEach(o=>votes[o]=[]);
    onSend({question:question.trim(),options:validOpts,votes});
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"white",borderRadius:24,padding:24,width:"100%",maxWidth:380,fontFamily:"'Nunito',sans-serif"}}>
        <div style={{fontSize:20,fontWeight:900,marginBottom:16,textAlign:"center"}}>📊 Create a Poll</div>
        <input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask a question..." style={{width:"100%",border:"2px solid #3B82F6",borderRadius:12,padding:"10px 14px",fontSize:14,fontFamily:"inherit",fontWeight:700,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
        {options.map((opt,i)=>(
          <input key={i} value={opt} onChange={e=>{const n=[...options];n[i]=e.target.value;setOptions(n);}} placeholder={`Option ${i+1}`} style={{width:"100%",border:"2px solid #eee",borderRadius:12,padding:"9px 14px",fontSize:13,fontFamily:"inherit",fontWeight:700,outline:"none",boxSizing:"border-box",marginBottom:8}}/>
        ))}
        <button onClick={()=>setOptions([...options,""])} style={{fontSize:12,color:"#3B82F6",background:"none",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>+ Add option</button>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          <button onClick={submit} style={{flex:1,padding:"11px",borderRadius:20,background:"#3B82F6",color:"white",border:"none",fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>Send Poll 📊</button>
        </div>
      </div>
    </div>
  );
}

// ── TASKS / CHORES ────────────────────────────────────────────────
function TasksPanel({ activeUser, onClose }) {
  const [tasks,setTasks]=useState([]);
  const [input,setInput]=useState("");
  const [assignTo,setAssignTo]=useState(activeUser);
  const user=USERS.find(u=>u.id===activeUser);

  useEffect(()=>{
    return onSnapshot(collection(db,"tasks"),snap=>{
      const t=[]; snap.forEach(d=>t.push({id:d.id,...d.data()}));
      setTasks(t.sort((a,b)=>(a.done?1:-1)));
    });
  },[]);

  const addTask=async()=>{
    if(!input.trim()) return;
    await addDoc(collection(db,"tasks"),{text:input.trim(),assignee:assignTo,done:false,createdBy:activeUser,createdAt:serverTimestamp()});
    setInput("");
  };

  const toggleTask=async(task)=>{
    await updateDoc(doc(db,"tasks",task.id),{done:!task.done});
  };

  const myTasks=tasks.filter(t=>t.assignee===activeUser);
  const otherTasks=tasks.filter(t=>t.assignee!==activeUser);

  return (
    <div style={{flex:1,overflowY:"auto",padding:16,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:20,fontWeight:900,marginBottom:4,color:user?.color,textAlign:"center"}}>📋 Family Tasks</div>
      <div style={{fontSize:12,color:"#aaa",fontWeight:700,textAlign:"center",marginBottom:16}}>Assign chores & track completion</div>

      <div style={{background:"white",borderRadius:16,padding:14,marginBottom:16,border:"2px solid #eee"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()} placeholder="Add a task..." style={{width:"100%",border:"2px solid "+user?.color,borderRadius:12,padding:"9px 14px",fontSize:14,fontFamily:"inherit",fontWeight:700,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {USERS.map(u=>(
            <button key={u.id} onClick={()=>setAssignTo(u.id)} style={{padding:"5px 10px",borderRadius:20,border:"2px solid "+(assignTo===u.id?u.color:"#ddd"),background:assignTo===u.id?u.color+"22":"white",fontWeight:800,fontSize:11,cursor:"pointer",fontFamily:"inherit",color:assignTo===u.id?u.color:"#888"}}>{u.emoji} {u.name}</button>
          ))}
        </div>
        <button onClick={addTask} disabled={!input.trim()} style={{width:"100%",padding:"10px",borderRadius:20,background:input.trim()?user?.color:"#ddd",color:"white",border:"none",fontWeight:900,cursor:input.trim()?"pointer":"default",fontFamily:"inherit"}}>Add Task ✓</button>
      </div>

      {myTasks.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{fontWeight:800,color:user?.color,marginBottom:8,fontSize:14}}>📌 My Tasks</div>
          {myTasks.map(task=>{
            const assignee=USERS.find(u=>u.id===task.assignee);
            return (
              <div key={task.id} onClick={()=>toggleTask(task)} style={{display:"flex",alignItems:"center",gap:10,background:"white",border:"2px solid "+(task.done?"#10B981":"#eee"),borderRadius:12,padding:"10px 14px",marginBottom:6,cursor:"pointer",opacity:task.done?0.6:1}}>
                <div style={{width:22,height:22,borderRadius:"50%",border:"2px solid "+(task.done?"#10B981":assignee?.color),background:task.done?"#10B981":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {task.done&&<span style={{color:"white",fontSize:12}}>✓</span>}
                </div>
                <span style={{flex:1,fontSize:13,fontWeight:700,textDecoration:task.done?"line-through":"none",color:task.done?"#aaa":"#1e1e1e"}}>{task.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {otherTasks.length>0&&(
        <div>
          <div style={{fontWeight:800,color:"#888",marginBottom:8,fontSize:14}}>👨‍👩‍👧‍👦 Everyone's Tasks</div>
          {otherTasks.map(task=>{
            const assignee=USERS.find(u=>u.id===task.assignee);
            return (
              <div key={task.id} onClick={()=>toggleTask(task)} style={{display:"flex",alignItems:"center",gap:10,background:"white",border:"2px solid "+(task.done?"#10B981":assignee?.color+"44"),borderRadius:12,padding:"10px 14px",marginBottom:6,cursor:"pointer",opacity:task.done?0.6:1}}>
                <div style={{width:22,height:22,borderRadius:"50%",border:"2px solid "+(task.done?"#10B981":assignee?.color),background:task.done?"#10B981":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {task.done&&<span style={{color:"white",fontSize:12}}>✓</span>}
                </div>
                <span style={{fontSize:12,fontWeight:800,color:assignee?.color}}>{assignee?.emoji}</span>
                <span style={{flex:1,fontSize:13,fontWeight:700,textDecoration:task.done?"line-through":"none",color:task.done?"#aaa":"#1e1e1e"}}>{task.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {tasks.length===0&&<div style={{textAlign:"center",padding:40,color:"#aaa",fontWeight:700}}>No tasks yet! Add one above ✨</div>}
      <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>← Back to Chat</button>
    </div>
  );
}

// ── EVENTS / CALENDAR ────────────────────────────────────────────
function EventsPanel({ activeUser, onClose }) {
  const [events,setEvents]=useState([]);
  const [showForm,setShowForm]=useState(false);
  const [title,setTitle]=useState("");
  const [date,setDate]=useState("");
  const [desc,setDesc]=useState("");
  const user=USERS.find(u=>u.id===activeUser);

  useEffect(()=>{
    return onSnapshot(collection(db,"events"),snap=>{
      const ev=[]; snap.forEach(d=>ev.push({id:d.id,...d.data()}));
      setEvents(ev.sort((a,b)=>a.date?.localeCompare(b.date||"")));
    });
  },[]);

  const addEvent=async()=>{
    if(!title.trim()||!date) return;
    await addDoc(collection(db,"events"),{title:title.trim(),date,desc:desc.trim(),createdBy:activeUser,createdAt:serverTimestamp()});
    setTitle(""); setDate(""); setDesc(""); setShowForm(false);
  };

  const today=new Date().toISOString().split("T")[0];
  const upcoming=events.filter(e=>e.date>=today);
  const past=events.filter(e=>e.date<today);

  const MONTH_COLORS=["#3B82F6","#EC4899","#10B981","#F59E0B","#8B5CF6","#EF4444","#06B6D4","#84CC16","#F97316","#6366F1","#14B8A6","#F59E0B"];

  return (
    <div style={{flex:1,overflowY:"auto",padding:16,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:20,fontWeight:900,marginBottom:4,color:user?.color,textAlign:"center"}}>📅 Family Events</div>
      <div style={{fontSize:12,color:"#aaa",fontWeight:700,textAlign:"center",marginBottom:16}}>Keep track of family moments</div>

      <button onClick={()=>setShowForm(!showForm)} style={{width:"100%",padding:"12px",borderRadius:20,background:user?.color,color:"white",border:"none",fontWeight:900,cursor:"pointer",fontFamily:"inherit",marginBottom:14,fontSize:15}}>
        {showForm?"✕ Cancel":"+ Add Event 📅"}
      </button>

      {showForm&&(
        <div style={{background:"white",borderRadius:16,padding:16,marginBottom:16,border:"2px solid "+user?.color}}>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Event title..." style={{width:"100%",border:"2px solid "+user?.color,borderRadius:12,padding:"9px 14px",fontSize:14,fontFamily:"inherit",fontWeight:700,outline:"none",boxSizing:"border-box",marginBottom:8}}/>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:"100%",border:"2px solid #eee",borderRadius:12,padding:"9px 14px",fontSize:14,fontFamily:"inherit",fontWeight:700,outline:"none",boxSizing:"border-box",marginBottom:8}}/>
          <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Details (optional)..." style={{width:"100%",border:"2px solid #eee",borderRadius:12,padding:"9px 14px",fontSize:14,fontFamily:"inherit",fontWeight:700,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
          <button onClick={addEvent} disabled={!title.trim()||!date} style={{width:"100%",padding:"10px",borderRadius:20,background:title.trim()&&date?user?.color:"#ddd",color:"white",border:"none",fontWeight:900,cursor:title.trim()&&date?"pointer":"default",fontFamily:"inherit"}}>Save Event 🎉</button>
        </div>
      )}

      {upcoming.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{fontWeight:800,color:user?.color,marginBottom:8,fontSize:14}}>📅 Upcoming</div>
          {upcoming.map(ev=>{
            const creator=USERS.find(u=>u.id===ev.createdBy);
            const dObj=new Date(ev.date+"T00:00:00");
            const monthColor=MONTH_COLORS[dObj.getMonth()];
            const daysLeft=Math.ceil((dObj-new Date())/86400000);
            return (
              <div key={ev.id} style={{background:"white",border:"2px solid "+monthColor+"44",borderRadius:16,padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{background:monthColor,borderRadius:10,padding:"4px 10px",color:"white",fontWeight:900,fontSize:12,textAlign:"center"}}>
                    <div>{dObj.toLocaleDateString([],{day:"numeric"})}</div>
                    <div style={{fontSize:9}}>{dObj.toLocaleDateString([],{month:"short"})}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:900,fontSize:14,color:"#1e1e1e"}}>{ev.title}</div>
                    {ev.desc&&<div style={{fontSize:11,color:"#888",fontWeight:600}}>{ev.desc}</div>}
                  </div>
                  <div style={{fontSize:11,color:daysLeft<=3?"#EF4444":daysLeft<=7?"#F59E0B":"#aaa",fontWeight:800}}>
                    {daysLeft===0?"Today!":daysLeft===1?"Tomorrow":daysLeft+"d"}
                  </div>
                </div>
                <div style={{fontSize:10,color:"#bbb",marginTop:4,fontWeight:600}}>Added by {creator?.emoji} {creator?.name}</div>
              </div>
            );
          })}
        </div>
      )}

      {past.length>0&&(
        <div style={{opacity:0.6}}>
          <div style={{fontWeight:800,color:"#aaa",marginBottom:8,fontSize:14}}>⏰ Past Events</div>
          {past.slice(-3).map(ev=>(
            <div key={ev.id} style={{background:"#f5f5f5",borderRadius:12,padding:"10px 14px",marginBottom:6}}>
              <div style={{fontWeight:800,fontSize:13,color:"#888"}}>{ev.title}</div>
              <div style={{fontSize:11,color:"#bbb"}}>{ev.date}</div>
            </div>
          ))}
        </div>
      )}

      {events.length===0&&<div style={{textAlign:"center",padding:40,color:"#aaa",fontWeight:700}}>No events yet! Add family moments 🎉</div>}
      <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:16}}>← Back to Chat</button>
    </div>
  );
}

// ── TIC TAC TOE 5×5 ──────────────────────────────────────────────
function TicTacToe({activeUser,onClose}) {
  const [gs,setGs]=useState(null);
  const [xUser,setXUser]=useState(null);
  const [oUser,setOUser]=useState(null);
  const [setup,setSetup]=useState(true);
  const SIZE=5;

  const checkWinner=(b)=>{
    for(var r=0;r<SIZE;r++) for(var c=0;c<=SIZE-4;c++){var p=b[r*SIZE+c];if(p&&[1,2,3].every(i=>b[r*SIZE+c+i]===p))return p;}
    for(var c2=0;c2<SIZE;c2++) for(var r2=0;r2<=SIZE-4;r2++){var p2=b[r2*SIZE+c2];if(p2&&[1,2,3].every(i=>b[(r2+i)*SIZE+c2]===p2))return p2;}
    for(var r3=0;r3<=SIZE-4;r3++) for(var c3=0;c3<=SIZE-4;c3++){var p3=b[r3*SIZE+c3];if(p3&&[1,2,3].every(i=>b[(r3+i)*SIZE+c3+i]===p3))return p3;}
    for(var r4=3;r4<SIZE;r4++) for(var c4=0;c4<=SIZE-4;c4++){var p4=b[r4*SIZE+c4];if(p4&&[1,2,3].every(i=>b[(r4-i)*SIZE+c4+i]===p4))return p4;}
    if(b.every(Boolean))return "Draw";
    return null;
  };

  useEffect(()=>{
    if(setup) return;
    return onSnapshot(doc(db,"games","ttt5"),snap=>{if(snap.exists())setGs(snap.data());});
  },[setup]);

  const startGame=async()=>{await setDoc(doc(db,"games","ttt5"),{board:Array(25).fill(null),turn:"X",xUser,oUser,winner:null,scores:{[xUser]:0,[oUser]:0}});setSetup(false);};
  const click=async i=>{if(!gs||gs.board[i]||gs.winner)return;if(gs.turn==="X"&&activeUser!==gs.xUser)return;if(gs.turn==="O"&&activeUser!==gs.oUser)return;var nb=[...gs.board];nb[i]=gs.turn;var w=checkWinner(nb);var sc={...gs.scores};if(w&&w!=="Draw")sc[w==="X"?gs.xUser:gs.oUser]=(sc[w==="X"?gs.xUser:gs.oUser]||0)+1;await updateDoc(doc(db,"games","ttt5"),{board:nb,winner:w||null,turn:gs.turn==="X"?"O":"X",scores:sc});};
  const restart=async()=>{await updateDoc(doc(db,"games","ttt5"),{board:Array(25).fill(null),winner:null,turn:"X"});};

  const xu=USERS.find(u=>u.id===(gs?.xUser||xUser)),ou=USERS.find(u=>u.id===(gs?.oUser||oUser));

  if(setup) return (
    <div style={{padding:20,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:8,textAlign:"center"}}>🎯 Tic Tac Toe 5×5</div>
      <div style={{background:"#eff6ff",borderRadius:12,padding:"8px 12px",marginBottom:16,fontSize:12,fontWeight:700,color:"#3B82F6",textAlign:"center"}}>Get 4 in a row to win! 🌐 Real-time</div>
      <div style={{marginBottom:10,fontWeight:800,color:"#555"}}>Who plays X?</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>{USERS.map(u=><button key={u.id} onClick={()=>setXUser(u.id)} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(xUser===u.id?u.color:"#ddd"),background:xUser===u.id?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:xUser===u.id?u.color:"#888"}}>{u.emoji} {u.name}</button>)}</div>
      <div style={{marginBottom:10,fontWeight:800,color:"#555"}}>Who plays O?</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{USERS.filter(u=>u.id!==xUser).map(u=><button key={u.id} onClick={()=>setOUser(u.id)} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(oUser===u.id?u.color:"#ddd"),background:oUser===u.id?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:oUser===u.id?u.color:"#888"}}>{u.emoji} {u.name}</button>)}</div>
      <button disabled={!xUser||!oUser} onClick={startGame} style={{width:"100%",padding:"12px",borderRadius:20,background:xUser&&oUser?"#3B82F6":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:xUser&&oUser?"pointer":"default",fontFamily:"inherit"}}>Start Game 🎯</button>
      <button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button>
    </div>
  );

  if(!gs) return <div style={{padding:40,textAlign:"center",color:"#aaa",fontWeight:700}}>Loading... ⏳</div>;
  var myTurn=(gs.turn==="X"&&activeUser===gs.xUser)||(gs.turn==="O"&&activeUser===gs.oUser);

  return (
    <div style={{padding:16,fontFamily:"'Nunito',sans-serif",textAlign:"center"}}>
      <div style={{fontSize:20,fontWeight:900,marginBottom:6}}>🎯 Tic Tac Toe 5×5</div>
      <div style={{fontSize:12,color:"#888",marginBottom:8,fontWeight:700}}>4 in a row wins!</div>
      {gs.scores&&<div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:10}}>{[gs.xUser,gs.oUser].map(uid=>{var u=USERS.find(x=>x.id===uid);return <div key={uid} style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"4px 12px",fontSize:13,fontWeight:800,color:u?.color}}>{u?.emoji} {gs.scores?.[uid]||0}</div>;})} </div>}
      {!gs.winner&&<div style={{fontSize:13,fontWeight:800,marginBottom:10,padding:"5px 14px",borderRadius:20,display:"inline-block",background:myTurn?(gs.turn==="X"?xu?.color:ou?.color)+"22":"#f5f5f5",color:myTurn?(gs.turn==="X"?xu?.color:ou?.color):"#aaa"}}>{myTurn?"🟢 Your turn!":"⏳ "+(gs.turn==="X"?xu?.name:ou?.name)+"'s turn..."}</div>}
      {gs.winner&&<div style={{fontSize:17,fontWeight:900,marginBottom:10,color:gs.winner==="Draw"?"#888":gs.winner==="X"?xu?.color:ou?.color}}>{gs.winner==="Draw"?"🤝 Draw!":`🏆 ${gs.winner==="X"?xu?.name:ou?.name} wins!`}</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,maxWidth:280,margin:"0 auto 12px"}}>
        {gs.board.map((cell,i)=>(
          <button key={i} onClick={()=>click(i)} style={{height:50,borderRadius:10,border:"1.5px solid #eee",background:cell?"white":"#f8f8f8",fontSize:18,fontWeight:900,cursor:myTurn&&!cell&&!gs.winner?"pointer":"default",color:cell==="X"?xu?.color:ou?.color,transition:"background 0.15s"}}>{cell}</button>
        ))}
      </div>
      <button onClick={restart} style={{padding:"7px 18px",borderRadius:20,background:"#3B82F6",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginRight:8}}>Restart 🔄</button>
      <button onClick={onClose} style={{padding:"7px 18px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Close</button>
    </div>
  );
}

// ── FAMILY QUIZ BATTLE ────────────────────────────────────────────
function QuizBattle({activeUser,onClose}) {
  const [gs,setGs]=useState(null);
  const [setup,setSetup]=useState(true);
  const [players,setPlayers]=useState([activeUser]);
  const [answered,setAnswered]=useState(false);

  useEffect(()=>{
    if(setup) return;
    return onSnapshot(doc(db,"games","quiz"),snap=>{if(snap.exists()){setGs(snap.data());setAnswered(false);}});
  },[setup]);

  const startGame=async()=>{
    var scores={};players.forEach(p=>scores[p]=0);
    await setDoc(doc(db,"games","quiz"),{qi:0,scores,players,answers:{},phase:"question",winner:null});
    setSetup(false);
  };

  const answer=async opt=>{
    if(!gs||answered||gs.phase!=="question")return;
    if(!gs.players.includes(activeUser))return;
    setAnswered(true);
    var q=QUIZ_QUESTIONS[gs.qi],newAnswers={...gs.answers,[activeUser]:opt},newScores={...gs.scores};
    if(opt===q.a)newScores[activeUser]=(newScores[activeUser]||0)+1;
    var allDone=gs.players.every(p=>newAnswers[p]);
    if(allDone){
      var next=gs.qi+1;
      if(next>=QUIZ_QUESTIONS.length){var winner=Object.entries(newScores).sort((a,b)=>b[1]-a[1])[0][0];await updateDoc(doc(db,"games","quiz"),{answers:newAnswers,scores:newScores,phase:"done",winner});}
      else{setTimeout(async()=>await updateDoc(doc(db,"games","quiz"),{qi:next,answers:{},scores:newScores,phase:"question"}),1500);await updateDoc(doc(db,"games","quiz"),{answers:newAnswers,scores:newScores,phase:"reveal"});}
    }else{await updateDoc(doc(db,"games","quiz"),{answers:newAnswers,scores:newScores});}
  };

  if(setup)return(
    <div style={{padding:20,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:8,textAlign:"center"}}>❓ Quiz Battle</div>
      <div style={{background:"#fdf2f8",borderRadius:12,padding:"8px 12px",marginBottom:16,fontSize:12,fontWeight:700,color:"#EC4899",textAlign:"center"}}>🌐 Real-time — everyone answers at the same time!</div>
      <div style={{marginBottom:10,fontWeight:800,color:"#555"}}>Who's playing?</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{USERS.map(u=>{var sel=players.includes(u.id);return<button key={u.id} onClick={()=>setPlayers(sel?players.filter(p=>p!==u.id):[...players,u.id])} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(sel?u.color:"#ddd"),background:sel?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:sel?u.color:"#888"}}>{u.emoji} {u.name}</button>;})}</div>
      <button disabled={players.length<2} onClick={startGame} style={{width:"100%",padding:"12px",borderRadius:20,background:players.length>=2?"#EC4899":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:players.length>=2?"pointer":"default",fontFamily:"inherit"}}>Start Quiz ❓</button>
      <button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button>
    </div>
  );

  if(!gs)return<div style={{padding:40,textAlign:"center",color:"#aaa",fontWeight:700}}>Loading... ⏳</div>;

  if(gs.phase==="done"||gs.winner){
    var wu=USERS.find(u=>u.id===gs.winner);
    return(
      <div style={{padding:24,textAlign:"center",fontFamily:"'Nunito',sans-serif"}}>
        <div style={{fontSize:48,marginBottom:8}}>🏆</div>
        <div style={{fontSize:20,fontWeight:900,marginBottom:4,color:wu?.color}}>{wu?.emoji} {wu?.name} wins!</div>
        <div style={{marginBottom:20,display:"flex",flexDirection:"column",gap:8,marginTop:16}}>{Object.entries(gs.scores).sort((a,b)=>b[1]-a[1]).map(([uid,sc])=>{var u=USERS.find(x=>x.id===uid);return<div key={uid} style={{display:"flex",alignItems:"center",gap:8,background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"8px 14px"}}><span style={{fontSize:20}}>{u?.emoji}</span><span style={{fontWeight:800,color:u?.color}}>{u?.name}</span><span style={{marginLeft:"auto",fontWeight:900,fontSize:18,color:u?.color}}>{sc}</span></div>;})}</div>
        <button onClick={()=>setSetup(true)} style={{padding:"10px 24px",borderRadius:20,background:"#EC4899",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginRight:8}}>Play Again 🔄</button>
        <button onClick={onClose} style={{padding:"10px 24px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Close</button>
      </div>
    );
  }

  var q=QUIZ_QUESTIONS[gs.qi],myAnswer=gs.answers?.[activeUser],waitingFor=gs.players.filter(p=>!gs.answers?.[p]);
  return(
    <div style={{padding:16,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:18,fontWeight:900,marginBottom:4,textAlign:"center"}}>❓ Quiz Battle</div>
      <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>{gs.players.map(uid=>{var u=USERS.find(x=>x.id===uid);return<div key={uid} style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"3px 10px",fontSize:12,fontWeight:800,color:u?.color}}>{u?.emoji} {gs.scores?.[uid]||0}</div>;})}</div>
      <div style={{fontSize:11,color:"#aaa",fontWeight:700,textAlign:"center",marginBottom:10}}>Q {gs.qi+1}/{QUIZ_QUESTIONS.length}</div>
      <div style={{background:"#fdf2f8",border:"2px solid #EC4899",borderRadius:16,padding:16,marginBottom:14,textAlign:"center"}}><div style={{fontSize:16,fontWeight:800,color:"#1e1e1e"}}>{q.q}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {q.opts.map(opt=>{var bg="white",border="2px solid #eee",color="#1e1e1e";if(myAnswer){if(opt===q.a){bg="#ecfdf5";border="2px solid #10B981";color="#10B981";}else if(opt===myAnswer){bg="#fef2f2";border="2px solid #EF4444";color="#EF4444";}}return<button key={opt} onClick={()=>answer(opt)} disabled={!!myAnswer} style={{padding:"11px 8px",borderRadius:14,border,background:bg,fontWeight:800,fontSize:13,cursor:myAnswer?"default":"pointer",fontFamily:"inherit",color}}>{opt}</button>;})}
      </div>
      {myAnswer&&waitingFor.length>0&&<div style={{textAlign:"center",fontSize:12,color:"#aaa",fontWeight:700}}>Waiting for: {waitingFor.map(p=>USERS.find(u=>u.id===p)?.name).join(", ")} ⏳</div>}
    </div>
  );
}

// ── MEMORY CARD GAME ─────────────────────────────────────────────
function MemoryGame({activeUser,onClose}) {
  const [gs,setGs]=useState(null);
  const [setup,setSetup]=useState(true);
  const [players,setPlayers]=useState([activeUser]);

  useEffect(()=>{
    if(setup)return;
    return onSnapshot(doc(db,"games","memory"),snap=>{if(snap.exists())setGs(snap.data());});
  },[setup]);

  const shuffle=arr=>[...arr].sort(()=>Math.random()-0.5);

  const startGame=async()=>{
    var cards=shuffle([...CARD_EMOJIS.slice(0,8),...CARD_EMOJIS.slice(0,8)]).map((e,i)=>({id:i,emoji:e,flipped:false,matched:false}));
    var scores={};players.forEach(p=>scores[p]=0);
    await setDoc(doc(db,"games","memory"),{cards,scores,players,flipped:[],currentTurn:players[0],winner:null});
    setSetup(false);
  };

  const flip=async i=>{
    if(!gs||gs.currentTurn!==activeUser)return;
    if(gs.flipped.length>=2)return;
    if(gs.cards[i].flipped||gs.cards[i].matched)return;
    var nc=[...gs.cards];nc[i]={...nc[i],flipped:true};
    var nf=[...gs.flipped,i];
    if(nf.length===2){
      var[a,b]=nf;
      if(nc[a].emoji===nc[b].emoji){
        nc[a]={...nc[a],matched:true};nc[b]={...nc[b],matched:true};
        var ns={...gs.scores,[activeUser]:(gs.scores[activeUser]||0)+1};
        var allDone=nc.every(c=>c.matched);
        var winner=allDone?Object.entries(ns).sort((a,b)=>b[1]-a[1])[0][0]:null;
        await updateDoc(doc(db,"games","memory"),{cards:nc,scores:ns,flipped:[],winner});
      }else{
        await updateDoc(doc(db,"games","memory"),{cards:nc,flipped:nf});
        var nextIdx=(gs.players.indexOf(activeUser)+1)%gs.players.length;
        setTimeout(async()=>{var rc=[...nc];rc[a]={...rc[a],flipped:false};rc[b]={...rc[b],flipped:false};await updateDoc(doc(db,"games","memory"),{cards:rc,flipped:[],currentTurn:gs.players[nextIdx]});},1000);
        return;
      }
    }
    await updateDoc(doc(db,"games","memory"),{cards:nc,flipped:nf});
  };

  if(setup)return(
    <div style={{padding:20,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:8,textAlign:"center"}}>🃏 Memory Game</div>
      <div style={{background:"#ecfdf5",borderRadius:12,padding:"8px 12px",marginBottom:16,fontSize:12,fontWeight:700,color:"#10B981",textAlign:"center"}}>🌐 Take turns flipping cards!</div>
      <div style={{marginBottom:10,fontWeight:800,color:"#555"}}>Who's playing?</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{USERS.map(u=>{var sel=players.includes(u.id);return<button key={u.id} onClick={()=>setPlayers(sel?players.filter(p=>p!==u.id):[...players,u.id])} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(sel?u.color:"#ddd"),background:sel?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:sel?u.color:"#888"}}>{u.emoji} {u.name}</button>;})}</div>
      <button disabled={players.length<2} onClick={startGame} style={{width:"100%",padding:"12px",borderRadius:20,background:players.length>=2?"#10B981":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:players.length>=2?"pointer":"default",fontFamily:"inherit"}}>Start Game 🃏</button>
      <button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button>
    </div>
  );

  if(!gs)return<div style={{padding:40,textAlign:"center",color:"#aaa",fontWeight:700}}>Loading... ⏳</div>;
  if(gs.winner){var wu=USERS.find(u=>u.id===gs.winner);return(<div style={{padding:24,textAlign:"center",fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:48,marginBottom:8}}>🏆</div><div style={{fontSize:20,fontWeight:900,color:wu?.color,marginBottom:16}}>{wu?.emoji} {wu?.name} wins!</div><div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>{Object.entries(gs.scores).sort((a,b)=>b[1]-a[1]).map(([uid,sc])=>{var u=USERS.find(x=>x.id===uid);return<div key={uid} style={{display:"flex",alignItems:"center",gap:8,background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"8px 14px"}}><span style={{fontSize:20}}>{u?.emoji}</span><span style={{fontWeight:800,color:u?.color}}>{u?.name}</span><span style={{marginLeft:"auto",fontWeight:900,fontSize:18,color:u?.color}}>{sc} pairs</span></div>;})}</div><button onClick={()=>setSetup(true)} style={{padding:"10px 24px",borderRadius:20,background:"#10B981",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginRight:8}}>Play Again 🔄</button><button onClick={onClose} style={{padding:"10px 24px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Close</button></div>);}
  var myTurn=gs.currentTurn===activeUser,ct=USERS.find(u=>u.id===gs.currentTurn);
  return(
    <div style={{padding:12,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:18,fontWeight:900,marginBottom:6,textAlign:"center"}}>🃏 Memory Game</div>
      <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>{gs.players.map(uid=>{var u=USERS.find(x=>x.id===uid);return<div key={uid} style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"3px 10px",fontSize:12,fontWeight:800,color:u?.color}}>{u?.emoji} {gs.scores?.[uid]||0}</div>;})}</div>
      <div style={{textAlign:"center",fontSize:13,fontWeight:800,marginBottom:10,color:myTurn?"#10B981":"#aaa"}}>{myTurn?"🟢 Your turn!":"⏳ "+ct?.name+"'s turn..."}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,maxWidth:280,margin:"0 auto"}}>
        {gs.cards.map((card,i)=>(
          <button key={i} onClick={()=>flip(i)} style={{height:56,borderRadius:12,border:"2px solid "+(card.matched?"#10B98144":"#eee"),background:card.flipped||card.matched?"white":"linear-gradient(135deg,#6366f1,#8b5cf6)",fontSize:card.flipped||card.matched?26:0,cursor:myTurn&&!card.flipped&&!card.matched?"pointer":"default",boxShadow:"0 2px 6px rgba(0,0,0,0.1)",opacity:card.matched?0.4:1,transition:"all 0.2s"}}>
            {(card.flipped||card.matched)?card.emoji:""}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── WORD SCRAMBLE ─────────────────────────────────────────────────
function WordScramble({activeUser,onClose}) {
  const [gs,setGs]=useState(null);
  const [setup,setSetup]=useState(true);
  const [players,setPlayers]=useState([activeUser]);
  const [guess,setGuess]=useState("");
  const [feedback,setFeedback]=useState(null);

  useEffect(()=>{
    if(setup)return;
    return onSnapshot(doc(db,"games","scramble"),snap=>{if(snap.exists())setGs(snap.data());});
  },[setup]);

  const scramble=w=>[...w].sort(()=>Math.random()-0.5).join("");

  const startGame=async()=>{
    var word=WORDS[Math.floor(Math.random()*WORDS.length)];
    var scores={};players.forEach(p=>scores[p]=0);
    await setDoc(doc(db,"games","scramble"),{word,scrambled:scramble(word),scores,players,solved:false,solvedBy:null,round:1});
    setSetup(false);
  };

  const submit=async()=>{
    if(!gs||!guess.trim())return;
    if(guess.toUpperCase()===gs.word){
      var ns={...gs.scores,[activeUser]:(gs.scores[activeUser]||0)+1};
      setFeedback("correct");
      setTimeout(async()=>{var word=WORDS[Math.floor(Math.random()*WORDS.length)];await updateDoc(doc(db,"games","scramble"),{word,scrambled:scramble(word),scores:ns,solved:false,solvedBy:null,round:(gs.round||1)+1});setGuess("");setFeedback(null);},1500);
      await updateDoc(doc(db,"games","scramble"),{solved:true,solvedBy:activeUser,scores:ns});
    }else{setFeedback("wrong");setTimeout(()=>setFeedback(null),800);}
  };

  if(setup)return(
    <div style={{padding:20,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:8,textAlign:"center"}}>🏆 Word Scramble</div>
      <div style={{background:"#fffbeb",borderRadius:12,padding:"8px 12px",marginBottom:16,fontSize:12,fontWeight:700,color:"#F59E0B",textAlign:"center"}}>🌐 First to unscramble wins the round!</div>
      <div style={{marginBottom:10,fontWeight:800,color:"#555"}}>Who's playing?</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{USERS.map(u=>{var sel=players.includes(u.id);return<button key={u.id} onClick={()=>setPlayers(sel?players.filter(p=>p!==u.id):[...players,u.id])} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(sel?u.color:"#ddd"),background:sel?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:sel?u.color:"#888"}}>{u.emoji} {u.name}</button>;})}</div>
      <button disabled={players.length<2} onClick={startGame} style={{width:"100%",padding:"12px",borderRadius:20,background:players.length>=2?"#F59E0B":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:players.length>=2?"pointer":"default",fontFamily:"inherit"}}>Start Game 🏆</button>
      <button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button>
    </div>
  );

  if(!gs)return<div style={{padding:40,textAlign:"center",color:"#aaa",fontWeight:700}}>Loading... ⏳</div>;
  var solver=gs.solvedBy?USERS.find(u=>u.id===gs.solvedBy):null;
  return(
    <div style={{padding:16,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:18,fontWeight:900,marginBottom:6,textAlign:"center"}}>🏆 Word Scramble</div>
      <div style={{fontSize:11,color:"#aaa",fontWeight:700,textAlign:"center",marginBottom:8}}>Round {gs.round||1}</div>
      <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>{gs.players.map(uid=>{var u=USERS.find(x=>x.id===uid);return<div key={uid} style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"3px 10px",fontSize:12,fontWeight:800,color:u?.color}}>{u?.emoji} {gs.scores?.[uid]||0}</div>;})}</div>
      <div style={{background:"#fffbeb",border:"2px solid #F59E0B",borderRadius:16,padding:"16px",textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:12,color:"#888",fontWeight:700,marginBottom:4}}>Unscramble this word:</div>
        <div style={{fontSize:32,fontWeight:900,letterSpacing:8,color:"#F59E0B"}}>{gs.scrambled}</div>
        <div style={{fontSize:11,color:"#bbb",marginTop:4}}>{gs.word.length} letters</div>
      </div>
      {gs.solved&&solver&&<div style={{textAlign:"center",fontSize:15,fontWeight:900,color:solver.color,marginBottom:10}}>🎉 {solver.emoji} {solver.name} got it! Word: <span style={{textDecoration:"underline"}}>{gs.word}</span></div>}
      {!gs.solved&&(<><input value={guess} onChange={e=>setGuess(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Type your answer..." style={{width:"100%",border:"2px solid "+(feedback==="correct"?"#10B981":feedback==="wrong"?"#EF4444":"#F59E0B"),borderRadius:20,padding:"11px 16px",fontSize:16,fontFamily:"inherit",fontWeight:800,outline:"none",boxSizing:"border-box",background:feedback==="correct"?"#ecfdf5":feedback==="wrong"?"#fef2f2":"white",textAlign:"center",marginBottom:10,letterSpacing:4}}/>{feedback==="correct"&&<div style={{textAlign:"center",color:"#10B981",fontWeight:900,fontSize:16,marginBottom:8}}>✅ Correct!</div>}{feedback==="wrong"&&<div style={{textAlign:"center",color:"#EF4444",fontWeight:900,fontSize:16,marginBottom:8}}>❌ Try again!</div>}<button onClick={submit} disabled={!guess.trim()} style={{width:"100%",padding:"11px",borderRadius:20,background:guess.trim()?"#F59E0B":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:guess.trim()?"pointer":"default",fontFamily:"inherit"}}>Submit ➤</button></>)}
      <button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Close</button>
    </div>
  );
}

// ── DICE BATTLE ───────────────────────────────────────────────────
function DiceBattle({activeUser,onClose}) {
  const [gs,setGs]=useState(null);
  const [setup,setSetup]=useState(true);
  const [players,setPlayers]=useState([activeUser]);
  const [rolling,setRolling]=useState(false);
  const DICE=["⚀","⚁","⚂","⚃","⚄","⚅"];

  useEffect(()=>{
    if(setup)return;
    return onSnapshot(doc(db,"games","dice"),snap=>{if(snap.exists())setGs(snap.data());});
  },[setup]);

  const startGame=async()=>{
    var scores={};var rolls={};players.forEach(p=>{scores[p]=0;rolls[p]=null;});
    await setDoc(doc(db,"games","dice"),{scores,rolls,players,round:1,maxRounds:5,phase:"rolling"});
    setSetup(false);
  };

  const roll=async()=>{
    if(!gs||rolling||gs.rolls?.[activeUser]!==null)return;
    setRolling(true);
    const val=Math.floor(Math.random()*6)+1;
    const newRolls={...gs.rolls,[activeUser]:val};
    const allRolled=gs.players.every(p=>newRolls[p]!==null);
    if(allRolled){
      const winner=gs.players.reduce((a,b)=>newRolls[a]>=newRolls[b]?a:b);
      const newScores={...gs.scores};
      if(newRolls[winner]>0&&gs.players.filter(p=>newRolls[p]===newRolls[winner]).length===1)
        newScores[winner]=(newScores[winner]||0)+1;
      const nextRound=gs.round+1;
      if(nextRound>gs.maxRounds){
        const finalWinner=gs.players.reduce((a,b)=>newScores[a]>=newScores[b]?a:b);
        await updateDoc(doc(db,"games","dice"),{rolls:newRolls,scores:newScores,phase:"done",winner:finalWinner});
      }else{
        await updateDoc(doc(db,"games","dice"),{rolls:newRolls,scores:newScores,phase:"reveal"});
        setTimeout(async()=>{
          var emptyRolls={};gs.players.forEach(p=>emptyRolls[p]=null);
          await updateDoc(doc(db,"games","dice"),{rolls:emptyRolls,phase:"rolling",round:nextRound});
        },2000);
      }
    }else{
      await updateDoc(doc(db,"games","dice"),{rolls:newRolls});
    }
    setTimeout(()=>setRolling(false),400);
  };

  if(setup)return(
    <div style={{padding:20,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:8,textAlign:"center"}}>🎲 Dice Battle</div>
      <div style={{background:"#eff6ff",borderRadius:12,padding:"8px 12px",marginBottom:16,fontSize:12,fontWeight:700,color:"#3B82F6",textAlign:"center"}}>🌐 Roll the dice — highest roll wins the round! 5 rounds total.</div>
      <div style={{marginBottom:10,fontWeight:800,color:"#555"}}>Who's playing?</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{USERS.map(u=>{var sel=players.includes(u.id);return<button key={u.id} onClick={()=>setPlayers(sel?players.filter(p=>p!==u.id):[...players,u.id])} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(sel?u.color:"#ddd"),background:sel?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:sel?u.color:"#888"}}>{u.emoji} {u.name}</button>;})}</div>
      <button disabled={players.length<2} onClick={startGame} style={{width:"100%",padding:"12px",borderRadius:20,background:players.length>=2?"#3B82F6":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:players.length>=2?"pointer":"default",fontFamily:"inherit"}}>Start Game 🎲</button>
      <button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button>
    </div>
  );

  if(!gs)return<div style={{padding:40,textAlign:"center",color:"#aaa",fontWeight:700}}>Loading... ⏳</div>;

  if(gs.phase==="done"){
    const wu=USERS.find(u=>u.id===gs.winner);
    return(
      <div style={{padding:24,textAlign:"center",fontFamily:"'Nunito',sans-serif"}}>
        <div style={{fontSize:48,marginBottom:8}}>🎲</div>
        <div style={{fontSize:20,fontWeight:900,color:wu?.color,marginBottom:16}}>{wu?.emoji} {wu?.name} wins!</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>{gs.players.map(uid=>{var u=USERS.find(x=>x.id===uid);return<div key={uid} style={{display:"flex",alignItems:"center",gap:8,background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"8px 14px"}}><span style={{fontSize:20}}>{u?.emoji}</span><span style={{fontWeight:800,color:u?.color}}>{u?.name}</span><span style={{marginLeft:"auto",fontWeight:900,fontSize:18,color:u?.color}}>{gs.scores?.[uid]||0} pts</span></div>;})}</div>
        <button onClick={()=>setSetup(true)} style={{padding:"10px 24px",borderRadius:20,background:"#3B82F6",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginRight:8}}>Play Again 🔄</button>
        <button onClick={onClose} style={{padding:"10px 24px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Close</button>
      </div>
    );
  }

  const myRolled=gs.rolls?.[activeUser]!==null&&gs.rolls?.[activeUser]!==undefined;
  const highRoll=gs.rolls?gs.players.reduce((a,b)=>(gs.rolls[a]||0)>=(gs.rolls[b]||0)?a:b,gs.players[0]):null;

  return(
    <div style={{padding:16,fontFamily:"'Nunito',sans-serif",textAlign:"center"}}>
      <div style={{fontSize:18,fontWeight:900,marginBottom:4}}>🎲 Dice Battle</div>
      <div style={{fontSize:12,color:"#aaa",fontWeight:700,marginBottom:8}}>Round {gs.round}/{gs.maxRounds}</div>
      <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>{gs.players.map(uid=>{var u=USERS.find(x=>x.id===uid);return<div key={uid} style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"4px 12px",fontSize:13,fontWeight:800,color:u?.color}}>{u?.emoji} {gs.scores?.[uid]||0}</div>;})}</div>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:16}}>
        {gs.players.map(uid=>{
          var u=USERS.find(x=>x.id===uid);
          var val=gs.rolls?.[uid];
          var isHigh=gs.phase==="reveal"&&uid===highRoll;
          return(
            <div key={uid} style={{background:isHigh?u?.color:u?.bg,border:"3px solid "+u?.color,borderRadius:16,padding:"16px 20px",minWidth:80,transition:"all 0.3s"}}>
              <div style={{fontSize:12,fontWeight:800,color:isHigh?"white":u?.color,marginBottom:4}}>{u?.emoji} {u?.name}</div>
              <div style={{fontSize:44,lineHeight:1}}>{val!==null&&val!==undefined?DICE[val-1]:"🎲"}</div>
              {val!==null&&val!==undefined&&<div style={{fontSize:13,fontWeight:900,color:isHigh?"white":u?.color,marginTop:4}}>{val}</div>}
            </div>
          );
        })}
      </div>
      {gs.phase==="rolling"&&!myRolled&&(
        <button onClick={roll} disabled={rolling} style={{padding:"14px 32px",borderRadius:24,background:"#3B82F6",color:"white",border:"none",fontWeight:900,fontSize:16,cursor:"pointer",fontFamily:"inherit",animation:"pulse 1s infinite"}}>
          🎲 Roll!
        </button>
      )}
      {gs.phase==="rolling"&&myRolled&&<div style={{color:"#10B981",fontWeight:800,fontSize:14}}>✅ Rolled! Waiting for others... ⏳</div>}
      {gs.phase==="reveal"&&<div style={{fontWeight:900,fontSize:15,color:USERS.find(u=>u.id===highRoll)?.color}}>{highRoll===activeUser?"🎉 You win this round!":"🏆 "+USERS.find(u=>u.id===highRoll)?.name+" wins this round!"}</div>}
      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}`}</style>
    </div>
  );
}

// ── DRAW & GUESS (Pictionary) ──────────────────────────────────────
function DrawGuess({activeUser,onClose}) {
  const [gs,setGs]=useState(null);
  const [setup,setSetup]=useState(true);
  const [players,setPlayers]=useState([activeUser]);
  const [guess,setGuess]=useState("");
  const [isDrawing,setIsDrawing]=useState(false);
  const canvasRef=useRef(null);
  const lastPos=useRef(null);

  const DRAW_WORDS=["Cat","House","Car","Tree","Sun","Fish","Bird","Pizza","Guitar","Ball","Crown","Moon","Star","Cloud","Flower","Cake","Boat","Train","Phone","Heart"];

  useEffect(()=>{
    if(setup)return;
    return onSnapshot(doc(db,"games","draw"),snap=>{if(snap.exists()){const d=snap.data();setGs(d);if(d.canvasData&&canvasRef.current){const img=new Image();img.onload=()=>{const ctx=canvasRef.current?.getContext("2d");if(ctx){ctx.clearRect(0,0,300,220);ctx.drawImage(img,0,0);}};img.src=d.canvasData;}}});
  },[setup]);

  const startGame=async()=>{
    var scores={};players.forEach(p=>scores[p]=0);
    var word=DRAW_WORDS[Math.floor(Math.random()*DRAW_WORDS.length)];
    var drawerIdx=0;
    await setDoc(doc(db,"games","draw"),{scores,players,word,drawerIdx,drawer:players[drawerIdx],guessed:false,guessedBy:null,canvasData:null,round:1});
    setSetup(false);
  };

  const getPos=(e,canvas)=>{
    const rect=canvas.getBoundingClientRect();
    const scaleX=canvas.width/rect.width;
    const scaleY=canvas.height/rect.height;
    const clientX=e.touches?e.touches[0].clientX:e.clientX;
    const clientY=e.touches?e.touches[0].clientY:e.clientY;
    return{x:(clientX-rect.left)*scaleX,y:(clientY-rect.top)*scaleY};
  };

  const startDraw=e=>{
    if(gs?.drawer!==activeUser)return;
    setIsDrawing(true);
    lastPos.current=getPos(e,canvasRef.current);
  };

  const draw=e=>{
    if(!isDrawing||gs?.drawer!==activeUser)return;
    e.preventDefault();
    const canvas=canvasRef.current;
    if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const pos=getPos(e,canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x,lastPos.current.y);
    ctx.lineTo(pos.x,pos.y);
    ctx.strokeStyle="#1e1e1e";
    ctx.lineWidth=3;
    ctx.lineCap="round";
    ctx.stroke();
    lastPos.current=pos;
  };

  const endDraw=async()=>{
    if(!isDrawing||!canvasRef.current)return;
    setIsDrawing(false);
    lastPos.current=null;
    if(gs?.drawer===activeUser){
      const data=canvasRef.current.toDataURL("image/png",0.4);
      await updateDoc(doc(db,"games","draw"),{canvasData:data});
    }
  };

  const clearCanvas=async()=>{
    if(!canvasRef.current)return;
    const ctx=canvasRef.current.getContext("2d");
    ctx.clearRect(0,0,300,220);
    await updateDoc(doc(db,"games","draw"),{canvasData:null});
  };

  const submitGuess=async()=>{
    if(!gs||!guess.trim()||gs.guessed)return;
    if(guess.toLowerCase().trim()===gs.word.toLowerCase()){
      const newScores={...gs.scores,[activeUser]:(gs.scores[activeUser]||0)+2,[gs.drawer]:(gs.scores[gs.drawer]||0)+1};
      await updateDoc(doc(db,"games","draw"),{guessed:true,guessedBy:activeUser,scores:newScores});
    }
    setGuess("");
  };

  const nextRound=async()=>{
    if(!gs)return;
    const nextDrawerIdx=(gs.drawerIdx+1)%gs.players.length;
    const word=DRAW_WORDS[Math.floor(Math.random()*DRAW_WORDS.length)];
    if(canvasRef.current){const ctx=canvasRef.current.getContext("2d");ctx.clearRect(0,0,300,220);}
    await updateDoc(doc(db,"games","draw"),{word,drawerIdx:nextDrawerIdx,drawer:gs.players[nextDrawerIdx],guessed:false,guessedBy:null,canvasData:null,round:(gs.round||1)+1});
  };

  if(setup)return(
    <div style={{padding:20,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:8,textAlign:"center"}}>🎨 Draw & Guess</div>
      <div style={{background:"#fdf2f8",borderRadius:12,padding:"8px 12px",marginBottom:16,fontSize:12,fontWeight:700,color:"#EC4899",textAlign:"center"}}>🌐 One draws, others guess! +2 for guesser, +1 for drawer</div>
      <div style={{marginBottom:10,fontWeight:800,color:"#555"}}>Who's playing?</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{USERS.map(u=>{var sel=players.includes(u.id);return<button key={u.id} onClick={()=>setPlayers(sel?players.filter(p=>p!==u.id):[...players,u.id])} style={{padding:"7px 12px",borderRadius:20,border:"2px solid "+(sel?u.color:"#ddd"),background:sel?u.color+"22":"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",color:sel?u.color:"#888"}}>{u.emoji} {u.name}</button>;})}</div>
      <button disabled={players.length<2} onClick={startGame} style={{width:"100%",padding:"12px",borderRadius:20,background:players.length>=2?"#EC4899":"#ddd",color:"white",border:"none",fontWeight:900,fontSize:15,cursor:players.length>=2?"pointer":"default",fontFamily:"inherit"}}>Start Game 🎨</button>
      <button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Cancel</button>
    </div>
  );

  if(!gs)return<div style={{padding:40,textAlign:"center",color:"#aaa",fontWeight:700}}>Loading... ⏳</div>;
  const isDrawer=gs.drawer===activeUser;
  const drawerUser=USERS.find(u=>u.id===gs.drawer);
  const guesserUser=gs.guessedBy?USERS.find(u=>u.id===gs.guessedBy):null;

  return(
    <div style={{padding:12,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:18,fontWeight:900,marginBottom:4,textAlign:"center"}}>🎨 Draw & Guess</div>
      <div style={{fontSize:11,color:"#aaa",fontWeight:700,textAlign:"center",marginBottom:6}}>Round {gs.round||1}</div>
      <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>{gs.players.map(uid=>{var u=USERS.find(x=>x.id===uid);return<div key={uid} style={{background:u?.bg,border:"2px solid "+u?.color,borderRadius:12,padding:"3px 10px",fontSize:11,fontWeight:800,color:u?.color}}>{u?.emoji} {gs.scores?.[uid]||0}</div>;})}</div>
      <div style={{textAlign:"center",fontSize:13,fontWeight:800,marginBottom:6,color:drawerUser?.color}}>{drawerUser?.emoji} {drawerUser?.name} is drawing{isDrawer&&<span style={{color:"#1e1e1e"}}> — your word: <span style={{background:"#fef9c3",padding:"2px 8px",borderRadius:8}}>{gs.word}</span></span>}</div>
      <canvas ref={canvasRef} width={300} height={220}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        style={{width:"100%",maxWidth:300,height:220,border:"2px solid #eee",borderRadius:16,background:"white",cursor:isDrawer?"crosshair":"default",display:"block",margin:"0 auto 8px",touchAction:"none"}}/>
      {isDrawer&&<button onClick={clearCanvas} style={{display:"block",margin:"0 auto 10px",padding:"5px 16px",borderRadius:20,border:"2px solid #eee",background:"white",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:12,color:"#888"}}>🗑️ Clear</button>}
      {!isDrawer&&!gs.guessed&&(
        <div style={{display:"flex",gap:8}}>
          <input value={guess} onChange={e=>setGuess(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitGuess()} placeholder="Your guess..." style={{flex:1,border:"2px solid #EC4899",borderRadius:20,padding:"9px 14px",fontSize:14,fontFamily:"inherit",fontWeight:700,outline:"none"}}/>
          <button onClick={submitGuess} style={{padding:"9px 16px",borderRadius:20,background:"#EC4899",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Guess!</button>
        </div>
      )}
      {gs.guessed&&(
        <div style={{textAlign:"center",marginTop:8}}>
          <div style={{fontSize:16,fontWeight:900,color:"#10B981",marginBottom:8}}>🎉 {guesserUser?.emoji} {guesserUser?.name} guessed it! Word: <span style={{color:"#EC4899"}}>{gs.word}</span></div>
          <button onClick={nextRound} style={{padding:"10px 24px",borderRadius:20,background:"#EC4899",color:"white",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Next Round →</button>
        </div>
      )}
    </div>
  );
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
  const [typingUsers,setTypingUsers]=useState([]);
  const [reactionBursts,setReactionBursts]=useState({});
  const [activePanel,setActivePanel]=useState(null); // "tasks" | "events"

  const messagesEndRef=useRef(null);
  const fileInputRef=useRef(null);
  const recordTimerRef=useRef(null);
  const mediaRecorderRef=useRef(null);
  const audioChunksRef=useRef([]);
  const audioRefs=useRef({});
  const typingTimeoutRef=useRef(null);

  useEffect(()=>{
    var q=query(collection(db,"messages"),orderBy("time","asc"));
    return onSnapshot(q,snap=>{ var msgs=[]; snap.forEach(d=>msgs.push(Object.assign({id:d.id},d.data()))); setMessages(msgs); setLoading(false); });
  },[]);

  useEffect(()=>{ messagesEndRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,screen]);

  useEffect(()=>{
    if(recording){ recordTimerRef.current=setInterval(()=>setRecordingTime(t=>t+1),1000); }
    else{ clearInterval(recordTimerRef.current); setRecordingTime(0); }
    return()=>clearInterval(recordTimerRef.current);
  },[recording]);

  // Typing indicator via Firestore
  useEffect(()=>{
    if(!activeUser) return;
    return onSnapshot(doc(db,"typing","status"),snap=>{
      if(snap.exists()){
        const data=snap.data();
        const now=Date.now();
        const typing=Object.entries(data).filter(([uid,ts])=>uid!==activeUser&&ts&&(now-ts)<4000).map(([uid])=>uid);
        setTypingUsers(typing);
      }
    });
  },[activeUser]);

  const updateTyping=async()=>{
    if(!activeUser) return;
    await setDoc(doc(db,"typing","status"),{[activeUser]:Date.now()},{merge:true});
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current=setTimeout(async()=>{
      await setDoc(doc(db,"typing","status"),{[activeUser]:null},{merge:true});
    },3000);
  };

  var user=USERS.find(u=>u.id===activeUser);
  var isTablet=activeUser&&DEVICE_PRESETS[activeUser].device==="tablet";
  var allVisible=messages.filter(m=>{ if(!m.to) return true; return m.sender===activeUser||m.to===activeUser; });
  var dmVisible=messages.filter(m=>m.to!=null&&(m.to===activeUser||m.sender===activeUser));
  var shownMessages=filter==="all"?allVisible:dmVisible;
  var dmCount=messages.filter(m=>m.to===activeUser&&!m._read).length;

  const sendMessage=(text,photo,poll)=>{
    var t=text!==undefined?text:input,p=photo||null;
    if(!t.trim()&&!p&&!poll) return;
    addDoc(collection(db,"messages"),{
      sender:activeUser,to:targetUser||null,text:t.trim(),time:serverTimestamp(),
      reactions:{},photo:p,isVoice:false,audioData:null,voiceDuration:0,
      poll:poll||null,
      replyTo:replyTo?{id:replyTo.id,sender:replyTo.sender,text:replyTo.text,isVoice:replyTo.isVoice,photo:!!replyTo.photo}:null,
    });
    setInput(""); setShowStickers(false); setTargetUser(null); setReplyTo(null);
    setDoc(doc(db,"typing","status"),{[activeUser]:null},{merge:true});
  };

  const handlePhotoUpload=e=>{ var file=e.target.files[0]; if(!file) return; var r=new FileReader(); r.onload=ev=>sendMessage("",ev.target.result); r.readAsDataURL(file); };
  const startRecording=()=>{ navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{ audioChunksRef.current=[]; var mr=new MediaRecorder(stream); mediaRecorderRef.current=mr; mr.ondataavailable=e=>{if(e.data.size>0)audioChunksRef.current.push(e.data);}; mr.start(); setRecording(true); }).catch(()=>alert("Microphone access denied.")); };
  const stopRecording=()=>{ if(!mediaRecorderRef.current) return; var dur=Math.max(recordingTime,1); mediaRecorderRef.current.onstop=()=>{ var blob=new Blob(audioChunksRef.current,{type:"audio/webm"}); var r=new FileReader(); r.onload=ev=>{ addDoc(collection(db,"messages"),{sender:activeUser,to:targetUser||null,text:"",time:serverTimestamp(),reactions:{},photo:null,isVoice:true,audioData:ev.target.result,voiceDuration:dur,replyTo:null,poll:null}); setTargetUser(null); }; r.readAsDataURL(blob); mediaRecorderRef.current.stream.getTracks().forEach(t=>t.stop()); }; mediaRecorderRef.current.stop(); setRecording(false); };

  const toggleReaction=(msgId,emoji)=>{
    var msg=messages.find(m=>m.id===msgId); if(!msg) return;
    var reactors=(msg.reactions&&msg.reactions[emoji])||[];
    var already=reactors.includes(activeUser);
    var updated=already?reactors.filter(u=>u!==activeUser):reactors.concat([activeUser]);
    var nr=Object.assign({},msg.reactions||{}); nr[emoji]=updated;
    updateDoc(doc(db,"messages",msgId),{reactions:nr});
    if(!already){
      setReactionBursts(prev=>({...prev,[msgId+emoji]:true}));
      setTimeout(()=>setReactionBursts(prev=>{const n={...prev};delete n[msgId+emoji];return n;}),900);
    }
    setShowEmoji(null);
  };

  const GAMES=[
    {id:"ttt",   icon:"🎯",name:"Tic Tac Toe 5×5",  desc:"4 in a row wins! Real-time 🌐",        color:"#3B82F6"},
    {id:"quiz",  icon:"❓",name:"Quiz Battle",        desc:"Answer together! Real-time 🌐",        color:"#EC4899"},
    {id:"memory",icon:"🃏",name:"Memory Cards",       desc:"Flip & match! Real-time 🌐",           color:"#10B981"},
    {id:"word",  icon:"🏆",name:"Word Scramble",      desc:"First to solve wins! Real-time 🌐",   color:"#F59E0B"},
    {id:"dice",  icon:"🎲",name:"Dice Battle",        desc:"Highest roll wins! Real-time 🌐",     color:"#8B5CF6"},
    {id:"draw",  icon:"🎨",name:"Draw & Guess",       desc:"Draw it, guess it! Real-time 🌐",     color:"#EF4444"},
  ];

  // Launcher
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

  // Active game
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
        </div>
      </div>
    </div>
  );

  // Tasks panel
  if(activePanel==="tasks") return (
    <div style={{minHeight:"100vh",background:user?.bg,fontFamily:"'Nunito',sans-serif",display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{background:"linear-gradient(135deg,"+user?.color+","+user?.color+"bb)",padding:"14px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 4px 16px rgba(0,0,0,0.18)"}}>
        <button onClick={()=>setActivePanel(null)} style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",fontSize:18,cursor:"pointer"}}>‹</button>
        <div style={{fontSize:18,fontWeight:900,color:"white"}}>📋 Family Tasks</div>
      </div>
      <TasksPanel activeUser={activeUser} onClose={()=>setActivePanel(null)}/>
    </div>
  );

  // Events panel
  if(activePanel==="events") return (
    <div style={{minHeight:"100vh",background:user?.bg,fontFamily:"'Nunito',sans-serif",display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{background:"linear-gradient(135deg,"+user?.color+","+user?.color+"bb)",padding:"14px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 4px 16px rgba(0,0,0,0.18)"}}>
        <button onClick={()=>setActivePanel(null)} style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",fontSize:18,cursor:"pointer"}}>‹</button>
        <div style={{fontSize:18,fontWeight:900,color:"white"}}>📅 Family Events</div>
      </div>
      <EventsPanel activeUser={activeUser} onClose={()=>setActivePanel(null)}/>
    </div>
  );

  // Main chat
  return (
    <div style={{fontFamily:"'Nunito',sans-serif",minHeight:"100vh",background:user.bg,display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,"+user.color+","+user.color+"bb)",padding:"14px 16px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 4px 16px rgba(0,0,0,0.18)",position:"sticky",top:0,zIndex:20}}>
        <button onClick={()=>setScreen("launcher")} style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",fontSize:18,cursor:"pointer",flexShrink:0}}>‹</button>
        <div style={{fontSize:28}}>👨‍👩‍👧‍👦</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:17,fontWeight:900,color:"white"}}>Family Chat</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.8)",fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Achraf · Loubna · Soltan · Hasnae</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setActivePanel("tasks")} style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:16,padding:"5px 10px",color:"white",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>📋</button>
          <button onClick={()=>setActivePanel("events")} style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:16,padding:"5px 10px",color:"white",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>📅</button>
          <button onClick={()=>setScreen("games")} style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:16,padding:"5px 10px",color:"white",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>🎮</button>
        </div>
      </div>

      {/* Games Screen */}
      {screen==="games"?(
        <div style={{flex:1,padding:20,display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontSize:22,fontWeight:900,color:user.color,textAlign:"center",marginBottom:4}}>🎮 Family Games</div>
          <div style={{textAlign:"center",fontSize:12,color:"#aaa",fontWeight:700,marginBottom:8}}>All games are real-time multiplayer 🌐</div>
          {GAMES.map(g=>(
            <button key={g.id} onClick={()=>setActiveGame(g.id)} style={{background:"white",border:"2px solid "+g.color,borderRadius:20,padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,boxShadow:"0 4px 16px "+g.color+"22",fontFamily:"inherit"}}>
              <div style={{fontSize:36}}>{g.icon}</div>
              <div style={{textAlign:"left"}}><div style={{fontWeight:900,fontSize:16,color:g.color}}>{g.name}</div><div style={{fontSize:12,color:"#888",fontWeight:600}}>{g.desc}</div></div>
            </button>
          ))}
          <button onClick={()=>setScreen("chat")} style={{padding:"12px",borderRadius:20,background:"none",border:"2px solid #ddd",color:"#888",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>← Back to Chat</button>
        </div>
      ):(
        <>
          {/* Tab bar */}
          <div style={{display:"flex",borderBottom:"2px solid #eee",background:"white"}}>
            <button onClick={()=>setFilter("all")} style={{flex:1,padding:"10px 0",border:"none",background:"none",fontFamily:"inherit",fontWeight:800,fontSize:13,cursor:"pointer",color:filter==="all"?user.color:"#aaa",borderBottom:filter==="all"?"3px solid "+user.color:"3px solid transparent"}}>👥 Group</button>
            <button onClick={()=>setFilter("dm")} style={{flex:1,padding:"10px 0",border:"none",background:"none",fontFamily:"inherit",fontWeight:800,fontSize:13,cursor:"pointer",color:filter==="dm"?user.color:"#aaa",borderBottom:filter==="dm"?"3px solid "+user.color:"3px solid transparent"}}>{"💌 DMs"+(dmCount?" ("+dmCount+")":"")}</button>
          </div>

          {isTablet&&<div style={{background:user.color+"18",borderBottom:"2px dashed "+user.color+"44",padding:"7px 16px",textAlign:"center",fontSize:13,fontWeight:800,color:user.color}}>{user.emoji} Hey {user.name}! {filter==="dm"?"Here are your personal messages 💌":"Say hi to the family 👋"}</div>}

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
            {loading&&<div style={{textAlign:"center",padding:40,color:"#aaa",fontWeight:700}}>Loading... 💬</div>}
            {!loading&&shownMessages.length===0&&<div style={{textAlign:"center",padding:40,color:"#aaa",fontWeight:700}}>No messages yet! Say hello 👋</div>}
            {shownMessages.map((msg,i)=>{
              var sender=USERS.find(u=>u.id===msg.sender); if(!sender) return null;
              var recipient=msg.to?USERS.find(u=>u.id===msg.to):null;
              var isMe=msg.sender===activeUser,isDM=!!msg.to;
              var showAvatar=i===0||shownMessages[i-1].sender!==msg.sender;
              var replyMsg=msg.replyTo?messages.find(m=>m.id===msg.replyTo.id):null;
              var replyUser=msg.replyTo?USERS.find(u=>u.id===msg.replyTo.sender):null;

              return (
                <div key={msg.id} style={{display:"flex",flexDirection:isMe?"row-reverse":"row",alignItems:"flex-end",gap:8}}>
                  <div style={{width:isTablet?42:36,height:isTablet?42:36,borderRadius:"50%",background:sender.bg,border:"2px solid "+sender.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isTablet?24:20,flexShrink:0,opacity:showAvatar?1:0}}>{sender.emoji}</div>
                  <div style={{maxWidth:"72%",display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start",gap:2}}>
                    {showAvatar&&!isMe&&<div style={{fontSize:11,fontWeight:800,color:sender.color,paddingLeft:4}}>{sender.name}</div>}
                    {isDM&&recipient&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:800,color:isMe?sender.color:recipient.color,padding:"2px 10px",background:isMe?sender.color+"18":recipient.color+"18",borderRadius:20,border:"1.5px solid "+(isMe?sender.color:recipient.color)+"44",marginBottom:2,alignSelf:isMe?"flex-end":"flex-start"}}>{isMe?"💌 to "+recipient.emoji+" "+recipient.name:sender.emoji+" "+sender.name+" → 💌 you"}</div>}
                    {/* Reply quote */}
                    {msg.replyTo&&<div style={{background:"#f5f5f5",borderLeft:"3px solid "+(replyUser?.color||"#aaa"),borderRadius:"10px 10px 0 0",padding:"5px 10px",fontSize:11,fontWeight:700,color:"#888",maxWidth:"100%"}}>
                      <span style={{color:replyUser?.color}}>{replyUser?.emoji} {replyUser?.name}: </span>
                      {msg.replyTo.isVoice?"🎙️ Voice":msg.replyTo.photo?"📷 Photo":msg.replyTo.text?.slice(0,50)}
                    </div>}
                    {/* Bubble */}
                    <div style={{position:"relative"}}>
                      {reactionBursts[msg.id+(Object.keys(msg.reactions||{}).slice(-1)[0])]&&(
                        <ReactionBurst emoji={Object.keys(msg.reactions||{}).slice(-1)[0]} onDone={()=>{}}/>
                      )}
                      <div onClick={()=>setShowEmoji(showEmoji===msg.id?null:msg.id)}
                        onDoubleClick={()=>setReplyTo(msg)}
                        style={{background:isMe?sender.color+"33":"white",border:"2px solid "+(isDM&&recipient?(isMe?sender.color:recipient.color):sender.color),borderRadius:isMe?"20px 4px 20px 20px":"4px 20px 20px 20px",padding:msg.poll?"12px 14px":"10px 14px",cursor:"pointer",boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
                        {msg.poll&&<PollMessage msg={msg} activeUser={activeUser}/>}
                        {!msg.poll&&<>
                          {msg.photo&&<img src={msg.photo} alt="shared" style={{maxWidth:200,maxHeight:200,borderRadius:12,display:"block",marginBottom:msg.text?8:0}}/>}
                          {msg.isVoice&&msg.audioData&&(<div style={{display:"flex",alignItems:"center",gap:8,minWidth:160}}>
                            <button onClick={e=>{e.stopPropagation();var a=audioRefs.current[msg.id];if(a){if(a.paused)a.play();else{a.pause();a.currentTime=0;}}}} style={{width:32,height:32,borderRadius:"50%",background:sender.color,border:"none",color:"white",cursor:"pointer",fontSize:14,flexShrink:0}}>▶</button>
                            <audio ref={el=>{audioRefs.current[msg.id]=el;}} src={msg.audioData} style={{display:"none"}}/>
                            <div style={{flex:1}}><div style={{height:4,background:sender.color+"33",borderRadius:4}}><div style={{height:"100%",width:"40%",background:sender.color,borderRadius:4}}/></div><div style={{fontSize:10,color:"#888",marginTop:3,fontWeight:700}}>{msg.voiceDuration}s</div></div>
                          </div>)}
                          {msg.text&&<div style={{fontSize:msg.text.length<=2?(isTablet?48:40):(isTablet?17:15),fontWeight:600,color:"#1e1e1e",lineHeight:1.5}}>{msg.text}</div>}
                        </>}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{fontSize:10,color:"#bbb",fontWeight:600,padding:"0 4px"}}>{fmt(msg.time)}</div>
                      {isMe&&<ReadReceipts msgId={msg.id} sender={msg.sender} activeUser={activeUser}/>}
                      <button onClick={()=>setReplyTo(msg)} style={{fontSize:10,color:"#bbb",background:"none",border:"none",cursor:"pointer",fontWeight:700,padding:0}}>↩️</button>
                    </div>
                    {msg.reactions&&Object.keys(msg.reactions).length>0&&(
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",padding:"2px 4px"}}>
                        {Object.entries(msg.reactions).map(([emoji,users])=>users&&users.length>0?(
                          <span key={emoji} onClick={()=>toggleReaction(msg.id,emoji)} style={{background:users.includes(activeUser)?user.color+"22":"white",border:"2px solid "+(users.includes(activeUser)?user.color:"#eee"),borderRadius:20,padding:"2px 8px",fontSize:13,cursor:"pointer",fontWeight:700}}>
                            {emoji} {users.length}
                          </span>
                        ):null)}
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

            {/* Typing indicators */}
            {typingUsers.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {typingUsers.map(uid=>{
                  const u=USERS.find(x=>x.id===uid);
                  return(
                    <div key={uid} style={{display:"flex",alignItems:"flex-end",gap:8}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:u?.bg,border:"2px solid "+u?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{u?.emoji}</div>
                      <TypingDots color={u?.color||"#aaa"}/>
                    </div>
                  );
                })}
              </div>
            )}

            <div ref={messagesEndRef}/>
          </div>

          {/* Reply preview */}
          {replyTo&&<ReplyPreview msg={replyTo} onCancel={()=>setReplyTo(null)}/>}

          {/* Stickers */}
          {showStickers&&(
            <div style={{background:"white",borderTop:"2px solid #eee",padding:"0"}}>
              <div style={{display:"flex",overflowX:"auto",padding:"8px 12px",gap:8,borderBottom:"1px solid #f0f0f0"}}>
                {Object.keys(STICKER_PACKS).map(pack=>(
                  <button key={pack} onClick={()=>setActiveStickerPack(pack)} style={{flexShrink:0,padding:"4px 10px",borderRadius:20,border:"2px solid "+(activeStickerPack===pack?user.color:"#eee"),background:activeStickerPack===pack?user.color+"18":"white",fontWeight:800,fontSize:11,color:activeStickerPack===pack?user.color:"#888",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{pack}</button>
                ))}
              </div>
              <div style={{padding:"10px 12px",display:"flex",flexWrap:"wrap",gap:6,maxHeight:110,overflowY:"auto"}}>
                {STICKER_PACKS[activeStickerPack].map(s=><span key={s} onClick={()=>sendMessage(s)} style={{fontSize:isTablet?30:24,cursor:"pointer",padding:4,borderRadius:10,background:"#f5f5f5"}}>{s}</span>)}
              </div>
            </div>
          )}

          {/* Send-to bar */}
          <div style={{background:"white",borderTop:"2px solid #eee",padding:"6px 12px",display:"flex",alignItems:"center",gap:6,overflowX:"auto"}}>
            <span style={{fontSize:11,fontWeight:800,color:"#aaa",flexShrink:0}}>To:</span>
            <button onClick={()=>setTargetUser(null)} style={{flexShrink:0,padding:"4px 10px",borderRadius:20,border:"2px solid "+(!targetUser?user.color:"#ddd"),background:!targetUser?user.color+"18":"white",fontWeight:800,fontSize:11,color:!targetUser?user.color:"#888",cursor:"pointer",fontFamily:"inherit"}}>👥 All</button>
            {USERS.filter(u=>u.id!==activeUser).map(u=>(<button key={u.id} onClick={()=>setTargetUser(targetUser===u.id?null:u.id)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,border:"2px solid "+(targetUser===u.id?u.color:"#ddd"),background:targetUser===u.id?u.color+"18":"white",fontWeight:800,fontSize:11,color:targetUser===u.id?u.color:"#888",cursor:"pointer",fontFamily:"inherit"}}>{u.emoji} {u.name}</button>))}
            <button onClick={()=>setShowPollModal(true)} style={{flexShrink:0,padding:"4px 10px",borderRadius:20,border:"2px solid #3B82F6",background:"#eff6ff",fontWeight:800,fontSize:11,color:"#3B82F6",cursor:"pointer",fontFamily:"inherit"}}>📊 Poll</button>
          </div>

          {/* Input bar */}
          <div style={{background:"white",borderTop:"2px solid #eee",padding:isTablet?"12px 14px":"8px 12px",display:"flex",alignItems:"center",gap:isTablet?8:6,boxShadow:"0 -4px 20px rgba(0,0,0,0.06)"}}>
            <button onClick={()=>setShowStickers(!showStickers)} style={{width:isTablet?46:38,height:isTablet?46:38,borderRadius:"50%",border:"2px solid "+user.color,background:showStickers?user.color+"22":"white",fontSize:isTablet?22:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>🌟</button>
            <button onClick={()=>fileInputRef.current.click()} style={{width:isTablet?46:38,height:isTablet?46:38,borderRadius:"50%",border:"2px solid "+user.color,background:"white",fontSize:isTablet?22:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>📷</button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhotoUpload}/>
            <input value={input} onChange={e=>{setInput(e.target.value);updateTyping();}} onKeyDown={e=>e.key==="Enter"&&sendMessage(input)}
              placeholder={targetUser?"💌 to "+USERS.find(u=>u.id===targetUser)?.name+"...":"Message everyone... 💬"}
              style={{flex:1,border:"2px solid "+(targetUser?USERS.find(u=>u.id===targetUser)?.color:user.color),borderRadius:25,padding:isTablet?"11px 16px":"9px 14px",fontSize:isTablet?16:14,fontFamily:"inherit",fontWeight:600,outline:"none",background:targetUser?USERS.find(u=>u.id===targetUser)?.bg:user.bg,color:"#1e1e1e"}}/>
            <button onClick={()=>recording?stopRecording():startRecording()} style={{width:isTablet?46:38,height:isTablet?46:38,borderRadius:"50%",border:"2px solid "+(recording?"#EF4444":user.color),background:recording?"#FEE2E2":"white",fontSize:isTablet?22:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{recording?"🔴":"🎙️"}</button>
            <button onClick={()=>sendMessage(input)} style={{width:isTablet?50:42,height:isTablet?50:42,borderRadius:"50%",background:"linear-gradient(135deg,"+user.color+","+user.color+"aa)",border:"none",fontSize:isTablet?22:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"white",flexShrink:0}}>➤</button>
          </div>
        </>
      )}

      {/* Recording overlay */}
      {recording&&(
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"white",borderRadius:20,padding:"20px 32px",boxShadow:"0 8px 40px rgba(0,0,0,0.2)",textAlign:"center",zIndex:100,border:"3px solid #EF4444"}}>
          <div style={{fontSize:40,marginBottom:8}}>🎙️</div>
          <div style={{fontWeight:800,fontSize:16,color:"#EF4444"}}>Recording... {recordingTime}s</div>
          <div style={{fontSize:12,color:"#888",marginTop:4}}>Tap mic again to send</div>
        </div>
      )}

      {/* Poll Modal */}
      {showPollModal&&<CreatePollModal onSend={(poll)=>{sendMessage("",null,poll);setShowPollModal(false);}} onClose={()=>setShowPollModal(false)}/>}

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes burstUp{0%{opacity:1;transform:translateX(-50%) scale(1) translateY(0)}100%{opacity:0;transform:translateX(-50%) scale(2) translateY(-50px)}}
      `}</style>
    </div>
  );
}
