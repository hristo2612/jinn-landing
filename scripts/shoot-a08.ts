import { chromium } from "@playwright/test";

const BASE = process.env.SHOOT_BASE ?? "http://127.0.0.1:4332/";
const OUT = new URL("../docs/screens/a08/", import.meta.url).pathname;

const panes = [
  { pane: "org", checkpoint: "employees-resolved" },
  { pane: "todos", checkpoint: "todos-resolved" },
  { pane: "flows", checkpoint: "workflow-parked" },
  { pane: "triggers", checkpoint: "trigger-fire-resolved" },
] as const;

const viewports = [
  { label: "1440", width: 1440, height: 900 },
  { label: "390", width: 390, height: 844 },
] as const;

const browser = await chromium.launch();

for (const { pane, checkpoint } of panes) {
  for (const viewport of viewports) {
    for (const theme of ["dark", "light"] as const) {
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 2,
        reducedMotion: "reduce",
        colorScheme: theme,
      });
      const page = await context.newPage();
      await page.goto(BASE, { waitUntil: "load" });
      await page.evaluate(
        ({ pane, theme }) => {
          document.documentElement.dataset.theme = theme;
          const root = document.querySelector<HTMLElement>(
            "[data-scene-window]",
          );
          if (!root) throw new Error("Scene window missing");
          document
            .querySelector<HTMLElement>(".hero__scroll")
            ?.setAttribute("hidden", "");
          for (const active of root.querySelectorAll(
            "[data-target^='ribbon-'][data-active], [data-target^='pane-'][data-active]",
          )) {
            active.removeAttribute("data-active");
          }
          root
            .querySelector(`[data-target='ribbon-${pane}']`)
            ?.setAttribute("data-active", "");
          root
            .querySelector(`[data-target='pane-${pane}']`)
            ?.setAttribute("data-active", "");
        },
        { pane, theme },
      );
      await page.evaluate(() => document.fonts.ready);
      await page
        .locator("[data-scene-window]")
        .first()
        .screenshot({
          path: `${OUT}${checkpoint}-${viewport.label}-${theme}.png`,
        });
      await context.close();
    }
  }
}

await browser.close();
