/**
 * moteurRecettes.ts — le catalogue combinatoire de Frigo-Placard.
 *
 * Ce moteur génère ~3 200 recettes déterministes (100 % local, aucun réseau,
 * aucune IA) : bases de féculents × protéines × légumes × sauces, avec
 * cohérence de régime, kcal estimées, étapes, minuteurs, conseils,
 * conservation et budget. Les 37 recettes « maison » de data.ts restent la
 * crème : le moteur, c'est le déversement d'idées — celles qui débloquent
 * l'inspiration quand le frigo parle.
 *
 * Génération déterministe : même indice = même recette, toujours (mulberry32).
 */
import type { Recette, Regime, Niveau } from './types';

export const NOMBRE_MOTEUR = 3_200;

/* ---------------------------------------------------------------------------
   Le vocabulaire culinaire (chaque entrée déclare ses régimes compatibles)
--------------------------------------------------------------------------- */

interface Lexique {
  nom: string;
  emoji?: string;
  kcal100?: number;
  unite?: string;
  qtePour4?: number;
  /** Régimes compatibles : intersectés pendant la composition. */
  regimes?: Regime[];
  cuisson?: number;
  etape?: string;
  congelable?: boolean;
  budget?: 1 | 2 | 3;
  categorie?: string;
}

const TOUS: Regime[] = ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose', 'halal', 'casher', 'keto'];
const VEGE_SANS_LACTOSE: Regime[] = ['vegetarien', 'vegan', 'sans-lactose', 'halal', 'casher'];
const VEGETARIENNE: Regime[] = ['vegetarien', 'sans-lactose', 'halal', 'casher'];
const VIANDE_OK: Regime[] = ['sans-lactose', 'halal', 'casher'];

const BASES: Lexique[] = [
  { nom: 'pâtes penne', emoji: '🍝', kcal100: 131, unite: 'g', qtePour4: 320, regimes: VEGE_SANS_LACTOSE, cuisson: 10, congelable: true, budget: 1, categorie: 'pates', etape: 'Jette les pâtes dans l’eau salée déjà frémissante — un cran de moins que le paquet, elles finiront en sauce.' },
  { nom: 'riz', emoji: '🍚', kcal100: 130, unite: 'g', qtePour4: 280, regimes: VEGE_SANS_LACTOSE, cuisson: 15, congelable: true, budget: 1, categorie: 'riz', etape: 'Rince le riz jusqu’à l’eau claire, couvre d’un volume et demi d’eau, feu doux, sans remuer.' },
  { nom: 'semoule', emoji: '🌾', kcal100: 118, unite: 'g', qtePour4: 300, regimes: VEGE_SANS_LACTOSE, cuisson: 6, congelable: false, budget: 1, categorie: 'riz', etape: 'Semoule : eau bouillante à hauteur, bol recouvert, cinq minutes — pas de casserole à surveiller.' },
  { nom: 'gnocchis', emoji: '🥔', kcal100: 160, unite: 'g', qtePour4: 500, regimes: VEGE_SANS_LACTOSE, cuisson: 20, congelable: true, budget: 1, categorie: 'pates', etape: 'Gnocchis directement au four : ils dorent, se tiennent et n’ennuient personne.' },
  { nom: 'pomme de terre', emoji: '🥔', kcal100: 77, unite: 'g', qtePour4: 600, regimes: VEGE_SANS_LACTOSE, cuisson: 20, congelable: false, budget: 1, categorie: 'vege', etape: 'Pommes de terre : cuisson vapeur ou à l’eau, avec la peau pour les vitamines.' },
  { nom: 'patate douce', emoji: '🍠', kcal100: 86, unite: 'g', qtePour4: 550, regimes: VEGE_SANS_LACTOSE, cuisson: 25, congelable: false, budget: 2, categorie: 'vege', etape: 'Patate douce en dés : four ou poêle, elle caramélise plus vite que la pomme de terre.' },
  { nom: 'quinoa', emoji: '🌱', kcal100: 120, unite: 'g', qtePour4: 260, regimes: VEGE_SANS_LACTOSE, cuisson: 12, congelable: true, budget: 2, categorie: 'riz', etape: 'Quinoa : rinçage soigné (la saponine est amère), cuisson 12 min couvert.' },
  { nom: 'lentilles', emoji: '🫘', kcal100: 116, unite: 'g', qtePour4: 280, regimes: VEGE_SANS_LACTOSE, cuisson: 22, congelable: true, budget: 1, categorie: 'vege', etape: 'Lentilles : pas de sel avant la fin — elles durciraient.' },
  { nom: 'pois chiches', emoji: '🫘', kcal100: 364, unite: 'g', qtePour4: 240, regimes: VEGE_SANS_LACTOSE, cuisson: 5, congelable: true, budget: 1, categorie: 'vege', etape: 'Pois chiches égouttés : à la poêle bien chaude ils deviennent croustillants en minutes.' },
  { nom: 'haricots blancs', emoji: '🫘', kcal100: 100, unite: 'g', qtePour4: 240, regimes: VEGE_SANS_LACTOSE, cuisson: 5, congelable: true, budget: 1, categorie: 'vege', etape: 'Haricots blancs : égoutte-les, réserve un peu d’eau de boîte pour lier la sauce.' },
  { nom: 'polenta', emoji: '🌽', kcal100: 98, unite: 'g', qtePour4: 200, regimes: VEGE_SANS_LACTOSE, cuisson: 8, congelable: true, budget: 1, categorie: 'vege', etape: 'Polenta : en pluie dans l’eau salée bouillante, en remuant — elle épaissit vite.' },
  { nom: 'restes de riz cuit', emoji: '🍚', kcal100: 130, unite: 'g', qtePour4: 300, regimes: VEGE_SANS_LACTOSE, cuisson: 4, congelable: false, budget: 1, categorie: 'riz', etape: 'Riz déjà cuit : en avant dans la poêle à feu vif — c’est le roi des restes.' },
  { nom: 'restes de pâtes', emoji: '🍝', kcal100: 131, unite: 'g', qtePour4: 300, regimes: VEGE_SANS_LACTOSE, cuisson: 4, congelable: false, budget: 1, categorie: 'pates', etape: 'Pâtes déjà cuites : réchauffe-les directement dans la sauce, jamais à l’eau.' },
  { nom: 'pain sec', emoji: '🍞', kcal100: 265, unite: 'g', qtePour4: 250, regimes: VEGE_SANS_LACTOSE, cuisson: 8, congelable: false, budget: 1, categorie: 'dessert', etape: 'Pain sec : en cubes épais, à réveiller au four ou dans un peu d’huile.' },
];

