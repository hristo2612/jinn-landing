import { chromium } from "@playwright/test";

const BASE = process.env.SHOOT_BASE ?? "http://127.0.0.1:4330/";
const OUT = new URL("../docs/screens/a04/", import.meta.url).pathname;

interface Shot {
  file: string;
  width: number;
  height: number;
  settle: number;
  reducedMotion?: "reduce" | "no-preference";
  javaScriptEnabled?: boolean;
  theme?: "dark" | "light";
}

const shots: Shot[] = [
  { file: "hero-1440-dark.png", width: 1440, height: 900, settle: 2600 },
  { file: "hero-390-dark.png", width: 390, height: 844, settle: 2600 },
  {
    file: "hero-1440-light.png",
    width: 1440,
    height: 900,
    settle: 2600,
    theme: "light",
  },
  {
    file: "hero-390-light.png",
    width: 390,
    height: 844,
    settle: 2600,
    theme: "light",
  },
  {
    file: "hero-1440-reduced-motion.png",
    width: 1440,
    height: 900,
    reducedMotion: "reduce",
    settle: 400,
  },
  {
    file: "hero-1440-nojs.png",
    width: 1440,
    height: 900,
    javaScriptEnabled: false,
    settle: 400,
  },
];

const browser = await chromium.launch();
for (const shot of shots) {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: 2,
    reducedMotion: shot.reducedMotion,
    javaScriptEnabled: shot.javaScriptEnabled ?? true,
    colorScheme: shot.theme ?? "dark",
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "load" });
  if (shot.theme === "light") {
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "light";
    });
  }
  await page.waitForTimeout(shot.settle);
  await page.screenshot({ path: OUT + shot.file });
  await context.close();
  console.log("shot", shot.file);
}
await browser.close();
