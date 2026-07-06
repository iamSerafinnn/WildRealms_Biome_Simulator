// src/pages/TundraImmersive.jsx
/* ----------------------------- Required Import Files ----------------------------- */
import React, { Suspense, useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, useTexture, PointerLockControls } from "@react-three/drei";
import { Link } from "react-router-dom";
import tundraModels from "../data/tundraModels.mjs";
import {
    useDiscoveryGame,
    GameModeSelection,
    StartGameOverlay,
    AnimalCounter,
    VictoryOverlay
} from "../components/DiscoveryGame.jsx";
import {
    useChallengeGame,
    StartChallengeOverlay,
    ChallengeCounter,
    ChallengeVictoryOverlay
} from "../components/ChallengeGame.jsx";
import { Const } from "three/tsl";


/* ----------------------------- Occupied Positions For Fixed Models ----------------------------- */
const occupiedPositions= [];


/* ----------------------------- Functions For Mountains ----------------------------- */
const TERRAIN_NOISE = (x, z) => {
    return (
        Math.sin(x * 0.08) * Math.cos(z * 0.08) * 3 +
        Math.sin(x * 0.04) * Math.sin(z * 0.06) * 5 +
        Math.cos(x * 0.02) * Math.sin(z * 0.03) * 8 +
        Math.sin(x * 0.12) * Math.cos(z * 0.10) * 1.5
    );
};


/* ----------------------------- Environment Boundary ----------------------------- */
class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Scene error:", error, info);
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


/* ----------------------------- Scene Lighting ----------------------------- */
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.1} color ="#a5c9ff" />
      <directionalLight
        position={[10, 20, 5]}
        intensity={1.2}
        color={"#f3f6ff"}
      />
      <directionalLight
        position={[-5, 10, -10]}
        intensity={1.2}
        color={"#7dd3fc"}
      />
      <pointLight
        position={[0, 5, 0]}
        intensity={0.4}
        color="#e8f0ff"
        distance={20} 
      />
    </>
  );
}


/* ----------------------------- Environment Color ----------------------------- */
const TUNDRA_COLOR = "#1a2336";
const SNOW_COLOR = "#dfefff";


/* ----------------------------- Addition of Fog ----------------------------- */
function EnvironmentFog() {
  //Color of Enviroment Fog
  return <fog attach="fog" args={[TUNDRA_COLOR, 2, 200]} />;
}

/* ----------------------------- Background Sound Component ----------------------------- */
function TundraAmbience({ url = "/sounds/tundraBackground.wav", volume = 0.3, muted = false }) {
  const { camera } = useThree();
  const listenerRef = useRef(null);
  const soundRef = useRef(null);

  // Setup audio listener and sound
  useEffect(() => {
    const listener = new THREE.AudioListener();
    listenerRef.current = listener;
    camera.add(listener);

    const sound = new THREE.Audio(listener);
    soundRef.current = sound;

    const loader = new THREE.AudioLoader();
    loader.load(url, (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(muted ? 0 : volume);
    });

    return () => {
      if (sound?.isPlaying) sound.stop();
      if (listener) camera.remove(listener);
    };
  }, [camera, url]);

  // Update volume when muted state changes
  useEffect(() => {
    const sound = soundRef.current;
    if (sound) {
      sound.setVolume(muted ? 0 : volume);
    }
  }, [muted, volume]);

  // Auto-play on first user interaction
  useEffect(() => {
    const start = async () => {
      const listener = listenerRef.current;
      const sound = soundRef.current;
      if (!listener || !sound) return;
      
      // Resume audio context if suspended (required by browsers)
      if (listener.context.state === "suspended") {
        await listener.context.resume();
      }
      
      // Start playing if buffer is loaded
      if (sound.buffer && !sound.isPlaying) {
        sound.play();
      }
      
      // Remove listeners after first interaction
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };

    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });

    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, []);

  return null;
}

/* ----------------------------- Volume Control UI ----------------------------- */
function TundraAudioControl({ muted, setMuted, volume, setVolume }) {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2 bg-black/40 px-3 py-2 rounded-lg">
      <button
        onClick={() => setMuted(!muted)}
        className="text-white/80 hover:text-white"
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "🔇" : "🔊"}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="w-20"
        disabled={muted}
      />
      <span className="text-xs text-white/60 w-8">
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
}


