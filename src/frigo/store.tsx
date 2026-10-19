/**
 * store.tsx — Store unique de Frigo-Placard.
 *
 * Toutes les données vivent en localStorage (aucun serveur, aucune donnée
 * utilisateur envoyée ailleurs) : frigo, courses, favoris, historique, notes,
 * compteurs d'impact, filtres de recherche.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { memeIngredient, peremptionDefaut } from './data';
import type { Achat, Filtres, PlatFait, Produit, Recette, Regime } from './types';

const CLE_PREFIXE = 'frigoplacard.';

function charge<T>(suffixe: string, defaut: T): T {
  try {
    const brut = localStorage.getItem(CLE_PREFIXE + suffixe);
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    return defaut;
  }
}

function sauve(suffixe: string, valeur: unknown) {
  try {
    localStorage.setItem(CLE_PREFIXE + suffixe, JSON.stringify(valeur));
  } catch {
    /* mode privé : on ignore. */
  }
}

/** Somme approximative, en kg, des ingrédients d'une recette. */
export function poidsKg(r: Recette): number {
  let kg = 0;
  for (const i of r.ingredients) {
    const q = i.qte ?? 1;
    const u = (i.unite ?? '').toLowerCase();
    if (u.startsWith('kg')) kg += q;
    else if (u.startsWith('g')) kg += q / 1000;
    else if (u.startsWith('cl') || u.startsWith('ml')) kg += q / 1000;
    else if (u.startsWith('l')) kg += q;
    else kg += 0.12; // « une unité » ≈ 120 g
  }
  return Math.round(kg * 10) / 10;
}

export interface Impact {
  plats: number;
  poidsKg: number;
  euros: number;
}

/** Prix moyen du gaspillage en France : ~4,7 €/kg (ADEME). */
const PRIX_KG = 4.7;

export interface FrigoStore {
  garde: Produit[];
  ajoute(nom: string, qte?: number, unite?: string, expire?: string): void;
  retire(id: string, consomme: boolean): void;
  videTout(): void;

  courses: Achat[];
  ajouteCourses(articles: { nom: string; qte?: number; unite?: string; recetteId?: string }[]): void;
  basculeAchat(id: string): void;
  retireAchat(id: string): void;
  videAchats(): void;

  favoris: string[];
  basculeFavori(id: string): void;

  historique: PlatFait[];
  mange(recette: Recette, note: number, portions: number): void;
  note(id: string, note: number): void;
  retirePlat(id: string): void;

  filtres: Filtres;
  majFiltres(f: Partial<Filtres>): void;

  /** Compteurs d'impact anti-gaspi (plats, kg sauvés, euros économisés). */
  impact: Impact;
}

const Ctx = createContext<FrigoStore | null>(null);

