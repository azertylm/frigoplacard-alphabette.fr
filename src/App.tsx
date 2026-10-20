/**
 * App.tsx — FRIGO-PLACARD — zéro gaspi, plein d'idées.
 *
 * Le contenu vit à l'intérieur de <AppShell> (@alphabette/shell) : les barres
 * écosystème et application, les cinq panneaux, le thème et la densité sont
 * fournis par la base commune — JAMAIS recodés ici.
 */
import { useState } from 'react';
import { AppShell } from '@alphabette/shell';
import '@alphabette/shell/style.css';
import { APP } from './alphabette.app';
import { FrigoProvider } from './frigo/store';
import { FrigoPane } from './frigo/FrigoPane';
import { RecettesPane } from './frigo/RecettesPane';
import { IaPane } from './frigo/IaPane';
import { CoursesPane } from './frigo/CoursesPane';
import { HistoriquePane } from './frigo/HistoriquePane';
import { QuizPane } from './frigo/QuizPane';
import { BatchPane } from './frigo/BatchPane';
import { CataloguePane } from './frigo/CataloguePane';
import './frigo/app.css';

type Onglet = 'frigo' | 'recettes' | 'catalogue' | 'ia' | 'courses' | 'historique' | 'quiz' | 'batch';

const ONGLETS: Array<{ id: Onglet; label: string }> = [
  { id: 'frigo', label: '🧺 Mon frigo' },
  { id: 'recettes', label: '🍳 Recettes' },
  { id: 'catalogue', label: '📚 Catalogue +' },
  { id: 'ia', label: '🤖 Chef IA' },
  { id: 'courses', label: '🛒 Courses' },
  { id: 'historique', label: '📖 Historique' },
  { id: 'batch', label: '🥘 Batch cooking' },
  { id: 'quiz', label: '🎓 Quiz anti-gaspi' },
];

export function App() {
  const [onglet, setOnglet] = useState<Onglet>('frigo');
  const [menu, setMenu] = useState(false);

  return (
    <FrigoProvider>
      <AppShell app={APP} onToggleNav={() => setMenu((m) => !m)}>
        <nav className="fp-nav" aria-label="Sections de l'application">
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`fp-nav-onglet${onglet === o.id ? ' fp-nav-onglet--actif' : ''}`}
              onClick={() => {
                setOnglet(o.id);
                setMenu(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </nav>

        {menu && (
          <aside className="fp-menu" aria-label="Menu latéral">
            <h3>Frigo-Placard</h3>
            <p>Pas une simple calculatrice d'intention : c'est ton garde-manger qui commande le menu.</p>
            <ul>
              {ONGLETS.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    className={onglet === o.id ? 'actif' : ''}
                    onClick={() => {
                      setOnglet(o.id);
                      setMenu(false);
                    }}
                  >
                    {o.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="fp-menu-liens">
              <a href="https://alphabette.fr" target="_blank" rel="noreferrer">
                ⭐ L'écosystème alphabette.fr
              </a>
              <a href={APP.donUrl} target="_blank" rel="noreferrer">
                ♥ Soutenir l'écosystème
              </a>
              <a href="https://frigoplacard.alphabette.fr" target="_blank" rel="noreferrer">
                🏅 Cette app : frigoplacard.alphabette.fr
              </a>
            </div>
          </aside>
        )}

        <main className="fp-contenu">
          {onglet === 'frigo' && <FrigoPane ouvreRecette={() => setOnglet('recettes')} />}
          {onglet === 'recettes' && <RecettesPane />}
          {onglet === 'catalogue' && <CataloguePane />}
          {onglet === 'ia' && <IaPane />}
          {onglet === 'courses' && <CoursesPane />}
          {onglet === 'historique' && <HistoriquePane />}
          {onglet === 'batch' && <BatchPane />}
          {onglet === 'quiz' && <QuizPane />}
        </main>

        <footer className="fp-pied">
          <p>
            🥕 Frigo-Placard — partie de l'écosystème{' '}
            <a href="https://alphabette.fr" target="_blank" rel="noreferrer">
              alphabette.fr
            </a>
            . IA souveraine Mistral AI (France, BYOK), sans publicité, sans revente de données.{' '}
            <a href="https://alphabette.fr/don" target="_blank" rel="noreferrer">
              ♥ Faire un don
            </a>
          </p>
        </footer>
      </AppShell>
    </FrigoProvider>
  );
}
