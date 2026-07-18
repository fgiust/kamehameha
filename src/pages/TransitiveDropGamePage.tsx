import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { stripRuby } from 'tenshindiff';
import JapaneseText from '../components/JapaneseText';
import PageLayout from '../components/PageLayout';
import { transitiveData } from '../data/dictTransitivePairs';
import {
  normalizeSegments,
  notifySessionProgressUpdated,
  readPersistedSessionProgress,
  writePersistedSessionProgressRecord,
  type ProgressSegmentState,
} from '../hooks/useSessionProgress';
import { trackExerciseQuestion } from '../utils/exerciseAnalytics';
import {
  playCorrectSfx,
  playDropSfx,
  playGameOverSfx,
  playMoveSfx,
  playStartSfx,
  playWrongSfx,
} from '../utils/retroGameSfx';
import '../styles/transitiveDropGame.css';

type Kind = 't' | 'i';
type Lane = 0 | 1;
type Phase = 'ready' | 'playing' | 'gameover';

type VerbCard = {
  /** Kanji/kana with optional `漢[かん]` furigana notation. */
  ruby: string;
  surface: string;
  en: string;
  it: string;
  kind: Kind;
};

type StackedPiece = {
  id: number;
  ruby: string;
  surface: string;
  meaning: string;
  kind: Kind;
  lane: Lane;
};

type ActivePiece = {
  id: number;
  ruby: string;
  surface: string;
  meaning: string;
  kind: Kind;
  lane: Lane;
  y: number;
  state: 'falling' | 'correct' | 'wrong-landing';
};

type Flash = {
  id: number;
  surface: string;
  meaning: string;
  ok: boolean;
};

const MAX_STACK = 7;
/** Slot height as a fraction of the playfield — must match `--tdg-slot` in CSS. */
const PIECE_H = 0.1;
const PERSIST_KEY = '/transitive-drop';
/** HP bar length = number of verbs (both sides of each pair); rolling window of last N. */
const PROGRESS_TOTAL = transitiveData.length * 2;

function loadProgressHistory(): ProgressSegmentState[] {
  const persisted = readPersistedSessionProgress(PERSIST_KEY);
  if (!persisted) return [];
  return persisted.filter((s): s is 1 | 2 => s === 1 || s === 2).slice(-PROGRESS_TOTAL);
}
const BASE_SPEED = 0.12;
const SPEED_PER_SCORE = 0.006;
const MAX_SPEED = 0.42;
const SOFT_DROP_MULT = 3.2;

function buildDeck(): VerbCard[] {
  const cards: VerbCard[] = [];
  for (const pair of transitiveData) {
    cards.push({
      ruby: pair.t.verb,
      surface: stripRuby(pair.t.verb),
      en: pair.t.en,
      it: pair.t.it,
      kind: 't',
    });
    cards.push({
      ruby: pair.i.verb,
      surface: stripRuby(pair.i.verb),
      en: pair.i.en,
      it: pair.i.it,
      kind: 'i',
    });
  }
  return cards;
}

function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function landYFor(lane: Lane, kind: Kind, stacks: StackedPiece[]): number {
  const correctLane: Lane = kind === 't' ? 0 : 1;
  if (lane === correctLane) {
    return 1 - PIECE_H;
  }
  const height = stacks.filter(s => s.lane === lane).length;
  return Math.max(0.02, 1 - (height + 1) * PIECE_H);
}

function stackTopY(lane: Lane, stacks: StackedPiece[]): number {
  const height = stacks.filter(s => s.lane === lane).length;
  return Math.max(0.02, 1 - height * PIECE_H);
}

