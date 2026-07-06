// import React, { useState, useEffect } from 'react';
// /**
//  * DiscoveryGame Component
//  * Manages the animal discovery game state and UI overlays
//  */
// export function useDiscoveryGame(totalAnimals) {
//     const [gameStarted, setGameStarted] = useState(false);
//     const [discoveredAnimals, setDiscoveredAnimals] = useState(new Set());
//     const [showVictory, setShowVictory] = useState(false);

//     // Handle animal discovery
//     const handleAnimalDiscover = (animalId) => {
//         setDiscoveredAnimals(prev => {
//             const newSet = new Set(prev);
//             const wasNew = !newSet.has(animalId);
//             newSet.add(animalId);

//             // Check if all animals discovered
//             if (newSet.size === totalAnimals && wasNew) {
//                 setShowVictory(true);
//             }

//             return newSet;
//         });
//     };

//     // Start the game
//     const startGame = () => {
//         setGameStarted(true);
//         setDiscoveredAnimals(new Set());
//         setShowVictory(false);
//     };

//     // Reset game
//     const resetGame = () => {
//         setGameStarted(false);
//         setDiscoveredAnimals(new Set());
//         setShowVictory(false);
//     };

//     return {
//         gameStarted,
//         discoveredAnimals,
//         showVictory,
//         handleAnimalDiscover,
//         startGame,
//         resetGame,
//     };
// }

// /**
//  * StartGameOverlay Component
//  * Initial screen that appears when loading the immersive mode
//  */
// export function StartGameOverlay({ totalAnimals, onStart }) {
//     return (
//         <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//             <div className="text-center">
//                 <h2 className="text-3xl font-bold mb-4 text-white">Discover the Rainforest!</h2>
//                 <p className="text-lg mb-6 text-white/80">
//                     Find and click on all {totalAnimals} animals hidden in the forest
//                 </p>
//                 <button
//                     onClick={onStart}
//                     className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition text-lg shadow-lg"
//                 >
//                     Start Game
//                 </button>
//             </div>
//         </div>
//     );
// }

// /**
//  * AnimalCounter Component
//  * Shows progress in the top-left corner during gameplay
//  */
// export function AnimalCounter({ discovered, total }) {
//     return (
//         <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md rounded-lg px-4 py-3 ring-1 ring-white/20 shadow-lg">
//             <div className="text-white">
//                 <div className="text-sm text-white/70">Animals Discovered</div>
//                 <div className="text-2xl font-bold">
//                     {discovered} / {total}
//                 </div>
//             </div>
//         </div>
//     );
// }

// /**
//  * VictoryOverlay Component
//  * Celebration screen when all animals are found
//  */
// export function VictoryOverlay({ totalAnimals, onPlayAgain }) {
//     return (
//         <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 ring-1 ring-white/20 text-center max-w-md shadow-2xl">
//                 <div className="text-6xl mb-4">🎉</div>
//                 <h2 className="text-3xl font-bold mb-2 text-white">Congratulations!</h2>
//                 <p className="text-xl mb-6 text-white/90">
//                     You've discovered all {totalAnimals} animals!
//                 </p>
//                 <button
//                     onClick={onPlayAgain}
//                     className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition shadow-lg"
//                 >
//                     Play Again
//                 </button>
//             </div>
//         </div>
//     );
// }

import React, { useState, useEffect } from 'react';

/**
 * Game Mode Selection Component
 * Allows users to choose between Discovery and Challenge modes
 */
export function GameModeSelection({ onSelectMode }) {
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-center max-w-2xl px-6">
                <h2 className="text-4xl font-bold mb-6 text-white">Select Your Game</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Discovery Mode */}
                    <button
                        onClick={() => onSelectMode('discovery')}
                        className="bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl p-8 ring-1 ring-white/20 transition-all transform hover:scale-105 text-left"
                    >
                        <div className="text-5xl mb-4">🔍</div>
                        <h3 className="text-2xl font-bold text-white mb-3">Discovery Mode</h3>
                        <p className="text-white/80">
                            Explore at your own pace and discover all the animals hidden in the biome.
                        </p>
                    </button>

                    {/* Challenge Mode */}
                    <button
                        onClick={() => onSelectMode('challenge')}
                        className="bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl p-8 ring-1 ring-white/20 transition-all transform hover:scale-105 text-left"
                    >
                        <div className="text-5xl mb-4">⚡</div>
                        <h3 className="text-2xl font-bold text-white mb-3">Challenge Mode</h3>
                        <p className="text-white/80">
                            Race against the clock to find all animals as quickly as possible!
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * DiscoveryGame Hook
 * Manages the animal discovery game state and UI overlays
 */
export function useDiscoveryGame(totalAnimals) {
    const [gameMode, setGameMode] = useState(null); // null, 'discovery', or 'challenge'
    const [gameStarted, setGameStarted] = useState(false);
    const [discoveredAnimals, setDiscoveredAnimals] = useState(new Set());
    const [showVictory, setShowVictory] = useState(false);

    // Handle animal discovery
    const handleAnimalDiscover = (animalId) => {
        setDiscoveredAnimals(prev => {
            const newSet = new Set(prev);
            const wasNew = !newSet.has(animalId);
            newSet.add(animalId);

            // Check if all animals discovered
            if (newSet.size === totalAnimals && wasNew) {
                setShowVictory(true);
            }

            return newSet;
        });
    };

    // Select game mode
    const selectGameMode = (mode) => {
        setGameMode(mode);
    };

    // Start the game
    const startGame = () => {
        setGameStarted(true);
        setDiscoveredAnimals(new Set());
        setShowVictory(false);
    };

    // Reset game
    const resetGame = () => {
        setGameMode(null);
        setGameStarted(false);
        setDiscoveredAnimals(new Set());
        setShowVictory(false);
    };

    return {
        gameMode,
        gameStarted,
        discoveredAnimals,
        showVictory,
        handleAnimalDiscover,
        selectGameMode,
        startGame,
        resetGame,
    };
}

/**
 * StartGameOverlay Component
 * Initial screen that appears after selecting discovery mode
 */
export function StartGameOverlay({ totalAnimals, onStart, onBack }) {
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-4 text-white">Discovery Mode</h2>
                <p className="text-lg mb-6 text-white/80">
                    Find and click on all {totalAnimals} animals hidden in the forest
                </p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={onBack}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition"
                    >
                        Back
                    </button>
                    <button
                        onClick={onStart}
                        className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition text-lg shadow-lg"
                    >
                        Start Game
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * AnimalCounter Component
 * Shows progress in the top-left corner during gameplay
 */
export function AnimalCounter({ discovered, total }) {
    return (
        <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md rounded-lg px-4 py-3 ring-1 ring-white/20 shadow-lg">
            <div className="text-white">
                <div className="text-sm text-white/70">Animals Discovered</div>
                <div className="text-2xl font-bold">
                    {discovered} / {total}
                </div>
            </div>
        </div>
    );
}

/**
 * VictoryOverlay Component
 * Celebration screen when all animals are found
 */
export function VictoryOverlay({ totalAnimals, onPlayAgain }) {
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 ring-1 ring-white/20 text-center max-w-md shadow-2xl">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold mb-2 text-white">Congratulations!</h2>
                <p className="text-xl mb-6 text-white/90">
                    You've discovered all {totalAnimals} animals!
                </p>
                <button
                    onClick={onPlayAgain}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition shadow-lg"
                >
                    Play Again
                </button>
            </div>
        </div>
    );
}