"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YouTubePlayer }) => void;
            onStateChange?: (e: { data: number; target: YouTubePlayer }) => void;
          };
        }
      ) => YouTubePlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YouTubePlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  getAvailablePlaybackRates: () => number[];
  destroy: () => void;
};

type QuizTrigger = { quizId: string; triggerAt: number; title: string };

const RATE_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

type Props = {
  youtubeId: string;
  lessonId: string;
  quizTriggers?: QuizTrigger[];
  /** Segundos donde reanudar (progreso guardado). */
  initialTime?: number;
  onTimeUpdate?: (seconds: number) => void;
  onEnded?: () => void;
  onQuizTrigger?: (quizId: string) => void;
};

export function VideoPlayer({
  youtubeId,
  lessonId,
  quizTriggers = [],
  initialTime = 0,
  onTimeUpdate,
  onEnded,
  onQuizTrigger,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedTriggers = useRef<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const lessonKeyRef = useRef(lessonId);

  /** Evita re-montar el iframe cuando el padre re-renderiza con mismas props lógicas. */
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onEndedRef = useRef(onEnded);
  const onQuizTriggerRef = useRef(onQuizTrigger);
  const quizTriggersRef = useRef(quizTriggers);
  const initialTimeRef = useRef(initialTime);
  const playbackRateRef = useRef(playbackRate);

  onTimeUpdateRef.current = onTimeUpdate;
  onEndedRef.current = onEnded;
  onQuizTriggerRef.current = onQuizTrigger;
  quizTriggersRef.current = quizTriggers;
  initialTimeRef.current = initialTime;
  playbackRateRef.current = playbackRate;

  if (lessonKeyRef.current !== lessonId) {
    lessonKeyRef.current = lessonId;
    firedTriggers.current = new Set();
  }

  const setupInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!playerRef.current) return;
      const time = playerRef.current.getCurrentTime();
      onTimeUpdateRef.current?.(Math.floor(time));

      for (const trigger of quizTriggersRef.current) {
        const key = `${trigger.quizId}-${trigger.triggerAt}`;
        if (!firedTriggers.current.has(key) && time >= trigger.triggerAt) {
          firedTriggers.current.add(key);
          playerRef.current.pauseVideo();
          onQuizTriggerRef.current?.(trigger.quizId);
        }
      }
    }, 1000);
  }, []);

  useEffect(() => {
    function initPlayer() {
      if (!containerRef.current) return;
      const resumeAt = initialTimeRef.current;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: youtubeId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (e) => {
            setIsReady(true);
            const p = e.target;
            if (resumeAt > 0) {
              try {
                p.seekTo(resumeAt, true);
              } catch {
                /* noop */
              }
            }
            try {
              p.setPlaybackRate(playbackRateRef.current);
            } catch {
              /* noop */
            }
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setupInterval();
            } else {
              if (intervalRef.current) clearInterval(intervalRef.current);
            }
            if (e.data === window.YT.PlayerState.ENDED) {
              onEndedRef.current?.();
            }
          },
        },
      });
    }

    setIsReady(false);
    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.getElementById("yt-api-script")) {
        const script = document.createElement("script");
        script.id = "yt-api-script";
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [youtubeId, lessonId, setupInterval]);

  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    try {
      playerRef.current.setPlaybackRate(playbackRate);
    } catch {
      /* noop */
    }
  }, [playbackRate, isReady]);

  function onRateChange(rate: number) {
    setPlaybackRate(rate);
    try {
      playerRef.current?.setPlaybackRate(rate);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="text-slate-400 text-sm animate-pulse">Cargando video...</div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <span>Velocidad</span>
          <select
            value={playbackRate}
            onChange={(e) => onRateChange(Number(e.target.value))}
            className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {RATE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r === 1 ? "Normal (1×)" : `${r}×`}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
