"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, User, LogOut, LayoutGrid, CalendarDays, ChevronDown, ChevronUp, AlertCircle, Bookmark, FolderOpen, Lock, KeyRound } from "lucide-react";

type Jadwal = {
  "ID Unik": string;
  Tanggal: string;
  Hari: string;
  Modul: string;
  Shift: string;
  "Nama Co-Ass": string;
};

// =============================================
// PENGATURAN UTAMA
// =============================================
const API_URL = "https://script.google.com/macros/s/AKfycbwpkuTVeY7cg697mbxXM-qv6-fX8KYFdQkeRYSVtQ0Sl1aQs-k5kTSlJzY5MBQqEA66iQ/exec";
const GDRIVE_FOLDER_ID: string = "1NKRgEruaIcHDB0XEqm5MarWXqlZivoWd"; 
const SECRET_PASSCODE = "Co-Ass24TheBest";
// =============================================

const ALL_COASS = ["Nadya", "Anop", "Vega", "Hasna", "Nadian", "Nisa", "Najib", "Nay", "Jeje", "Riyat", "Hamud", "Luki", "Nanta", "Cece"];

export default function Home() {
  const [data, setData] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<"me" | "general" | "files">("me");
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }

    const savedUnlock = localStorage.getItem("appUnlocked");
    const savedUser = localStorage.getItem("coassName");
    
    if (savedUnlock === "true") setIsUnlocked(true);
    if (savedUser) setCurrentUser(savedUser);
    
    if (savedUnlock === "true" && savedUser) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Gagal narik data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === SECRET_PASSCODE) {
      localStorage.setItem("appUnlocked", "true");
      setIsUnlocked(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setPasscodeInput("");
    }
  };

  const handleLogin = (name: string) => {
    localStorage.setItem("coassName", name);
    setCurrentUser(name);
    fetchData(); 
  };

  const handleLogout = () => {
    localStorage.removeItem("coassName");
    setCurrentUser(null);
    setViewMode("me");
  };

  const toggleDayCollapse = (tanggal: string) => {
    setExpandedDays(prev => ({ ...prev, [tanggal]: !prev[tanggal] }));
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
    return "Putaran Ekstra";
  };

  const getJurusanInfo = (hari: string, shift: string) => {
    const h = hari.toLowerCase();
    const s = parseInt(shift.replace("Shift ", ""));
    const isMetal = (h === "senin" && (s === 1 || s === 4)) || (h === "selasa" && (s === 1 || s === 3)) || (h === "rabu" && s === 4) || ((h === "jumat" || h === "jum'at") && s === 1) || (h === "sabtu" && s === 1);
    const isIndustri = (h === "senin" && s === 3) || (h === "rabu" && (s === 1 || s === 3)) || (h === "kamis" && (s === 2 || s === 3)) || ((h === "jumat" || h === "jum'at") && s === 3) || (h === "sabtu" && s === 2);
                       
    if (isMetal) return { 
      nama: "Metalurgi", 
      style: "bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-200 hover:border-orange-300 dark:hover:border-orange-500/40 transition-colors", 
      badge: "bg-orange-200 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300" 
    };
    if (isIndustri) return { 
      nama: "Industri", 
      style: "bg-green-50 border-green-200 text-green-900 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-200 hover:border-green-300 dark:hover:border-green-500/40 transition-colors", 
      badge: "bg-green-200 text-green-800 dark:bg-green-500/20 dark:text-green-300" 
    };
    return { 
      nama: "Kimia", 
      style: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900 dark:bg-fuchsia-500/10 dark:border-fuchsia-500/20 dark:text-fuchsia-200 hover:border-fuchsia-300 dark:hover:border-fuchsia-500/40 transition-colors", 
      badge: "bg-fuchsia-200 text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-300" 
    };
  };

  const getTodayStr = () => {
    return new Date().toLocaleDateString('en-CA'); 
  };

  // ==========================================
  // UI: 1. PINTU GERBANG (LOGIN KODE)
  // ==========================================
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl dark:shadow-2xl max-w-sm w-full text-center border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Akes Terbatas!</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">Masukkan kode untuk melihat jadwal.</p>
          
          <form onSubmit={handleUnlock}>
            <input 
              type="password" 
              placeholder="Ketik kode di sini..." 
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              className={`w-full text-center tracking-widest font-bold py-3 px-4 rounded-xl border-2 outline-none transition-all mb-4 uppercase text-slate-900 dark:text-white dark:bg-slate-900 ${passcodeError ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400 dark:border-red-500/50" : "border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:focus:border-blue-500/50"}`}
            />
            {passcodeError && <p className="text-xs text-red-500 dark:text-red-400 font-bold mb-4 animate-bounce">Kode salah!</p>}
            
            <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
              <KeyRound size={18} /> Buka
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI: 2. LAYAR PILIH NAMA
  // ==========================================
  if (isUnlocked && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl dark:shadow-2xl max-w-md w-full text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Jadwal Co-Ass</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">Pilih untuk masuk ke dashboard.</p>
          <div className="grid grid-cols-2 gap-3">
            {ALL_COASS.sort().map((name) => (
              <button key={name} onClick={() => handleLogin(name)} className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800/50 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:text-slate-200 rounded-xl transition-all font-medium text-slate-700 dark:hover:text-white">
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const todayStr = getTodayStr();
  const displayedData = viewMode === "me" ? data.filter((d) => d["Nama Co-Ass"] === currentUser) : data;
  
  const jadwalHariIni = displayedData.filter(d => d.Tanggal === todayStr);
  const jadwalMendatang = displayedData.filter(d => d.Tanggal !== todayStr);

  const groupedSchedule: Record<string, Record<string, Record<string, Jadwal[]>>> = {};
  const dataToGroup = viewMode === "me" ? jadwalMendatang : displayedData;

  dataToGroup.forEach((item) => {
    const putaran = getPutaran(item.Tanggal);
    if (!groupedSchedule[putaran]) groupedSchedule[putaran] = {};
    if (!groupedSchedule[putaran][item.Tanggal]) groupedSchedule[putaran][item.Tanggal] = {};
    if (!groupedSchedule[putaran][item.Tanggal][item.Shift]) groupedSchedule[putaran][item.Tanggal][item.Shift] = [];
    groupedSchedule[putaran][item.Tanggal][item.Shift].push(item);
  });

  const sortedPutaran = Object.keys(groupedSchedule).sort();

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
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide inline-block mb-2 ${jurusan.badge}`}>
            {jurusan.nama}
          </span>
          <div className="font-black text-xl mb-1 truncate dark:text-white">Modul {item.Modul}</div>
        </div>
        {viewMode === "general" && (
          <div className="text-sm font-semibold flex items-center gap-1.5 mt-3 opacity-90 bg-white/60 dark:bg-slate-950/40 p-2 rounded-lg truncate dark:text-slate-300">
            <User size={16} /> {item["Nama Co-Ass"]}
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // UI: 3. MAIN DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors duration-300">
      <nav className="bg-white dark:bg-slate-900 shadow-sm dark:shadow-none sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 dark:bg-blue-500 text-white p-2.5 rounded-xl"><User size={20} /></div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-white leading-tight">Halo, {currentUser}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Co-Ass Lab Fister</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button onClick={() => setViewMode("files")} className={`p-2.5 rounded-full transition-colors ${viewMode === 'files' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'}`}>
              <FolderOpen size={20} />
            </button>
            <button onClick={handleLogout} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2.5 bg-transparent rounded-full hover:bg-red-50 dark:hover:bg-red-500/10">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        {viewMode !== "files" && (
          <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm dark:shadow-none mb-8 w-fit mx-auto border border-slate-200 dark:border-slate-800">
            <button onClick={() => setViewMode("me")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "me" ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"}`}>
              <CalendarDays size={18} /> Jadwal Saya
            </button>
            <button onClick={() => setViewMode("general")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "general" ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"}`}>
              <LayoutGrid size={18} /> General
            </button>
          </div>
        )}

        {viewMode === "files" && (
          <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={() => setViewMode("me")} className="mb-6 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1">
               ← Kembali
            </button>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <FolderOpen className="text-blue-600 dark:text-blue-400" size={24} /> File
              </h2>
              <a href={`https://drive.google.com/drive/folders/${GDRIVE_FOLDER_ID}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">Buka</a>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-[60vh] min-h-[500px]">
              {GDRIVE_FOLDER_ID === "GANTI_ID_FOLDER_DRIVE_DISINI" ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
                  <FolderOpen size={48} className="mb-4 opacity-50" />
                  <p className="font-medium">ID Google Drive belum dimasukin!</p>
                </div>
              ) : (
                <iframe src={`https://drive.google.com/embeddedfolderview?id=${GDRIVE_FOLDER_ID}#grid`} width="100%" height="100%" style={{ border: "none" }} title="Google Drive Co-Ass"></iframe>
              )}
            </div>
          </div>
        )}

        {loading && viewMode !== "files" && (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400 animate-pulse font-medium">
            Sabarr, lagi ambil jadwal dari Google Sheets...
          </div>
        )}

        {!loading && viewMode === "me" && (
          <div className="mb-10 animate-in fade-in duration-500">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="text-blue-600 dark:text-blue-400" size={22} /> Jadwal Hari Ini
            </h2>
            {jadwalHariIni.length > 0 ? (
              <div className="space-y-4">
                {Object.keys(groupedHariIni).sort().map(shiftKey => {
                  const shiftItems = groupedHariIni[shiftKey];
                  const hari = shiftItems[0].Hari;
                  return (
                    <div key={shiftKey} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800">
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                         <div className="flex items-center gap-2"><Clock size={16} className="text-blue-500 dark:text-blue-400" /> {shiftKey}</div>
                         <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{getShiftTime(hari, shiftKey)}</span>
                      </div>
                      <div className="flex overflow-x-auto gap-3 snap-x [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {shiftItems.map(item => <ScheduleCard key={item["ID Unik"]} item={item} />)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center text-slate-500 dark:text-slate-400">
                Alhamdulillah gaada jadwal, hari ini bisa tidur nyenyak.
              </div>
            )}
          </div>
        )}

        {!loading && viewMode !== "files" && sortedPutaran.map((putaran) => (
          <div key={putaran} className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-2 pl-1">
              <Bookmark className="text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-500/20" size={22} /> {putaran}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {Object.keys(groupedSchedule[putaran]).sort().map((tanggal) => {
                const jadwalByShift = groupedSchedule[putaran][tanggal];
                const firstShift = Object.values(jadwalByShift)[0];
                const hari = firstShift[0]?.Hari || "";
                const tglDisplay = new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
                const isExpanded = viewMode === "me" ? true : !!expandedDays[tanggal];

                return (
                  <div key={tanggal} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden transition-all">
                    <div onClick={() => viewMode === "general" && toggleDayCollapse(tanggal)} className={`p-4 flex items-center justify-between ${viewMode === "general" ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" : ""} ${isExpanded && viewMode === "general" ? "border-b border-slate-100 dark:border-slate-800" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 p-2.5 rounded-xl"><Calendar size={20} /></div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white">{hari}</h3>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{tglDisplay}</p>
                        </div>
                      </div>
                      {viewMode === "general" && (
                        <div className="text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-lg">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="p-4 pt-4 space-y-4 bg-slate-50/80 dark:bg-slate-950/50 border-t border-slate-50 dark:border-slate-800/50">
                        {Object.keys(jadwalByShift).sort().map(shiftKey => {
                          const itemsDiShiftIni = jadwalByShift[shiftKey];
                          return (
                            <div key={shiftKey} className="border-l-2 border-blue-200 dark:border-blue-800 pl-3">
                              <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Clock size={16} className="text-blue-500 dark:text-blue-400" /> {shiftKey} 
                                <span className="text-xs text-slate-500 dark:text-slate-500 font-normal">({getShiftTime(hari, shiftKey)})</span>
                              </div>
                              <div className="flex overflow-x-auto gap-3 pb-2 snap-x [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {itemsDiShiftIni.map(item => <ScheduleCard key={item["ID Unik"]} item={item} />)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
