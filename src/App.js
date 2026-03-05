import { useState, useRef, useEffect } from "react";

const USERS = [
  { id: "achraf", name: "Achraf", role: "Dad",         emoji: "👨", color: "#3B82F6", bg: "#eff6ff" },
  { id: "loubna", name: "Loubna", role: "Mum",         emoji: "👩", color: "#EC4899", bg: "#fdf2f8" },
  { id: "soltan", name: "Soltan", role: "Son 🎮",      emoji: "🧒", color: "#10B981", bg: "#ecfdf5" },
  { id: "hasnae", name: "Hasnae", role: "Daughter 🌸", emoji: "👧", color: "#F59E0B", bg: "#fffbeb" },
];

const DEVICE_PRESETS = {
  achraf: { device: "phone",  label: "📱 Dad's Phone"     },
  loubna: { device: "phone",  label: "📱 Mum's Phone"     },
  soltan: { device: "tablet", label: "📟 Soltan's Tablet" },
  hasnae: { device: "tablet", label: "📟 Hasnae's Tablet" },
};

const EMOJI_REACTIONS = ["❤️", "😂", "😮", "👍", "🎉", "🔥"];
const STICKERS = ["🌈","⭐","🦄","🍕","🎮","🐶","🐱","🦁","🎨","🎵","🏆","🌟","🌺","🦋","🍦","🎀"];
const fmt = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function FamilyChat() {
  const [screen, setScreen] = useState("launcher");
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([
    { id: 1, sender: "achraf", to: null,     text: "السلام عليكم يا أحبابي! 🥰",       time: new Date(Date.now()-60000*12), reactions: { "❤️": ["loubna","hasnae"] }, photo: null, isVoice: false, voiceDuration: 0 },
    { id: 2, sender: "loubna", to: null,     text: "وعليكم السلام حبيبي! كيف حالك؟ 💕", time: new Date(Date.now()-60000*10), reactions: {},                          photo: null, isVoice: false, voiceDuration: 0 },
    { id: 3, sender: "soltan", to: "achraf", text: "بابا تعال نلعب! 🎮🔥",              time: new Date(Date.now()-60000*8),  reactions: { "😂": ["achraf","loubna"] }, photo: null, isVoice: false, voiceDuration: 0 },
    { id: 4, sender: "hasnae", to: "loubna", text: "ماما بحبك كتير 🌸💖",               time: new Date(Date.now()-60000*5),  reactions: { "❤️": ["loubna"] },          photo: null, isVoice: false, voiceDuration: 0 },
  ]);
  const [input, setInput] = useState("");
  const [targetUser, setTargetUser] = useState(null);
  const [showEmoji, setShowEmoji] = useState(null);
  const [showStickers, setShowStickers] = useState(false);
  const [filter, setFilter] = useState("all");
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingVoice, setPlayingVoice] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recordTimerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, screen]);

  useEffect(() => {
    if (recording) {
      recordTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } else {
      clearInterval(recordTimerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(recordTimerRef.current);
  }, [recording]);

  const user = USERS.find(u => u.id === activeUser);
  const isTablet = activeUser && DEVICE_PRESETS[activeUser].device === "tablet";

  const allVisible = messages.filter(m => {
    if (!m.to) return true;
    return m.sender === activeUser || m.to === activeUser;
  });

  const dmVisible = messages.filter(m => {
    return m.to !== null && (m.to === activeUser || m.sender === activeUser);
  });

  const sendMessage = (text, photo, isVoice, voiceDuration) => {
    var t = text !== undefined ? text : input;
    var p = photo !== undefined ? photo : null;
    var iv = isVoice !== undefined ? isVoice : false;
    var vd = voiceDuration !== undefined ? voiceDuration : 0;
    if (!t.trim() && !p && !iv) return;
    setMessages(function(prev) {
      return prev.concat([{
        id: Date.now(), sender: activeUser, to: targetUser,
        text: t.trim(), time: new Date(), reactions: {}, photo: p, isVoice: iv, voiceDuration: vd
      }]);
    });
    setInput("");
    setShowStickers(false);
    setTargetUser(null);
  };

  const handlePhotoUpload = (e) => {
    var file = e.target.files[0];
    if (!file) return;
    var r = new FileReader();
    r.onload = function(ev) { sendMessage("", ev.target.result, false, 0); };
    r.readAsDataURL(file);
  };

  const handleVoice = () => {
    if (!recording) {
      setRecording(true);
      return;
    }
    setRecording(false);
    var dur = Math.max(recordingTime, 1);
    setMessages(function(prev) {
      return prev.concat([{
        id: Date.now(), sender: activeUser, to: targetUser,
        text: "", time: new Date(), reactions: {}, photo: null, isVoice: true, voiceDuration: dur
      }]);
    });
    setTargetUser(null);
  };

  const toggleReaction = (msgId, emoji) => {
    setMessages(function(prev) {
      return prev.map(function(m) {
        if (m.id !== msgId) return m;
        var reactors = m.reactions[emoji] || [];
        var already = reactors.includes(activeUser);
        var updated = already ? reactors.filter(function(u) { return u !== activeUser; }) : reactors.concat([activeUser]);
        var nr = Object.assign({}, m.reactions);
        nr[emoji] = updated;
        if (!nr[emoji].length) delete nr[emoji];
        return Object.assign({}, m, { reactions: nr });
      });
    });
    setShowEmoji(null);
  };

  if (screen === "launcher") {
    return (
      <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 20px", fontFamily:"'Nunito',sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        <div style={{ fontSize:56, marginBottom:8 }}>👨‍👩‍👧‍👦</div>
        <div style={{ fontSize:28, fontWeight:900, color:"white", marginBottom:4 }}>Family Chat</div>
        <div style={{ fontSize:14, color:"#c4b5fd", fontWeight:600, marginBottom:40 }}>عائلة أشرف</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, width:"100%", maxWidth:400 }}>
          {USERS.map(function(u) {
            return (
              <button key={u.id} onClick={function() { setActiveUser(u.id); setScreen("chat"); }}
                style={{ background:"white", border:"3px solid "+u.color, borderRadius:20, padding:"24px 16px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8, boxShadow:"0 8px 32px "+u.color+"44" }}>
                <div style={{ fontSize:40 }}>{u.emoji}</div>
                <div style={{ fontWeight:900, fontSize:16, color:u.color }}>{u.name}</div>
                <div style={{ fontSize:11, color:"#888", fontWeight:700 }}>{u.role}</div>
                <div style={{ fontSize:11, background:u.bg, color:u.color, borderRadius:20, padding:"2px 10px", fontWeight:700, marginTop:4 }}>{DEVICE_PRESETS[u.id].label}</div>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop:32, fontSize:12, color:"#7c3aed", fontWeight:600 }}>Tap your profile to open your chat</div>
      </div>
    );
  }

  var dmCount = messages.filter(function(m) { return m.to === activeUser; }).length;
  var shownMessages = filter === "all" ? allVisible : dmVisible;

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", minHeight:"100vh", background:user.bg, display:"flex", flexDirection:"column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ background:"linear-gradient(135deg,"+user.color+","+user.color+"bb)", padding:"14px 16px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 4px 16px rgba(0,0,0,0.18)", position:"sticky", top:0, zIndex:20 }}>
        <button onClick={function() { setScreen("launcher"); }} style={{ background:"rgba(255,255,255,0.25)", border:"none", borderRadius:"50%", width:36, height:36, color:"white", fontSize:18, cursor:"pointer" }}>‹</button>
        <div style={{ fontSize:32 }}>👨‍👩‍👧‍👦</div>
        <div>
          <div style={{ fontSize:18, fontWeight:900, color:"white" }}>Family Chat</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.8)", fontWeight:700 }}>Achraf · Loubna · Soltan · Hasnae</div>
        </div>
        <div style={{ marginLeft:"auto", background:"rgba(255,255,255,0.25)", borderRadius:20, padding:"4px 12px", color:"white", fontSize:12, fontWeight:800 }}>
          {user.emoji} {user.name}
        </div>
      </div>

      <div style={{ display:"flex", borderBottom:"2px solid #eee", background:"white" }}>
        <button onClick={function() { setFilter("all"); }}
          style={{ flex:1, padding:"10px 0", border:"none", background:"none", fontFamily:"inherit", fontWeight:800, fontSize:13, cursor:"pointer", color:filter==="all"?user.color:"#aaa", borderBottom:filter==="all"?"3px solid "+user.color:"3px solid transparent" }}>
          👥 Group
        </button>
        <button onClick={function() { setFilter("dm"); }}
          style={{ flex:1, padding:"10px 0", border:"none", background:"none", fontFamily:"inherit", fontWeight:800, fontSize:13, cursor:"pointer", color:filter==="dm"?user.color:"#aaa", borderBottom:filter==="dm"?"3px solid "+user.color:"3px solid transparent" }}>
          {"💌 My DMs" + (dmCount ? " ("+dmCount+")" : "")}
        </button>
      </div>

      {isTablet && (
        <div style={{ background:user.color+"18", borderBottom:"2px dashed "+user.color+"44", padding:"7px 16px", textAlign:"center", fontSize:13, fontWeight:800, color:user.color }}>
          {user.emoji} Hey {user.name}! {filter==="dm" ? "Here are your personal messages 💌" : "Say hi to the family 👋"}
        </div>
      )}

      <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ textAlign:"center", fontSize:11, color:"#bbb", fontWeight:700, marginBottom:4 }}>
          {filter==="all" ? "— Group messages —" : "— Your direct messages —"}
        </div>

        {shownMessages.map(function(msg, i) {
          var sender = USERS.find(function(u) { return u.id === msg.sender; });
          var recipient = msg.to ? USERS.find(function(u) { return u.id === msg.to; }) : null;
          var isMe = msg.sender === activeUser;
          var isDM = !!msg.to;
          var showAvatar = i===0 || shownMessages[i-1].sender !== msg.sender;

          return (
            <div key={msg.id} style={{ display:"flex", flexDirection:isMe?"row-reverse":"row", alignItems:"flex-end", gap:8 }}>
              <div style={{ width:isTablet?42:36, height:isTablet?42:36, borderRadius:"50%", background:sender.bg, border:"2px solid "+sender.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:isTablet?24:20, flexShrink:0, opacity:showAvatar?1:0 }}>
                {sender.emoji}
              </div>
              <div style={{ maxWidth:"70%", display:"flex", flexDirection:"column", alignItems:isMe?"flex-end":"flex-start", gap:2 }}>
                {showAvatar && !isMe && (
                  <div style={{ fontSize:11, fontWeight:800, color:sender.color, paddingLeft:4 }}>{sender.name}</div>
                )}
                {isDM && (
                  <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:800, color:isMe?sender.color:recipient.color, padding:"2px 10px", background:isMe?sender.color+"18":recipient.color+"18", borderRadius:20, border:"1.5px solid "+(isMe?sender.color:recipient.color)+"44", marginBottom:2, alignSelf:isMe?"flex-end":"flex-start" }}>
                    {isMe ? "💌 to "+recipient.emoji+" "+recipient.name : sender.emoji+" "+sender.name+" → 💌 you"}
                  </div>
                )}
                <div onClick={function() { setShowEmoji(showEmoji===msg.id ? null : msg.id); }}
                  style={{ background:isMe?sender.color+"33":"white", border:"2px solid "+(isDM?(isMe?sender.color:recipient.color):sender.color), borderRadius:isMe?"20px 4px 20px 20px":"4px 20px 20px 20px", padding:"10px 14px", cursor:"pointer", boxShadow:"0 2px 10px rgba(0,0,0,0.08)", outline:isDM?"2px dashed "+(isMe?sender.color:recipient.color)+"55":"none", outlineOffset:2 }}>
                  {msg.photo && (
                    <img src={msg.photo} alt="shared" style={{ maxWidth:200, maxHeight:200, borderRadius:12, display:"block", marginBottom:msg.text?8:0 }} />
                  )}
                  {msg.isVoice && (
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <button onClick={function(e) { e.stopPropagation(); setPlayingVoice(playingVoice===msg.id?null:msg.id); setTimeout(function(){setPlayingVoice(null);}, msg.voiceDuration*1000); }}
                        style={{ width:32, height:32, borderRadius:"50%", background:sender.color, border:"none", color:"white", cursor:"pointer", fontSize:14 }}>
                        {playingVoice===msg.id ? "⏸" : "▶"}
                      </button>
                      <div style={{ flex:1, height:4, background:sender.color+"33", borderRadius:4, overflow:"hidden" }}>
                        <div style={{ height:"100%", background:sender.color, borderRadius:4, width:playingVoice===msg.id?"100%":"0%", transition:playingVoice===msg.id?"width "+msg.voiceDuration+"s linear":"none" }} />
                      </div>
                      <span style={{ fontSize:11, color:"#888", fontWeight:700 }}>{msg.voiceDuration}s</span>
                    </div>
                  )}
                  {msg.text && (
                    <div style={{ fontSize:msg.text.length<=2?(isTablet?48:40):(isTablet?18:15), fontWeight:600, color:"#1e1e1e", lineHeight:1.5 }}>{msg.text}</div>
                  )}
                </div>
                <div style={{ fontSize:10, color:"#bbb", fontWeight:600, padding:"0 4px" }}>{fmt(msg.time)}</div>
                {Object.keys(msg.reactions).length > 0 && (
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap", padding:"2px 4px" }}>
                    {Object.entries(msg.reactions).map(function(entry) {
                      var emoji = entry[0]; var users = entry[1];
                      return users.length > 0 ? (
                        <span key={emoji} onClick={function() { toggleReaction(msg.id, emoji); }}
                          style={{ background:"white", border:"2px solid #eee", borderRadius:20, padding:"2px 8px", fontSize:13, cursor:"pointer", fontWeight:700 }}>
                          {emoji} {users.length}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                {showEmoji===msg.id && (
                  <div style={{ display:"flex", gap:4, background:"white", borderRadius:30, padding:"6px 10px", boxShadow:"0 4px 20px rgba(0,0,0,0.15)", border:"2px solid #eee", zIndex:10 }}>
                    {EMOJI_REACTIONS.map(function(e) {
                      return (
                        <span key={e} onClick={function() { toggleReaction(msg.id, e); }}
                          style={{ fontSize:isTablet?26:20, cursor:"pointer", padding:2 }}>
                          {e}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {showStickers && (
        <div style={{ background:"white", borderTop:"2px solid #eee", padding:"12px 16px", display:"flex", flexWrap:"wrap", gap:8, maxHeight:130, overflowY:"auto" }}>
          {STICKERS.map(function(s) {
            return (
              <span key={s} onClick={function() { sendMessage(s, null, false, 0); }}
                style={{ fontSize:isTablet?34:26, cursor:"pointer", padding:4, borderRadius:10, background:"#f5f5f5" }}>
                {s}
              </span>
            );
          })}
        </div>
      )}

      <div style={{ background:"white", borderTop:"1px solid #f0f0f0", padding:"8px 16px", display:"flex", alignItems:"center", gap:8, overflowX:"auto" }}>
        <span style={{ fontSize:12, fontWeight:800, color:"#aaa", flexShrink:0 }}>Send to:</span>
        <button onClick={function() { setTargetUser(null); }}
          style={{ flexShrink:0, padding:"5px 12px", borderRadius:20, border:"2px solid "+(!targetUser?user.color:"#ddd"), background:!targetUser?user.color+"18":"white", fontWeight:800, fontSize:12, color:!targetUser?user.color:"#888", cursor:"pointer", fontFamily:"inherit" }}>
          👥 Everyone
        </button>
        {USERS.filter(function(u) { return u.id !== activeUser; }).map(function(u) {
          return (
            <button key={u.id} onClick={function() { setTargetUser(targetUser===u.id?null:u.id); }}
              style={{ flexShrink:0, display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:20, border:"2px solid "+(targetUser===u.id?u.color:"#ddd"), background:targetUser===u.id?u.color+"18":"white", fontWeight:800, fontSize:12, color:targetUser===u.id?u.color:"#888", cursor:"pointer", fontFamily:"inherit" }}>
              {u.emoji} {u.name}
            </button>
          );
        })}
      </div>

      <div style={{ background:"white", borderTop:"2px solid #eee", padding:isTablet?"14px 16px":"10px 14px", display:"flex", alignItems:"center", gap:isTablet?10:8, boxShadow:"0 -4px 20px rgba(0,0,0,0.06)" }}>
        <button onClick={function() { setShowStickers(!showStickers); }}
          style={{ width:isTablet?48:40, height:isTablet?48:40, borderRadius:"50%", border:"2px solid "+user.color, background:showStickers?user.color+"22":"white", fontSize:isTablet?24:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          🌟
        </button>
        <button onClick={function() { fileInputRef.current.click(); }}
          style={{ width:isTablet?48:40, height:isTablet?48:40, borderRadius:"50%", border:"2px solid "+user.color, background:"white", fontSize:isTablet?24:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          📷
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhotoUpload} />
        <input value={input} onChange={function(e) { setInput(e.target.value); }}
          onKeyDown={function(e) { if(e.key==="Enter") sendMessage(input, null, false, 0); }}
          placeholder={targetUser ? "💌 to "+USERS.find(function(u){return u.id===targetUser;}).name+"..." : "Message everyone... 💬"}
          style={{ flex:1, border:"2px solid "+(targetUser?USERS.find(function(u){return u.id===targetUser;}).color:user.color), borderRadius:25, padding:isTablet?"12px 18px":"10px 16px", fontSize:isTablet?17:15, fontFamily:"inherit", fontWeight:600, outline:"none", background:targetUser?USERS.find(function(u){return u.id===targetUser;}).bg:user.bg, color:"#1e1e1e" }} />
        <button onClick={handleVoice}
          style={{ width:isTablet?48:40, height:isTablet?48:40, borderRadius:"50%", border:"2px solid "+(recording?"#EF4444":user.color), background:recording?"#FEE2E2":"white", fontSize:isTablet?24:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {recording ? "🔴" : "🎙️"}
        </button>
        <button onClick={function() { sendMessage(input, null, false, 0); }}
          style={{ width:isTablet?52:44, height:isTablet?52:44, borderRadius:"50%", background:"linear-gradient(135deg,"+user.color+","+user.color+"aa)", border:"none", fontSize:isTablet?24:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white" }}>
          ➤
        </button>
      </div>

      {recording && (
        <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", background:"white", borderRadius:20, padding:"20px 32px", boxShadow:"0 8px 40px rgba(0,0,0,0.2)", textAlign:"center", zIndex:100, border:"3px solid #EF4444" }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🎙️</div>
          <div style={{ fontWeight:800, fontSize:16, color:"#EF4444" }}>Recording... {recordingTime}s</div>
          <div style={{ fontSize:12, color:"#888", marginTop:4 }}>Tap the mic again to send</div>
        </div>
      )}

      <style>{"@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}"}</style>
    </div>
  );
}