const LEGUMES: Lexique[] = [
  { nom: 'courgette', kcal100: 17, regimes: TOUS },
  { nom: 'aubergine', kcal100: 25, regimes: TOUS },
  { nom: 'poivron', kcal100: 31, regimes: TOUS },
  { nom: 'champignons', kcal100: 22, regimes: TOUS },
  { nom: 'épinards', kcal100: 23, regimes: TOUS },
  { nom: 'tomate', kcal100: 18, regimes: TOUS },
  { nom: 'carotte', kcal100: 41, regimes: TOUS },
  { nom: 'oignon rouge', kcal100: 45, regimes: TOUS },
  { nom: 'poireau', kcal100: 34, regimes: TOUS },
  { nom: 'brocoli', kcal100: 34, regimes: TOUS },
  { nom: 'chou-fleur', kcal100: 25, regimes: TOUS },
  { nom: 'haricots verts', kcal100: 35, regimes: TOUS },
  { nom: 'fenouil', kcal100: 31, regimes: TOUS },
  { nom: 'betterave cuite', kcal100: 43, regimes: TOUS },
  { nom: 'courge', kcal100: 40, regimes: TOUS },
  { nom: 'céleri branche', kcal100: 16, regimes: TOUS },
  { nom: 'petits pois', kcal100: 81, regimes: TOUS },
  { nom: 'radis', kcal100: 16, regimes: TOUS },
  { nom: 'blette', kcal100: 19, regimes: TOUS },
  { nom: 'endive', kcal100: 17, regimes: TOUS },
];

