import React, { Suspense, useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, useTexture, PointerLockControls } from "@react-three/drei";
import { Link } from "react-router-dom";
import rainforestModels from "../data/rainforestModels.mjs";
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

// Function for mountains
const TERRAIN_NOISE = (x, z) => {
    return (
        Math.sin(x * 0.08) * Math.cos(z * 0.08) * 3 +
        Math.sin(x * 0.04) * Math.sin(z * 0.06) * 5 +
        Math.cos(x * 0.02) * Math.sin(z * 0.03) * 8 +
        Math.sin(x * 0.12) * Math.cos(z * 0.10) * 1.5
    );
};

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
                    Something went wrong in the 3D scene: {this.state.error?.message}
                </div>
            );
        }
        return this.props.children;
    }
}

const FOREST_SKY_COLOR = "#87CEEB";

/* ----------------------------- Scene Environment ----------------------------- */
function SceneLighting() {
    return (
        <>
            <ambientLight intensity={0.6} color="#a5d6a7" />
            <directionalLight
                position={[15, 25, 10]}
                intensity={0.8}
                color="#fff8dc"
            />
            <directionalLight
                position={[-10, 8, -8]}
                intensity={0.3}
                color="#81c784"
            />
            <pointLight position={[0, 5, 0]} intensity={0.4} color="#ffeb3b" distance={20} />
        </>
    );
}

function EnvironmentFog() {
    return <fog attach="fog" args={[FOREST_SKY_COLOR, 10, 80]} />;
}

// /* ----------------------------- Keyboard Controls ----------------------------- */
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

