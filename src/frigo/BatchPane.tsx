/**
 * BatchPane.tsx — générateur de batch cooking hebdomadaire.
 *
 * Deux façons de composer :
 *  - les PACKS « session » (six fils conducteurs prêts : Italie, après-fête…) ;
 *  - ou un choix libre de 2 à 4 recettes.
 * Le plan fusionne les cuissons (ce qui cuit le plus longtemps ouvre la voie)
 * et agrège les ingrédients en une liste unique.
 */
import { Fragment, useState } from 'react';
import { BATCH_THEMES, RECETTES } from './data';
import { useFrigo } from './store';
import type { Recette } from './types';
import { Puce } from './ui';

export function BatchPane() {
  const { favoris, ajouteCourses } = useFrigo();
  const [choix, setChoix] = useState<Recette[]>([]);
  const [narration, setNarration] = useState<string | null>(null);

  /** Les favorites d'abord, le reste ensuite : la sélection commence bien. */
  const suggerees = [...RECETTES].sort((a, b) => (favoris.includes(b.id) ? 1 : 0) - (favoris.includes(a.id) ? 1 : 0)).slice(0, 10);

  const ajoute = (r: Recette) => {
    if (choix.length >= 4 || choix.some((c) => c.id === r.id)) return;
    setChoix((c) => [...c, r]);
  };

  const retire = (r: Recette) => setChoix((c) => c.filter((x) => x.id !== r.id));

  const prendPack = (ids: string[], discours: string) => {
    const cible = ids.map((id) => RECETTES.find((r) => r.id === id)).filter((r): r is Recette => Boolean(r));
    setChoix(cible.slice(0, 4));
    setNarration(discours);
  };

  /** Le plan : tri par temps décroissant, cuissons fusionnées. */
  const plan = choix.length >= 2 ? [...choix].sort((a, b) => b.temps - a.temps) : null;
  const tempsTotal = plan ? Math.max(...plan.map((p) => p.temps)) + 25 : 0;

  return (
    <div className="fp-panneau">
      <div className="fp-panneau-tete">
        <h2>🥘 Batch cooking de la semaine</h2>
        <span className="fp-soustitre">Un pack tout prêt, ou 2 à 4 recettes choisies à la main — on construit une session à cuissons groupées.</span>
      </div>

      <section className="fp-bloc">
        <h3>📦 Packs de session tout prêts</h3>
        <div className="fp-puces">
          {BATCH_THEMES.map((t) => (
            <Puce key={t.nom} titre={`Sélectionne : ${t.recettes.length} recettes`} onClick={() => prendPack(t.recettes, t.narration)}>
              {t.emoji} {t.nom}
            </Puce>
          ))}
        </div>
      </section>

      <section className="fp-bloc">
        <h3>🎯 Choix libre ({choix.length}/4)</h3>
        <div className="fp-puces">
          {suggerees.map((r) => (
            <Puce key={r.id} active={choix.some((c) => c.id === r.id)} onClick={() => (choix.some((c) => c.id === r.id) ? retire(r) : ajoute(r))}>
              {favoris.includes(r.id) ? '★' : ''} {r.emoji} {r.nom}
            </Puce>
          ))}
        </div>
      </section>

      {plan && (
        <section className="fp-bloc">
          <h3>📋 Ta session d’environ {tempsTotal} min</h3>
          {narration && <p className="fp-astuce">{narration}</p>}
          <ol className="fp-etapes">
            <li>
              <strong>Premier feu : {plan[0].nom}</strong> — c\u2019est la cuisson la plus longue. Lance-la, puis honore le reste pendant que ça cuit.
            </li>
            {plan.slice(1).map((p, n) => (
              <Fragment key={p.id}>
                <li>
                  <strong>
                    {n + 2}. {p.nom}
                  </strong>{' '}
                  — prépare pendant que ça cuit : découpe, assaisonne, enchaîne.
                </li>
              </Fragment>
            ))}
            <li>
              <strong>Clôture</strong> — mets en boîtes (certaines recettes ci-dessous confirment la congélation), date-les, planifie les jours.
            </li>
          </ol>

          <h3>🛒 Ingrédients à réunir (fusionnés)</h3>
          <ul className="fp-ingredients">
            {fusionIngres(plan).map(([nom, unite, qte]) => (
              <li key={nom}>
                <span className="fp-ingredients-nom">{nom}</span>
                <span className="fp-ingredients-qte">
                  {qte} {unite}
                </span>
              </li>
            ))}
          </ul>
          <div className="fp-ligne-actions">
            <button
              type="button"
              className="fp-lien"
              onClick={() => {
                ajouteCourses(fusionIngres(plan).map(([nom, unite, qte]) => ({ nom, unite: unite === 'au goût' ? undefined : unite, qte: qte ? Number(qte.replace(',', '.')) : undefined })));
                setNarration('La liste de la session est partie à ta liste de courses 🛒');
              }}
            >
              🛒 Envoyer toute la liste à mes courses
            </button>
          </div>

          <h3>❄️ Congélation (ce qui prendra le frigo du soir)</h3>
          <ul className="fp-ingredients">
            {plan.map((p) => (
              <li key={p.id}>
                <span className="fp-ingredients-nom">
                  {p.emoji} {p.nom}
                </span>
                <span className="fp-ingredients-qte">{p.congelable ? 'Oui — en parts' : 'Non — garde au frigo'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {choix.length === 0 && (
        <p className="fp-vide">Rien de sélectionné. Commence par un pack — ou marque des ★ dans les recettes : elles sortent en tête de liste.</p>
      )}
    </div>
  );
}

/** Fusionne les ingrédients identiques (par nom canonique) en une liste d'achat. */
function fusionIngres(recettes: Recette[]): Array<[string, string, string]> {
  const cumul = new Map<string, { nom: string; unite: string; qte: number; auGoût: boolean }>();
  for (const r of recettes) {
    for (const i of r.ingredients) {
      const cleCanonique = i.nom.toLowerCase();
      const existant = cumul.get(cleCanonique);
      const unite = i.unite ?? 'au goût';
      if (existant) {
        existant.qte += i.qte ?? 0;
        if (existant.unite !== unite && existant.unite !== 'au goût') existant.unite = unite;
        existant.auGoût = existant.auGoût || !i.qte;
      } else {
        cumul.set(cleCanonique, { nom: i.nom, unite, qte: i.qte ?? 0, auGoût: !i.qte });
      }
    }
  }
  return [...cumul.values()].map((x) => [
    x.nom,
    x.auGoût ? 'au goût' : x.unite,
    x.qte ? String(Math.round(x.qte * 100) / 100).replace('.', ',') : '',
  ]);
}
