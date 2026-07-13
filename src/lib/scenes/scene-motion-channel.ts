import { gsap } from "gsap";

import type { ScenePlayer } from "./scene-player";

interface ScrollScheduler {
  disable(reset?: boolean, kill?: boolean): void;
  enable(): void;
}

/** Owns the single page-wide permission to advance a scripted timeline. */
export class SceneMotionChannel {
  private activePlayer: ScenePlayer | null = null;
  private readonly claimHistory: ScenePlayer[] = [];
  private readonly ambientRoles = new WeakSet<ScenePlayer>();
  private yieldingLoopOwner: ScenePlayer | null = null;
  private readonly ownerListeners = new Set<
    (owner: ScenePlayer | null) => void
  >();
  private readonly playerStatusCleanups = new Map<ScenePlayer, () => void>();
  private readonly sceneRootVisibility = new Map<HTMLElement, boolean>();
  private readonly scrollSchedulers = new Map<
    ScrollScheduler,
    { owners: Map<HTMLElement, number>; awake: boolean }
  >();
  private tickerGuardInstalled = false;
  private readonly enforceTickerIdle = (): void => {
    if (!this.shouldTick()) gsap.ticker.sleep();
  };

  register(player: ScenePlayer): void {
    if (this.playerStatusCleanups.has(player)) return;
    this.installTickerGuard();
    const cleanup = player.onStatusChange(() => this.syncTicker());
    this.playerStatusCleanups.set(player, cleanup);
    this.syncTicker();
  }

  unregister(player: ScenePlayer): void {
    this.playerStatusCleanups.get(player)?.();
    this.playerStatusCleanups.delete(player);
    if (this.playerStatusCleanups.size === 0) {
      gsap.ticker.sleep();
      if (this.tickerGuardInstalled) {
        gsap.ticker.remove(this.enforceTickerIdle);
        this.tickerGuardInstalled = false;
      }
      return;
    }
    this.syncTicker();
  }

  registerSceneRoot(root: HTMLElement, visible = true): () => void {
    this.sceneRootVisibility.set(root, visible);
    this.syncScrollSchedulers();
    return () => {
      this.sceneRootVisibility.delete(root);
      this.syncScrollSchedulers();
    };
  }

  setSceneRootVisible(root: HTMLElement, visible: boolean): void {
    if (!this.sceneRootVisibility.has(root)) return;
    this.sceneRootVisibility.set(root, visible);
    this.syncScrollSchedulers();
  }

  trackScrollScheduler(
    scheduler: ScrollScheduler,
    root: HTMLElement,
  ): () => void {
    const existing = this.scrollSchedulers.get(scheduler);
    if (existing) {
      existing.owners.set(root, (existing.owners.get(root) ?? 0) + 1);
    } else {
      this.scrollSchedulers.set(scheduler, {
        owners: new Map([[root, 1]]),
        awake: true,
      });
    }
    this.syncScrollSchedulers();

    let released = false;
    return () => {
      if (released) return;
      released = true;
      const registration = this.scrollSchedulers.get(scheduler);
      if (!registration) return;
      const ownerCount = (registration.owners.get(root) ?? 0) - 1;
      if (ownerCount > 0) registration.owners.set(root, ownerCount);
      else registration.owners.delete(root);
      this.syncScrollSchedulers();
    };
  }

  refreshIdleState(): void {
    this.syncTicker();
    this.syncScrollSchedulers();
  }

  onOwnerChange(listener: (owner: ScenePlayer | null) => void): () => void {
    this.ownerListeners.add(listener);
    return () => this.ownerListeners.delete(listener);
  }

  claim(player: ScenePlayer, reenter = true): void {
    this.registerClaim(player);
    if (this.activePlayer === player) {
      if (this.yieldingLoopOwner === player) {
        player.resume("controller");
        return;
      }
      if (reenter) player.enter();
      else player.resume("controller");
      return;
    }

    if (this.yieldingLoopOwner) {
      player.pause("controller");
      return;
    }

    const outgoing = this.activePlayer;
    if (
      outgoing?.definition.playback.mode === "loop" &&
      outgoing.isPlaying &&
      !this.isAmbientOccupant(outgoing)
    ) {
      player.pause("controller");
      this.yieldingLoopOwner = outgoing;
      void outgoing
        .yieldAtBeatBoundary()
        .then(() => this.finishLoopYield(outgoing));
      return;
    }

    this.transferClaim(player);
  }

  claimForUserPlayback(player: ScenePlayer): void {
    const yielding = this.yieldingLoopOwner;
    this.yieldingLoopOwner = null;
    yielding?.cancelBeatBoundaryYield();

    if (this.activePlayer === player) {
      this.registerClaim(player);
      player.resume("controller");
      return;
    }

    this.activePlayer?.pause("controller");
    this.registerClaim(player);
    this.setActivePlayer(player);
    player.resume("controller");
  }