const PROTEINES: Lexique[] = [
  { nom: 'oeuf', kcal100: 143, unite: 'unité', qtePour4: 6, regimes: ['vegetarien', 'sans-gluten', 'sans-lactose', 'halal', 'casher', 'keto'], budget: 1, etape: 'Œufs : casse-les et bats-les — ils lient toute la poêle en deux minutes.' },
  { nom: 'thon en boîte', kcal100: 130, unite: 'g', qtePour4: 150, regimes: ['sans-gluten', 'sans-lactose', 'keto'], budget: 2, etape: 'Thon émietté : ajoute-le à la fin, il s’effeuille dans la sauce comme dans un oreiller.' },
  { nom: 'reste de poulet', kcal100: 168, unite: 'g', qtePour4: 180, regimes: VIANDE_OK, budget: 2, etape: 'Poulet restant : fais-le bronzer une minute — il regagne du corps.' },
  { nom: 'reste de boeuf', kcal100: 250, unite: 'g', qtePour4: 150, regimes: VIANDE_OK, budget: 2, etape: 'Bœuf émincé : chauffe-le dans la sauce — à part, il durcirait encore.' },
  { nom: 'lardons', kcal100: 400, unite: 'g', qtePour4: 120, regimes: ['sans-lactose', 'keto'], budget: 2, etape: 'Lardons : rends leur gras, garde-le — c’est le fond de tout.' },
  { nom: 'sardines', kcal100: 208, unite: 'g', qtePour4: 120, regimes: ['sans-gluten', 'sans-lactose', 'keto'], budget: 1, etape: 'Sardines effilées : ajoute-les à la fin, elles se délitent trop vite.' },
  { nom: 'tofu ferme', kcal100: 145, unite: 'g', qtePour4: 250, regimes: VEGE_SANS_LACTOSE, budget: 2, etape: 'Tofu : pressé, en cubes, à la poêle brûlante — croustillant dehors, tendre dedans.' },
  { nom: 'pois chiches grillés', kcal100: 364, unite: 'g', qtePour4: 240, regimes: VEGE_SANS_LACTOSE, budget: 1, etape: 'Pois chiches brillants de gras : deux minutes de saisie avant tout le reste.' },
  { nom: 'haricots rouges', kcal100: 127, unite: 'g', qtePour4: 240, regimes: VEGE_SANS_LACTOSE, budget: 1, etape: 'Haricots rouges : verges-les dans la sauce, ils s’en imprègnent en mijotant.' },
  { nom: 'reste de poisson', kcal100: 110, unite: 'g', qtePour4: 150, regimes: ['sans-gluten', 'sans-lactose', 'keto'], budget: 2, etape: 'Poisson d’hier : s’incorpore en toute fin — il est déjà cuit de sa vie.' },
  { nom: 'fromage frais', kcal100: 250, unite: 'g', qtePour4: 150, regimes: VEGETARIENNE, budget: 2, etape: 'Fromage frais : en fin de cuisson, jamais à ébullition — sinon il granule.' },
  { nom: 'blanc de dinde', kcal100: 135, unite: 'g', qtePour4: 180, regimes: VIANDE_OK, budget: 2, etape: 'Dinde en lichettes : poêle courte — elle reste tendre en se dorant.' },
];

const SAUCES: Lexique[] = [
  { nom: 'sauce tomate maison', kcal100: 40, regimes: TOUS, cuisson: 10, congelable: true, etape: 'Le fond du plat : tomates concassées, une gousse d’ail écrasée, huile — laisse réduire.' },
  { nom: 'crème moutarde', kcal100: 180, regimes: VEGETARIENNE, cuisson: 6, congelable: false, etape: 'Crème + une cuillère de moutarde : fouette hors du feu, elle s’épaissit seule.' },
  { nom: 'sauce yaourt-herbes', kcal100: 90, regimes: VEGETARIENNE, cuisson: 2, congelable: false, etape: 'Yaourt + herbes + citron : froide, directe. Sers-la immédiatement.' },
  { nom: 'béchamel express', kcal100: 130, regimes: VEGETARIENNE, cuisson: 8, congelable: true, etape: 'Beurre + farine deux minutes, lait en filet : la sauce maternelle de la maison.' },
  { nom: 'beurre-citron', kcal100: 250, regimes: VEGETARIENNE, cuisson: 3, congelable: false, etape: 'Beurre + citron + un filet d’eau de cuisson : simple comme bonjour.' },
  { nom: 'sauce coco-piment', kcal100: 190, regimes: VEGE_SANS_LACTOSE, cuisson: 8, congelable: true, etape: 'Lait de coco + épices : petite feu, sans jamais faire bouillir furieusement.' },
  { nom: 'vinaigrette chaude', kcal100: 220, regimes: TOUS, cuisson: 2, congelable: false, etape: 'Huile bien chaude, ail, une goutte de vinaigre en finale : le plat se réveille.' },
  { nom: 'pesto express', kcal100: 380, regimes: VEGETARIENNE, cuisson: 5, congelable: true, etape: 'Herbes + noix + huile : le pesto pardonne tout et se garde plusieurs jours.' },
  { nom: 'sauce soja-gingembre', kcal100: 60, regimes: ['vegetarien', 'vegan', 'sans-lactose', 'halal', 'casher'], cuisson: 5, congelable: false, etape: 'Sauce soja + gingembre râpé + une cuillère de sucre : un quart d’Asie dans ton frigo.' },
  { nom: 'sauce tomate pimentée', kcal100: 50, regimes: TOUS, cuisson: 10, congelable: true, etape: 'Tomate + une pincée de harissa ou de piment doux : sort les restes de leur torpeur.' },
  { nom: 'huile-ail', kcal100: 380, regimes: VEGE_SANS_LACTOSE, cuisson: 5, congelable: true, etape: 'Huile + ail à feu doux : ça parfume sans jamais brûler.' },
  { nom: 'sauce fromage fondue', kcal100: 330, regimes: VEGETARIENNE, cuisson: 6, congelable: false, etape: 'Fromage fondu dans la crème : ajoute une cuillère d’eau de cuisson pour lisser.' },
];

