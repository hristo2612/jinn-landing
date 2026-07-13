import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

import { setThemeImmediately, transitionTheme } from "../theme-transition";
import {
  captureSceneDom,
  resolveSceneTargets,
  restoreSceneDom,
  type SceneDomSnapshot,
} from "./scene-dom";
import { orderSceneBeatsByCommit, sceneBeatCommitAt } from "./scene-beat-order";
import { typingBoundaries } from "./scene-typing";
import { validateSceneDefinition } from "./scene-validator";
import type {
  ChatSceneState,
  SceneAction,
  SceneBeat,
  SceneDefinition,
  SceneEasing,
} from "./types";

gsap.registerPlugin(CustomEase);

type LedgerEase = ReturnType<typeof CustomEase.create>;

const EASINGS: Record<SceneEasing, LedgerEase> = {
  smooth: CustomEase.create("ledger-smooth", "0.4,0,0.2,1"),
  spring: CustomEase.create("ledger-spring", "0.34,1.56,0.64,1"),
  snappy: CustomEase.create("ledger-snappy", "0.2,0,0,1"),
};

const PAUSE_LABEL = "Pause animation";
const PLAY_LABEL = "Play animation";
const SECOND = 1000;

export type PauseReason =
  "api" | "user" | "visibility" | "offscreen" | "controller" | "ambient-yield";

export type ScenePlayerStatus =
  "waiting" | "playing" | "paused" | "completed" | "static" | "destroyed";

export type SceneStatusListener = (status: ScenePlayerStatus) => void;

export interface ScenePlayerOptions {
  /** Controllers opt out so the page-wide motion channel starts the player. */
  autoplay?: boolean;
  /** Registry required by swap(); controllers pass their page registry. */
  definitions?: ReadonlyMap<string, SceneDefinition<ChatSceneState>>;
  /** A controller-owned stable control can govern this player's lifecycle. */
  manageControl?: boolean;
  /** Opt in when a reduced controller rebuild must resolve its selected scene. */
  applyInitialStaticDom?: boolean;
  /** Staged controllers keep their shared static-first root undecorated at load. */
  decorateInitialStaticRoot?: boolean;
  /** Lets a controller serialize swaps with ambient beat-boundary yielding. */
  onSwapRequest?: (
    player: ScenePlayer,
    sceneId: string,
    commit: () => void,
  ) => boolean;
  /** Lets a managed control reclaim the page-wide channel before it resumes. */
  onUserPlay?: (player: ScenePlayer) => void;
}

export interface SceneDestroyOptions {
  /** Controller handoffs may preserve the resolved DOM for ambient capture. */
  restoreDom?: boolean;
}

function durationSeconds(beat: SceneBeat): number {
  return (beat.duration ?? 0) / SECOND;
}

function checkpointForTime<TState extends ChatSceneState>(
  definition: SceneDefinition<TState>,
  milliseconds: number,
): string {
  const resolved = definition.checkpoints.find(
    ({ name }) => name === "resolved",
  )!;
  const resetStartsAt =
    resolved.at +
    (definition.playback.mode === "loop"
      ? (definition.playback.dwellMs ?? 0) +
        (definition.playback.quietResetMs ?? 0) / 2
      : Number.POSITIVE_INFINITY);
  if (milliseconds >= resetStartsAt) return "initial";

  let current = "initial";
  for (const checkpoint of definition.checkpoints) {
    if (checkpoint.at <= milliseconds && checkpoint.at >= 0) {
      current = checkpoint.name;
    }
  }
  return current;
}

export class ScenePlayer<TState extends ChatSceneState = ChatSceneState> {
  readonly root: HTMLElement;