/* ----------------------------- Keyboard Controls ----------------------------- */
function MouseLookControls() {
    const { camera } = useThree();
    const lookRef = useRef({ yaw: 0, pitch: 0 });
    const isDragging = useRef(false);
    const sensitivity = 0.002;

    useEffect(() => {
        const handleMouseDown = (e) => {
            // Left mouse button to look around
            if (e.button === 0) {
                isDragging.current = true;
            }
        };

        const handleMouseUp = () => {
            isDragging.current = false;
        };

        const handleMouseMove = (e) => {
            // Only rotate camera when left mouse is held and dragging
            if (isDragging.current) {
                lookRef.current.yaw -= e.movementX * sensitivity;
                lookRef.current.pitch -= e.movementY * sensitivity;

                // Clamp vertical angle to prevent flipping
                lookRef.current.pitch = Math.max(
                    -Math.PI / 2,
                    Math.min(Math.PI / 2, lookRef.current.pitch)
                );

                // Apply rotation to camera
                camera.rotation.order = 'YXZ';
                camera.rotation.y = lookRef.current.yaw;
                camera.rotation.x = lookRef.current.pitch;
            }
        };

        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [camera]);

    return null;
}


/* ----------------------------- Player Movement ----------------------------- */
function PlayerMovement() {
    const { camera } = useThree();
    const keysPressed = useRef({});
    const speed = 0.25;

    useEffect(() => {
        // Initialize camera height
        camera.position.y = 6;

        const handleKeyDown = (e) => {
            keysPressed.current[e.key.toLowerCase()] = true;
        };

        const handleKeyUp = (e) => {
            keysPressed.current[e.key.toLowerCase()] = false;
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [camera]);

    useFrame(() => {
        const direction = new THREE.Vector3();

        // Get camera's yaw (horizontal rotation only)
        const yaw = camera.rotation.y;

        // Calculate forward and right vectors based only on yaw
        const forward = new THREE.Vector3(
            -Math.sin(yaw),  // Flipped this
            0,
            -Math.cos(yaw)   // Flipped this
        ).normalize();

        const right = new THREE.Vector3(
            -Math.cos(yaw),
            0,
            Math.sin(yaw)
        ).normalize();

        // WASD movement
        if (keysPressed.current['w']) direction.add(forward);
        if (keysPressed.current['s']) direction.sub(forward);
        if (keysPressed.current['d']) direction.sub(right);
        if (keysPressed.current['a']) direction.add(right);

        // Apply movement
        if (direction.length() > 0) {
            direction.normalize().multiplyScalar(speed);
            camera.position.x += direction.x;
            camera.position.z += direction.z;
        }
    });

    return null;
}


/* ----------------------------- Helper Function Used To Help Build Models ----------------------------- */
function randomPlacements(models=[], count=0, area=0, yCoord=0, sizeRange=[0,1], rotationEnabled=1, seed=12345) {
  return useMemo(() => {
    //Seeded random number generator for consistent positions
    const seededRandom = (s) => {
      let value = s;
      return () => {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
      };
    };

    //Adding a seed parameter to keep random positions consistent per renders
    const rand = seededRandom(seed)

    //Array Of Model Infos To Return
    const arr = [];

    //Creating Position Coordinates
    for (let i = 0; i < count; i++) {
      let pos;
      pos = new THREE.Vector3(
        (rand() - 0.5) * area, //X-Axis
        yCoord,                       //Y-Axis (fixed)
        (rand() - 0.5) * area  //Z-Axis
      );

      //Keeping In Track Of Every Model Built
      occupiedPositions.push({x: pos.x, y: pos.y, z: pos.z});
   
      //Storing and Keeping In Track Of All Models In Arrays
      arr.push({
        position: [pos.x, pos.y, pos.z],                                     //Random Positions
        scale: sizeRange[0] + rand() * (sizeRange[1] - sizeRange[0]), //Random Sizes
        rotation: rand() * Math.PI * 2 * rotationEnabled,             //Random Rotations
        index: Math.floor(rand() * models.length),                    //Random Types
      });
    } 
    
    //Printing All Occupied Positions On Console
    console.log("✅ Occupied positions:", occupiedPositions);
    console.log("Total occupied positions:", occupiedPositions.length);

    //Return The Array Of Model Infos
    return arr;
  }, [models, count, area, yCoord, sizeRange])
}

function buildModels({name="",paths=[], count=0, area=0, yCoord=0, sizeRange=[0,1], color="#c2b280", roughness=1, metalness=0, shadow=true, rotationEnabled=1, seed=12345}) {  
  try {
    //Loading All GLTF Models Into The Scene
    const models = paths.map((path) => {
      const { scene } = useGLTF(path);
      return scene;
    });
    
    //Random Placements Of Object Models
    const positions = randomPlacements(models, count, area, yCoord, sizeRange, rotationEnabled, seed);

    //Applying color, shadows, roughness, and metalness of objects
    useEffect(() => {
      models.forEach((model) => {
        
        //Applying Shadows
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = shadow;
            child.receiveShadow = shadow;

            //Applying Color, Roughness, and Metalness
            if (child.material) {
              child.material.color = new THREE.Color(color);
              child.material.roughness = roughness;
              child.material.metalness = metalness;
            }
          }
        });
      });
        
      //Confirmation Of Model Creation
      console.log("GLB Models | ", name , " | Loaded Successfully");
      console.log("Total to render:", count);
    }, [models, color, roughness, metalness, shadow, name, count]);

    //Return All Models And Apply
    return (
      <group>
        {positions.map((model,i) => (
          <primitive 
            key={`model-${i}`}
            object={models[model.index].clone()}
            position={model.position}
            scale={model.scale}
            rotation={[0, model.rotation, 0]}
          />
         ))}
      </group>
    );

    //Error Handling of Models
    } catch (error) {
      console.error("❌ Error loading GLB model:", error);
      return null;
    }
}


