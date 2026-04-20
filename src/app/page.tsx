"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, User, LogOut, LayoutGrid, CalendarDays, ChevronDown, ChevronUp, AlertCircle, Bookmark, FolderOpen, Lock, KeyRound, CheckCircle2, Target, Calculator, Send, Search, Trash2, RotateCcw, PlusCircle, BookOpen, CheckSquare } from "lucide-react";

type Jadwal = { "ID Unik": string; Tanggal: string; Hari: string; Modul: string; Shift: string; "Nama Co-Ass": string; };
type Praktikan = { "Kelompok Besar"?: string; "Kelompok Sedang"?: string; Kelompok: string | number; NIM: string | number; Nama: string; isShifting?: boolean; };
type NilaiEntry = { nim: string | number; tp: number | string; tl: number | string; pd: number | string; weighted: number; };

// =============================================
// KONFIGURASI 
// =============================================
const API_URL = "https://script.google.com/macros/s/AKfycbwpkuTVeY7cg697mbxXM-qv6-fX8KYFdQkeRYSVtQ0Sl1aQs-k5kTSlJzY5MBQqEA66iQ/exec"; 
const SECRET_PASSCODE = "Co-Ass24TheBest";
const RAPORT_LINK = "https://docs.google.com/spreadsheets/d/1PWPIULtFKils_qB2zQhq_D-yrI7GI5bJLtcpa4D5a00/edit?gid=1783490060#gid=1783490060"; 

const GDRIVE_FOLDER_ID: string = "1NKRgEruaIcHDB0XEqm5MarWXqlZivoWd"; 
const PDF_ALUR_ID: string = "ID_FILE_PDF"; 
const PDF_MATERI_ID: string = "1ueo1gAm94EoSofpnslVp9uIdlaWw3UR1"; 
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
  "IR": "6287888260908", "RD": "6281210725841", "SW": "6285697265137", "TH": "6281310963871", "IL": "6285894410507",
  "AB": "6285210932558", "AF": "6289672459800", "AN": "62895416478450", "AG": "6289510301830", "SS": "6285770720665",
  "AM": "6285860303681", "CY": "62895332215384", "DF": "6289636478286", "DA": "6289512910790", "ER": "6281381743493",
  "FI": "62895360589238", "HA": "6285782809441", "IA": "62895344132907", "IT": "6289514259017", "KF": "6289603998142",
  "MF": "6285890287244", "HI": "6289698234875", "MR": "6281218200170", "NA": "6288291095733", "NN": "62881010627198",
  "OS": "6281295085256", "RM": "6285710531091", "YZ": "6282142546144", "ZI": "6281387999357",
};

const MODUL_LIST = ["PA", "MY", "PJK", "RL", "HKM", "VT", "CL"];

// =============================================
// HELPER: WAKTU WIB & CEK SHIFT
// =============================================
const getWIBTime = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || "";
  return {
    dateStr: `${getPart('year')}-${getPart('month')}-${getPart('day')}`, 
    timeStr: `${getPart('hour')}:${getPart('minute')}`, 
    hour: parseInt(getPart('hour')), minute: parseInt(getPart('minute'))
  };
};

const getWIBTomorrowStr = () => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(tomorrow);
};

