import React, { useState, useEffect } from 'react';

/**
 * ChallengeGame Hook
 * Manages the timed challenge game state
 */
export function useChallengeGame(totalAnimals) {
    const [gameStarted, setGameStarted] = useState(false);
    const [discoveredAnimals, setDiscoveredAnimals] = useState(new Set());
    const [showVictory, setShowVictory] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [finalTime, setFinalTime] = useState(0);

    // Timer effect
    useEffect(() => {
        let interval;
        if (gameStarted && !showVictory) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameStarted, showVictory]);

    // Handle animal discovery
    const handleAnimalDiscover = (animalId) => {
        setDiscoveredAnimals(prev => {
            const newSet = new Set(prev);
            const wasNew = !newSet.has(animalId);
            newSet.add(animalId);

            // Check if all animals discovered
            if (newSet.size === totalAnimals && wasNew) {
                setFinalTime(elapsedTime);
                setShowVictory(true);
            }

            return newSet;
        });
    };

    // Start the game
    const startGame = () => {
        setGameStarted(true);
        setDiscoveredAnimals(new Set());
        setShowVictory(false);
        setElapsedTime(0);
        setFinalTime(0);
    };

    // Reset game
    const resetGame = () => {
        setGameStarted(false);
        setDiscoveredAnimals(new Set());
        setShowVictory(false);
        setElapsedTime(0);
        setFinalTime(0);
    };

    return {
        gameStarted,
        discoveredAnimals,
        showVictory,
        elapsedTime,
        finalTime,
        handleAnimalDiscover,
        startGame,
        resetGame,
    };
}

/**
 * StartChallengeOverlay Component
 * Initial screen that appears after selecting challenge mode
 */
export function StartChallengeOverlay({ totalAnimals, onStart, onBack }) {
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-4 text-white">Challenge Mode</h2>
                <p className="text-lg mb-3 text-white/80">
                    Find all {totalAnimals} animals as fast as you can!
                </p>
                <p className="text-sm mb-6 text-white/60">
                    Your time will be recorded. Can you beat your best?
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
                        className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition text-lg shadow-lg"
                    >
                        Start Challenge
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * ChallengeCounter Component
 * Shows timer and progress during challenge mode
 */
export function ChallengeCounter({ discovered, total, elapsedTime }) {
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md rounded-lg px-4 py-3 ring-1 ring-orange-400/30 shadow-lg">
            <div className="text-white">
                <div className="text-sm text-white/70">Challenge Mode</div>
                <div className="flex items-center gap-4 mt-1">
                    <div>
                        <div className="text-xs text-white/60">Time</div>
                        <div className="text-xl font-bold text-orange-400">
                            {formatTime(elapsedTime)}
                        </div>
                    </div>
                    <div className="w-px h-8 bg-white/20"></div>
                    <div>
                        <div className="text-xs text-white/60">Found</div>
                        <div className="text-xl font-bold">
                            {discovered} / {total}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * ChallengeVictoryOverlay Component
 * Shows final time and celebration
 */
export function ChallengeVictoryOverlay({ totalAnimals, finalTime, onPlayAgain }) {
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Determine performance rating
    const getPerformanceRating = () => {
        if (finalTime < 60) return { emoji: '🏆', text: 'Incredible!', color: 'text-yellow-400' };
        if (finalTime < 120) return { emoji: '⭐', text: 'Amazing!', color: 'text-orange-400' };
        if (finalTime < 180) return { emoji: '🎯', text: 'Great!', color: 'text-green-400' };
        return { emoji: '✨', text: 'Good Job!', color: 'text-blue-400' };
    };

    const rating = getPerformanceRating();

    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 ring-1 ring-white/20 text-center max-w-md shadow-2xl">
                <div className="text-6xl mb-4">{rating.emoji}</div>
                <h2 className="text-3xl font-bold mb-2 text-white">Challenge Complete!</h2>
                <p className={`text-2xl font-bold mb-4 ${rating.color}`}>
                    {rating.text}
                </p>
                <div className="bg-black/30 rounded-lg p-4 mb-6">
                    <div className="text-sm text-white/70 mb-1">Your Time</div>
                    <div className="text-4xl font-bold text-orange-400">
                        {formatTime(finalTime)}
                    </div>
                </div>
                <p className="text-sm text-white/80 mb-6">
                    You found all {totalAnimals} animals!
                </p>
                <button
                    onClick={onPlayAgain}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition shadow-lg"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}