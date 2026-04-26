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
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  Lock, CheckCircle, ChevronLeft, LogOut, LayoutDashboard, FileSpreadsheet 
} from 'lucide-react';

// --- IMPORTANT: REPLACE THESE WITH YOUR ACTUAL FIREBASE KEYS ---
const firebaseConfig ={
  apiKey: "AIzaSyDMusdWzcFx8ivo-0sxVchFmlcv2Zs0yEc",
  authDomain: "connect-407ab.firebaseapp.com",
  projectId: "connect-407ab",
  storageBucket: "connect-407ab.firebasestorage.app",
  messagingSenderId: "963977780259",
  appId: "1:963977780259:web:73859adb021393f281a596",
  measurementId: "G-3T1TGFMWG8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Utilities ---
const downloadCSV = (data) => {
  if (data.length === 0) return;
  const headers = ["Reg Code", "Full Name", "Email", "Denomination", "Gender", "Tribe", "Expectations", "Date"];
  const csvRows = [headers.join(",")];
  data.forEach(p => {
    const date = p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleString() : 'N/A';
    const row = [
      p.code, 
      `"${p.fullName}"`, 
      p.email, 
      `"${p.denomination}"`, 
      p.gender, 
      p.tribe, 
      `"${(p.expectations || '').replace(/"/g, '""')}"`, 
      `"${date}"` 
    ];
    csvRows.push(row.join(","));
  });
  const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `MWR_Participants.csv`);
  a.click();
};

const generateTribe = () => {
  // Configured to exactly 5 tribes
  const tribes = ['Faith', 'Hope', 'Love', 'Grace', 'Mercy']; 
  return tribes[Math.floor(Math.random() * tribes.length)];
};

// --- Components ---