  private _definition!: SceneDefinition<TState>;
  private targets!: Map<string, HTMLElement>;
  private snapshots!: SceneDomSnapshot[];
  private frame!: HTMLElement;
  private readonly pauseReasons = new Set<PauseReason>();
  private reducedMotion = false;
  private readonly definitions: ReadonlyMap<
    string,
    SceneDefinition<ChatSceneState>
  >;
  private readonly retainedResolved = new Set<string>();
  private readonly manageControl: boolean;
  private readonly onSwapRequest: ScenePlayerOptions["onSwapRequest"];
  private readonly onUserPlay: ScenePlayerOptions["onUserPlay"];
  private timeline: gsap.core.Timeline | null = null;
  private control: HTMLButtonElement | null = null;
  private observer: IntersectionObserver | null = null;
  private startTimer: ReturnType<typeof setTimeout> | null = null;
  private startDelayRemaining = 0;
  private startDelayStartedAt = 0;
  private hasStarted = false;
  private completed = false;
  private staticTime = 0;
  private reconstructing = false;
  private destroyed = false;
  private readonly statusListeners = new Set<SceneStatusListener>();
  private lastStatus: ScenePlayerStatus | null = null;
  private yieldFrame: number | null = null;
  private restoreFrame: number | null = null;
  private yieldPromise: Promise<void> | null = null;
  private yieldResolve: (() => void) | null = null;
  private themeSnapshot: {
    theme: string | undefined;
    transition: string | undefined;
    target: string | undefined;
  } | null = null;

  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") this.pause("visibility");
    else this.resume("visibility");
  };

  private readonly onPageHide = (): void => this.destroy();

  constructor(
    root: HTMLElement,
    definition: SceneDefinition<TState>,
    options: ScenePlayerOptions = {},
  ) {
    this.root = root;
    this.definitions =
      options.definitions ??
      new Map<string, SceneDefinition<ChatSceneState>>([
        [definition.id, definition],
      ]);
    this.manageControl = options.manageControl !== false;
    this.onSwapRequest = options.onSwapRequest;
    this.onUserPlay = options.onUserPlay;
    const reasons = new Set<PauseReason>();
    if (options.autoplay === false) reasons.add("controller");
    this.initializeRuntime(
      definition,
      reasons,
      options.applyInitialStaticDom === true,
      options.decorateInitialStaticRoot !== false,
    );
  }

  get definition(): SceneDefinition<TState> {
    return this._definition;
  }

  private initializeRuntime(
    definition: SceneDefinition<TState>,
    initialPauseReasons: ReadonlySet<PauseReason>,
    applyStaticDom = true,
    decorateStaticRoot = true,
  ): void {
    this._definition = validateSceneDefinition(definition);
    this.targets = resolveSceneTargets(this.root, definition);
    this.frame =
      this.root.querySelector<HTMLElement>("[data-scene-frame]") ?? this.root;
    const ownsTheme =
      this.definition.initialState.theme !== undefined ||
      this.definition.beats.some(({ action }) => action.type === "theme");
    this.themeSnapshot = ownsTheme
      ? {
          theme: document.documentElement.dataset.theme,
          transition: document.documentElement.dataset.themeTransition,
          target: document.documentElement.dataset.themeTarget,
        }
      : null;
    const targetElements = new Set(this.targets.values());
    const highlightGroups = new Set(
      definition.beats
        .filter(({ action }) => action.type === "highlight")
        .map(({ target }) => target.split("-")[0]),
    );
    const highlightSiblings = Array.from(
      this.root.querySelectorAll<HTMLElement>("[data-target]"),
    ).filter((element) => {
      const group = element.dataset.target?.split("-")[0];
      return Boolean(
        group && highlightGroups.has(group) && !targetElements.has(element),
      );
    });
    this.snapshots = captureSceneDom(definition.targets, this.targets, [
      this.frame,
      ...highlightSiblings,
    ]);
    this.reducedMotion =
      document.documentElement.dataset.motion !== "ok" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.timeline = null;
    this.control = null;
    this.observer = null;
    this.startTimer = null;
    this.startDelayRemaining = 0;
    this.startDelayStartedAt = 0;
    this.hasStarted = false;
    this.completed = false;
    this.staticTime = 0;
    this.reconstructing = false;
    this.destroyed = false;
    this.lastStatus = null;
    this.pauseReasons.clear();
    for (const reason of initialPauseReasons) this.pauseReasons.add(reason);

    if (this.reducedMotion) {
      this.staticTime =
        definition.checkpoints.find(({ name }) => name === "resolved")?.at ?? 0;
      if (applyStaticDom) this.restoreInstantly(() => this.applyResolvedDom());
      if (decorateStaticRoot) {
        this.root.dataset.scenePlayerState = "static";
        this.root.dataset.sceneTimelineCount = "0";
        this.root.dataset.sceneCheckpoint = "resolved";
        this.root.dataset.sceneTime = String(this.staticTime);
        this.notifyStatus("static");
      }
      return;
    }

    this.primeInitialDom();
    this.timeline = this.compileTimeline();
    this.root.dataset.sceneTimelineCount = "1";
    this.mountControl();
    this.bindLifecycle();
    this.startDelayRemaining = definition.playback.startDelayMs ?? 0;
    if (this.pauseReasons.size > 0) {
      this.syncRuntimeState();
    } else if (this.startDelayRemaining > 0) this.scheduleStart();
    else this.play();
  }

  get currentTime(): number {
    return this.timeline
      ? Math.round(this.timeline.time() * SECOND)
      : this.staticTime;
  }

  get currentCheckpoint(): string {
    return checkpointForTime(this.definition, this.currentTime);
  }

  get isPlaying(): boolean {
    return Boolean(
      this.timeline &&
      this.hasStarted &&
      !this.completed &&
      !this.timeline.paused() &&
      !this.destroyed,
    );
  }

  get isCompleted(): boolean {
    return this.completed;
  }

  get status(): ScenePlayerStatus {
    if (this.destroyed) return "destroyed";
    if (this.reducedMotion) return "static";
    if (this.completed) return "completed";
    if (this.startTimer) return "waiting";
    return this.isPlaying ? "playing" : "paused";
  }

  onStatusChange(listener: SceneStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  play(): void {
    if (!this.timeline || this.destroyed) return;
    this.cancelScheduledStart();
    this.pauseReasons.clear();
    this.hasStarted = true;
    this.completed = false;
    this.startDelayRemaining = 0;
    this.timeline.play(0);
    this.syncRuntimeState();
  }

  pause(reason: PauseReason = "api"): void {
    if (!this.timeline || this.destroyed) return;
    this.pauseReasons.add(reason);
    this.pauseScheduledStart();
    this.timeline.pause();
    this.syncRuntimeState();
  }

  resume(reason: PauseReason = "api"): void {
    if (!this.timeline || this.destroyed) return;
    this.pauseReasons.delete(reason);
    if (this.pauseReasons.size === 0) {
      if (!this.hasStarted) this.scheduleStart();
      else this.timeline.resume();
    }
    this.syncRuntimeState();
  }

  restart(): void {
    if (!this.timeline || this.destroyed) return;
    this.cancelScheduledStart();
    this.pauseReasons.clear();
    this.primeInitialDom();
    this.hasStarted = true;
    this.completed = false;
    this.startDelayRemaining = 0;
    this.timeline.restart();
    this.syncRuntimeState();
  }

  seek(milliseconds: number): void {
    if (!this.timeline || this.destroyed) return;
    const clamped = Math.max(
      0,
      Math.min(milliseconds, this.timeline.duration() * SECOND),
    );
    const wasPlaying = this.isPlaying;
    this.cancelScheduledStart();
    this.hasStarted = true;
    this.completed = false;
    this.timeline.pause(0, true);
    this.restoreInstantly(() => {
      restoreSceneDom(this.snapshots);
      this.restoreThemeSnapshot();
      this.primeInitialDom();
      this.timeline!.invalidate();
      this.reconstructing = true;
      if (clamped > 0) this.timeline!.time(clamped / SECOND, false);
      this.reconstructing = false;
    });
    this.completed =
      this.definition.playback.mode === "once" && clamped >= this.resolvedAt();
    if (wasPlaying) this.timeline.resume();
    else this.timeline.pause();
    this.syncRuntimeState();
  }

  enter(): void {
    if (!this.timeline || this.destroyed) return;
    if (
      this.definition.playback.entry === "restart-on-enter" &&
      this.hasStarted
    ) {
      this.seek(0);
    }
    this.resume("controller");
  }

  yieldAtBeatBoundary(): Promise<void> {
    if (!this.timeline || this.destroyed) {
      return Promise.resolve();
    }
    if (this.yieldPromise) return this.yieldPromise;

    const now = this.currentTime;
    const boundary = this.definition.beats.reduce((latest, beat) => {
      const end = beat.at + (beat.duration ?? 0);
      return beat.at <= now && now < end ? Math.max(latest, end) : latest;
    }, now);
    if (boundary <= now) {
      this.pause("ambient-yield");
      return Promise.resolve();
    }

    const deadline = performance.now() + 500;
    this.yieldPromise = new Promise<void>((resolve) => {
      this.yieldResolve = resolve;
    });
    const finish = (): void => {
      this.yieldFrame = null;
      if (this.destroyed || !this.timeline) {
        this.finishYield();
        return;
      }
      if (this.currentTime >= boundary) {
        this.timeline.time(boundary / SECOND, false);
        this.pause("ambient-yield");
        this.finishYield();
        return;
      }
      if (performance.now() >= deadline) {
        this.seek(boundary);
        this.pause("ambient-yield");
        this.finishYield();
        return;
      }
      this.yieldFrame = requestAnimationFrame(finish);
    };
    this.yieldFrame = requestAnimationFrame(finish);
    return this.yieldPromise;
  }

  cancelBeatBoundaryYield(): void {
    if (this.yieldFrame !== null) cancelAnimationFrame(this.yieldFrame);
    this.yieldFrame = null;
    this.resume("ambient-yield");
    this.finishYield();
  }

  swap(sceneId: string): void {
    if (this.destroyed || sceneId === this.definition.id) return;
    const next = this.validateSwapDestination(sceneId);
    const commit = (): void => this.commitSwap(next);
    if (this.onSwapRequest?.(this, sceneId, commit)) return;
    commit();
  }

  private validateSwapDestination(sceneId: string): SceneDefinition<TState> {
    const next = this.definitions.get(sceneId) as
      SceneDefinition<TState> | undefined;
    if (!next) {
      throw new Error(
        'ScenePlayer: swap target "' + sceneId + '" is not registered',
      );
    }

    validateSceneDefinition(next);
    resolveSceneTargets(this.root, next);
    if (
      this.manageControl &&
      next.playback.mode === "loop" &&
      !this.root.querySelector("[data-scene-controls]")
    ) {
      throw new Error(
        'Scene "' +
          next.id +
          '": looping scenes require [data-scene-controls] inside their scene root',
      );
    }
    return next;
  }

  private commitSwap(next: SceneDefinition<TState>): void {
    const paneSelection = this.capturePaneSelection();
    if (
      this.completed &&
      this.definition.playback.mode === "once" &&
      this.definition.playback.entry === "play"
    ) {
      this.retainedResolved.add(this.definition.id);
    }
    const preservedReasons = new Set(
      Array.from(this.pauseReasons).filter(
        (reason) => reason !== "ambient-yield",
      ),
    );
    this.teardownRuntime(true);
    this.initializeRuntime(next, preservedReasons);

    if (
      next.playback.mode === "once" &&
      next.playback.entry === "play" &&
      this.retainedResolved.has(next.id)
    ) {
      this.seek(this.resolvedAt());
    }
    this.restorePaneSelection(paneSelection);
  }

  private capturePaneSelection(): Map<HTMLElement, boolean> {
    return new Map(
      Array.from(
        this.root.querySelectorAll<HTMLElement>(
          '[data-target^="pane-"], [data-target^="ribbon-"]',
        ),
      ).map((element) => [element, element.hasAttribute("data-active")]),
    );
  }

  private restorePaneSelection(
    selection: ReadonlyMap<HTMLElement, boolean>,
  ): void {
    for (const [element, active] of selection) {
      element.toggleAttribute("data-active", active);
    }
  }

  destroy(options: SceneDestroyOptions = {}): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.notifyStatus("destroyed");
    this.teardownRuntime(options.restoreDom !== false);
    this.statusListeners.clear();
  }

  private teardownRuntime(restoreDom: boolean): void {
    this.cancelScheduledStart();
    if (this.yieldFrame !== null) cancelAnimationFrame(this.yieldFrame);
    this.yieldFrame = null;
    this.finishYield();
    this.observer?.disconnect();
    this.observer = null;
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("pagehide", this.onPageHide);
    this.control?.remove();
    this.control = null;
    this.timeline?.kill();
    this.timeline = null;
    if (restoreDom) this.restoreDomSnapshot();
    delete this.root.dataset.scenePlayerState;
    delete this.root.dataset.sceneTimelineCount;
    delete this.root.dataset.sceneCheckpoint;
    delete this.root.dataset.sceneTime;
  }

  restoreDomSnapshot(): void {
    this.restoreInstantly(() => {
      restoreSceneDom(this.snapshots);
      this.restoreThemeSnapshot();
    });
  }

  private restoreInstantly(restore: () => void): void {
    this.root.dataset.sceneRestoring = "";
    restore();
    // Commit the restored values while authored transitions are suppressed so
    // removing the marker cannot interpolate from the pre-restore frame.
    void this.root.offsetWidth;
    if (this.restoreFrame !== null) cancelAnimationFrame(this.restoreFrame);
    this.restoreFrame = requestAnimationFrame(() => {
      this.restoreFrame = null;
      delete this.root.dataset.sceneRestoring;
    });
  }

  private bindLifecycle(): void {
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("pagehide", this.onPageHide, { once: true });
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) this.resume("offscreen");
        else this.pause("offscreen");
      },
      { threshold: 0.05 },
    );
    this.observer.observe(this.root);
    if (document.visibilityState === "hidden") this.pause("visibility");
  }

  private mountControl(): void {
    if (!this.manageControl) return;
    if (this.definition.playback.mode !== "loop") return;
    const slot = this.root.querySelector<HTMLElement>("[data-scene-controls]");
    if (!slot) {
      throw new Error(
        `Scene "${this.definition.id}": looping scenes require [data-scene-controls] inside their scene root`,
      );
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "scene-playback-control";
    button.dataset.scenePlaybackControl = "";
    button.innerHTML = `
      <span class="scene-playback-control__icon scene-playback-control__icon--pause" aria-hidden="true"><i></i><i></i></span>
      <span class="scene-playback-control__icon scene-playback-control__icon--play" aria-hidden="true"></span>
    `;
    button.addEventListener("click", () => {
      if (this.pauseReasons.has("user")) {
        this.onUserPlay?.(this);
        this.resume("user");
      } else this.pause("user");
    });
    slot.append(button);
    this.control = button;
    this.syncControl();
  }

  private compileTimeline(): gsap.core.Timeline {
    const timeline = gsap.timeline({
      paused: true,
      onUpdate: () => this.syncRuntimeState(),
      onRepeat: () => {
        this.completed = false;
        this.syncRuntimeState();
      },
      onComplete: () => {
        if (this.definition.playback.mode === "once") this.completed = true;
        this.syncRuntimeState();
      },
    });

    for (const beat of this.definition.beats) this.compileBeat(timeline, beat);

    const resolvedAt = this.resolvedAt();
    timeline.set({}, {}, resolvedAt / SECOND);
    if (this.definition.playback.mode === "loop") {
      const dwellMs = this.definition.playback.dwellMs ?? 0;
      const resetMs = this.definition.playback.quietResetMs ?? 0;
      const resetAt = (resolvedAt + dwellMs) / SECOND;
      const halfReset = resetMs / SECOND / 2;
      timeline.to(
        this.frame,
        { autoAlpha: 0, duration: halfReset, ease: EASINGS.smooth },
        resetAt,
      );
      timeline.call(() => this.primeInitialDom(), [], resetAt + halfReset);
      timeline.to(
        this.frame,
        { autoAlpha: 1, duration: halfReset, ease: EASINGS.smooth },
        resetAt + halfReset,
      );
      timeline.repeat(-1);
    }

    return timeline;
  }

  private compileBeat(timeline: gsap.core.Timeline, beat: SceneBeat): void {
    const target = this.targets.get(beat.target)!;
    const at = beat.at / SECOND;
    const duration = durationSeconds(beat);
    const ease = EASINGS[beat.easing];

    switch (beat.action.type) {
      case "type-text":
        this.compileTypeText(timeline, target, beat.action.text, at, duration);
        return;
      case "replace-text":
        this.compileReplaceText(
          timeline,
          target,
          beat.action.text,
          at,
          duration,
          ease,
        );
        return;
      case "enter":
        timeline.call(() => target.removeAttribute("hidden"), [], at);
        timeline.fromTo(
          target,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration, ease },
          at,
        );
        return;
      case "exit":
        this.compileExit(timeline, target, beat.action, at, duration, ease);
        return;
      case "set-state": {
        const nextState = beat.action.to;
        timeline.call(
          () => {
            target.dataset.state = nextState;
          },
          [],
          sceneBeatCommitAt(beat) / SECOND,
        );
        return;
      }
      case "set-progress": {
        const progressValue = beat.action.value;
        timeline.to(
          target,
          {
            "--scene-progress": progressValue,
            duration,
            ease,
          },
          at,
        );
        timeline.call(
          () => {
            target.dataset.progress = String(progressValue);
          },
          [],
          sceneBeatCommitAt(beat) / SECOND,
        );
        return;
      }
      case "highlight":
        timeline.call(() => this.highlightTarget(target), [], at);
        timeline.fromTo(
          target,
          { autoAlpha: 0.82, y: beat.target.startsWith("pane-") ? 12 : 0 },
          { autoAlpha: 1, y: 0, duration, ease },
          at,
        );
        return;
      case "pulse": {
        const halfCycle = duration / beat.action.cycles / 2;
        for (let cycle = 0; cycle < beat.action.cycles; cycle += 1) {
          const cycleAt = at + cycle * halfCycle * 2;
          timeline.to(
            target,
            { scale: 1.02, duration: halfCycle, ease },
            cycleAt,
          );
          timeline.to(
            target,
            { scale: 1, duration: halfCycle, ease: EASINGS.smooth },
            cycleAt + halfCycle,
          );
        }
        return;
      }
      case "theme": {
        const theme = beat.action.theme;
        timeline.call(
          () => {
            if (this.reconstructing) this.applyThemeImmediately(theme);
            else void transitionTheme(theme);
          },
          [],
          at,
        );
        return;
      }
    }
  }

  private compileTypeText(
    timeline: gsap.core.Timeline,
    target: HTMLElement,
    text: string,
    at: number,
    duration: number,
  ): void {
    const cursor = { progress: 0 };
    const boundaries = typingBoundaries(text);
    timeline.set(cursor, { progress: 0 }, at);
    timeline.to(
      cursor,
      {
        progress: 1,
        duration,
        ease: "none",
        onStart: () => {
          target.textContent = "";
        },
        onUpdate: () => {
          let length = 0;
          while (
            length < boundaries.length &&
            boundaries[length] <= cursor.progress
          ) {
            length += 1;
          }
          target.textContent = text.slice(0, length);
        },
      },
      at,
    );
  }

  private compileReplaceText(
    timeline: gsap.core.Timeline,
    target: HTMLElement,
    text: string,
    at: number,
    duration: number,
    ease: LedgerEase,
  ): void {
    const half = duration / 2;
    timeline.to(target, { autoAlpha: 0, duration: half, ease }, at);
    timeline.call(
      () => {
        target.textContent = text;
      },
      [],
      at + half,
    );
    timeline.to(target, { autoAlpha: 1, duration: half, ease }, at + half);
  }

  private compileExit(
    timeline: gsap.core.Timeline,
    target: HTMLElement,
    _action: Extract<SceneAction, { type: "exit" }>,
    at: number,
    duration: number,
    ease: LedgerEase,
  ): void {
    const originalText = this.snapshots.find(
      (snapshot) => snapshot.element === target,
    )?.textContent;
    timeline.to(target, { autoAlpha: 0, y: -6, duration, ease }, at);
    timeline.call(
      () => {
        if (originalText !== undefined) {
          target.textContent = originalText;
          gsap.set(target, { autoAlpha: 1, y: 0 });
        } else {
          target.setAttribute("hidden", "");
          gsap.set(target, { y: 0 });
        }
      },
      [],
      at + duration,
    );
  }

  private highlightTarget(target: HTMLElement): void {
    const targetId = target.dataset.target ?? "";
    const group = targetId.split("-")[0];
    for (const candidate of this.root.querySelectorAll<HTMLElement>(
      `[data-target^="${group}-"][data-active]`,
    )) {
      candidate.removeAttribute("data-active");
    }
    target.setAttribute("data-active", "");
  }

  private applyResolvedDom(): void {
    const entering = new Set(
      this.definition.beats
        .filter(({ action }) => action.type === "enter")
        .map(({ target }) => target),
    );
    const exiting = new Set(
      this.definition.beats
        .filter(({ action }) => action.type === "exit")
        .map(({ target }) => target),
    );
    for (const targetId of exiting) {
      if (!entering.has(targetId)) {
        this.targets.get(targetId)!.removeAttribute("hidden");
      }
    }
    for (const targetId of entering) {
      this.targets.get(targetId)!.setAttribute("hidden", "");
    }
    for (const target of this.definition.targets) {
      const element = this.targets.get(target.id)!;
      if (target.kind === "state") {
        element.dataset.state = target.initialState!;
      }
      const progress = this.definition.initialState.progress?.[target.id];
      if (target.kind === "progress" && progress !== undefined) {
        element.dataset.progress = String(progress);
        element.style.setProperty("--scene-progress", String(progress));
      }
    }
    if (this.definition.initialState.theme) {
      this.applyThemeImmediately(this.definition.initialState.theme);
    }

    const resolvedAt = this.resolvedAt();
    for (const { beat } of orderSceneBeatsByCommit(this.definition.beats)) {
      if (sceneBeatCommitAt(beat) > resolvedAt) continue;
      const target = this.targets.get(beat.target)!;
      switch (beat.action.type) {
        case "type-text":
        case "replace-text":
          target.textContent = beat.action.text;
          break;
        case "enter":
          target.removeAttribute("hidden");
          break;
        case "exit":
          target.setAttribute("hidden", "");
          break;
        case "set-state":
          target.dataset.state = beat.action.to;
          break;
        case "set-progress":
          target.dataset.progress = String(beat.action.value);
          target.style.setProperty(
            "--scene-progress",
            String(beat.action.value),
          );
          break;
        case "highlight":
          this.highlightTarget(target);
          break;
        case "theme":
          this.applyThemeImmediately(beat.action.theme);
          break;
        case "pulse":
          break;
      }
    }
  }

  private primeInitialDom(): void {
    for (const snapshot of this.snapshots) {
      if (snapshot.element === this.frame) continue;
      for (const [attribute, value] of snapshot.attributes) {
        if (attribute === "style") continue;
        if (value === null) snapshot.element.removeAttribute(attribute);
        else snapshot.element.setAttribute(attribute, value);
      }
      if (snapshot.textContent !== undefined) {
        snapshot.element.textContent = snapshot.textContent;
      }
    }

    const entering = new Set(
      this.definition.beats
        .filter(({ action }) => action.type === "enter")
        .map(({ target }) => target),
    );
    const exiting = new Set(
      this.definition.beats
        .filter(({ action }) => action.type === "exit")
        .map(({ target }) => target),
    );
    for (const targetId of exiting) {
      if (entering.has(targetId)) continue;
      const target = this.targets.get(targetId)!;
      target.removeAttribute("hidden");
      gsap.set(target, { autoAlpha: 1, y: 0 });
    }
    for (const targetId of entering) {
      const target = this.targets.get(targetId)!;
      target.setAttribute("hidden", "");
      gsap.set(target, { autoAlpha: 0, y: 12 });
    }

    for (const target of this.definition.targets) {
      const element = this.targets.get(target.id)!;
      if (target.kind === "state") {
        element.dataset.state = target.initialState!;
      }
      const progress = this.definition.initialState.progress?.[target.id];
      if (target.kind === "progress" && progress !== undefined) {
        element.dataset.progress = String(progress);
        element.style.setProperty("--scene-progress", String(progress));
      }
    }

    if (this.definition.initialState.theme) {
      this.applyThemeImmediately(this.definition.initialState.theme);
    }
  }

  private scheduleStart(): void {
    if (
      !this.timeline ||
      this.destroyed ||
      this.hasStarted ||
      this.pauseReasons.size > 0
    ) {
      this.syncRuntimeState();
      return;
    }
    if (this.startDelayRemaining <= 0) {
      this.hasStarted = true;
      this.timeline.play(0);
      this.syncRuntimeState();
      return;
    }
    this.startDelayStartedAt = performance.now();
    this.startTimer = setTimeout(() => {
      this.startTimer = null;
      this.startDelayRemaining = 0;
      if (this.destroyed || this.pauseReasons.size > 0 || !this.timeline)
        return;
      this.hasStarted = true;
      this.timeline.play(0);
      this.syncRuntimeState();
    }, this.startDelayRemaining);
    this.syncRuntimeState();
  }

  private pauseScheduledStart(): void {
    if (!this.startTimer) return;
    const elapsed = performance.now() - this.startDelayStartedAt;
    this.startDelayRemaining = Math.max(0, this.startDelayRemaining - elapsed);
    this.cancelScheduledStart();
  }

  private cancelScheduledStart(): void {
    if (this.startTimer) clearTimeout(this.startTimer);
    this.startTimer = null;
  }

  private finishYield(): void {
    const resolve = this.yieldResolve;
    this.yieldResolve = null;
    this.yieldPromise = null;
    resolve?.();
  }

  private applyThemeImmediately(theme: "dark" | "light"): void {
    setThemeImmediately(theme);
  }

  private restoreThemeSnapshot(): void {
    if (!this.themeSnapshot) return;
    const root = document.documentElement;
    if (
      this.themeSnapshot.theme === "dark" ||
      this.themeSnapshot.theme === "light"
    ) {
      setThemeImmediately(this.themeSnapshot.theme);
    }
    const restore = (
      key: "theme" | "themeTransition" | "themeTarget",
      value: string | undefined,
    ) => {
      if (value === undefined) delete root.dataset[key];
      else root.dataset[key] = value;
    };
    restore("theme", this.themeSnapshot.theme);
    restore("themeTransition", this.themeSnapshot.transition);
    restore("themeTarget", this.themeSnapshot.target);
  }

  private syncRuntimeState(): void {
    if (this.destroyed || !this.timeline) return;
    this.root.dataset.sceneTime = String(this.currentTime);
    this.root.dataset.sceneCheckpoint = this.currentCheckpoint;
    const status = this.status;
    this.root.dataset.scenePlayerState = status;
    this.notifyStatus(status);
    this.syncControl();
  }

  private syncControl(): void {
    if (!this.control) return;
    const playing = this.isPlaying || Boolean(this.startTimer);
    this.control.setAttribute("aria-label", playing ? PAUSE_LABEL : PLAY_LABEL);
    this.control.dataset.state = playing ? "playing" : "paused";
  }

  private resolvedAt(): number {
    return (
      this.definition.checkpoints.find(({ name }) => name === "resolved")?.at ??
      0
    );
  }

  private notifyStatus(status: ScenePlayerStatus): void {
    if (status === this.lastStatus) return;
    this.lastStatus = status;
    for (const listener of this.statusListeners) listener(status);
  }
}
