/**
 * ia.ts — Générateur de recettes par IA, souverain.
 *
 * Règle nº 5 de l'écosystème : l'IA est Mistral AI (hébergée en France), en
 * BYOK — la clé reste dans le navigateur de l'utilisateur (localStorage),
 * n'est envoyée qu'à api.mistral.ai, et aucune donnée n'est utilisée pour
 * l'entraînement. En cas d'absence de clé ou d'erreur : repli local garanti.
 */
import type { Recette, Regime } from './types';
import { RECETTES, memeIngredient } from './data';
import { LIBELLES_REGIME } from './types';
import { catalogue, NOMBRE_MOTEUR } from './moteurRecettes';

export const MODELE_MISTRAL = 'mistral-small-latest';
export const URL_MISTRAL = 'https://api.mistral.ai/v1/chat/completions';
export const CLE_MISTRAL_LS = 'frigoplacard.mistral-cle';

export function lireCle(): string | null {
  try {
    return localStorage.getItem(CLE_MISTRAL_LS);
  } catch {
    return null;
  }
}

export function ecrireCle(cle: string | null) {
  try {
    if (cle) localStorage.setItem(CLE_MISTRAL_LS, cle);
    else localStorage.removeItem(CLE_MISTRAL_LS);
  } catch {
    /* mode privé : on ignore. */
  }
}

/** La recette renvoyée par le Chef IA. */
export interface RecetteIA {
  id: string;
  nom: string;
  emoji: string;
  temps: number;
  niveau: 'debutant' | 'intermediaire' | 'chef';
  categorie: string;
  kcalParPortion?: number;
  ingredients: { nom: string; qte?: number; unite?: string }[];
  etapes: { texte: string; minutes?: number; labelMinuteur?: string }[];
  regimes: Regime[];
  parIA: true;
}

function extraListe(listeIngredients: string[], regimes: Regime[]): string {
  const analysée = listeIngredients.map((i) => `- ${i}`).join('\n');
  const frites = regimes.length ? `Filtres de régime à respecter STRICTEMENT : ${regimes.map((r) => LIBELLES_REGIME[r]).join(', ')}.` : '';
  return `Voici le contenu EXACT du frigo et du placard de l'utilisateur :\n${analysée}\n${frites}`.trim();
}

const SYSTÈME = `Tu es « le Chef Mistral » de Frigo-Placard, une application française anti-gaspi de l'écosystème alphabette.
Tu conçois UNE recette unique, réaliste et française, en utilisant PRIORITY les ingrédients fournis (le plus périssable en premier).
Réponds UNIQUEMENT avec un objet JSON valable, sans texte autour, exactement avec ce schéma :
{
  "nom": "nom appétissant de la recette",
  "emoji": "un emoji",
  "categorie": "viande | poisson | vege | pates | riz | soupe | dessert | gratin | salade | apero | condiment | boisson",
  "temps": 30,
  "niveau": "debutant | intermediaire | chef",
  "kcalParPortion": 350,
  "regimes": ["vegetarien", "vegan", "sans-gluten", "sans-lactose", "halal", "casher", "keto"],
  "ingredients": [{"nom": "…", "qte": 2, "unite": "…"}],
  "etapes": [{"texte": "…", "minutes": 10, "labelMinuteur": "cuisson"}]
}
Règles : 4 à 8 étapes claires en français familier ; « minutes » uniquement quand un minuteur a du sens ;
l'annexe du frigo manquant demande d'aller le chercher — accepte certains produits du placard courants (sel, huile, farine…).`;

