/**
 * FrigoPane.tsx — gestion avancée du garde-manger virtuel.
 *
 * Saisie avec péremption estimée, pastilles dynamiques, rapels, import vrac,
 * restes de fêtes, astuce du chef du jour, traducteur de restes insolites,
 * produits de saison et impact anti-gaspi.
 */
import { useMemo, useState } from 'react';
import { ASTUCES_CHEF, RESTES_INSOLITES, SAISON } from './data';
import { etatFrais, useFrigo } from './store';
import { Bouton, PastilleFrais, Puce, fmtQte } from './ui';

/** L'astuce du chef change chaque jour (déterministe par date). */
function astuceDuJour(): string {
  const jour = Math.floor(Date.now() / 86_400_000);
  return ASTUCES_CHEF[jour % ASTUCES_CHEF.length];
}

export function FrigoPane({ ouvreRecette }: { ouvreRecette: () => void }) {
  const { garde, ajoute, retire, videTout, courses, ajouteCourses, filtres, majFiltres, impact } = useFrigo();
  const [nom, setNom] = useState('');
  const [qte, setQte] = useState('');
  const [unite, setUnite] = useState('');
  const [expire, setExpire] = useState('');
  const [vrac, setVrac] = useState('');
  const [ouvreVrac, setOuvreVrac] = useState(false);

  const mois = new Date().getMonth() + 1;
  const saison = SAISON[mois] ?? SAISON[1];

  /** Trié du plus urgent au plus lointain, périmés en tête. */
  const tries = useMemo(() => {
    const t = [...garde];
    t.sort((a, b) => (a.expire ?? '9').localeCompare(b.expire ?? '9'));
    return t;
  }, [garde]);

  const urgents = tries.filter((p) => etatFrais(p.expire) === 'rouge').length;

  /** Import vrac : lignes libres « 3 œufs, yaourt avant vendredi, 200 g de riz… » */
  const colleVrac = () => {
    for (const ligne of vrac.split(/[,;\n]/)) {
      const brut = ligne.trim();
      if (!brut) continue;
      const matchQte = brut.match(/(\d+(?:[.,]\d+)?)\s*(g|kg|cl|ml|l|tranches?|gousses?|boites?|unités?)?\b/i);
      const numerique = matchQte ? Number(matchQte[1].replace(',', '.')) : undefined;
      const nomSansQte = matchQte ? brut.replace(matchQte[0], '') : brut;
      const matchAvant = brut.match(/avant\s+(?:le\s+)?(\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?)/i);
      const matchJours = brut.match(/\bin\s+(\d+)\s+jours?\b|\bdans\s+(\d+)\s+jours?\b/i);
      let iso: string | undefined;
      if (matchAvant) {
        const [j, m, a] = matchAvant[1].split(/[\/.-]/).map(Number);
        const annee = a ? (a < 100 ? 2000 + a : a) : new Date().getFullYear();
        iso = new Date(annee, (m ?? Date.now() % 100) - 1, j).toISOString().slice(0, 10);
      } else if (matchJours) {
        const jours = Number(matchJours[1] ?? matchJours[2]);
        iso = new Date(Date.now() + jours * 86_400_000).toISOString().slice(0, 10);
      }
      ajoute(nomSansQte.replace(/avant.*$/i, '').trim(), numerique, matchQte?.[2]?.toLowerCase(), iso);
    }
    setVrac('');
    setOuvreVrac(false);
  };

  return (
    <div className="fp-panneau">
      <div className="fp-panneau-tete">
        <h2>🧺 Mon frigo-mon placard</h2>
        <div className="fp-stat-impact" title="Impact anti-gaspi local, calculé depuis tes cuissons et tes « consommés »">
          <span>
            <strong>{impact.plats}</strong> plats cuisinés
          </span>
          <span>
            <strong>{Math.round(impact.poidsKg * 10) / 10} kg</strong> sauvés
          </span>
          <span>
            <strong>{Math.round(impact.euros * 100) / 100} €</strong> économisés
          </span>
        </div>
      </div>

      {urgents > 0 && (
        <div className="fp-alerte" role="status">
          ⚠️ {urgents} produit{urgents > 1 ? 's' : ''} expire{urgents > 1 ? 'nt' : ''} très vite — cuisiner{' '}
          <button type="button" className="fp-lien" onClick={ouvreRecette}>
            les idées de la maison
          </button>
          .
        </div>
      )}

      <div className="fp-saisie">
        <input
          className="fp-champ"
          placeholder="Que veux-tu ajouter ? (ex. courgette)"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              ajoute(nom, qte ? Number(qte.replace(',', '.')) : undefined, unite || undefined, expire || undefined);
              setNom('');
              setQte('');
              setUnite('');
              setExpire('');
            }
          }}
        />
        <input className="fp-champ fp-champ--qte" placeholder="Qté" value={qte} onChange={(e) => setQte(e.target.value)} />
        <input className="fp-champ fp-champ--unite" placeholder="g, unité…" value={unite} onChange={(e) => setUnite(e.target.value)} />
        <input className="fp-champ" type="date" value={expire} onChange={(e) => setExpire(e.target.value)} title="Péremption (vide = estimée automatiquement)" />
        <Bouton
          variante="primaire"
          onClick={() => {
            ajoute(nom, qte ? Number(qte.replace(',', '.')) : undefined, unite || undefined, expire || undefined);
            setNom('');
            setQte('');
            setUnite('');
            setExpire('');
          }}
        >
          + Ajouter
        </Bouton>
      </div>

      <div className="fp-ligne-actions">
        <Puce active={ouvreVrac} onClick={() => setOuvreVrac((o) => !o)}>
          📥 Import rapide par vrac
        </Puce>
        <Puce active={filtres.restesFetes} onClick={() => majFiltres({ restesFetes: !filtres.restesFetes })}>
          🎉 Restes de fêtes
        </Puce>
        {garde.length > 0 && (
          <Puce onClick={() => videTout()} active={false}>
            🗑 Vider le garde-manger
          </Puce>
        )}
      </div>

      {ouvreVrac && (
        <div className="fp-vrac">
          <textarea
            className="fp-texte"
            rows={4}
            placeholder={'Colle tes courses en vrac, une idée par ligne :\n3 œufs\n200 g de riz\nyaourt dans 2 jours\n2 bananes bien mûres'}
            value={vrac}
            onChange={(e) => setVrac(e.target.value)}
          />
          <Bouton variante="primaire" onClick={colleVrac}>
            Verser dans le frigo
          </Bouton>
        </div>
      )}

      {garde.length === 0 ? (
        <p className="fp-vide">
          Ton garde-manger est vide. Ajoute un premier produit, ou passe un coup d’œil aux{' '}
          <button type="button" className="fp-lien" onClick={ouvreRecette}>
            recettes du placard
          </button>{' '}
          pour t’inspirer.
        </p>
      ) : (
        <ul className="fp-produits">
          {tries.map((p) => (
            <li key={p.id} className="fp-produit">
              <div className="fp-produit-nom">
                <strong>{p.nom}</strong>
                {p.qte ? (
                  <span className="fp-produit-qte">
                    {' '}
                    · {fmtQte(p.qte)} {p.unite ?? ''}
                  </span>
                ) : null}
              </div>
              <PastilleFrais expire={p.expire} />
              <div className="fp-produit-actions">
                <button type="button" className="fp-lien" onClick={() => retire(p.id, true)} title="Consommé à temps : compte dans l'impact anti-gaspi">
                  ✓ consommé
                </button>
                <button type="button" className="fp-lien fp-lien--rouge" onClick={() => retire(p.id, false)} title="Perdu : sorti sans compter">
                  ✕ perdu
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="fp-bloc">
        <h3>🌾 De saison ce mois-ci</h3>
        <div className="fp-puces">
          {[...saison.fruits, ...saison.legumes].map((s) => (
            <Puce key={s} onClick={() => ajoute(s)}>
              {' '}
              {s} +
            </Puce>
          ))}
        </div>
      </section>

      <section className="fp-bloc">
        <h3>👨‍🍳 Astuce du chef du jour</h3>
        <p className="fp-astuce">{astuceDuJour()}</p>
      </section>

      <section className="fp-bloc">
        <h3>🔮 Traducteur de restes insolites</h3>
        <div className="fp-restes">
          {RESTES_INSOLITES.map(({ reste, idees }) => (
            <details key={reste} className="fp-reste">
              <summary>{reste}</summary>
              <ul>
                {idees.map((i) => (
                  <li key={i}>↪ {i}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>

      {courses.length > 0 && (
        <p className="fp-rappel-courses">
          🛒 Ta liste de courses compte {courses.filter((c) => !c.achete).length} article(s) non achetés —{' '}
          <button type="button" className="fp-lien">
            voir au panneau Courses
          </button>
          .
        </p>
      )}
    </div>
  );
}
