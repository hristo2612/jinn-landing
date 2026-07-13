import { ScenePlayer } from "./scene-player";
import { resolveSceneEndState } from "./scene-reducer";
import { SceneMotionChannel } from "./scene-motion-channel";
import { validateSceneRegistry } from "./scene-validator";
import type { ChatSceneState, PaneKey, SceneDefinition } from "./types";

const DESKTOP_QUERY = "(min-width: 900px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const ROOT_VISIBILITY_THRESHOLD = 0.01;
const PAUSE_LABEL = "Pause animation";
const PLAY_LABEL = "Play animation";

type ControllerMode = "desktop" | "mobile" | "reduced";

interface TriggerHandle {
  kill(revert?: boolean): void;
}

interface StageRegistration {
  id: string;
  stage: HTMLElement;
  mobileWindow: HTMLElement | null;
}

interface StageNavigation {
  id: string | null;
  targetY: number;
  settled: boolean;
}

export class SceneController {
  readonly root: HTMLElement;

  private readonly definitions: ReadonlyMap<
    string,
    SceneDefinition<ChatSceneState>
  >;
  private readonly desktopQuery = window.matchMedia(DESKTOP_QUERY);
  private readonly reducedQuery = window.matchMedia(REDUCED_QUERY);
  private readonly stages: StageRegistration[];
  private readonly sharedWindow: HTMLElement | null;
  private readonly players = new Map<HTMLElement, ScenePlayer>();
  private readonly resolvedStates = new Map<string, ChatSceneState>();
  private readonly motionChannel: SceneMotionChannel;
  private readonly managesPlaybackControl: boolean;
  private readonly ambientByHost = new Map<
    string,
    SceneDefinition<ChatSceneState>
  >();
  private triggers: TriggerHandle[] = [];
  private mobileObserver: IntersectionObserver | null = null;
  private rootObserver: IntersectionObserver | null = null;
  private readonly mobileVisibility = new Map<string, number>();
  private activePlayer: ScenePlayer | null = null;
  private activeSceneId: string | null = null;
  private mode: ControllerMode = "mobile";
  private generation = 0;
  private ignoreObserverUntil = 0;
  private destroyed = false;
  private debugCleanup: (() => void) | null = null;
  private pendingSceneId: string | null = null;
  private activationFrame: number | null = null;
  private navigation: StageNavigation | null = null;
  private navigationFrame: number | null = null;
  private ambientTimer: ReturnType<typeof setTimeout> | null = null;
  private ambientRemaining = 0;
  private ambientStartedAt = 0;
  private ambientPending: {
    host: ScenePlayer;
    definition: SceneDefinition<ChatSceneState>;
  } | null = null;
  private ambientHostPlayer: ScenePlayer | null = null;
  private pendingAmbientActivation: { id: string; seekTo: number } | null =
    null;
  private pendingAmbientSwap: {
    player: ScenePlayer;
    commit: () => void;
  } | null = null;
  private ambientYield: Promise<void> | null = null;
  private rootVisible = false;
  private userPaused = false;
  private playbackControl: HTMLButtonElement | null = null;
  private removeOwnerListener: (() => void) | null = null;
  private releaseRootVisibility: (() => void) | null = null;
  private releaseScrollScheduler: (() => void) | null = null;

  private readonly onNavigationScroll = (): void => {
    if (this.navigationFrame !== null) return;
    this.navigationFrame = requestAnimationFrame(() => {
      this.navigationFrame = null;
      this.completeNavigationIfSettled();
    });
  };

  private readonly onNavigationScrollEnd = (): void => {
    this.completeNavigationIfSettled();
  };

  private readonly onManualScrollIntent = (event: Event): void => {
    if (
      event instanceof KeyboardEvent &&
      ![
        "ArrowDown",
        "ArrowUp",
        "End",
        "Home",
        "PageDown",
        "PageUp",
        " ",
      ].includes(event.key)
    ) {
      return;
    }
    this.cancelNavigation(true);
  };

  private readonly onMediaChange = (): void => {
    void this.rebuild(true);
  };

  private readonly onVisibilityChange = (): void => {
    this.motionChannel.refreshIdleState();
    this.syncAmbientSchedule();
  };

  private readonly onPlaybackControlClick = (): void => {
    this.userPaused = !this.userPaused;
    if (this.userPaused) this.activePlayer?.pause("user");
    else {
      if (this.activePlayer) {
        this.motionChannel.claimForUserPlayback(this.activePlayer);
      }
      this.activePlayer?.resume("user");
    }
    this.syncPlaybackControl();
    this.syncAmbientSchedule();
  };

