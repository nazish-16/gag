"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, Stars, Html, useTexture } from "@react-three/drei";
import { Github, Activity, MapPin } from "lucide-react";

type GlobeEvent = {
  id?: string | number;
  lat: number;
  lng: number;
  intensity: number;
  type: string;
  timestamp: string;
  repo: string;
  actor: string;
  avatar: string;
  location: string;
};

function latLongToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

function RealisticEarth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [dayMap, normalMap, specularMap, cloudsMap] = useTexture([
    "/earth_daymap.png",
    "/earth_normal_map.png",
    "/earth_specular_map.png",
    "/earth_clouds.png",
  ]);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.02;
    }

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.024;
    }
  });

  return (
    <group>
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[2, 128, 128]} />
        <meshPhongMaterial
          map={dayMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          specularMap={specularMap}
          specular={new THREE.Color("#2b2b2b")}
          shininess={22}
        />
      </mesh>

      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.012, 128, 128]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.14}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh scale={[1.045, 1.045, 1.045]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color="#4da3ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={[1.08, 1.08, 1.08]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color="#7fc7ff"
          transparent
          opacity={0.025}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function Globe({ data }: { data: GlobeEvent[] }) {
  const globeGroupRef = useRef<THREE.Group>(null);
  const markersGroupRef = useRef<THREE.Group>(null);
  const [hoveredEvent, setHoveredEvent] = useState<GlobeEvent | null>(null);

  useFrame(() => {
    if (globeGroupRef.current && !hoveredEvent) {
      globeGroupRef.current.rotation.y += 0.00022;
    }

    if (markersGroupRef.current && globeGroupRef.current) {
      markersGroupRef.current.rotation.y = globeGroupRef.current.rotation.y;
    }
  });

  const markers = useMemo(() => {
    return data.map((d) => ({
      ...d,
      position: latLongToVector3(d.lat, d.lng, 2.03),
    }));
  }, [data]);

  const markerColor = "#22c55e";
  const markerHoverColor = "#ffffff";

  return (
    <>
      <group ref={globeGroupRef}>
        <RealisticEarth />
      </group>

      <group ref={markersGroupRef}>
        {markers.map((marker, i) => {
          const isHovered = hoveredEvent?.id === marker.id;

          return (
            <group
              key={marker.id || i}
              position={marker.position}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredEvent(marker);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHoveredEvent(null);
                document.body.style.cursor = "auto";
              }}
            >
              <mesh>
                <sphereGeometry
                  args={[
                    Math.max((isHovered ? 0.02 : 0.011) * marker.intensity, 0.01),
                    14,
                    14,
                  ]}
                />
                <meshBasicMaterial
                  color={isHovered ? markerHoverColor : markerColor}
                  toneMapped={false}
                />
              </mesh>

              <mesh>
                <sphereGeometry
                  args={[
                    Math.max((isHovered ? 0.04 : 0.024) * marker.intensity, 0.022),
                    12,
                    12,
                  ]}
                />
                <meshBasicMaterial
                  color={isHovered ? markerHoverColor : markerColor}
                  transparent
                  opacity={isHovered ? 0.18 : 0.08}
                  toneMapped={false}
                />
              </mesh>

              <mesh visible={false}>
                <sphereGeometry args={[0.09, 16, 16]} />
                <meshBasicMaterial />
              </mesh>

              {isHovered && (
                <Html center distanceFactor={10} className="pointer-events-auto">
                  <div className="w-48 rounded-lg border border-white/10 bg-black/85 px-3 py-2 text-left shadow-2xl backdrop-blur-xl">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-green-400">
                        <Activity size={8} />
                        {marker.type.replace("Event", "")}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400">
                        {new Date(marker.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <a
                      href={`https://github.com/${marker.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link mt-1 flex flex-col gap-0.5 no-underline"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold leading-tight text-white transition-colors group-hover/link:text-blue-400">
                        <Github size={12} className="shrink-0 opacity-90" />
                        <span className="truncate">{marker.repo}</span>
                      </div>

                      <div className="mt-0.5 flex items-center gap-1.5">
                        <img
                          src={marker.avatar}
                          alt="avatar"
                          className="h-4 w-4 rounded-full border border-white/10 shadow-sm"
                        />
                        <span className="truncate text-[10px] font-semibold leading-none text-white">
                          @{marker.actor}
                        </span>
                      </div>

                      <div className="mt-0.5 flex items-center gap-1 text-[9px] text-zinc-400">
                        <MapPin size={8} className="text-blue-400" />
                        <span className="truncate">{marker.location}</span>
                      </div>
                    </a>
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>
    </>
  );
}

export function Scene({ data }: { data: GlobeEvent[] }) {
  return (
    <>
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 12, 40]} />

      <Stars radius={300} depth={80} count={7000} factor={3} fade speed={0.4} />

      <ambientLight intensity={0.16} />

      <directionalLight
        position={[8, 3, 5]}
        intensity={2.6}
        color="#ffffff"
        castShadow
      />

      <directionalLight
        position={[-6, -2, -5]}
        intensity={0.12}
        color="#5d7896"
      />

      <pointLight position={[0, 0, 8]} intensity={0.35} color="#7db8ff" />

      <Globe data={data} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={2.6}
        maxDistance={10}
        enableDamping
        dampingFactor={0.045}
        rotateSpeed={0.42}
        zoomSpeed={0.8}
        autoRotate={false}
      />
    </>
  );
}