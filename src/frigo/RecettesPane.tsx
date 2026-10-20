/**
 * RecettesPane.tsx — le moteur de recherche multicritère.
 *
 * Filtres de régime, temps maximum, niveau de cuisine, mode « Frigo Vide »,
 * restes de fêtes, favoris, notre d'ingrédients disponibles…
 */
import { useMemo, useState } from 'react';
import { RECETTES, memeIngredient, recetteSecours, recettesFrigoVide } from './data';
import { etatFrais, useFrigo } from './store';
import { LIBELLES_NIVEAU, LIBELLES_REGIME, type Recette, type Regime } from './types';
import { Puce } from './ui';
import { RecetteDetail } from './RecetteDetail';

/** Score d'affinité : combien d'ingrédients de la recette sont déjà chez toi. */
function affinite(r: Recette, garde: { nom: string; expire?: string }[]): { ok: number; total: number; manquantUrgent: boolean } {
  let ok = 0;
  let manqueUrgent = false;
  for (const i of r.ingredients) {
    if (garde.some((p) => memeIngredient(p.nom, i.nom))) {
      ok += 1;
    } else if (garde.length && memeIngredient(i.nom, garde[garde.length - 1].nom)) {
      ok += 1;
    }
  }
  const urgents = garde.filter((p) => etatFrais(p.expire) === 'rouge');
  manqueUrgent = urgents.some((u) => r.ingredients.some((i) => memeIngredient(u.nom, i.nom)));
  return { ok, total: r.ingredients.length, manquantUrgent: manqueUrgent };
}

const TEMPS: Array<{ valeur: number | null; libelle: string }> = [
  { valeur: null, libelle: 'Tout temps' },
  { valeur: 15, libelle: '15 min chrono' },
  { valeur: 30, libelle: '30 min' },
  { valeur: 60, libelle: '1 h et +' },
];

const NIVEAUX: Array<{ valeur: 'debutant' | 'intermediaire' | 'chef' | null; libelle: string }> = [
  { valeur: null, libelle: 'Tous niveaux' },
  { valeur: 'debutant', libelle: LIBELLES_NIVEAU.debutant },
  { valeur: 'intermediaire', libelle: LIBELLES_NIVEAU.intermediaire },
  { valeur: 'chef', libelle: LIBELLES_NIVEAU.chef },
];

export function RecettesPane() {
  const { garde, filtres, majFiltres, favoris } = useFrigo();
  const [fiche, setFiche] = useState<Recette | null>(null);

  const liste = useMemo(() => {
    let recettes = RECETTES;

    if (filtres.frigoVide) {
      if (garde.length === 0) return [recetteSecours()];
      const candidates = recettesFrigoVide().filter((r) => r.ingredients.some((i) => garde.some((p) => memeIngredient(p.nom, i.nom))));
      return candidates.length ? candidates : [recetteSecours()];
    }

    if (filtres.restesFetes) recettes = recettes.filter((r) => r.restesFetes);
    if (filtres.favoris) recettes = recettes.filter((r) => favoris.includes(r.id));

    if (filtres.regimes.length) {
      recettes = recettes.filter((r) => filtres.regimes.every((f) => r.regimes.includes(f)));
    }
    if (filtres.niveau) recettes = recettes.filter((r) => r.niveau === filtres.niveau);
    if (filtres.tempsMax === 60) recettes = recettes.filter((r) => r.temps >= 60);
    else if (filtres.tempsMax) recettes = recettes.filter((r) => r.temps <= filtres.tempsMax!);

    if (filtres.texte.trim()) {
      const t = filtres.texte.trim().toLowerCase();
      recettes = recettes.filter((r) => r.nom.toLowerCase().includes(t) || r.ingredients.some((i) => i.nom.toLowerCase().includes(t)));
    }

    /* Mieux notées et plus proches du frigo en premier. */
    const scorees = recettes
      .map((r) => ({ r, a: affinite(r, garde) }))
      .sort((x, y) => {
        if (y.a.ok !== x.a.ok) return y.a.ok - x.a.ok;
        return x.r.temps - y.r.temps;
      });
    return scorees.map((s) => s.r);
  }, [filtres, garde, favoris]);

  const basculeRegime = (f: Regime) => {
    majFiltres({ regimes: filtres.regimes.includes(f) ? filtres.regimes.filter((r) => r !== f) : [...filtres.regimes, f] });
  };

  return (
    <div className="fp-panneau">
      <div className="fp-panneau-tete">
        <h2>🍳 Recettes du moment</h2>
        <input
          className="fp-champ fp-champ--recherche"
          placeholder="Chercher : noms, ingrédients…"
          value={filtres.texte}
          onChange={(e) => majFiltres({ texte: e.target.value })}
        />
      </div>

      <div className="fp-filtres">
        {(Object.keys(LIBELLES_REGIME) as Regime[]).map((f) => (
          <Puce key={f} active={filtres.regimes.includes(f)} onClick={() => basculeRegime(f)}>
            {LIBELLES_REGIME[f]}
          </Puce>
        ))}
      </div>

      <div className="fp-ligne-actions">
        {TEMPS.map((t) => (
          <Puce key={String(t.valeur)} active={filtres.tempsMax === t.valeur} onClick={() => majFiltres({ tempsMax: t.valeur })}>
            ⏱ {t.libelle}
          </Puce>
        ))}
        {NIVEAUX.map((n) => (
          <Puce key={String(n.valeur)} active={filtres.niveau === n.valeur} onClick={() => majFiltres({ niveau: n.valeur })}>
            🎚 {n.libelle}
          </Puce>
        ))}
        <Puce active={filtres.frigoVide} titre="Trouver une recette avec strictement 3 ingrédients de base" onClick={() => majFiltres({ frigoVide: !filtres.frigoVide })}>
          🚨 Mode Frigo Vide
        </Puce>
        <Puce active={filtres.restesFetes} onClick={() => majFiltres({ restesFetes: !filtres.restesFetes })}>
          🎉 Restes de fêtes
        </Puce>
        <Puce active={filtres.favoris} onClick={() => majFiltres({ favoris: !filtres.favoris })}>
          ★ Favoris
        </Puce>
      </div>

      <ul className="fp-recettes">
        {liste.map((r) => {
          const a = affinite(r, garde);
          return (
            <li key={r.id} className="fp-carte" onClick={() => setFiche(r)}>
              <div className="fp-carte-tete">
                <span className="fp-emoji">{r.emoji}</span>
                <strong>{r.nom}</strong>
                {favoris.includes(r.id) && <span className="fp-carte-favori">★</span>}
              </div>
              <div className="fp-badges">
                <span>⏱ {r.temps} min</span>
                <span>🎚 {LIBELLES_NIVEAU[r.niveau]}</span>
                {r.budget && <span>💰 {'€'.repeat(r.budget)}</span>}
                {r.congelable && <span>❄️</span>}
                <span>
                  🧺 {a.ok}/{a.total}
                  {filtres.frigoVide ? '' : ' ingrédients présents'}
                </span>
                {a.manquantUrgent && <span className="fp-badges-rouge">⚡ cibles tes urgences</span>}
                {r.restesFetes && <span>🎉</span>}
              </div>
            </li>
          );
        })}
        {liste.length === 0 && (
          <li className="fp-vide">
            Aucune recette ne répond à ces critères — relâche un filtre, ou vide le garde-manger : le mode Frigo Vide t'aidera.
          </li>
        )}
      </ul>

      {fiche && <RecetteDetail recette={fiche} onClose={() => setFiche(null)} />}
    </div>
  );
}
