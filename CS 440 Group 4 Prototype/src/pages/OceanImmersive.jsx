// src/pages/OceanImmersive.jsx
import React, { Suspense, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Link } from "react-router-dom";
import oceanSpeciesData from "../data/oceanSpecies.json";

class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // no-op: could log if needed
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-sm text-red-300">
          Something went wrong in the 3D scene.
        </div>
      );
    }
    return this.props.children;
  }
}

const OCEAN_COLOR = "#0b3d5a";
const WATER_SURFACE_COLOR = "#2aa7c7";
// Use capsule geometry if available in this three build; otherwise fall back to a sphere in FishSchool
const HAS_CAPSULE = !!(THREE.CapsuleGeometry || THREE.CapsuleBufferGeometry);

/* ------------ MarineSpecies (safe, no-crash texture loading) ------------ */
function MarineSpecies({ species = [] }) {
  const placeholder =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/az2nV8AAAAASUVORK5CYII=";

  // Precompute movement params for each fish
  const fishes = useMemo(() => {
    return species.map((s, i) => ({
      id: s.id ?? `fish-${i}`,
      name: s.name,
      url: s.imageUrl || placeholder,
      base: new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 30
      ),
      size: 1 + Math.random() * 1.8,
      speed: 0.4 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [species]);

  const meshRefs = useRef([]);
  const matRefs = useRef([]);

  // Attach textures imperatively so failures don't crash the scene
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    fishes.forEach((f, i) => {
      const mat = matRefs.current[i];
      if (!mat || !f.url) return;

      loader.load(
        f.url,
        (tex) => {
          if ("SRGBColorSpace" in THREE) {
            tex.colorSpace = THREE.SRGBColorSpace;
          } else {
            tex.encoding = THREE.sRGBEncoding;
          }
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          mat.map = tex;
          mat.needsUpdate = true;
        },
        undefined,
        // On error, keep placeholder — no throw = no crash
        () => {}
      );
    });
  }, [fishes]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    meshRefs.current.forEach((mesh, i) => {
      const f = fishes[i];
      if (!mesh || !f) return;

      const x = f.base.x + Math.sin(t * f.speed + f.phase) * 2.2;
      const y = f.base.y + Math.sin(t * f.speed * 1.7 + f.phase) * 0.6;
      const z = f.base.z + Math.cos(t * f.speed + f.phase) * 2.0;

      mesh.position.set(x, y, z);
      mesh.lookAt(x + Math.cos(t + f.phase), y, z - Math.sin(t + f.phase));
    });
  });

  if (!species.length) return null;

  return (
    <>
      {fishes.map((f, i) => (
        <mesh
          key={f.id}
          ref={(el) => (meshRefs.current[i] = el)}
          position={f.base}
          scale={f.size}
        >
          <planeGeometry args={[1.8, 1.2]} />
          <meshBasicMaterial
            ref={(el) => (matRefs.current[i] = el)}
            color="#e0f2fe"      // visible placeholder tint
            transparent
            alphaTest={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}

/* ----------------------------- Scene Environment ----------------------------- */
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[10, 20, -5]}
        intensity={0.6}
        color={WATER_SURFACE_COLOR}
      />
      <directionalLight
        position={[-8, 5, 8]}
        intensity={0.15}
        color={"#7dd3fc"}
      />
    </>
  );
}

function EnvironmentFog() {
  return <fog attach="fog" args={[OCEAN_COLOR, 2, 80]} />;
}

function WaterSurface() {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) ref.current.rotation.z = Math.sin(t * 0.15) * 0.03;
  });
  return (
    <mesh ref={ref} position={[0, 10, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[500, 500]} />
      <meshPhysicalMaterial
        color={WATER_SURFACE_COLOR}
        transparent
        opacity={0.15}
        roughness={0.9}
      />
    </mesh>
  );
}

function Seabed() {
  return (
    <mesh position={[0, -20, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color={"#073047"} />
    </mesh>
  );
}

/* ---------------------------------- Bubbles ---------------------------------- */
function Bubbles({ count = 140 }) {
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3 + 0] = (Math.random() - 0.5) * 60;
      p[i * 3 + 1] = Math.random() * 30 - 12;
      p[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    return p;
  }, [count]);

  const ref = useRef();
  useFrame((_, delta) => {
    const arr = ref.current.geometry.attributes.position.array;
    for (let i = 1; i < arr.length; i += 3) {
      arr[i] += 2.5 * delta;
      if (arr[i] > 12) arr[i] = -12 - Math.random() * 10;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color={"#a5f3fc"}
        transparent
        opacity={0.75}
      />
    </points>
  );
}

/* -------------------------------- Fish School -------------------------------- */
function FishSchool({ count = 160, color = "#93c5fd" }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        baseX: (Math.random() - 0.5) * 60,
        baseY: Math.random() * 10 - 6,
        baseZ: (Math.random() - 0.5) * 60,
        speed: 0.5 + Math.random() * 0.8,
        amp: 1 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        size: 0.18 + Math.random() * 0.35,
      });
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    data.forEach((f, i) => {
      const x = f.baseX + Math.sin(t * f.speed + f.phase) * f.amp * 2.0;
      const y = f.baseY + Math.sin(t * f.speed * 1.7 + f.phase) * 0.6;
      const z = f.baseZ + Math.cos(t * f.speed + f.phase) * f.amp * 1.2;

      dummy.position.set(x, y, z);
      const dx = Math.cos(t * f.speed + f.phase);
      const dz = -Math.sin(t * f.speed + f.phase);
      dummy.lookAt(x + dx, y, z + dz);
      dummy.scale.setScalar(f.size);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      {HAS_CAPSULE ? (
        <capsuleGeometry args={[1, 2, 2, 6]} />
      ) : (
        <sphereGeometry args={[0.6, 12, 12]} />
      )}
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} />
    </instancedMesh>
  );
}

export default function OceanImmersive() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400/15 ring-1 ring-cyan-400/30">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className="text-cyan-300">
              <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">Wild Realms</span>
        </div>
        <Link to="/biomes" className="rounded-full px-4 py-2 text-sm ring-1 ring-white/20 hover:bg-white/10">
          Back to Biomes
        </Link>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-10">
        <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl" style={{ height: 640 }}>
          <SceneErrorBoundary>
            <Canvas
              camera={{ position: [0, 0, 8], fov: 55 }}
              gl={{ antialias: true, alpha: false }}
              onCreated={({ scene }) => {
                scene.background = new THREE.Color(OCEAN_COLOR);
              }}
            >
              <Suspense fallback={<mesh>
                <meshBasicMaterial />
              </mesh>}>
                <EnvironmentFog />
                <SceneLighting />
                <WaterSurface />
                <Seabed />
                <Bubbles count={140} />
                <FishSchool count={180} color="#93c5fd" />
                <MarineSpecies species={oceanSpeciesData.species} />
                <OrbitControls enablePan={false} minDistance={4} maxDistance={18} maxPolarAngle={Math.PI * 0.6} />
              </Suspense>
            </Canvas>
          </SceneErrorBoundary>
        </div>
      </main>

      <footer className="mt-auto mx-auto flex w-full max-w-7xl items-center justify-between px-6 pb-10 pt-6 text-sm text-white/75">
        <div>© {new Date().getFullYear()} Wild Realms • Built for learning & analysis</div>
      </footer>
    </div>
  );
}