/* ----------------------------- Ground Surface of Enviroment ----------------------------- */
function Ground() {
   const snowColor = new THREE.Color("#a8c3d9");
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 4.8, 0]}>
            <planeGeometry args={[400, 400]} />
            <meshStandardMaterial
                color={snowColor}
                roughness={1}
                metalness={0}
            />
        </mesh>
    );
}


/* ----------------------------- Downloading Boat Model ----------------------------- */
function Boat() {
  return (<group position={[-300, -5, 0]} rotation={[0, 0, 0]}>
    {buildModels({
      name: "Boat",
      paths: ["/tundraModels/boat.glb"],
      count: 1,
      area: 0,
      yCoord: 5,
      sizeRange: [5, 5],
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 0
    })}
  </group>)
}


/* ----------------------------- Downloading Cabin Model ----------------------------- */
function Cabin() {
  return (<group position={[-105, 0, -107]} rotation={[0, -5.1, 0]}>
    {buildModels({
      name: "Boat",
      paths: ["/tundraModels/cabin.glb"],
      count: 1,
      area: 0,
      yCoord: 2.5,
      sizeRange: [0.02, 0.02],
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 0
    })}
  </group>)
}


/* ----------------------------- Downloading Tundra Rock Models ----------------------------- */
function Rocks() {
  return (<group position={[120, 0, 0]} rotation={[0, 0, 0]}>
    {buildModels({
      name: "Bushes",
      paths: ["/tundraModels/rock1.glb", "/tundraModels/rock2.glb", "/tundraModels/rock3.glb"],
      count: 400,
      area: 400,
      yCoord: 5,
      color: "#6B7280",
      sizeRange: [5,5],
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 1000
    })}
  </group>)
}

function RavenRock () {
  return(
    <group position={[-20, 0, -170]} rotation={[0, 0, 0]}>
      {
        buildModels({
          name: "Raven Rock",
          paths: ['/tundraModels/rock3.glb'],
          count: 1,
          area: 0,
          yCoord: 5,
          color: "#6B7280",
          sizeRange: [10,10],
          roughness: 1,
          metalness: 0,
          shadow: true,
          rotationEnabled: 0
        })
      }
    </group>
  )
}