/** Appelle Mistral (BYOK) et renvoie une recette structurée. */
export async function genererViaMistral(
  cle: string,
  ingredients: string[],
  regimes: Regime[],
): Promise<RecetteIA> {
  const reponse = await fetch(URL_MISTRAL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cle}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELE_MISTRAL,
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTÈME },
        { role: 'user', content: extraListe(ingredients, regimes) },
      ],
    }),
  });

  if (reponse.status === 401) throw new Error('Clé Mistral refusée (401). Vérifie ta clé dans le panneau Clés.');
  if (reponse.status === 429) throw new Error('Mistral a répondu 429 : trop de requêtes pour l\u2019instant, réessaie dans un instant.');
  if (!reponse.ok) throw new Error(`Mistral a répondu ${reponse.status}.`);

  const json = await reponse.json();
  const texte = json?.choices?.[0]?.message?.content;
  if (!texte) throw new Error('Réponse Mistral vide ou inattendue.');

  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    throw new Error('La réponse de Mistral n\u2019a pas pu être lue comme JSON.');
  }

  return normalise(brut, String(json.id ?? 'ia'));
}

/** Redresse la réponse du modèle (les LLM aiment improviser). */
function normalise(brut: unknown, id: string): RecetteIA {
  const o = (brut ?? {}) as Record<string, unknown>;
  const liste = (o.etapes ?? o.steps ?? []) as Array<Record<string, unknown>>;
  const ing = (o.ingredients ?? []) as Array<Record<string, unknown>>;
  const regimesPossibles: Regime[] = ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose', 'halal', 'casher', 'keto'];

  const recette: RecetteIA = {
    id: `ia-${id}-${Date.now()}`,
    nom: String(o.nom ?? o.name ?? 'Recette du Chef Mistral'),
    emoji: String(o.emoji ?? '🧑‍🍳'),
    temps: Number(o.temps ?? o.time ?? 30) || 30,
    niveau: (['debutant', 'intermediaire', 'chef'].includes(String(o.niveau)) ? String(o.niveau) : 'intermediaire') as RecetteIA['niveau'],
    categorie: String(o.categorie ?? 'vege'),
    kcalParPortion: Number(o.kcalParPortion) || undefined,
    ingredients: ing.map((i) => ({ nom: String(i.nom ?? i.name ?? '?'), qte: Number(i.qte) || undefined, unite: i.unite ? String(i.unite) : undefined })),
    etapes: liste.map((e) => ({
      texte: String(e.texte ?? e.text ?? '?'),
      minutes: Number(e.minutes) || undefined,
      labelMinuteur: e.labelMinuteur ? String(e.labelMinuteur) : undefined,
    })),
    regimes: (Array.isArray(o.regimes) ? (o.regimes as string[]) : []).filter((r): r is Regime =>
      regimesPossibles.includes(r as Regime),
    ),
    parIA: true,
  };

  if (!recette.ingredients.length) throw new Error('La recette reçue n\u2019a aucun ingrédient.');
  if (!recette.etapes.length) recette.etapes.push({ texte: 'Assemble et sers !' });
  return recette;
}

/* ---------------------------------------------------------------------------
   Repli local (aucune clé, réseau absent, erreur API) : le frigo reste servi.
--------------------------------------------------------------------------- */