const isShiftFinished = (hari: string, shift: string) => {
  const { timeStr } = getWIBTime();
  const h = hari.toLowerCase(); const s = shift.replace("Shift ", "");
  const isJumat = h === "jumat" || h === "jum'at";

  let endTime = "00:00";
  if (s === "1") endTime = "10:00";
  else if (s === "2") endTime = isJumat ? "15:00" : "13:00";
  else if (s === "3") endTime = isJumat ? "17:30" : "16:00";
  else if (s === "4") endTime = "19:00";

  return timeStr >= endTime;
};

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
  const [scheduleTab, setScheduleTab] = useState<"upcoming" | "past">("upcoming");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [activeStudents, setActiveStudents] = useState<Praktikan[]>([]);
  const [scores, setScores] = useState<Record<string, NilaiEntry>>({});
  
  const [shiftingQuery, setShiftingQuery] = useState("");
  const [shiftingResults, setShiftingResults] = useState<Praktikan[]>([]);
  
  const [waData, setWaData] = useState({
    asisten: "", shift: "Shift 1", modul: "PA", tanggal: getWIBTime().dateStr
  });

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
    
    const savedUnlock = localStorage.getItem("appUnlocked");
    const savedUser = localStorage.getItem("coassName");
    const savedScores = localStorage.getItem("temp_scores");
    
    if (savedUnlock === "true") setIsUnlocked(true);
    if (savedUser) setCurrentUser(savedUser);
    if (savedScores) setScores(JSON.parse(savedScores));
    
    if (savedUnlock === "true" || savedUser) fetchData();
    else setLoading(false);
  }, []);

  useEffect(() => { localStorage.setItem("temp_scores", JSON.stringify(scores)); }, [scores]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      setJadwal(json.jadwal || []); setPraktikanData(json.praktikan || []);
    } catch (error) { console.error("Gagal narik data:", error); } finally { setLoading(false); }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput.toUpperCase() === SECRET_PASSCODE.toUpperCase()) {
      localStorage.setItem("appUnlocked", "true"); setIsUnlocked(true); setPasscodeError(false); fetchData();
    } else {
      setPasscodeError(true); setPasscodeInput("");
    }
  };

  const calculateProgress = (name: string) => {
    const userJadwal = jadwal.filter(j => j["Nama Co-Ass"] === name);
    if (userJadwal.length === 0) return 0;
    const { dateStr: today } = getWIBTime();
    const done = userJadwal.filter(j => (j.Tanggal < today) || (j.Tanggal === today && isShiftFinished(j.Hari, j.Shift))).length;
    return Math.round((done / userJadwal.length) * 100);
  };

  const handleGradeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault(); 
      const inputs = Array.from(document.querySelectorAll('.grade-input')) as HTMLInputElement[];
      const currentIndex = inputs.indexOf(e.currentTarget);
      
      if ((e.key === 'ArrowDown' || e.key === 'ArrowRight') && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
      } else if ((e.key === 'ArrowUp' || e.key === 'ArrowLeft') && currentIndex > 0) {
        inputs[currentIndex - 1].focus();
      }
    }
  };

  const handleSearchPraktikan = () => {
    if (!searchQuery.trim()) { setActiveStudents([]); return; }
    const query = searchQuery.toLowerCase().trim();
    const filtered = praktikanData.filter(p => 
      p.Kelompok?.toString().toLowerCase().includes(query) || p["Kelompok Sedang"]?.toString().toLowerCase() === query || 
      p.Nama?.toLowerCase().includes(query) || p.NIM?.toString().toLowerCase().includes(query)
    );
    setActiveStudents(filtered);
    if (filtered.length > 0) setSelectedGroup(filtered[0]["Kelompok Sedang"]?.toString() || filtered[0].Kelompok?.toString() || query.toUpperCase());
  };

  const handleSearchShifting = (val: string) => {
    setShiftingQuery(val);
    if (val.length < 3) { setShiftingResults([]); return; }
    const res = praktikanData.filter(p => p.Nama?.toLowerCase().includes(val.toLowerCase()) || p.NIM?.toString().toLowerCase().includes(val.toLowerCase())).slice(0, 5);
    setShiftingResults(res);
  };

  const addShiftingStudent = (student: Praktikan) => {
    if (activeStudents.some(s => s.NIM === student.NIM)) return;
    setActiveStudents(prev => [...prev, { ...student, isShifting: true }]);
    setShiftingQuery(""); setShiftingResults([]);
  };

  const updateScore = (nim: string | number, field: 'tp' | 'tl' | 'pd', val: string) => {
    let safeVal: number | string = val;
    
    if (val !== "") {
      let numVal = Number(val);
      if (numVal > 100) numVal = 100;
      if (numVal < 0) numVal = 0;
      safeVal = numVal;
    }

    const strNim = nim.toString();
    const current = scores[strNim] || { nim: strNim, tp: "", tl: "", pd: "", weighted: 0 };
    const next = { ...current, [field]: safeVal };
    
    const tpNum = Number(next.tp) || 0;
    const tlNum = Number(next.tl) || 0;
    const pdNum = Number(next.pd) || 0;
    
    next.weighted = (tpNum * 0.05) + (tlNum * 0.25) + (pdNum * 0.20);
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
    const { hour } = getWIBTime();
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
        const tpNum = Number(s.tp) || 0;
        const tlNum = Number(s.tl) || 0;
        const pdNum = Number(s.pd) || 0;
        
        text += `*${p.Nama} (${p.NIM})*%0A [TP: ${(tpNum * 0.05).toFixed(2)}]%0A [TL: ${(tlNum * 0.25).toFixed(2)}]%0A [PD: ${(pdNum * 0.20).toFixed(2)}]%0A *Total: ${s.weighted.toFixed(2)}*%0A%0A`;
      });
      text += `%0A`;
    });
    
    text += `Sebelumnya saya juga izin untuk mengirimkan link raport saya, dan terimakasih banyak atas bantuannya selama tahap asistensi ini. Terimakasihh.%0A%0A[Link Raport]: ${RAPORT_LINK}`;
    window.open(`https://wa.me/${ASISTEN_WA[waData.asisten]}?text=${text}`, '_blank');
  };

  const getShiftTime = (hari: string, shift: string) => {
    const s = shift.replace("Shift ", ""); const h = hari.toLowerCase();
    if (h === "jumat" || h === "jum'at") {
      if (s === "1") return "08.00 - 10.00"; if (s === "2") return "13.00 - 15.00"; if (s === "3") return "15.30 - 17.30";
    } else {
      if (s === "1") return "08.00 - 10.00"; if (s === "2") return "11.00 - 13.00"; if (s === "3") return "14.00 - 16.00"; if (s === "4") return "17.00 - 19.00";
    }
    return "-";
  };

  const getPutaran = (tglStr: string) => {
    const date = new Date(tglStr); const m = date.getMonth(); const d = date.getDate();
    if (m === 2 && d >= 2 && d <= 7) return "Putaran 1";
    if (m === 2 && d >= 9 && d <= 14) return "Putaran 2";
    if ((m === 2 && d >= 30) || (m === 3 && d <= 4)) return "Putaran 3";
    if (m === 3 && d >= 20 && d <= 25) return "Putaran 4";  
    if ((m === 3 && d >= 27 && d <= 30) || (m === 4 && d <= 2)) return "Putaran 5"; 
    if (m === 4 && d >= 4 && d <= 9) return "Putaran 6"; 
    return "Putaran Lain";
  };

  const getJurusanInfo = (hari: string, shift: string) => {
    const h = hari.toLowerCase(); const s = parseInt(shift.replace("Shift ", ""));
    const isMetal = (h === "senin" && (s === 1 || s === 4)) || (h === "selasa" && (s === 1 || s === 3)) || (h === "rabu" && s === 4) || ((h === "jumat" || h === "jum'at") && s === 1) || (h === "sabtu" && s === 1);
    const isIndustri = (h === "senin" && s === 3) || (h === "rabu" && (s === 1 || s === 3)) || (h === "kamis" && (s === 2 || s === 3)) || ((h === "jumat" || h === "jum'at") && s === 3) || (h === "sabtu" && s === 2);
    if (isMetal) return { nama: "Metalurgi", badge: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" };
    if (isIndustri) return { nama: "Industri", badge: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" };
    return { nama: "Kimia", badge: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-400" };
  };

  const toggleDayCollapse = (tanggal: string) => setExpandedDays(prev => ({ ...prev, [tanggal]: !prev[tanggal] }));

  // ==================== RENDER VIEWS ====================

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={28} /></div>
          <h1 className="text-2xl font-bold mb-2">Akses Terbatas!</h1>
          <form onSubmit={handleUnlock} className="mt-8">
            <input type="password" placeholder="Kode akses..." value={passcodeInput} onChange={(e) => setPasscodeInput(e.target.value)} className={`w-full text-center font-semibold py-3.5 px-4 rounded-xl border-2 mb-4 uppercase bg-slate-50 dark:bg-slate-950 transition-all outline-none ${passcodeError ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-900/10 dark:border-red-500/50" : "border-slate-200 dark:border-slate-800 focus:border-blue-500"}`} />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"><KeyRound size={18} /> Buka Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  if (isUnlocked && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 max-w-4xl w-full text-center">
          <h1 className="text-3xl font-bold mb-2">Login Co-Ass</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">Pilih nama untuk masuk.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(COASS_INFO).sort().map((name) => {
              const prog = calculateProgress(name);
              return (
                <button key={name} onClick={() => { localStorage.setItem("coassName", name); setCurrentUser(name); }} className="flex flex-col p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-500 dark:hover:border-blue-500 group transition-all text-left">
                  <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{name}</span>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all" style={{ width: `${prog}%` }}></div>
                  </div>
                  <span className="text-xs mt-2 text-slate-500 dark:text-slate-400 font-medium">{prog}% Selesai</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const { dateStr: todayStr } = getWIBTime();
  const tomorrowStr = getWIBTomorrowStr();

  const myAllData = jadwal.filter((d) => d["Nama Co-Ass"] === currentUser);
  const dataToGroup = viewMode === "me" ? myAllData : jadwal;
  
  const jadwalHariIniFull = dataToGroup.filter(d => d.Tanggal === todayStr);
  const jadwalHariIniSisa = jadwalHariIniFull.filter(d => !isShiftFinished(d.Hari, d.Shift));
  
  const jadwalMendatang = dataToGroup.filter(d => d.Tanggal > todayStr); 
  const jadwalBesok = dataToGroup.filter(d => d.Tanggal === tomorrowStr);
  const jadwalSelesai = dataToGroup.filter(d => (d.Tanggal < todayStr) || (d.Tanggal === todayStr && isShiftFinished(d.Hari, d.Shift))); 

  let stats = { total: 0, done: 0 };
  let modStats: Record<string, { total: number, done: number }> = {};
  myAllData.forEach(d => {
    stats.total++;
    const isDone = (d.Tanggal < todayStr) || (d.Tanggal === todayStr && isShiftFinished(d.Hari, d.Shift));
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

  let highlightTitle = "Jadwal Hari Ini";
  let highlightIcon = <AlertCircle className="text-blue-600 dark:text-blue-400" size={20} />;
  let highlightBg = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800";
  let highlightJadwalList = jadwalHariIniSisa;
  let isEmptyMsg = "Kosong Melompong, kaga ada shift hari ini.";
  const isTodayDone = jadwalHariIniFull.length > 0 && jadwalHariIniSisa.length === 0;

  if (isTodayDone && jadwalBesok.length > 0) {
    highlightTitle = "Jadwal Besok";
    highlightIcon = <CalendarDays className="text-amber-600 dark:text-amber-500" size={20} />;
    highlightBg = "bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50";
    highlightJadwalList = jadwalBesok;
  }

  const groupedHighlight: Record<string, Jadwal[]> = {};
  highlightJadwalList.forEach(item => {
    if(!groupedHighlight[item.Shift]) groupedHighlight[item.Shift] = [];
    groupedHighlight[item.Shift].push(item);
  });

  // ✅ KARTU JADWAL (Badge Jurusan HANYA muncul di mode ME. Mode GENERAL disembunyikan dari kartu)
  const ScheduleCard = ({ item }: { item: Jadwal }) => {
    const jurusan = getJurusanInfo(item.Hari, item.Shift);
    return (
      <div key={item["ID Unik"]} className={`p-3.5 rounded-2xl border flex-shrink-0 snap-center flex flex-col justify-between bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm ${viewMode === "general" ? "w-[45vw] md:w-[170px]" : "w-[60vw] md:w-[210px]"}`}>
        <div>
          {viewMode === "me" && (
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${jurusan.badge}`}>{jurusan.nama}</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{item.Shift}</span>
            </div>
          )}
          <div className="font-bold text-lg mb-1 truncate text-slate-800 dark:text-slate-100">Modul {item.Modul}</div>
          {viewMode === "me" && (
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{getShiftTime(item.Hari, item.Shift)}</div>
          )}
        </div>
        {viewMode === "general" && (
          <div className="text-xs font-medium flex items-center gap-1.5 mt-3 text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5"><User size={12} /> {item["Nama Co-Ass"]}</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors">
      
      <nav className="bg-white dark:bg-slate-900 sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl"><User size={20} /></div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Halo, {currentUser}</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Co-Ass Lab Fister</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setViewMode("grades")} className={`p-2 rounded-xl transition-colors ${viewMode === 'grades' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Calculator size={20}/></button>
            <button onClick={() => setViewMode("files")} className={`p-2 rounded-xl transition-colors ${viewMode === 'files' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><FolderOpen size={20}/></button>
            <button onClick={() => { localStorage.removeItem("coassName"); setCurrentUser(null); setViewMode("me"); }} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-xl transition-colors"><LogOut size={20}/></button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        {(viewMode === "me" || viewMode === "general") && (
          <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-full shadow-sm mb-8 w-fit mx-auto border border-slate-200 dark:border-slate-800">
            <button onClick={() => setViewMode("me")} className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all ${viewMode === "me" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700"}`}><CalendarDays size={16} /> Jadwal Saya</button>
            <button onClick={() => setViewMode("general")} className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all ${viewMode === "general" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700"}`}><LayoutGrid size={16} /> General</button>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW: KALKULATOR NILAI (MATERIAL 3) */}
        {/* ========================================== */}
        {viewMode === "grades" && !loading && (
          <div className="animate-in fade-in duration-300">
            <button onClick={() => setViewMode("me")} className="mb-6 text-sm font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 flex items-center gap-1.5">← Kembali ke Jadwal</button>
            <div className="mb-6 flex justify-between items-center">
               <h2 className="text-xl font-bold flex items-center gap-2"><Calculator className="text-blue-600" size={24}/> Hitung Nilai</h2>
            </div>
            
            <div className="flex gap-2 md:gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={18}/>
                <input 
                  type="text" placeholder="Cari Kelompok atau Nama..." 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPraktikan()}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl md:rounded-full text-sm outline-none focus:border-blue-500 transition-colors" 
                />
              </div>
              <button onClick={handleSearchPraktikan} className="bg-blue-600 hover:bg-blue-700 text-white px-5 md:px-8 py-2.5 rounded-xl md:rounded-full font-bold text-sm transition-colors shadow-sm">Cari</button>
            </div>

            {activeStudents.length > 0 && (
              <div className="space-y-6">
                {Object.keys(groupedActiveStudents).sort((a,b) => {
                  if (a.includes("[SHIFTING]") && !b.includes("[SHIFTING]")) return 1;
                  if (!a.includes("[SHIFTING]") && b.includes("[SHIFTING]")) return -1;
                  return a.localeCompare(b);
                }).map(groupName => (
                  <div key={groupName} className="mb-6">
                    <div className="flex justify-between items-center mb-3 px-2">
                      <span className="font-bold text-sm flex items-center gap-2">
                        {groupName.includes("[SHIFTING]") ? <AlertCircle size={16} className="text-orange-500"/> : <CheckSquare size={16} className="text-blue-600 dark:text-blue-400" />}
                        {groupName}
                      </span>
                      <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-400 font-bold">{groupedActiveStudents[groupName].length} Anak</span>
                    </div>
                    
                    <div className="space-y-3">
                      {groupedActiveStudents[groupName].map((p) => (
                        <div key={p.NIM.toString()} className="p-4 md:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-bold text-sm md:text-base">{p.Nama}</p>
                              <p className="text-[11px] md:text-xs font-mono text-slate-500 mt-1">{p.NIM}</p>
                            </div>
                            <button onClick={() => setActiveStudents(prev => prev.filter(s => s.NIM !== p.NIM))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"><Trash2 size={16}/></button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 md:gap-4">
                            <div>
                              <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 md:mb-2">TP (5%)</label>
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <input type="number" value={scores[p.NIM.toString()]?.tp ?? ""} onChange={(e) => updateScore(p.NIM, 'tp', e.target.value)} onKeyDown={handleGradeInputKeyDown} onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                                className="grade-input w-full p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs md:text-sm font-bold focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" placeholder="0" />
                                <div className="flex-shrink-0 px-2 md:px-3 py-2 md:py-3 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold text-xs md:text-sm rounded-lg md:rounded-xl min-w-[2.5rem] md:min-w-[3rem] text-center border border-blue-100 dark:border-blue-900/50">
                                  {(Number(scores[p.NIM.toString()]?.tp || 0) * 0.05).toFixed(2)}
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 md:mb-2">TL (25%)</label>
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <input type="number" value={scores[p.NIM.toString()]?.tl ?? ""} onChange={(e) => updateScore(p.NIM, 'tl', e.target.value)} onKeyDown={handleGradeInputKeyDown} onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                                className="grade-input w-full p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs md:text-sm font-bold focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" placeholder="0" />
                                <div className="flex-shrink-0 px-2 md:px-3 py-2 md:py-3 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold text-xs md:text-sm rounded-lg md:rounded-xl min-w-[2.5rem] md:min-w-[3rem] text-center border border-blue-100 dark:border-blue-900/50">
                                  {(Number(scores[p.NIM.toString()]?.tl || 0) * 0.25).toFixed(2)}
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 md:mb-2">PD (20%)</label>
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <input type="number" value={scores[p.NIM.toString()]?.pd ?? ""} onChange={(e) => updateScore(p.NIM, 'pd', e.target.value)} onKeyDown={handleGradeInputKeyDown} onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                                className="grade-input w-full p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs md:text-sm font-bold focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" placeholder="0" />
                                <div className="flex-shrink-0 px-2 md:px-3 py-2 md:py-3 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold text-xs md:text-sm rounded-lg md:rounded-xl min-w-[2.5rem] md:min-w-[3rem] text-center border border-blue-100 dark:border-blue-900/50">
                                  {(Number(scores[p.NIM.toString()]?.pd || 0) * 0.20).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xs font-bold text-slate-400">Total Akhir</span>
                            <span className="text-lg font-black text-blue-600 dark:text-blue-400">{(scores[p.NIM.toString()]?.weighted || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 p-5 rounded-3xl">
                  <h3 className="font-bold text-sm text-orange-800 dark:text-orange-400 mb-3 flex items-center gap-2"><PlusCircle size={16}/> Praktikan Shifting</h3>
                  <div className="relative">
                    <input 
                      type="text" placeholder="Ketik Nama atau NIM..." value={shiftingQuery} onChange={(e) => handleSearchShifting(e.target.value)} 
                      className="w-full p-3.5 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800/50 rounded-xl text-sm outline-none focus:border-orange-500 transition-colors"
                    />
                    {shiftingResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mt-2 rounded-2xl shadow-xl z-10 overflow-hidden">
                        {shiftingResults.map(res => (
                          <button key={res.NIM} onClick={() => addShiftingStudent(res)} className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 flex justify-between items-center transition-colors">
                            <div><p className="font-bold text-sm">{res.Nama}</p><p className="text-xs text-slate-500 mt-0.5">{res.NIM} - {res.Kelompok}</p></div>
                            <div className="p-1.5 bg-orange-100 dark:bg-orange-500/20 rounded-full text-orange-600 dark:text-orange-400"><PlusCircle size={16}/></div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
                  <h3 className="font-bold text-base mb-5 flex items-center gap-2"><Send size={18} className="text-blue-500"/> Kirim Nilai</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ASISTEN</label>
                      <select value={waData.asisten} onChange={e => setWaData({...waData, asisten: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none focus:border-blue-500">
                        <option value="">Pilih...</option>
                        {Object.keys(ASISTEN_WA).map(code => <option key={code} value={code}>{code}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">SHIFT</label>
                      <select value={waData.shift} onChange={e => setWaData({...waData, shift: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none focus:border-blue-500">
                        {["Shift 1", "Shift 2", "Shift 3", "Shift 4"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">MODUL</label>
                      <select value={waData.modul} onChange={e => setWaData({...waData, modul: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none focus:border-blue-500">
                        {MODUL_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">TANGGAL</label>
                      <input type="date" value={waData.tanggal} onChange={e => setWaData({...waData, tanggal: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none focus:border-blue-500 [color-scheme:light] dark:[color-scheme:dark]" />
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <button onClick={generateWATemplate} disabled={!waData.asisten || activeStudents.length === 0} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"><Send size={16}/> Generate WhatsApp</button>
                    <button onClick={() => {setScores({}); setActiveStudents([]); setSearchQuery("");}} className="p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center gap-2 font-semibold"><RotateCcw size={16}/> <span className="md:hidden">Reset</span></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW: FOLDER G-DRIVE & EMBED PDF */}
        {/* ========================================== */}
        {viewMode === "files" && (
          <div className="animate-in fade-in duration-300">
            <button onClick={() => setViewMode("me")} className="mb-6 text-sm font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 flex items-center gap-1.5">← Kembali ke Jadwal</button>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 snap-x [&::-webkit-scrollbar]:hidden">
               <button onClick={() => setActiveFileTab("alur")} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-colors ${activeFileTab === 'alur' ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}><AlertCircle size={16}/> Alur</button>
               <button onClick={() => setActiveFileTab("materi")} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-colors ${activeFileTab === 'materi' ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}><BookOpen size={16}/> Materi</button>
               <button onClick={() => setActiveFileTab("tp")} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-colors ${activeFileTab === 'tp' ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}><CheckSquare size={16}/> TP</button>
               <button onClick={() => setActiveFileTab("drive")} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-colors ${activeFileTab === 'drive' ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}><FolderOpen size={16}/> Drive</button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-[75vh]">
              {activeFileTab === "alur" && ( <iframe src={`https://drive.google.com/file/d/${PDF_ALUR_ID}/preview`} width="100%" height="100%" style={{ border: "none" }} allow="autoplay"></iframe> )}
              {activeFileTab === "materi" && ( <iframe src={`https://drive.google.com/file/d/${PDF_MATERI_ID}/preview`} width="100%" height="100%" style={{ border: "none" }} allow="autoplay"></iframe> )}
              {activeFileTab === "tp" && ( <iframe src={`https://drive.google.com/file/d/${PDF_TP_ID}/preview`} width="100%" height="100%" style={{ border: "none" }} allow="autoplay"></iframe> )}
              {activeFileTab === "drive" && ( <iframe src={`https://drive.google.com/embeddedfolderview?id=${GDRIVE_FOLDER_ID}#grid`} width="100%" height="100%" style={{ border: "none" }} title="Google Drive"></iframe> )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW: JADWAL & PROGRESS */}
        {/* ========================================== */}
        {(viewMode === "me" || viewMode === "general") && !loading && (
          <div className="animate-in fade-in duration-300">
            
            {/* ✅ JADWAL HARI INI (DIKATEGORIKAN PER SHIFT) */}
            <div className="mb-10">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${highlightTitle.includes("Besok") ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"}`}>
                  {highlightIcon}
                </div> 
                {highlightTitle}
              </h2>
              
              {highlightJadwalList.length > 0 ? (
                viewMode === "me" ? (
                  // ✅ JADWAL SAYA: Langsung jejer kanan-kiri
                  <div className="flex overflow-x-auto gap-3 pb-2 snap-x [&::-webkit-scrollbar]:hidden">
                    {highlightJadwalList.map(item => <ScheduleCard key={item["ID Unik"]} item={item} />)}
                  </div>
                ) : (
                  // ✅ GENERAL: Bungkus per shift
                  <div className="space-y-4">
                    {Object.keys(groupedHighlight).sort().map(shiftKey => {
                      const shiftItems = groupedHighlight[shiftKey];
                      const jurusanGroup = getJurusanInfo(shiftItems[0].Hari, shiftKey);
                      return (
                        <div key={shiftKey} className={`p-4 rounded-3xl border shadow-sm ${highlightBg}`}>
                          <div className="text-sm font-bold mb-4 flex justify-between items-center px-1">
                             <div className="flex items-center gap-3">
                               <div className="flex items-center gap-1.5">
                                 <Clock size={16} className={highlightTitle.includes("Besok") ? "text-amber-500" : "text-blue-600 dark:text-blue-400"} /> {shiftKey}
                               </div>
                               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${jurusanGroup.badge}`}>{jurusanGroup.nama}</span>
                             </div>
                             <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${highlightTitle.includes("Besok") ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                               {getShiftTime(shiftItems[0].Hari, shiftKey)}
                             </span>
                          </div>
                          <div className="flex overflow-x-auto gap-3 pb-1 snap-x [&::-webkit-scrollbar]:hidden">
                            {shiftItems.map(item => <ScheduleCard key={item["ID Unik"]} item={item} />)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-8 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">{isEmptyMsg}</div>
              )}
            </div>

            {viewMode === "me" && stats.total > 0 && (
              <div className="mb-10">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2"><div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg"><Target size={18} /></div> Progress</h2>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                     <div>
                       <p className="text-4xl font-bold">{stats.done} <span className="text-xl text-slate-400 font-medium">/ {stats.total}</span></p>
                     </div>
                     <div className="w-16 h-16 rounded-full border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-sm overflow-hidden relative">
                        <div className="absolute bottom-0 w-full bg-blue-200 dark:bg-blue-500/30 transition-all duration-700 ease-out" style={{ height: `${(stats.done / stats.total) * 100}%` }}></div>
                        <span className="relative z-10">{Math.round((stats.done / stats.total) * 100)}%</span>
                     </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(modStats).sort().map(mod => {
                      const isDone = modStats[mod].done === modStats[mod].total;
                      return (
                        <div key={mod} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${isDone ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400" : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400"}`}>
                           {mod} <span className={`ml-1 ${isDone ? "opacity-70" : ""}`}>{modStats[mod].done}/{modStats[mod].total}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ✅ TABS JADWAL: AKAN DATANG & SELESAI */}
            <div className="mt-8">
              <div className="flex gap-2 mb-6">
                 <button onClick={() => setScheduleTab("upcoming")} className={`py-2 px-5 font-bold text-sm rounded-full transition-colors ${scheduleTab === 'upcoming' ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}>Akan Datang</button>
                 <button onClick={() => setScheduleTab("past")} className={`py-2 px-5 font-bold text-sm rounded-full transition-colors ${scheduleTab === 'past' ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}>Selesai</button>
              </div>

              <div>
                {/* TAB AKAN DATANG */}
                {scheduleTab === "upcoming" && (
                  sortedUpcomingPutaran.length > 0 ? sortedUpcomingPutaran.map((putaran) => (
                    <div key={putaran} className="mb-8">
                      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 pl-1">{putaran}</h2>
                      <div className="grid grid-cols-1 gap-4">
                        {Object.keys(groupedUpcoming[putaran]).sort().map((tanggal) => {
                          const jadwalByShift = groupedUpcoming[putaran][tanggal];
                          const tglDisplay = new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
                          const isExpanded = viewMode === "me" ? true : !!expandedDays[tanggal];
                          
                          // Ambil data hari dari item pertama (karena hari pasti sama dalam 1 tanggal)
                          const hariLabel = Object.values(jadwalByShift)[0][0].Hari;

                          return (
                            <div key={tanggal} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                              <div onClick={() => viewMode === "general" && toggleDayCollapse(tanggal)} className={`p-5 flex items-center justify-between ${viewMode === "general" ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" : ""}`}>
                                <div className="flex items-center gap-4">
                                  <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 p-2.5 rounded-xl"><Calendar size={20} /></div>
                                  <div>
                                    <h3 className="font-bold text-base">{hariLabel}</h3>
                                    <p className="text-xs font-medium text-slate-500">{tglDisplay}</p>
                                  </div>
                                </div>
                                {viewMode === "general" && <div className="text-slate-400 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-full">{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>}
                              </div>
                              {isExpanded && (
                                <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2">
                                  {viewMode === "me" ? (
                                    // JADWAL SAYA: Langsung jejer
                                    <div className="flex overflow-x-auto gap-3 pt-4 pb-2 snap-x [&::-webkit-scrollbar]:hidden">
                                      {Object.values(jadwalByShift).flat().map(item => <ScheduleCard key={item["ID Unik"]} item={item} />)}
                                    </div>
                                  ) : (
                                    // GENERAL: Bungkus per shift
                                    Object.keys(jadwalByShift).sort().map(shiftKey => {
                                      const shiftItems = jadwalByShift[shiftKey];
                                      const jurusanGroup = getJurusanInfo(hariLabel, shiftKey);
                                      return (
                                        <div key={shiftKey} className="border-l-[3px] border-slate-300 dark:border-slate-700 pl-4 mt-4">
                                          <div className="flex items-center gap-3 mb-3">
                                            <div className="text-sm font-bold flex items-center gap-2"><Clock size={16} className="text-blue-600 dark:text-blue-400" /> {shiftKey}</div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${jurusanGroup.badge}`}>{jurusanGroup.nama}</span>
                                          </div>
                                          <div className="flex overflow-x-auto gap-3 pb-2 snap-x [&::-webkit-scrollbar]:hidden">
                                            {shiftItems.map(item => <ScheduleCard key={item["ID Unik"]} item={item} />)}
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )) : <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-slate-400 text-center font-medium border border-slate-200 dark:border-slate-800 shadow-sm text-sm">Belum ada jadwal di depan.</div>
                )}

                {/* TAB SELESAI */}
                {scheduleTab === "past" && (
                  sortedPastPutaran.length > 0 ? (
                    <div>
                      {sortedPastPutaran.map((putaran) => (
                        <div key={`past-${putaran}`} className="mb-6">
                          <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest pl-1 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-blue-500 dark:text-blue-400"/> {putaran}</h3>
                          <div className="grid gap-3">
                            {Object.keys(groupedPast[putaran]).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map((tanggal) => {
                              const itemsByShift = groupedPast[putaran][tanggal];
                              const isExpanded = !!expandedDays[tanggal];
                              const tglDisplay = new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
                              const hariLabel = Object.values(itemsByShift)[0][0].Hari;

                              return (
                                <div key={`past-${tanggal}`} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                  <div onClick={() => toggleDayCollapse(tanggal)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <div className="flex gap-3 items-center">
                                      <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 p-2 rounded-lg"><CheckCircle2 size={16} /></div>
                                      <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">{hariLabel}, {tglDisplay}</h4>
                                    </div>
                                    <div className="text-slate-400">{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
                                  </div>
                                  {isExpanded && (
                                    <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                                      {viewMode === "me" ? (
                                        // JADWAL SAYA: Langsung jejer
                                        <div className="flex overflow-x-auto gap-3 pt-2 pb-1 snap-x [&::-webkit-scrollbar]:hidden">
                                          {Object.values(itemsByShift).flat().map(item => <ScheduleCard key={item["ID Unik"]} item={item} />)}
                                        </div>
                                      ) : (
                                        // GENERAL: Bungkus per shift
                                        <div className="space-y-4 pt-2">
                                          {Object.keys(itemsByShift).sort().map(shiftKey => {
                                            const shiftItems = itemsByShift[shiftKey];
                                            const jurusanGroup = getJurusanInfo(hariLabel, shiftKey);
                                            return (
                                              <div key={shiftKey} className="border-l-2 border-slate-300 dark:border-slate-700 pl-3">
                                                <div className="flex items-center gap-3 mb-3">
                                                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Clock size={14} className="text-blue-500 dark:text-blue-400"/> {shiftKey}</div>
                                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${jurusanGroup.badge}`}>{jurusanGroup.nama}</span>
                                                </div>
                                                <div className="flex overflow-x-auto gap-3 snap-x [&::-webkit-scrollbar]:hidden">
                                                  {shiftItems.map(item => <ScheduleCard key={item["ID Unik"]} item={item} />)}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-slate-400 text-center font-medium border border-slate-200 dark:border-slate-800 shadow-sm text-sm">Belum ada shift yang beres.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}