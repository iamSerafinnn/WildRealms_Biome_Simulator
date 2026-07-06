import tundraSpecies from "./tundraSpecies.json";

const speciesMap = {};
tundraSpecies.species.forEach((s) => {
  speciesMap[s.id] = s;
});

// Fixed positions - won't change on refresh
const tundraModels = [
  {
    id: 1,
    name: "Polar Bear",
    modelPath: "/tundraModels/bear.glb",
    scale: 0.01, //0.01
    position: [20, 5.7, -100],
    rotation: [0, 30, 0]
  },
  {
    id: 2,
    name: "Snow Leopard",
    modelPath: "/tundraModels/snowleopard.glb",
    scale: 0.18, //0.2
    position: [70, 5, 50],
    rotation: [0, 100, 0],
  },
  {
    id: 3,
    name: "Ringed Seal",
    modelPath: "/tundraModels/seal.glb",
    scale: 0.01, //0.01
    position: [-135, 5.2, 60],
    rotation: [0, 80, 0],
  },
  {
    id: 43126,
    name: "Artic Hare",
    modelPath: "/tundraModels/hare.glb",
    scale: 0.007, //0.007
    position: [100, 5.251, -30],
    rotation: [0, 40, 0],
  },
  {
    id: 8010,
    name: "Common Raven",
    modelPath: "/tundraModels/raven.glb",
    scale: 0.006, //0.006
    position: [-21, 5.85, -170.10],
    rotation: [0, 20, 0],
  }
];

// Merge animal info with model data
const mergedModels = tundraModels.map((m) => ({
  ...m,
  info: speciesMap[m.id] || null,
}));

export default mergedModels;