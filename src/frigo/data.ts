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

  /* ------------------- Vagues de recettes détaillées ------------------- */

  R({
    id: 'gnocchis-four',
    nom: 'Gnocchis rôtis aux tomates fatiguées',
    emoji: '🍅',
    temps: 25,
    niveau: 'debutant',
    basePour: 4,
    regimes: ['vegetarien', 'halal', 'casher'],
    categorie: 'pates',
    kcalParPortion: 440,
    budget: 1,
    congelable: true,
    conseil: 'Plus les tomates sont mûres, plus la sauce est généreuse — c\u2019est leur dernier bienfait.',
    conservation: '2 jours au frigo, repasse au four pour retrouver le croustillant.',
    ingredients: [
      { nom: 'gnocchis', qte: 500, unite: 'g' },
      { nom: 'tomate', qte: 4, unite: 'unité' },
      { nom: 'ail', qte: 1, unite: 'gousse' },
      { nom: 'huile', qte: 3, unite: 'c. à s.' },
      { nom: 'fromage râpé', qte: 60, unite: 'g' },
    ],
    etapes: [
      { texte: 'Préchauffe le four à 200 °C.', minutes: 5, labelMinuteur: 'préchauffage' },
      { texte: 'Mélange gnocchis, tomates en quartiers, ail, huile, sel dans un plat.', minutes: 4 },
      { texte: 'Enfourne en remuant à mi-course.', minutes: 20, labelMinuteur: 'cuisson au four' },
      { texte: 'Parseme de fromage 3 min avant la fin, surveille la dorure.' },
    ],
  }),
  R({
    id: 'macaronis-fromage',
    nom: 'Macaronis au fromage du placard',
    emoji: '🧀',
    temps: 25,
    niveau: 'debutant',
    basePour: 4,
    regimes: ['vegetarien', 'halal', 'casher'],
    categorie: 'gratin',
    kcalParPortion: 480,
    budget: 1,
    congelable: true,
    conseil: 'Restes de fromage mélangés = toujours une réussite. Une croûte de chapelure au-dessus : sacrée.',
    conservation: '3 jours au frigo ; réchauffe four plutôt que micro-ondes.',
    ingredients: [
      { nom: 'pates', qte: 250, unite: 'g' },
      { nom: 'fromage râpé', qte: 150, unite: 'g' },
      { nom: 'lait', qte: 20, unite: 'cl' },
      { nom: 'beurre', qte: 20, unite: 'g' },
      { nom: 'farine', qte: 20, unite: 'g' },
      { nom: 'moutarde', qte: 1, unite: 'c. à c.' },
    ],
    etapes: [
      { texte: 'Fais-cuire les pâtes al dente (un cran de moins d\u2019habitude).', minutes: 9, labelMinuteur: 'cuisson des pâtes' },
      { texte: 'Béchamel express : beurre + farine 2 min, puis lait en filet.', minutes: 6, labelMinuteur: 'sauce' },
      { texte: 'Hors du feu : incorpore le fromage, la moutarde, sel, poivre.', minutes: 2 },
      { texte: 'Mélange aux pâtes, gratine au four à 200 °C.', minutes: 12, labelMinuteur: 'gratiner' },
    ],
  }),
  R({
    id: 'lasagnes-restes',
    nom: 'Lasagnes attrape-restes',
    emoji: '🍲',
    temps: 60,
    niveau: 'chef',
    basePour: 6,
    regimes: ['halal', 'casher'],
    categorie: 'gratin',
    kcalParPortion: 520,
    budget: 2,
    congelable: true,
    conseil: 'Chaque étage = un reste différent : fait le tour du frigo en montant les étages.',
    conservation: '4 jours au frigo — ta meilleure le lendemain. Congèle en parts individuelles.',
    ingredients: [
      { nom: 'pates lasagnes', qte: 6, unite: 'feuilles' },
      { nom: 'restes de légumes', qte: 250, unite: 'g' },
      { nom: 'reste de viande', qte: 150, unite: 'g' },
      { nom: 'lait', qte: 30, unite: 'cl' },
      { nom: 'farine', qte: 30, unite: 'g' },
      { nom: 'beurre', qte: 30, unite: 'g' },
      { nom: 'fromage râpé', qte: 80, unite: 'g' },
    ],
    etapes: [
      { texte: 'Béchamel : beurre + farine + lait, sel, poivre.', minutes: 7, labelMinuteur: 'sauce' },
      { texte: 'Émiette la viande et les légumes restants, réhydrate en sauce.', minutes: 5 },
      { texte: 'Montage en étages : sauce, pâte, béchamel, fromage — répète.', minutes: 10 },
      { texte: 'Enfourne couvert 25 min puis à découvert à 180 °C.', minutes: 35, labelMinuteur: 'cuisson au four' },
    ],
  }),
  R({
    id: 'paella-express',
    nom: 'Paella express des restes',
    emoji: '🥘',
    temps: 30,
    niveau: 'intermediaire',
    basePour: 4,
    regimes: ['sans-gluten', 'sans-lactose', 'halal', 'casher'],
    categorie: 'riz',
    kcalParPortion: 480,
    budget: 2,
    congelable: true,
    conseil: 'Le safran coûte cher : un demi-chorizo oublié ou une lichette de paprika fumé se débrouille très bien.',
    conservation: '2 jours au frigo ; en salade froide le lendemain, accepté.',
    ingredients: [
      { nom: 'riz', qte: 250, unite: 'g' },
      { nom: 'reste de viande', qte: 100, unite: 'g' },
      { nom: 'poivron', qte: 1, unite: 'unité' },
      { nom: 'oignon', qte: 1, unite: 'unité' },
      { nom: 'haricots verts', qte: 100, unite: 'g' },
      { nom: 'epices', qte: 1, unite: 'c. à s.' },
    ],
    etapes: [
      { texte: 'Fais dorer oignon et poivron à l\u2019huile dans une sauteuse large.', minutes: 5, labelMinuteur: 'saisie' },
      { texte: 'Épices + viande en dés + riz : enrobe bien tout.', minutes: 3 },
      { texte: 'Verse 2,5 volumes d\u2019eau chaude, couvre, ne remue plus.', minutes: 18, labelMinuteur: 'cuisson du riz' },
      { texte: 'Hors du feu, laisse reposer 3 min — le socarrat se crée ici.' },
    ],
  }),
  R({
    id: 'riz-au-lait-vanille',
    nom: 'Riz au lait du lait restant',
    emoji: '🍮',
    temps: 35,
    niveau: 'debutant',
    basePour: 4,
    regimes: ['vegetarien', 'sans-gluten', 'halal', 'casher'],
    categorie: 'dessert',
    kcalParPortion: 310,
    budget: 1,
    congelable: false,
    conseil: 'Un yaourt presque vide peut s\u2019incorporer en fin de cuisson : version crémeuse garantie.',
    conservation: '3 jours au frigo — sert-le bien froid, saré de sucre glace.',
    ingredients: [
      { nom: 'riz', qte: 100, unite: 'g' },
      { nom: 'lait', qte: 50, unite: 'cl' },
      { nom: 'sucre', qte: 3, unite: 'c. à s.' },
      { nom: 'vanille', qte: 1, unite: 'gousse' },
    ],
    etapes: [
      { texte: 'Rince le riz jusqu\u2019à l\u2019eau claire.', minutes: 2 },
      { texte: 'Lait + vanille + riz : cuisson douce,region au mélanger souvent.', minutes: 25, labelMinuteur: 'mijoté' },
      { texte: 'Sucre à la fin (il emprisonnier le lait sinon).', minutes: 2 },
      { texte: 'Répartis dans des petits pots encore chauds.' },
    ],
  }),
  R({
    id: 'tortilla-viande',
    nom: 'Tortilla la viande froide',
    emoji: '🥙',
    temps: 20,
    niveau: 'debutant',
    basePour: 2,
    regimes: ['halal', 'casher', 'sans-lactose'],
    categorie: 'viande',
    kcalParPortion: 380,
    budget: 1,
    congelable: false,
    conseil: 'Astuce de la chef : retourne la tortilla sur une assiette, fais-la glisser — zéro casse.',
    conservation: '2 jours, se découpe en bandes froides pour la cantine.',
    ingredients: [
      { nom: 'oeuf', qte: 4, unite: 'unité' },
      { nom: 'reste de viande', qte: 100, unite: 'g' },
      { nom: 'pomme de terre', qte: 2, unite: 'unité' },
      { nom: 'huile', qte: 2, unite: 'c. à s.' },
      { nom: 'sel', qte: 1, unite: 'pincée' },
    ],
    etapes: [
      { texte: 'Émince viande et pommes de terre cuites en dés.', minutes: 4 },
      { texte: 'Fais dorer le tout à l\u2019huile, feu moyen.', minutes: 6, labelMinuteur: 'saisie' },
      { texte: 'Casse les œufs dessus, couvre, feu doux.', minutes: 8, labelMinuteur: 'cuisson' },
      { texte: 'Retourne via l\u2019assiette, dore l\u2019autre face 2 min.' },
    ],
  }),
  R({
    id: 'boulettes-pain',
    nom: 'Boulettes du pain rassis',
    emoji: '🧆',
    temps: 35,
    niveau: 'intermediaire',
    basePour: 4,
    regimes: ['halal', 'casher'],
    categorie: 'viande',
    kcalParPortion: 420,
    budget: 1,
    congelable: true,
    conseil: 'Le pain trempé veut de l\u2019amplitude : soude-le bien pour des boulettes qui ne se défont jamais.',
    conservation: '3 jours au frigo, 2 mois au congélateur — crues déjà formées.',
    ingredients: [
      { nom: 'reste de viande', qte: 150, unite: 'g' },
      { nom: 'pain rassis', qte: 100, unite: 'g' },
      { nom: 'oeuf', qte: 1, unite: 'unité' },
      { nom: 'ail', qte: 1, unite: 'gousse' },
      { nom: 'epices', qte: 1, unite: 'c. à c.' },
      { nom: 'huile', qte: 2, unite: 'c. à s.' },
    ],
    etapes: [
      { texte: 'Réhydrate le pain dans le lait (ou l\u2019eau) et presse-le.', minutes: 6, labelMinuteur: 'trempage' },
      { texte: 'Mélange tout, forme des boulettes à la paume.', minutes: 6 },
      { texte: 'Poêle ou four 200 °C, retourne à mi-course.', minutes: 14, labelMinuteur: 'cuisson' },
      { texte: 'Sers avec une sauce yaourt descendu, restes de crème ou aïoli.' },
    ],
  }),
  R({
    id: 'rillettes-thon',
    nom: 'Rillettes express au thon',
    emoji: '🐟',
    temps: 10,
    niveau: 'debutant',
    basePour: 3,
    regimes: ['sans-gluten', 'sans-lactose', 'keto'],
    categorie: 'apero',
    kcalParPortion: 190,
    budget: 1,
    congelable: false,
    conseil: 'Pas de robot : fourchette + patience donnent une meilleure texture que la machine.',
    conservation: '3 jours au frigo, en bocal couvert.',
    ingredients: [
      { nom: 'thon', qte: 1, unite: 'boîte' },
      { nom: 'yaourt', qte: 1, unite: 'unité' },
      { nom: 'herbes fraîches', qte: 1, unite: 'bouquet' },
      { nom: 'citron', qte: 0.5, unite: 'unité' },
      { nom: 'huile', qte: 1, unite: 'c. à s.' },
    ],
    etapes: [
      { texte: 'Écrase le thon, ajoute yaourt, citron, huile, herbes ciselées.', minutes: 4 },
      { texte: 'Sel, poivre — et une goutte de saumure de la boîte (l\u2019umami gratuit).', minutes: 1 },
      { texte: 'Laisse au frigo pour que la texture devienne tartinable.', minutes: 20, labelMinuteur: 'repos au froid' },
    ],
  }),
  R({
    id: 'cabillaud-tomates',
    nom: 'Filet de poisson sur lit de tomates mûres',
    emoji: '🐠',
    temps: 25,
    niveau: 'intermediaire',
    basePour: 2,
    regimes: ['sans-gluten', 'sans-lactose', 'keto'],
    categorie: 'poisson',
    kcalParPortion: 260,
    budget: 3,
    congelable: false,
    conseil: 'Le poisson continue de cuire hors du four : sors-le légèrement rebondi, jamais sec.',
    conservation: 'Se mange le jour même et le lendemain en émiettée froide — pas au-delà.',
    ingredients: [
      { nom: 'poisson', qte: 2, unite: 'filets' },
      { nom: 'tomate', qte: 4, unite: 'unité' },
      { nom: 'ail', qte: 1, unite: 'gousse' },
      { nom: 'herbes fraîches', qte: 1, unite: 'bouquet' },
      { nom: 'huile', qte: 2, unite: 'c. à s.' },
    ],
    etapes: [
      { texte: 'Écrase les tomates en gros morceaux dans le plat, avec ail, huile, sel.', minutes: 5 },
      { texte: 'Pose les filets dessus, herbes au-dessus.', minutes: 2 },
      { texte: 'Four à 200 °C surveillé, sauce à moitié confite.', minutes: 18, labelMinuteur: 'cuisson au four' },
      { texte: 'Arrose les filets de la sauce avant de servir — c\u2019est notre secret.' },
    ],
  }),
  R({
    id: 'poulet-cremeux',
    nom: 'Poulet crémeux des restes',
    emoji: '🍗',
    temps: 25,
    niveau: 'debutant',
    basePour: 2,
    regimes: ['halal', 'casher'],
    categorie: 'viande',
    kcalParPortion: 390,
    budget: 2,
    congelable: true,
    conseil: 'Le pot de crème vide ? Dégles-le avec un peu d\u2019eau et rince : deux fois la sauce.',
    conservation: '3 jours au frigo; parfait replié dans une crêpe ou un pain du jour.',
    ingredients: [
      { nom: 'reste de viande', qte: 150, unite: 'g' },
      { nom: 'creme fraiche', qte: 15, unite: 'cl' },
      { nom: 'oignon', qte: 1, unite: 'unité' },
      { nom: 'champignon', qte: 150, unite: 'g' },
      { nom: 'huile', qte: 1, unite: 'c. à s.' },
      { nom: 'sel', qte: 1, unite: 'pincée' },
    ],
    etapes: [
      { texte: 'Fais dorer l\u2019oignon à l\u2019huile dans une poêle large.', minutes: 5, labelMinuteur: 'saisie' },
      { texte: 'Champignons : feu vif jusqu\u2019à temps que l\u2019eau de végétation s\u2019évapore.', minutes: 5, labelMinuteur: 'champi' },
      { texte: 'Crème + poulet émincé : 8 min à feu doux sans ébullition.', minutes: 8, labelMinuteur: 'mijoté' },
      { texte: 'Sers sur les restes de riz ou de pâtes, c\u2019est exactement leur sort.' },
    ],
  }),
  R({
    id: 'chili-legumes',
    nom: 'Chili des haricots en réserve',
    emoji: '🌶️',
    temps: 40,
    niveau: 'debutant',
    basePour: 4,
    regimes: ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose', 'halal', 'casher'],
    categorie: 'vege',
    kcalParPortion: 340,
    budget: 1,
    congelable: true,
    conseil: 'Double la recette : ça ne coûte pas plus cher, et ça congèle sans discuter.',
    conservation: '4 jours au frigo, 3 mois au congélateur — sert trois jours d\u2019affilée.',
    ingredients: [
      { nom: 'haricots rouges', qte: 400, unite: 'g' },
      { nom: 'tomate', qte: 4, unite: 'unité' },
      { nom: 'oignon', qte: 1, unite: 'unité' },
      { nom: 'epices', qte: 2, unite: 'c. à c.' },
      { nom: 'huile', qte: 2, unite: 'c. à s.' },
    ],
    etapes: [
      { texte: 'Dore oignon + épices dans l\u2019huile (le parfum se libère droit dans l\u2019air).', minutes: 5, labelMinuteur: 'fond' },
      { texte: 'Tomates concassées + haricots égouttés, couvre à peine.', minutes: 25, labelMinuteur: 'mijoté' },
      { texte: 'Goûte : une cuillère de confiture arrondit l\u2019acidité.', minutes: 2 },
      { texte: 'Sers avec restes de riz ou de pain perdu salé.' },
    ],
  }),
  R({
    id: 'curry-coco',
    nom: 'Curry de tout ce qui reste (coco)',
    emoji: '🥥',
    temps: 30,
    niveau: 'debutant',
    basePour: 3,
    regimes: ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose', 'halal', 'casher'],
    categorie: 'vege',
    kcalParPortion: 370,
    budget: 2,
    congelable: true,
    conseil: 'La boîte de coco à moitié vide se congèle en bac à glaçons : prête pour la prochaine sauce.',
    conservation: '3 jours au frigo — congèle encore mieux que le frais.',
    ingredients: [
      { nom: 'lait de coco', qte: 20, unite: 'cl' },
      { nom: 'restes de légumes', qte: 350, unite: 'g' },
      { nom: 'epices', qte: 2, unite: 'c. à c.' },
      { nom: 'oignon', qte: 1, unite: 'unité' },
      { nom: 'huile', qte: 2, unite: 'c. à s.' },
    ],
    etapes: [
      { texte: 'Saisir oignon + épices, 2 min, sans brûler.', minutes: 3, labelMinuteur: 'fond' },
      { texte: 'Légumes en dés, enrobe le mélange.', minutes: 4 },
      { texte: 'Lait de coco, couvre, mijote doucement.', minutes: 15, labelMinuteur: 'mijoté' },
      { texte: 'Citron en fin (si un reste traîne) : remonte tout le plateau.' },
    ],
  }),
  R({
    id: 'galettes-pdt',
    nom: 'Galettes de pommes de terre fatiguées',
    emoji: '🥔',
    temps: 25,
    niveau: 'debutant',
    basePour: 3,
    regimes: ['vegetarien', 'sans-lactose', 'sans-gluten', 'halal', 'casher'],
    categorie: 'vege',
    kcalParPortion: 300,
    budget: 1,
    congelable: false,
    conseil: 'Pommes de terre cuites d\u2019hier ? Encore meilleures : la fécule s\u2019assèche tout seul.',
    conservation: '3 jours au frigo — repasse-les à la poêle sèche.',
    ingredients: [
      { nom: 'pomme de terre', qte: 500, unite: 'g' },
      { nom: 'oignon', qte: 1, unite: 'unité' },
      { nom: 'farine', qte: 2, unite: 'c. à s.' },
      { nom: 'huile', qte: 3, unite: 'c. à s.' },
      { nom: 'sel', qte: 1, unite: 'pincée' },
    ],
    etapes: [
      { texte: 'Râpe ou écrase les pommes de terre selon ton humeur.', minutes: 6 },
      { texte: 'Mélange oignon fin, farine, sel — forme des galettes épaisses.', minutes: 5 },
      { texte: 'Poêle, huile chaude, 5 min par face — presse légèrement.', minutes: 12, labelMinuteur: 'poêle' },
      { texte: 'Serve avec la crème d\u2019herbes (dips) faite de la même session.' },
    ],
  }),
  R({
    id: 'flan-courgette',
    nom: 'Flan de courgettes réveillées au four',
    emoji: '🥒',
    temps: 40,
    niveau: 'intermediaire',
    basePour: 4,
    regimes: ['vegetarien', 'sans-gluten', 'halal', 'casher'],
    categorie: 'vege',
    kcalParPortion: 280,
    budget: 2,
    congelable: false,
    conseil: 'Saler les courgettes râpées 10 min avant et égoutter : jamais d\u2019eau en surcote du moule.',
    conservation: '3 jours, bon froid — écrase-le en tartinade le troisième jour.',
    ingredients: [
      { nom: 'courgette', qte: 3, unite: 'unité' },
      { nom: 'oeuf', qte: 3, unite: 'unité' },
      { nom: 'creme fraiche', qte: 15, unite: 'cl' },
      { nom: 'fromage râpé', qte: 60, unite: 'g' },
      { nom: 'ail', qte: 1, unite: 'gousse' },
    ],
    etapes: [
      { texte: 'Râpe les courgettes, sale, laisse dégorger.', minutes: 10, labelMinuteur: 'dégorgement' },
      { texte: 'Presse à la main, mélange aux œufs, crème, ail, fromage.', minutes: 5 },
      { texte: 'Versé dans un moule huilé, four à 180 °C.', minutes: 25, labelMinuteur: 'cuisson au four' },
      { texte: 'Vérifie le centre à la lame : elle doit sortir sèche.' },
    ],
  }),
  R({
    id: 'poireaux-vinaigrette',
    nom: 'Poireaux vinaigrette du placard',
    emoji: '🫒',
    temps: 12,
    niveau: 'debutant',
    basePour: 3,
    regimes: ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose', 'halal', 'casher'],
    categorie: 'salade',
    kcalParPortion: 140,
    budget: 1,
    congelable: false,
    conseil: 'Ne coupe que les racines : la tige verte garde sa soupe future — rien ne se jette.',
    conservation: '2 jours — il est toujours bon froid.',
    ingredients: [
      { nom: 'poireau', qte: 3, unite: 'unité' },
      { nom: 'vinaigre', qte: 1, unite: 'c. à s.' },
      { nom: 'huile', qte: 3, unite: 'c. à s.' },
      { nom: 'epices', qte: 1, unite: 'demi-c. à c.' },
    ],
    etapes: [
      { texte: 'Vapeur ou eau frémissante, 8 à 10 min selon l\u2019épaisseur.', minutes: 10, labelMinuteur: 'cuisson vapeur' },
      { texte: 'Égoutte bien tête en bas — l\u2019eau cachée détruit tout le goût.', minutes: 2 },
      { texte: 'Vinaigrette : vinaigre, huile, sel, une pointe de moutarde si tu la rencontres.' },
    ],
  }),
  R({
    id: 'potage-fanes',
    nom: 'Potage des fanes et radis',
    emoji: '🌱',
    temps: 30,
    niveau: 'debutant',
    basePour: 3,
    regimes: ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose', 'halal', 'casher'],
    categorie: 'soupe',
    kcalParPortion: 120,
    budget: 1,
    congelable: true,
    conseil: 'Les fanes ont plus de goût que le radis lui-même :- ne les épluche jamais.',
    conservation: '3 jours au frigo — se réchauffe sans perdre de sa couleur.',
    ingredients: [
      { nom: 'fanes', qte: 150, unite: 'g' },
      { nom: 'radis', qte: 200, unite: 'g' },
      { nom: 'pomme de terre', qte: 1, unite: 'unité' },
      { nom: 'bouillon', qte: 1, unite: 'cube' },
      { nom: 'creme fraiche', qte: 1, unite: 'c. à s.' },
    ],
    etapes: [
      { texte: 'Lave les fanes deux fois (deux fois, le sable refuse le départ).', minutes: 3 },
      { texte: 'Sauté rapide aux fanes + radis + pommes de terre en dés.', minutes: 5, labelMinuteur: 'saisie' },
      { texte: 'Couvre d\u2019eau avec le cube, fais mijoter doucement.', minutes: 15, labelMinuteur: 'mijoté' },
      { texte: 'Mixe long, la crème en fin de mixe — le vert reste vert.' },
    ],
  }),
  R({
    id: 'compote-express',
    nom: 'Compote express, peaux si possible',
    emoji: '🍏',
    temps: 20,
    niveau: 'debutant',
    basePour: 4,
    regimes: ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose', 'halal', 'casher'],
    categorie: 'dessert',
    kcalParPortion: 110,
    budget: 1,
    congelable: true,
    conseil: 'Les peaux portent la moitié des vitamines et du goût : ne les épluche que si le fruit te semble fatigué.', // épluchures de saison, ça se goûte.
    conservation: '4 jours dans un pot propre au frigo — glacée en été.',
    ingredients: [
      { nom: 'pomme', qte: 6, unite: 'unité' },
      { nom: 'sucre', qte: 1, unite: 'c. à s.' },
      { nom: 'eau', qte: 5, unite: 'cl' },
      { nom: 'vanille', qte: 1, unite: 'goutte' },
    ],
    etapes: [
      { texte: 'Coupe les pommes en cubes (peaux comprises si bio ou bien lavées).', minutes: 5 },
      { texte: 'Casserole à fond épais + fond d\u2019eau, couvre.', minutes: 3 },
      { texte: 'Laisse confire doucement : les fruits se délitent seuls.', minutes: 12, labelMinuteur: 'compote' },
      { texte: 'Sucre en fin, mixe plus ou moins — texture à ton goût.' },
    ],
  }),
  R({
    id: 'gateau-yaourt',
    nom: 'Gâteau yaourt des pots vides',
    emoji: '🍰',
    temps: 40,
    niveau: 'debutant',
    basePour: 6,
    regimes: ['vegetarien', 'halal', 'casher'],
    categorie: 'dessert',
    kcalParPortion: 290,
    budget: 1,
    congelable: true,
    conseil: 'Le pot de yaourt sert de mesure — c\u2019est la recette française qui apprend à cuisiner sans balance.',
    conservation: '4 jours dans une boîte hermétique; rêve en tranches au congélateur.',
    ingredients: [
      { nom: 'yaourt', qte: 1, unite: 'pot' },
      { nom: 'huile', qte: 0.5, unite: 'pot' },
      { nom: 'sucre', qte: 1.5, unite: 'pot' },
      { nom: 'farine', qte: 2, unite: 'pot' },
      { nom: 'oeuf', qte: 2, unite: 'unité' },
      { nom: 'levure', qte: 1, unite: 'sachet' },
    ],
    etapes: [
      { texte: 'Yaourt + œufs + sucre, mélange au pot comme mesure.', minutes: 4 },
      { texte: 'Huile puis farine + levure : une pâte qui tombe en ruban.', minutes: 5 },
      { texte: 'Moule beurré, four à 180 °C.', minutes: 30, labelMinuteur: 'cuisson au four' },
      { texte: 'La lame sèche ? c\u2019est cuit. Tartine avec une confiture de la dernière chance.' },
    ],
  }),
  R({
    id: 'mousse-choco-blancs',
    nom: 'Mousse chocolat des blancs restants',
    emoji: '🍫',
    temps: 15,
    niveau: 'intermediaire',
    basePour: 4,
    regimes: ['vegetarien', 'sans-gluten', 'halal', 'casher'],
    categorie: 'dessert',
    kcalParPortion: 240,
    budget: 2,
    congelable: false,
    conseil: 'Blancs à température ambiante : ils montent deux fois plus vite. Plus de ballon que de robot.',
    conservation: '2 jours au frigo, filmé — le chocolate reste ganache-mou.',
    ingredients: [
      { nom: 'chocolat', qte: 100, unite: 'g' },
      { nom: 'oeuf', qte: 4, unite: 'blancs' },
      { nom: 'sucre', qte: 1, unite: 'c. à s.' },
      { nom: 'beurre', qte: 20, unite: 'g' },
    ],
    etapes: [
      { texte: 'Bain-marie doux : chocolat + beurre fondus, lisses.', minutes: 5, labelMinuteur: 'bain-marie' },
      { texte: 'Monte les blancs avec le sucre — pics souples.', minutes: 4, labelMinuteur: 'blancs montés' },
      { texte: 'Incorpore délicatement, d\u2019un tiers à la fois, pas plus.', minutes: 3 },
      { texte: 'Deux heures au frais minimum — c\u2019est le seul temps de la mousse.', minutes: 120, labelMinuteur: 'minuterie froide' },
    ],
  }),
  R({
    id: 'houmous-express',
    nom: 'Houmous express sur le pouce',
    emoji: '🧄',
    temps: 10,
    niveau: 'debutant',
    basePour: 3,
    regimes: ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose', 'halal', 'casher'],
    categorie: 'apero',
    kcalParPortion: 180,
    budget: 1,
    congelable: false,
    conseil: 'L\u2019eau de la boîte de pois chiches (aquafaba) lie tout : garde-la pour tes mousses.',
    conservation: '4 jours au frigo, bocal couvert, filet d\u2019huile.',
    ingredients: [
      { nom: 'pois chiches', qte: 250, unite: 'g' },
      { nom: 'tahini', qte: 2, unite: 'c. à s.' },
      { nom: 'citron', qte: 1, unite: 'unité' },
      { nom: 'ail', qte: 1, unite: 'gousse' },
      { nom: 'huile', qte: 3, unite: 'c. à s.' },
    ],
    etapes: [
      { texte: 'Mixe pois chiches, tahini, ail, citron — réserve l\u2019eau de boîte.', minutes: 3 },
      { texte: 'Allonge avec cette eau jusqu\u2019à la texture crème — c\u2019est le secret.', minutes: 2 },
      { texte: 'Sel, cumin ou paprika selon ton panier d\u2019épices restant.' },
      { texte: 'Sers avec les restes de crudités taillés fins.' },
    ],
  }),
  R({
    id: 'creme-herbes-dips',
    nom: 'Crème d\u2019herbes pour dips',
    emoji: '🥕',
    temps: 5,
    niveau: 'debutant',
    basePour: 2,
    regimes: ['vegetarien', 'sans-gluten', 'sans-lactose', 'halal', 'casher'],
    categorie: 'condiment',
    kcalParPortion: 110,
    budget: 1,
    congelable: false,
    conseil: 'Va avec les « restes » : carottes, concombre, chou-fleur — tout se garde en bâtonnets dans l\u2019eau.',
    conservation: '3 jours au frigo — remue avant de servir.',
    ingredients: [
      { nom: 'yaourt', qte: 2, unite: 'unité' },
      { nom: 'herbes fraîches', qte: 1, unite: 'bouquet' },
      { nom: 'citron', qte: 0.5, unite: 'unité' },
      { nom: 'sel', qte: 1, unite: 'pincée' },
    ],
    etapes: [
      { texte: 'Mélange yaourts, herbes ciselées, citron, sel.', minutes: 2 },
      { texte: 'Repose au frigo trente minutes : les herbes libèrent leur parfum.', minutes: 30, labelMinuteur: 'repos' },
      { texte: 'Trempe sans façon : c\u2019est prêt.' },
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
   Packs de batch cooking : six sessions prêtes, chacune avec son fil conducteur
--------------------------------------------------------------------------- */
export interface ThemeBatch {
  nom: string;
  emoji: string;
  /** Les quatre recettes de la session (ids de RECETTES). */
  recettes: string[];
  /** La philosophie de la session, telle quelle à l'utilisateur. */
  narration: string;
}

export const BATCH_THEMES: ThemeBatch[] = [
  {
    nom: 'Session végé d\u2019automne',
    emoji: '🎃',
    recettes: ['soupe-potimarron', 'gratin-restes', 'galettes-pdt', 'crumble-fruits'],
    narration: 'Le four enchaîne tout : soupe au chaud potimarron sur la plaque, gratin au-dessus, crumble en dessert pendant qu\u2019on mange.',
  },
  {
    nom: 'Session Italie',
    emoji: '🇮🇹',
    recettes: ['macaronis-fromage', 'lasagnes-restes', 'huile-herbes', 'pain-perdu'],
    narration: 'Une eau chaude seule pour les deux pâtes : la sauce du gratin se monte pendant que les lasagnes nappent au four.',
  },
  {
    nom: 'Session légumineuses',
    emoji: '🫘',
    recettes: ['chili-legumes', 'pois-chiches', 'salade-placard', 'houmous-express'],
    narration: 'Boîtes et bocaux ouverts une seule fois : haricots rouges mijotent, pois chiches rôtissent, salade et houmous assemblés à froid.',
  },
  {
    nom: 'Session douceurs',
    emoji: '🍰',
    recettes: ['gateau-yaourt', 'compote-express', 'riz-au-lait-vanille', 'pancakes-bananes'],
    narration: 'Gâteau au four, compote à la missile, riz au lait sur le feu du fond — le frigo vide ses poches de sucre.',
  },
  {
    nom: 'Session après-fête',
    emoji: '🎉',
    recettes: ['veloute-fetes', 'croque-fetes', 'boulettes-pain', 'tortilla-viande'],
    narration: 'Tout se réunit en sauce : velouté au blender, croque et boulettes à la poêle, tortilla pour le lendemain midi.',
  },
  {
    nom: 'Session poisson léger',
    emoji: '🐟',
    recettes: ['cabillaud-tomates', 'rillettes-thon', 'salade-placard', 'poireaux-vinaigrette'],
    narration: 'Le four du poisson chauffe pendant qu\u2019on émiette les rillettes : la salade et les poireaux finissent froids, à l\u2019assiette.',
  },
];

/* ---------------------------------------------------------------------------
   Substitutions d'ingrédients — trois alternatives chaque fois
--------------------------------------------------------------------------- */
export const SUBSTITUTIONS: Record<string, string[]> = {
  beurre: ['Huile neutre (70 % du poids)', 'Purée de noix de cajou', 'Compote de pomme (en pâtisserie)'],
  lait: ['Lait végétal (avoine, soja, amande)', 'Eau + une noisette de beurre fondu', 'Yaourt délayé dans un peu d\u2019eau'],
  'lait de coco': ['Crème fraîche (version douce)', 'Lait + une cuillère de beurre', 'Yaourt + un peu de curry'],
  oeuf: ['Graines de lin moulues + eau (1 + 3)', 'Une banane écrasée (pâtisserie)', 'Fécule + eau (1 + 2)'],
  creme: ['Fromage blanc allégé', 'Yaourt cuiseur', 'Crème de soja (végan)'],
  fromage: ['Miettes de feta', 'Reste de fromage râpé fin', 'Levure maltée (végan)'],
  pain: ['Craquelins émiettés', 'Biscottes', 'Galettes de riz écrasées'],
  thon: ['Sardines en boîte', 'Reste de poulet émietté', 'Pois chiches écrasés (végétarien)'],
  bouillon: ['Eau + herbes + sel à la pincée', 'Eau de cuisson des légumes', 'Un demi-cube à la place d\u2019un cube'],
  farine: ['Fécule de maïs (80 % du poids)', 'Farine de sarrasin', 'Flocons d\u2019avoine mixés'],
  gnocchis: ['Pâtes courtes (du même poids)', 'Pommes de terre en dés', 'Semoule de couscous'],
  tahini: ['Beurre de cacahuète lisse', 'Crème d\u2019amande', 'Deux yaourts bien pressés'],  champignon: ['Courgette en moitié', 'Aubergine en morceaux fins', 'Tofu ferme (du même poids)'],
  moutarde: ['Un trait de vinaigre + une pincée de piment doux', 'Raifort (plus fort, dosé à moitié)', 'Omettre — la sauce reste bonne'],
  vanille: ['Un sucre vanillé', 'Une goutte d\u2019extrait', 'Le zeste d\u2019un reste d\u2019orange'],
  levure: ['Même poids de fécule (levurage moins gonflant)', 'Une pincée de bicarbonate par sachet', 'Aérer la pâte plus longtemps'],
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
  {
    question: 'Les pommes de terre germées ou verdies se…',
    choix: ['Cuisinent normalement', 'Se débarrassent carrément si le germe est grand — l\u2019un ou l\u2019autre : dépouille et coupe', 'Gardent pour décorer la cuisine'],
    bonne: 1,
    explication: 'Germe et verdure donnent de la solanine : si c\u2019est léger, épluche épais et coupe ; si c\u2019est généralisé, ne les garde pas.',
  },
  {
    question: 'Comment congeler sans bloquer ses boîtes ?',
    choix: ['Remplir à ras', 'Laisser un cm d\u2019espace et apposer une étiquette datée', 'Congeler tout en verre épais'],
    bonne: 1,
    explication: 'Le contenu grandit en gelant (un centimètre d\u2019air), l\u2019étiquette évite le mystère du grand poisseux.',
  },
];
