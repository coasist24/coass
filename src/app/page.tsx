"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, User, LogOut, LayoutGrid, CalendarDays, ChevronDown, ChevronUp, AlertCircle, Bookmark, FolderOpen, Lock, KeyRound, CheckCircle2, Target, Calculator, Send, Search, Trash2, RotateCcw, PlusCircle, FileText, BookOpen, CheckSquare } from "lucide-react";

type Jadwal = {
  "ID Unik": string;
  Tanggal: string;
  Hari: string;
  Modul: string;
  Shift: string;
  "Nama Co-Ass": string;
};

type Praktikan = {
  "Kelompok Besar"?: string;
  "Kelompok Sedang"?: string;
  Kelompok: string | number; 
  NIM: string | number;
  Nama: string;
  isShifting?: boolean; 
};

type NilaiEntry = {
  nim: string | number;
  tp: number;
  tl: number;
  pd: number;
  weighted: number;
};

// =============================================
// KONFIGURASI 
// =============================================
const API_URL = "https://script.google.com/macros/s/AKfycbwpkuTVeY7cg697mbxXM-qv6-fX8KYFdQkeRYSVtQ0Sl1aQs-k5kTSlJzY5MBQqEA66iQ/exec"; 
const SECRET_PASSCODE = "Co-Ass24TheBest";
const RAPORT_LINK = "https://docs.google.com/spreadsheets/d/1PWPIULtFKils_qB2zQhq_D-yrI7GI5bJLtcpa4D5a00/edit?gid=1783490060#gid=1783490060"; 

const GDRIVE_FOLDER_ID: string = "1NKRgEruaIcHDB0XEqm5MarWXqlZivoWd"; 
const PDF_ALUR_ID: string = "ID_FILE_PDF_ALUR"; 
const PDF_MATERI_ID: string = "1YtFPBdy1_KkyfeoUW0Umoy3t1HaeRfDR"; 
const PDF_TP_ID: string = "ID_FILE_PDF_JAWABAN_TP"; 

const COASS_INFO: Record<string, { fullName: string }> = {
  "Hamud": { fullName: "Muhammad Khoirul Hamdillah" },
  "Nisa": { fullName: "Annisa Nurussyfa" },
  "Nadya": { fullName: "Nadya Khaerany S." },
  "Anop": { fullName: "Hervianov Takbir" },
  "Vega": { fullName: "Vega Anggraini" },
  "Hasna": { fullName: "Hasna Rofi'ah" },
  "Nadian": { fullName: "Nadian Rahma Putri" },
  "Najib": { fullName: "Muhammad Najib Ali D." },
  "Nay": { fullName: "Mutia Nayla" },
  "Jeje": { fullName: "Rhoudhotul Jannah Nasuha" },
  "Riyat": { fullName: "M. Riadhusholihin" },
  "Luki": { fullName: "Lucky Imanuel N." },
  "Nanta": { fullName: "Destra Nanta" },
  "Cece": { fullName: "Suci Rahma Dwiyanti" },
};

const ASISTEN_WA: Record<string, string> = {
  "IR": "6287888260908",
  "RD": "6281210725841",
  "SW": "6285697265137",
  "TH": "6281310963871",
  "IL": "6285894410507",
  "AB": "6285210932558",
  "AF": "6289672459800",
  "AN": "62895416478450",
  "AG": "6289510301830",
  "SS": "6285770720665",
  "AM": "6285860303681",
  "CY": "62895332215384",
  "DF": "6289636478286",
  "DA": "6289512910790",
  "ER": "6281381743493",
  "FI": "62895360589238",
  "HA": "6285782809441",
  "IA": "62895344132907",
  "IT": "6289514259017",
  "KF": "6289603998142",
  "MF": "6285890287244",
  "HI": "6289698234875",
  "MR": "6281218200170",
  "NA": "6288291095733",
  "NN": "62881010627198",
  "OS": "6281295085256",
  "RM": "6285710531091",
  "YZ": "6282142546144",
  "ZI": "6281387999357",
};

const MODUL_LIST = ["PA", "MY", "PJK", "RL", "HKM", "VT", "CL"];
// =============================================

