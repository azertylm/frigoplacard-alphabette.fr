/**
 * CoursesPane.tsx — la liste de courses intégrée.
 * Les manquants des recettes arrivent ici en un clic ; coché, ça disparaît en
 * bas de liste, ça se retire, ça se vide.
 */
import { useState } from 'react';
import { useFrigo } from './store';
import { Bouton, fmtQte } from './ui';

export function CoursesPane() {
  const { courses, basculeAchat, retireAchat, videAchats, ajouteCourses } = useFrigo();
  const [ajout, setAjout] = useState('');

  const aFaire = courses.filter((a) => !a.achete);
  const achetes = courses.filter((a) => a.achete);

  return (
    <div className="fp-panneau">
      <div className="fp-panneau-tete">
        <h2>🛒 Liste de courses</h2>
        {courses.length > 0 && (
          <Bouton variante="fantome" onClick={videAchats}>
            🧹 Tout vider
          </Bouton>
        )}
      </div>

      <form
        className="fp-saisie"
        onSubmit={(e) => {
          e.preventDefault();
          ajouteCourses([{ nom: ajout }]);
          setAjout('');
        }}
      >
        <input
          className="fp-champ"
          placeholder="Un article à acheter ?"
          value={ajout}
          onChange={(e) => setAjout(e.target.value)}
        />
        <Bouton variante="primaire">+ Ajouter</Bouton>
      </form>

      {courses.length === 0 ? (
        <p className="fp-vide">
          La liste est vide. Depuis une fiche recette, un clic sur « Ajouter les manquants à ma liste » remplit ça tout
          seul.
        </p>
      ) : (
        <>
          <ul className="fp-achats">
            {aFaire.map((a) => (
              <li key={a.id}>
                <label className="fp-achat">
                  <input type="checkbox" checked={false} onChange={() => basculeAchat(a.id)} />
                  <span>
                    {a.nom}
                    {a.qte ? ` — ${fmtQte(a.qte)} ${a.unite ?? ''}` : ''}
                    {a.recetteId ? ' 🍳' : ''}
                  </span>
                  <button type="button" className="fp-lien fp-lien--rouge" onClick={() => retireAchat(a.id)}>
                    ✕
                  </button>
                </label>
              </li>
            ))}
            {aFaire.length === 0 && <li className="fp-vide">Tout est acheté bravo !

            💐</li>}
          </ul>

          {achetes.length > 0 && (
            <details>
              <summary className="fp-lien">{achetes.length} déjà cochés</summary>
              <ul className="fp-achats">
                {achetes.map((a) => (
                  <li key={a.id}>
                    <label className="fp-achat fp-achat--achete">
                      <input type="checkbox" checked onChange={() => basculeAchat(a.id)} />
                      <span>{a.nom}</span>
                      <button type="button" className="fp-lien fp-lien--rouge" onClick={() => retireAchat(a.id)}>
                        ✕
                      </button>
                    </label>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}
