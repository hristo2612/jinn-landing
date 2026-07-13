import { gsap } from "gsap";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SceneMotionChannel } from "../../src/lib/scenes/scene-motion-channel";
import type {
  PauseReason,
  ScenePlayer,
  ScenePlayerStatus,
} from "../../src/lib/scenes/scene-player";

vi.mock("gsap", () => ({
  gsap: {
    ticker: {
      add: vi.fn(),
      remove: vi.fn(),
      sleep: vi.fn(),
      wake: vi.fn(),
    },
  },
}));

class FakePlayer {
  readonly reasons = new Set<PauseReason>(["controller"]);
  readonly calls: string[] = [];
  readonly definition: { playback: { mode: "loop" | "once" } };
  private readonly motionMode: "playing" | "static";
  private readonly statusListeners = new Set<
    (status: ScenePlayerStatus) => void
  >();
  private yieldResolve: (() => void) | null = null;

  constructor(
    mode: "loop" | "once" = "once",
    status: "playing" | "static" = "playing",
  ) {
    this.definition = { playback: { mode } };
    this.motionMode = status;
  }

  get isPlaying(): boolean {
    return this.motionMode === "playing" && this.reasons.size === 0;
  }

  get status(): ScenePlayerStatus {
    if (this.motionMode === "static") return "static";
    return this.isPlaying ? "playing" : "paused";
  }