const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'MWR2026Admin') onLogin();
    else setError('Invalid password');
  };
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
        <Lock className="text-slate-900 mx-auto mb-4" size={48} />
        <h2 className="text-2xl font-bold mb-8">Admin Access</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-slate-900" placeholder="Enter Admin Password" required />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold transition-all hover:bg-slate-800">Access Dashboard</button>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = ({ participants, settings, toggleReg, onLogout }) => (
  <div className="min-h-screen bg-slate-50">
    <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
      <h1 className="text-xl font-bold flex items-center gap-2"><LayoutDashboard /> MWR Admin</h1>
      <div className="flex gap-4">
        <button onClick={() => downloadCSV(participants)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-bold"><FileSpreadsheet size={16}/> Download CSV</button>
        <button onClick={onLogout} className="text-slate-500 hover:text-red-500 transition-colors"><LogOut size={20} /></button>
      </div>
    </nav>
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-slate-500 text-sm font-medium">Total Registered</p>
          <h3 className="text-3xl font-bold">{participants.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border flex justify-between items-center">
          <p className="font-bold">Registration Portal</p>
          <button onClick={toggleReg} className={`px-4 py-2 rounded-lg text-sm font-bold ${settings.isOpen ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {settings.isOpen ? 'Close Portal' : 'Open Portal'}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Tribe</th>
              <th className="px-6 py-4">Gender</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...participants].sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map(p => (
              <tr key={p.id} className="text-sm hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-indigo-600">{p.code}</td>
                <td className="px-6 py-4 font-medium">{p.fullName}</td>
                <td className="px-6 py-4 uppercase font-bold text-slate-400">{p.tribe}</td>
                <td className="px-6 py-4">{p.gender}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  </div>
);

export default function App() {
  const [view, setView] = useState('register');
  const [participants, setParticipants] = useState([]);
  const [settings, setSettings] = useState({ isOpen: true });
  const [currentReg, setCurrentReg] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', denomination: 'MFM', gender: 'Male', expectations: '' });

  useEffect(() => {
    // Only attempt auth if the user has replaced the default key
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
      signInAnonymously(auth).catch(err => console.error("Firebase Auth Error:", err));
    }

    const unsubP = onSnapshot(collection(db, 'participants'), (s) => {
      setParticipants(s.docs.map(d => ({id: d.id, ...d.data()})));
    }, (err) => console.error("Firestore Participants Error:", err));

    const unsubS = onSnapshot(doc(db, 'settings', 'global'), (s) => {
      if (s.exists()) setSettings(s.data());
    }, (err) => console.error("Firestore Settings Error:", err));

    return () => { unsubP(); unsubS(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
      alert("Please update your Firebase Configuration in App.jsx first!");
      return;
    }

    const tribe = generateTribe();
    const code = `MWR-2026-${(participants.length + 1).toString().padStart(4, '0')}`;
    const data = { ...formData, tribe, code, createdAt: serverTimestamp() };
    
    try {
      await addDoc(collection(db, 'participants'), data);
      setCurrentReg(data);
      setView('success');
    } catch (err) { 
      console.error(err);
      alert("Registration failed. Please check your Firebase Database rules (ensure Test Mode is active)."); 
    }
  };

  if (view === 'admin-login') return <AdminLogin onLogin={() => setView('admin-dash')} />;
  if (view === 'admin-dash') return <AdminDashboard participants={participants} settings={settings} toggleReg={() => updateDoc(doc(db, 'settings', 'global'), {isOpen: !settings.isOpen})} onLogout={() => setView('register')} />;

  if (view === 'success') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-900">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 md:p-12 border text-center">
        <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
        <h1 className="text-3xl font-bold mb-6">Registration Successful</h1>
        <div className="grid grid-cols-2 gap-4 mb-6 text-left">
          <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs font-bold text-slate-400 uppercase">Participant</p><p className="font-bold">{currentReg?.fullName}</p></div>
          <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs font-bold text-slate-400 uppercase">Code</p><p className="font-bold font-mono">{currentReg?.code}</p></div>
        </div>
        <div className="bg-indigo-600 p-6 rounded-xl mb-8 text-left text-white shadow-lg">
          <p className="text-xs font-bold text-indigo-200 uppercase mb-1">Tribe Assigned</p>
          <p className="text-3xl font-black italic">{currentReg?.tribe}</p>
        </div>
        <button onClick={() => setView('register')} className="text-slate-500 flex items-center gap-2 font-bold mx-auto hover:text-slate-800 transition-colors"><ChevronLeft size={18} /> New Registration</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 text-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2 text-left">Ministers and Workers Retreat</h1>
          <p className="text-slate-500 italic text-lg text-left">"But they that wait upon the Lord shall renew their strength..."</p>
        </div>
        
        <div className="bg-white rounded-3xl border shadow-sm p-8 md:p-10">
          <h2 className="text-2xl font-bold mb-8 text-slate-800 border-b pb-4 text-left">Registration Form</h2>
          {!settings.isOpen ? (
            <div className="p-12 bg-red-50 rounded-2xl text-center">
              <p className="text-red-600 font-extrabold text-lg">Registration is currently closed.</p>
              <p className="text-red-400 text-sm mt-2">Please check back later or contact your department head.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-left">
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input required placeholder="Enter your full name" className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 transition-all" onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div className="text-left">
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input required type="email" placeholder="example@email.com" className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 transition-all" onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Denomination</label>
                  <select required className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer" value={formData.denomination} onChange={e => setFormData({...formData, denomination: e.target.value})}>
                     <option value="MFM">Mountain of Fire and Miracles Ministries</option>
                     <option value="RCCG">RCCG</option>
                     <option value="Winners">Winners Chapel</option>
                     <option value="Deeper Life">Deeper Life</option>
                     <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
                  <select required className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                     <option value="Male">Male</option>
                     <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="text-left">
                <label className="block text-sm font-bold text-slate-700 mb-2">Spiritual Expectations</label>
                <textarea required placeholder="What are your goals for this year's retreat?" className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-slate-900 transition-all" rows="4" onChange={e => setFormData({...formData, expectations: e.target.value})}></textarea>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 text-lg">Complete Registration</button>
            </form>
          )}
        </div>
        <button onClick={() => setView('admin-login')} className="mt-16 text-slate-300 text-xs block mx-auto hover:text-slate-600 transition-colors uppercase tracking-widest font-bold">Administrator Login</button>
      </div>
    </div>
  );
}