export function recetteLocale(ingredients: string[], regimes: Regime[]): RecetteIA {
  const choses = ingredients.length
    ? ingredients
    : ['oeuf', 'pates', 'huile'];
  const norme = (s: string) => s.toLowerCase();

  /* Le repli trempe dans le moteur combinatoire : une vraie recette cohérente
     avec les régimes demandés, triée par affinité avec le frigo. */
  const candidates = catalogue(NOMBRE_MOTEUR).filter((r) => regimes.every((f) => r.regimes.includes(f)));
  const notees = candidates
    .map((r) => ({
      r,
      score: r.ingredients.filter((i) =>
        choses.some((c) => norme(i.nom).includes(norme(c)) || norme(c).includes(i.nom)),
      ).length,
    }))
    .sort((a, b) => b.score - a.score);

  if (notees.length) {
    const gagnantes = notees.filter((n) => n.score === notees[0].score);
    const choisie = gagnantes[Math.abs(Date.now()) % gagnantes.length].r;
    return {
      id: choisie.id,
      nom: choisie.nom,
      emoji: choisie.emoji,
      temps: choisie.temps,
      niveau: choisie.niveau,
      categorie: choisie.categorie,
      kcalParPortion: choisie.kcalParPortion,
      ingredients: choisie.ingredients,
      etapes: choisie.etapes,
      regimes,
      parIA: true,
    };
  }

  const titres = ['Le mille-feuille du frigo', 'La poêlée sauveur', 'Le grand brassage anti-gaspi'];
  const deterministe = Math.abs(choses.join('').length + regimes.length) % titres.length;

  return {
    id: `local-${Date.now()}`,
    nom: `${titres[deterministe]} (${choses[0] ?? 'frigo'})`,
    emoji: '🥘',
    temps: 25,
    niveau: 'debutant',
    categorie: 'vege',
    kcalParPortion: 350,
    ingredients: choses.slice(0, 6).map((nom, i) => ({ nom, qte: i === 0 ? 200 : 1, unite: i === 0 ? 'g' : 'unité' })),
    etapes: [
      { texte: `Sort ${choses.slice(0, 3).join(', ')} du frigo. Coupe en morceaux réguliers.`, minutes: 5, labelMinuteur: 'préparation' },
      { texte: 'Fais revenir à l\u2019huile (ou au beurre) à feu vif.', minutes: 6, labelMinuteur: 'saisie' },
      { texte: 'Baisse, couvre, laisse confire doucement : c\u2019est là que tout se sauve.', minutes: 12, labelMinuteur: 'confiande' },
      { texte: 'Rectifie sel et poivre, sers chaud. Zéro gaspillage consommé.' },
    ],
    regimes,
    parIA: true,
  };
}

/** Le point d'entrée unique : Mistral si possible, repli local sinon. */
export async function genererRecette(
  ingredients: string[],
  regimes: Regime[],
): Promise<{ recette: RecetteIA; source: 'mistral' | 'local'; erreur?: string }> {
  const cle = lireCle() ?? '';
  if (cle) {
    try {
      return { recette: await genererViaMistral(cle, ingredients, regimes), source: 'mistral' };
    } catch (e) {
      const erreur = e instanceof Error ? e.message : 'Erreur réseau vers Mistral (API injoignable depuis le navigateur ?).';
      return { recette: recetteLocale(ingredients, regimes), source: 'local', erreur };
    }
  }
  return {
    recette: recetteLocale(ingredients, regimes),
    source: 'local',
    erreur: 'Aucune clé Mistral configurée : recette de secours locale.',
  };
}

/** Convertit au modèle Recette commun (détail, mode cuisinier, historique). */
export function enRecette(ia: RecetteIA): Recette {
  return {
    id: ia.id,
    nom: ia.nom,
    emoji: ia.emoji,
    temps: ia.temps,
    niveau: ia.niveau,
    basePour: 2,
    regimes: ia.regimes,
    categorie: ia.categorie,
    kcalParPortion: ia.kcalParPortion,
    ingredients: ia.ingredients,
    etapes: ia.etapes,
  };
}

/* ---------------------------------------------------------------------------
   Mode « Anti-Gaspi chrono » : 3 ingrédients qui périment ce soir + le temps
   disponible → une recette directe, courte, sans blabla. Mistral si une clé
   est là (consigne serrée sur le temps), sinon le meilleur plat du catalogue
   local qui tient dans le temps imparti.
--------------------------------------------------------------------------- */

