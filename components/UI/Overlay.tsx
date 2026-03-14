"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Activity, MapPin, BarChart3, Globe2, RefreshCcw, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GlobeEvent {
  id: string;
  type: string;
  repo: string;
  actor: string;
  avatar: string;
  location: string;
  timestamp: string;
  intensity?: number;
}

export function Overlay() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<GlobeEvent[]>([]);
  const [stats, setStats] = useState({ pushes: 0, prs: 0, issues: 0, total: 0 });
  const [isStreamOpen, setIsStreamOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const fetchLive = () => {
      const t = Date.now();
      fetch(`/api/globe-activity?range=24h&t=${t}`)
        .then(res => {
          if (!res.ok) throw new Error(`API error: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setEvents(data);
            const pushes = data.filter((e: GlobeEvent) => e.type === "PushEvent").length;
            const prs = data.filter((e: GlobeEvent) => e.type === "PullRequestEvent").length;
            const issues = data.filter((e: GlobeEvent) => e.type === "IssuesEvent").length;
            setStats({ pushes, prs, issues, total: data.length });
          }
        })
        .catch(err => {
          console.error("HUD failed to fetch", err);
        });
    };

    fetchLive();
    const int = setInterval(fetchLive, 10000); 
    return () => clearInterval(int);
  }, []);

  if (!mounted) return null;

  const topCities = events.reduce((acc, ev) => {
    acc[ev.location] = (acc[ev.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCities = (Object.entries(topCities) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between p-4 lg:p-10 overflow-hidden font-sans">
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex justify-between items-start"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg lg:text-3xl font-bold font-title tracking-tighter uppercase text-white drop-shadow">
              GAG
            </h1>
          </div>
          <p className="hidden md:block text-[10px] lg:text-xs uppercase tracking-widest opacity-60 text-zinc-400 font-mono font-medium max-w-md leading-relaxed">
            Real time visual telemetry of open-source development activity straight from the Github Archives
          </p>
        </div>
      </motion.div>

      {/* 📊 Sidebar Stats: Responsive Hide */}
      <div className="flex justify-between items-end flex-grow mb-6 gap-6">
        
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="hidden lg:flex w-72 flex-col gap-8 pointer-events-auto"
        >
           <div className="p-5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-lg">
             <div className="flex items-center gap-2 mb-4 text-[10px] font-mono uppercase tracking-widest font-bold opacity-60 text-white">
               <BarChart3 size={14} /> Global Volume
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <div className="text-2xl font-title font-bold leading-none text-white">{stats.total}</div>
                   <div className="text-[9px] text-green-500 font-mono mt-1">+10s Sync</div>
                </div>
                <div>
                   <div className="text-xl font-title leading-none opacity-80 text-white">{stats.pushes}</div>
                   <div className="text-[9px] opacity-60 font-mono mt-1 uppercase text-zinc-400">Commits</div>
                </div>
                <div>
                   <div className="text-xl font-title leading-none opacity-80 text-white">{stats.prs}</div>
                   <div className="text-[9px] opacity-60 font-mono mt-1 uppercase text-zinc-400">Pull Req</div>
                </div>
                <div>
                   <div className="text-xl font-title leading-none opacity-80 text-white">{stats.issues}</div>
                   <div className="text-[9px] opacity-60 font-mono mt-1 uppercase text-zinc-400">Issues</div>
                </div>
             </div>
           </div>

           <div className="p-5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-lg">
             <div className="flex items-center gap-2 mb-4 text-[10px] font-mono uppercase tracking-widest font-bold opacity-60 text-white">
               <MapPin size={14} /> Active Tech Hubs
             </div>
             <div className="flex flex-col gap-3 text-xs font-medium">
                {sortedCities.map(([city, count], i) => (
                  <div key={city} className="flex justify-between items-center text-white">
                     <span className="truncate">{i + 1}. {city}</span>
                     <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                       {count}
                     </span>
                  </div>
                ))}
             </div>
           </div>
        </motion.div>

        {/* 📜 Event Stream: Mobile Floating Panel */}
        <div className="w-full lg:w-80 pointer-events-auto relative">
          
          {/* Mobile Toggle Button */}
          <div className="lg:hidden flex justify-center mb-4">
            <button 
              onClick={() => setIsStreamOpen(!isStreamOpen)}
              className="px-6 py-3 rounded-full bg-zinc-900/90 border border-white/20 shadow-2xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md active:scale-95 transition-transform"
            >
              <Activity size={14} className={`${isStreamOpen ? "text-red-500" : "text-green-500 animate-pulse"}`} />
              {isStreamOpen ? "Hide Stream" : "Expand Stream"}
            </button>
          </div>

          <motion.div
            initial={false}
            animate={{ 
              height: typeof window !== 'undefined' && window.innerWidth < 1024 
                ? (isStreamOpen ? "50vh" : "0px") 
                : "400px",
              opacity: typeof window !== 'undefined' && window.innerWidth < 1024 
                ? (isStreamOpen ? 1 : 0) 
                : 1
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col overflow-hidden bg-black/60 backdrop-blur-2xl border border-white/10 rounded-t-xl lg:rounded-xl shadow-2xl"
          >
            <div className="p-5 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest font-bold opacity-60 text-white">
                  <Activity size={14}/> Live Feed
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      const t = Date.now();
                      fetch(`/api/globe-activity?range=24h&force=true&t=${t}`)
                        .then(res => res.json())
                        .then(data => setEvents(data));
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                  >
                    <RefreshCcw size={14} />
                  </button>
                  <button onClick={() => setIsStreamOpen(false)} className="lg:hidden p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                  {events.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] opacity-50 font-mono pt-4 text-center text-white">
                      Awaiting global signal...
                    </motion.div>
                  )}
                  {events.slice(0, 15).map((ev) => (
                    <motion.a 
                      key={ev.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      href={`https://github.com/${ev.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-1.5 text-white bg-white/5 border border-white/5 p-3 rounded-lg hover:border-blue-500/30 transition-all group no-underline"
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono text-[8px] uppercase tracking-widest font-bold text-green-400 px-1.5 py-0.5 rounded border border-green-400/20 bg-green-400/5">
                          {ev.type.replace('Event', '')}
                        </span>
                        <span className="text-[9px] opacity-40 font-mono group-hover:opacity-80 transition-opacity">
                          {formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="text-xs font-semibold truncate flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                        <Github size={12} className="opacity-70 flex-shrink-0"/> {ev.repo}
                      </div>
                      <div className="flex justify-between items-center pt-1 mt-1 border-t border-white/5">
                        <div className="text-[10px] opacity-70 flex items-center gap-2 font-medium">
                          <img src={ev.avatar} alt="avatar" className="w-4 h-4 rounded-full border border-white/10 shadow-sm" />
                          <span>@{ev.actor}</span>
                        </div>
                        <span className="text-[8px] opacity-30 truncate max-w-[80px] font-mono uppercase tracking-tighter">{ev.location}</span>
                      </div>
                    </motion.a>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