/* ----------------------------- Downloading Tundra Trees Models ----------------------------- */
function Trees1() {
  return (<group position={[130, 0, 0]} rotation={[0, 0, 0]}>

    {buildModels({
      name: "Spruce Trees 1",
      paths: ["/tundraModels/tree3.glb", "/tundraModels/tree4.glb"],
      count: 200,
      area: 400,
      yCoord: 8.3,
      color: "#4B3A2F",
      sizeRange: [10,15],
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 2000
    })}

    {buildModels({
      name: "Spruce Trees 2",
      paths: ["/tundraModels/tree1.glb"],
      count: 200,
      area: 400,
      yCoord: 4.8,
      sizeRange: [50,100],
      color: "#4B3A2F",
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 2000
    })}

    {buildModels({
      name: "Trees With No Leaves",
      paths: ["/tundraModels/tree2.glb", "/tundraModels/tree5.glb"],
      count: 200,
      area: 400,
      yCoord: 4.8,
      sizeRange: [0.5,0.8],
      color: "#6e7b46",
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 2000
    })}

  </group>)
}
function Trees2() {
  return (<group position={[30, 0, -90]} rotation={[0, 0.1, 0]}>

    {buildModels({
      name: "Spruce Trees 1",
      paths: ["/tundraModels/tree3.glb", "/tundraModels/tree4.glb"],
      count: 50,
      area: 200,
      yCoord: 8.3,
      color: "#4B3A2F",
      sizeRange: [10,15],
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 3000
    })}

    {buildModels({
      name: "Spruce Trees 2",
      paths: ["/tundraModels/tree1.glb"],
      count: 50,
      area: 200,
      yCoord: 4.8,
      sizeRange: [50,100],
      color: "#4B3A2F",
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 3000
    })}

    {buildModels({
      name: "Trees With No Leaves",
      paths: ["/tundraModels/tree2.glb", "/tundraModels/tree5.glb"],
      count: 50,
      area: 200,
      yCoord: 4.8,
      sizeRange: [0.5,0.8],
      color: "#6e7b46",
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 3000
    })}

  </group>)
}
function Trees3() {
  return (<group position={[-30, 0, 0]} rotation={[0, 0, 0]}>

    {buildModels({
      name: "Spruce Trees 1",
      paths: ["/tundraModels/tree3.glb", "/tundraModels/tree4.glb"],
      count: 50,
      area: 200,
      yCoord: 8.3,
      color: "#4B3A2F",
      sizeRange: [10,15],
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 4000
    })}

    {buildModels({
      name: "Spruce Trees 2",
      paths: ["/tundraModels/tree1.glb"],
      count: 50,
      area: 200,
      yCoord: 4.8,
      sizeRange: [50,100],
      color: "#4B3A2F",
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 4000
    })}

    {buildModels({
      name: "Trees With No Leaves",
      paths: ["/tundraModels/tree2.glb", "/tundraModels/tree5.glb"],
      count: 100,
      area: 50,
      yCoord: 4.8,
      sizeRange: [0.5,0.8],
      color: "#6e7b46",
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 4000
    })}
    
  </group>)
}
function Trees4() {
  return (<group position={[70, 0, 100]} rotation={[0, 0, 0]}>
    
    {buildModels({
      name: "Spruce Trees 1",
      paths: ["/tundraModels/tree3.glb", "/tundraModels/tree4.glb"],
      count: 50,
      area: 200,
      yCoord: 8.3,
      color: "#4B3A2F",
      sizeRange: [10,15],
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 5000
    })}

    {buildModels({
      name: "Spruce Trees 2",
      paths: ["/tundraModels/tree1.glb"],
      count: 50,
      area: 200,
      yCoord: 4.8,
      sizeRange: [50,100],
      color: "#4B3A2F",
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 5000
    })}

    {buildModels({
      name: "Trees With No Leaves",
      paths: ["/tundraModels/tree2.glb", "/tundraModels/tree5.glb"],
      count: 50,
      area: 200,
      yCoord: 4.8,
      sizeRange: [0.5,0.8],
      color: "#6e7b46",
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 5000
    })}

  </group>)
}
function Trees5() {
  return (<group position={[0, 0, 70]} rotation={[0, -20, 0]}>

    {buildModels({
      name: "Spruce Trees 1",
      paths: ["/tundraModels/tree3.glb", "/tundraModels/tree4.glb"],
      count: 50,
      area: 200,
      yCoord: 8.3,
      color: "#4B3A2F",
      sizeRange: [10,15],
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 5000
    })}

    {buildModels({
      name: "Spruce Trees 2",
      paths: ["/tundraModels/tree1.glb"],
      count: 50,
      area: 200,
      yCoord: 4.8,
      sizeRange: [50,100],
      color: "#4B3A2F",
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 5000
    })}

    {buildModels({
      name: "Trees With No Leaves",
      paths: ["/tundraModels/tree2.glb", "/tundraModels/tree5.glb"],
      count: 50,
      area: 200,
      yCoord: 4.8,
      sizeRange: [0.5,0.8],
      color: "#6e7b46",
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 5000
    })}

  </group>)
}