const HERBES: Lexique[] = [
  { nom: 'persil', regimes: TOUS },
  { nom: 'thym', regimes: TOUS },
  { nom: 'basilic', regimes: TOUS },
  { nom: 'romarin', regimes: TOUS },
  { nom: 'menthe', regimes: TOUS },
  { nom: 'coriandre', regimes: TOUS },
  { nom: 'ciboulette', regimes: TOUS },
  { nom: 'aneth', regimes: TOUS },
];

const CONSEILS: string[] = [
  'Si ton plat devient un peu sec : une cuillère d’eau de cuisson, et tout redevient souple.',
  'Sels deux fois, mais peu à chaque fois : le plat décide à la fin, pas au début.',
  'Trop salé ? Une pomme de terre crue dans la casserole, puis retire-la après 15 minutes.',
  'Ton plat manque d’âme ? Un filet de citron — c’est l’anti-fatigue des plats tristes.',
  'Un reste de fromage un peu sec râpé gratiné sur la fin : service gratuit.',
  'Poivre toujours à la fin : le poivre s’aigrit à la longue cuisson.',
  'Goûte à chaque étape : cinq secondes qui rendent le plat personnel.',
  'La sauce se lie mieux quand on patiente deux minutes hors du feu, sans la faire bouillir.',
  'Un fond de bouillon dans l’eau de cuisson du féculent : c’est un parfum offert.',
  'Sers chaud dans une assiette tiède : la différence se sent tout de suite.',
  'Presse les légumes saleés avant cuisson : l’eau abandonnée ne va pas dans le plat.',
  'Un reste de persil mixé avec de l’huile se glace en bacs : prête pour trois semaines.',
];

