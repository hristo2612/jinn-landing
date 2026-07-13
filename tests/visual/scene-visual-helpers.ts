import { expect, type Locator, type Page } from "@playwright/test";

export async function settleVisualPage(
  page: Page,
  path: string,
): Promise<void> {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () =>
      document.readyState === "complete" && document.fonts.status === "loaded",
  );
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition: none !important;
      }
      [data-scene-debug] { visibility: hidden !important; }
    `,
  });
}

export async function pauseAndSeekScene(
  overlay: Locator,
  time: number,
): Promise<void> {
  const toggle = overlay.locator("[data-scene-debug-toggle]");
  const scrubber = overlay.locator("[data-scene-debug-scrubber]");
  const timeOutput = overlay.locator("[data-scene-debug-time]");
  const expectedTime = `${time}ms`;
  const acquirePauseAndSeek = () =>
    expect(async () => {
      // The rendered label can trail an active-player handoff by one frame.
      // Toggle the live player unconditionally, then prove the requested time
      // remains fixed across two rendered frames before accepting the state.
      await toggle.evaluate((button) => {
        (button as HTMLButtonElement).click();
      });
      await scrubber.evaluate((input, nextTime) => {
        const node = input as HTMLInputElement;
        node.value = String(nextTime);
        node.dispatchEvent(new Event("input", { bubbles: true }));
      }, time);
      const stable = await timeOutput.evaluate(async (output, nextTime) => {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        const firstFrame = output.textContent;
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        return firstFrame === nextTime && output.textContent === nextTime;
      }, expectedTime);
      expect(await toggle.textContent()).toBe("Play");
      expect(stable).toBe(true);
    }).toPass({ timeout: 5_000 });

  await acquirePauseAndSeek();
  await acquirePauseAndSeek();
  await expect(timeOutput).toHaveText(expectedTime);
  await expect(toggle).toHaveText("Play");
}