  private readonly onPageHide = (): void => this.destroy();

  constructor(
    root: HTMLElement,
    definitions: ReadonlyMap<string, SceneDefinition<ChatSceneState>>,
    motionChannel = new SceneMotionChannel(),
  ) {
    this.root = root;
    this.definitions = definitions;
    this.motionChannel = motionChannel;
    validateSceneRegistry(definitions);
    for (const definition of definitions.values()) {
      if (!definition.ambient) continue;
      this.ambientByHost.set(definition.ambient.follows, definition);
    }
    this.sharedWindow = root.matches("[data-scene-window]")
      ? root
      : root.querySelector<HTMLElement>("[data-scene-shared-window]");
    this.stages = Array.from(
      root.querySelectorAll<HTMLElement>("[data-scene-stage][data-scene-id]"),
    ).map((stage) => ({
      id: stage.dataset.sceneId!,
      stage,
      mobileWindow: stage.querySelector<HTMLElement>(
        "[data-scene-mobile-window]",
      ),
    }));
    const controlledIds = new Set(
      this.stages.length > 0
        ? this.stages.map(({ id }) => id)
        : [this.sharedWindow?.dataset.sceneId].filter((id): id is string =>
            Boolean(id),
          ),
    );
    this.managesPlaybackControl = Array.from(this.ambientByHost.keys()).some(
      (hostId) => controlledIds.has(hostId),
    );
  }

  async start(): Promise<void> {
    if (this.destroyed) return;
    this.rootVisible = this.isRootInViewport();
    this.releaseRootVisibility = this.motionChannel.registerSceneRoot(
      this.root,
      this.rootVisible,
    );
    this.desktopQuery.addEventListener("change", this.onMediaChange);
    this.reducedQuery.addEventListener("change", this.onMediaChange);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    this.removeOwnerListener = this.motionChannel.onOwnerChange(() =>
      this.syncAmbientSchedule(),
    );
    window.addEventListener("pagehide", this.onPageHide, { once: true });
    await this.rebuild(false);
    this.bindRootVisibility();

    if (import.meta.env.DEV) {
      const { mountSceneDebugOverlay } = await import("./scene-debug");
      if (!this.destroyed) {
        this.debugCleanup = mountSceneDebugOverlay(this);
      }
    }
  }

  getActivePlayer(): ScenePlayer | null {
    return this.activePlayer;
  }

  getPlayerForRoot(root: HTMLElement): ScenePlayer | null {
    return this.players.get(root) ?? null;
  }

  getSceneState(sceneId: string): ChatSceneState | null {
    const state = this.resolvedStates.get(sceneId);
    return state ? structuredClone(state) : null;
  }

  navigateToStage(paneKey: PaneKey): void {
    if (
      this.destroyed ||
      this.mode !== "desktop" ||
      this.stages.length < 2 ||
      !this.root.querySelector("[data-scene-pin]")
    )
      return;
    const registration = this.stages.find(({ id }) => {
      const pane = this.definitions.get(id)?.initialState.pane;
      return pane !== "none" && pane === paneKey;
    });
    const abovePinnedRange = paneKey === "chat" && !registration;
    if (
      (!registration && !abovePinnedRange) ||
      (registration && !this.definitions.has(registration.id))
    ) {
      throw new Error(
        `SceneController: pane "${paneKey}" has no registered desktop stage`,
      );
    }

    const targetY = registration
      ? Math.max(
          0,
          Math.min(
            Math.max(
              0,
              document.documentElement.scrollHeight - window.innerHeight,
            ),
            registration.stage.getBoundingClientRect().top +
              window.scrollY -
              window.innerHeight / 2,
          ),
        )
      : 0;
    if (
      registration &&
      this.activeSceneId === registration.id &&
      Math.abs(window.scrollY - targetY) <= 2
    ) {
      return;
    }

    this.cancelNavigation(false);
    this.navigation = { id: registration?.id ?? null, targetY, settled: false };
    this.bindNavigationIntent();
    window.scrollTo({ top: targetY, behavior: "smooth" });
    this.completeNavigationIfSettled();
  }

  activate(sceneId: string, seekTo = 0): void {
    if (this.destroyed || this.mode === "reduced") return;
    this.cancelAmbientSchedule();
    if (
      this.activePlayer &&
      this.motionChannel.isAmbientOccupant(this.activePlayer)
    ) {
      this.pendingAmbientActivation = { id: sceneId, seekTo };
      this.beginAmbientYield(this.activePlayer);
      return;
    }
    this.activateImmediately(sceneId, seekTo);
  }

