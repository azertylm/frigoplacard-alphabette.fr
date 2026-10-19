/**
 * RecetteDetail.tsx — la fiche recette complète, en panneau par-dessus le contenu.
 *
 * Portion, substitution, accord boisson, nutrition, mode cuisinier plein écran,
 * minuteurs, historique, partage, impression : tout y est.
 */
import { useEffect, useMemo, useState } from 'react';
import { accordDe } from './data';
import { kcalDe, memeIngredient, substitutionsPour } from './data';
import { poidsKg, useFrigo } from './store';
import { LIBELLES_NIVEAU, type Recette } from './types';
import { Bouton, Etoiles, Minuteur, Puce, fmtQte } from './ui';

/* ------------------------------------------------------------------ */

function kcalRecette(r: Recette): number {
  if (r.kcalParPortion) return Math.round(r.kcalParPortion);
  let total = 0;
  for (const i of r.ingredients) {
    const q = i.qte ?? 1;
    const u = (i.unite ?? '').toLowerCase();
    const grammes = u.startsWith('g') ? q : u.startsWith('cl') || u.startsWith('ml') ? q : u.startsWith('kg') ? q * 1000 : 120;
    total += (grammes * kcalDe(i.nom)) / 100;
  }
  return Math.round(total / r.basePour);
}

function equilibre(kcal: number): string {
  if (kcal <= 300) return 'Léger';
  if (kcal <= 450) return '\u00C9quilibr\u00E9';
  return 'Copieux';
}

/* ------------------------------------------------------------------ */

