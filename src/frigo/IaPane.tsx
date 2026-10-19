/**
 * IaPane.tsx — le générateur de recettes magiques.
 *
 * La liste exacte du frigo part vers l'API Mistral (hébergée en France, règle
 * nº 5 de l'écosystème) : BYOK, la clé reste dans le navigateur. Erreur,
 * réseau ou pas de clé : repli local garanti. Les recettes IA sont notables
 * (système de notation sur 5) et servent tout le reste de l'app.
 */
import { useState } from 'react';
import { LIBELLES_NIVEAU, LIBELLES_REGIME, type Recette, type Regime } from './types';
import { enRecette, ecrireCle, genererRecette, lireCle, type RecetteIA as RecetteGeneree } from './ia';
import { useFrigo } from './store';
import { Bouton, Puce } from './ui';
import { RecetteDetail } from './RecetteDetail';

export function IaPane() {
  const { garde, filtres, favoris, basculeFavori } = useFrigo();
  const [cle, setCle] = useState<string>(() => lireCle() ?? '');
  const [generation, setGeneration] = useState<RecetteGeneree | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [source, setSource] = useState<'mistral' | 'local'>('mistral');
  const [erreur, setErreur] = useState<string | null>(null);
  const [fiche, setFiche] = useState<Recette | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const songe = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  };

  const ingredients = garde.map((p) => (p.qte ? `${p.qte} ${p.unite ?? ''} ${p.nom}` : p.nom));

  const lance = async () => {
    setEnCours(true);
    setErreur(null);
    const produit = await genererRecette(ingredients, filtres.regimes);
    setGeneration(produit.recette);
    setSource(produit.source);
    setErreur(produit.erreur ?? null);
    setEnCours(false);
  };

  return (
    <div className="fp-panneau">
      <div className="fp-panneau-tete">
        <h2>🤖 Le Chef Mistral</h2>
        <span className="fp-soustitre">
          IA souveraine : Mistral AI, hébergée en France. Ta clé ne quitte jamais ton navigateur — aucune donnée n'est
          utilisée pour l'entraînement.
        </span>
      </div>

      <section className="fp-bloc">
        <h3>🔑 Ta clé d'API (BYOK)</h3>
        <div className="fp-saisie">
          <input
            className="fp-champ"
            type="password"
            placeholder="Colle ta clé Mistral (optionnelle — repli local sinon)"
            value={cle}
            onChange={(e) => setCle(e.target.value)}
          />
          <Bouton
            variante={cle ? 'primaire' : 'fantome'}
            onClick={() => {
              ecrireCle(cle.trim() || null);
              songe(cle.trim() ? 'Clé enregistrée en local.' : 'Clé effacée — mode local.');
            }}
          >
            Enregistrer
          </Bouton>
        </div>
        <p className="fp-note">
          La clé se garde uniquement dans le stockage local de ce navigateur. Le panneau « Clé API » de la barre du haut
          explique aussi l'option de clé managée Alphabette.
        </p>
      </section>

      <section className="fp-bloc">
        <h3>🧺 Ce qui part au Chef ({ingredients.length} éléments)</h3>
        <div className="fp-puces">
          {ingredients.length ? (
            ingredients.map((i) => <Puce key={i} active={false}>{i}</Puce>)
          ) : (
            <Puce active={false}>frigo vide — le Chef improvisera</Puce>
          )}
        </div>
        {filtres.regimes.length > 0 && (
          <p className="fp-note">
            Régimes appliqués : {filtres.regimes.map((r) => LIBELLES_REGIME[r]).join(', ')}.
          </p>
        )}
        <Bouton variante="primaire" onClick={() => void lance()} disabled={enCours}>
          {enCours ? '⏳ Le Chef réfléchit…' : '✨ Générer ma recette sur-mesure'}
        </Bouton>
      </section>

      {erreur && (
        <div className="fp-alerte" role="status">
          ⚠️ {erreur}
        </div>
      )}

      {generation && (
        <section className="fp-bloc">
          <div className="fp-carte-tete">
            <span className="fp-emoji">{generation.emoji}</span>
            <strong>{generation.nom}</strong>
            <span className="fp-badge-ia">{source === 'mistral' ? '🇫🇷 Mistral AI' : '🧰 Repli local'}</span>
          </div>
          <div className="fp-badges">
            <span>⏱ {generation.temps} min</span>
            <span>🎚 {LIBELLES_NIVEAU[generation.niveau]}</span>
            {generation.kcalParPortion && <span>🔥 {generation.kcalParPortion} kcal/portion</span>}
          </div>
          <div className="fp-ligne-actions">
            <Bouton variante="primaire" onClick={() => setFiche(enRecette(generation))}>
              Ouvrir la fiche complète (portions, mode cuisinier…)
            </Bouton>
            <button
              type="button"
              className="fp-favori"
              onClick={() => basculeFavori(generation.id)}
              title="Mettre aux favoris"
            >
              {favoris.includes(generation.id) ? '★' : '☆'}
            </button>
          </div>
          <p className="fp-note">
            La notation sur 5 se règle dans la fiche, en cliquant « Je l'ai cuisiné » — elle alimente ton historique et
            l'impact anti-gaspi.
          </p>
        </section>
      )}

      {toast && <div className="fp-toast">{toast}</div>}

      {fiche && <RecetteDetail recette={fiche} onClose={() => setFiche(null)} />}
    </div>
  );
}
