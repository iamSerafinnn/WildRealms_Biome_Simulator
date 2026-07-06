// src/data/challengeScenarios.mjs
const challengeScenarios = [
  {
    id: 1,
    scenario: "Local coyote population has declined 60%. Ranchers want to hunt remaining coyotes to protect livestock. What should we do?",
    decisions: [
      { 
        text: "Allow unrestricted hunting to protect ranchers' interests",
        correct: false,
        consequence: "The coyote population collapses. Ecosystem imbalance leads to rodent overpopulation."
      },
      { 
        text: "Implement protected hunting seasons and enforce strict quotas",
        correct: true,
        consequence: "Coyote population stabilizes. Ranchers use alternative livestock protection methods."
      },
      { 
        text: "Ban all hunting immediately",
        correct: false,
        consequence: "Ranchers ignore the ban. Trust in conservation efforts decreases."
      }
    ]
  },
  {
    id: 2,
    scenario: "Illegal poaching of desert bighorn sheep threatens the species. How do we combat this?",
    decisions: [
      { 
        text: "Increase ranger patrols and enforce strict penalties for poachers",
        correct: true,
        consequence: "Poaching decreases. Sheep population begins to recover in protected areas."
      },
      { 
        text: "Do nothing - let natural selection decide",
        correct: false,
        consequence: "Poaching continues unchecked. Species population drops critically."
      },
      { 
        text: "Allow hunters to legally hunt the remaining sheep",
        correct: false,
        consequence: "The species faces extinction. Critical habitat lost forever."
      }
    ]
  },
  {
    id: 3,
    scenario: "Desert foxes are being hunted for their fur. What conservation strategy works best?",
    decisions: [
      { 
        text: "Establish wildlife sanctuaries where hunting is prohibited",
        correct: true,
        consequence: "Fox populations recover in protected zones. Population spreads to surrounding areas."
      },
      { 
        text: "Encourage more hunting to reduce 'overpopulation'",
        correct: false,
        consequence: "Fox numbers plummet. Ecosystem loses an important predator."
      },
      { 
        text: "Promote alternative fur sources to reduce demand",
        correct: true,
        consequence: "Hunting pressure decreases naturally. Populations stabilize and grow."
      }
    ]
  },
  {
    id: 4,
    scenario: "A real estate developer plans to build a resort in prime desert habitat used by endangered species. How should we respond?",
    decisions: [
      { 
        text: "Approve the development - economic growth is more important",
        correct: false,
        consequence: "Critical habitat is destroyed. Wildlife populations crash as animals lose shelter and food sources."
      },
      { 
        text: "Designate the area as a protected nature reserve",
        correct: true,
        consequence: "The habitat is preserved. Species populations stabilize and continue to thrive."
      },
      { 
        text: "Allow partial development with minimal environmental impact",
        correct: false,
        consequence: "Even 'minimal' development fragments the habitat. Animal migration routes are cut off."
      }
    ]
  },
  {
    id: 5,
    scenario: "Urban sprawl is expanding into desert grasslands where jackrabbits breed. What's the best approach?",
    decisions: [
      { 
        text: "Create wildlife corridors connecting fragmented habitats",
        correct: true,
        consequence: "Animals can safely move between habitat patches. Populations remain healthy and connected."
      },
      { 
        text: "Continue development without restrictions",
        correct: false,
        consequence: "Populations become isolated. Inbreeding and resource scarcity lead to population decline."
      },
      { 
        text: "Relocate animals to a distant wildlife park",
        correct: false,
        consequence: "Relocated animals struggle in unfamiliar environments. Many don't survive the transition."
      }
    ]
  },
  {
    id: 6,
    scenario: "Industrial water pumping for cities is depleting aquifers that desert species depend on. What action is needed?",
    decisions: [
      { 
        text: "Implement strict water conservation laws and alternative water sources",
        correct: true,
        consequence: "Water tables stabilize. Desert water sources recover and animals survive droughts."
      },
      { 
        text: "Continue pumping - cities need water more than wildlife",
        correct: false,
        consequence: "Aquifers dry up completely. Desert ecosystems collapse as water sources vanish."
      },
      { 
        text: "Build dams to increase water supply",
        correct: false,
        consequence: "Dams disrupt natural water flow. Wetlands and springs disappear, taking species with them."
      }
    ]
  }
];

export default challengeScenarios;