/* ----------------------------- Downloading Tundra Bushes Models ----------------------------- */
function Bushes() {
  return (<group position={[120, 0, 0]} rotation={[0, 0, 0]}>

    {buildModels({
      name: "Bushes",
      paths: ["/tundraModels/bush1.glb", "/tundraModels/bush2.glb"],
      count: 200,
      area: 400,
      yCoord: 5,
      color: "#4B3A2F",
      sizeRange: [0.5,1.5],
      roughness: 1,
      metalness: 0,
      shadow: true,
      rotationEnabled: 1,
      seed: 6000
    })}

  </group>)
}

/* ----------------------------- Downloading Tundra River Model ----------------------------- */
function RiverBody1() {
  return (
    <group position={[-280, -5, 0]} rotation={[0, 0, 0]}>
      {buildModels({
        name: "River",
        paths: ["/tundraModels/river.glb"],
        count: 1,
        area: 0,
        yCoord: 0.8,
        sizeRange: [0.15, 0.15],
        color: "#a8c3d9",
        roughness: 1,
        metalness: 0,
        shadow: true,
        rotationEnabled: 0
      })}
    </group>
  );
}
function RiverBody2() {
  return (
    <group position={[-190, -5, 170]} rotation={[0, 10, 0]}>
      {buildModels({
        name: "River",
        paths: ["/tundraModels/river.glb"],
        count: 1,
        area: 0,
        yCoord: 1.7,
        sizeRange: [0.1, 0.1],
        color: "#a8c3d9",
        roughness: 1,
        metalness: 0,
        shadow: true,
        rotationEnabled: 0
      })}
    </group>
  );
}
function RiverBody3() {
  return (
    <group position={[-200, -5, -170]} rotation={[0, -10, 0]}>
      {buildModels({
        name: "River",
        paths: ["/tundraModels/river.glb"],
        count: 1,
        area: 0,
        yCoord: 0.8,
        sizeRange: [0.1, 0.1],
        color: "#a8c3d9",
        roughness: 1,
        metalness: 0,
        shadow: true,
        rotationEnabled: 0
      })}
    </group>
  );
}


/* ----------------------------- Downloading Tundra Mountain Model ----------------------------- */
function Mountain() {
  return (
    <group position={[240, 120, -20]} rotation={[0, 0, 0]}>
      {buildModels({
        name: "Mountain",
        paths: ["/tundraModels/mountain.glb"],
        count: 1,
        area: 0,
        yCoord: 0,
        sizeRange: [380, 380],
        color: "#a8c3d9",
        roughness: 1,
        metalness: 0,
        shadow: true,
        rotationEnabled: 0
      })}
    </group>
  );
}


/* ----------------------------- Downloading Grass Models ----------------------------- */
function Grass1() {
  return (
    <group position={[130, 0, 0]} rotation={[0, 0, 0]}>
      {buildModels({
        name: "Grass",
        paths: ["/tundraModels/grass.glb"],
        count: 10000,
        area: 200,
        yCoord: 4.9,
        sizeRange: [1, 1],
        color: "#586341",
        roughness: 1,
        metalness: 0,
        shadow: true,
        rotationEnabled: 0
      })}    
    </group>
  );
}
function Grass2() {
  return (
    <group position={[30, 0, -90]} rotation={[0, 0, 0]}>
      {buildModels({
        name: "Grass",
        paths: ["/tundraModels/grass.glb"],
        count: 10000,
        area: 200,
        yCoord: 4.9,
        sizeRange: [1, 1],
        color: "#586341",
        roughness: 1,
        metalness: 0,
        shadow: true,
        rotationEnabled: 0
      })}    
    </group>
  );
}
function Grass3() {
  return (
    <group position={[-30, 0, 0]} rotation={[0, 0, 0]}>
      {buildModels({
        name: "Grass",
        paths: ["/tundraModels/grass.glb"],
        count: 10000,
        area: 200,
        yCoord: 4.9,
        sizeRange: [1, 1],
        color: "#586341",
        roughness: 1,
        metalness: 0,
        shadow: true,
        rotationEnabled: 0
      })}    
    </group>
  );
}
function Grass4() {
  return (
    <group position={[70, 0, 100]} rotation={[0, 0, 0]}>
      {buildModels({
        name: "Grass",
        paths: ["/tundraModels/grass.glb"],
        count: 10000,
        area: 200,
        yCoord: 4.9,
        sizeRange: [1, 1],
        color: "#586341",
        roughness: 1,
        metalness: 0,
        shadow: true,
        rotationEnabled: 0
      })}    
    </group>
  );
}
function Grass5() {
  return (
    <group position={[0, 0, 70]} rotation={[0, 0, 0]}>
      {buildModels({
        name: "Grass",
        paths: ["/tundraModels/grass.glb"],
        count: 10000,
        area: 200,
        yCoord: 4.9,
        sizeRange: [1, 1],
        color: "#586341",
        roughness: 1,
        metalness: 0,
        shadow: true,
        rotationEnabled: 0
      })}    
    </group>
  );
}