  private activateImmediately(
    sceneId: string,
    seekTo = 0,
    replaceOutgoing: ScenePlayer | null = null,
  ): void {
    const definition = this.definitions.get(sceneId);
    const playerRoot = this.windowFor(sceneId);
    if (!definition || !playerRoot) {
      throw new Error(
        `SceneController: scene "${sceneId}" has no registered definition/window for ${this.mode} mode`,
      );
    }

    if (
      this.activeSceneId === sceneId &&
      this.activePlayer?.definition.id === sceneId &&
      this.activePlayer?.root === playerRoot
    ) {
      this.placePlaybackControl(playerRoot);
      if (this.userPaused) this.activePlayer.pause("user");
      if (this.rootVisible) this.motionChannel.claim(this.activePlayer, false);
      if (this.activePlayer.isCompleted) {
        this.scheduleAmbient(this.activePlayer);
      }
      return;
    }

    if (this.activePlayer) {
      if (this.activePlayer.root === playerRoot) {
        this.recordCompletedState(this.activePlayer);
        this.motionChannel.release(this.activePlayer);
        this.unregisterPlayer(this.activePlayer);
        this.activePlayer.destroy();
      } else {
        this.motionChannel.release(this.activePlayer);
      }
    }

    let player = this.players.get(playerRoot);
    if (player && player.definition.id !== sceneId) {
      this.recordCompletedState(player);
      this.motionChannel.release(player);
      this.unregisterPlayer(player);
      player.destroy();
      player = undefined;
    }
    if (!player) {
      const createdPlayer = new ScenePlayer(playerRoot, definition, {
        autoplay: false,
        definitions: this.definitions,
        manageControl: !this.managesPlaybackControl,
        onUserPlay: (candidate) =>
          this.motionChannel.claimForUserPlayback(candidate),
        onSwapRequest: (candidate, sceneId, commit) =>
          this.handlePlayerSwap(candidate, sceneId, commit),
      });
      createdPlayer.onStatusChange((status) => {
        this.syncPlaybackControl();
        this.syncAmbientSchedule();
        if (status === "completed") {
          this.recordCompletedState(createdPlayer);
          this.scheduleAmbient(createdPlayer);
        }
      });
      player = createdPlayer;
      this.registerPlayer(createdPlayer);
      const count = Number(playerRoot.dataset.sceneActivationCount ?? 0) + 1;
      playerRoot.dataset.sceneActivationCount = String(count);
    } else {
      player.enter();
    }

    const recordedResolved =
      definition.playback.entry === "play" && this.resolvedStates.has(sceneId)
        ? (definition.checkpoints.find(({ name }) => name === "resolved")?.at ??
          0)
        : 0;
    const targetTime = seekTo > 0 ? seekTo : recordedResolved;
    if (targetTime > 0) player.seek(targetTime);
    this.activePlayer = player;
    this.activeSceneId = sceneId;
    this.root.dataset.activeScene = sceneId;
    this.placePlaybackControl(playerRoot);
    if (this.userPaused) player.pause("user");
    if (this.rootVisible) {
      if (replaceOutgoing) this.motionChannel.replace(replaceOutgoing, player);
      else this.motionChannel.claim(player, false);
    }
    if (player.isCompleted) this.scheduleAmbient(player);
  }

