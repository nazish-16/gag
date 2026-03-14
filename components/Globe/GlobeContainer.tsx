"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { Overlay } from "../UI/Overlay";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <Loader2 className="animate-spin text-green-500 w-8 h-8 opacity-50" />
    </div>
  ),
});

export function GlobeContainer() {
  const [data, setData] = useState<any[]>([]);
  const [countries, setCountries] = useState<any>({ features: [] });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const globeRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (globeRef.current) {
        globeRef.current.pointOfView({ 
          altitude: window.innerWidth < 768 ? 3.5 : 2.5 
        }, 500);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/globe-activity?range=24h");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch globe activity", err);
      } finally {
        setLoading(false);
      }
    }

    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries)
      .catch(err => console.error("Failed to fetch world atlas", err));
    
    fetchActivity();
    const interval = setInterval(fetchActivity, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (globeRef.current && !loading) {
      const globe = globeRef.current;
      
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.5;
      
      const isMob = window.innerWidth < 768;
      globe.pointOfView({ 
        lat: 20, 
        lng: 0, 
        altitude: isMob ? 3.8 : 2.5 
      });
    }
  }, [loading]);

  if (loading && data.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10 pointer-events-none">
         <Loader2 className="animate-spin text-green-500 w-8 h-8 opacity-50" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#000000]">
      <div className="absolute inset-0">
        <Globe
          ref={globeRef}
          backgroundColor="rgba(0,0,0,0)"
          backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
          showAtmosphere={false}
          
          polygonsData={countries.features}
          polygonCapColor={() => "rgba(45, 62, 80, 0.8)"}
          polygonSideColor={() => "rgba(20, 30, 45, 0.5)"} 
          polygonStrokeColor={() => "#4da3ff"}
          polygonLabel={(d: any) => `
            <div class="px-2 py-1 bg-black/80 rounded border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
              ${d.properties.NAME}
            </div>
          `}
          
          pointsData={data}
          pointLat="lat"
          pointLng="lng"
          pointColor={() => "#4ade80"}
          pointAltitude={0.01}
          pointRadius={0.25}
          pointsMerge={false}
          pointLabel={(d: any) => `
            <div class="bg-black/95 text-white p-3 rounded-lg border border-white/10 shadow-3xl backdrop-blur-xl min-w-[220px]">
              <div class="flex items-center justify-between mb-2">
                <span class="bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter border border-green-500/20">
                  ${d.type.replace('Event', '')}
                </span>
                <span class="text-[9px] opacity-40 font-mono">${new Date(d.timestamp).toLocaleTimeString()}</span>
              </div>
              <div class="text-[14px] font-bold mb-1 truncate text-blue-400">${d.repo}</div>
              <div class="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                <img src="${d.avatar}" class="w-6 h-6 rounded-full border border-white/10 shadow-sm" />
                <span class="text-[12px] font-medium opacity-80">@${d.actor}</span>
              </div>
            </div>
          `}
          onPointClick={(d: any) => {
            window.open(`https://github.com/${d.repo}`, '_blank');
          }}
        />
      </div>

      <Overlay />
    </div>
  );
}
