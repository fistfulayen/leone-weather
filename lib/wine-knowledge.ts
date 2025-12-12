/**
 * Local Wine Knowledge Base for Louisina
 * Small to medium-sized producers within ~2 hours of Cascina Leone (Niella Belbo)
 */

export const WINE_REGIONS = {
  dogliani: {
    name: 'Dogliani',
    grape: 'Dolcetto',
    producers: [
      {
        name: 'Valdibà',
        wines: ['Dogliani Superiore "Valdibacco"', 'Dogliani DOCG', 'Freisa', 'Nascetta'],
        notes: 'Organic Dolcetto specialist. Valdibacco: ruby-purple, blackberry, black cherry, spicy notes, soft tannins. Perfect with game, braised meats, aged cheeses.',
        style: 'Organic, authentic Dogliani with purity and finesse',
      },
      {
        name: 'Pecchenino',
        wines: ['Dogliani Superiore "Sirì d\'Jermu"', 'Barolo', 'Barbera'],
        notes: 'Flagship Sirì d\'Jermu: intense blackberries, currants, black cherries. 12 months in oak. Tre Bicchieri winner. Smooth, sweet tannins.',
        style: 'Elevated Dolcetto, sustainable farming',
      },
      {
        name: 'San Fereolo',
        wines: ['Dogliani DOCG', 'Langhe Nebbiolo'],
        notes: 'Biodynamic. Ageworthy Dolcetto aged 6-8 years before release. Dark berry, savory spice, firm tannins. Complex tertiary notes.',
        style: 'Natural, biodynamic, minimal intervention',
      },
      {
        name: 'Chionetti',
        wines: ['Dolcetto "Briccolero"'],
        notes: 'Old-vine Dolcetto. Red and black fruits, anise, almond hints. Tre Bicchieri winner. Organic viticulture.',
        style: 'Historic Dolcetto specialist',
      },
      {
        name: 'Anna Maria Abbona',
        wines: ['Dogliani "Sorì di Rivör"'],
        notes: 'High-altitude organic Dogliani. Fragrant rose and red cherry, fresh palate. Also makes rare Rossese Bianco.',
        style: 'Small organic estate',
      },
    ],
  },
  altaLanga: {
    name: 'Alta Langa',
    grape: 'Sparkling (Pinot Noir, Chardonnay) & Moscato',
    producers: [
      {
        name: 'Marcalberto',
        wines: ['Alta Langa Millesimato Extra Brut', 'Alta Langa Nature (zero dosage)'],
        notes: 'Boutique metodo classico. 36-42 months on lees. Delicate perlage, brioche, mint, citrus. Crisp, mineral-driven.',
        style: 'Traditional method, Champagne-style',
      },
      {
        name: 'Ca\' d\'Gal',
        wines: ['Moscato d\'Asti "Vigna Vecchia"', 'Moscato "Sant\'Ilario"'],
        notes: 'Old-vine Moscato. Ripe peach, apricot, acacia blossom, sage. Delicately sweet, light effervescence. Tre Bicchieri.',
        style: 'Top-tier complex Moscato',
      },
      {
        name: 'Paolo Saracco',
        wines: ['Moscato d\'Asti DOCG'],
        notes: 'The Maestro of Moscato. Orange blossom, juicy peach, wild sage, lime. Vibrant, clean, never syrupy. 90+ points.',
        style: 'Benchmark Moscato d\'Asti',
      },
    ],
  },
  barolo: {
    name: 'Barolo',
    grape: 'Nebbiolo',
    producers: [
      {
        name: 'Bartolo Mascarello',
        wines: ['Barolo (blend of crus)'],
        notes: 'Legendary traditionalist. 100-point wines. Violet, rose petal, red berries, menthol, tar, tea leaf, cherry, licorice. Silky yet powerful. Ages 20+ years.',
        style: 'Traditional, organic (uncertified), large oak only',
      },
      {
        name: 'Giuseppe Rinaldi',
        wines: ['Barolo Brunate', 'Barolo Tre Tine'],
        notes: 'Cult classic. Blood orange zest, dried cherries, violet, grilled meat. Dark cherry, blackberry, minerals, floral. Firm structure.',
        style: 'Traditional, organic, soulful',
      },
      {
        name: 'Giacomo Conterno',
        wines: ['Barolo Riserva "Monfortino"', 'Barolo Cascina Francia'],
        notes: 'Icon. Monfortino: 98-100 points, ages 40+ years. Red fruits, tar, licorice, strawberry, tobacco, mineral. Profound complexity.',
        style: 'Traditional, long cask aging',
      },
      {
        name: 'G.D. Vajra',
        wines: ['Barolo Bricco delle Viole', 'Barolo Coste di Rose'],
        notes: 'Certified organic since 1970s. Elegant, mysterious. Blue violets, dried rose, kirsch, blood orange. Silky tannins, minerally.',
        style: 'Organic, elegant, pure',
      },
      {
        name: 'Cavallotto',
        wines: ['Barolo Bricco Boschis', 'Barolo Riserva Vignolo'],
        notes: 'Certified organic. Black cherry, tobacco, rose, licorice, pomegranate. Full ripe tannins, bright freshness. Traditional.',
        style: 'Organic, traditional, consistent',
      },
      {
        name: 'Comm. G.B. Burlotto',
        wines: ['Barolo Monvigliero', 'Barolo Acclivi'],
        notes: 'Verduno. 99-point Monvigliero. Rose, red berry, dark spice, smoke. Whole-cluster fermentation. Perfumed, silky, vibrant.',
        style: 'Traditional, refined, lacy',
      },
    ],
  },
  barbaresco: {
    name: 'Barbaresco',
    grape: 'Nebbiolo',
    producers: [
      {
        name: 'Roagna',
        wines: ['Barbaresco Pajé', 'Barbaresco Albesani'],
        notes: 'Natural, biodynamic. 60+ day maceration. Dried cherry, rose, licorice, earth, tobacco, anise. Gentle color, very aromatic.',
        style: 'Natural, minimal intervention, old vines',
      },
      {
        name: 'Sottimano',
        wines: ['Barbaresco Cottà', 'Barbaresco Pajoré', 'Barbaresco Currà'],
        notes: 'Small organic. Red currant, plum, menthol, spices. Silky mouthfeel. 94-96 points. Polished, no filtering.',
        style: 'Organic, elegant',
      },
    ],
  },
  barbera: {
    name: 'Barbera d\'Asti / Nizza',
    grape: 'Barbera',
    producers: [
      {
        name: 'Braida di Giacomo Bologna',
        wines: ['Barbera d\'Asti Superiore "Bricco dell\'Uccellone"', 'Barbera "Montebruna"'],
        notes: 'Iconic. Bricco: 95 points. Blackberry compote, spiced plums, cedar. Macerated cherry, anise, clove, cocoa. Bold, vibrant acidity.',
        style: 'Barrel-aged, world-class Barbera',
      },
    ],
  },
  roero: {
    name: 'Roero',
    grape: 'Nebbiolo & Arneis',
    producers: [
      {
        name: 'Matteo Correggia',
        wines: ['Roero Riserva "Ròche d\'Ampsej"', 'Barbera d\'Alba "Marun"'],
        notes: 'Top Roero Nebbiolo. Rose petal, red fruit, tobacco, truffle, spice. Soft, voluminous, fine tannins. 92-94 points.',
        style: 'Sustainable/organic, approachable Nebbiolo',
      },
      {
        name: 'Malvirà',
        wines: ['Roero Arneis Renesio', 'Roero Arneis Trinità'],
        notes: 'Certified organic. White blossoms, pear, peach, citrus, chamomile, mint, pineapple. Fresh, slightly salty/mineral finish. Tre Bicchieri.',
        style: 'Organic, top Arneis',
      },
    ],
  },
};

export const WINE_PAIRING_TIPS = {
  coldWeather: ['Barolo', 'Barbaresco', 'Dogliani Superiore', 'Barbera d\'Asti'],
  warmWeather: ['Arneis', 'Moscato d\'Asti', 'Dolcetto', 'Alta Langa sparkling'],
  rainyWeather: ['Barolo Riserva', 'Barbera', 'Dogliani'],
  clearWeather: ['Alta Langa', 'Moscato', 'Arneis', 'Roero Nebbiolo'],

  meatDishes: ['Barolo', 'Barbaresco', 'Barbera', 'Dogliani'],
  lightDishes: ['Arneis', 'Dolcetto', 'Roero Nebbiolo'],
  wildBoar: ['Barolo', 'Barbaresco', 'Dogliani Superiore'],
  pasta: ['Barbera', 'Dolcetto', 'Roero Nebbiolo'],
  dessert: ['Moscato d\'Asti'],
};