const SYSTEME_CHRONO = `Tu es le Chef Mistral de Frigo-Placard, en MODE ANTI-GASPI CHRONO.
L'utilisateur a des ingrédients qui périment CE SOIR et très peu de temps. Donne UNE recette directe, sans blabla :
- temps total (préparation + cuisson) inférieur ou égal au temps donné, sans tricher ;
- les ingrédients fournis sont utilisés en priorité (tous, si c'est mangeable ensemble) ;
- 3 à 5 étapes, une phrase courte chacune, à l'impératif, sans anecdote ni conseil superflu ;
- seulement des produits de placard courants en plus (sel, poivre, huile, beurre, farine, œufs, pâtes, riz).
Réponds UNIQUEMENT avec un objet JSON valable, schéma : {"nom":"…","emoji":"…","categorie":"…","temps":10,"niveau":"debutant","kcalParPortion":400,"regimes":[],"ingredients":[{"nom":"…","qte":1,"unite":"…"}],"etapes":[{"texte":"…","minutes":5,"labelMinuteur":"cuisson"}]}`;

/** Recette chrono via Mistral (BYOK). */
async function chronoViaMistral(cle: string, ingredients: string[], minutes: number, regimes: Regime[]): Promise<RecetteIA> {
  const reponse = await fetch(URL_MISTRAL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODELE_MISTRAL,
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEME_CHRONO },
        { role: 'user', content: `Ingrédients qui périment ce soir : ${ingredients.join(', ')}.\nTemps disponible : ${minutes} minutes, tout compris.${regimes.length ? `\nRégimes à respecter STRICTEMENT : ${regimes.map((r) => LIBELLES_REGIME[r]).join(', ')}.` : ''}` },
      ],
    }),
  });
  if (reponse.status === 401) throw new Error('Clé Mistral refusée (401).');
  if (!reponse.ok) throw new Error(`Mistral a répondu ${reponse.status}.`);
  const json = await reponse.json();
  const texte = json?.choices?.[0]?.message?.content;
  if (!texte) throw new Error('Réponse Mistral vide.');
  const r = normalise(JSON.parse(texte), String(json.id ?? 'chrono'));
  r.etapes = r.etapes.slice(0, 5);
  return r;
}

/** Repli local : la recette du catalogue (maison + moteur) qui tient dans le temps et sauve le plus d'ingrédients. */
export function chronoLocale(ingredients: string[], minutes: number, regimes: Regime[]): RecetteIA | null {
  const voulus = ingredients.map((x) => x.trim()).filter(Boolean);
  const notees = [...RECETTES, ...catalogue(NOMBRE_MOTEUR)]
    .filter((r) => r.temps <= minutes && regimes.every((f) => r.regimes.includes(f)))
    .map((r) => ({ r, score: voulus.filter((v) => r.ingredients.some((i) => memeIngredient(i.nom, v))).length }))
    .filter((n) => n.score > 0)
    .sort((a, b) => b.score - a.score || a.r.etapes.length - b.r.etapes.length || a.r.temps - b.r.temps);
  const choisie = notees[0]?.r;
  if (!choisie) return null;
  return {
    id: choisie.id, nom: choisie.nom, emoji: choisie.emoji, temps: choisie.temps, niveau: choisie.niveau, categorie: choisie.categorie,
    kcalParPortion: choisie.kcalParPortion, ingredients: choisie.ingredients, etapes: choisie.etapes, regimes: choisie.regimes, parIA: true,
  };
}

/** Point d'entrée du mode chrono : Mistral si possible, catalogue local sinon (et on dit lequel). */
export async function genererChrono(
  ingredients: string[],
  minutes: number,
  regimes: Regime[],
): Promise<{ recette: RecetteIA | null; source: 'mistral' | 'local'; erreur?: string }> {
  const cle = lireCle() ?? '';
  if (cle) {
    try {
      return { recette: await chronoViaMistral(cle, ingredients, minutes, regimes), source: 'mistral' };
    } catch (e) {
      const erreur = e instanceof Error ? e.message : 'Mistral injoignable.';
      return { recette: chronoLocale(ingredients, minutes, regimes), source: 'local', erreur };
    }
  }
  return { recette: chronoLocale(ingredients, minutes, regimes), source: 'local' };
}