export function RecetteDetail({ recette, onClose }: { recette: Recette; onClose: () => void }) {
  const { garde, ajouteCourses, favoris, basculeFavori, mange } = useFrigo();
  const [portions, setPortions] = useState(recette.basePour);
  const [cuisinier, setCuisinier] = useState(false);
  const [note, setNote] = useState(4);
  const [toast, setToast] = useState<string | null>(null);

  const songe = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  };

  const possede = (nom: string) => garde.some((p) => memeIngredient(p.nom, nom));
  const manquants = recette.ingredients.filter((i) => !possede(i.nom));

  const kcal = useMemo(() => kcalRecette(recette), [recette]);
  const kg = useMemo(() => poidsKg(recette), [recette]);
  const part = portions / recette.basePour;

  const ajouteManquants = () => {
    if (!manquants.length) return;
    ajouteCourses(
      manquants.map((m) => ({
        nom: m.nom,
        qte: m.qte ? Math.round(m.qte * part * 100) / 100 : undefined,
        unite: m.unite,
        recetteId: recette.id,
      })),
    );
    songe('Les manquants sont dans ta liste de courses \uD83D\uDED2');
  };

  const partage = async () => {
    const lignes = [
      `${recette.emoji} ${recette.nom} \u2014 Frigo-Placard`,
      `Pour ${portions} ${portions === 1 ? 'personne' : 'personnes'} \u00B7 ${recette.temps} min \u00B7 ${LIBELLES_NIVEAU[recette.niveau]}`,
      '',
      'Ingr\u00E9dients :',
      ...recette.ingredients.map((i) => `- ${i.nom}${i.qte ? ` : ${fmtQte(Math.round(i.qte * part * 100) / 100)} ${i.unite ?? ''}` : ' (au goût)'}`),
      '',
      '\u00C9tapes :',
      ...recette.etapes.map((e, n) => `${n + 1}. ${e.texte}`),
      '',
      `Accord boisson : ${accordDe(recette.categorie).boisson}`,
      '',
      'Recette trouv\u00E9e sur https://frigoplacard.alphabette.fr \u2014 z\u00E9ro gaspi, plein d\u2019id\u00E9es.',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(lignes);
      songe('Carte de recette copi\u00E9e \u2014 colle-la o\u00F9 tu veux !');
    } catch {
      songe('Copie impossible : utilise le menu Partage de ton navigateur.');
    }
  };

  return (
    <>
      <div className="fp-scene" role="dialog" aria-label={`Recette : ${recette.nom}`}>
        <div className="fp-fiche">
          <header className="fp-fiche-tete">
            <div>
              <h2>
                <span className="fp-emoji">{recette.emoji}</span> {recette.nom}
              </h2>
              <div className="fp-badges">
                <span>⏱ {recette.temps} min</span>
                <span>🎚 {LIBELLES_NIVEAU[recette.niveau]}</span>
                <span>🔥 {kcal} kcal/portion — {equilibre(kcal)}</span>
                <span>⚖️≈ {Math.round(kg * part * 10) / 10} kg sauvés</span>
                {recette.restesFetes && <span className="fp-badge-fetes">🎉 restes de fêtes</span>}
              </div>
            </div>
            <div className="fp-fiche-actions-haut">
              <button type="button" className="fp-favori" onClick={() => basculeFavori(recette.id)} title="Favori">
                {favoris.includes(recette.id) ? '★' : '☆'}
              </button>
              <button type="button" className="fp-fermer" onClick={onClose} title="Fermer">
                ✕
              </button>
            </div>
          </header>

          <div className="fp-fiche-corps">
            <section className="fp-bloc">
              <h3>👥 Pour combien ?</h3>
              <div className="fp-portions">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <button key={n} type="button" className={`fp-portions-cran${n === portions ? ' fp-portions-active' : ''}`} onClick={() => setPortions(n)}>
                    {n}
                  </button>
                ))}
              </div>
            </section>

            <section className="fp-bloc">
              <div className="fp-bloc-tete">
                <h3>🧺 Ingrédients</h3>
                {manquants.length > 0 && (
                  <Bouton variante="fantome" onClick={ajouteManquants}>
                    🛒 Ajouter les {manquants.length} manquants à ma liste
                  </Bouton>
                )}
              </div>
              <ul className="fp-ingredients">
                {recette.ingredients.map((i) => {
                  const ok = possede(i.nom);
                  return (
                    <li key={i.nom} className={ok ? '' : 'fp-manquant'}>
                      <span className="fp-ingredients-nom">
                        {ok ? '✓' : '+'} {i.nom}
                      </span>
                      <span className="fp-ingredients-qte">
                        {i.qte ? `${fmtQte(Math.round(i.qte * part * 100) / 100)} ${i.unite ?? ''}` : 'au goût'}
                      </span>
                      {!ok && <Substituer nom={i.nom} />}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="fp-bloc">
              <h3>🍷 Accord boisson</h3>
              <p>
                <strong>{accordDe(recette.categorie).boisson}</strong> — {accordDe(recette.categorie).pourquoi}{' '}
                <em>Sans alcool : {accordDe(recette.categorie).sansAlcool}.</em>
              </p>
            </section>

            <section className="fp-bloc">
              <h3>🧑‍🍳 Étapes</h3>
              <ol className="fp-etapes">
                {recette.etapes.map((e, n) => (
                  <li key={n}>
                    <p>{e.texte}</p>
                    {e.minutes && <Minuteur compact label={e.labelMinuteur ?? 'étape'} minutes={e.minutes} />}
                  </li>
                ))}
              </ol>
            </section>

            <section className="fp-bloc fp-bloc-actions">
              <Bouton variante="primaire" onClick={() => setCuisinier(true)}>
                🖐 Mode Cuisinier plein écran
              </Bouton>
              <Bouton
                variante="primaire"
                onClick={() => {
                  mange(recette, note, portions);
                  songe('Bon app\u00E9tit \u2014 enregistr\u00E9 dans ton historique !');
                }}
              >
                🍽 Je l’ai cuisiné ({note}★)
              </Bouton>
              <Bouton variante="fantome" onClick={partage}>
                📤 Partager la recette
              </Bouton>
              <Bouton variante="fantome" onClick={() => window.print()}>
                🖨 Imprimer
              </Bouton>
              <Etoiles note={note} auChoix={setNote} />
            </section>

            {toast && <div className="fp-toast">{toast}</div>}
          </div>
        </div>
      </div>

      {cuisinier && <ModeCuisinier recette={recette} portions={portions} onQuitter={() => setCuisinier(false)} />}
    </>
  );
}

/* ------------------------------------------------------------------ */

function Substituer({ nom }: { nom: string }) {
  const [ouvert, setOuvert] = useState(false);
  const alts = substitutionsPour(nom);
  return (
    <span className="fp-substituer">
      <button type="button" className="fp-lien" onClick={() => setOuvert((o) => !o)}>
        3 équivalents ↴
      </button>
      {ouvert && (
        <ul className="fp-substituer-liste">
          {alts.map((a) => (
            <li key={a}>↪ {a}</li>
          ))}
        </ul>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Mode Étape par Étape : plein écran géant et épuré, pour suivre la recette
 * pas à pas les mains sales dans la cuisine. Une étape à la fois, du texte XXL.
 */
function ModeCuisinier({ recette, portions, onQuitter }: { recette: Recette; portions: number; onQuitter: () => void }) {
  const [etape, setEtape] = useState(0);
  const courant = recette.etapes[etape];

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="fp-cuisinier" role="dialog" aria-label="Mode cuisinier">
      <header>
        <button type="button" className="fp-cuisinier-quitter" onClick={onQuitter}>
          ✕ Quitter
        </button>
        <span>
          {recette.emoji} {recette.nom} · pour {portions} · étape {etape + 1}/{recette.etapes.length}
        </span>
      </header>

      <div className="fp-cuisinier-pas">
        <p>{courant.texte}</p>
        {courant.minutes && <Minuteur label={courant.labelMinuteur ?? 'étape'} minutes={courant.minutes} />}
      </div>

      <footer>
        <button type="button" disabled={etape === 0} onClick={() => setEtape((e) => e - 1)}>
          ← Précédent
        </button>
        <Puce active={false} onClick={() => setEtape(0)}>
          ↺ Début
        </Puce>
        <button type="button" disabled={etape >= recette.etapes.length - 1} className="fp-cuisinier-suivant" onClick={() => setEtape((e) => e + 1)}>
          {etape >= recette.etapes.length - 1 ? '🎉 Bon appétit !' : 'Suivant →'}
        </button>
      </footer>
    </div>
  );
}
