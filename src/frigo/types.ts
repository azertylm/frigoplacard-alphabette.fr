/**
 * types.ts —Le modèle de données unique de Frigo-Placard.
 */

/** Les filtres de régime alimentaire (sélecteurs instantanés). */
export type Regime =
  | 'vegetarien'
  | 'vegan'
  | 'sans-gluten'
  | 'sans-lactose'
  | 'halal'
  | 'casher'
  | 'keto';

export const LIBELLES_REGIME: Record<Regime, string> = {
  vegetarien: 'Végétarien',
  vegan: 'Végan',
  'sans-gluten': 'Sans gluten',
  'sans-lactose': 'Sans lactose',
  halal: 'Halal',
  casher: 'Casher',
  keto: 'Keto',
};

/** Niveau de cuisine requis. */
export type Niveau = 'debutant' | 'intermediaire' | 'chef';

export const LIBELLES_NIVEAU: Record<Niveau, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  chef: 'Chef',
};

/** Un ingrédient d'une recette (quantité optionnelle pour la souplesse). */
export interface Ingr {
  nom: string;
  qte?: number;
  unite?: string;
}

/** Une étape de recette — `minutes` rend l'étape cliquable en minuteur. */
export interface Etape {
  texte: string;
  minutes?: number;
  labelMinuteur?: string;
}

export interface Recette {
  id: string;
  nom: string;
  emoji: string;
  /** Temps total annoncé, en minutes. */
  temps: number;
  niveau: Niveau;
  /** Base de calcul du calculateur de portions. */
  basePour: number;
  regimes: Regime[];
  /** Sert aux accords boisson. */
  categorie: string;
  kcalParPortion?: number;
  ingredients: Ingr[];
  etapes: Etape[];
  /** Vrai si la recette se sert d'un plat cuisiné pour anti-gaspi. */
  restesFetes?: boolean;
}

/** Un produit du garde-manger (frigo + placard). */
export interface Produit {
  id: string;
  nom: string;
  qte?: number;
  unite?: string;
  /** Date de péremption estimée (ISO, ou non fournie isDataEstimee). */
  expire?: string;
  estimee?: boolean;
}

/** Un article de la liste de courses (commun ou d'une recette). */
export interface Achat {
  id: string;
  nom: string;
  qte?: number;
  unite?: string;
  recetteId?: string;
  achete?: boolean;
}

/** Un plat cuisiné, dans l'historique. */
export interface PlatFait {
  id: string;
  nom: string;
  emoji: string;
  date: string;
  note: number; // 0 à 5
  portions: number;
  /** Poids estimé de nourriture sauvée (kg), pour l'impact anti-gaspi. */
  poidsKg?: number;
}

/** Les filtres de recherche multicritère. */
export interface Filtres {
  regimes: Regime[];
  /** 15, 20, 30, 60 + (minutes) sinon null = pas de filtre de temps. */
  tempsMax: number | null;
  niveau: Niveau | null;
  /** Recettes réalisables ≤ strictement les ingrédients du frigo. */
  frigoVide: boolean;
  restesFetes: boolean;
  favoris: boolean;
  texte: string;
}
