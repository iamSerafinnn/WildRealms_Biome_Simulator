import rainforestSpecies from "./rainforestSpecies.json";

const speciesMap = {};
rainforestSpecies.species.forEach((s) => {
  speciesMap[s.id] = s;
});

// Fixed positions - won't change on refresh
const rainforestModels = [
  {
    id: 74442, // Capybara
    name: "Capybara",
    modelPath: "/models/Capybara.glb",
    scale: 0.2,
    position: [5, 0, 8],
    rotation: [0, 1.2, 0],
  },
  {
    id: 12781, // Jaguar
    name: "Jaguar",
    modelPath: "/models/Jaguar.glb",
    scale: 0.2,
    position: [-12, 0, 15],
    rotation: [0, 2.8, 0],
  },
  {
    id: 18874, // Parrot - will perch on dedicated palm tree
    name: "Parrot",
    modelPath: "/models/Parrot.glb",
    scale: 0.2,
    position: [40, 0, -40], // Base position - will be elevated by component
    rotation: [0, Math.PI / 4, 0],
    attachToTree: true,
    isPalmPercher: true, // Special flag to create dedicated palm tree
  },
  {
    id: 16787, // Toco Toucan
    name: "Toco Toucan",
    modelPath: "/models/TocoToucan.glb",
    scale: 2,
    position: [-8, 0, -12],
    rotation: [0, 4.1, 0],
    attachToTree: true,
  },
  {
    id: 9183, // Sparrow
    name: "Sparrow",
    modelPath: "/models/Sparrow.glb",
    scale: 0.02,
    position: [2, 0, -18],
    rotation: [0, 3.5, 0],
    attachToTree: true,
  },
];

// Merge animal info with model data
const mergedModels = rainforestModels.map((m) => ({
  ...m,
  info: speciesMap[m.id] || null,
}));

export default mergedModels;