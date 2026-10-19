/**
 * HistoriquePane.tsx — les plats cuisinés, notés sur 5.
 *
 * Et le grand tableau d'impact anti-gaspi : kg sauvés et euros épargnés
 * (comptés globalement, cf. store + FrigoPane).
 */
import { useFrigo } from './store';
import { Etoiles } from './ui';

export function HistoriquePane() {
  const { historique, note, retirePlat, impact } = useFrigo();

  return (
    <div className="fp-panneau">
      <div className="fp-panneau-tete">
        <h2>📖 Mes plats cuisinés</h2>
      </div>

      <section className="fp-impact">
        <div className="fp-impact-carte">
          <strong>{impact.plats}</strong>
          <span>plats sauvés</span>
        </div>
        <div className="fp-impact-carte">
          <strong>{Math.round(impact.poidsKg * 10) / 10} kg</strong>
          <span>de nourriture sauvée</span>
        </div>
        <div className="fp-impact-carte">
          <strong>{Math.round(impact.euros * 100) / 100} €</strong>
          <span>d'économies estimées</span>
        </div>
      </section>
      <p className="fp-note">
        Estimation ADEME ({'~4,7 €/kg'}) pondérée par les quantités de tes recettes : les convives ne comptent pas, le
        contenu du frigo si.
      </p>

      {historique.length === 0 ? (
        <p className="fp-vide">
          Rien encore. Ouvre une recette, cuisine-la, et coche « Je l'ai cuisiné » pour commencer ta bravade anti-gaspi.
        </p>
      ) : (
        <ul className="fp-plats">
          {historique.map((p) => (
            <li key={p.id}>
              <strong>{p.emoji} {p.nom}</strong>
              <span>
                {new Date(p.date).toLocaleDateString('fr-FR')} · pour {p.portions} · {p.poidsKg ?? 0} kg sauvés
              </span>
              <Etoiles note={p.note} auChoix={(n) => note(p.id, n)} />
              <button type="button" className="fp-lien fp-lien--rouge" onClick={() => retirePlat(p.id)}>
                retirer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