function PlayerMovement() {
    const { camera } = useThree();
    const keysPressed = useRef({});
    const speed = 0.25;

    useEffect(() => {
        // Initialize camera height
        camera.position.y = 2;

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
        if (keysPressed.current['a']) direction.sub(right);
        if (keysPressed.current['d']) direction.add(right);

        // Apply movement
        if (direction.length() > 0) {
            direction.normalize().multiplyScalar(speed);
            camera.position.x += direction.x;
            camera.position.z += direction.z;
        }
    });

    return null;
}
/* -------------------------------- Downloaded GLB Trees -------------------------------- */
function DownloadedTrees({ count = 120 }) {
    try {
        const { scene } = useGLTF('/models/rainforest-tree.glb');

        const positions = useMemo(() => {
            const arr = [];
            const parrotTreePos = new THREE.Vector3(40, 0, -40);

            for (let i = 0; i < count; i++) {
                const pos = new THREE.Vector3(
                    (Math.random() - 0.5) * 120,
                    4.25,
                    (Math.random() - 0.5) * 120
                );

                // Skip trees too close to parrot tree
                if (pos.distanceTo(parrotTreePos) < 20) continue;

                arr.push({
                    pos: [pos.x, 4.25, pos.z],
                    scale: 9,
                    rotation: Math.random() * Math.PI * 2
                });
            }

            return arr;
        }, [count]);


        useEffect(() => {
            console.log("✅ GLB Tree Model Loaded Successfully");
            console.log("Total trees to render:", count);

            const groundBlend = new THREE.Color("#3b5e3b"); // a deep mossy green that matches your forest floor

            scene.traverse((child) => {
                if (child.isMesh) {
                    const mat = child.material;
                    const name = child.name.toLowerCase();

                    // Identify bases or flat ground meshes
                    const isBaseLike =
                        name.includes("plane") ||
                        name.includes("base") ||
                        name.includes("ground");

                    const isGreenish =
                        mat?.color?.g > 0.5 &&
                        mat.color.g > mat.color.r + 0.2 &&
                        mat.color.g > mat.color.b + 0.2;

                    // Instead of hiding, recolor them to match floor
                    if (isBaseLike || isGreenish) {
                        mat.color.copy(groundBlend);
                        mat.roughness = 1;
                        mat.metalness = 0;
                    }

                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }, [scene, count]);

        return (
            <group>
                {positions.map((tree, i) => (
                    <primitive
                        key={`glb-tree-${i}`}
                        object={scene.clone()}
                        position={tree.pos}
                        scale={tree.scale}
                        rotation={[0, tree.rotation, 0]}
                    />
                ))}
            </group>
        );
    } catch (error) {
        console.error("❌ Error loading GLB model:", error);
        return null;
    }
}
/* -------------------------------- Geometric Trees -------------------------------- */
function GeometricTrees({ count = 60 }) {
    // Seeded random number generator for consistent positions
    const seededRandom = (seed) => {
        let value = seed;
        return () => {
            value = (value * 9301 + 49297) % 233280;
            return value / 233280;
        };
    };

    const trees = useMemo(() => {
        const rand = seededRandom(12345);
        const arr = [];

        const parrotTreePos = new THREE.Vector3(40, 0, -40);

        for (let i = 0; i < count; i++) {
            const pos = new THREE.Vector3(
                (rand() - 0.5) * 120,
                0,
                (rand() - 0.5) * 120
            );

            // Skip trees too close to the parrot tree
            if (pos.distanceTo(parrotTreePos) < 30) continue;

            arr.push({
                position: [pos.x, 0, pos.z],
                trunkHeight: 8 + rand() * 3,
                trunkRadius: 0.3 + rand() * 0.2,
                canopySize: 1.8 + rand() * 1.0,
            });
        }

        return arr;
    }, [count]);


    return (
        <>
            {trees.map((tree, i) => (
                <group key={i} position={tree.position}>
                    {/* Tree Trunk */}
                    <mesh position={[0, tree.trunkHeight / 2, 0]}>
                        <cylinderGeometry args={[tree.trunkRadius * 0.9, tree.trunkRadius, tree.trunkHeight, 8]} />
                        <meshStandardMaterial color="#5d4037" roughness={0.9} />
                    </mesh>

                    {/* Multi-layered canopy */}
                    {Array.from({ length: 8 }).map((_, idx) => {
                        const angle = (idx / 8) * Math.PI * 2;
                        const radius = tree.canopySize * 1.2;
                        return (
                            <mesh
                                key={`bottom-${idx}`}
                                position={[
                                    Math.cos(angle) * radius,
                                    tree.trunkHeight - 0.5,
                                    Math.sin(angle) * radius
                                ]}
                            >
                                <dodecahedronGeometry args={[tree.canopySize * 0.9, 0]} />
                                <meshStandardMaterial color="#2e7d32" roughness={0.85} flatShading />
                            </mesh>
                        );
                    })}

                    {Array.from({ length: 10 }).map((_, idx) => {
                        const angle = (idx / 10) * Math.PI * 2 + 0.3;
                        const radius = tree.canopySize * 0.9;
                        return (
                            <mesh
                                key={`middle-${idx}`}
                                position={[
                                    Math.cos(angle) * radius,
                                    tree.trunkHeight + 0.3,
                                    Math.sin(angle) * radius
                                ]}
                            >
                                <dodecahedronGeometry args={[tree.canopySize * 0.8, 0]} />
                                <meshStandardMaterial color="#388e3c" roughness={0.85} flatShading />
                            </mesh>
                        );
                    })}

                    {Array.from({ length: 8 }).map((_, idx) => {
                        const angle = (idx / 8) * Math.PI * 2 + 0.6;
                        const radius = tree.canopySize * 0.6;
                        return (
                            <mesh
                                key={`upper-${idx}`}
                                position={[
                                    Math.cos(angle) * radius,
                                    tree.trunkHeight + 1.2,
                                    Math.sin(angle) * radius
                                ]}
                            >
                                <dodecahedronGeometry args={[tree.canopySize * 0.7, 0]} />
                                <meshStandardMaterial color="#43a047" roughness={0.85} flatShading />
                            </mesh>
                        );
                    })}

                    {Array.from({ length: 6 }).map((_, idx) => {
                        const angle = (idx / 6) * Math.PI * 2;
                        const radius = tree.canopySize * 0.4;
                        return (
                            <mesh
                                key={`top-${idx}`}
                                position={[
                                    Math.cos(angle) * radius,
                                    tree.trunkHeight + 2.0,
                                    Math.sin(angle) * radius
                                ]}
                            >
                                <dodecahedronGeometry args={[tree.canopySize * 0.6, 0]} />
                                <meshStandardMaterial color="#4caf50" roughness={0.85} flatShading />
                            </mesh>
                        );
                    })}

                    <mesh position={[0, tree.trunkHeight + 1.0, 0]}>
                        <dodecahedronGeometry args={[tree.canopySize * 1.3, 0]} />
                        <meshStandardMaterial color="#1b5e20" roughness={0.85} flatShading />
                    </mesh>

                    <mesh position={[0, tree.trunkHeight + 2.3, 0]}>
                        <dodecahedronGeometry args={[tree.canopySize * 0.8, 0]} />
                        <meshStandardMaterial color="#66bb6a" roughness={0.85} flatShading />
                    </mesh>
                </group>
            ))}
        </>
    );
}
/* -------------------------------- Palm Trees -------------------------------- */
function PalmTree({ position, trunkHeight, frondCount, isParrotTree = false }) {
    return (
        <group position={position}>
            <mesh position={[0, trunkHeight / 2, 0]}>
                <cylinderGeometry args={[0.25, 0.3, trunkHeight, 8]} />
                <meshStandardMaterial color="#8d6e63" roughness={0.9} />
            </mesh>

            {Array.from({ length: frondCount }).map((_, idx) => {
                const angle = (idx / frondCount) * Math.PI * 2;
                const tilt = -0.3 - (isParrotTree ? 0.2 : Math.random() * 0.4); // Less droopy for parrot tree
                return (
                    <group
                        key={idx}
                        position={[0, trunkHeight, 0]}
                        rotation={[tilt, angle, 0]}
                    >
                        <mesh position={[0, 0, 2]}>
                            <boxGeometry args={[0.1, 0.05, 4]} />
                            <meshStandardMaterial color="#558b2f" roughness={0.8} flatShading />
                        </mesh>

                        {Array.from({ length: 8 }).map((_, leafIdx) => {
                            const leafPos = (leafIdx / 8) * 4;
                            return (
                                <mesh
                                    key={leafIdx}
                                    position={[0, 0, leafPos]}
                                    rotation={[0, 0, Math.PI / 2]}
                                >
                                    <boxGeometry args={[1.5 - leafIdx * 0.15, 0.02, 0.3]} />
                                    <meshStandardMaterial color="#7cb342" roughness={0.7} flatShading />
                                </mesh>
                            );
                        })}
                    </group>
                );
            })}
        </group>
    );
}

function PalmTrees({ count = 20 }) {
    const palms = useMemo(() => {
        const arr = [];
        const parrotPos = new THREE.Vector3(40, 0, -40);

        for (let i = 0; i < count; i++) {
            const pos = new THREE.Vector3(
                (Math.random() - 0.5) * 90,
                0,
                (Math.random() - 0.5) * 90
            );

            // Don't place palms too close to parrot tree
            if (pos.distanceTo(parrotPos) < 15) continue;

            arr.push({
                position: [pos.x, 0, pos.z],
                trunkHeight: 8 + Math.random() * 6,
                frondCount: 8 + Math.floor(Math.random() * 6),
            });
        }
        return arr;
    }, [count]);

    return (
        <>
            {palms.map((palm, i) => (
                <PalmTree
                    key={i}
                    position={palm.position}
                    trunkHeight={palm.trunkHeight}
                    frondCount={palm.frondCount}
                />
            ))}
        </>
    );
}
/* ---------------------------------- Ground ---------------------------------- */
function ForestFloor() {
    const textures = useTexture({
        map: "/textures/Grass001_2K-JPG_Color.jpg",
        normalMap: "/textures/Grass001.png",
    });

    for (const tex of Object.values(textures)) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(40, 40);
    }

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[400, 400]} />
            <meshStandardMaterial {...textures} roughness={1} />
        </mesh>
    );
}

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

