import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBWUmkehUlQ70w3h219Dg92eeHdDjfWMMQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "horsing-around-70354.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "horsing-around-70354",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "horsing-around-70354.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "175458919055",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:175458919055:web:a7d5e8685124f8ad91c6fa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_HORSES = [
  { id: "h1", name: "Copper", breed: "Quarter Horse", age: 8, color: "#b5651d" },
  { id: "h2", name: "Midnight", breed: "Friesian", age: 6, color: "#2c2c2c" },
  { id: "h3", name: "Daisy", breed: "Appaloosa", age: 11, color: "#d4a96a" },
  { id: "h4", name: "Storm", breed: "Andalusian", age: 9, color: "#8a9ba8" },
];
const DEFAULT_INSTRUCTORS = [
  { id: "i1", name: "Sarah Mills", phone: "", email: "" },
  { id: "i2", name: "Tom Harwick", phone: "", email: "" },
  { id: "i3", name: "Lily Chen", phone: "", email: "" },
];
const DEFAULT_LESSON_TYPES = [
  { id: "lt1", name: "Private", duration: 60, price: 85 },
  { id: "lt2", name: "Group (2-4)", duration: 60, price: 45 },
  { id: "lt3", name: "Semi-Private", duration: 60, price: 65 },
  { id: "lt4", name: "Trail Ride", duration: 90, price: 55 },
];

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const HORSE_COLORS = ["#b5651d","#2c2c2c","#d4a96a","#8a9ba8","#7a4a2a","#c8a878","#5a7a5a","#8a6a9a"];

function useCollection(collectionName, defaults) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const seeded = useRef(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, collectionName), async (snap) => {
      if (snap.empty && !seeded.current) {
        seeded.current = true;
        for (const item of defaults) {
          await setDoc(doc(db, collectionName, item.id), item);
        }
      } else {
        setData(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        setLoading(false);
      }
    });
    return () => unsub();
  }, [collectionName]);

  const add = async (item) => { await setDoc(doc(db, collectionName, item.id), item); };
  const update = async (item) => { await setDoc(doc(db, collectionName, item.id), item); };
  const remove = async (id) => { await deleteDoc(doc(db, collectionName, id)); };

  return { data, loading, add, update, remove };
}

async function callClaude(messages, system = "") {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system, messages }),
  });
  const data = await response.json();
  return data.content?.map(b => b.text || "").join("") || "Sorry, I couldn't get a response.";
}

