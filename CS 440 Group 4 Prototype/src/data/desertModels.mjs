import desertSpecies from "./desertSpecies.json";

const speciesMap = {};
desertSpecies.species.forEach((s) => {
  speciesMap[s.id] = s;
});

// Fixed positions - won't change on refresh
const desertModels = [
  {
    id: 1,
    name: "Sidewinder Rattlesnake",
    modelPath: "/desertModels/rattlesnake.glb",
    scale: 0.04, //0.04
    position: [116.5, 0 , -45.6],
    rotation: [0, -400, 0],
  },
  {
    id: 2,
    name: "Fennec Fox",
    modelPath: "/desertModels/fox.glb",
    scale: 0.022, //0.022
    position: [-100, 0.59 , 80],
    rotation: [0, 800, 0],
  },
  {
    id: 3,
    name: "Coyote",
    modelPath: "/desertModels/coyote.glb",
    scale: 0.25, //0.25
    position: [34, 0 , 168],
    rotation: [0, -200, 0],
  },
  {
    id: 81542,
    name: "Dromedary Camel",
    modelPath: "/desertModels/camel.glb",
    scale: 0.35, //0.35
    position: [-68, 0, -150],
    rotation: [0, -100, 0],
  },
  {
    id: 43059,
    name: "North African Hedgehog",
    modelPath: "/desertModels/hedgehog.glb",
    scale: 0.008, //0.008
    position: [15, 0.24 , 60],
    rotation: [0, 300, 0],
  }
];

// Merge animal info with model data
const mergedModels = desertModels.map((m) => ({
  ...m,
  info: speciesMap[m.id] || null,
}));

export default mergedModels;