/* ---------------------------------------------------------------------------
   Tirage déterministe
--------------------------------------------------------------------------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function nomDe(
  b: Lexique,
  s: Lexique,
  p: Lexique | null,
  l1: Lexique,
  l2: Lexique,
  hasard: number,
): string {
  const base = cap(b.nom);
  const legumes = `${l1.nom} et ${l2.nom}`;
  if (hasard < 0.25) return `${base}, ${s.nom} : ${legumes}${p ? ` et ${p.nom}` : ''}`;
  if (hasard < 0.5) return `${base} ${s.nom} aux ${l1.nom}${p ? `, ${p.nom}` : ''}`;
  if (hasard < 0.75) return `${base} du frigo — ${p ? `${p.nom}, ` : ''}${legumes}`;
  return `${cap(l1.nom)} ${s.nom} sur ${b.nom}${p ? ` — ${p.nom}` : ''}`;
}

function inter(filtre: Regime[] | undefined, accu: Regime[]): Regime[] {
  if (!filtre) return accu;
  return accu.filter((r) => filtre.includes(r));
}

function conserveDe(p: Lexique | null, s: Lexique): string {
  if (p && (p.nom.includes('poisson') || p.nom.includes('sardine') || p.nom.includes('thon'))) {
    return '2 jours au frigo — le poisson ne se donne pas deux vies.';
  }
  if (p && (p.nom.includes('boeuf') || p.nom.includes('poulet') || p.nom.includes('dinde') || p.nom.includes('lardons'))) {
    return s.congelable ? '3 jours au frigo, congélable en parts.' : '3 jours au frigo.';
  }
  return s.congelable ? '4 jours au frigo, congélable en parts.' : '4 jours au frigo.';
}

function kcalDe(membres: Lexique[], portions = 4): number {
  let total = 0;
  for (const m of membres) {
    const q = m.qtePour4 ?? (m.unite === 'unité' ? 60 : 150);
    total += (q * (m.kcal100 ?? 80)) / 100;
  }
  return Math.max(90, Math.round(total / portions / 10) * 10);
}

function compose(idx: number): Recette {
  const rand = mulberry32((idx + 1) * 0x9e3775ba);

  const base = BASES[Math.floor(rand() * BASES.length)];
  const leg1 = LEGUMES[Math.floor(rand() * LEGUMES.length)];
  let leg2 = LEGUMES[Math.floor(rand() * LEGUMES.length)];
  if (leg2.nom === leg1.nom) leg2 = LEGUMES[(LEGUMES.indexOf(leg1) + 7) % LEGUMES.length];
  const proteine = rand() < 0.62 ? PROTEINES[Math.floor(rand() * PROTEINES.length)] : null;
  const sauce = SAUCES[Math.floor(rand() * SAUCES.length)];
  const herbe = HERBES[Math.floor(rand() * HERBES.length)];

  let regimes: Regime[] = [...TOUS];
  regimes = inter(base.regimes, regimes);
  regimes = inter(leg1.regimes, regimes);
  regimes = inter(leg2.regimes, regimes);
  if (proteine) regimes = inter(proteine.regimes, regimes);
  regimes = inter(sauce.regimes, regimes);
  if (!regimes.length) regimes = ['sans-lactose'];

  const temps = 12 + Math.round((base.cuisson ?? 5) * 0.5 + (sauce.cuisson ?? 4) + (proteine ? 5 : 0) + rand() * 10);
  const niveau: Niveau = temps > 40 || sauce.cuisson === 10 ? 'intermediaire' : rand() < 0.1 ? 'chef' : 'debutant';

  const nom = nomDe(base, sauce, proteine, leg1, leg2, rand());

  const etapes: { texte: string; minutes?: number; labelMinuteur?: string }[] = [
    { texte: `Lave et découpe ${leg1.nom} et ${leg2.nom} — régulier de taille, régulier de cuisson.`, minutes: 4, labelMinuteur: 'préparation' },
    { texte: base.etape ?? `Prépare ${base.nom} selon l’habitude du placard.`, minutes: base.cuisson, labelMinuteur: `cuisson ${base.nom}` },
  ];
  if (proteine?.etape) etapes.push({ texte: proteine.etape, minutes: 6, labelMinuteur: 'saisie' });
  if (sauce.etape) etapes.push({ texte: sauce.etape, minutes: sauce.cuisson, labelMinuteur: 'sauce' });
  etapes.push({
    texte: `Réunis le tout deux minutes à feu doux, goûte, rectifie. Sers avec ${herbe.nom} ciselé au dernier moment.`,
    minutes: 2,
  });

  const ingredients = [
    { nom: base.nom, qte: base.qtePour4, unite: base.unite },
    { nom: leg1.nom, qte: 200, unite: 'g' },
    { nom: leg2.nom, qte: 150, unite: 'g' },
    ...(proteine ? [{ nom: proteine.nom, qte: proteine.qtePour4, unite: proteine.unite ?? 'g' }] : []),
    { nom: sauce.nom, qte: 1, unite: 'quantité généreuse' },
    { nom: herbe.nom, qte: 1, unite: 'bouquet' },
  ];

  return {
    id: `moteur-${idx}`,
    nom,
    emoji: base.emoji ?? '🥘',
    temps,
    niveau,
    basePour: 4,
    regimes,
    categorie: base.categorie ?? 'vege',
    kcalParPortion: kcalDe([base, leg1, leg2, ...(proteine ? [proteine] : []), sauce]),
    ingredients,
    etapes,
    conseil: CONSEILS[Math.floor(rand() * CONSEILS.length)],
    conservation: conserveDe(proteine, sauce),
    congelable: Boolean(sauce.congelable) && Boolean(base.congelable),
    // eslint-disable-next-line no-type-assertion/no-unnecessary-condition
    budget: Math.min(3, Math.max(base.budget ?? 1, proteine?.budget ?? 1)) as 1 | 2 | 3,
  };
}

/* Le catalogue : généré une fois, gardé en mémoire — comme un livre ouvert. */
let catalogueMemoire: Recette[] | null = null;

export function catalogue(nb = NOMBRE_MOTEUR): Recette[] {
  if (!catalogueMemoire) {
    const uniques: Recette[] = [];
    const vus = new Set<string>();
    for (let i = 0; uniques.length < nb && i < nb * 3; i += 1) {
      const r = compose(i);
      if (!vus.has(r.nom)) {
        vus.add(r.nom);
        uniques.push(r);
      }
    }
    catalogueMemoire = uniques;
  }
  return catalogueMemoire;
}

/** Une recette du moteur au hasard — sert de repli local au Chef IA. */
export function recetteAuHasard(seed = Date.now()): Recette {
  const idx = Math.abs(Math.floor(seed)) % NOMBRE_MOTEUR;
  return catalogue(NOMBRE_MOTEUR)[idx] ?? compose(idx);
}
