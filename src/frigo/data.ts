/**
 * data.ts — La connaissance locale de Frigo-Placard.
 *
 * Tout fonctionne SANS réseau : recettes anti-gaspi, substitutions, accords
 * boisson, produits de saison, astuces du chef, quiz. L'IA (Mistral BYOK) est
 * un surcroît, jamais une dépendance : le repli local est garanti.
 */
import type { Recette } from './types';

/* ---------------------------------------------------------------------------
   Normalisation des noms d'ingrédients (œufs/oeufs, accents, pluriels…)
--------------------------------------------------------------------------- */

export function normaliseBrut(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SYNONYMES: Record<string, string> = {
  oeufs: 'oeuf',
  patates: 'pomme de terre',
  oignons: 'oignon',
  tomates: 'tomate',
  carottes: 'carotte',
  courgettes: 'courgette',
  bananes: 'banane',
  pommes: 'pomme',
  'pommes de terre': 'pomme de terre',
};

const QUALIFICATIFS = ['frais', 'fraiche', 'fraiches', 'sec', 'seche', 'entier', 'entiere', 'entieres', 'de', 'du', 'des', 'en', 'a', 'la', 'rassis', 'tres', 'mur', 'mure', 'complet', 'blanc', 'rape', 'râpée'];

/** Clé canonique d'un ingrédient (comparaison frigo ↔ recette). */
export function cle(nom: string): string {
  let base = normaliseBrut(nom);
  if (SYNONYMES[base]) return SYNONYMES[base];
  for (const [syn, canon] of Object.entries(SYNONYMES)) {
    if (base.startsWith(syn)) base = `${canon}${base.slice(syn.length)}`;
  }
  const mot = base.split(' ').find((m) => m.length >= 3 && !QUALIFICATIFS.includes(m));
  return mot ?? base;
}

/** Deux ingrédients désignent-ils le même produit ? */
export function memeIngredient(a: string, b: string): boolean {
  const ka = cle(a);
  const kb = cle(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  if (ka.length >= 4 && kb.includes(ka)) return true;
  if (kb.length >= 4 && ka.includes(kb)) return true;
  return false;
}

/* ---------------------------------------------------------------------------
   Recettes de départ — pensées anti-gaspi, cuisinées depuis le frigo
--------------------------------------------------------------------------- */

const R = (r: Recette): Recette => r;

export const RECETTES: Recette[] = [
  R({
    id: 'omelette-legumes',
    nom: 'Omelette aux restes de légumes',
    emoji: '🍳',
    temps: 15,
    niveau: 'debutant',
    basePour: 2,
    regimes: ['vegetarien', 'sans-gluten', 'halal', 'casher', 'keto'],
    categorie: 'vege',
    kcalParPortion: 320,
    ingredients: [
      { nom: 'oeuf', qte: 4, unite: 'unité' },
      { nom: 'courgette', qte: 1, unite: 'unité' },
      { nom: 'oignon', qte: 0.5, unite: 'unité' },
      { nom: 'huile', qte: 1, unite: 'c. à s.' },
      { nom: 'sel', qte: 1, unite: 'pincée' },
    ],
    etapes: [
      { texte: 'Coupe les légumes en petits dés.', minutes: 3, labelMinuteur: 'préparation' },
      { texte: 'Fais revenir l\u2019oignon puis les légumes dans l\u2019huile, feu vif.', minutes: 5, labelMinuteur: 'saisie' },
      { texte: 'Bats les œufs, sale, verse sur les légumes, couvre à feu doux.', minutes: 6, labelMinuteur: 'cuisson' },
      { texte: 'Plie l\u2019omelette en deux et sers aussitôt.' },
    ],
  }),
  R({
    id: 'pates-aglio',
    nom: 'Pâtes aglio olio de secours',
    emoji: '🍝',
    temps: 15,
    niveau: 'debutant',
    basePour: 2,
    regimes: ['vegetarien', 'vegan', 'halal', 'casher'],
    categorie: 'pates',
    kcalParPortion: 430,
    ingredients: [
      { nom: 'pates', qte: 180, unite: 'g' },
      { nom: 'huile', qte: 3, unite: 'c. à s.' },
      { nom: 'ail', qte: 2, unite: 'gousse' },
      { nom: 'sel', qte: 1, unite: 'pincée' },
    ],
    etapes: [
      { texte: 'Fais bouillir une grande casserole d\u2019eau salée.', minutes: 4 },
      { texte: 'Jette les pâtes, cuisine al dente selon le paquet.', minutes: 9, labelMinuteur: 'cuisson des pâtes' },
      { texte: 'Chauffe l\u2019huile avec l\u2019ail émincé à feu doux.', minutes: 5, labelMinuteur: 'huile à l\u2019ail' },
      { texte: 'Mélange pâtes et huile à l\u2019ail, détends avec un peu d\u2019eau de cuisson.' },
    ],
  }),
  R({
    id: 'riz-revenu',
    nom: 'Riz revenu aux restes',
    emoji: '🍚',
    temps: 20,
    niveau: 'debutant',
    basePour: 2,
    regimes: ['vegetarien', 'vegan', 'sans-gluten', 'halal', 'casher'],
    categorie: 'riz',
    kcalParPortion: 380,
    ingredients: [
      { nom: 'riz', qte: 200, unite: 'g' },
      { nom: 'carotte', qte: 1, unite: 'unité' },
      { nom: 'oignon', qte: 1, unite: 'unité' },
      { nom: 'huile', qte: 2, unite: 'c. à s.' },
      { nom: 'sel', qte: 1, unite: 'pincée' },
    ],
    etapes: [
      { texte: 'Rince le riz et fais-le cuire dans son volume d\u2019eau.', minutes: 12, labelMinuteur: 'cuisson du riz' },
      { texte: 'Émince oignon et carotte, fais-les dorer à l\u2019huile.', minutes: 6, labelMinuteur: 'saisie' },
      { texte: 'Ajoute le riz cuit, monte le feu, fais sauter 3 min.' },
    ],
  }),
  R({
    id: 'soupe-potimarron',
    nom: 'Soupe du potimarron fatigué',
    emoji: '🎃',
    temps: 30,
    niveau: 'debutant',
    basePour: 3,
    regimes: ['vegetarien', 'vegan', 'sans-gluten', 'halal', 'casher'],
    categorie: 'soupe',
    kcalParPortion: 160,
    ingredients: [
      { nom: 'potimarron', qte: 700, unite: 'g' },
      { nom: 'oignon', qte: 1, unite: 'unité' },
      { nom: 'pomme de terre', qte: 1, unite: 'unité' },
      { nom: 'bouillon', qte: 1, unite: 'cube' },
    ],
    etapes: [
      { texte: 'Épluche (ou lave bien la peau) et coupe le potimarron en cubes.', minutes: 5 },
      { texte: 'Fais revenir l\u2019oignon, ajoute les cubes et le bouillon.', minutes: 3, labelMinuteur: 'saisie' },
      { texte: 'Laisse mijoter doucement jusqu\u2019à ce que tout soit fondant.', minutes: 20, labelMinuteur: 'mijoté' },
      { texte: 'Mixe, ajuste l\u2019eau, goûte, rectifie en sel.' },
    ],
  }),
  R({
    id: 'quiche-restes',
    nom: 'Quiche des restes',
    emoji: '🥧',
    temps: 45,
    niveau: 'intermediaire',
    basePour: 4,
    regimes: ['vegetarien', 'halal', 'casher'],
    categorie: 'vege',
    kcalParPortion: 410,
    ingredients: [
      { nom: 'pate brisee', qte: 1, unite: 'rouleau' },
      { nom: 'oeuf', qte: 3, unite: 'unité' },
      { nom: 'creme fraiche', qte: 20, unite: 'cl' },
      { nom: 'fromage râpé', qte: 80, unite: 'g' },
      { nom: 'restes de légumes', qte: 200, unite: 'g' },
      { nom: 'sel', qte: 1, unite: 'pincée' },
    ],
    etapes: [
      { texte: 'Étale la pâte dans un moule, pique le fond à la fourchette.', minutes: 5 },
      { texte: 'Mélange œufs, crème, fromage, restes de légumes, sel et poivre.', minutes: 5 },
      { texte: 'Verse sur la pâte et enfourne à 180 °C.', minutes: 30, labelMinuteur: 'cuisson au four' },
      { texte: 'Laisse tiédir 5 min avant de découper.' },
    ],
  }),
  R({
    id: 'pancakes-bananes',
    nom: 'Pancakes des bananes trop mûres',
    emoji: '🥞',
    temps: 20,
    niveau: 'debutant',
    basePour: 4,
    regimes: ['vegetarien', 'halal', 'casher'],
    categorie: 'dessert',
    kcalParPortion: 260,
    ingredients: [
      { nom: 'banane', qte: 2, unite: 'unité' },
      { nom: 'farine', qte: 130, unite: 'g' },
      { nom: 'oeuf', qte: 2, unite: 'unité' },
      { nom: 'lait', qte: 15, unite: 'cl' },
      { nom: 'sucre', qte: 1, unite: 'c. à s.' },
    ],
    etapes: [
      { texte: 'Écrase les bananes à la fourchette.', minutes: 3 },
      { texte: 'Mélange farine, œufs, lait et sucre, puis la banane.', minutes: 4 },
      { texte: 'Fais dorer de petites poêlées, 2 min par côté.', minutes: 8, labelMinuteur: 'poêle' },
      { texte: 'Empile et sers avec ce qui reste de confiture.' },
    ],
  }),
  R({
    id: 'gratin-restes',
    nom: 'Gratin de tout ce qui traîne',
    emoji: '🧆',
    temps: 50,
    niveau: 'intermediaire',
    basePour: 4,
    regimes: ['vegetarien', 'halal', 'casher'],
    categorie: 'gratin',
    kcalParPortion: 450,
    ingredients: [
      { nom: 'pomme de terre', qte: 4, unite: 'unité' },
      { nom: 'restes de légumes', qte: 250, unite: 'g' },
      { nom: 'creme fraiche', qte: 20, unite: 'cl' },
      { nom: 'fromage râpé', qte: 100, unite: 'g' },
      { nom: 'ail', qte: 1, unite: 'gousse' },
      { nom: 'sel', qte: 1, unite: 'pincée' },
    ],
    etapes: [
      { texte: 'Tranche finement les pommes de terre (2 mm).', minutes: 8 },
      { texte: 'Frotte le plat à l\u2019ail, huile légèrement le fond.', minutes: 2 },
      { texte: 'Alterne pommes de terre, restes, sel, crème et fromage.', minutes: 8 },
      { texte: 'Enfourne à 180 °C, couvert 20 min puis à découvert.', minutes: 30, labelMinuteur: 'cuisson au four' },
    ],
  }),
  R({
    id: 'pain-perdu',
    nom: 'Pain perdu du pain rassis',
    emoji: '🍞',
    temps: 15,
    niveau: 'debutant',
    basePour: 2,
    regimes: ['vegetarien', 'halal', 'casher'],
    categorie: 'dessert',
    kcalParPortion: 300,
    ingredients: [
      { nom: 'pain rassis', qte: 4, unite: 'tranche' },
      { nom: 'oeuf', qte: 2, unite: 'unité' },
      { nom: 'lait', qte: 10, unite: 'cl' },
      { nom: 'sucre', qte: 1, unite: 'c. à s.' },
    ],
    etapes: [
      { texte: 'Fouette œufs, lait et sucre dans une assiette creuse.', minutes: 2 },
      { texte: 'Trempe chaque tranche de pain 30 s par face.', minutes: 2 },
      { texte: 'Fais dorer à l\u2019huile (ou au beurre) à feu moyen.', minutes: 6, labelMinuteur: 'poêle' },
      { texte: 'Sers chaud, avec du sucre glace si tu en as.' },
    ],
  }),
  R({
    id: 'pois-chiches',
    nom: 'Pois chiches grillés pour l\u2019apéro',
    emoji: '🫘',
    temps: 25,
    niveau: 'debutant',
    basePour: 3,
    regimes: ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose', 'halal', 'casher', 'keto'],
    categorie: 'apero',
    kcalParPortion: 210,
    ingredients: [
      { nom: 'pois chiches', qte: 240, unite: 'g' },
      { nom: 'huile', qte: 2, unite: 'c. à s.' },
      { nom: 'epices', qte: 1, unite: 'c. à c.' },
      { nom: 'sel', qte: 1, unite: 'pincée' },
    ],
    etapes: [
      { texte: 'Essore bien les pois chiches (boîte ou trempés).', minutes: 2 },
      { texte: 'Mélange-les à l\u2019huile, aux épices et au sel.', minutes: 2 },
      { texte: 'Enfourne à 200 °C en secouant le plat à mi-cuisine.', minutes: 20, labelMinuteur: 'four' },
    ],
  }),
  R({
    id: 'salade-placard',
    nom: 'Salade du placard',
    emoji: '🥗',
    temps: 15,
    niveau: 'debutant',
    basePour: 2,
    regimes: ['vegetarien', 'sans-gluten', 'sans-lactose', 'halal', 'casher'],
    categorie: 'salade',
    kcalParPortion: 280,
    ingredients: [
      { nom: 'haricots blancs', qte: 200, unite: 'g' },
      { nom: 'thon', qte: 1, unite: 'boîte' },
      { nom: 'tomate', qte: 2, unite: 'unité' },
      { nom: 'oignon', qte: 0.5, unite: 'unité' },
      { nom: 'huile', qte: 2, unite: 'c. à s.' },
      { nom: 'vinaigre', qte: 1, unite: 'c. à s.' },
    ],
    etapes: [
      { texte: 'Rince haricots et thon si tu veux, égoutte bien.', minutes: 3 },
      { texte: 'Coupe tomates et oignon finement.', minutes: 4 },
      { texte: 'Assaisonne : huile, vinaigre, sel, poivre, herbes si tu en as.' },
    ],
  }),
  R({
    id: 'veloute-fetes',
    nom: 'Velouté des restes de fêtes',
    emoji: '🥣',
    temps: 25,
    niveau: 'debutant',
    basePour: 3,
    regimes: ['vegetarien', 'sans-gluten', 'halal', 'casher'],
    categorie: 'soupe',
    kcalParPortion: 190,
    restesFetes: true,
    ingredients: [
      { nom: 'restes de légumes', qte: 300, unite: 'g' },
      { nom: 'puree', qte: 200, unite: 'g' },
      { nom: 'bouillon', qte: 1, unite: 'cube' },
      { nom: 'creme fraiche', qte: 2, unite: 'c. à s.' },
    ],
    etapes: [
      { texte: 'Réunis les restes de légumes et de purée dans une casserole.', minutes: 3 },
      { texte: 'Couvre d\u2019eau ou de bouillon, chauffe et écrase.', minutes: 15, labelMinuteur: 'réchauffage' },
      { texte: 'Mixe, ajoute la crème, goûte et sers avec les biscuits apéro non ouverts.' },
    ],
  }),
  R({
    id: 'croque-fetes',
    nom: 'Croque-restes de fête',
    emoji: '🥪',
    temps: 20,
    niveau: 'debutant',
    basePour: 2,
    regimes: ['halal', 'casher'],
    categorie: 'viande',
    kcalParPortion: 420,
    restesFetes: true,
    ingredients: [
      { nom: 'pain', qte: 4, unite: 'tranche' },
      { nom: 'reste de viande', qte: 120, unite: 'g' },
      { nom: 'fromage', qte: 4, unite: 'tranche' },
      { nom: 'creme fraiche', qte: 2, unite: 'c. à s.' },
    ],
    etapes: [
      { texte: 'Tartine finement les tranches de crème.', minutes: 2 },
      { texte: 'Garnis : viande émincée et fromage entre deux tranches.', minutes: 4 },
      { texte: 'Fais griller à la poêle pressée (ou au four).', minutes: 10, labelMinuteur: 'grillage' },
      { texte: 'Coupe en triangles, sers avec les crudités restantes.' },
    ],
  }),
  R({
    id: 'smoothie-restes',
    nom: 'Boisson crémeuse des fruits mûrs',
    emoji: '🥤',
    temps: 10,
    niveau: 'debutant',
    basePour: 1,
    regimes: ['vegetarien', 'sans-gluten', 'halal', 'casher'],
    categorie: 'boisson',
    kcalParPortion: 120,
    ingredients: [
      { nom: 'fruit tres mur', qte: 2, unite: 'unité' },
      { nom: 'yaourt', qte: 1, unite: 'unité' },
      { nom: 'lait', qte: 10, unite: 'cl' },
    ],
    etapes: [
      { texte: 'Épluche et enlève toute partie fatiguée du fruit.', minutes: 2 },
      { texte: 'Mixe fruit, yaourt et lait (ou eau pour une version légère).', minutes: 3 },
      { texte: 'Sers bien frais : le gaspillage s\u2019arrête dans le verre.' },
    ],
  }),
  R({
    id: 'huile-herbes',
    nom: 'Huile aux herbes fatiguées',
    emoji: '🌿',
    temps: 10,
    niveau: 'debutant',
    basePour: 4,
    regimes: ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose', 'halal', 'casher', 'keto'],
    categorie: 'condiment',
    kcalParPortion: 90,
    ingredients: [
      { nom: 'herbes fraîches', qte: 1, unite: 'bouquet' },
      { nom: 'huile', qte: 25, unite: 'cl' },
      { nom: 'ail', qte: 1, unite: 'gousse' },
    ],
    etapes: [
      { texte: 'Lave et sèche très bien les herbes (l\u2019eau est l\u2019ennemie).', minutes: 5 },
      { texte: 'Écrase-les avec l\u2019ail, mets le tout en flacon propre.', minutes: 3 },
      { texte: 'Couvre d\u2019huile, garde au frigo, utilise dans les quinze jours.' },
    ],
  }),
  R({
    id: 'tarte-pommes',
    nom: 'Tarte des pommes déprimées',
    emoji: '🍎',
    temps: 45,
    niveau: 'intermediaire',
    basePour: 6,
    regimes: ['vegetarien', 'halal', 'casher'],
    categorie: 'dessert',
    kcalParPortion: 300,
    ingredients: [
      { nom: 'pate brisee', qte: 1, unite: 'rouleau' },
      { nom: 'pomme', qte: 5, unite: 'unité' },
      { nom: 'sucre', qte: 3, unite: 'c. à s.' },
      { nom: 'beurre', qte: 20, unite: 'g' },
    ],
    etapes: [
      { texte: 'Épluche et coupe les pommes (garde les épluchures pour une tisane).', minutes: 10 },
      { texte: 'Fonce la pâte, pique-la à la fourchette.', minutes: 5 },
      { texte: 'Range les pommes, sucre, parseme de noisettes de beurre.', minutes: 6 },
      { texte: 'Enfourne à 180 °C jusqu\u2019à dorure.', minutes: 30, labelMinuteur: 'cuisson au four' },
    ],
  }),
  R({
    id: 'crumble-fruits',
    nom: 'Crumble des fruits mous',
    emoji: '🫐',
    temps: 35,
    niveau: 'debutant',
    basePour: 4,
    regimes: ['vegetarien', 'halal', 'casher'],
    categorie: 'dessert',
    kcalParPortion: 340,
    ingredients: [
      { nom: 'fruit tres mur', qte: 400, unite: 'g' },
      { nom: 'farine', qte: 100, unite: 'g' },
      { nom: 'beurre', qte: 60, unite: 'g' },
      { nom: 'sucre', qte: 60, unite: 'g' },
    ],
    etapes: [
      { texte: 'Coupe les fruits en morceaux, mets-les au plat.', minutes: 5 },
      { texte: 'Sable du bout des doigts : farine, beurre, sucre.', minutes: 6 },
      { texte: 'Émiette sur les fruits et enfourne à 180 °C.', minutes: 25, labelMinuteur: 'cuisson au four' },
      { texte: 'Laisse tiédir 5 min. La glace restante est bienvenue.' },
    ],
  }),
];

/* ---------------------------------------------------------------------------
   Mode « Frigo Vide » : strictement trois ingrédients de base à la maison
--------------------------------------------------------------------------- */
export const BASE_URGENCE = ['oeuf', 'pates', 'riz', 'sel', 'huile'];

export function recettesFrigoVide(): Recette[] {
  return RECETTES.filter((r) =>
    r.ingredients.every((i) => BASE_URGENCE.some((b) => memeIngredient(i.nom, b))),
  );
}

export function recetteSecours(): Recette {
  return R({
    id: 'omelette-urgence',
    nom: 'Omelette de l\u2019urgence',
    emoji: '🥚',
    temps: 8,
    niveau: 'debutant',
    basePour: 1,
    regimes: ['vegetarien', 'sans-gluten', 'halal', 'casher', 'keto'],
    categorie: 'vege',
    kcalParPortion: 220,
    ingredients: [
      { nom: 'oeuf', qte: 2, unite: 'unité' },
      { nom: 'huile', qte: 1, unite: 'c. à s.' },
      { nom: 'sel', qte: 1, unite: 'pincée' },
    ],
    etapes: [
      { texte: 'Bats les œufs avec le sel.', minutes: 1 },
      { texte: 'Huile la poêle bien chaude, verse les œufs.', minutes: 3, labelMinuteur: 'cuisson' },
      { texte: 'Plie et sers. La panse est garnie, le frigo soulagé.' },
    ],
  });
}

/* ---------------------------------------------------------------------------
   Substitutions d'ingrédients — trois alternatives chaque fois
--------------------------------------------------------------------------- */
export const SUBSTITUTIONS: Record<string, string[]> = {
  beurre: ['Huile neutre (70 % du poids)', 'Purée de noix de cajou', 'Compote de pomme (en pâtisserie)'],
  lait: ['Lait végétal (avoine, soja, amande)', 'Eau + une noisette de beurre fondu', 'Yaourt délayé dans un peu d\u2019eau'],
  oeuf: ['Graines de lin moulues + eau (1 + 3)', 'Une banane écrasée (pâtisserie)', 'Fécule + eau (1 + 2)'],
  creme: ['Fromage blanc allégé', 'Yaourt cuiseur', 'Crème de soja (végan)'],
  fromage: ['Miettes de feta', 'Reste de fromage râpé fin', 'Levure maltée (végan)'],
  pain: ['Craquelins émiettés', 'Biscottes', 'Galettes de riz écrasées'],
  thon: ['Sardines en boîte', 'Reste de poulet émietté', 'Pois chiches écrasés (végétarien)'],
  bouillon: ['Eau + herbes + sel à la pincée', 'Eau de cuisson des légumes', 'Un demi-cube à la place d\u2019un cube'],
  farine: ['Fécule de maïs (80 % du poids)', 'Farine de sarrasin', 'Flocons d\u2019avoine mixés'],
  ail: ['Ail en poudre (une demi-dose)', 'Oignon nouveau doux', 'Échalote finement ciselée'],
  herbes: ['Herbes séchées (un tiers)', 'Cubes d\u2019herbes surgelés', 'Feuilles de céleri finement hachées'],
  pate: ['Pâte feuilletée', 'Un fond biscotté + beurre', 'Fond de chapelure huilée'],
  sucre: ['Miel (un quart en moins)', 'Compote sucrée', 'Dates mixées'],
  pomme: ['Poires mûres', 'Pêches bien sonnantes', 'Compote en remplacement direct'],
  banane: ['Pommes écrasées', 'Compote de pomme', 'Purée de courge (tenace et sucrée)'],
  yaourt: ['Fromage blanc + cuillère de miel', 'Crème de soja', 'Lait + une goutte de citron'],
};

export function substitutionsPour(nom: string): string[] {
  const c = cle(nom);
  for (const [produit, alts] of Object.entries(SUBSTITUTIONS)) {
    if (cle(produit) === c) return alts;
  }
  return ['Un équivalent surgelé déjà au congélateur', 'Un légume (ou fruit) voisin de la même famille', 'Demande au Chef IA pour une idée sur-mesure'];
}

/* ---------------------------------------------------------------------------
   Accords boisson (avec une version sans alcool chaque fois)
--------------------------------------------------------------------------- */
export const ACCORDS: Record<string, { boisson: string; pourquoi: string; sansAlcool: string }> = {
  viande: { boisson: 'Un rouge léger type Bourgogne', pourquoi: 'Tannins souples qui accompagnent sans écraser.', sansAlcool: 'Eau pétillante citronnée' },
  vege: { boisson: 'Un rosé bien frais', pourquoi: 'Léger pour ne pas masquer légumes et herbes.', sansAlcool: 'Agrume-menthe sans sucre' },
  pates: { boisson: 'Un rouge fruité légèrement frappé', pourquoi: 'L\u2019acidité équilibre l\u2019amidon et l\u2019huile.', sansAlcool: 'Thé vert citronné' },
  riz: { boisson: 'Un blanc sec et rond', pourquoi: 'Rond pour suivre le riz, sec pour trancher.', sansAlcool: 'Kombucha redressé aux herbes' },
  soupe: { boisson: 'Une eau aromatisée douce', pourquoi: 'Plat chaud, verre froid.', sansAlcool: 'Citron verveine figé en glaçons' },
  dessert: { boisson: 'Un cidre demi-sec', pourquoi: 'L\u2019acidité nettoie le sucre.', sansAlcool: 'Limonade maison peu sucrée' },
  salade: { boisson: 'Un blanc léger et vif', pourquoi: 'Vif pour suivre la vinaigrette.', sansAlcool: 'Eau frisée citron basilic' },
  sinon: { boisson: 'Eau pétillante citronnée', pourquoi: 'Ça s\u2019assied toujours avec tout.', sansAlcool: 'Eau simple bien fraîche' },
};

export function accordDe(categorie: string) {
  return ACCORDS[categorie] ?? ACCORDS.sinon;
}

/* ---------------------------------------------------------------------------
   Péremption estimée par défaut (en jours, selon la nature du produit)
--------------------------------------------------------------------------- */
export const PEREMPTION_DEFAUT: Array<[string, number]> = [
  ['poisson', 2], ['viande', 3], ['volaille', 3],
  ['lait', 6], ['yaourt', 12], ['creme', 10], ['fromage', 15],
  ['oeuf', 20], ['pate brisee', 10],
  ['salade', 4], ['epinard', 4], ['concombre', 6], ['tomate', 6],
  ['carotte', 20], ['courgette', 10], ['oignon', 30], ['ail', 45],
  ['pomme de terre', 30], ['potimarron', 40], ['courge', 40], ['puree', 4],
  ['herbes', 5],
  ['pomme', 25], ['banane', 5], ['orange', 15], ['citron', 20], ['poire', 10],
  ['fraise', 3], ['fruit', 3],
  ['pain', 5],
  ['pates', 365], ['riz', 500], ['farine', 180], ['sucre', 700],
  ['haricots', 600], ['pois chiches', 600], ['thon', 900],
  ['huile', 365], ['epices', 500], ['bouillon', 300], ['vinaigre', 700],
];

export function peremptionDefaut(nom: string): number {
  const c = normaliseBrut(nom);
  for (const [mot, jours] of PEREMPTION_DEFAUT) {
    if (c.includes(normaliseBrut(mot))) return jours;
  }
  return 7;
}

/* ---------------------------------------------------------------------------
   Calories approximatives (pour 100 g) — indicateur nutritionnel estimé
--------------------------------------------------------------------------- */
export const KCAL_100G: Array<[string, number]> = [
  ['huile', 884], ['beurre', 717], ['creme', 300], ['fromage', 350],
  ['oeuf', 143], ['pates', 131], ['riz', 130], ['farine', 350], ['sucre', 400],
  ['pomme de terre', 77], ['banane', 89], ['pomme', 52], ['tomate', 18],
  ['salade', 15], ['courgette', 17], ['carotte', 41], ['oignon', 40],
  ['poisson', 110], ['thon', 130], ['poulet', 168], ['viande', 250],
  ['pois chiches', 364], ['haricots', 100], ['lait', 47], ['yaourt', 61],
];

export function kcalDe(nom: string): number {
  const c = normaliseBrut(nom);
  for (const [mot, v] of KCAL_100G) {
    if (c.includes(normaliseBrut(mot))) return v;
  }
  return 60;
}

/* ---------------------------------------------------------------------------
   Saison en France métropolitaine — 1 = janvier … 12 = décembre
--------------------------------------------------------------------------- */
export const SAISON: Record<number, { fruits: string[]; legumes: string[] }> = {
  1: { fruits: ['orange', 'citron', 'pomme', 'poire'], legumes: ['poireau', 'carotte', 'chou', 'pomme de terre'] },
  2: { fruits: ['orange', 'pamplemousse', 'pomme', 'poire'], legumes: ['poireau', 'endive', 'carotte'] },
  3: { fruits: ['fraise', 'citron', 'kiwi'], legumes: ['asperge', 'oignon nouveau', 'epinard'] },
  4: { fruits: ['fraise', 'rhubarbe'], legumes: ['radis', 'asperge', 'epinard', 'salade'] },
  5: { fruits: ['cerise', 'fraise'], legumes: ['radis', 'courgette', 'petit pois'] },
  6: { fruits: ['cerise', 'abricot', 'fraise'], legumes: ['courgette', 'concombre', 'artichaut'] },
  7: { fruits: ['abricot', 'peche', 'melon'], legumes: ['tomate', 'courgette', 'poivron', 'concombre'] },
  8: { fruits: ['peche', 'melon', 'figue'], legumes: ['tomate', 'aubergine', 'poivron', 'haricot vert'] },
  9: { fruits: ['raisin', 'figue', 'pomme'], legumes: ['courge', 'potimarron', 'tomate'] },
  10: { fruits: ['pomme', 'poire', 'chataigne'], legumes: ['potimarron', 'champignon', 'courge'] },
  11: { fruits: ['pomme', 'poire', 'mandarine'], legumes: ['chou', 'poireau', 'carotte', 'courge'] },
  12: { fruits: ['orange', 'mandarine', 'pomme'], legumes: ['chou', 'poireau', 'potimarron', 'carotte'] },
};

/* ---------------------------------------------------------------------------
   Astuce du Chef du jour
--------------------------------------------------------------------------- */
export const ASTUCES_CHEF: string[] = [
  'Congèle les blancs d\u2019œufs restants : un glaçon = un blanc, prêt pour une mousse.',
  'Les fanes de radis ou de carottes font des potages étonnants. Lave, congèle, réutilise.',
  'Le citron pressé tiède réveille les légumes fatigués : 15 minutes dans l\u2019eau citronnée.',
  'Le marc de café séché absorbe les odeurs du frigo et parfume un gâteau au cacao.',
  'Un yaourt vide se rince avec du lait : tu as déjà ta base de crêpe.',
  'Les herbes fatiguées en pâte : mixe avec soixante pour cent d\u2019huile, congèle en petits cubes.',
  'Le fromage sec se congèle très bien : il râpe encore mieux une fois durci.',
  'Frites molles ? Une minute au four à 140 °C leur rend presque tout leur croquant.',
  'Un pot de crème presque fini se rince au lait : sauce improvisée pour les légumes du soir.',
  'Dans le doute, goûte : la DLC protège du danger, la DDM parle de qualité seulement.',
  'Une épluchure de pomme de terre huilée au four donne des chips de récupération.',
  'Range le plus urgent devant dans le frigo : ce qui est vu se cuisine, ce qui est caché se perd.',
];

/* ---------------------------------------------------------------------------
   Traducteur de restes insolites
--------------------------------------------------------------------------- */
export const RESTES_INSOLITES: Array<{ reste: string; idees: string[] }> = [
  { reste: 'Pain rassis', idees: ['Chapelure (mixe, congèle)', 'Pain perdu ou pudding', 'Panades pour boulettes'] },
  { reste: 'Épluchures de légumes lavées', idees: ['Chips au four (peaux de pommes de terre, carottes)', 'Fond de potage', 'Huile aromatisée (sans oignon, sans ail crustré)'] },
  { reste: 'Fruits mous', idees: ['Compotes', 'Crumble des fruits mous', 'Pancakes des bananes trop mûres'] },
  { reste: 'Marc de café', idees: ['Déodor gazoureux du frigo', 'Exfoliant culinaire noir', 'Engrais de jardin'] },
  { reste: 'Coquilles d\u2019œuf', idees: ['Concassées pour le compost', 'Tisane de calcium (infusée bien chaude)', 'Drainage au fond d\u2019un pot'] },
  { reste: 'Restes de fêtes', idees: ['Velouté des restes de fêtes', 'Croque-restes', 'Salade du placard']
  },
  { reste: 'Herbes fatiguées', idees: ['Beurre d\u2019herbes congelé', 'Huile aux herbes fatiguées', 'Pesto express au robot'] },
  { reste: 'Plat de la veille', idees: ['Réinventé en gratin', 'Dilué dans du bouillon', 'Farcisseur de choux ou de galettes'] },
];

/* ---------------------------------------------------------------------------
   Quiz anti-gaspi — cinq questions
--------------------------------------------------------------------------- */
export interface QuestionQuiz {
  question: string;
  choix: string[];
  bonne: number;
  explication: string;
}

export const QUIZ: QuestionQuiz[] = [
  {
    question: 'Où ranger les tomates pour les garder le plus longtemps ?',
    choix: ['Au frigo, dans le tiroir', 'À température ambiante, à l\u2019abri de la lumière', 'Sur le rebord de la fenêtre baignée de soleil'],
    bonne: 1,
    explication: 'Le froid casse les arômes et la texture. Ambiante et à l\u2019ombre, elles tiennent.',
  },
  {
    question: 'Des bananes noircissent vite : le vrai réflexe ?',
    choix: ['Les séparer et les conserver à part', 'Les trancher et les congeler', 'Les laver à l\u2019eau chaude'],
    bonne: 1,
    explication: 'En tranches congelées, elles attendent le prochain smoothie ou le crumble.',
  },
  {
    question: 'À quoi sert la DLC (à consommer jusqu\u2019au…) ?',
    choix: ['À tout jet systématiquement à ma date', 'À sécuriser les produits les plus fragiles', 'À rien, c\u2019est du marketing'],
    bonne: 1,
    explication: 'Lait, viandes, œufs frais se fient à la DLC. Les yaourts et conserves portent d\u2019autres mentions de qualité.',
  },
  {
    question: 'Un yaourt de deux jours au-delà de sa mention de qualité se…',
    choix: ['Jette sans le regarder', 'Sent puis goûte : s\u2019il est bon, il se mange', 'Offre à un voisin sans le dire'],
    bonne: 1,
    explication: 'L\u2019odeur et le goût tranchent : trop acidulé, trop décoloré ? on s\u2019abstient. Sinon, profit.',
  },
  {
    question: 'La meilleure arme anti-gaspi du quotidien, c\u2019est…',
    choix: ['Un frigo toujours plein', 'Regarder son frigo chaque semaine et cuisiner le plus urgent', 'Sortir seulement au restaurant'],
    bonne: 1,
    explication: 'Le réflexe « je cuisine ce qui expire en premier » fait le plus gros du travail.',
  },
];
