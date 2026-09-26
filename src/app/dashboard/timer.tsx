'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LuEye,
  LuEyeOff,
  LuPause,
  LuPictureInPicture,
  LuPlay,
  LuRotateCcw,
} from 'react-icons/lu';

import { graphqlRequest } from '@/lib/graphql-client';

type TimerType = 'FOCUS_TIMER' | 'STOPWATCH';
type TimerStatus = 'RUNNING' | 'PAUSED';

type ActiveTimer = {
  id: string;
  type: TimerType;
  status: TimerStatus;
  taskId: string | null;
  durationSeconds: number | null;
  elapsedSeconds: number;
  startedAt: string;
  runStartedAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ActiveTimerResponse = {
  activeTimer: ActiveTimer | null;
};

type StartFocusResponse = {
  startFocusTimer: ActiveTimer;
};

type StartStopwatchResponse = {
  startStopwatch: ActiveTimer;
};

type PauseResponse = {
  pauseTimer: ActiveTimer;
};

type ResumeResponse = {
  resumeTimer: ActiveTimer;
};

type SaveResponse = {
  saveTimer: {
    id: string;
    type: TimerType;
    duration: number;
    startedAt: string;
    endedAt: string;
  };
};

type CancelResponse = {
  cancelTimer: boolean;
};

type DocumentPiPController = {
  requestWindow: (options?: {
    width?: number;
    height?: number;
  }) => Promise<Window>;

  window: Window | null;
};

const ACTIVE_TIMER_QUERY = `
  query {
    activeTimer {
      id
      type
      status
      taskId
      durationSeconds
      elapsedSeconds
      startedAt
      runStartedAt
      endsAt
      createdAt
      updatedAt
    }
  }
`;

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`;
}

function getFocusProgress(totalSeconds: number, remainingSeconds: number) {
  if (totalSeconds <= 0) return 0;

  return Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds));
}

export function Timer() {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [selectedType, setSelectedType] =
    useState<TimerType>('FOCUS_TIMER');

  const [focusMinutes, setFocusMinutes] = useState(45);
  const [showTime, setShowTime] = useState(false);

  const [displaySeconds, setDisplaySeconds] = useState(45 * 60);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio used when the focus timer finishes.
  const alarmRef = useRef<HTMLAudioElement | null>(null);

  // Prevent the same timer from triggering the notification more than once.
  const notifiedTimerIdRef = useRef<string | null>(null);

  // Document Picture-in-Picture window.
  const miniWindowRef = useRef<Window | null>(null);

  // The mini timer hides Focus Timer time by default.
  const miniShowTimeRef = useRef(false);

  const loadActiveTimer = useCallback(async () => {
    try {
      const data =
        await graphqlRequest<ActiveTimerResponse>(ACTIVE_TIMER_QUERY);

      setActiveTimer(data.activeTimer);

      if (data.activeTimer) {
        setSelectedType(data.activeTimer.type);

        if (data.activeTimer.type === 'FOCUS_TIMER') {
          setShowTime(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timer');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveTimer();
  }, [loadActiveTimer]);

  /*
   * Calculate the displayed timer from the server timestamps.
   *
   * The browser is only responsible for updating what we see.
   * The server remains the source of truth.
   */
  useEffect(() => {
    if (!activeTimer) {
      setDisplaySeconds(
        selectedType === 'FOCUS_TIMER' ? focusMinutes * 60 : 0,
      );
      return;
    }

    const calculateTime = () => {
      if (activeTimer.status === 'PAUSED') {
        if (activeTimer.type === 'FOCUS_TIMER') {
          const remaining =
            (activeTimer.durationSeconds ?? 0) - activeTimer.elapsedSeconds;

          setDisplaySeconds(Math.max(0, remaining));
        } else {
          setDisplaySeconds(activeTimer.elapsedSeconds);
        }

        return;
      }

      if (activeTimer.type === 'FOCUS_TIMER') {
        if (!activeTimer.endsAt) return;

        const remaining = Math.max(
          0,
          Math.floor(
            (new Date(activeTimer.endsAt).getTime() - Date.now()) / 1000,
          ),
        );

        setDisplaySeconds(remaining);

        return;
      }

      if (activeTimer.type === 'STOPWATCH') {
        if (!activeTimer.runStartedAt) return;

        const runningSeconds = Math.floor(
          (Date.now() - new Date(activeTimer.runStartedAt).getTime()) / 1000,
        );

        setDisplaySeconds(
          activeTimer.elapsedSeconds + Math.max(0, runningSeconds),
        );
      }
    };

    calculateTime();

    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, focusMinutes, selectedType]);

  /*
   * Handle the focus timer finishing.
   *
   * This:
   * 1. Prevents duplicate notifications.
   * 2. Shows a desktop notification.
   * 3. Plays the alarm sound.
   * 4. Asks the server to finalize the expired timer.
   */
  const handleFocusTimerFinished = useCallback(
    async (timerId: string) => {
      if (notifiedTimerIdRef.current === timerId) {
        return;
      }

      notifiedTimerIdRef.current = timerId;

try {
  if (
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted'
  ) {
    new Notification('Focus timer finished', {
      body: 'Your focus session is complete.',
      icon: '/utimely.webp',
    });
  }
} catch (error) {
  console.warn('Unable to show timer notification:', error);
}

      try {
        if (!alarmRef.current) {
          alarmRef.current = new Audio('/utimely_notification.mp3');
        }

        alarmRef.current.currentTime = 0;
        await alarmRef.current.play();
      } catch (error) {
        console.warn('Unable to play timer alarm:', error);
      }

      // This causes the server to finalize the expired timer.
      await loadActiveTimer();

      // Tell Today's Time to fetch the newly-created session.
      window.dispatchEvent(new Event('utimely:time-updated'));
    },
    [loadActiveTimer],
  );

  /*
   * When a focus timer reaches zero, trigger the notification/alarm
   * and ask the server for the current timer.
   */
  useEffect(() => {
    if (
      !activeTimer ||
      activeTimer.type !== 'FOCUS_TIMER' ||
      activeTimer.status !== 'RUNNING' ||
      !activeTimer.endsAt
    ) {
      return;
    }

    const remainingMilliseconds =
      new Date(activeTimer.endsAt).getTime() - Date.now();

    const timeout = setTimeout(
      () => {
        void handleFocusTimerFinished(activeTimer.id);
      },
      Math.max(0, remainingMilliseconds + 250),
    );

    return () => clearTimeout(timeout);
  }, [activeTimer, handleFocusTimerFinished]);

  const runAction = async (action: () => Promise<void>) => {
    try {
      setActionLoading(true);
      setError(null);

      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * Optional duration allows the mini timer to start a timer
   * using its own minutes input.
   *
   * The normal dashboard Start button still uses focusMinutes.
   */
  const handleStartFocus = async (durationMinutes = focusMinutes) => {
    // Ask for notification permission while the user is
    // actively interacting with the page.
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn('Unable to request notification permission:', error);
      }
    }

    await runAction(async () => {
      const data = await graphqlRequest<StartFocusResponse>(
        `
          mutation StartFocusTimer($durationMinutes: Int!) {
            startFocusTimer(durationMinutes: $durationMinutes) {
              id
              type
              status
              taskId
              durationSeconds
              elapsedSeconds
              startedAt
              runStartedAt
              endsAt
              createdAt
              updatedAt
            }
          }
        `,
        {
          durationMinutes,
        },
      );

      setFocusMinutes(durationMinutes);
      setActiveTimer(data.startFocusTimer);
      setSelectedType('FOCUS_TIMER');
      setShowTime(false);

      // Mini timer starts with time hidden.
      miniShowTimeRef.current = false;

      // Prepare the alarm audio while the user has just
      // interacted with the page.
      if (!alarmRef.current) {
        alarmRef.current = new Audio('/utimely_notification.mp3');
        alarmRef.current.preload = 'auto';
      }
    });
  };

  const handleStartStopwatch = async () => {
    await runAction(async () => {
      const data = await graphqlRequest<StartStopwatchResponse>(
        `
          mutation {
            startStopwatch {
              id
              type
              status
              taskId
              durationSeconds
              elapsedSeconds
              startedAt
              runStartedAt
              endsAt
              createdAt
              updatedAt
            }
          }
        `,
      );

      setActiveTimer(data.startStopwatch);
      setSelectedType('STOPWATCH');
    });
  };

  const handlePause = async () => {
    await runAction(async () => {
      const data = await graphqlRequest<PauseResponse>(
        `
          mutation {
            pauseTimer {
              id
              type
              status
              taskId
              durationSeconds
              elapsedSeconds
              startedAt
              runStartedAt
              endsAt
              createdAt
              updatedAt
            }
          }
        `,
      );

      setActiveTimer(data.pauseTimer);
    });
  };

  const handleResume = async () => {
    await runAction(async () => {
      const data = await graphqlRequest<ResumeResponse>(
        `
          mutation {
            resumeTimer {
              id
              type
              status
              taskId
              durationSeconds
              elapsedSeconds
              startedAt
              runStartedAt
              endsAt
              createdAt
              updatedAt
            }
          }
        `,
      );

      setActiveTimer(data.resumeTimer);
    });
  };

  const handleSave = async () => {
    await runAction(async () => {
      await graphqlRequest<SaveResponse>(`
        mutation {
          saveTimer {
            id
            type
            duration
            startedAt
            endedAt
          }
        }
      `);

      window.dispatchEvent(new Event('utimely:time-updated'));

      setActiveTimer(null);
      setShowTime(false);
    });
  };

  const handleCancel = async () => {
    await runAction(async () => {
      await graphqlRequest<CancelResponse>(`
        mutation {
          cancelTimer
        }
      `);

      setActiveTimer(null);
      setShowTime(false);
    });
  };

  /*
   * Open the Document Picture-in-Picture timer.
   */
  const handleOpenMiniTimer = async () => {
    try {
      const documentPiP = (
        window as Window & {
          documentPictureInPicture?: DocumentPiPController;
        }
      ).documentPictureInPicture;

      if (!documentPiP) {
        setError('Mini timer is not supported in this browser.');
        return;
      }

      if (miniWindowRef.current && !miniWindowRef.current.closed) {
        miniWindowRef.current.focus();
        return;
      }

      miniShowTimeRef.current = false;

      const pipWindow = await documentPiP.requestWindow({
        width: 260,
        height: 170,
      });

      miniWindowRef.current = pipWindow;

      const doc = pipWindow.document;

      doc.title = 'Utimely';

      doc.head.innerHTML = '';

      const style = doc.createElement('style');

      style.textContent = `
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          width: 100%;
          min-height: 100%;
          overflow: hidden;
        }

        body {
          background: #1f1f24;
          color: #ffffff;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button,
        input {
          font: inherit;
        }

        button {
          border: 0;
        }

        .mini-container {
          width: 100%;
          min-height: 170px;
          padding: 15px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .mini-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .mini-title {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          font-size: 13px;
          font-weight: 600;
          color: #f5f5f5;
        }

        .mini-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 999px;
          background: #6a5bfb;
        }

        .mini-close {
          width: 24px;
          height: 24px;
          padding: 0;
          border-radius: 6px;
          background: transparent;
          color: #a5a5ad;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mini-close:hover {
          background: #2a2a31;
          color: #ffffff;
        }

        .mini-time {
          text-align: center;
          font-size: 34px;
          line-height: 1;
          font-weight: 600;
          letter-spacing: -1.5px;
          color: #ffffff;
        }

        .mini-progress {
          width: 100%;
          height: 4px;
          overflow: hidden;
          border-radius: 999px;
          background: #37373f;
        }

        .mini-progress-fill {
          height: 100%;
          width: 0%;
          border-radius: inherit;
          background: #6a5bfb;
          transition: width 1000ms linear;
        }

        .mini-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .mini-action {
          width: 34px;
          height: 34px;
          padding: 0;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #dedee4;
          background: #2b2b32;
          border: 1px solid #3b3b44;
          transition:
            background 120ms ease,
            border-color 120ms ease;
        }

        .mini-action:hover {
          background: #35353d;
          border-color: #484851;
        }

        .mini-action.primary {
          background: #6a5bfb;
          border-color: #6a5bfb;
          color: #ffffff;
        }

        .mini-action.primary:hover {
          background: #5b4ce6;
          border-color: #5b4ce6;
        }

        .mini-action.danger {
          background: #3a292b;
          border-color: #5a3337;
          color: #ff8d93;
        }

        .mini-action.danger:hover {
          background: #493034;
          border-color: #704045;
        }

        .mini-setup {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .mini-input {
          width: 68px;
          height: 34px;
          padding: 0 8px;
          text-align: center;
          border: 1px solid #3b3b44;
          border-radius: 8px;
          outline: none;
          background: #29292f;
          color: #ffffff;
          font-size: 14px;
        }

        .mini-input:focus {
          border-color: #6a5bfb;
          box-shadow: 0 0 0 2px rgba(106, 91, 251, 0.18);
        }

        .mini-input::-webkit-inner-spin-button,
        .mini-input::-webkit-outer-spin-button {
          margin: 0;
        }

        .mini-start {
          height: 34px;
          padding: 0 13px;
          border-radius: 8px;
          background: #6a5bfb;
          color: #ffffff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .mini-start:hover {
          background: #5b4ce6;
        }

        .hidden {
          display: none !important;
        }
      `;

      doc.head.appendChild(style);

      doc.body.innerHTML = `
        <div class="mini-container">

          <div class="mini-header">
            <div class="mini-title">
              <span class="mini-dot"></span>
              <span>Focus session</span>
            </div>

            <button
              id="mini-close"
              class="mini-close"
              type="button"
              aria-label="Close mini timer"
              title="Close"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            </button>
          </div>

          <div id="mini-time" class="mini-time">
            45:00
          </div>

          <div id="mini-progress" class="mini-progress hidden">
            <div
              id="mini-progress-fill"
              class="mini-progress-fill"
            ></div>
          </div>

          <div id="mini-setup" class="mini-setup">
            <input
              id="mini-minutes"
              class="mini-input"
              type="number"
              min="1"
              max="180"
              value="${focusMinutes}"
              aria-label="Focus minutes"
            />

            <button
              id="mini-start"
              class="mini-start"
              type="button"
            >
              Start
            </button>
          </div>

          <div id="mini-actions" class="mini-actions hidden">

            <button
              id="mini-main-action"
              class="mini-action primary"
              type="button"
              aria-label="Pause"
              title="Pause"
            ></button>

            <button
              id="mini-reset"
              class="mini-action danger hidden"
              type="button"
              aria-label="Reset"
              title="Reset"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 3-6.7"/>
                <path d="M3 4v5h5"/>
              </svg>
            </button>

            <button
              id="mini-visibility"
              class="mini-action"
              type="button"
              aria-label="Show time"
              title="Show time"
            ></button>

          </div>

        </div>
      `;

      const closeButton = doc.getElementById('mini-close');
      const startButton = doc.getElementById('mini-start');
      const minutesInput = doc.getElementById(
        'mini-minutes',
      ) as HTMLInputElement | null;

      closeButton?.addEventListener('click', () => {
        pipWindow.close();
      });

      startButton?.addEventListener('click', () => {
        const value = Number(minutesInput?.value ?? focusMinutes);

        if (!Number.isInteger(value)) {
          return;
        }

        const duration = Math.min(180, Math.max(1, value));

        if (minutesInput) {
          minutesInput.value = String(duration);
        }

        void handleStartFocus(duration);
      });

      pipWindow.addEventListener('pagehide', () => {
        if (miniWindowRef.current === pipWindow) {
          miniWindowRef.current = null;
        }
      });
    } catch (err) {
      console.warn('Unable to open mini timer:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to open the mini timer.',
      );
    }
  };

  /*
   * Keep the PiP UI synchronized with the existing timer.
   */
  useEffect(() => {
    const pipWindow = miniWindowRef.current;

    if (!pipWindow || pipWindow.closed) {
      return;
    }

    const doc = pipWindow.document;

    const timeElement = doc.getElementById('mini-time');
    const progressElement = doc.getElementById('mini-progress');
    const progressFill = doc.getElementById('mini-progress-fill');
    const setupElement = doc.getElementById('mini-setup');
    const actionsElement = doc.getElementById('mini-actions');
    const mainAction = doc.getElementById(
      'mini-main-action',
    ) as HTMLButtonElement | null;
    const resetButton = doc.getElementById(
      'mini-reset',
    ) as HTMLButtonElement | null;
    const visibilityButton = doc.getElementById(
      'mini-visibility',
    ) as HTMLButtonElement | null;
    const minutesInput = doc.getElementById(
      'mini-minutes',
    ) as HTMLInputElement | null;

    if (
      !timeElement ||
      !progressElement ||
      !progressFill ||
      !setupElement ||
      !actionsElement ||
      !mainAction ||
      !resetButton ||
      !visibilityButton
    ) {
      return;
    }

    /*
     * No active timer:
     * show the Focus Timer setup.
     */
    if (!activeTimer) {
      setupElement.classList.remove('hidden');
      actionsElement.classList.add('hidden');

      timeElement.classList.remove('hidden');
      progressElement.classList.add('hidden');

      timeElement.textContent = formatTime(focusMinutes * 60);

      if (minutesInput) {
        minutesInput.value = String(focusMinutes);
      }

      return;
    }

    /*
     * Active timer:
     * hide setup controls.
     */
    setupElement.classList.add('hidden');
    actionsElement.classList.remove('hidden');

    /*
     * Focus Timer.
     */
    if (activeTimer.type === 'FOCUS_TIMER') {
      const totalSeconds =
        activeTimer.durationSeconds ?? focusMinutes * 60;

      const progress =
        getFocusProgress(totalSeconds, displaySeconds) * 100;

      progressFill.style.width = `${progress}%`;

      /*
       * Time hidden by default.
       * Show progress bar instead.
       */
      if (!miniShowTimeRef.current) {
        timeElement.classList.add('hidden');
        progressElement.classList.remove('hidden');

        visibilityButton.setAttribute('aria-label', 'Show time');
        visibilityButton.setAttribute('title', 'Show time');

        visibilityButton.innerHTML = `
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/>
            <circle cx="12" cy="12" r="2.5"/>
          </svg>
        `;
      } else {
        timeElement.classList.remove('hidden');
        progressElement.classList.add('hidden');

        timeElement.textContent = formatTime(displaySeconds);

        visibilityButton.setAttribute('aria-label', 'Hide time');
        visibilityButton.setAttribute('title', 'Hide time');

        visibilityButton.innerHTML = `
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 3l18 18"/>
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
            <path d="M9.9 4.3A10.7 10.7 0 0 1 12 4c6 0 9.5 8 9.5 8a17.5 17.5 0 0 1-3.2 4.4"/>
            <path d="M6.6 6.6C3.8 8.4 2.5 12 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.6-.8"/>
          </svg>
        `;
      }

      /*
       * Eye button.
       */
      visibilityButton.onclick = () => {
        miniShowTimeRef.current = !miniShowTimeRef.current;

        /*
         * Force the current PiP UI to update immediately.
         */
        const nextShowTime = miniShowTimeRef.current;

        if (nextShowTime) {
          timeElement.classList.remove('hidden');
          progressElement.classList.add('hidden');
          timeElement.textContent = formatTime(displaySeconds);

          visibilityButton.setAttribute(
            'aria-label',
            'Hide time',
          );

          visibilityButton.setAttribute(
            'title',
            'Hide time',
          );

          visibilityButton.innerHTML = `
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 3l18 18"/>
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
              <path d="M9.9 4.3A10.7 10.7 0 0 1 12 4c6 0 9.5 8 9.5 8a17.5 17.5 0 0 1-3.2 4.4"/>
              <path d="M6.6 6.6C3.8 8.4 2.5 12 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.6-.8"/>
            </svg>
          `;
        } else {
          timeElement.classList.add('hidden');
          progressElement.classList.remove('hidden');

          visibilityButton.setAttribute(
            'aria-label',
            'Show time',
          );

          visibilityButton.setAttribute(
            'title',
            'Show time',
          );

          visibilityButton.innerHTML = `
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/>
              <circle cx="12" cy="12" r="2.5"/>
            </svg>
          `;
        }
      };
    } else {
      /*
       * Stopwatch always shows its elapsed time.
       * The eye control is not needed for Stopwatch.
       */
      timeElement.classList.remove('hidden');
      progressElement.classList.add('hidden');

      timeElement.textContent = formatTime(displaySeconds);

      visibilityButton.classList.add('hidden');
    }

    /*
     * Running / paused main action.
     */
    if (activeTimer.status === 'RUNNING') {
      mainAction.className = 'mini-action primary';

      mainAction.innerHTML = `
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <rect x="6" y="5" width="4" height="14" rx="1"/>
          <rect x="14" y="5" width="4" height="14" rx="1"/>
        </svg>
      `;

      mainAction.setAttribute('aria-label', 'Pause');
      mainAction.setAttribute('title', 'Pause');

      mainAction.onclick = () => {
        void handlePause();
      };

      resetButton.classList.add('hidden');
    } else {
      mainAction.className = 'mini-action primary';

      mainAction.innerHTML = `
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M8 5.5v13l10-6.5-10-6.5Z"/>
        </svg>
      `;

      mainAction.setAttribute('aria-label', 'Resume');
      mainAction.setAttribute('title', 'Resume');

      mainAction.onclick = () => {
        void handleResume();
      };

      resetButton.classList.remove('hidden');

      resetButton.onclick = () => {
        void handleCancel();
      };
    }
  }, [
    activeTimer,
    displaySeconds,
    focusMinutes,
    handlePause,
    handleResume,
    handleCancel,
  ]);

  const handleTabChange = (type: TimerType) => {
    if (activeTimer) return;

    setSelectedType(type);
    setShowTime(false);

    if (type === 'FOCUS_TIMER') {
      setDisplaySeconds(focusMinutes * 60);
    } else {
      setDisplaySeconds(0);
    }
  };

  const handleFocusMinutesChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = Number(event.target.value);

    if (!Number.isInteger(value)) return;

    setFocusMinutes(Math.min(180, Math.max(1, value)));
    setDisplaySeconds(Math.min(180, Math.max(1, value)) * 60);
  };

  const isFocus = selectedType === 'FOCUS_TIMER';
  const isRunning = activeTimer?.status === 'RUNNING';
  const isPaused = activeTimer?.status === 'PAUSED';

  if (loading) {
    return (
      <section className="h-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Loading timer...
        </p>
      </section>
    );
  }

  return (
    <section className="h-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      <div className="mb-7">
        <h2 className="text-xl font-semibold tracking-[-0.3px] text-[var(--color-text)]">
          Timer
        </h2>

        <p className="mt-1.5 text-base text-[var(--color-text-secondary)]">
          Track your focus and idle time.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex rounded-[var(--radius-md)] bg-[var(--color-background)] p-1.5 ring-1 ring-inset ring-[var(--color-border)]">
        <button
          type="button"
          disabled={Boolean(activeTimer)}
          onClick={() => handleTabChange('FOCUS_TIMER')}
          className={`flex-1 rounded-[var(--radius-sm)] px-4 py-2.5 text-base font-medium transition-all ${
            isFocus
              ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm ring-1 ring-inset ring-[var(--color-border)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          } disabled:cursor-not-allowed`}
        >
          Focus Timer
        </button>

        <button
          type="button"
          disabled={Boolean(activeTimer)}
          onClick={() => handleTabChange('STOPWATCH')}
          className={`flex-1 rounded-[var(--radius-sm)] px-4 py-2.5 text-base font-medium transition-all ${
            !isFocus
              ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm ring-1 ring-inset ring-[var(--color-border)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          } disabled:cursor-not-allowed`}
        >
          Stopwatch
        </button>
      </div>

      {/* Timer display */}
      <div className="flex min-h-44 md:min-h-64 flex-col items-center justify-center">
        <div className="text-6xl font-semibold tracking-[-0.04em] text-[var(--color-text)] sm:text-7xl">
          {isFocus && activeTimer?.status === 'RUNNING' && !showTime
            ? '••••••'
            : formatTime(displaySeconds)}
        </div>

        {isFocus && activeTimer?.status === 'RUNNING' && (
          <>
            <button
              type="button"
              onClick={() => setShowTime((value) => !value)}
              className="mt-4 text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              {showTime ? 'Hide Time' : 'Show Time'}
            </button>

            <div className="mt-7 flex w-full max-w-[520px] items-center gap-1.5">
              {Array.from({
                length: Math.ceil(
                  (activeTimer.durationSeconds ?? focusMinutes * 60) / 300,
                ),
              }).map((_, index, segments) => {
                const totalSeconds =
                  activeTimer.durationSeconds ?? focusMinutes * 60;

                const progress = getFocusProgress(
                  totalSeconds,
                  displaySeconds,
                );

                const segmentStart = index / segments.length;
                const segmentEnd = (index + 1) / segments.length;

                const fill =
                  progress >= segmentEnd
                    ? 100
                    : progress <= segmentStart
                      ? 0
                      : ((progress - segmentStart) /
                          (segmentEnd - segmentStart)) *
                        100;

                return (
                  <div
                    key={index}
                    className={`h-2.5 flex-1 overflow-hidden bg-[var(--color-surface-hover)] ${
                      index === 0
                        ? 'rounded-l-full'
                        : index === segments.length - 1
                          ? 'rounded-r-full'
                          : 'rounded-sm'
                    }`}
                  >
                    <div
                      className="h-full bg-[var(--color-primary)] transition-[width] duration-1000"
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Focus timer setup */}
      {!activeTimer && isFocus && (
        <div className="mx-auto mb-6 flex items-center justify-center gap-3">
          <label
            htmlFor="focus-minutes"
            className="text-base font-medium text-[var(--color-text-secondary)]"
          >
            Minutes
          </label>

          <input
            id="focus-minutes"
            type="number"
            min={1}
            max={180}
            value={focusMinutes}
            onChange={handleFocusMinutesChange}
            className="w-24 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-center text-base text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
          />

          <button
            type="button"
            onClick={() => void handleStartFocus()}
            disabled={actionLoading}
            className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        {!activeTimer && !isFocus && (
          <button
            type="button"
            onClick={handleStartStopwatch}
            disabled={actionLoading}
            className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start
          </button>
        )}

        {isRunning && (
          <button
            type="button"
            onClick={handlePause}
            disabled={actionLoading}
            className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pause
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            onClick={handleResume}
            disabled={actionLoading}
            className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Resume
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            onClick={handleSave}
            disabled={actionLoading}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-5 py-2.5 text-base font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        )}

        {activeTimer && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-5 py-2.5 text-base font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LuRotateCcw size={16} strokeWidth={1.8} />
            Reset
          </button>
        )}

        {/* Mini timer / Picture-in-Picture */}
        {activeTimer && (
          <button
            type="button"
            onClick={() => void handleOpenMiniTimer()}
            title={activeTimer ? 'Minimize timer' : 'Open timer'}
            aria-label={activeTimer ? 'Minimize timer' : 'Open timer'}
            className="hidden h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] sm:inline-flex"
          >
            <LuPictureInPicture size={17} strokeWidth={1.8} />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-5 text-center text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </section>
  );
}