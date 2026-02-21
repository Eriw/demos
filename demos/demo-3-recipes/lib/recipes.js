export const recipes = [
  {
    id: 'rodvinbarsrutor',
    name: 'Rödvinbärsrutor',
    yield: 'Ca 35 st.',
    emoji: '🍰',
    sections: [
      {
        name: null,
        ingredients: [
          '50 g smör',
          '3 äggulor',
          '2 dl socker',
          '1 msk vaniljsocker',
          '4 dl vetemjöl',
          '2 tsk bakpulver',
          '2 msk kokande vatten',
          '1,5 dl mjölk',
        ],
        steps: [
          'Sätt ugnen på 200°C.',
          'Smörj en långpanna.',
          'Smält smöret. Vispa gulor och socker pösigt. Tillsätt vaniljsocker.',
          'Rör ner mjölet med bakpulver. Tillsätt hett vatten och mjölk.',
          'Blanda till sist i smöret.',
          'Grädda i 12–15 minuter. (Tips: grädda i gratängformen.)',
        ],
      },
      {
        name: 'Vinbärsmassa',
        ingredients: [
          '3 äggvitor',
          '3 dl strösocker',
          '1 msk vaniljsocker',
          '3 dl repade röda vinbär (ca 200 g)',
        ],
        steps: [
          'Vispa upp äggvitorna till hårt skum.',
          'Vänd ner strösocker, vanilj och vinbär.',
          'Bred massan över den gräddade kakan.',
          'Höj ugnstemperaturen till 250°C och grädda i 5 minuter på översta falsen. (Tips: 225°C i 5–7 minuter på "andra från stora glappet".)',
        ],
      },
    ],
  },
  {
    id: 'pannkakor',
    name: 'Pannkakor',
    yield: 'Ca 16 st.',
    emoji: '🥞',
    sections: [
      {
        name: null,
        ingredients: [
          '3 dl vetemjöl',
          '1 tsk salt',
          '6 dl mjölk',
          '3 ägg',
          'Smör till stekning',
        ],
        steps: [
          'Blanda mjöl och salt i en bunke.',
          'Vispa ner hälften av mjölken till en slät smet.',
          'Tillsätt resten av mjölken och äggen. Vispa ordentligt.',
          'Låt smeten vila i minst 30 minuter.',
          'Hetta upp en stekpanna och smält lite smör.',
          'Häll i en slev smet och bred ut den tunt.',
          'Stek tills kanterna börjar lossna, vänd och stek en minut till.',
          'Servera med sylt och grädde.',
        ],
      },
    ],
  },
  {
    id: 'kladdkaka',
    name: 'Kladdkaka',
    yield: '1 form, ca 10 bitar',
    emoji: '🍫',
    sections: [
      {
        name: null,
        ingredients: [
          '100 g smör',
          '2 ägg',
          '3 dl socker',
          '1,5 dl vetemjöl',
          '4 msk kakao',
          '1 tsk vaniljsocker',
          '1 krm salt',
        ],
        steps: [
          'Sätt ugnen på 175°C.',
          'Smörj och bröa en springform (ca 24 cm).',
          'Smält smöret och låt det svalna något.',
          'Vispa ägg och socker pösigt.',
          'Blanda mjöl, kakao, vaniljsocker och salt.',
          'Vänd ner mjölblandningen och det smälta smöret i äggsmeten.',
          'Häll smeten i formen.',
          'Grädda i mitten av ugnen i ca 15–18 minuter – mitten ska vara kladdig.',
          'Låt svalna i formen. Pudra med florsocker och servera med vispgrädde.',
        ],
      },
    ],
  },
];

export function getRecipe(id) {
  return recipes.find((r) => r.id === id) ?? null;
}
