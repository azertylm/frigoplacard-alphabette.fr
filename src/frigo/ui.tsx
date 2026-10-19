/**
 * ui.tsx — petites briques partagées : pastilles de péremption, étoiles de
 * notation,puces cliquables et minuteur interactif (signal sonore web-audio).
 */
import { useEffect, useRef, useState } from 'react';
import { etatFrais, libelleFrais } from './store';

/** Formate une quantité à la française (0,5 et non 0.5). */
export function fmtQte(q?: number): string {
  if (q === undefined) return '';
  return String(Math.round(q * 100) / 100).replace('.', ',');
}

export function Bouton({
  children,
  onClick,
  variante,
  titre,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variante?: 'primaire' | 'danger' | 'fantome' | 'fantôme';
  titre?: string;
  disabled?: boolean;
}) {
  const classes = ['fp-bouton'];
  if (variante === 'primaire') classes.push('fp-bouton--primaire');
  if (variante === 'danger') classes.push('fp-bouton--danger');
  if (variante === 'fantome' || variante === 'fantôme') classes.push('fp-bouton--fantome');
  return (
    <button type="button" className={classes.join(' ')} onClick={onClick} title={titre} disabled={disabled}>
      {children}
    </button>
  );
}

/** La pastille de couleur dynamique (vert / orange / rouge) + libellé. */
export function PastilleFrais({ expire }: { expire?: string }) {
  const etat = etatFrais(expire);
  return (
    <span className={`fp-pastille fp-pastille--${etat}`} title={`Péremption : ${libelleFrais(expire)}`}>
      <span />
      {libelleFrais(expire)}
    </span>
  );
}

/** Notation sur 5 étoiles (historique) — cliquable si `auChoix`. */
export function Etoiles({ note, auChoix }: { note: number; auChoix?: (n: number) => void }) {
  const [survol, setSurvol] = useState<number | null>(null);
  const courante = survol ?? note;
  return (
    <span
      className={`fp-etoiles${auChoix ? ' fp-etoiles--choix' : ''}`}
      onMouseOut={() => setSurvol(null)}
      aria-label={`Note : ${note} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= courante ? 'plein' : 'vide'}
          onMouseEnter={() => auChoix && setSurvol(n)}
          onClick={() => auChoix && auChoix(n)}
          disabled={!auChoix}
        >
          {n <= courante ? '★' : '☆'}
        </button>
      ))}
    </span>
  );
}

/** Carillon simple et souverain (Web Audio, aucun fichier distant). */
function bip() {
  try {
    const AudioC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioC) return;
    const ctx = new AudioC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
    setTimeout(() => void ctx.close(), 1500);
  } catch {
    /* aucun son disponible : silence poli. */
  }
}

/**
 * Minuteur interactif : clic depuis une étape de cuisson → compte à rebours
 * visible, puis bip en fin de course.
 */
export function Minuteur({ label, minutes, compact }: { label: string; minutes: number; compact?: boolean }) {
  const total = Math.max(1, Math.round(minutes * 60));
  const [reste, setReste] = useState<number | null>(null);
  const refCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (reste === null || reste <= 0) return;
    const t = setInterval(() => setReste((r) => (r === null ? null : r - 1)), 1000);
    return () => clearInterval(t);
  }, [reste]);

  useEffect(() => {
    if (reste !== 0) return;
    if (reste !== null) bip();
  }, [reste]);

  const mm = Math.floor((reste ?? 0) / 60);
  const ss = (reste ?? 0) % 60;

  if (reste === null) {
    return (
      <button type={`button`} className={compact ? 'fp-minuteur fp-minuteur--compact' : 'fp-minuteur'} onClick={() => setReste(total)}>
        ⏱ {label} · {minutes} min
      </button>
    );
  }

  return (
    <button
      type="button"
      className={compact ? 'fp-minuteur fp-minuteur--courant fp-minuteur--compact' : 'fp-minuteur fp-minuteur--courant'}
      onClick={() => setReste((r) => (r ? 0 : null))}
      title={reste > 0 ? 'Cliquer pour annuler' : 'Terminé ! Cliquer pour effacer'}
    >
      {reste > 0 ? (
        <>
          ⏳ {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')} — {label} (annuler)
        </>
      ) : (
        <>🔔 {label} : c\u2019est prêt ! (cliquer pour effacer)</>
      )}
    </button>
  );
}

/** Une puce de filtre, réutilisable par tous les panneaux. */
export function Puce({ active, children, onClick, titre }: { active?: boolean; children: React.ReactNode; onClick?: () => void; titre?: string }) {
  return (
    <button type="button" title={titre} className={`fp-puce${active ? ' fp-puce--active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}