function RainforestImmersive() {
    const DISABLE_GAMES = false; // temporary flag to diable games 
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef(null);
    const [selectedAnimal, setSelectedAnimal] = useState(null);

    // Discovery game management
    const totalAnimals = rainforestModels.length;

    const discoveryGame = useDiscoveryGame(totalAnimals);
    const challengeGame = useChallengeGame(totalAnimals);

    // Determine active game state
    const activeGame = discoveryGame.gameMode === 'discovery' ? discoveryGame :
        discoveryGame.gameMode === 'challenge' ? challengeGame :
            null;

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
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    useEffect(() => {
        window.keyPressed = {};

        const handleKeyDown = (e) => {
            window.keyPressed[e.key] = true;
        };

        const handleKeyUp = (e) => {
            window.keyPressed[e.key] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Find the parrot model to get its position for the dedicated palm tree
    const parrotModel = rainforestModels.find(m => m.isPalmPercher);
    const parrotTreeHeight = 12; // Tall palm for better visibility

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-emerald-950 to-green-900 text-white">
            <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
                <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-green-400/15 ring-1 ring-green-400/30">
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className="text-green-300">
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
                <div
                    ref={containerRef}
                    className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl"
                    style={{ height: 640 }}
                >
                    <button
                        onClick={toggleFullscreen}
                        className="absolute top-4 right-4 z-10 rounded-lg bg-black/40 p-2 ring-1 ring-white/20 hover:bg-black/60 transition"
                        aria-label="Toggle fullscreen"
                    >
                        {isFullscreen ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                            </svg>
                        )}
                    </button>




                    {/* ------------------- GAME LOGIC & UI (toggle with DISABLE_GAMES) ------------------- */}
                    {!DISABLE_GAMES && (
                        <>
                            {/* Game Mode Selection */}
                            {!discoveryGame.gameMode && (
                                <GameModeSelection onSelectMode={discoveryGame.selectGameMode} />
                            )}

                            {/* Discovery Mode UI */}
                            {discoveryGame.gameMode === 'discovery' && (
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

                            {/* Challenge Mode UI */}
                            {discoveryGame.gameMode === 'challenge' && (
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
                    {/* ------------------- END GAME LOGIC & UI ------------------- */}

                    <SceneErrorBoundary>
                        <Canvas
                            camera={{ position: [0, 2, 25], fov: 60 }}
                            gl={{ antialias: true, alpha: false }}
                            onCreated={({ scene }) => {
                                scene.background = new THREE.Color(FOREST_SKY_COLOR);
                            }}
                        >
                            <Suspense fallback={null}>
                                <EnvironmentFog />
                                <SceneLighting />
                                <ForestFloor />
                                <DownloadedTrees count={120} />
                                <GeometricTrees count={60} />
                                <PalmTrees count={20} />

                                {/* Dedicated palm tree for the parrot */}
                                {parrotModel && (
                                    <PalmTree
                                        position={[parrotModel.position[0], 0, parrotModel.position[2]]}
                                        trunkHeight={parrotTreeHeight}
                                        frondCount={10}
                                        isParrotTree={true}
                                    />
                                )}

                                {/* Load all animals from rainforestModels.json */}
                                {rainforestModels.map((model, index) => {
                                    let finalPosition;

                                    if (model.isPalmPercher) {
                                        // Place parrot on top of its dedicated palm tree
                                        finalPosition = [
                                            model.position[0],
                                            parrotTreeHeight - 0.5, // Just below the fronds
                                            model.position[2]
                                        ];
                                    } else if (model.attachToTree) {
                                        // Spread other birds out in a grid pattern
                                        const gridSpacing = 25;
                                        const birdModels = rainforestModels.filter(m => m.attachToTree && !m.isPalmPercher);
                                        const gridSize = Math.ceil(Math.sqrt(birdModels.length));
                                        const birdIndex = birdModels.findIndex(m => m.id === model.id);

                                        const row = Math.floor(birdIndex / gridSize);
                                        const col = birdIndex % gridSize;

                                        finalPosition = [
                                            (col - gridSize / 2) * gridSpacing,
                                            0,
                                            (row - gridSize / 2) * gridSpacing
                                        ];
                                    } else {
                                        // Ground animals keep their original positions
                                        finalPosition = [model.position[0], 0, model.position[2]];
                                    }

                                    return (
                                        <AnimalModel
                                            key={model.id}
                                            modelPath={model.modelPath}
                                            scale={model.scale}
                                            position={finalPosition}
                                            rotation={model.rotation}
                                            info={model.info}
                                            setSelectedAnimal={setSelectedAnimal}
                                            gameStarted={activeGame?.gameStarted || false}
                                            onDiscover={activeGame?.handleAnimalDiscover}
                                        />
                                    );
                                })}

                                <MouseLookControls />
                                <PlayerMovement />
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
                                        <p className="text-sm italic text-white/70">{selectedAnimal.scientificName}</p>
                                        <p className="text-sm mt-2">{selectedAnimal.description}</p>
                                        <p className="text-sm mt-1 text-white/70">Status: {selectedAnimal.status}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </SceneErrorBoundary>
                </div>
            </main>

            <footer className="mt-auto mx-auto flex w-full max-w-7xl items-center justify-between px-6 pb-10 pt-6 text-sm text-white/75">
                <div>© {new Date().getFullYear()} Wild Realms • Built for learning & analysis</div>
            </footer>
        </div>
    );
}

export default RainforestImmersive;