export default function Home() {
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [praktikanData, setPraktikanData] = useState<Praktikan[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<"me" | "general" | "files" | "grades">("me");
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [activeFileTab, setActiveFileTab] = useState<"alur" | "materi" | "tp" | "drive">("alur");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [activeStudents, setActiveStudents] = useState<Praktikan[]>([]);
  const [scores, setScores] = useState<Record<string, NilaiEntry>>({});
  
  const [shiftingQuery, setShiftingQuery] = useState("");
  const [shiftingResults, setShiftingResults] = useState<Praktikan[]>([]);
  
  const [waData, setWaData] = useState({
    asisten: "", shift: "Shift 1", modul: "PA", tanggal: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
    
    const savedUnlock = localStorage.getItem("appUnlocked");
    const savedUser = localStorage.getItem("coassName");
    const savedScores = localStorage.getItem("temp_scores");
    
    if (savedUnlock === "true") setIsUnlocked(true);
    if (savedUser) setCurrentUser(savedUser);
    if (savedScores) setScores(JSON.parse(savedScores));
    
    if (savedUnlock === "true" || savedUser) fetchData();
    else setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("temp_scores", JSON.stringify(scores));
  }, [scores]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      setJadwal(json.jadwal || []);
      setPraktikanData(json.praktikan || []);
    } catch (error) {
      console.error("Gagal narik data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput.toUpperCase() === SECRET_PASSCODE.toUpperCase()) {
      localStorage.setItem("appUnlocked", "true");
      setIsUnlocked(true);
      setPasscodeError(false);
      fetchData();
    } else {
      setPasscodeError(true);
      setPasscodeInput("");
    }
  };

  const calculateProgress = (name: string) => {
    const userJadwal = jadwal.filter(j => j["Nama Co-Ass"] === name);
    if (userJadwal.length === 0) return 0;
    const today = new Date().toISOString().split('T')[0];
    const done = userJadwal.filter(j => j.Tanggal < today).length;
    return Math.round((done / userJadwal.length) * 100);
  };

  const handleSearchPraktikan = () => {
    if (!searchQuery.trim()) {
      setActiveStudents([]);
      return;
    }
    const query = searchQuery.toLowerCase().trim();
    const filtered = praktikanData.filter(p => 
      p.Kelompok?.toString().toLowerCase().includes(query) || 
      p["Kelompok Sedang"]?.toString().toLowerCase() === query || 
      p.Nama?.toLowerCase().includes(query) ||
      p.NIM?.toString().toLowerCase().includes(query)
    );
    
    setActiveStudents(filtered);
    if (filtered.length > 0) {
      setSelectedGroup(filtered[0]["Kelompok Sedang"]?.toString() || filtered[0].Kelompok?.toString() || query.toUpperCase());
    }
  };

  const handleSearchShifting = (val: string) => {
    setShiftingQuery(val);
    if (val.length < 3) {
      setShiftingResults([]);
      return;
    }
    const query = val.toLowerCase();
    const res = praktikanData.filter(p => p.Nama?.toLowerCase().includes(query) || p.NIM?.toString().toLowerCase().includes(query)).slice(0, 5);
    setShiftingResults(res);
  };

  const addShiftingStudent = (student: Praktikan) => {
    if (activeStudents.some(s => s.NIM === student.NIM)) return;
    setActiveStudents(prev => [...prev, { ...student, isShifting: true }]);
    setShiftingQuery("");
    setShiftingResults([]);
  };

  const updateScore = (nim: string | number, field: 'tp' | 'tl' | 'pd', val: number) => {
    const strNim = nim.toString();
    const current = scores[strNim] || { nim: strNim, tp: 0, tl: 0, pd: 0, weighted: 0 };
    const next = { ...current, [field]: val };
    next.weighted = (next.tp * 0.05) + (next.tl * 0.25) + (next.pd * 0.20);
    setScores(prev => ({ ...prev, [strNim]: next }));
  };

  const groupedActiveStudents = activeStudents.reduce((acc, curr) => {
    const groupName = curr.isShifting ? `${curr.Kelompok} [SHIFTING]` : (curr.Kelompok?.toString() || "Lainnya");
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(curr);
    return acc;
  }, {} as Record<string, Praktikan[]>);

  const generateWATemplate = () => {
    const coass = COASS_INFO[currentUser || ""]?.fullName || currentUser;
    const hour = new Date().getHours();
    const salam = hour < 11 ? "Pagi" : hour < 15 ? "Siang" : hour < 18 ? "Sore" : "Malam";

    const [year, month, day] = waData.tanggal.split('-');
    const namaBulan = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const formattedTanggal = `${day} ${namaBulan[parseInt(month, 10)]} ${year}`;

    let text = `Assalamu'alaikum, Selamat ${salam}, perkenalkan saya ${coass} selaku Co-Ass yang sedang melakukan magang tahap asistensi pada tanggal ${formattedTanggal} ${waData.shift} Modul [${waData.modul}]. Berikut ini saya lampirkan nilai yang sudah diolah sebelumnya.%0A%0A`;
    
    const sortedGroups = Object.keys(groupedActiveStudents).sort((a, b) => {
      if (a.includes("[SHIFTING]") && !b.includes("[SHIFTING]")) return 1;
      if (!a.includes("[SHIFTING]") && b.includes("[SHIFTING]")) return -1;
      return a.localeCompare(b);
    });

    sortedGroups.forEach(groupName => {
      text += `*Kelompok ${groupName}*%0A`;
      groupedActiveStudents[groupName].forEach(p => {
        const s = scores[p.NIM.toString()] || { tp: 0, tl: 0, pd: 0, weighted: 0 };
        
        // Konversi nilai
        const weightedTp = (s.tp * 0.05).toFixed(2);
        const weightedTl = (s.tl * 0.25).toFixed(2);
        const weightedPd = (s.pd * 0.20).toFixed(2);
        const total = s.weighted.toFixed(2);

        text += `*${p.Nama} (${p.NIM})*%0A [TP: ${weightedTp}]%0A [TL: ${weightedTl}]%0A [PD: ${weightedPd}]%0A *Total: ${total}*%0A%0A`;
      });
      text += `%0A`;
    });
    
    text += `Sebelumnya saya juga izin untuk mengirimkan link raport saya, dan terimakasih banyak atas bantuannya selama tahap asistensi ini. Terimakasihh.%0A%0A[Link Raport]: ${RAPORT_LINK}`;
    
    const phone = ASISTEN_WA[waData.asisten];
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const getShiftTime = (hari: string, shift: string) => {
    const s = shift.replace("Shift ", "");
    const h = hari.toLowerCase();
    if (h === "jumat" || h === "jum'at") {
      if (s === "1") return "08.00 - 10.00";
      if (s === "2") return "13.00 - 15.00";
      if (s === "3") return "15.30 - 17.30";
    } else {
      if (s === "1") return "08.00 - 10.00";
      if (s === "2") return "11.00 - 13.00";
      if (s === "3") return "14.00 - 16.00";
      if (s === "4") return "17.00 - 19.00";
    }
    return "-";
  };

  const getPutaran = (tglStr: string) => {
    const date = new Date(tglStr);
    const m = date.getMonth(); 
    const d = date.getDate();
    if (m === 2 && d >= 2 && d <= 7) return "Putaran 1";
    if (m === 2 && d >= 9 && d <= 14) return "Putaran 2";
    if ((m === 2 && d >= 30) || (m === 3 && d <= 4)) return "Putaran 3";
    if (m === 3 && d >= 20 && d <= 25) return "Putaran 4";  
    if ((m === 3 && d >= 27 && d <= 30) || (m === 4 && d <= 2)) return "Putaran 5"; 
    if (m === 4 && d >= 4 && d <= 9) return "Putaran 6"; 
    return "Putaran Lain";
  };

  const getJurusanInfo = (hari: string, shift: string) => {
    const h = hari.toLowerCase();
    const s = parseInt(shift.replace("Shift ", ""));
    const isMetal = (h === "senin" && (s === 1 || s === 4)) || (h === "selasa" && (s === 1 || s === 3)) || (h === "rabu" && s === 4) || ((h === "jumat" || h === "jum'at") && s === 1) || (h === "sabtu" && s === 1);
    const isIndustri = (h === "senin" && s === 3) || (h === "rabu" && (s === 1 || s === 3)) || (h === "kamis" && (s === 2 || s === 3)) || ((h === "jumat" || h === "jum'at") && s === 3) || (h === "sabtu" && s === 2);
    if (isMetal) return { nama: "Metalurgi", style: "bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-200", badge: "bg-orange-200 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300" };
    if (isIndustri) return { nama: "Industri", style: "bg-green-50 border-green-200 text-green-900 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-200", badge: "bg-green-200 text-green-800 dark:bg-green-500/20 dark:text-green-300" };
    return { nama: "Kimia", style: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900 dark:bg-fuchsia-500/10 dark:border-fuchsia-500/20 dark:text-fuchsia-200", badge: "bg-fuchsia-200 text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-300" };
  };

  const toggleDayCollapse = (tanggal: string) => {
    setExpandedDays(prev => ({ ...prev, [tanggal]: !prev[tanggal] }));
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={28} /></div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Akses Terbatas!</h1>
          <form onSubmit={handleUnlock}>
            <input type="password" placeholder="Kode akses..." value={passcodeInput} onChange={(e) => setPasscodeInput(e.target.value)} className={`w-full text-center font-bold py-3 px-4 rounded-xl border-2 mb-4 uppercase text-slate-900 dark:text-white dark:bg-slate-900 ${passcodeError ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400 dark:border-red-500/50" : "border-slate-200 bg-slate-50 focus:border-blue-500 dark:border-slate-700"}`} />
            <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"><KeyRound size={18} /> Buka Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  if (isUnlocked && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl max-w-2xl w-full text-center border border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Login Co-Ass</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">Pilih nama sendiri.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.keys(COASS_INFO).sort().map((name) => {
              const prog = calculateProgress(name);
              return (
                <button key={name} onClick={() => { localStorage.setItem("coassName", name); setCurrentUser(name); }} className="flex flex-col p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-blue-600 dark:hover:bg-blue-600 group transition-all text-left">
                  <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-white">{name}</span>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all group-hover:bg-blue-200" style={{ width: `${prog}%` }}></div>
                  </div>
                  <span className="text-[10px] mt-1 text-slate-500 dark:text-slate-400 group-hover:text-blue-100 font-bold">{prog}% Selesai</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const myAllData = jadwal.filter((d) => d["Nama Co-Ass"] === currentUser);
  const dataToGroup = viewMode === "me" ? myAllData : jadwal;
  
  const jadwalHariIni = dataToGroup.filter(d => d.Tanggal === todayStr);
  const jadwalMendatang = dataToGroup.filter(d => d.Tanggal > todayStr); 
  const jadwalSelesai = dataToGroup.filter(d => d.Tanggal < todayStr); 

  let stats = { total: 0, done: 0 };
  let modStats: Record<string, { total: number, done: number }> = {};
  myAllData.forEach(d => {
    stats.total++;
    const isDone = d.Tanggal < todayStr;
    if (isDone) stats.done++;
    if (!modStats[d.Modul]) modStats[d.Modul] = { total: 0, done: 0 };
    modStats[d.Modul].total++;
    if (isDone) modStats[d.Modul].done++;
  });

  const groupDataByPutaran = (dataArray: Jadwal[]) => {
    const grouped: Record<string, Record<string, Record<string, Jadwal[]>>> = {};
    dataArray.forEach((item) => {
      const putaran = getPutaran(item.Tanggal);
      if (!grouped[putaran]) grouped[putaran] = {};
      if (!grouped[putaran][item.Tanggal]) grouped[putaran][item.Tanggal] = {};
      if (!grouped[putaran][item.Tanggal][item.Shift]) grouped[putaran][item.Tanggal][item.Shift] = [];
      grouped[putaran][item.Tanggal][item.Shift].push(item);
    });
    return grouped;
  };

  const groupedUpcoming = groupDataByPutaran(jadwalMendatang);
  const sortedUpcomingPutaran = Object.keys(groupedUpcoming).sort();
  const groupedPast = groupDataByPutaran(jadwalSelesai);
  const sortedPastPutaran = Object.keys(groupedPast).sort().reverse(); 

  const groupedHariIni: Record<string, Jadwal[]> = {};
  jadwalHariIni.forEach(item => {
    if(!groupedHariIni[item.Shift]) groupedHariIni[item.Shift] = [];
    groupedHariIni[item.Shift].push(item);
  });

  const ScheduleCard = ({ item }: { item: Jadwal }) => {
    const jurusan = getJurusanInfo(item.Hari, item.Shift);
    return (
      <div key={item["ID Unik"]} className={`p-4 rounded-xl border flex-shrink-0 w-[75vw] md:w-[260px] snap-center flex flex-col justify-between ${jurusan.style}`}>
        <div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide inline-block mb-2 ${jurusan.badge}`}>{jurusan.nama}</span>
          <div className="font-black text-xl mb-1 truncate dark:text-white">Modul {item.Modul}</div>
        </div>
        {(viewMode === "general" || viewMode === "me") && (
          <div className="text-sm font-semibold flex items-center gap-1.5 mt-3 bg-white/60 dark:bg-slate-950/40 p-2 rounded-lg truncate dark:text-slate-300"><User size={16} /> {item["Nama Co-Ass"]}</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors">
      <nav className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 dark:bg-blue-500 text-white p-2.5 rounded-xl"><User size={20} /></div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-white leading-tight">Halo, {currentUser}</h1>
              <p className="text-xs text-slate-500 font-medium">Co-Ass Lab Fister</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setViewMode("grades")} className={`p-2.5 rounded-xl ${viewMode === 'grades' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'} transition-all`}><Calculator size={20}/></button>
            <button onClick={() => setViewMode("files")} className={`p-2.5 rounded-xl ${viewMode === 'files' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'} transition-all`}><FolderOpen size={20}/></button>
            <button onClick={() => { localStorage.removeItem("coassName"); setCurrentUser(null); setViewMode("me"); }} className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-xl transition-all"><LogOut size={20}/></button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        {(viewMode === "me" || viewMode === "general") && (
          <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm mb-8 w-fit mx-auto border border-slate-200 dark:border-slate-800">
            <button onClick={() => setViewMode("me")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "me" ? "bg-blue-600 text-white shadow-md dark:bg-blue-500" : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"}`}><CalendarDays size={18} /> Jadwal Saya</button>
            <button onClick={() => setViewMode("general")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "general" ? "bg-blue-600 text-white shadow-md dark:bg-blue-500" : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"}`}><LayoutGrid size={18} /> General</button>
          </div>
        )}

        {loading && viewMode !== "files" && (
          <div className="text-center py-20 text-slate-500 font-medium animate-pulse">Mengambil data dari database...</div>
        )}

        {/* ========================================== */}
        {/* VIEW: KALKULATOR NILAI */}
        {/* ========================================== */}
        {viewMode === "grades" && !loading && (
          <div className="animate-in fade-in duration-500">
            <button onClick={() => setViewMode("me")} className="mb-6 text-sm font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">← Kembali</button>
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
              <h2 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white"><Calculator className="text-blue-600 dark:text-blue-400"/> Hitung Nilai Praktikan</h2>
              
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                  <input 
                    type="text" 
                    placeholder="Cari Kelompok (Misal: A1 / A1-1) atau Nama..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchPraktikan()}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
                  />
                </div>
                <button onClick={handleSearchPraktikan} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 rounded-xl font-bold transition-colors">Cari</button>
              </div>

              {activeStudents.length > 0 && (
                <div className="space-y-6">
                  {Object.keys(groupedActiveStudents).sort((a,b) => {
                    if (a.includes("[SHIFTING]") && !b.includes("[SHIFTING]")) return 1;
                    if (!a.includes("[SHIFTING]") && b.includes("[SHIFTING]")) return -1;
                    return a.localeCompare(b);
                  }).map(groupName => (
                    <div key={groupName} className="mb-4">
                      <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-3 rounded-t-xl border border-slate-200 dark:border-slate-700 border-b-0">
                        <span className="font-bold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          {groupName.includes("[SHIFTING]") ? <AlertCircle size={16} className="text-orange-500"/> : <CheckSquare size={16} className="text-blue-500" />}
                          Kelompok: {groupName}
                        </span>
                        <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 font-bold">{groupedActiveStudents[groupName].length} Praktikan</span>
                      </div>
                      
                      <div className="space-y-2 border border-slate-200 dark:border-slate-700 p-2 rounded-b-xl bg-slate-50/50 dark:bg-slate-900/30">
                        {groupedActiveStudents[groupName].map((p) => (
                          <div key={p.NIM.toString()} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 relative">
                            <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                              <div>
                                <p className="font-bold text-slate-800 dark:text-white">{p.Nama}</p>
                                <p className="text-xs font-mono text-slate-500">{p.NIM}</p>
                              </div>
                              <button onClick={() => setActiveStudents(prev => prev.filter(s => s.NIM !== p.NIM))} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors" title="Hapus dari list">
                                <Trash2 size={16}/>
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 flex justify-between mb-1">
                                  <span>TP (5%)</span>
                                  <span className="text-blue-500 dark:text-blue-400">{(scores[p.NIM.toString()]?.tp * 0.05 || 0).toFixed(2)}</span>
                                </label>
                                <input type="number" min="0" max="100" placeholder="0" value={scores[p.NIM.toString()]?.tp || ""} onChange={(e) => updateScore(p.NIM, 'tp', Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold dark:text-white focus:border-blue-500 outline-none" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 flex justify-between mb-1">
                                  <span>TL (25%)</span>
                                  <span className="text-blue-500 dark:text-blue-400">{(scores[p.NIM.toString()]?.tl * 0.25 || 0).toFixed(2)}</span>
                                </label>
                                <input type="number" min="0" max="100" placeholder="0" value={scores[p.NIM.toString()]?.tl || ""} onChange={(e) => updateScore(p.NIM, 'tl', Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold dark:text-white focus:border-blue-500 outline-none" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 flex justify-between mb-1">
                                  <span>PD (20%)</span>
                                  <span className="text-blue-500 dark:text-blue-400">{(scores[p.NIM.toString()]?.pd * 0.20 || 0).toFixed(2)}</span>
                                </label>
                                <input type="number" min="0" max="100" placeholder="0" value={scores[p.NIM.toString()]?.pd || ""} onChange={(e) => updateScore(p.NIM, 'pd', Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold dark:text-white focus:border-blue-500 outline-none" />
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end items-center">
                              <span className="text-xs font-bold text-slate-400 mr-2">NILAI AKHIR:</span>
                              <span className="text-lg font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-lg">{(scores[p.NIM.toString()]?.weighted || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 p-4 rounded-2xl">
                    <h3 className="font-bold text-sm text-orange-800 dark:text-orange-400 mb-3 flex items-center gap-2"><PlusCircle size={16}/> Tambah Praktikan Shifting</h3>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ketik Nama atau NIM praktikan shifting..." 
                        value={shiftingQuery} 
                        onChange={(e) => handleSearchShifting(e.target.value)} 
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800/50 rounded-xl text-sm outline-none dark:text-white"
                      />
                      {shiftingResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-1 rounded-xl shadow-lg z-10 overflow-hidden">
                          {shiftingResults.map(res => (
                            <button key={res.NIM} onClick={() => addShiftingStudent(res)} className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 flex justify-between items-center">
                              <div>
                                <p className="font-bold text-sm dark:text-white">{res.Nama}</p>
                                <p className="text-xs text-slate-500">{res.NIM} - Klp: {res.Kelompok}</p>
                              </div>
                              <PlusCircle size={16} className="text-orange-500"/>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-8 mt-4 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Send size={20} className="text-green-500"/> Kirim ke Asisten</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 ml-1">KODE ASISTEN</label>
                        <select value={waData.asisten} onChange={e => setWaData({...waData, asisten: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-200 outline-none">
                          <option value="">Pilih...</option>
                          {Object.keys(ASISTEN_WA).map(code => <option key={code} value={code}>{code}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 ml-1">SHIFT</label>
                        <select value={waData.shift} onChange={e => setWaData({...waData, shift: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-200 outline-none">
                          {["Shift 1", "Shift 2", "Shift 3", "Shift 4"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 ml-1">MODUL</label>
                        <select value={waData.modul} onChange={e => setWaData({...waData, modul: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-200 outline-none">
                          {MODUL_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 ml-1">TANGGAL</label>
                        <input type="date" value={waData.tanggal} onChange={e => setWaData({...waData, tanggal: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-200 outline-none" />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button onClick={generateWATemplate} disabled={!waData.asisten || activeStudents.length === 0} className="flex-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white py-4 rounded-2xl font-black transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 shadow-lg shadow-green-500/30">
                        <Send size={18}/> Kirim ke WA
                      </button>
                      <button onClick={() => {setScores({}); setActiveStudents([]); setSearchQuery("");}} className="p-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl text-slate-500 transition-colors" title="Reset Semua Nilai">
                        <RotateCcw size={22}/>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW: FOLDER G-DRIVE & EMBED PDF */}
        {/* ========================================== */}
        {viewMode === "files" && (
          <div className="mb-10 animate-in fade-in duration-500">
            <button onClick={() => setViewMode("me")} className="mb-6 text-sm font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">← Kembali</button>
            
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 snap-x [&::-webkit-scrollbar]:hidden">
               <button onClick={() => setActiveFileTab("alur")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${activeFileTab === 'alur' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                 <AlertCircle size={16}/> Alur
               </button>
               <button onClick={() => setActiveFileTab("materi")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${activeFileTab === 'materi' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                 <BookOpen size={16}/> Materi
               </button>
               <button onClick={() => setActiveFileTab("tp")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${activeFileTab === 'tp' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                 <CheckSquare size={16}/> TP
               </button>
               <button onClick={() => setActiveFileTab("drive")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${activeFileTab === 'drive' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                 <FolderOpen size={16}/> Drive
               </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-[75vh]">
              {activeFileTab === "alur" && (
                PDF_ALUR_ID === "ID_FILE_PDF_ALUR" ? 
                <div className="flex items-center justify-center h-full text-slate-400 font-bold">Belum Tersedia!</div> :
                <iframe src={`https://drive.google.com/file/d/${PDF_ALUR_ID}/preview`} width="100%" height="100%" style={{ border: "none" }} allow="autoplay"></iframe>
              )}
              
              {activeFileTab === "materi" && (
                PDF_MATERI_ID === "ID_FILE_PDF_MATERI" ? 
                <div className="flex items-center justify-center h-full text-slate-400 font-bold">Belum Tersedia!</div> :
                <iframe src={`https://drive.google.com/file/d/${PDF_MATERI_ID}/preview`} width="100%" height="100%" style={{ border: "none" }} allow="autoplay"></iframe>
              )}

              {activeFileTab === "tp" && (
                PDF_TP_ID === "ID_FILE_PDF_JAWABAN_TP" ? 
                <div className="flex items-center justify-center h-full text-slate-400 font-bold">Belum Tersedia!</div> :
                <iframe src={`https://drive.google.com/file/d/${PDF_TP_ID}/preview`} width="100%" height="100%" style={{ border: "none" }} allow="autoplay"></iframe>
              )}

              {activeFileTab === "drive" && (
                <iframe src={`https://drive.google.com/embeddedfolderview?id=${GDRIVE_FOLDER_ID}#grid`} width="100%" height="100%" style={{ border: "none" }} title="Google Drive"></iframe>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW: JADWAL */}
        {/* ========================================== */}
        {(viewMode === "me" || viewMode === "general") && !loading && (
          <>
            <div className="mb-10 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><AlertCircle className="text-blue-600 dark:text-blue-400" size={22} /> Jadwal Hari Ini</h2>
              {jadwalHariIni.length > 0 ? (
                <div className="space-y-4">
                  {Object.keys(groupedHariIni).sort().map(shiftKey => {
                    const shiftItems = groupedHariIni[shiftKey];
                    return (
                      <div key={shiftKey} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="text-sm font-bold mb-3 flex justify-between">
                           <div className="flex items-center gap-2 dark:text-slate-200"><Clock size={16} className="text-blue-500 dark:text-blue-400" /> {shiftKey}</div>
                           <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500 dark:text-slate-400">{getShiftTime(shiftItems[0].Hari, shiftKey)}</span>
                        </div>
                        <div className="flex overflow-x-auto gap-3 pb-2 snap-x [&::-webkit-scrollbar]:hidden">
                          {shiftItems.map(item => <ScheduleCard key={item["ID Unik"]} item={item} />)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center text-slate-500 dark:text-slate-400">Alhamdulillah, hari ini bisa santai.</div>
              )}
            </div>

            {viewMode === "me" && stats.total > 0 && (
              <div className="mb-10 animate-in fade-in">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Target className="text-blue-600 dark:text-blue-400" size={22} /> Progress Shift</h2>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-end mb-5 border-b border-slate-100 dark:border-slate-800 pb-5">
                     <div>
                       <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Total Selesai</p>
                       <p className="text-4xl font-black dark:text-white">{stats.done} <span className="text-xl text-slate-400 dark:text-slate-500">/ {stats.total}</span></p>
                     </div>
                     <div className="w-14 h-14 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-sm overflow-hidden relative">
                        <div className="absolute bottom-0 w-full bg-blue-200 dark:bg-blue-500/30 transition-all" style={{ height: `${(stats.done / stats.total) * 100}%` }}></div>
                        <span className="relative z-10">{Math.round((stats.done / stats.total) * 100)}%</span>
                     </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {Object.keys(modStats).sort().map(mod => {
                      const isDone = modStats[mod].done === modStats[mod].total;
                      return (
                        <div key={mod} className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${isDone ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400" : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"}`}>
                           {mod} <span className="ml-1 text-blue-500 dark:text-blue-400">{modStats[mod].done}/{modStats[mod].total}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {sortedUpcomingPutaran.map((putaran) => (
              <div key={putaran} className="mb-8">
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-2 pl-1"><Bookmark className="text-blue-600 dark:text-blue-400" size={22} /> {putaran}</h2>
                <div className="grid grid-cols-1 gap-4">
                  {Object.keys(groupedUpcoming[putaran]).sort().map((tanggal) => {
                    const jadwalByShift = groupedUpcoming[putaran][tanggal];
                    const tglDisplay = new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
                    const isExpanded = viewMode === "me" ? true : !!expandedDays[tanggal];
                    return (
                      <div key={tanggal} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                        <div onClick={() => viewMode === "general" && toggleDayCollapse(tanggal)} className={`p-4 flex items-center justify-between ${viewMode === "general" ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" : ""}`}>
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 p-2.5 rounded-xl"><Calendar size={20} /></div>
                            <div>
                              <h3 className="font-bold dark:text-white">{Object.values(jadwalByShift)[0][0].Hari}</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{tglDisplay}</p>
                            </div>
                          </div>
                          {viewMode === "general" && <div className="text-slate-400">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>}
                        </div>
                        {isExpanded && (
                          <div className="p-4 pt-0 space-y-4 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800/50">
                            {Object.keys(jadwalByShift).sort().map(shiftKey => (
                              <div key={shiftKey} className="border-l-2 border-blue-200 dark:border-blue-800 pl-3 mt-4">
                                <div className="text-sm font-bold mb-2 flex items-center gap-2 dark:text-slate-200"><Clock size={16} className="text-blue-500 dark:text-blue-400" /> {shiftKey}</div>
                                <div className="flex overflow-x-auto gap-3 pb-2 snap-x [&::-webkit-scrollbar]:hidden">
                                  {jadwalByShift[shiftKey].map(item => <ScheduleCard key={item["ID Unik"]} item={item} />)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {sortedPastPutaran.length > 0 && (
              <div className="mt-14 pt-8 border-t border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-black text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2 pl-1"><CheckCircle2 size={24} /> Sudah Selesai</h2>
                <div className="opacity-80">
                  {sortedPastPutaran.map((putaran) => (
                    <div key={`past-${putaran}`} className="mb-6">
                      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider pl-2">{putaran}</h3>
                      <div className="grid gap-3">
                        {Object.keys(groupedPast[putaran]).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map((tanggal) => {
                          const isExpanded = !!expandedDays[tanggal];
                          const tglDisplay = new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
                          return (
                            <div key={`past-${tanggal}`} className="bg-white/60 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                              <div onClick={() => toggleDayCollapse(tanggal)} className="p-3.5 flex justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <div className="flex gap-3 items-center">
                                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 p-2 rounded-lg"><CheckCircle2 size={18} /></div>
                                  <h4 className="font-bold text-sm text-slate-600 dark:text-slate-300">{Object.values(groupedPast[putaran][tanggal])[0][0].Hari}, {tglDisplay}</h4>
                                </div>
                                <div className="text-slate-400">{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
                              </div>
                              {isExpanded && (
                                <div className="p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800/50">
                                  {Object.keys(groupedPast[putaran][tanggal]).sort().map(shiftKey => (
                                    <div key={shiftKey} className="border-l-2 border-slate-300 dark:border-slate-700 pl-3">
                                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5"><Clock size={14} /> {shiftKey}</div>
                                      <div className="flex overflow-x-auto gap-3 snap-x [&::-webkit-scrollbar]:hidden">
                                        {groupedPast[putaran][tanggal][shiftKey].map(item => (
                                          <div key={item["ID Unik"]} className="p-3 rounded-lg border w-[60vw] md:w-[200px] snap-center bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                                             <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">MODUL</span>
                                             <div className="font-black text-lg text-slate-700 dark:text-slate-300">{item.Modul}</div>
                                             {viewMode === "general" && <div className="text-xs mt-2 text-slate-600 dark:text-slate-400">{item["Nama Co-Ass"]}</div>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}