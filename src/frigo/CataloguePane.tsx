/**
 * CataloguePane.tsx — l'onglet du moteur combinatoire.
 *
 * Le catalogue renvoie des recettes déterministes générées par
 * moteurRecettes.ts (3 200+, tout local). On pagine par lots de 60 pour que
 * le DOM respire, avec les mêmes filtres que l'onglet Recettes (régimes,
 * favoris, recherche) et le même affinité-frigo.
 */
import { useMemo, useState } from 'react';
import { catalogue, NOMBRE_MOTEUR } from './moteurRecettes';
import { memeIngredient } from './data';
import { etatFrais, useFrigo } from './store';
import { LIBELLES_NIVEAU, LIBELLES_REGIME, type Recette, type Regime } from './types';
import { Puce } from './ui';
import { RecetteDetail } from './RecetteDetail';

const PAS = 60;

export function CataloguePane() {
  const { garde, filtres, majFiltres, favoris } = useFrigo();
  const [fiche, setFiche] = useState<Recette | null>(null);
  const [limite, setLimite] = useState(PAS);

  const tout = useMemo(() => catalogue(NOMBRE_MOTEUR), []);

  /** Score d'affinité, identique à l'onglet Recettes. */
  const affinite = useMemo(
    () =>
      new Map(
        tout.map((r) => [
          r.id,
          r.ingredients.filter((i) => garde.some((p) => memeIngredient(p.nom, i.nom))).length,
        ]),
      ),
    [tout, garde],
  );

  const liste = useMemo(() => {
    let recettes = tout;
    if (filtres.regimes.length) recettes = recettes.filter((r) => filtres.regimes.every((f) => r.regimes.includes(f)));
    if (filtres.favoris) recettes = recettes.filter((r) => favoris.includes(r.id));
    if (filtres.tempsMax === 60) recettes = recettes.filter((r) => r.temps >= 60);
    else if (filtres.tempsMax) recettes = recettes.filter((r) => r.temps <= filtres.tempsMax!);
    if (filtres.niveau) recettes = recettes.filter((r) => r.niveau === filtres.niveau);
    if (filtres.texte.trim()) {
      const t = filtres.texte.trim().toLowerCase();
      recettes = recettes.filter((r) => r.nom.toLowerCase().includes(t) || r.ingredients.some((i) => i.nom.toLowerCase().includes(t)));
    }
    return [...recettes].sort(
      (x, y) => (affinite.get(y.id) ?? 0) - (affinite.get(x.id) ?? 0) || x.temps - y.temps,
    );
  }, [tout, filtres, favoris, affinite]);

  const visible = liste.slice(0, limite);
  const urgents = garde.filter((p) => etatFrais(p.expire) === 'rouge');

  return (
    <div className="fp-panneau">
      <div className="fp-panneau-tete">
        <h2>📚 Catalogue infini ({NOMBRE_MOTEUR.toLocaleString('fr-FR')} recettes)</h2>
        <input
          className="fp-champ fp-champ--recherche"
          placeholder="Chercher dans le catalogue…"
          value={filtres.texte}
          onChange={(e) => {
            majFiltres({ texte: e.target.value });
            setLimite(PAS);
          }}
        />
      </div>

      <div className="fp-filtres">
        {(Object.keys(LIBELLES_REGIME) as Regime[]).map((f) => (
          <Puce key={f} active={filtres.regimes.includes(f)} onClick={() => majFiltres({ regimes: filtres.regimes.includes(f) ? filtres.regimes.filter((r) => r !== f) : [...filtres.regimes, f] })}>
            {LIBELLES_REGIME[f]}
          </Puce>
        ))}
        <Puce active={filtres.favoris} onClick={() => majFiltres({ favoris: !filtres.favoris })}>
          ★ Favoris
        </Puce>
        <Puce active={filtres.tempsMax === 30} onClick={() => majFiltres({ tempsMax: filtres.tempsMax === 30 ? null : 30 })}>
          ⏱ 30 min
        </Puce>
        <Puce active={filtres.niveau === 'debutant'} onClick={() => majFiltres({ niveau: filtres.niveau === 'debutant' ? null : 'debutant' })}>
          🎚 {LIBELLES_NIVEAU.debutant}
        </Puce>
      </div>

      <p className="fp-astuce">
        Généré localement, sans IA ni réseau : bases × protéines × légumes × sauces composées avec cohérence.
        {urgents.length > 0 && <> Les recettes qui cuisinent tes <strong>{urgents.length} urgence(s)</strong> montent en tête.</>}
      </p>

      <ul className="fp-recettes">
        {visible.map((r) => (
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
              <span>🔥 {r.kcalParPortion} kcal</span>
              <span>🧺 {affinite.get(r.id) ?? 0}/{r.ingredients.length} présents</span>
              {urgents.some((u) => r.ingredients.some((i) => memeIngredient(u.nom, i.nom))) && (
                <span className="fp-badges-rouge">⚡ urgences</span>
              )}
            </div>
          </li>
        ))}
        {liste.length === 0 && (
          <li className="fp-vide">Rien dans cette combinaison de filtres — relâche-en un, le catalogue est immense.</li>
        )}
      </ul>

      {limite < liste.length && (
        <div className="fp-ligne-actions">
          <button type="button" className="fp-lien" onClick={() => setLimite((l) => l + PAS)}>
            ⬇ Charger 60 recettes de plus ({limite}/{liste.length})
          </button>
        </div>
      )}

      {fiche && <RecetteDetail recette={fiche} onClose={() => setFiche(null)} />}
    </div>
  );
}