export default function App() {
  const [tab, setTab] = useState("schedule");
  const { data: riders, loading: rLoading, add: addRider, update: updateRider, remove: removeRider } = useCollection("riders", [
    { id: "r1", name: "Emma Thornton", age: 12, level: "Beginner", phone: "555-0101", email: "emma@example.com", balance: -45 },
    { id: "r2", name: "James Whitfield", age: 16, level: "Intermediate", phone: "555-0102", email: "james@example.com", balance: 0 },
    { id: "r3", name: "Sofia Reyes", age: 9, level: "Beginner", phone: "555-0103", email: "sofia@example.com", balance: -90 },
    { id: "r4", name: "Luca Brennan", age: 14, level: "Advanced", phone: "555-0104", email: "luca@example.com", balance: 60 },
  ]);
  const { data: horses, loading: hLoading, add: addHorse, update: updateHorse, remove: removeHorse } = useCollection("horses", DEFAULT_HORSES);
  const { data: instructors, loading: iLoading, add: addInstructor, update: updateInstructor, remove: removeInstructor } = useCollection("instructors", DEFAULT_INSTRUCTORS);
  const { data: lessonTypes, loading: ltLoading, add: addLessonType, update: updateLessonType, remove: removeLessonType } = useCollection("lessonTypes", DEFAULT_LESSON_TYPES);
  const { data: lessons, loading: lLoading, add: addLesson, update: updateLesson, remove: removeLesson } = useCollection("lessons", [
    { id: "l1", riderId: "r1", horseId: "h1", instructor: "Sarah Mills", type: "Private", date: "2026-03-17", time: "09:00", status: "Scheduled", paid: false, price: 85, notes: "" },
    { id: "l2", riderId: "r2", horseId: "h2", instructor: "Tom Harwick", type: "Group (2-4)", date: "2026-03-17", time: "11:00", status: "Scheduled", paid: true, price: 45, notes: "" },
    { id: "l3", riderId: "r3", horseId: "h3", instructor: "Lily Chen", type: "Semi-Private", date: "2026-03-18", time: "14:00", status: "Scheduled", paid: false, price: 65, notes: "" },
    { id: "l4", riderId: "r1", horseId: "h1", instructor: "Sarah Mills", type: "Private", date: "2026-03-10", time: "09:00", status: "Completed", paid: true, price: 85, notes: "Great progress on posting trot. Emma is gaining confidence at the canter." },
    { id: "l5", riderId: "r4", horseId: "h4", instructor: "Tom Harwick", type: "Private", date: "2026-03-11", time: "15:00", status: "Completed", paid: false, price: 85, notes: "Worked on lead changes. Luca needs more practice with left lead." },
  ]);
  const { data: payments, loading: pLoading, add: addPayment } = useCollection("payments", [
    { id: "p1", riderId: "r2", lessonId: "l2", amount: 45, date: "2026-03-15", method: "Card", note: "Lesson 3/17" },
    { id: "p2", riderId: "r1", lessonId: "l4", amount: 85, date: "2026-03-10", method: "Cash", note: "Lesson 3/10" },
    { id: "p3", riderId: "r4", lessonId: null, amount: 60, date: "2026-03-12", method: "Venmo", note: "Account credit" },
  ]);

  const loading = rLoading || hLoading || iLoading || ltLoading || lLoading || pLoading;

  const [modal, setModal] = useState(null);
  const [calDate, setCalDate] = useState(() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1); });
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ha_current_user")) || null; } catch { return null; }
  });
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [msgTab, setMsgTab] = useState("group");
  const [dmTarget, setDmTarget] = useState(null);
  const [groupMessages, setGroupMessages] = useCollection("groupMessages");
  const [directMessages, setDirectMessages] = useCollection("directMessages");
  const [msgInput, setMsgInput] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const msgEndRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hi! I'm your Horsing Around AI assistant 🐴 I can suggest lesson plans, summarize rider progress, auto-generate lesson notes, or answer any questions about horses and riding. What can I help you with?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const fmt = (d) => { const [y, m, day] = d.split("-"); return `${MONTHS[parseInt(m) - 1]} ${parseInt(day)}, ${y}`; };
  const getRider = (id) => riders.find(r => r.id === id);
  const getHorse = (id) => horses.find(h => h.id === id);
  const today = new Date().toISOString().split("T")[0];
  const thisMonthPrefix = today.slice(0, 7);
  const firstDay = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
  const calCells = Array.from({ length: firstDay }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const dateStr = (day) => { if (!day) return null; const m = String(calDate.getMonth() + 1).padStart(2, "0"); const d = String(day).padStart(2, "0"); return `${calDate.getFullYear()}-${m}-${d}`; };
  const dayLessons = lessons.filter(l => l.date === selectedDay).sort((a, b) => a.time.localeCompare(b.time));
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = lessons.filter(l => !l.paid && l.status === "Completed").reduce((s, l) => s + l.price, 0);
  const thisMonthLessons = lessons.filter(l => l.date.startsWith(thisMonthPrefix));
  const statusColor = (s) => ({ "Scheduled": "#4a7c59", "Completed": "#2c6fa8", "Cancelled": "#9e5a3a" }[s] || "#888");

  // Edit helpers
  const openEdit = (type, item) => { setEditTarget({ type, item, isNew: false }); setForm({ ...item }); setModal("edit"); };
  const openAdd = (type) => {
    const id = `${type.charAt(0)}${Date.now()}`;
    const defaults = { rider: { id, name: "", age: "", level: "Beginner", phone: "", email: "", balance: 0 }, horse: { id, name: "", breed: "", age: "", color: "#b5651d" }, instructor: { id, name: "", phone: "", email: "" }, lessonType: { id, name: "", duration: 60, price: 0 } };
    setForm(defaults[type]); setEditTarget({ type, isNew: true }); setModal("edit");
  };

  const saveEdit = async () => {
    const { type, isNew } = editTarget;
    if (!form.name) { showToast("Name is required", "error"); return; }
    const cleaned = type === "rider" ? { ...form, age: parseInt(form.age) || 0, balance: parseFloat(form.balance) || 0 }
      : type === "horse" ? { ...form, age: parseInt(form.age) || 0 }
      : type === "lessonType" ? { ...form, price: parseFloat(form.price) || 0, duration: parseInt(form.duration) || 60 }
      : { ...form };
    const fns = { rider: [addRider, updateRider], horse: [addHorse, updateHorse], instructor: [addInstructor, updateInstructor], lessonType: [addLessonType, updateLessonType] };
    await fns[type][isNew ? 0 : 1](cleaned);
    setModal(null); setForm({}); setEditTarget(null);
    showToast(isNew ? "Added!" : "Saved!");
  };

  const deleteItem = async (type, id) => {
    const fns = { rider: removeRider, horse: removeHorse, instructor: removeInstructor, lessonType: removeLessonType };
    await fns[type](id);
    setModal(null); setForm({}); setEditTarget(null);
    showToast("Deleted");
  };

  // Lesson actions
  const saveNotes = async () => {
    await updateLesson({ ...selectedLesson, notes: tempNotes });
    setSelectedLesson({ ...selectedLesson, notes: tempNotes });
    setEditingNotes(false); showToast("Notes saved!");
  };

  const handleAddLesson = async () => {
    if (!form.riderId || !form.horseId || !form.instructor || !form.type || !form.date || !form.time) { showToast("Please fill all required fields", "error"); return; }
    const type = lessonTypes.find(t => t.name === form.type);
    await addLesson({ id: `l${Date.now()}`, riderId: form.riderId, horseId: form.horseId, instructor: form.instructor, type: form.type, date: form.date, time: form.time, status: "Scheduled", paid: false, price: type?.price || 0, notes: form.notes || "" });
    setSelectedDay(form.date); setModal(null); setForm({});
    showToast("Lesson scheduled!");
  };

  const handlePayment = async (lesson) => {
    await addPayment({ id: `p${Date.now()}`, riderId: lesson.riderId, lessonId: lesson.id, amount: lesson.price, date: today, method: form.method || "Cash", note: `Lesson ${lesson.date}` });
    await updateLesson({ ...lesson, paid: true });
    if (selectedLesson?.id === lesson.id) setSelectedLesson({ ...selectedLesson, paid: true });
    setModal(null); setForm({});
    showToast(`Payment of $${lesson.price} recorded!`);
  };

  const completeLesson = async (lesson) => { await updateLesson({ ...lesson, status: "Completed" }); if (selectedLesson?.id === lesson.id) setSelectedLesson({ ...lesson, status: "Completed" }); showToast("Lesson marked complete"); };
  const cancelLesson = async (lesson) => { await updateLesson({ ...lesson, status: "Cancelled" }); if (selectedLesson?.id === lesson.id) setSelectedLesson({ ...lesson, status: "Cancelled" }); showToast("Lesson cancelled"); };

  // AI
  const generateNotes = async (lesson) => {
    const rider = getRider(lesson.riderId); const horse = getHorse(lesson.horseId);
    setAiLoading(true);
    const text = await callClaude([{ role: "user", content: `Generate brief, practical lesson notes (3-5 sentences) for a ${lesson.type} riding lesson. Rider: ${rider?.name}, Level: ${rider?.level}, Horse: ${horse?.name} (${horse?.breed}), Instructor: ${lesson.instructor}.` }], "You are an expert equestrian instructor. Write concise, professional lesson notes.");
    setTempNotes(text); setEditingNotes(true); setAiLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim(); setChatInput("");
    const newMessages = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(newMessages); setChatLoading(true);
    const riderSummary = riders.map(r => { const rL = lessons.filter(l => l.riderId === r.id && l.status === "Completed"); return `${r.name} (Age ${r.age}, ${r.level}): ${rL.length} lessons. Notes: ${rL.map(l => l.notes).filter(Boolean).join(" | ") || "none"}`; }).join("\n");
    const reply = await callClaude(newMessages.map(m => ({ role: m.role, content: m.content })), `You are an AI assistant for "Horsing Around", a horse riding lesson program.\nRiders:\n${riderSummary}\nBe helpful, friendly, and concise.`);
    setChatMessages([...newMessages, { role: "assistant", content: reply }]); setChatLoading(false);
  };

  const summarizeRider = async (rider) => {
    const rL = lessons.filter(l => l.riderId === rider.id && l.status === "Completed");
    const notes = rL.map((l, i) => `Lesson ${i + 1} (${l.date}): ${l.notes || "no notes"}`).join("\n");
    setTab("ai");
    const userMsg = `Summarize progress for ${rider.name}, a ${rider.level} rider aged ${rider.age}:\n${notes || "No lessons yet."}`;
    const newMessages = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(newMessages); setChatLoading(true);
    const reply = await callClaude([{ role: "user", content: userMsg }], "You are an expert equestrian instructor. Provide encouraging progress summaries and actionable recommendations.");
    setChatMessages([...newMessages, { role: "assistant", content: reply }]); setChatLoading(false);
  };

  const suggestLessonPlan = async (rider) => {
    const rL = lessons.filter(l => l.riderId === rider.id && l.status === "Completed");
    const recentNotes = rL.slice(-3).map(l => l.notes).filter(Boolean).join(" ");
    setTab("ai");
    const userMsg = `Suggest a lesson plan for ${rider.name}, a ${rider.level} rider aged ${rider.age}. Recent notes: ${recentNotes || "No recent lessons."}`;
    const newMessages = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(newMessages); setChatLoading(true);
    const reply = await callClaude([{ role: "user", content: userMsg }], "You are an expert equestrian instructor. Provide structured, practical lesson plans.");
    setChatMessages([...newMessages, { role: "assistant", content: reply }]); setChatLoading(false);
  };

  // ── Messaging ──
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [groupMessages, directMessages, dmTarget]);

  const selectUser = (user) => {
    localStorage.setItem("ha_current_user", JSON.stringify(user));
    setCurrentUser(user);
    setShowUserPicker(false);
  };

  const getDmMessages = () => {
    if (!currentUser || !dmTarget) return [];
    return directMessages.filter(m =>
      (m.senderId === currentUser.id && m.receiverId === dmTarget.id) ||
      (m.senderId === dmTarget.id && m.receiverId === currentUser.id)
    ).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  };

  const getAllUsers = () => {
    const riderUsers = riders.map(r => ({ id: `rider_${r.id}`, name: r.name, role: "Rider" }));
    const instructorUsers = instructors.map(i => ({ id: `inst_${i.id}`, name: i.name, role: "Instructor" }));
    const parentUsers = riders.filter(r => r.parentName).map(r => ({ id: `parent_${r.id}`, name: r.parentName, role: "Parent" }));
    return [...instructorUsers, ...riderUsers, ...parentUsers];
  };

  const sendMessage = async (isGroup = true) => {
    if (!msgInput.trim() || !currentUser) return;
    setMsgLoading(true);
    const msgData = {
      text: msgInput.trim(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      createdAt: serverTimestamp(),
      type: "text",
    };
    if (isGroup) {
      await addDoc(collection(db, "groupMessages"), msgData);
    } else {
      await addDoc(collection(db, "directMessages"), { ...msgData, receiverId: dmTarget.id, receiverName: dmTarget.name });
    }
    setMsgInput("");
    setMsgLoading(false);
  };



  const getUnreadCount = (targetUser) => {
    if (!currentUser) return 0;
    return directMessages.filter(m => m.senderId === targetUser.id && m.receiverId === currentUser.id && !m.read).length;
  };

  const roleColor = (role) => ({ "Instructor": "#4a7c59", "Rider": "#2c6fa8", "Parent": "#9e5a3a", "Admin": "#a0784a" }[role] || "#888");

  const editFields = () => {
    const type = editTarget?.type;
    if (type === "rider") return [["Name","name","text","Full name"],["Age","age","number","Age"],["Level","level","select",["Beginner","Intermediate","Advanced"]],["Phone","phone","tel","Phone number"],["Email","email","email","Email address"],["Balance ($)","balance","number","0"]];
    if (type === "horse") return [["Name","name","text","Horse name"],["Breed","breed","text","Breed"],["Age","age","number","Age"],["Color","color","color",""]];
    if (type === "instructor") return [["Name","name","text","Full name"],["Phone","phone","tel","Phone number"],["Email","email","email","Email address"]];
    if (type === "lessonType") return [["Name","name","text","Lesson type name"],["Duration (min)","duration","number","60"],["Price ($)","price","number","0"]];
    return [];
  };

  const editTitle = () => { const t = editTarget?.type; const n = editTarget?.isNew; if(t==="rider") return n?"Add Rider":"Edit Rider"; if(t==="horse") return n?"Add Horse":"Edit Horse"; if(t==="instructor") return n?"Add Instructor":"Edit Instructor"; if(t==="lessonType") return n?"Add Lesson Type":"Edit Lesson Type"; return "Edit"; };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f5f0e8", fontFamily: "'Playfair Display', serif", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 48 }}>🐴</div>
      <div style={{ fontSize: 20, color: "#a0784a" }}>Loading Horsing Around…</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", background: "#f5f0e8", minHeight: "100vh", color: "#2d1f0e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #e8dfc8; } ::-webkit-scrollbar-thumb { background: #a0784a; border-radius: 3px; }
        .btn { cursor: pointer; border: none; border-radius: 6px; font-family: 'Lato', sans-serif; font-weight: 700; transition: all 0.2s; }
        .btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        .tab-btn { background: none; border: none; cursor: pointer; font-family: 'Playfair Display', serif; font-size: 14px; padding: 10px 16px; color: #7a5c3a; border-bottom: 3px solid transparent; transition: all 0.2s; white-space: nowrap; }
        .tab-btn.active { color: #f5e6c8; border-bottom-color: #c8945a; }
        .tab-btn:hover { color: #f5e6c8; }
        .card { background: #fff8ef; border-radius: 12px; box-shadow: 0 2px 12px rgba(80,50,20,0.1); }
        .lesson-row { background: #fff8ef; border-radius: 10px; padding: 14px 18px; margin-bottom: 10px; border-left: 4px solid #a0784a; box-shadow: 0 1px 6px rgba(80,50,20,0.08); transition: all 0.2s; cursor: pointer; }
        .lesson-row:hover { box-shadow: 0 4px 16px rgba(80,50,20,0.15); transform: translateX(2px); }
        .input { width: 100%; padding: 9px 13px; border: 1.5px solid #d4c4a0; border-radius: 7px; font-family: 'Lato', sans-serif; font-size: 14px; background: #fffdf7; color: #2d1f0e; outline: none; transition: border-color 0.2s; }
        .input:focus { border-color: #a0784a; }
        .textarea { width: 100%; padding: 10px 13px; border: 1.5px solid #d4c4a0; border-radius: 7px; font-family: 'Lato', sans-serif; font-size: 14px; background: #fffdf7; color: #2d1f0e; outline: none; resize: vertical; min-height: 100px; line-height: 1.6; }
        .textarea:focus { border-color: #a0784a; }
        select.input { cursor: pointer; }
        .modal-bg { position: fixed; inset: 0; background: rgba(30,15,5,0.55); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
        .modal { background: #fffdf7; border-radius: 16px; padding: 28px; max-width: 540px; width: 95%; box-shadow: 0 20px 60px rgba(30,15,5,0.25); max-height: 90vh; overflow-y: auto; }
        .cal-cell { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 8px; cursor: pointer; font-family: 'Lato', sans-serif; font-size: 14px; transition: all 0.15s; }
        .cal-cell:hover { background: #e8d8bc; }
        .cal-cell.selected { background: #a0784a; color: white; font-weight: 700; }
        .cal-cell.has-lessons { position: relative; }
        .cal-cell.has-lessons::after { content: ''; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 5px; height: 5px; background: #c8945a; border-radius: 50%; }
        .cal-cell.selected::after { background: white; }
        .cal-cell.today-cell { font-weight: 700; color: #7a3a0e; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-family: 'Lato', sans-serif; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
        .label { font-family: 'Lato', sans-serif; font-size: 12px; color: #8a6a4a; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 5px; }
        .stat-card { background: linear-gradient(135deg, #fff8ef, #f0e8d5); border-radius: 12px; padding: 20px 24px; border: 1px solid #e0cfa8; }
        .rider-avatar { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-weight: 700; color: white; flex-shrink: 0; }
        .toast { position: fixed; bottom: 24px; right: 24px; padding: 14px 22px; border-radius: 10px; font-family: 'Lato', sans-serif; font-size: 14px; font-weight: 700; z-index: 999; box-shadow: 0 4px 20px rgba(0,0,0,0.2); animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .horse-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 700; }
        .notes-box { background: #fdf6e3; border: 1px dashed #c8a86a; border-radius: 8px; padding: 10px 14px; font-family: 'Lato', sans-serif; font-size: 13px; color: #5a3e20; line-height: 1.6; font-style: italic; margin-top: 10px; }
        .chat-bubble { max-width: 80%; padding: 12px 16px; border-radius: 16px; font-family: 'Lato', sans-serif; font-size: 14px; line-height: 1.6; margin-bottom: 12px; white-space: pre-wrap; }
        .chat-bubble.user { background: #a0784a; color: white; margin-left: auto; border-bottom-right-radius: 4px; }
        .chat-bubble.assistant { background: #fff8ef; color: #2d1f0e; border: 1px solid #e0cfa8; border-bottom-left-radius: 4px; }
        .ai-action-btn { background: linear-gradient(135deg, #4a3020, #6b4c2a); color: #f5e6c8; border: none; border-radius: 8px; padding: 8px 14px; font-family: 'Lato', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .ai-action-btn:hover { filter: brightness(1.2); transform: translateY(-1px); }
        .typing-dot { display: inline-block; width: 8px; height: 8px; background: #a0784a; border-radius: 50%; margin: 0 2px; animation: bounce 1.2s infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; } .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-8px); } }
        .edit-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #fff8ef; border-radius: 9px; margin-bottom: 8px; border: 1px solid #e8d4b0; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .color-swatch { width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.2); transition: transform 0.15s; }
        .color-swatch:hover { transform: scale(1.15); }
        .color-swatch.selected { box-shadow: 0 0 0 3px #a0784a; }
        .live-badge { display: inline-flex; align-items: center; gap: 5px; background: #4a7c5922; color: #4a7c59; padding: 3px 10px; border-radius: 20px; font-family: 'Lato', sans-serif; font-size: 11px; font-weight: 700; }
        .live-dot { width: 7px; height: 7px; background: #4a7c59; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @media (max-width: 700px) {
          .desktop-grid { display: flex !important; flex-direction: column !important; }
          .cal-cell { width: 34px; height: 34px; font-size: 12px; }
          .modal { padding: 18px; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .payments-grid { grid-template-columns: 1fr !important; }
          .riders-grid { grid-template-columns: 1fr !important; }
          .settings-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #2d1f0e 0%, #4a3020 60%, #6b4c2a 100%)", padding: "0 16px", boxShadow: "0 3px 20px rgba(30,15,5,0.3)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, paddingBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 28 }}>🐴</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#f5e6c8" }}>Horsing Around</div>
                  <div className="live-badge"><div className="live-dot"></div>Live</div>
                </div>
                <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "#c8a878", letterSpacing: 2, textTransform: "uppercase" }}>Riding Program Management</div>
              </div>
            </div>
            <button className="btn" onClick={() => { setModal("addLesson"); setForm({ date: selectedDay }); }}
              style={{ background: "linear-gradient(135deg, #c8945a, #a0784a)", color: "white", padding: "9px 16px", fontSize: 13 }}>+ New Lesson</button>
          </div>
          <div style={{ display: "flex", gap: 0, marginTop: 8, overflowX: "auto" }}>
            {[["schedule","📅 Schedule"],["riders","🧑 Riders"],["payments","💰 Payments"],["ai","✨ AI Assistant"],["settings","⚙️ Settings"]].map(([key,label]) => (
              <button key={key} className={`tab-btn ${tab===key?"active":""}`} onClick={() => setTab(key)}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 16px" }}>

        {/* SCHEDULE */}
        {tab === "schedule" && (
          <div className="desktop-grid" style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
            <div>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <button className="btn" onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth()-1))} style={{ background:"none", color:"#a0784a", fontSize:20, padding:"2px 8px" }}>‹</button>
                  <span style={{ fontWeight:600, fontSize:15 }}>{MONTHS[calDate.getMonth()]} {calDate.getFullYear()}</span>
                  <button className="btn" onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth()+1))} style={{ background:"none", color:"#a0784a", fontSize:20, padding:"2px 8px" }}>›</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", textAlign:"center", marginBottom:6 }}>
                  {DAYS.map(d => <div key={d} style={{ fontFamily:"'Lato',sans-serif", fontSize:11, fontWeight:700, color:"#a0784a", padding:"4px 0" }}>{d}</div>)}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
                  {calCells.map((day,i) => { const ds=dateStr(day); const hasL=day&&lessons.some(l=>l.date===ds); const isSel=ds===selectedDay; const isToday=ds===today;
                    return <div key={i} className={`cal-cell${isSel?" selected":""}${hasL?" has-lessons":""}${isToday&&!isSel?" today-cell":""}`} style={{ color:!day?"transparent":undefined }} onClick={()=>day&&setSelectedDay(ds)}>{day||""}</div>; })}
                </div>
              </div>
              <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:10 }}>
                {[["This Month",`${thisMonthLessons.length} lessons`,"#a0784a"],["Outstanding",`$${outstanding} owed`,"#c8945a"],["Total Collected",`$${totalRevenue} received`,"#4a7c59"]].map(([l,v,c]) => (
                  <div key={l} className="stat-card"><div className="label">{l}</div><div style={{ fontSize:22, fontWeight:700, color:c, fontFamily:"'Lato',sans-serif" }}>{v}</div></div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <div>
                  <div style={{ fontSize:20, fontWeight:700 }}>{fmt(selectedDay)}</div>
                  <div style={{ fontFamily:"'Lato',sans-serif", fontSize:13, color:"#8a6a4a" }}>{dayLessons.length} lesson{dayLessons.length!==1?"s":""} scheduled</div>
                </div>
                <button className="btn" onClick={() => { setModal("addLesson"); setForm({ date:selectedDay }); }} style={{ background:"#a0784a", color:"white", padding:"8px 16px", fontSize:13 }}>+ Add</button>
              </div>
              {dayLessons.length===0 ? (
                <div className="card" style={{ padding:48, textAlign:"center" }}>
                  <div style={{ fontSize:44, marginBottom:12 }}>🌾</div>
                  <div style={{ fontFamily:"'Lato',sans-serif", color:"#8a6a4a", fontSize:15 }}>No lessons on this day. Enjoy the pasture!</div>
                </div>
              ) : dayLessons.map(l => { const rider=getRider(l.riderId); const horse=getHorse(l.horseId); if(!rider||!horse) return null;
                return (
                  <div key={l.id} className="lesson-row" style={{ borderLeftColor:statusColor(l.status) }} onClick={() => { setSelectedLesson(l); setTempNotes(l.notes||""); setEditingNotes(false); setModal("lessonDetail"); }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
                      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                        <div className="rider-avatar" style={{ background:`linear-gradient(135deg,${horse.color},${horse.color}88)`, width:42, height:42, fontSize:16 }}>{rider.name.charAt(0)}</div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:16 }}>{rider.name}</div>
                          <div style={{ fontFamily:"'Lato',sans-serif", fontSize:13, color:"#7a5c3a", marginTop:2 }}>🕐 {l.time} &nbsp;·&nbsp; 🐴 {horse.name} &nbsp;·&nbsp; 👤 {l.instructor}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                        <span className="badge" style={{ background:`${statusColor(l.status)}22`, color:statusColor(l.status) }}>{l.status}</span>
                        <span className="badge" style={{ background:l.paid?"#4a7c5922":"#c8945a22", color:l.paid?"#4a7c59":"#9e5a3a" }}>{l.paid?"Paid":"Unpaid"}</span>
                        <span style={{ fontFamily:"'Lato',sans-serif", fontWeight:700, fontSize:15 }}>${l.price}</span>
                      </div>
                    </div>
                    <div style={{ marginTop:8 }}><span className="horse-chip" style={{ background:`${horse.color}22`, color:horse.color==="#2c2c2c"?"#555":horse.color }}>🐎 {l.type}</span></div>
                    {l.notes ? <div className="notes-box" onClick={e=>e.stopPropagation()}>{l.notes}</div>
                      : <div style={{ fontFamily:"'Lato',sans-serif", fontSize:12, color:"#b0907a", fontStyle:"italic", marginTop:8 }}>📝 Click to add notes</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RIDERS */}
        {tab === "riders" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontSize:22, fontWeight:700 }}>Riders</div>
              <button className="btn" onClick={() => openAdd("rider")} style={{ background:"#a0784a", color:"white", padding:"9px 18px", fontSize:13 }}>+ Add Rider</button>
            </div>
            <div className="riders-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:18 }}>
              {riders.map(r => { const rL=lessons.filter(l=>l.riderId===r.id); const upcoming=rL.filter(l=>l.status==="Scheduled").length; const completed=rL.filter(l=>l.status==="Completed").length; const recentNote=rL.filter(l=>l.status==="Completed"&&l.notes).slice(-1)[0]?.notes; const avatarColors=["#a0784a","#4a7c59","#2c6fa8","#9e5a3a"]; const ac=avatarColors[riders.indexOf(r)%4];
                return (
                  <div key={r.id} className="card" style={{ padding:22 }}>
                    <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:16 }}>
                      <div className="rider-avatar" style={{ background:`linear-gradient(135deg,${ac},${ac}99)`, width:52, height:52, fontSize:20 }}>{r.name.charAt(0)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:17 }}>{r.name}</div>
                        <div style={{ fontFamily:"'Lato',sans-serif", fontSize:13, color:"#8a6a4a" }}>Age {r.age} &nbsp;·&nbsp; {r.level}</div>
                      </div>
                      <button className="btn" onClick={() => openEdit("rider",r)} style={{ background:"#e8d8bc", color:"#5a3a1a", padding:"5px 10px", fontSize:12 }}>✏️ Edit</button>
                    </div>
                    <div style={{ fontFamily:"'Lato',sans-serif", fontSize:13, color:"#7a5c3a", marginBottom:14 }}>📞 {r.phone||"—"}<br/>✉️ {r.email||"—"}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                      {[["Upcoming",upcoming,"#4a7c59"],["Completed",completed,"#2c6fa8"],["Balance",`$${Math.abs(r.balance||0)}`,r.balance<0?"#c8945a":"#4a7c59"]].map(([label,val,color])=>(
                        <div key={label} style={{ background:`${color}12`, borderRadius:8, padding:8, textAlign:"center" }}>
                          <div style={{ fontFamily:"'Lato',sans-serif", fontSize:18, fontWeight:700, color }}>{val}</div>
                          <div style={{ fontFamily:"'Lato',sans-serif", fontSize:10, color:"#8a6a4a", textTransform:"uppercase", letterSpacing:0.5 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    {recentNote && <div className="notes-box" style={{ marginBottom:12 }}><div style={{ fontSize:11, fontWeight:700, color:"#a0784a", marginBottom:4, fontStyle:"normal" }}>LATEST NOTE</div>{recentNote.slice(0,100)}{recentNote.length>100?"…":""}</div>}
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <button className="ai-action-btn" onClick={()=>summarizeRider(r)}>📊 Progress</button>
                      <button className="ai-action-btn" onClick={()=>suggestLessonPlan(r)}>📋 Lesson Plan</button>
                    </div>
                    {r.balance<0&&<div style={{ background:"#c8945a18", border:"1px solid #c8945a44", borderRadius:7, padding:"8px 12px", fontFamily:"'Lato',sans-serif", fontSize:12, color:"#9e5a3a", marginTop:10 }}>⚠️ Owes ${Math.abs(r.balance)} — payment outstanding</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PAYMENTS */}
        {tab === "payments" && (
          <div>
            <div style={{ fontSize:22, fontWeight:700, marginBottom:20 }}>Payments & Ledger</div>
            <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:28 }}>
              {[["Total Collected",`$${totalRevenue}`,"#4a7c59"],["Outstanding",`$${outstanding}`,"#c8945a"],["This Month",`${thisMonthLessons.length} lessons`,"#2c6fa8"]].map(([l,v,c])=>(
                <div key={l} className="stat-card" style={{ borderLeft:`4px solid ${c}` }}><div className="label">{l}</div><div style={{ fontSize:26, fontWeight:700, color:c }}>{v}</div></div>
              ))}
            </div>
            <div className="payments-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:16, marginBottom:14 }}>Payment History</div>
                {payments.length===0&&<div style={{ fontFamily:"'Lato',sans-serif", color:"#8a6a4a" }}>No payments recorded yet.</div>}
                {[...payments].reverse().map(p=>{ const rider=getRider(p.riderId); if(!rider) return null;
                  return <div key={p.id} style={{ background:"#fff8ef", borderRadius:10, padding:"14px 16px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 1px 5px rgba(80,50,20,0.08)" }}><div><div style={{ fontWeight:600, fontSize:14 }}>{rider.name}</div><div style={{ fontFamily:"'Lato',sans-serif", fontSize:12, color:"#8a6a4a", marginTop:2 }}>{p.date} · {p.method} · {p.note}</div></div><div style={{ fontFamily:"'Lato',sans-serif", fontWeight:700, fontSize:16, color:"#4a7c59" }}>+${p.amount}</div></div>;
                })}
              </div>
              <div>
                <div style={{ fontWeight:600, fontSize:16, marginBottom:14 }}>Unpaid Completed Lessons</div>
                {lessons.filter(l=>!l.paid&&l.status==="Completed").length===0&&<div style={{ fontFamily:"'Lato',sans-serif", color:"#4a7c59", fontSize:14 }}>✓ All completed lessons are paid!</div>}
                {lessons.filter(l=>!l.paid&&l.status==="Completed").map(l=>{ const rider=getRider(l.riderId); if(!rider) return null;
                  return <div key={l.id} style={{ background:"#fff8ef", borderRadius:10, padding:"14px 16px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center", border:"1px solid #e8d4b0" }}><div><div style={{ fontWeight:600, fontSize:14 }}>{rider.name}</div><div style={{ fontFamily:"'Lato',sans-serif", fontSize:12, color:"#8a6a4a", marginTop:2 }}>{fmt(l.date)} · {l.type}</div></div><div style={{ display:"flex", gap:8, alignItems:"center" }}><span style={{ fontFamily:"'Lato',sans-serif", fontWeight:700, fontSize:15, color:"#c8945a" }}>${l.price}</span><button className="btn" onClick={()=>{ setModal("payment"); setForm({ lesson:l, method:"Cash" }); }} style={{ background:"#a0784a", color:"white", padding:"5px 12px", fontSize:12 }}>Pay</button></div></div>;
                })}
              </div>
            </div>
          </div>
        )}

        {/* AI */}
        {tab === "ai" && (
          <div className="desktop-grid" style={{ display:"grid", gridTemplateColumns:"1fr 260px", gap:24 }}>
            <div className="card" style={{ display:"flex", flexDirection:"column", height:"600px" }}>
              <div style={{ padding:"18px 20px", borderBottom:"1px solid #e8d4b0" }}>
                <div style={{ fontWeight:700, fontSize:18 }}>✨ AI Assistant</div>
                <div style={{ fontFamily:"'Lato',sans-serif", fontSize:13, color:"#8a6a4a", marginTop:2 }}>Powered by Claude · Ask anything about your riders or riding</div>
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
                {chatMessages.map((m,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                    <div className={`chat-bubble ${m.role}`}>{m.content}</div>
                  </div>
                ))}
                {chatLoading&&<div style={{ display:"flex" }}><div className="chat-bubble assistant" style={{ padding:"14px 18px" }}><span className="typing-dot"></span><span className="typing-dot"></span><span className="typing-dot"></span></div></div>}
                <div ref={chatEndRef}/>
              </div>
              <div style={{ padding:"16px 20px", borderTop:"1px solid #e8d4b0", display:"flex", gap:10 }}>
                <input className="input" placeholder="Ask about lesson plans, rider progress, riding techniques…" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} />
                <button className="btn" onClick={sendChat} disabled={chatLoading} style={{ background:chatLoading?"#c8a878":"#a0784a", color:"white", padding:"9px 18px", whiteSpace:"nowrap" }}>Send ↑</button>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div className="card" style={{ padding:18 }}>
                <div style={{ fontWeight:600, fontSize:15, marginBottom:12 }}>Quick Actions</div>
                {riders.map(r=>(
                  <div key={r.id} style={{ background:"#f5ede0", borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
                    <div style={{ fontFamily:"'Lato',sans-serif", fontWeight:700, fontSize:13, marginBottom:6 }}>{r.name}</div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button className="ai-action-btn" style={{ fontSize:11, padding:"5px 10px" }} onClick={()=>summarizeRider(r)}>📊 Progress</button>
                      <button className="ai-action-btn" style={{ fontSize:11, padding:"5px 10px" }} onClick={()=>suggestLessonPlan(r)}>📋 Plan</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding:18 }}>
                <div style={{ fontWeight:600, fontSize:15, marginBottom:10 }}>Suggested Questions</div>
                {["What exercises help beginners learn to post trot?","How do I teach a rider to canter for the first time?","What are good warm-up exercises for horses?","How should I structure a 60 minute group lesson?"].map(q=>(
                  <div key={q} onClick={()=>setChatInput(q)} style={{ fontFamily:"'Lato',sans-serif", fontSize:12, color:"#7a5c3a", padding:"7px 0", borderBottom:"1px solid #e8d4b0", cursor:"pointer", lineHeight:1.4 }}
                    onMouseEnter={e=>e.currentTarget.style.color="#a0784a"} onMouseLeave={e=>e.currentTarget.style.color="#7a5c3a"}>{q}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div>
            <div style={{ fontSize:22, fontWeight:700, marginBottom:24 }}>⚙️ Settings</div>
            <div className="settings-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
              {[
                ["🐴 Horses", horses, "horse", h => <><div style={{ width:20, height:20, borderRadius:"50%", background:h.color, border:"2px solid white", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", flexShrink:0 }}/><div><div style={{ fontFamily:"'Lato',sans-serif", fontWeight:700, fontSize:14 }}>{h.name}</div><div style={{ fontFamily:"'Lato',sans-serif", fontSize:12, color:"#8a6a4a" }}>{h.breed} · Age {h.age}</div></div></>],
                ["👤 Instructors", instructors, "instructor", i => <><div><div style={{ fontFamily:"'Lato',sans-serif", fontWeight:700, fontSize:14 }}>{i.name}</div>{i.phone&&<div style={{ fontFamily:"'Lato',sans-serif", fontSize:12, color:"#8a6a4a" }}>{i.phone}</div>}</div></>],
                ["📋 Lesson Types", lessonTypes, "lessonType", t => <><div><div style={{ fontFamily:"'Lato',sans-serif", fontWeight:700, fontSize:14 }}>{t.name}</div><div style={{ fontFamily:"'Lato',sans-serif", fontSize:12, color:"#8a6a4a" }}>{t.duration} min · ${t.price}</div></div></>],
                ["🧑 Riders", riders, "rider", r => <><div><div style={{ fontFamily:"'Lato',sans-serif", fontWeight:700, fontSize:14 }}>{r.name}</div><div style={{ fontFamily:"'Lato',sans-serif", fontSize:12, color:"#8a6a4a" }}>{r.level} · Age {r.age}</div></div></>],
              ].map(([title, items, type, renderItem]) => (
                <div key={type} className="card" style={{ padding:22 }}>
                  <div className="section-header">
                    <div style={{ fontWeight:600, fontSize:17 }}>{title}</div>
                    <button className="btn" onClick={()=>openAdd(type)} style={{ background:"#a0784a", color:"white", padding:"6px 14px", fontSize:12 }}>+ Add</button>
                  </div>
                  {items.map(item=>(
                    <div key={item.id} className="edit-row">
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>{renderItem(item)}</div>
                      <button className="btn" onClick={()=>openEdit(type,item)} style={{ background:"#e8d8bc", color:"#5a3a1a", padding:"5px 10px", fontSize:12, flexShrink:0 }}>✏️ Edit</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LESSON DETAIL MODAL */}
      {modal==="lessonDetail"&&selectedLesson&&(()=>{ const l=selectedLesson; const rider=getRider(l.riderId); const horse=getHorse(l.horseId);
        return (
          <div className="modal-bg" onClick={()=>{ setModal(null); setEditingNotes(false); }}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div><div style={{ fontWeight:700, fontSize:20 }}>{rider?.name}</div><div style={{ fontFamily:"'Lato',sans-serif", fontSize:13, color:"#8a6a4a", marginTop:3 }}>{fmt(l.date)} at {l.time} · {l.type}</div></div>
                <button className="btn" onClick={()=>setModal(null)} style={{ background:"none", fontSize:22, color:"#a0784a", padding:"0 4px" }}>×</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                {[["Horse",`🐴 ${horse?.name}`],["Instructor",`👤 ${l.instructor}`],["Status",l.status],["Payment",l.paid?"✓ Paid":"Unpaid"]].map(([k,v])=>(
                  <div key={k} style={{ background:"#f5ede0", borderRadius:8, padding:"10px 14px" }}><div className="label">{k}</div><div style={{ fontFamily:"'Lato',sans-serif", fontWeight:700, fontSize:14 }}>{v}</div></div>
                ))}
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div className="label">Lesson Notes</div>
                  <div style={{ display:"flex", gap:6 }}>
                    {!editingNotes&&<><button className="ai-action-btn" style={{ fontSize:11 }} disabled={aiLoading} onClick={()=>generateNotes(l)}>{aiLoading?"Generating…":"✨ AI Generate"}</button><button className="btn" onClick={()=>{ setTempNotes(l.notes||""); setEditingNotes(true); }} style={{ background:"#e8d8bc", color:"#5a3a1a", padding:"5px 12px", fontSize:12 }}>✏️ Edit</button></>}
                    {editingNotes&&<><button className="btn" onClick={saveNotes} style={{ background:"#4a7c59", color:"white", padding:"5px 12px", fontSize:12 }}>✓ Save</button><button className="btn" onClick={()=>setEditingNotes(false)} style={{ background:"#e8d8bc", color:"#5a3a1a", padding:"5px 12px", fontSize:12 }}>Cancel</button></>}
                  </div>
                </div>
                {editingNotes?<textarea className="textarea" value={tempNotes} onChange={e=>setTempNotes(e.target.value)} placeholder="Write lesson notes here…"/>
                  :l.notes?<div className="notes-box">{l.notes}</div>
                  :<div style={{ fontFamily:"'Lato',sans-serif", fontSize:13, color:"#b0907a", fontStyle:"italic", padding:"10px 0" }}>No notes yet. Click Edit or use ✨ AI Generate.</div>}
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {l.status==="Scheduled"&&<><button className="btn" onClick={()=>completeLesson(l)} style={{ background:"#4a7c5920", color:"#4a7c59", padding:"8px 14px", fontSize:13 }}>✓ Complete</button><button className="btn" onClick={()=>cancelLesson(l)} style={{ background:"#9e5a3a20", color:"#9e5a3a", padding:"8px 14px", fontSize:13 }}>✕ Cancel</button></>}
                {!l.paid&&l.status!=="Cancelled"&&<button className="btn" onClick={()=>{ setModal("payment"); setForm({ lesson:l, method:"Cash" }); }} style={{ background:"#a0784a", color:"white", padding:"8px 14px", fontSize:13 }}>💰 Record Payment</button>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* EDIT/ADD MODAL */}
      {modal==="edit"&&editTarget&&(
        <div className="modal-bg" onClick={()=>{ setModal(null); setForm({}); setEditTarget(null); }}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:20 }}>{editTitle()}</div>
              <button className="btn" onClick={()=>{ setModal(null); setForm({}); setEditTarget(null); }} style={{ background:"none", fontSize:22, color:"#a0784a", padding:"0 4px" }}>×</button>
            </div>
            {editFields().map(([label,key,type,extra])=>(
              <div key={key} style={{ marginBottom:14 }}>
                <div className="label">{label}</div>
                {type==="select"?<select className="input" value={form[key]||""} onChange={e=>setForm({...form,[key]:e.target.value})}>{extra.map(o=><option key={o}>{o}</option>)}</select>
                  :type==="color"?<div><div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:8 }}>{HORSE_COLORS.map(c=><div key={c} className={`color-swatch${form.color===c?" selected":""}`} style={{ background:c }} onClick={()=>setForm({...form,color:c})}/>)}</div><input className="input" type="text" value={form[key]||""} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder="#hexcode" style={{ marginTop:4 }}/></div>
                  :<input className="input" type={type} placeholder={extra} value={form[key]||""} onChange={e=>setForm({...form,[key]:e.target.value})}/>}
              </div>
            ))}
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button className="btn" onClick={saveEdit} style={{ flex:1, background:"#a0784a", color:"white", padding:"12px" }}>{editTarget.isNew?"Add":"Save Changes"}</button>
              {!editTarget.isNew&&<button className="btn" onClick={()=>{ if(window.confirm("Are you sure?")) deleteItem(editTarget.type, form.id); }} style={{ background:"#9e5a3a22", color:"#9e5a3a", padding:"12px 16px" }}>🗑 Delete</button>}
              <button className="btn" onClick={()=>{ setModal(null); setForm({}); setEditTarget(null); }} style={{ background:"#e8d8bc", color:"#5a3a1a", padding:"12px 16px" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD LESSON MODAL */}
      {modal==="addLesson"&&(
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:700, fontSize:20, marginBottom:20 }}>🗓 Schedule a Lesson</div>
            {[
              ["Rider",<select className="input" value={form.riderId||""} onChange={e=>setForm({...form,riderId:e.target.value})}><option value="">Select rider...</option>{riders.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>],
              ["Horse",<select className="input" value={form.horseId||""} onChange={e=>setForm({...form,horseId:e.target.value})}><option value="">Select horse...</option>{horses.map(h=><option key={h.id} value={h.id}>{h.name} ({h.breed})</option>)}</select>],
              ["Instructor",<select className="input" value={form.instructor||""} onChange={e=>setForm({...form,instructor:e.target.value})}><option value="">Select instructor...</option>{instructors.map(i=><option key={i.id} value={i.name}>{i.name}</option>)}</select>],
              ["Lesson Type",<select className="input" value={form.type||""} onChange={e=>setForm({...form,type:e.target.value})}><option value="">Select type...</option>{lessonTypes.map(t=><option key={t.id} value={t.name}>{t.name} — ${t.price}</option>)}</select>],
              ["Date",<input className="input" type="date" value={form.date||""} onChange={e=>setForm({...form,date:e.target.value})}/>],
              ["Time",<input className="input" type="time" value={form.time||""} onChange={e=>setForm({...form,time:e.target.value})}/>],
            ].map(([label,input])=>(
              <div key={label} style={{ marginBottom:14 }}><div className="label">{label}</div>{input}</div>
            ))}
            <div style={{ marginBottom:14 }}><div className="label">Notes (optional)</div><textarea className="textarea" style={{ minHeight:70 }} placeholder="Any notes…" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
            <div style={{ display:"flex", gap:10, marginTop:10 }}>
              <button className="btn" onClick={handleAddLesson} style={{ flex:1, background:"#a0784a", color:"white", padding:"12px" }}>Schedule Lesson</button>
              <button className="btn" onClick={()=>setModal(null)} style={{ background:"#e8d8bc", color:"#5a3a1a", padding:"12px 18px" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {modal==="payment"&&form.lesson&&(
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:700, fontSize:20, marginBottom:8 }}>💰 Record Payment</div>
            <div style={{ fontFamily:"'Lato',sans-serif", fontSize:14, color:"#7a5c3a", marginBottom:20 }}>{getRider(form.lesson.riderId)?.name} · {fmt(form.lesson.date)} · {form.lesson.type}</div>
            <div style={{ background:"#a0784a18", borderRadius:10, padding:16, marginBottom:20, textAlign:"center" }}>
              <div style={{ fontFamily:"'Lato',sans-serif", fontSize:13, color:"#7a5c3a" }}>Amount Due</div>
              <div style={{ fontSize:36, fontWeight:700, color:"#a0784a" }}>${form.lesson.price}</div>
            </div>
            <div style={{ marginBottom:14 }}><div className="label">Payment Method</div><select className="input" value={form.method||"Cash"} onChange={e=>setForm({...form,method:e.target.value})}>{["Cash","Card","Venmo","Zelle","Check"].map(m=><option key={m}>{m}</option>)}</select></div>
            <div style={{ display:"flex", gap:10, marginTop:22 }}>
              <button className="btn" onClick={()=>handlePayment(form.lesson)} style={{ flex:1, background:"#4a7c59", color:"white", padding:"12px" }}>✓ Confirm Payment</button>
              <button className="btn" onClick={()=>setModal(null)} style={{ background:"#e8d8bc", color:"#5a3a1a", padding:"12px 18px" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div className="toast" style={{ background:toast.type==="error"?"#9e5a3a":"#4a7c59", color:"white" }}>{toast.type==="error"?"⚠️":"✓"} {toast.msg}</div>}
    </div>
  );
}