export function FrigoProvider({ children }: { children: ReactNode }) {
  const [garde, setGarde] = useState<Produit[]>(() => charge('garde', [] as Produit[]));
  const [courses, setCourses] = useState<Achat[]>(() => charge('courses', [] as Achat[]));
  const [favoris, setFavoris] = useState<string[]>(() => charge('favoris', [] as string[]));
  const [historique, setHistorique] = useState<PlatFait[]>(() => charge('historique', [] as PlatFait[]));
  const [poidsSauve, setPoidsSauve] = useState<number>(() => charge('poids', 0));
  const [filtres, setFiltres] = useState<Filtres>(() =>
    charge('filtres', {
      regimes: [] as Regime[],
      tempsMax: null,
      niveau: null,
      frigoVide: false,
      restesFetes: false,
      favoris: false,
      texte: '',
    } as Filtres),
  );

  useEffect(() => sauve('garde', garde), [garde]);
  useEffect(() => sauve('courses', courses), [courses]);
  useEffect(() => sauve('favoris', favoris), [favoris]);
  useEffect(() => sauve('historique', historique), [historique]);
  useEffect(() => sauve('poids', poidsSauve), [poidsSauve]);
  useEffect(() => sauve('filtres', filtres), [filtres]);

  const ajoute = useCallback((nom: string, qte?: number, unite?: string, expire?: string) => {
    const nomNettoye = nom.trim();
    if (!nomNettoye) return;
    setGarde((g) => {
      const existant = g.find((p) => memeIngredient(p.nom, nomNettoye));
      if (existant) return g; // déjà au frigo : rien à ajouter
      const jours = expire ? Math.round((new Date(expire).getTime() - Date.now()) / 86_400_000) : undefined;
      const estimEst = (jours === undefined || Number.isNaN(jours));
      const joursFinaux = estimEst ? peremptionDefaut(nomNettoye) : jours!;
      const iso = expire ?? new Date(Date.now() + joursFinaux * 86_400_000).toISOString().slice(0, 10);
      return [
        ...g,
        {
          id: `p${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          nom: nomNettoye,
          qte: qte || undefined,
          unite: unite || undefined,
          expire: iso,
          estimee: expire ? false : true,
        },
      ];
    });
  }, []);

  const retire = useCallback(
    (id: string, consomme: boolean) => {
      setGarde((g) => {
        const produit = g.find((p) => p.id === id);
        if (produit && consomme) {
          // « Consommé avant péremption » : ça compte dans l'impact anti-gaspi.
          const poids = Number(produit.qte) > 0 ? (String(produit.unite ?? '').toLowerCase().startsWith('g') ? Number(produit.qte) / 1000 : Number(produit.qte)) : 0.2;
          const kg = Math.max(0, Math.min(5, poids));
          setPoidsSauve((k) => Math.round((k + kg) * 100) / 100);
        }
        return g.filter((p) => p.id !== id);
      });
    },
    [],
  );

  const videTout = useCallback(() => setGarde([]), []);

  const ajouteCourses = useCallback(
    (articles: { nom: string; qte?: number; unite?: string; recetteId?: string }[]) => {
      setCourses((c) => {
        const supplement = articles
          .filter((a) => a.nom && !c.some((x) => memeIngredient(x.nom, a.nom)))
          .map((a) => ({
            id: `a${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            nom: a.nom,
            qte: a.qte,
            unite: a.unite,
            recetteId: a.recetteId,
            achete: false,
          }));
        return supplement.length ? [...c, ...supplement] : c;
      });
    },
    [],
  );

  const basculeAchat = useCallback((id: string) => {
    setCourses((c) => c.map((a) => (a.id === id ? { ...a, achete: !a.achete } : a)));
  }, []);

  const retireAchat = useCallback((id: string) => setCourses((c) => c.filter((a) => a.id !== id)), []);
  const videAchats = useCallback(() => setCourses([]), []);

  const basculeFavori = useCallback((id: string) => {
    setFavoris((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }, []);

  const mange = useCallback((recette: Recette, note: number, portions: number) => {
    setHistorique((h) =>
      [
        {
          id: `h${Date.now()}`,
          nom: recette.nom,
          emoji: recette.emoji,
          date: new Date().toISOString(),
          note,
          portions,
          poidsKg: poidsKg(recette),
        },
        ...h,
      ].slice(0, 60),
    );
    setPoidsSauve((k) => Math.round((k + poidsKg(recette)) * 100) / 100);
  }, []);

  const note = useCallback((id: string, n: number) => {
    setHistorique((h) => h.map((p) => (p.id === id ? { ...p, note: Math.max(0, Math.min(5, n)) } : p)));
  }, []);

  const retirePlat = useCallback((id: string) => setHistorique((h) => h.filter((p) => p.id !== id)), []);

  const majFiltres = useCallback((f: Partial<Filtres>) => setFiltres((prev) => ({ ...prev, ...f })), []);

  const impact = useMemo<Impact>(
    () => ({
      plats: historique.length,
      poidsKg: poidsSauve,
      euros: Math.round(poidsSauve * PRIX_KG * 100) / 100,
    }),
    [historique.length, poidsSauve],
  );

  const valeur: FrigoStore = {
    garde,
    ajoute,
    retire,
    videTout,
    courses,
    ajouteCourses,
    basculeAchat,
    retireAchat,
    videAchats,
    favoris,
    basculeFavori,
    historique,
    mange,
    note,
    retirePlat,
    filtres,
    majFiltres,
    impact,
  };

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useFrigo(): FrigoStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFrigo() doit être utilisé dans <FrigoProvider> (au sein de <AppShell>).');
  return ctx;
}

/* ---------------------------------------------------------------------------
   État d'une péremption : pastille verte (> 4 j), orange (2–4 j), rouge (≤ 2 j)
--------------------------------------------------------------------------- */
export type EtatFrais = 'vert' | 'orange' | 'rouge';

export function etatFrais(expireIso?: string): EtatFrais {
  if (!expireIso) return 'vert';
  const jours = Math.floor((new Date(expireIso).getTime() - Date.now()) / 86_400_000);
  if (jours <= 1) return 'rouge';
  if (jours <= 4) return 'orange';
  return 'vert';
}

export function libelleFrais(expireIso?: string): string {
  if (!expireIso) return 'Sans péremption';
  const jours = Math.floor((new Date(expireIso).getTime() - Date.now()) / 86_400_000);
  if (jours > 1) return `dans ${jours} jours`;
  if (jours === 1) return 'demain';
  if (jours === 0) return 'aujourd\u2019hui !';
  return 'périmé';
}