export default function TransitiveDropGamePage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';
  const pageTitle = t('pages.transitiveDrop.title');

  const deckRef = useRef<VerbCard[]>([]);
  const idRef = useRef(1);
  const stacksRef = useRef<StackedPiece[]>([]);
  const activeRef = useRef<ActivePiece | null>(null);
  const scoreRef = useRef(0);
  const softDropRef = useRef(false);
  const phaseRef = useRef<Phase>('ready');
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const resolvingRef = useRef(false);
  const progressHistoryRef = useRef<ProgressSegmentState[]>(loadProgressHistory());

  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [stacks, setStacks] = useState<StackedPiece[]>([]);
  const [active, setActive] = useState<ActivePiece | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [shake, setShake] = useState(false);
  const [showFurigana, setShowFurigana] = useState(false);

  const allCards = useMemo(() => buildDeck(), []);

  const meaningOf = useCallback(
    (card: Pick<VerbCard, 'en' | 'it'>) => (lang === 'it' ? card.it : card.en),
    [lang],
  );

  const nextCard = useCallback((): VerbCard => {
    if (deckRef.current.length === 0) {
      deckRef.current = shuffle(allCards);
    }
    return deckRef.current.pop()!;
  }, [allCards]);

  const spawnPiece = useCallback(() => {
    const leftFull = stacksRef.current.filter(s => s.lane === 0).length >= MAX_STACK;
    const rightFull = stacksRef.current.filter(s => s.lane === 1).length >= MAX_STACK;
    if (leftFull && rightFull) {
      phaseRef.current = 'gameover';
      setPhase('gameover');
      playGameOverSfx();
      return;
    }

    const card = nextCard();
    let lane: Lane = Math.random() < 0.5 ? 0 : 1;
    if (lane === 0 && leftFull) lane = 1;
    if (lane === 1 && rightFull) lane = 0;

    const piece: ActivePiece = {
      id: idRef.current++,
      ruby: card.ruby,
      surface: card.surface,
      meaning: meaningOf(card),
      kind: card.kind,
      lane,
      y: 0,
      state: 'falling',
    };
    activeRef.current = piece;
    setActive(piece);
  }, [meaningOf, nextCard]);

  const endGame = useCallback(() => {
    phaseRef.current = 'gameover';
    setPhase('gameover');
    activeRef.current = null;
    setActive(null);
    playGameOverSfx();
  }, []);

  const recordHpProgress = useCallback((ok: boolean) => {
    const next = [...progressHistoryRef.current, (ok ? 1 : 2) as ProgressSegmentState].slice(
      -PROGRESS_TOTAL,
    );
    progressHistoryRef.current = next;
    const segments = normalizeSegments(next, PROGRESS_TOTAL);
    writePersistedSessionProgressRecord(PERSIST_KEY, segments);
    notifySessionProgressUpdated(PERSIST_KEY);
    trackExerciseQuestion(PERSIST_KEY, ok);
  }, []);

  const resolveLanding = useCallback(
    (piece: ActivePiece) => {
      if (resolvingRef.current) return;
      resolvingRef.current = true;

      const correctLane: Lane = piece.kind === 't' ? 0 : 1;
      const ok = piece.lane === correctLane;
      playDropSfx();
      recordHpProgress(ok);

      if (ok) {
        playCorrectSfx();
        scoreRef.current += 1;
        setScore(scoreRef.current);
        setLevel(1 + Math.floor(scoreRef.current / 5));
        setFlash({
          id: piece.id,
          surface: piece.surface,
          meaning: piece.meaning,
          ok: true,
        });
        const fading: ActivePiece = { ...piece, state: 'correct' };
        activeRef.current = fading;
        setActive(fading);

        window.setTimeout(() => {
          setFlash(null);
          activeRef.current = null;
          setActive(null);
          resolvingRef.current = false;
          if (phaseRef.current === 'playing') spawnPiece();
        }, 900);
        return;
      }

      playWrongSfx();
      setShake(true);
      window.setTimeout(() => setShake(false), 360);
      setFlash({
        id: piece.id,
        surface: piece.surface,
        meaning: piece.meaning,
        ok: false,
      });

      const stacked: StackedPiece = {
        id: piece.id,
        ruby: piece.ruby,
        surface: piece.surface,
        meaning: piece.meaning,
        kind: piece.kind,
        lane: piece.lane,
      };
      const nextStacks = [...stacksRef.current, stacked];
      stacksRef.current = nextStacks;
      setStacks(nextStacks);

      activeRef.current = null;
      setActive(null);

      window.setTimeout(() => {
        setFlash(null);
        resolvingRef.current = false;
        const laneHeight = nextStacks.filter(s => s.lane === piece.lane).length;
        if (laneHeight >= MAX_STACK || stackTopY(piece.lane, nextStacks) <= PIECE_H * 1.5) {
          endGame();
          return;
        }
        if (phaseRef.current === 'playing') spawnPiece();
      }, 1000);
    },
    [endGame, recordHpProgress, spawnPiece],
  );

  const startGame = useCallback(() => {
    playStartSfx();
    deckRef.current = shuffle(allCards);
    idRef.current = 1;
    stacksRef.current = [];
    activeRef.current = null;
    scoreRef.current = 0;
    softDropRef.current = false;
    resolvingRef.current = false;
    lastTsRef.current = 0;
    setStacks([]);
    setActive(null);
    setFlash(null);
    setScore(0);
    setLevel(1);
    setShake(false);
    phaseRef.current = 'playing';
    setPhase('playing');
    spawnPiece();
  }, [allCards, spawnPiece]);

  const moveToLane = useCallback((lane: Lane) => {
    if (phaseRef.current !== 'playing' || resolvingRef.current) return;
    const piece = activeRef.current;
    if (!piece || piece.state !== 'falling') return;
    if (piece.lane === lane) return;
    if (stacksRef.current.filter(s => s.lane === lane).length >= MAX_STACK) return;
    const next = { ...piece, lane };
    activeRef.current = next;
    setActive(next);
    playMoveSfx();
  }, []);

  const hardDrop = useCallback(() => {
    if (phaseRef.current !== 'playing' || resolvingRef.current) return;
    const piece = activeRef.current;
    if (!piece || piece.state !== 'falling') return;
    const target = landYFor(piece.lane, piece.kind, stacksRef.current);
    const hard = { ...piece, y: target };
    activeRef.current = hard;
    setActive(hard);
    resolveLanding(hard);
  }, [resolveLanding]);

  const toggleFurigana = useCallback(() => {
    setShowFurigana(prev => !prev);
    playMoveSfx();
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Lock scroll + fit inside the *visible* area. Mobile browsers (esp. Chrome/Comet)
  // overlay toolbars that 100vh/dvh/svh and even visualViewport alone can miss.
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.add('tdg-mobile-lock');
    body.classList.add('tdg-mobile-lock');

    const fitMq = window.matchMedia('(max-width: 900px), (pointer: coarse)');
    const shouldFitViewport = () =>
      fitMq.matches || (navigator.maxTouchPoints > 0 && window.innerWidth <= 1200);

    const syncViewportHeight = () => {
      if (!shouldFitViewport()) {
        root.style.removeProperty('--tdg-app-height');
        root.style.removeProperty('--tdg-vv-top');
        body.style.removeProperty('height');
        body.style.removeProperty('max-height');
        body.style.removeProperty('top');
        body.classList.remove('tdg-vv-fit');
        return;
      }

      const vv = window.visualViewport;
      const candidates = [
        vv?.height,
        window.innerHeight,
        root.clientHeight,
        document.documentElement.clientHeight,
      ].filter((n): n is number => typeof n === 'number' && n > 0);

      // Prefer the smallest reported height — some Chromium shells report an
      // optimistic visualViewport that still sits under bottom browser chrome.
      const visible = Math.min(...candidates);
      // Wide safety: Chrome/Comet bottom chrome is often large; keep ≥16% too.
      const safety = Math.max(140, Math.round(visible * 0.18));
      const height = Math.max(260, Math.floor(visible - safety));
      const top = Math.floor(vv?.offsetTop ?? 0);

      root.style.setProperty('--tdg-app-height', `${height}px`);
      root.style.setProperty('--tdg-vv-top', `${top}px`);
      body.style.height = `${height}px`;
      body.style.maxHeight = `${height}px`;
      body.style.top = `${top}px`;
      body.classList.add('tdg-vv-fit');
    };

    syncViewportHeight();
    // Re-measure after browser chrome settles (orientation / URL bar animation).
    const retryIds = [50, 150, 400].map(ms => window.setTimeout(syncViewportHeight, ms));

    const vv = window.visualViewport;
    vv?.addEventListener('resize', syncViewportHeight);
    vv?.addEventListener('scroll', syncViewportHeight);
    window.addEventListener('resize', syncViewportHeight);
    window.addEventListener('orientationchange', syncViewportHeight);
    fitMq.addEventListener('change', syncViewportHeight);

    const onTouchMove = (e: TouchEvent) => {
      if (!shouldFitViewport()) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('button, a, input, textarea, .settings-panel, .settings-panel-container')) {
        return;
      }
      e.preventDefault();
    };
    document.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      root.classList.remove('tdg-mobile-lock');
      body.classList.remove('tdg-mobile-lock', 'tdg-vv-fit');
      root.style.removeProperty('--tdg-app-height');
      root.style.removeProperty('--tdg-vv-top');
      body.style.removeProperty('height');
      body.style.removeProperty('max-height');
      body.style.removeProperty('top');
      retryIds.forEach(id => window.clearTimeout(id));
      vv?.removeEventListener('resize', syncViewportHeight);
      vv?.removeEventListener('scroll', syncViewportHeight);
      window.removeEventListener('resize', syncViewportHeight);
      window.removeEventListener('orientationchange', syncViewportHeight);
      fitMq.removeEventListener('change', syncViewportHeight);
      document.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'playing') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      return;
    }

    const tick = (ts: number) => {
      if (phaseRef.current !== 'playing') return;
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      const piece = activeRef.current;
      if (piece && piece.state === 'falling' && !resolvingRef.current) {
        const speed =
          Math.min(MAX_SPEED, BASE_SPEED + scoreRef.current * SPEED_PER_SCORE)
          * (softDropRef.current ? SOFT_DROP_MULT : 1);
        const target = landYFor(piece.lane, piece.kind, stacksRef.current);
        const nextY = piece.y + speed * dt;
        if (nextY >= target) {
          const landed = { ...piece, y: target };
          activeRef.current = landed;
          setActive(landed);
          resolveLanding(landed);
        } else {
          const moved = { ...piece, y: nextY };
          activeRef.current = moved;
          setActive(moved);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [phase, resolveLanding]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
      }

      if (e.key === 'Shift' && !e.repeat) {
        e.preventDefault();
        toggleFurigana();
        return;
      }

      if (phaseRef.current === 'ready' || phaseRef.current === 'gameover') {
        if (e.key === 'Enter' || e.key === ' ') startGame();
        return;
      }

      if (phaseRef.current !== 'playing' || resolvingRef.current) return;
      const piece = activeRef.current;
      if (!piece || piece.state !== 'falling') return;

      if (e.key === 'ArrowLeft') {
        moveToLane(0);
        return;
      }
      if (e.key === 'ArrowRight') {
        moveToLane(1);
        return;
      }
      if (e.key === 'ArrowDown') {
        softDropRef.current = true;
        return;
      }
      if (e.key === ' ') {
        hardDrop();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') softDropRef.current = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [hardDrop, moveToLane, startGame, toggleFurigana]);

  const onPlayfieldPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (phaseRef.current !== 'playing') return;
      // Overlay buttons handle their own events; ignore non-primary pointers.
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const lane: Lane = e.clientX - rect.left < rect.width / 2 ? 0 : 1;
      moveToLane(lane);
    },
    [moveToLane],
  );

  const onHardDropPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      // Bottom tap-to-drop is a mobile/touch control; keep mouse for desktop keyboard play.
      if (e.pointerType === 'mouse') return;
      if (phaseRef.current !== 'playing') return;
      if (e.button !== 0) return;
      e.preventDefault();
      hardDrop();
    },
    [hardDrop],
  );

  const stackedNodes = stacks.map(piece => {
    const idx = stacks.filter(s => s.lane === piece.lane && s.id <= piece.id).length - 1;
    const top = (1 - (idx + 1) * PIECE_H) * 100;
    return (
      <div
        key={piece.id}
        className={`tdg-piece is-stacked is-wrong ${piece.lane === 0 ? 'is-left' : 'is-right'} ${showFurigana ? 'has-furigana' : ''}`}
        style={{ top: `${top}%` }}
        title={piece.meaning}
      >
        {showFurigana ? (
          <JapaneseText text={piece.ruby} showFurigana />
        ) : (
          piece.surface
        )}
      </div>
    );
  });

  return (
    <PageLayout pageTitle={pageTitle}>
      <div className="tdg-page">
        <div className="tdg-shell" role="application" aria-label={pageTitle}>
          <div className="tdg-title-bar">{t('transitiveDrop.arcadeTitle')}</div>
          <div className="tdg-hud">
            <div>
              {t('transitiveDrop.score')} <strong>{score}</strong>
            </div>
            <button
              type="button"
              className={`tdg-furi-toggle ${showFurigana ? 'is-on' : ''}`}
              onClick={toggleFurigana}
              aria-pressed={showFurigana}
            >
              {t('transitiveDrop.furiganaToggle')}{' '}
              <strong>{showFurigana ? t('transitiveDrop.furiganaOn') : t('transitiveDrop.furiganaOff')}</strong>
            </button>
            <div>
              {t('transitiveDrop.level')} <strong>{level}</strong>
            </div>
          </div>

          <div className="tdg-playfield-wrap">
            <div
              className={`tdg-playfield ${shake ? 'is-shake' : ''}`}
              onPointerDown={onPlayfieldPointerDown}
            >
              <div className="tdg-lane-label is-left">{t('transitive.transitive')}</div>
              <div className="tdg-lane-label is-right">{t('transitive.intransitive')}</div>

              {stackedNodes}

              {active && (
                <div
                  className={[
                    'tdg-piece',
                    active.lane === 0 ? 'is-left' : 'is-right',
                    active.state === 'falling' ? 'is-active' : '',
                    active.state === 'correct' ? 'is-correct' : '',
                    active.state === 'wrong-landing' ? 'is-wrong' : '',
                    showFurigana ? 'has-furigana' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ top: `${active.y * 100}%` }}
                >
                  {showFurigana ? (
                    <JapaneseText text={active.ruby} showFurigana />
                  ) : (
                    active.surface
                  )}
                </div>
              )}

            </div>

            <div
              className="tdg-drop-zone"
              onPointerDown={onHardDropPointerDown}
              aria-label={t('transitiveDrop.helpHard')}
            >
              <div
                className={`tdg-gloss ${flash ? (flash.ok ? 'is-ok' : 'is-bad') : 'is-idle'}`}
                aria-live="polite"
              >
                {flash ? (
                  <>
                    <span className="tdg-gloss-verb">{flash.surface}</span>
                    <span className="tdg-gloss-meaning">{flash.meaning}</span>
                  </>
                ) : (
                  <span className="tdg-gloss-placeholder">—</span>
                )}
              </div>

              <div className="tdg-bins">
                <div className="tdg-bin is-left">
                  {t('transitive.transitive')}
                  <span>他動詞</span>
                </div>
                <div className="tdg-bin is-right">
                  {t('transitive.intransitive')}
                  <span>自動詞</span>
                </div>
              </div>
            </div>
          </div>

          <div className="tdg-help">
            <div>
              <kbd>←</kbd>/<kbd>→</kbd> {t('transitiveDrop.helpMove')}
            </div>
            <div>
              <kbd>↓</kbd> {t('transitiveDrop.helpSoft')} · <kbd>Space</kbd> {t('transitiveDrop.helpHard')}
            </div>
            <div>
              <kbd>Shift</kbd> {t('transitiveDrop.helpFurigana')}
              {showFurigana ? ` (${t('transitiveDrop.furiganaOn')})` : ''}
            </div>
            <div>
              <kbd>Enter</kbd> {t('transitiveDrop.helpStart')}
            </div>
          </div>

          {phase === 'ready' && (
            <div className="tdg-overlay">
              <h2>{t('transitiveDrop.readyTitle')}</h2>
              <p>{t('transitiveDrop.readyBody')}</p>
              <button type="button" className="tdg-btn" onClick={startGame}>
                {t('transitiveDrop.start')}
              </button>
            </div>
          )}

          {phase === 'gameover' && (
            <div className="tdg-overlay is-gameover">
              <h2>{t('transitiveDrop.gameOver')}</h2>
              <p className="tdg-score-final">
                {t('transitiveDrop.finalScore', { score })}
              </p>
              <p>{t('transitiveDrop.tryAgain')}</p>
              <button type="button" className="tdg-btn" onClick={startGame}>
                {t('transitiveDrop.restart')}
              </button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