/* ----------------------------- Addition of Elevated Land ----------------------------- */
//Helps The River Blend In With The Tundra Biome
function Land1() {
  const snowColor = new THREE.Color(SNOW_COLOR);
  return (
    <mesh position={[200, 0, 0]} rotation={[0, -Math.PI/2, 0]} receiveShadow>
      <boxGeometry args={[400, 10, 520]} />
      <meshStandardMaterial
        color={snowColor}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}
function Land2() {
  const snowColor = new THREE.Color(SNOW_COLOR);
  return (
    <mesh position={[-90, 0, 0]} rotation={[0, -Math.PI/2, 0]} receiveShadow>
      <boxGeometry args={[210, 10, 100]} />
      <meshStandardMaterial
        color={snowColor}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}
function Land3() {
  const snowColor = new THREE.Color(SNOW_COLOR);
  return (
    <mesh position={[-55, 0, 140]} rotation={[0, -Math.PI/3, 0]} receiveShadow>
      <boxGeometry args={[140, 10, 100]} />
      <meshStandardMaterial
        color={snowColor}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}
function Land4() {
  const snowColor = new THREE.Color(SNOW_COLOR);
  return (
    <mesh position={[-60, 0, -130]} rotation={[0, Math.PI/3.3, 0]} receiveShadow>
      <boxGeometry args={[140, 10, 90]} />
      <meshStandardMaterial
        color={snowColor}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}


/* ----------------------------- Addition of the Moon ----------------------------- */
function Moon() {
  return (
    <mesh position={[0, 40, -100]}>
      <sphereGeometry args={[3, 32, 32]} />
      <meshStandardMaterial
        emissive="#cfe8ff"
        emissiveIntensity={3}
        color="#f8fdff"
        toneMapped={false}
      />
    </mesh>
  );
}


/* ----------------------------- Addition of Snowfalls ----------------------------- */
function Snowflake({ position }) {
  //Using Three References of Snowfalls
  const ref1 = useRef();
  const ref2 = useRef();
  const ref3 = useRef();
  //Movement of Snowfall (Below)
  useFrame((_, delta) => {
    if (!ref1.current) return;
    ref1.current.position.y -= delta * 8;
    if (ref1.current.position.y < -5) ref1.current.position.y = 10;
  });
  //Movement of Snowfall (Above)
  useFrame((_, delta) => {
    if (!ref2.current) return;
    ref2.current.position.y -= delta * 8;
    if (ref2.current.position.y < 10) ref2.current.position.y = 20;
  });
  //Movement of Snowfall (From Above To Below)
  useFrame((_, delta) => {
    if (!ref3.current) return;
    ref3.current.position.y -= delta * 14;
    if (ref3.current.position.y < -5) ref3.current.position.y = 20;
  });
  //3D Model Of Snowfall
  return (
    <group position={position}>
        <mesh ref={ref1} position={position}>
          <sphereGeometry args={[0.1, 5, 5]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh ref={ref2} position={position}>
          <sphereGeometry args={[0.1, 5, 5]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh ref={ref3} position={position}>
          <sphereGeometry args={[0.1, 5, 5]} />
          <meshStandardMaterial color="white" />
        </mesh>
    </group>
  );
}
//Group of Snowfalls
function Snowfall({ count = 8000 }) {
  const flakes = Array.from({ length: count }, () => {
    const x = (Math.random() - 0.5) * 400;
    const z = (Math.random() - 0.5) * 400;
    const y = (Math.random()) * 10;
    return {x, y, z}
  });
  return flakes.map((flake, i) => (
    <Snowflake key={i} position={[flake.x, flake.y, flake.z]} />
  ));
}


/* ----------------------------- Additional Ideas ----------------------------- */

/* ----------------------------- Addition of Lake ----------------------------- */
// function TundraLake() {
//   return (
//     <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, getGroundHeight(5, 5), 5]}>
//       <circleGeometry args={[10, 100]} />
//       <meshPhysicalMaterial
//         color="#99ccff"
//         transparent
//         opacity={0.6}
//         roughness={0.1}
//         metalness={0.9}
//         clearcoat={1}
//       />
//     </mesh>
//   );
// }


/* ---------------------------------- Animal Models ---------------------------------- */
function AnimalModel({
    modelPath,
    scale = 1,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    info,
    setSelectedAnimal,
    gameStarted,
    onDiscover,
}) {
    const { scene } = useGLTF(modelPath);
    useEffect(() => {
        console.log(`✅ Loaded animal model: ${modelPath}`);
        
        scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [modelPath, scene]);

    const handleClick = (e) => {
        e.stopPropagation();
        console.log("🦜 Animal clicked!", info);
        setSelectedAnimal((prev) => (prev?.id === info?.id ? null : info));

        // Track discovery if game is active
        if (gameStarted && info?.id) {
            onDiscover(info.id);
        }
    };

    return (
        <group onClick={handleClick}>
            <primitive
                object={scene.clone()}
                scale={scale}
                position={position}
                rotation={rotation}
            />
        </group>
    );
}


/* ----------------------------- Creating The 3D Immersive Experience ----------------------------- */
function TundraImmersive() {
  const DISABLE_GAMES = false;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const totalAnimals = tundraModels.length;
  const discoveryGame = useDiscoveryGame(totalAnimals);
  const challengeGame = useChallengeGame(totalAnimals);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);

  //Two Modes, Discovery and Challenge
  const activeGame =
    discoveryGame.gameMode === "discovery"
      ? discoveryGame
      : discoveryGame.gameMode === "challenge"
      ? challengeGame
      : null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 via-blue-950 to-indigo-900 text-white">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-400/15 ring-1 ring-blue-400/30 text-blue-300">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden
              className="text-blue-300"
            >
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Wild Realms – Tundra
          </span>
        </div>
        <Link
          to="/biomes"
          className="rounded-full px-4 py-2 text-sm ring-1 ring-white/20 hover:bg-white/10"
        >
          Back to Biomes
        </Link>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-10">
        <div
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl"
          style={{ height: 640 }}
        >
          
          {/* Audio Volume Control */}
          <TundraAudioControl 
            muted={muted} 
            setMuted={setMuted} 
            volume={volume} 
            setVolume={setVolume}
          />

          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-10 rounded-lg bg-black/40 p-2 ring-1 ring-white/20 hover:bg-black/60 transition"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>

          {/* ------------------- GAME LOGIC ------------------- */}
          {!DISABLE_GAMES && (
            <>
              {!discoveryGame.gameMode && (
                <GameModeSelection onSelectMode={discoveryGame.selectGameMode} />
              )}

              {discoveryGame.gameMode === "discovery" && (
                <>
                  {!discoveryGame.gameStarted && !discoveryGame.showVictory && (
                    <StartGameOverlay
                      totalAnimals={totalAnimals}
                      onStart={discoveryGame.startGame}
                      onBack={discoveryGame.resetGame}
                    />
                  )}
                  {discoveryGame.gameStarted && !discoveryGame.showVictory && (
                    <AnimalCounter
                      discovered={discoveryGame.discoveredAnimals.size}
                      total={totalAnimals}
                    />
                  )}
                  {discoveryGame.showVictory && (
                    <VictoryOverlay
                      totalAnimals={totalAnimals}
                      onPlayAgain={discoveryGame.resetGame}
                    />
                  )}
                </>
              )}

              {discoveryGame.gameMode === "challenge" && (
                <>
                  {!challengeGame.gameStarted && !challengeGame.showVictory && (
                    <StartChallengeOverlay
                      totalAnimals={totalAnimals}
                      onStart={challengeGame.startGame}
                      onBack={discoveryGame.resetGame}
                    />
                  )}
                  {challengeGame.gameStarted && !challengeGame.showVictory && (
                    <ChallengeCounter
                      discovered={challengeGame.discoveredAnimals.size}
                      total={totalAnimals}
                      elapsedTime={challengeGame.elapsedTime}
                    />
                  )}
                  {challengeGame.showVictory && (
                    <ChallengeVictoryOverlay
                      totalAnimals={totalAnimals}
                      finalTime={challengeGame.finalTime}
                      onPlayAgain={discoveryGame.resetGame}
                    />
                  )}
                </>
              )}
            </>
          )}
          {/* ------------------- END GAME LOGIC ------------------- */}
          {/* Music Volume Control */}
          <TundraAudioControl 
            muted={muted} 
            setMuted={setMuted} 
            volume={volume} 
            setVolume={setVolume}
          />

          <Canvas
            camera={{ position: [0, 10, 40], fov: 60 }}
            gl={{ antialias: true, alpha: false }}
            onCreated={({ scene }) => {
              scene.background = new THREE.Color("#1a2e4d");
            }}
          >
            <Suspense fallback={null}>
              {/* Biome Background Sound */}
              <TundraAmbience 
                url="/sounds/tundraBackground.wav" 
                volume={volume} 
                muted={muted}
              />

              {/* Biome Components */}
              <EnvironmentFog />
              <SceneLighting />
              <Ground />

              {/* Randomized Models */}
              <Snowfall />
              <Trees1 />
              <Trees2 />
              <Trees3 />
              <Trees4 />
              <Trees5 />
              <Bushes />
              <Rocks />
              <Grass1 />
              <Grass2 />
              <Grass3 />
              <Grass4 />
              <Grass5 />
              
              {/* Animal Models */}
              {tundraModels.map((model) => (
                <AnimalModel
                  key={model.id}
                  modelPath={model.modelPath}
                  scale={model.scale}
                  position={model.position}
                  rotation={model.rotation}
                  info={model.info}
                  setSelectedAnimal={setSelectedAnimal}
                  gameStarted={activeGame?.gameStarted || false}
                  onDiscover={activeGame?.handleAnimalDiscover}
                />
              ))}

              {/* Fixed Models */}
              {/* <Moon /> */}
              <Boat />
              <Cabin />
              <RiverBody1 />
              <RiverBody2 />
              <RiverBody3 />
              <Land1 />
              <Land2 />
              <Land3 />
              <Land4 />
              <Mountain />
              <RavenRock />

              {/* User Controls */}
              <MouseLookControls />
              <PlayerMovement />
              {/* <OrbitControls 
                enableDamping={true} 
                dampingFactor={0.05} 
                maxPolarAngle={Math.PI / 2} 
                minDistance={5}
                maxDistance={300}
              /> */}

            </Suspense>
          </Canvas>

          {selectedAnimal && (
            <div
              className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md rounded-xl p-6 ring-1 ring-white/20 text-white max-w-md shadow-lg transition-all"
              style={{ zIndex: 50 }}
            >
              <button
                onClick={() => setSelectedAnimal(null)}
                className="absolute top-2 right-2 text-white/60 hover:text-white"
              >
                ✕
              </button>
              <div className="flex gap-4 items-start">
                <img
                  src={selectedAnimal.imageUrl}
                  alt={selectedAnimal.name}
                  className="w-20 h-20 object-cover rounded-lg ring-1 ring-white/30"
                />
                <div>
                  <h2 className="text-xl font-semibold">{selectedAnimal.name}</h2>
                  <p className="text-sm italic text-white/70">
                    {selectedAnimal.scientificName}
                  </p>
                  <p className="text-sm mt-2">{selectedAnimal.description}</p>
                  <p className="text-sm mt-1 text-white/70">
                    Status: {selectedAnimal.status}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto mx-auto flex w-full max-w-7xl items-center justify-between px-6 pb-10 pt-6 text-sm text-white/75">
        <div>© {new Date().getFullYear()} Wild Realms • Tundra Biome</div>
      </footer>
    </div>
  );
}
export default TundraImmersive;