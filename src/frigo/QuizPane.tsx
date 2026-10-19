/**
 * QuizPane.tsx — le mini-jeu anti-gaspi : 5 questions, score, redémarrage.
 */
import { useState } from 'react';
import { QUIZ } from './data';
import { Bouton } from './ui';

export function QuizPane() {
  const [pos, setPos] = useState(0);
  const [score, setScore] = useState(0);
  const [choix, setChoix] = useState<number | null>(null);
  const [fini, setFini] = useState(false);

  const q = QUIZ[pos];

  const reponds = (n: number) => {
    if (choix !== null) return;
    setChoix(n);
    if (n === q.bonne) setScore((s) => s + 1);
  };

  const suivant = () => {
    if (pos + 1 >= QUIZ.length) {
      setFini(true);
      return;
    }
    setPos((p) => p + 1);
    setChoix(null);
  };

  const redemarre = () => {
    setPos(0);
    setScore(0);
    setChoix(null);
    setFini(false);
  };

  if (fini) {
    const mention = score === 5 ? 'Chef anti-gaspi suprême 👑' : score >= 3 ? 'Tu es du métier 🔪' : 'Le frigo attend ta révision 🥕';
    return (
      <div className="fp-panneau">
        <h2>🎓 Résultat : {score}/{QUIZ.length}</h2>
        <p className="fp-astuce">{mention}</p>
        <Bouton variante="primaire" onClick={redemarre}>
          ↺ Recommencer
        </Bouton>
      </div>
    );
  }

  return (
    <div className="fp-panneau">
      <div className="fp-panneau-tete">
        <h2>🎓 Quiz anti-gaspi</h2>
        <span className="fp-soustitre">
          Question {pos + 1} sur {QUIZ.length} · {score} bonne{score > 1 ? 's' : ''}
        </span>
      </div>

      <section className="fp-bloc">
        <h3>{q.question}</h3>
        <ul className="fp-quiz-choix">
          {q.choix.map((c, n) => (
            <li key={c}>
              <button
                type="button"
                className={`fp-quiz-option${choix === null ? '' : n === q.bonne ? ' fp-quiz-option--ok' : choix === n ? ' fp-quiz-option--ko' : ''}`}
                onClick={() => reponds(n)}
                disabled={choix !== null}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>

        {choix !== null && (
          <div className="fp-quiz-suivant">
            <p className="fp-astuce">
              {choix === q.bonne ? '✅ Exact ! ' : '❌ Pas tout à fait. '}
              {q.explication}
            </p>
            <Bouton variante="primaire" onClick={suivant}>
              {pos + 1 >= QUIZ.length ? 'Voir mon score →' : 'Question suivante →'}
            </Bouton>
          </div>
        )}
      </section>
    </div>
  );
}
