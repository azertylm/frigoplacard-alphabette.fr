/**
 * ChronoPane.tsx — mode « Anti-Gaspi chrono ».
 *
 * 3 ingrédients qui périment ce soir + le temps dont on dispose → une recette
 * courte et directe. Pré-rempli avec les produits du frigo en pastille rouge.
 * Mistral si une clé est enregistrée (consigne serrée sur le temps), sinon la
 * recette du carnet local qui tient dans le temps imparti — et on dit laquelle.
 */
import { useMemo, useState } from 'react';
import { LIBELLES_REGIME, type Recette } from './types';
import { enRecette, genererChrono, type RecetteIA } from './ia';
import { etatFrais, useFrigo } from './store';
import { Bouton, Minuteur, Puce, fmtQte } from './ui';
import { memeIngredient } from './data';
import { RecetteDetail } from './RecetteDetail';

const DUREES = [10, 15, 20, 30, 45];

export function ChronoPane() {
  const { garde, filtres } = useFrigo();
  const urgents = useMemo(
    () => garde.filter((p) => etatFrais(p.expire) === 'rouge').sort((a, b) => (a.expire ?? '9').localeCompare(b.expire ?? '9')),
    [garde],
  );
  const [champs, setChamps] = useState<string[]>(() => [0, 1, 2].map((i) => urgents[i]?.nom ?? ''));
  const [minutes, setMinutes] = useState(20);
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<{ recette: RecetteIA | null; source: 'mistral' | 'local'; erreur?: string } | null>(null);
  const [fiche, setFiche] = useState<Recette | null>(null);

  const remplis = champs.map((c) => c.trim()).filter(Boolean);

  const place = (nom: string) => {
    if (champs.some((c) => c.trim().toLowerCase() === nom.toLowerCase())) return;
    const libre = champs.findIndex((c) => !c.trim());
    const suite = [...champs];
    suite[libre === -1 ? 2 : libre] = nom;
    setChamps(suite);
  };

  const lance = async () => {
    if (!remplis.length) return;
    setEnCours(true);
    setResultat(null);
    setResultat(await genererChrono(remplis, minutes, filtres.regimes));
    setEnCours(false);
  };

  const r = resultat?.recette;
  const sauves = r ? remplis.filter((v) => r.ingredients.some((i) => memeIngredient(i.nom, v))) : [];
  const oublies = r ? remplis.filter((v) => !sauves.includes(v)) : [];

  return (
    <div className="fp-panneau">
      <div className="fp-panneau-tete">
        <h2>⏱️ Anti-Gaspi chrono</h2>
        <span className="fp-soustitre">
          Trois ingrédients qui périment ce soir, le temps que tu as : une recette courte et directe, sans blabla.
        </span>
      </div>

      <section className="fp-bloc">
        <h3>🧺 Ce qui doit partir ce soir</h3>
        <div className="fp-chrono-champs">
          {champs.map((c, i) => (
            <label key={i} className="fp-chrono-champ">
              <span>Ingrédient {i + 1}</span>
              <input
                className="fp-champ"
                value={c}
                placeholder={['ex. : courgette', 'ex. : crème fraîche', 'ex. : jambon'][i]}
                onChange={(e) => setChamps(champs.map((x, j) => (j === i ? e.target.value : x)))}
                maxLength={60}
              />
            </label>
          ))}
        </div>
        {urgents.length > 0 && (
          <>
            <p className="fp-note">En pastille rouge dans ton frigo (touche pour l'ajouter) :</p>
            <div className="fp-puces">
              {urgents.slice(0, 8).map((p) => (
                <Puce key={p.id} active={champs.some((c) => c.trim().toLowerCase() === p.nom.toLowerCase())} onClick={() => place(p.nom)}>
                  {p.nom}
                </Puce>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="fp-bloc">
        <h3>⏳ Le temps que tu as, tout compris</h3>
        <div className="fp-puces" aria-label="Temps disponible">
          {DUREES.map((d) => (
            <Puce key={d} active={minutes === d} onClick={() => setMinutes(d)}>
              {d} min
            </Puce>
          ))}
        </div>
        {filtres.regimes.length > 0 && (
          <p className="fp-note">Régimes appliqués : {filtres.regimes.map((x) => LIBELLES_REGIME[x]).join(', ')}.</p>
        )}
        <Bouton variante="primaire" onClick={() => void lance()} disabled={enCours || !remplis.length}>
          {enCours ? '⏳ Je cherche…' : `⚡ Ma recette en ${minutes} min`}
        </Bouton>
      </section>

      {resultat?.erreur && <div className="fp-alerte" role="status">⚠️ {resultat.erreur} — recette tirée du carnet local.</div>}

      {resultat && !r && (
        <div className="fp-alerte" role="status">
          Aucune recette du carnet ne sauve ces ingrédients en {minutes} min. Essaie avec un peu plus de temps, ou enregistre ta
          clé Mistral dans l'onglet « Chef IA » pour une recette sur mesure.
        </div>
      )}

      {r && (
        <section className="fp-bloc" aria-live="polite">
          <div className="fp-carte-tete">
            <span className="fp-emoji">{r.emoji}</span>
            <strong>{r.nom}</strong>
            <span className="fp-badge-ia">{resultat?.source === 'mistral' ? '🇫🇷 Mistral AI' : '📚 Carnet local, sans IA'}</span>
          </div>
          <div className="fp-badges">
            <span>⏱ {r.temps} min</span>
            {r.temps > minutes && <span>⚠️ un peu plus long que prévu</span>}
          </div>
          {sauves.length > 0 && <p className="fp-note">✅ Sauve : {sauves.join(', ')}.</p>}
          {oublies.length > 0 && <p className="fp-note">Pas utilisé dans cette recette : {oublies.join(', ')}.</p>}
          <h3>Il te faut</h3>
          <ul className="fp-chrono-liste">
            {r.ingredients.map((i, k) => (
              <li key={k}>
                {i.qte ? `${fmtQte(i.qte)} ${i.unite ?? ''} ` : ''}
                {i.nom}
              </li>
            ))}
          </ul>
          <h3>On y va</h3>
          <ol className="fp-etapes">
            {r.etapes.map((e, k) => (
              <li key={k}>
                {e.texte}
                {e.minutes ? <Minuteur label={e.labelMinuteur ?? 'minuteur'} minutes={e.minutes} compact /> : null}
              </li>
            ))}
          </ol>
          <div className="fp-ligne-actions">
            <Bouton onClick={() => setFiche(enRecette(r))}>Ouvrir la fiche (portions, « Je l'ai cuisiné »)</Bouton>
          </div>
        </section>
      )}

      {fiche && <RecetteDetail recette={fiche} onClose={() => setFiche(null)} />}
    </div>
  );
}
