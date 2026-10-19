/**
 * BatchPane.tsx — générateur de batch cooking hebdomadaire.
 *
 * Choisis 4 recettes : l'application fusionne les cuissons en « temps chaud »
 * (ce qui cuit le plus longtemps ouvre la voie), agrège les ingrédients et
 * propose un enchaînement réaliste de session.
 */
import { Fragment, useState } from 'react';
import { RECETTES } from './data';
import { useFrigo } from './store';
import type { Recette } from './types';
import { Puce } from './ui';

export function BatchPane() {  const { favoris } = useFrigo();
  const [choix, setChoix] = useState<Recette[]>([]);
  const [fond, setFond] = useState(false);

  const suggerees = RECETTES.filter((r) => favoris.includes(r.id) || !fond).slice(0, 8);

  const ajoute = (r: Recette) => {
    if (choix.length >= 4) return;
    if (choix.some((c) => c.id === r.id)) return;
    setChoix((c) => [...c, r]);
  };

  const retire = (r: Recette) => setChoix((c) => c.filter((x) => x.id !== r.id));

  /** Le plan : les recettes triées par temps décroissant, cuissons fusionnées. */
  const plan = choix.length >= 2 ? [...choix].sort((a, b) => b.temps - a.temps) : null;
  const tempsTotal = plan ? Math.max(...plan.map((p) => p.temps)) + 25 : 0;

  return (
    <div className="fp-panneau">
      <div className="fp-panneau-tete">
        <h2>🥘 Batch cooking de la semaine</h2>
        <span className="fp-soustitre">Sélectionne 2 à 4 recettes, on construit une session à cuissons groupées.</span>
      </div>

      <div className="fp-puces">
        {suggerees.map((r) => (
          <Puce key={r.id} active={choix.some((c) => c.id === r.id)} onClick={() => (choix.some((c) => c.id === r.id) ? retire(r) : ajoute(r))}>
            {r.emoji} {r.nom}
          </Puce>
        ))}
      </div>

      {plan && (
        <section className="fp-bloc">
          <h3>📋 Ta session d'environ {tempsTotal} min</h3>
          <ol className="fp-etapes">
            <li>
              <strong>Premier feu : {plan[0].nom}</strong> — c'est la cuisson la plus longue. Lance-la, profite pour honorer le reste.
            </li>
            {plan.slice(1).map((p, n) => (
              <Fragment key={p.id}>
                <li>
                  <strong>
                    {n + 2}. {p.nom}
                  </strong>{' '}
                  — prépare pendant que ça cuit : découpe, assaisonne, fais poêler à sa place.
                </li>
              </Fragment>
            ))}
            <li>
              <strong>Clôture</strong> — mets en boîtes, date-les, planifie les jours de consommation.
            </li>
          </ol>

          <h3>🛒 Ingrédients à réunir (fusionnés)</h3>
          <ul className="fp-ingredients">
            {fusionIngrediens(plan).map(([nom, unite, qte]) => (
              <li key={nom}>
                <span className="fp-ingredients-nom">{nom}</span>
                <span className="fp-ingredients-qte">
                  {qte} {unite}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {choix.length === 0 && (
        <p className="fp-vide">Rien de sélectionné. Commence par la 🌟 de tes recettes favorites — elles sortent en tête.</p>
      )}
    </div>
  );
}

/** Fusionne les ingrédients identiques (pas les équivalents) en une liste. */
function fusionIngrediens(recettes: Recette[]): Array<[string, string, string]> {
  const cumul = new Map<string, { nom: string; unite: string; qte: number; auGoût: boolean }>();
  for (const r of recettes) {
    for (const i of r.ingredients) {
      const clee = i.nom.toLowerCase();
      const existant = cumul.get(clee);
      const unite = i.unite ?? 'au goût';
      if (existant) {
        existant.qte += i.qte ?? 0;
        existant.auGoût = existant.auGoût || !i.qte;
      } else {
        cumul.set(clee, { nom: i.nom, unite, qte: i.qte ?? 0, auGoût: !i.qte });
      }
    }
  }
  return [...cumul.values()].map((x) => [
    x.nom,
    x.auGoût ? 'au goût' : x.unite,
    x.qte ? String(Math.round(x.qte * 100) / 100).replace('.', ',') : '',
  ]);
}