  onStatusChange(listener: (status: ScenePlayerStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatus(): void {
    for (const listener of this.statusListeners) listener(this.status);
  }

  enter(): void {
    this.calls.push("enter");
    this.reasons.delete("controller");
    this.notifyStatus();
  }

  pause(reason: PauseReason): void {
    this.calls.push(`pause:${reason}`);
    this.reasons.add(reason);
    this.notifyStatus();
  }

  resume(reason: PauseReason): void {
    this.calls.push(`resume:${reason}`);
    this.reasons.delete(reason);
    this.notifyStatus();
  }

  yieldAtBeatBoundary(): Promise<void> {
    this.calls.push("yield");
    return new Promise<void>((resolve) => {
      this.yieldResolve = () => {
        this.reasons.add("ambient-yield");
        this.notifyStatus();
        resolve();
      };
    });
  }

  finishYield(): void {
    this.yieldResolve?.();
    this.yieldResolve = null;
  }

  asPlayer(): ScenePlayer {
    return this as unknown as ScenePlayer;
  }
}

describe("SceneMotionChannel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("document", { visibilityState: "visible" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps an incoming loop paused until the outgoing loop yields", async () => {
    const channel = new SceneMotionChannel();
    const outgoing = new FakePlayer("loop");
    const incoming = new FakePlayer("loop");

    channel.claim(outgoing.asPlayer());
    channel.claim(incoming.asPlayer());

    expect(channel.isActive(outgoing.asPlayer())).toBe(true);
    expect(outgoing.calls).toContain("yield");
    expect(outgoing.reasons).not.toContain("controller");
    expect(incoming.reasons).toContain("controller");

    outgoing.finishYield();
    await Promise.resolve();

    expect(channel.isActive(incoming.asPlayer())).toBe(true);
    expect(outgoing.reasons).toEqual(new Set<PauseReason>(["controller"]));
    expect(incoming.reasons).not.toContain("controller");
  });

  it("coalesces rapid looping claims to the latest waiting player", async () => {
    const channel = new SceneMotionChannel();
    const first = new FakePlayer("loop");
    const second = new FakePlayer("loop");
    const third = new FakePlayer("loop");

    channel.claim(first.asPlayer());
    channel.claim(second.asPlayer());
    channel.claim(third.asPlayer());
    channel.release(first.asPlayer());

    expect(channel.isActive(first.asPlayer())).toBe(true);
    expect(second.calls).not.toContain("enter");
    expect(third.calls).not.toContain("enter");

    first.finishYield();
    await Promise.resolve();

    expect(channel.isActive(third.asPlayer())).toBe(true);
    expect(second.calls).not.toContain("enter");
    expect(third.calls).toContain("enter");
  });

  it("restores a still-live superseded claimant when the latest claim leaves before settlement", async () => {
    const channel = new SceneMotionChannel();
    const first = new FakePlayer("loop");
    const second = new FakePlayer("loop");
    const third = new FakePlayer("loop");

    channel.claim(first.asPlayer());
    channel.claim(second.asPlayer());
    channel.claim(third.asPlayer());
    channel.release(third.asPlayer());
    channel.release(first.asPlayer());

    expect([first, second, third].filter((player) => player.isPlaying)).toEqual(
      [first],
    );

    first.finishYield();
    await Promise.resolve();

    expect(channel.isActive(second.asPlayer())).toBe(true);
    expect([first, second, third].filter((player) => player.isPlaying)).toEqual(
      [second],
    );
  });

  it("restores a superseded claimant after the transferred owner later leaves", async () => {
    const channel = new SceneMotionChannel();
    const first = new FakePlayer("loop");
    const second = new FakePlayer("loop");
    const third = new FakePlayer("loop");

    channel.claim(first.asPlayer());
    channel.claim(second.asPlayer());
    channel.claim(third.asPlayer());
    channel.release(first.asPlayer());
    first.finishYield();
    await Promise.resolve();

    expect(channel.isActive(third.asPlayer())).toBe(true);
    channel.release(third.asPlayer());

    expect(channel.isActive(second.asPlayer())).toBe(true);
    expect([first, second, third].filter((player) => player.isPlaying)).toEqual(
      [second],
    );
  });

  it("re-evaluates a rapid A-to-B-to-A flip when the pending beat settles", async () => {
    const channel = new SceneMotionChannel();
    const first = new FakePlayer("loop");
    const second = new FakePlayer("loop");

    channel.claim(first.asPlayer());
    channel.claim(second.asPlayer());
    channel.claim(first.asPlayer());

    first.finishYield();
    await Promise.resolve();

    expect(channel.isActive(first.asPlayer())).toBe(true);
    expect([first, second].filter((player) => player.isPlaying)).toEqual([
      first,
    ]);

    channel.release(first.asPlayer());
    expect(channel.isActive(second.asPlayer())).toBe(true);
    expect([first, second].filter((player) => player.isPlaying)).toEqual([
      second,
    ]);
  });

  it("keeps the reclaimed visible loop advancing across leave-and-reenter during handoff", async () => {
    const channel = new SceneMotionChannel();
    const first = new FakePlayer("loop");
    const second = new FakePlayer("loop");

    channel.claim(first.asPlayer());
    channel.claim(second.asPlayer());
    channel.release(first.asPlayer());
    channel.release(second.asPlayer());
    channel.claim(first.asPlayer(), false);

    expect([first, second].filter((player) => player.isPlaying)).toEqual([
      first,
    ]);

    first.finishYield();
    await Promise.resolve();

    expect(channel.isActive(first.asPlayer())).toBe(true);
    expect([first, second].filter((player) => player.isPlaying)).toEqual([
      first,
    ]);
  });

  it("keeps an offscreen LIFO restore target idle until its distinct pause clears", () => {
    const channel = new SceneMotionChannel();
    const restored = new FakePlayer();
    const current = new FakePlayer();

    channel.register(restored.asPlayer());
    channel.register(current.asPlayer());
    channel.claim(restored.asPlayer());
    restored.pause("offscreen");
    channel.claim(current.asPlayer());
    vi.clearAllMocks();
    channel.release(current.asPlayer());

    expect(channel.isActive(restored.asPlayer())).toBe(true);
    expect(restored.reasons).toEqual(new Set<PauseReason>(["offscreen"]));
    expect(restored.isPlaying).toBe(false);
    expect(gsap.ticker.sleep).toHaveBeenCalled();
    expect(gsap.ticker.wake).not.toHaveBeenCalled();

    vi.clearAllMocks();
    restored.resume("offscreen");

    expect(restored.isPlaying).toBe(true);
    expect(gsap.ticker.wake).toHaveBeenCalledOnce();
    expect(gsap.ticker.sleep).not.toHaveBeenCalled();
  });

  it("keeps ambient-role and reduced-motion loop claims synchronous", () => {
    const ambientChannel = new SceneMotionChannel();
    const ambient = new FakePlayer("loop");
    const scripted = new FakePlayer("loop");
    ambientChannel.claim(ambient.asPlayer());
    ambientChannel.setAmbientRole(ambient.asPlayer(), true);
    ambientChannel.claim(scripted.asPlayer());

    expect(ambient.calls).not.toContain("yield");
    expect(ambientChannel.isActive(scripted.asPlayer())).toBe(true);

    const reducedChannel = new SceneMotionChannel();
    const reduced = new FakePlayer("loop", "static");
    const next = new FakePlayer("loop", "static");
    reducedChannel.claim(reduced.asPlayer());
    reducedChannel.claim(next.asPlayer());

    expect(reduced.calls).not.toContain("yield");
    expect(reducedChannel.isActive(next.asPlayer())).toBe(true);
  });

  it("notifies controllers whenever the shared owner changes", () => {
    const channel = new SceneMotionChannel();
    const a = new FakePlayer();
    const b = new FakePlayer();
    const owners: Array<ScenePlayer | null> = [];
    const unsubscribe = channel.onOwnerChange((owner) => owners.push(owner));

    channel.claim(a.asPlayer());
    channel.claim(b.asPlayer());
    channel.release(b.asPlayer());
    unsubscribe();
    channel.release(a.asPlayer());

    expect(owners).toEqual([a.asPlayer(), b.asPlayer(), a.asPlayer()]);
  });

  it("restores claims in LIFO order and ignores inactive release", () => {
    const channel = new SceneMotionChannel();
    const a = new FakePlayer();
    const b = new FakePlayer();
    const c = new FakePlayer();

    channel.claim(a.asPlayer());
    channel.claim(b.asPlayer());
    channel.claim(c.asPlayer());
    channel.release(b.asPlayer());
    expect(a.reasons).toContain("controller");
    expect(c.reasons).not.toContain("controller");

    channel.release(c.asPlayer());
    expect(a.reasons).not.toContain("controller");
    expect(b.calls).not.toContain("resume:controller");
  });

  it("removes only the controller pause reason from a restored owner", () => {
    const channel = new SceneMotionChannel();
    const a = new FakePlayer();
    const b = new FakePlayer();
    a.reasons.add("user");

    channel.claim(a.asPlayer());
    channel.claim(b.asPlayer());
    channel.release(b.asPlayer());

    expect(a.reasons).toEqual(new Set<PauseReason>(["user"]));
  });

  it("keeps rapid claim and release history bounded to live claimants", () => {
    const channel = new SceneMotionChannel();
    const a = new FakePlayer();
    const b = new FakePlayer();
    const c = new FakePlayer();

    channel.claim(a.asPlayer());
    for (let index = 0; index < 10_000; index += 1) {
      channel.claim(b.asPlayer());
      channel.release(b.asPlayer());
    }
    channel.release(a.asPlayer());
    const resumesBefore = a.calls.filter(
      (call) => call === "resume:controller",
    ).length;

    channel.claim(c.asPlayer());
    channel.release(c.asPlayer());

    expect(a.calls.filter((call) => call === "resume:controller").length).toBe(
      resumesBefore,
    );
    expect(c.reasons).toContain("controller");
  });

  it("allows ambient to replace only its active scripted host", () => {
    const channel = new SceneMotionChannel();
    const host = new FakePlayer();
    const otherScript = new FakePlayer();
    const ambient = new FakePlayer();

    channel.claim(host.asPlayer());
    channel.claim(otherScript.asPlayer());

    expect(channel.claimAmbient(ambient.asPlayer(), host.asPlayer())).toBe(
      false,
    );
    expect(ambient.reasons).toContain("controller");
    expect(otherScript.reasons).not.toContain("controller");
  });

  it("replaces the completed host and restores the prior claimant after ambient", () => {
    const channel = new SceneMotionChannel();
    const prior = new FakePlayer();
    const host = new FakePlayer();
    const ambient = new FakePlayer();

    channel.claim(prior.asPlayer());
    channel.claim(host.asPlayer());
    expect(channel.claimAmbient(ambient.asPlayer(), host.asPlayer())).toBe(
      true,
    );
    expect(ambient.reasons).not.toContain("controller");

    channel.release(ambient.asPlayer());
    expect(prior.reasons).not.toContain("controller");
    expect(host.reasons).toContain("controller");
  });

  it("tracks ambient authority as the active channel occupant role", () => {
    const channel = new SceneMotionChannel();
    const scripted = new FakePlayer();
    const selectedLoop = new FakePlayer();

    channel.claim(scripted.asPlayer());
    expect(channel.isAmbientOccupant(scripted.asPlayer())).toBe(false);
    channel.claim(selectedLoop.asPlayer());
    expect(channel.setAmbientRole(selectedLoop.asPlayer(), true)).toBe(true);
    expect(channel.isAmbientOccupant(selectedLoop.asPlayer())).toBe(true);

    channel.release(selectedLoop.asPlayer());
    expect(channel.isAmbientOccupant(selectedLoop.asPlayer())).toBe(false);
    expect(channel.isAmbientOccupant(scripted.asPlayer())).toBe(false);
  });
});