  private isRootInViewport(): boolean {
    const rect = this.root.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const visibleWidth = Math.max(
      0,
      Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0),
    );
    const visibleHeight = Math.max(
      0,
      Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0),
    );
    return (
      (visibleWidth * visibleHeight) / (rect.width * rect.height) >=
      ROOT_VISIBILITY_THRESHOLD
    );
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cleanupBindings();
    this.rootObserver?.disconnect();
    this.rootObserver = null;
    this.releaseRootVisibility?.();
    this.releaseRootVisibility = null;
    this.destroyPlayers();
    this.debugCleanup?.();
    this.debugCleanup = null;
    this.desktopQuery.removeEventListener("change", this.onMediaChange);
    this.reducedQuery.removeEventListener("change", this.onMediaChange);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.removeOwnerListener?.();
    this.removeOwnerListener = null;
    window.removeEventListener("pagehide", this.onPageHide);
    this.unmountPlaybackControl();
    delete this.root.dataset.sceneControllerMode;
    delete this.root.dataset.sceneBindingGeneration;
    delete this.root.dataset.sceneScrollTriggerCount;
    delete this.root.dataset.activeScene;
    this.resolvedStates.clear();
    if (this.sharedWindow)
      delete this.sharedWindow.dataset.sceneActivationCount;
    for (const registration of this.stages) {
      delete registration.stage.dataset.sceneCheckpoint;
      delete registration.stage.dataset.sceneResolveCount;
      if (registration.mobileWindow) {
        delete registration.mobileWindow.dataset.sceneActivationCount;
      }
    }
  }

  private async rebuild(preserveState: boolean): Promise<void> {
    const generation = ++this.generation;
    const preservedScene = preserveState
      ? this.activeSceneId
      : (this.sceneAtViewport() ?? this.stages[0]?.id ?? this.standaloneId());
    const preservedTime = preserveState
      ? (this.activePlayer?.currentTime ?? 0)
      : 0;
    const previousMode = this.mode;

    this.cleanupBindings();
    const nextMode: ControllerMode = this.reducedQuery.matches
      ? "reduced"
      : this.desktopQuery.matches
        ? "desktop"
        : "mobile";
    if (this.activePlayer?.definition.ambient) {
      this.destroyPlayers();
    } else if (
      !preserveState ||
      nextMode === "reduced" ||
      previousMode === "reduced"
    ) {
      this.destroyPlayers();
    } else {
      this.activePlayer?.pause("controller");
    }
    this.mode = nextMode;
    this.root.dataset.sceneControllerMode = this.mode;
    this.root.dataset.sceneBindingGeneration = String(generation);
    this.root.dataset.sceneScrollTriggerCount = "0";
    this.ignoreObserverUntil = performance.now() + (preserveState ? 500 : 0);

    if (this.mode === "reduced") this.unmountPlaybackControl();
    else this.mountPlaybackControl();

    if (this.mode === "reduced") {
      const reducedSceneId = preservedScene ?? this.standaloneId();
      if (reducedSceneId && this.sharedWindow) {
        const definition = this.definitions.get(reducedSceneId);
        if (definition) {
          const player = new ScenePlayer(this.sharedWindow, definition, {
            autoplay: false,
            definitions: this.definitions,
            manageControl: !this.managesPlaybackControl,
            onUserPlay: (candidate) =>
              this.motionChannel.claimForUserPlayback(candidate),
            applyInitialStaticDom: preserveState,
            decorateInitialStaticRoot: this.stages.length === 0,
            onSwapRequest: (candidate, sceneId, commit) =>
              this.handlePlayerSwap(candidate, sceneId, commit),
          });
          this.registerPlayer(player);
          this.activePlayer = player;
          this.activeSceneId = reducedSceneId;
          this.root.dataset.activeScene = reducedSceneId;
        }
      }
      for (const registration of this.stages) {
        if (!registration.mobileWindow) continue;
        const definition = this.definitions.get(registration.id);
        if (!definition) continue;
        const player = new ScenePlayer(registration.mobileWindow, definition, {
          autoplay: false,
          definitions: this.definitions,
          manageControl: false,
          applyInitialStaticDom: false,
          decorateInitialStaticRoot: false,
        });
        this.registerPlayer(player);
      }
      return;
    }

    const initialScene =
      preservedScene ?? this.stages[0]?.id ?? this.standaloneId();
    if (initialScene) this.activate(initialScene, preservedTime);
    if (this.stages.length === 0) return;

    if (this.mode === "desktop") await this.bindDesktop(generation);
    else this.bindMobile();
  }

  private async bindDesktop(generation: number): Promise<void> {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]);
    if (
      this.destroyed ||
      generation !== this.generation ||
      this.mode !== "desktop"
    ) {
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    this.releaseScrollScheduler = this.motionChannel.trackScrollScheduler(
      ScrollTrigger,
      this.root,
    );

    const pin = this.root.querySelector<HTMLElement>("[data-scene-pin]");
    if (pin && this.stages.length > 1) {
      this.triggers.push(
        ScrollTrigger.create({
          trigger: this.root,
          start: "top top",
          end: "bottom bottom",
          pin,
          pinSpacing: false,
          invalidateOnRefresh: true,
          onLeave: () => this.releaseActivePlayer(),
          onLeaveBack: () => this.leavePinnedRangeBack(),
        }),
      );
    }

    for (const registration of this.stages) {
      this.triggers.push(
        ScrollTrigger.create({
          trigger: registration.stage,
          start: "top center",
          end: "bottom center",
          onEnter: () => this.activateFromBinding(registration.id),
          onEnterBack: () => this.activateFromBinding(registration.id),
        }),
      );
    }
    this.root.dataset.sceneScrollTriggerCount = String(this.triggers.length);
    ScrollTrigger.refresh();
  }

  private bindMobile(): void {
    this.mobileObserver = new IntersectionObserver(
      (entries) => {
        if (performance.now() < this.ignoreObserverUntil) return;
        for (const entry of entries) {
          const sceneId = (entry.target as HTMLElement).dataset.sceneId;
          if (!sceneId) continue;
          if (entry.isIntersecting) {
            this.mobileVisibility.set(sceneId, entry.intersectionRatio);
          } else {
            this.mobileVisibility.delete(sceneId);
          }
        }
        const visible = Array.from(this.mobileVisibility).sort(
          ([, a], [, b]) => b - a,
        )[0];
        if (visible) this.queueBindingActivation(visible[0]);
        else this.releaseActivePlayer();
      },
      { threshold: [0.45, 0.6] },
    );
    for (const registration of this.stages) {
      this.mobileObserver.observe(registration.stage);
    }
  }

  private bindRootVisibility(): void {
    this.rootObserver = new IntersectionObserver(
      ([entry]) => {
        this.rootVisible = Boolean(
          entry?.isIntersecting &&
          entry.intersectionRatio >= ROOT_VISIBILITY_THRESHOLD,
        );
        this.motionChannel.setSceneRootVisible(this.root, this.rootVisible);
        if (!this.activePlayer) return;
        if (this.rootVisible) {
          if (
            this.activePlayer.definition.ambient &&
            !this.motionChannel.isActive(this.activePlayer) &&
            this.activeSceneId
          ) {
            this.activate(this.activeSceneId);
          } else {
            this.motionChannel.claim(this.activePlayer, false);
            if (this.activePlayer.isCompleted) {
              this.scheduleAmbient(this.activePlayer);
            }
          }
        } else {
          this.releaseActivePlayer();
        }
        this.syncAmbientSchedule();
      },
      { threshold: [0, ROOT_VISIBILITY_THRESHOLD] },
    );
    this.rootObserver.observe(this.root);
  }

  private cleanupBindings(): void {
    this.cancelNavigation(false);
    if (this.activationFrame !== null) {
      cancelAnimationFrame(this.activationFrame);
      this.activationFrame = null;
    }
    this.pendingSceneId = null;
    this.mobileObserver?.disconnect();
    this.mobileObserver = null;
    this.mobileVisibility.clear();
    for (const trigger of this.triggers) trigger.kill(true);
    this.triggers = [];
    this.releaseScrollScheduler?.();
    this.releaseScrollScheduler = null;
    this.root.dataset.sceneScrollTriggerCount = "0";
  }

  private activateFromBinding(sceneId: string): void {
    if (performance.now() < this.ignoreObserverUntil) return;
    if (this.navigation) return;
    this.queueBindingActivation(sceneId);
  }

  private queueBindingActivation(sceneId: string): void {
    this.pendingSceneId = sceneId;
    if (this.activationFrame !== null) return;
    this.activationFrame = requestAnimationFrame(() => {
      this.activationFrame = null;
      const destination = this.pendingSceneId;
      this.pendingSceneId = null;
      if (!destination || this.destroyed || this.navigation) return;
      this.resolveCrossedStages(destination);
      this.activate(destination);
    });
  }

  private bindNavigationIntent(): void {
    addEventListener("scroll", this.onNavigationScroll, { passive: true });
    addEventListener("scrollend", this.onNavigationScrollEnd);
    addEventListener("wheel", this.onManualScrollIntent, { passive: true });
    addEventListener("touchstart", this.onManualScrollIntent, {
      passive: true,
    });
    addEventListener("pointerdown", this.onManualScrollIntent, {
      passive: true,
    });
    addEventListener("keydown", this.onManualScrollIntent);
  }

  private unbindNavigationIntent(): void {
    removeEventListener("scroll", this.onNavigationScroll);
    removeEventListener("scrollend", this.onNavigationScrollEnd);
    removeEventListener("wheel", this.onManualScrollIntent);
    removeEventListener("touchstart", this.onManualScrollIntent);
    removeEventListener("pointerdown", this.onManualScrollIntent);
    removeEventListener("keydown", this.onManualScrollIntent);
  }

  private completeNavigationIfSettled(): void {
    const navigation = this.navigation;
    if (
      !navigation ||
      navigation.settled ||
      Math.abs(window.scrollY - navigation.targetY) > 2
    ) {
      return;
    }
    navigation.settled = true;
    if (navigation.id) {
      this.resolveCrossedStages(navigation.id);
      this.activate(navigation.id);
    } else {
      this.resolveCrossedStagesAboveRange();
      this.leavePinnedRangeBack();
    }

    // The destination is exactly on ScrollTrigger's activation boundary.
    // Keep the navigation transaction alive through the next frame so every
    // callback queued by the arrival scroll still observes suppression; only
    // the explicit destination activation above may commit this arrival.
    if (this.navigationFrame !== null) {
      cancelAnimationFrame(this.navigationFrame);
    }
    this.navigationFrame = requestAnimationFrame(() => {
      this.navigationFrame = null;
      if (this.navigation !== navigation) return;
      this.navigation = null;
      this.unbindNavigationIntent();
    });
  }

  private cancelNavigation(stopScroll: boolean): void {
    if (!this.navigation) return;
    this.navigation = null;
    this.unbindNavigationIntent();
    if (this.navigationFrame !== null) {
      cancelAnimationFrame(this.navigationFrame);
      this.navigationFrame = null;
    }
    if (stopScroll) {
      window.scrollTo({ top: window.scrollY, behavior: "instant" });
      const destination = this.sceneAtViewport();
      if (destination) {
        this.resolveCrossedStages(destination);
        this.activate(destination);
      }
    }
  }

  private releaseActivePlayer(): void {
    if (this.activePlayer) this.motionChannel.release(this.activePlayer);
  }

  private leavePinnedRangeBack(): void {
    this.releaseActivePlayer();
    this.activeSceneId = null;
    delete this.root.dataset.activeScene;
  }

  private recordCompletedState(player: ScenePlayer): void {
    if (
      player.isCompleted &&
      player.definition.playback.entry === "play" &&
      player.definition.playback.mode === "once"
    ) {
      this.resolvedStates.set(
        player.definition.id,
        resolveSceneEndState(player.definition),
      );
    }
  }

  private scheduleAmbient(host: ScenePlayer): void {
    const ambient = this.ambientByHost.get(host.definition.id);
    if (
      !ambient ||
      this.destroyed ||
      this.mode === "reduced" ||
      this.activePlayer !== host ||
      this.activeSceneId !== host.definition.id ||
      !this.motionChannel.isActive(host)
    ) {
      return;
    }
    if (this.ambientPending?.host === host) {
      this.syncAmbientSchedule();
      return;
    }
    this.cancelAmbientSchedule();
    this.ambientPending = { host, definition: ambient };
    this.ambientRemaining = ambient.ambient!.startDelay;
    this.syncAmbientSchedule();
  }

  private syncAmbientSchedule(): void {
    const pending = this.ambientPending;
    if (!pending) return;
    const eligible =
      !this.destroyed &&
      this.mode !== "reduced" &&
      this.rootVisible &&
      !this.userPaused &&
      document.visibilityState !== "hidden" &&
      this.activePlayer === pending.host &&
      pending.host.isCompleted &&
      this.motionChannel.isActive(pending.host);
    if (!eligible) {
      this.pauseAmbientSchedule();
      return;
    }
    if (this.ambientTimer) return;
    if (this.ambientRemaining <= 0) {
      this.ambientPending = null;
      this.startAmbient(pending.host, pending.definition);
      return;
    }
    this.ambientStartedAt = performance.now();
    this.ambientTimer = setTimeout(() => {
      this.ambientTimer = null;
      this.ambientRemaining = 0;
      this.syncAmbientSchedule();
    }, this.ambientRemaining);
  }

  private pauseAmbientSchedule(): void {
    if (!this.ambientTimer) return;
    this.ambientRemaining = Math.max(
      0,
      this.ambientRemaining - (performance.now() - this.ambientStartedAt),
    );
    clearTimeout(this.ambientTimer);
    this.ambientTimer = null;
  }

  private startAmbient(
    host: ScenePlayer,
    definition: SceneDefinition<ChatSceneState>,
  ): void {
    if (
      this.destroyed ||
      this.mode === "reduced" ||
      this.activePlayer !== host ||
      this.activeSceneId !== definition.ambient?.follows ||
      !this.motionChannel.isActive(host) ||
      this.userPaused ||
      !this.rootVisible ||
      document.visibilityState === "hidden"
    ) {
      return;
    }

    host.destroy({ restoreDom: false });
    this.unregisterPlayer(host);
    const ambient = new ScenePlayer(host.root, definition, {
      autoplay: false,
      definitions: this.definitions,
      manageControl: !this.managesPlaybackControl,
      onUserPlay: (candidate) =>
        this.motionChannel.claimForUserPlayback(candidate),
      onSwapRequest: (candidate, sceneId, commit) =>
        this.handlePlayerSwap(candidate, sceneId, commit),
    });
    ambient.onStatusChange((status) => {
      this.syncPlaybackControl();
      this.syncAmbientSchedule();
      if (status === "completed") {
        this.recordCompletedState(ambient);
        this.scheduleAmbient(ambient);
      }
    });
    this.registerPlayer(ambient);
    if (!this.motionChannel.claimAmbient(ambient, host)) {
      ambient.destroy();
      host.restoreDomSnapshot();
      this.unregisterPlayer(ambient);
      return;
    }
    this.ambientHostPlayer = host;
    this.activePlayer = ambient;
    this.root.dataset.activeAmbientScene = definition.id;
    this.placePlaybackControl(ambient.root);
    this.syncPlaybackControl();
  }

  private beginAmbientYield(ambient: ScenePlayer): void {
    if (this.ambientYield) return;
    this.ambientYield = ambient.yieldAtBeatBoundary().then(() => {
      this.ambientYield = null;
      if (this.destroyed || this.activePlayer !== ambient) return;
      const swap = this.pendingAmbientSwap;
      this.pendingAmbientSwap = null;
      if (swap?.player === ambient) {
        this.pendingAmbientActivation = null;
        this.ambientHostPlayer = null;
        delete this.root.dataset.activeAmbientScene;
        swap.commit();
        this.hydrateRetainedSwap(ambient, ambient.definition.id);
        this.placePlaybackControl(ambient.root);
        this.syncPlaybackControl();
        if (ambient.isCompleted) this.scheduleAmbient(ambient);
        return;
      }
      const destination = this.pendingAmbientActivation;
      this.pendingAmbientActivation = null;
      if (!destination) return;

      if (!ambient.definition.ambient) {
        this.activateImmediately(destination.id, destination.seekTo);
        return;
      }

      ambient.destroy();
      this.unregisterPlayer(ambient);
      this.ambientHostPlayer?.restoreDomSnapshot();
      this.ambientHostPlayer = null;
      this.activePlayer = null;
      delete this.root.dataset.activeAmbientScene;
      this.activateImmediately(destination.id, destination.seekTo, ambient);
    });
  }

  private cancelAmbientSchedule(): void {
    if (this.ambientTimer) clearTimeout(this.ambientTimer);
    this.ambientTimer = null;
    this.ambientRemaining = 0;
    this.ambientStartedAt = 0;
    this.ambientPending = null;
  }

  private handlePlayerSwap(
    player: ScenePlayer,
    sceneId: string,
    commit: () => void,
  ): boolean {
    if (player !== this.activePlayer) return false;
    const destination = this.definitions.get(sceneId);
    if (destination?.ambient) {
      throw new Error(
        `SceneController: ambient scene "${sceneId}" is scheduler-owned and cannot be selected directly`,
      );
    }
    const commitWithRole = (): void => {
      commit();
      this.motionChannel.setAmbientRole(
        player,
        destination?.playback.mode === "loop",
      );
    };
    this.cancelAmbientSchedule();
    if (this.motionChannel.isAmbientOccupant(player)) {
      this.pendingAmbientActivation = null;
      this.pendingAmbientSwap = { player, commit: commitWithRole };
      this.beginAmbientYield(player);
      return true;
    }
    commitWithRole();
    this.hydrateRetainedSwap(player, sceneId);
    this.placePlaybackControl(player.root);
    this.syncPlaybackControl();
    if (player.isCompleted) this.scheduleAmbient(player);
    return true;
  }

  private hydrateRetainedSwap(player: ScenePlayer, sceneId: string): void {
    const definition = this.definitions.get(sceneId);
    if (
      !definition ||
      definition.playback.mode !== "once" ||
      definition.playback.entry !== "play" ||
      !this.resolvedStates.has(sceneId)
    ) {
      return;
    }
    const resolvedAt = definition.checkpoints.find(
      ({ name }) => name === "resolved",
    )?.at;
    if (resolvedAt !== undefined) player.seek(resolvedAt);
  }

  private mountPlaybackControl(): void {
    if (!this.managesPlaybackControl || this.playbackControl) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scene-playback-control";
    button.dataset.scenePlaybackControl = "";
    button.innerHTML = `
      <span class="scene-playback-control__icon scene-playback-control__icon--pause" aria-hidden="true"><i></i><i></i></span>
      <span class="scene-playback-control__icon scene-playback-control__icon--play" aria-hidden="true"></span>
    `;
    button.addEventListener("click", this.onPlaybackControlClick);
    this.playbackControl = button;
    if (this.activePlayer) this.placePlaybackControl(this.activePlayer.root);
    this.syncPlaybackControl();
  }

  private unmountPlaybackControl(): void {
    if (!this.playbackControl) return;
    this.playbackControl.removeEventListener(
      "click",
      this.onPlaybackControlClick,
    );
    this.playbackControl.remove();
    this.playbackControl = null;
  }

  private placePlaybackControl(root: HTMLElement): void {
    if (!this.playbackControl) return;
    const slot = root.querySelector<HTMLElement>("[data-scene-controls]");
    if (!slot) {
      throw new Error(
        "SceneController: ambient scheduling requires [data-scene-controls] inside every controlled window",
      );
    }
    slot.append(this.playbackControl);
  }

  private syncPlaybackControl(): void {
    if (!this.playbackControl) return;
    this.playbackControl.setAttribute(
      "aria-label",
      this.userPaused ? PLAY_LABEL : PAUSE_LABEL,
    );
    this.playbackControl.dataset.state = this.userPaused ? "paused" : "playing";
  }

  private registerPlayer(player: ScenePlayer): void {
    const existing = this.players.get(player.root);
    if (existing && existing !== player) {
      throw new Error(
        `SceneController: scene root already owns player "${existing.definition.id}"; destroy it before registering "${player.definition.id}"`,
      );
    }
    this.players.set(player.root, player);
    this.motionChannel.register(player);
    player.root.dataset.sceneRootPlayerCount = "1";
  }

  private unregisterPlayer(player: ScenePlayer): void {
    const existing = this.players.get(player.root);
    if (!existing) return;
    if (existing !== player) {
      throw new Error(
        `SceneController: cannot unregister "${player.definition.id}" because its root owns "${existing.definition.id}"`,
      );
    }
    this.players.delete(player.root);
    this.motionChannel.unregister(player);
    delete player.root.dataset.sceneRootPlayerCount;
  }

  private destroyPlayers(): void {
    this.cancelAmbientSchedule();
    for (const player of Array.from(this.players.values())) {
      this.motionChannel.release(player);
      this.unregisterPlayer(player);
      player.destroy();
    }
    this.ambientHostPlayer?.restoreDomSnapshot();
    this.ambientHostPlayer = null;
    this.pendingAmbientActivation = null;
    this.pendingAmbientSwap = null;
    this.ambientYield = null;
    this.activePlayer = null;
    this.activeSceneId = null;
    delete this.root.dataset.activeAmbientScene;
  }

  private resolveCrossedStages(destinationId: string): void {
    const from = this.stages.findIndex(({ id }) => id === this.activeSceneId);
    const to = this.stages.findIndex(({ id }) => id === destinationId);
    if (from < 0 || to < 0 || Math.abs(to - from) < 2) return;

    const direction = to > from ? 1 : -1;
    for (let index = from + direction; index !== to; index += direction) {
      this.forceResolve(this.stages[index]);
    }
  }

  private resolveCrossedStagesAboveRange(): void {
    const from = this.stages.findIndex(({ id }) => id === this.activeSceneId);
    for (let index = from - 1; index >= 0; index -= 1) {
      this.forceResolve(this.stages[index]);
    }
  }

  private forceResolve(registration: StageRegistration): void {
    const definition = this.definitions.get(registration.id);
    if (!definition) {
      throw new Error(
        `SceneController: scene "${registration.id}" has no registered definition`,
      );
    }
    this.resolvedStates.set(registration.id, resolveSceneEndState(definition));
    registration.stage.dataset.sceneCheckpoint = "resolved";
    registration.stage.dataset.sceneResolveCount = String(
      Number(registration.stage.dataset.sceneResolveCount ?? 0) + 1,
    );
  }

  private windowFor(sceneId: string): HTMLElement | null {
    if (this.stages.length === 0) return this.sharedWindow;
    if (this.mode === "desktop") return this.sharedWindow;
    return this.stages.find(({ id }) => id === sceneId)?.mobileWindow ?? null;
  }

  private standaloneId(): string | null {
    return this.stages.length === 0
      ? (this.sharedWindow?.dataset.sceneId ?? null)
      : null;
  }

  private sceneAtViewport(): string | null {
    const center = window.innerHeight / 2;
    return (
      this.stages.find(({ stage }) => {
        const rect = stage.getBoundingClientRect();
        return rect.top <= center && rect.bottom >= center;
      })?.id ?? null
    );
  }
}
