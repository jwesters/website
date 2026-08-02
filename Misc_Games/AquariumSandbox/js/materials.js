(function () {
  'use strict';

  const A = {
    EMPTY: 0,
    WATER: 1,
    SAND: 2,
    ROCK: 3,
    GRAVEL: 4,
    MUD: 5,
    OIL: 6,
    LAVA: 7,
    ICE: 8,
    FOOD: 9,
    BUBBLE: 10,
    DIRT: 11,

    SEAWEED: 20,
    ALGAE: 21,
    CORAL: 22,
    MOSS: 23,

    DECOR_DRIFTWOOD: 40,
    DECOR_CORAL: 41,
    DECOR_CASTLE: 42,
    DECOR_SHIP: 43,

    CURRENT_RIGHT: 60,
    CURRENT_LEFT: 61,
    CURRENT_UP: 62,
    CURRENT_DOWN: 63
  };

  A.MATERIALS = [
    { id: A.WATER, label: 'Water', icon: '💧' },
    { id: A.SAND, label: 'Sand', icon: '🟨' },
    { id: A.ROCK, label: 'Rock', icon: '🪨' },
    { id: A.GRAVEL, label: 'Gravel', icon: '🟫' },
    { id: A.DIRT, label: 'Dirt', icon: '🟤' },
    { id: A.MUD, label: 'Mud', icon: '🪵' },
    { id: A.OIL, label: 'Oil', icon: '🛢️' },
    { id: A.LAVA, label: 'Lava', icon: '🌋' },
    { id: A.ICE, label: 'Ice', icon: '🧊' },
    { id: A.FOOD, label: 'Food', icon: '🍤' },
    { id: A.BUBBLE, label: 'Bubbles', icon: '🫧' }
  ];

  A.PLANTS = [
    { id: A.ALGAE, label: 'Algae', icon: '🦠' },
    { id: A.SEAWEED, label: 'Seaweed', icon: '🌿' },
    { id: A.CORAL, label: 'Coral', icon: '🪸' },
    { id: A.MOSS, label: 'Moss', icon: '☘️' }
  ];

  A.CREATURE_TOOL_DEFS = [
    { id: 'fish', label: 'Fish', icon: '🐟' },
    { id: 'predatorFish', label: 'Predator Fish', icon: '🦈' },
    { id: 'shrimp', label: 'Shrimp', icon: '🦐' },
    { id: 'crab', label: 'Crab', icon: '🦀' },
    { id: 'snail', label: 'Snail', icon: '🐌' },
    { id: 'frog', label: 'Frog', icon: '🐸' },
    { id: 'jellyfish', label: 'Jellyfish', icon: '🎐' },
    { id: 'starfish', label: 'Starfish', icon: '⭐' }
  ];

  A.DECORATIONS = [
    { id: 'driftwood', label: 'Driftwood', icon: '🪵' },
    { id: 'coralDecor', label: 'Coral', icon: '🪸' },
    { id: 'castle', label: 'Castle', icon: '🏰' },
    { id: 'ship', label: 'Sunken Ship', icon: '⛵' }
  ];

  A.FORCE_TOOLS = [
    { id: 'stir', label: 'Move / Stir', icon: '🖐️' },
    { id: 'grab', label: 'Grab', icon: '✋' },
    { id: 'inspect', label: 'Inspect', icon: '🔎' },
    { id: 'current', label: 'Current Brush', icon: '🌊' },
    { id: 'heat', label: 'Heat Brush', icon: '🔥' },
    { id: 'cool', label: 'Cool Brush', icon: '❄️' },
    { id: 'net', label: 'Net', icon: '🪤' },
    { id: 'erase', label: 'Erase', icon: '🧽' },
    { id: 'explode', label: 'Explosion', icon: '💥' },
    { id: 'drain', label: 'Drain', icon: '🚰' }
  ];

  A.DECOR_TYPES = [A.DECOR_DRIFTWOOD, A.DECOR_CORAL, A.DECOR_CASTLE, A.DECOR_SHIP];
  A.PLANT_TYPES = [A.SEAWEED, A.ALGAE, A.CORAL, A.MOSS];

  A.colorFor = function colorFor(type, x, y) {
    const n = Math.abs((x * 17 + y * 13) % 19);
    switch (type) {
      case A.WATER: return 'rgba(' + (16 + n) + ',' + (128 + n) + ',' + (196 + n) + ',0.86)';
      case A.SAND: return 'rgb(' + (196 + n) + ',' + (162 + Math.floor(n * .6)) + ',' + (86 + Math.floor(n * .2)) + ')';
      case A.ROCK: return 'rgb(' + (74 + n) + ',' + (79 + n) + ',' + (84 + n) + ')';
      case A.GRAVEL: return 'rgb(' + (116 + n) + ',' + (111 + n) + ',' + (98 + n) + ')';
      case A.MUD: return 'rgb(' + (102 + n) + ',' + (74 + Math.floor(n * .4)) + ',' + (45 + Math.floor(n * .2)) + ')';
      case A.OIL: return 'rgba(75,53,35,0.88)';
      case A.LAVA: return n % 2 ? '#ff6325' : '#ffb02a';
      case A.ICE: return 'rgba(170,228,255,0.95)';
      case A.FOOD: return '#ffcf6b';
      case A.BUBBLE: return 'rgba(215,240,255,0.22)';
      case A.DIRT: return '#8f6b3a';
      case A.SEAWEED: return n % 2 ? '#26c55f' : '#1caa4e';
      case A.ALGAE: return '#3aa65e';
      case A.CORAL: return n % 2 ? '#ff7c73' : '#ffab7c';
      case A.MOSS: return '#4a9d43';
      default: return '#ffffff';
    }
  };

  window.Aquarium = Object.assign(window.Aquarium || {}, A);
}());
