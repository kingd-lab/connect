import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  CheckCircle, 
  ChevronLeft, 
  LogOut, 
  LayoutDashboard,
  Download,
  Lock
} from 'lucide-react';

// --- ACTION REQUIRED ---
// Paste your actual 'apiKey' and 'messagingSenderId' from your Firebase Console below
const firebaseConfig = {
  apiKey:"AIzaSyBJqLqX6q7rqC1Gm_-trY0fXV7Bhb2mE_k", 
  authDomain: "connect-c39b2.firebaseapp.com",
  projectId: "connect-c39b2",
  storageBucket: "connect-c39b2.appspot.com",
  messagingSenderId: "1023532898264", 
  appId: "1:1023532898264:web:654b9d5c31761660f9e1a3" 
};

const isConfigValid = firebaseConfig.apiKey && firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_API_KEY";

let app, auth, db;
if (isConfigValid) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

const getQRCodeUrl = (code) => `https://chart.googleapis.com/chart?cht=qr&chl=${code}&chs=180x180&choe=UTF-8&chld=L|2`;

const AdminDashboard = ({ participants, settings, toggleReg, onLogout }) => {
  const downloadCSV = () => {
    if (participants.length === 0) return;
    const headers = ["Code", "Full Name", "Email", "Tribe", "Date"];
    const rows = participants.map(p => [
      p.code,
      p.fullName,
      p.email,
      p.tribe,
      p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString() : ""
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "MWR_Participants.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold flex items-center gap-2 text-slate-900"><LayoutDashboard size={20} /> Admin Panel</h1>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={onLogout} className="text-slate-400 hover:text-red-500 p-2 transition-colors"><LogOut size={20} /></button>
        </div>
      </nav>
      <main className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Total Registered</p>
            <h3 className="text-4xl font-black text-indigo-600">{participants.length}</h3>
          </div>
          <div className="bg-white p-6 rounded-xl border shadow-sm flex justify-between items-center">
            <p className="font-bold">Portal: <span className={settings.isOpen ? 'text-green-500' : 'text-red-500'}>{settings.isOpen ? 'OPEN' : 'CLOSED'}</span></p>
            <button onClick={toggleReg} className="bg-slate-100 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-200">Switch Status</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
              <tr><th className="p-4">Code</th><th className="p-4">Name</th><th className="p-4">Tribe</th></tr>
            </thead>
            <tbody className="divide-y">
              {participants.map(p => (
                <tr key={p.id} className="text-sm hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-indigo-600">{p.code}</td>
                  <td className="p-4 font-bold">{p.fullName}</td>
                  <td className="p-4 uppercase text-slate-400 font-bold">{p.tribe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('register');
  const [participants, setParticipants] = useState([]);
  const [settings, setSettings] = useState({ isOpen: true });
  const [currentReg, setCurrentReg] = useState(null);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', email: '' });

  useEffect(() => {
    if (!isConfigValid) return;
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const unsubP = onSnapshot(collection(db, 'participants'), (s) => setParticipants(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubS = onSnapshot(doc(db, 'settings', 'global'), (s) => s.exists() && setSettings(s.data()));
    return () => { unsubP(); unsubS(); };
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tribes = ['Faith', 'Hope', 'Love', 'Grace', 'Mercy'];
    const tribe = tribes[Math.floor(Math.random() * tribes.length)];
    const code = `MWR-${(participants.length + 1).toString().padStart(4, '0')}`;
    const data = { ...formData, tribe, code, createdAt: serverTimestamp() };
    try {
      await addDoc(collection(db, 'participants'), data);
      setCurrentReg(data);
      setView('success');
    } catch (err) { alert("Network Error. Check your connection."); }
  };

  if (!isConfigValid) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-3xl border shadow-sm max-w-sm">
        <Lock className="mx-auto text-red-500 mb-4" />
        <p className="font-bold uppercase tracking-tight">Configuration Required</p>
        <p className="text-sm text-slate-500 mt-2 italic">Please paste your API Key in App.jsx code block.</p>
      </div>
    </div>
  );

  if (view === 'admin-dash') return <AdminDashboard participants={participants} settings={settings} toggleReg={() => updateDoc(doc(db, 'settings', 'global'), {isOpen: !settings.isOpen})} onLogout={() => setView('register')} />;

  if (view === 'success') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border-t-8 border-indigo-600">
        <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
        <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">Registered!</h2>
        <div className="bg-slate-50 p-6 rounded-2xl mb-6 border">
          <p className="text-3xl font-mono font-black mb-4">{currentReg?.code}</p>
          <p className="text-indigo-600 font-black text-4xl italic uppercase tracking-tight">{currentReg?.tribe}</p>
          <div className="mt-4 flex justify-center bg-white p-2 rounded-xl inline-block shadow-sm">
            <img src={getQRCodeUrl(currentReg?.code)} className="w-32 h-32" alt="QR" />
          </div>
        </div>
        <button onClick={() => setView('register')} className="text-slate-400 font-bold flex items-center gap-2 mx-auto hover:text-slate-900 transition-colors"><ChevronLeft size={16}/> New Entry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-20 px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-black tracking-tighter italic mb-2 text-slate-900">CONNECT</h1>
        <p className="text-slate-400 mb-12 uppercase text-[10px] font-bold tracking-widest italic">Ministers and Workers 2026</p>
        {!settings.isOpen ? (
          <div className="p-12 bg-red-50 text-red-600 font-bold rounded-3xl border border-red-100 italic">Registration Closed</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 font-medium transition-all" placeholder="Full Name" onChange={e => setFormData({...formData, fullName: e.target.value})} />
            <input required type="email" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 font-medium transition-all" placeholder="Email Address" onChange={e => setFormData({...formData, email: e.target.value})} />
            <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-indigo-600 transition-all">Submit Details</button>
          </form>
        )}
        <button onClick={() => setView('admin-dash')} className="mt-24 text-[10px] text-slate-200 font-bold uppercase tracking-widest hover:text-slate-400 transition-colors">Admin Access</button>
      </div>
    </div>
  );
}