  private transferClaim(player: ScenePlayer): void {
    this.activePlayer?.pause("controller");
    this.registerClaim(player);
    this.setActivePlayer(player);
    player.enter();
  }

  isActive(player: ScenePlayer): boolean {
    return this.activePlayer === player;
  }

  isAmbientOccupant(player: ScenePlayer): boolean {
    return this.activePlayer === player && this.ambientRoles.has(player);
  }

  setAmbientRole(player: ScenePlayer, ambient: boolean): boolean {
    if (this.activePlayer !== player) return false;
    if (ambient) this.ambientRoles.add(player);
    else this.ambientRoles.delete(player);
    return true;
  }

  claimAmbient(player: ScenePlayer, host: ScenePlayer): boolean {
    if (this.activePlayer !== host) return false;
    host.pause("controller");
    this.removeClaim(host);
    this.removeClaim(player);
    this.claimHistory.push(player);
    this.ambientRoles.add(player);
    this.setActivePlayer(player);
    player.enter();
    return true;
  }

  replace(outgoing: ScenePlayer, incoming: ScenePlayer): void {
    if (this.activePlayer !== outgoing) {
      this.claim(incoming, false);
      return;
    }
    outgoing.pause("controller");
    this.removeClaim(outgoing);
    this.removeClaim(incoming);
    this.claimHistory.push(incoming);
    this.ambientRoles.delete(incoming);
    this.setActivePlayer(incoming);
    incoming.resume("controller");
  }

  release(player: ScenePlayer): void {
    this.removeClaim(player);
    if (this.yieldingLoopOwner === player && this.activePlayer === player) {
      return;
    }
    if (this.activePlayer !== player) return;
    player.pause("controller");
    this.setActivePlayer(this.claimHistory.at(-1) ?? null);
    this.activePlayer?.resume("controller");
  }

  private setActivePlayer(player: ScenePlayer | null): void {
    if (this.activePlayer === player) return;
    this.activePlayer = player;
    for (const listener of this.ownerListeners) listener(player);
  }

  private removeClaim(player: ScenePlayer): void {
    const claim = this.claimHistory.indexOf(player);
    if (claim >= 0) this.claimHistory.splice(claim, 1);
  }

  private registerClaim(player: ScenePlayer): void {
    this.removeClaim(player);
    this.claimHistory.push(player);
  }

  private installTickerGuard(): void {
    if (this.tickerGuardInstalled || typeof document === "undefined") return;
    gsap.ticker.add(this.enforceTickerIdle, false, true);
    this.tickerGuardInstalled = true;
  }

  private shouldTick(): boolean {
    return (
      typeof document !== "undefined" &&
      document.visibilityState !== "hidden" &&
      Array.from(this.playerStatusCleanups.keys()).some(
        (player) => player.isPlaying,
      )
    );
  }

  private syncTicker(): void {
    if (typeof document === "undefined") return;
    if (this.shouldTick()) gsap.ticker.wake();
    else gsap.ticker.sleep();
  }

  private syncScrollSchedulers(): void {
    for (const [scheduler, registration] of this.scrollSchedulers) {
      const shouldWake =
        typeof document !== "undefined" &&
        document.visibilityState !== "hidden" &&
        Array.from(registration.owners.keys()).some(
          (root) => this.sceneRootVisibility.get(root) === true,
        );
      if (registration.awake === shouldWake) continue;
      registration.awake = shouldWake;
      if (!shouldWake) {
        scheduler.disable(false, false);
        continue;
      }
      const focused =
        document.activeElement instanceof HTMLElement &&
        document.activeElement !== document.body
          ? document.activeElement
          : null;
      scheduler.enable();
      if (focused?.isConnected && document.activeElement !== focused) {
        focused.focus({ preventScroll: true });
      }
    }
  }

  private finishLoopYield(owner: ScenePlayer): void {
    if (this.yieldingLoopOwner !== owner) {
      owner.resume("ambient-yield");
      return;
    }
    this.yieldingLoopOwner = null;

    if (this.activePlayer !== owner) {
      owner.resume("ambient-yield");
      return;
    }
    const eligible = this.claimHistory.at(-1) ?? null;
    if (eligible === owner) {
      owner.resume("controller");
      owner.resume("ambient-yield");
      return;
    }

    owner.pause("controller");
    owner.resume("ambient-yield");
    if (eligible) this.transferClaim(eligible);
    else this.setActivePlayer(null);
  }
}
