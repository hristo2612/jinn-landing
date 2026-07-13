import { expect, test, type Locator } from "@playwright/test";
import {
  BACKUP_PANE,
  ORG_PANE,
  TODO_RELNOTES,
  TODOS_PANE,
  TRIGGERS_PANE,
  WORKFLOW_PANE,
} from "../../src/lib/scenes/dashboard";

async function expectField(
  root: Locator,
  target: string,
  field: string,
  value: string,
): Promise<void> {
  await expect(
    root.locator(`[data-target='${target}'] [data-field='${field}']`),
  ).toHaveText(value);
}

test.describe("canonical dashboard surfaces", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
  });

  test("renders the org pane from canonical data", async ({ page }) => {
    const root = page.locator("[data-scene-window]").first();
    const pane = root.locator("[data-target='pane-org']");

    await expect(pane.locator("[data-field='header']")).toHaveText(
      ORG_PANE.header,
    );
    for (const employee of ORG_PANE.employees) {
      await expectField(pane, employee.target, "name", employee.name);
      await expectField(pane, employee.target, "role", employee.role);
      await expectField(pane, employee.target, "engine", employee.engine);
      await expect(
        pane.locator(`[data-target='${employee.target}']`),
      ).toHaveAttribute("data-state", employee.presence);
    }
    for (const department of ORG_PANE.departments) {
      await expectField(pane, department.target, "label", department.label);
    }
  });

  test("renders the todos pane from canonical resolved data", async ({
    page,
  }) => {
    const root = page.locator("[data-scene-window]").first();
    const pane = root.locator("[data-target='pane-todos']");

    await expect(pane.locator("[data-field='header']")).toHaveText(
      TODOS_PANE.header,
    );
    await expect(pane.locator("[data-field='segment']")).toHaveText(
      TODOS_PANE.segments,
    );
    for (const card of TODOS_PANE.cards) {
      const cardRoot = pane.locator(`[data-target='${card.target}']`);
      await expect(cardRoot).toHaveAttribute("data-state", card.status);
      await expect(cardRoot.locator("[data-field='title']")).toHaveText(
        card.title,
      );
      await expect(cardRoot.locator("[data-field='owner']")).toHaveText(
        card.owner,
      );
      if (card.cost) {
        await expect(cardRoot.locator("[data-field='cost']")).toHaveText(
          card.cost,
        );
      }
      if (card.badge) {
        await expect(cardRoot.locator("[data-field='badge']")).toHaveText(
          card.badge,
        );
      }
      if (card.exec) {
        await expect(cardRoot.locator("[data-field='exec']")).toHaveText(
          card.exec,
        );
      }
      if (card.age) {
        await expect(cardRoot.locator("[data-field='age']")).toHaveText(
          card.age,
        );
      }
    }
  });

  test("renders the workflow pane parked at the honest approval gate", async ({
    page,
  }) => {
    const root = page.locator("[data-scene-window]").first();
    const pane = root.locator("[data-target='pane-flows']");

    await expect(pane.locator("[data-field='header']")).toHaveText(
      WORKFLOW_PANE.header,
    );
    await expect(pane.locator("[data-field='badge']")).toHaveText(
      WORKFLOW_PANE.badge,
    );
    await expect(pane.locator("[data-target='flow-trigger']")).toHaveText(
      WORKFLOW_PANE.trigger,
    );
    await expect(pane.locator("[data-target='rail']")).toHaveAttribute(
      "data-progress",
      String(WORKFLOW_PANE.progress),
    );
    for (const step of WORKFLOW_PANE.steps) {
      const stepRoot = pane.locator(`[data-target='${step.target}']`);
      await expect(stepRoot).toHaveAttribute("data-state", step.status);
      await expect(stepRoot.locator("[data-field='title']")).toHaveText(
        step.title,
      );
      await expect(stepRoot.locator("[data-field='status']")).toHaveText(
        step.detail,
      );
    }

    await expect(pane.locator("[data-target='step-post']")).toHaveAttribute(
      "data-state",
      "queued",
    );
    await expect(pane.locator("[data-field='badge']")).toHaveText("Running");
    expect(WORKFLOW_PANE.progress).toBe(2 / 3);
  });

  test("renders the trigger bindings and resulting run from canonical data", async ({
    page,
  }) => {
    const root = page.locator("[data-scene-window]").first();
    const pane = root.locator("[data-target='pane-triggers']");

    await expect(pane.locator("[data-field='header']")).toHaveText(
      TRIGGERS_PANE.header,
    );
    for (const binding of TRIGGERS_PANE.bindings) {
      const bindingRoot = pane.locator(`[data-target='${binding.target}']`);
      await expect(bindingRoot).toHaveAttribute("data-state", binding.status);
      await expect(bindingRoot.locator("[data-field='title']")).toHaveText(
        binding.title,
      );
      await expect(bindingRoot.locator("[data-field='detail']")).toHaveText(
        binding.detail,
      );
      await expect(bindingRoot.locator("[data-field='kind']")).toHaveText(
        binding.kind,
      );
      if (binding.fired) {
        await expect(bindingRoot.locator("[data-field='fired']")).toHaveText(
          binding.fired,
        );
      }
    }
    await expect(pane.locator("[data-target='run-row']")).toHaveText(
      TRIGGERS_PANE.run,
    );
  });

  test("keeps every fake surface control outside the tab order", async ({
    page,
  }) => {
    const root = page.locator("[data-scene-window]").first();
    await expect(
      root.locator(
        "[data-scene-frame] a, [data-scene-frame] button, [data-scene-frame] input, [data-scene-frame] select, [data-scene-frame] textarea, [data-scene-frame] [tabindex]",
      ),
    ).toHaveCount(0);
  });

  test("serializes every desktop and mobile surface root exactly from canonical data", async ({
    page,
  }) => {
    const expected = {
      org: {
        header: ORG_PANE.header,
        targets: [
          "node-coo",
          "org-branch",
          "dept-platform",
          "node-dev",
          "node-designer",
          "dept-growth",
          "node-analyst",
          "node-writer",
        ],
        rows: ORG_PANE.employees.map(
          ({ target, name, role, engine, presence }) => ({
            target,
            state: presence,
            fields: { name, role, engine },
          }),
        ),
        groups: ORG_PANE.departments.map(
          ({ target, label, tone, employeeTargets }) => ({
            target,
            tone,
            label,
            employeeTargets: [...employeeTargets],
          }),
        ),
      },
      todos: {
        header: TODOS_PANE.header,
        segments: [...TODOS_PANE.segments],
        targets: [
          "card-relnotes",
          "card-relnotes-disc",
          "card-relnotes-exec",
          "card-142",
          "card-142-disc",
          "card-142-exec",
          "card-funnel",
          "card-changelog",
          "card-keys",
        ],
        rows: [
          // The ambient card ships mounted (hidden); its state lives solely
          // on its disc target and its exec strings are replace-text
          // payloads, not fields.
          {
            target: TODO_RELNOTES.target,
            state: null as string | null,
            fields: { title: TODO_RELNOTES.title, owner: TODO_RELNOTES.owner },
          },
          ...TODOS_PANE.cards.map((card) => ({
            target: card.target,
            state: card.status,
            fields: Object.fromEntries(
              ["title", "owner", "cost", "badge", "exec", "age"]
                .filter(
                  (field) => card[field as keyof typeof card] !== undefined,
                )
                .map((field) => [
                  field,
                  String(card[field as keyof typeof card]),
                ]),
            ),
          })),
        ],
      },
      flows: {
        header: WORKFLOW_PANE.header,
        badge: WORKFLOW_PANE.badge,
        trigger: WORKFLOW_PANE.trigger,
        progress: String(WORKFLOW_PANE.progress),
        targets: [
          "run-badge",
          "flow-trigger",
          "flow-rail",
          "rail",
          "step-collect",
          "step-draft",
          "step-draft-status",
          "step-gate",
          "step-gate-status",
          "step-post",
          "bk-badge",
          "bk-trigger",
          "bk-rail",
          "bk-fill",
          "step-snapshot",
          "step-snapshot-status",
          "step-prune",
          "step-prune-status",
          "step-verify",
          "step-verify-status",
        ],
        rows: [
          ...WORKFLOW_PANE.steps.map(({ target, title, detail, status }) => ({
            target,
            state: status,
            fields: { title, status: detail },
          })),
          // The hidden backup variant ships at its authored initial state;
          // its status lines are scene text targets, not data fields.
          ...BACKUP_PANE.steps.map(({ target, title, initialStatus }) => ({
            target,
            state: initialStatus,
            fields: { title },
          })),
        ],
      },
      triggers: {
        header: TRIGGERS_PANE.header,
        run: TRIGGERS_PANE.run,
        targets: [
          "binding-cron",
          "run-row",
          "binding-todo",
          "binding-webhook",
          "run-row-refund",
        ],
        rows: TRIGGERS_PANE.bindings.map((binding) => ({
          target: binding.target,
          state: binding.status,
          fields: Object.fromEntries(
            ["title", "detail", "kind", "fired"]
              .filter(
                (field) => binding[field as keyof typeof binding] !== undefined,
              )
              .map((field) => [
                field,
                String(binding[field as keyof typeof binding]),
              ]),
          ),
        })),
      },
    };

    const roots = [
      {
        locator: page.locator("[data-scene-window][data-scene-id='employees']"),
        panes: ["org"],
      },
      {
        locator: page.locator("[data-scene-window][data-scene-id='todos']"),
        panes: ["todos"],
      },
      {
        locator: page.locator(
          "[data-scene-window][data-scene-id='workflow-approval']",
        ),
        panes: ["flows"],
      },
      {
        locator: page.locator(
          "[data-scene-window][data-scene-id='trigger-fire']",
        ),
        panes: ["triggers"],
      },
    ] as const;

    for (const { locator, panes } of roots) {
      for (const pane of panes) {
        const serialized = await locator.evaluate((root, surfaceName) => {
          const surface = root.querySelector<HTMLElement>(
            `[data-surface='${surfaceName}']`,
          )!;
          const text = (selector: string, within: ParentNode = surface) =>
            within.querySelector<HTMLElement>(selector)?.textContent?.trim() ??
            "";
          const fields = (within: ParentNode) =>
            Object.fromEntries(
              Array.from(within.querySelectorAll<HTMLElement>("[data-field]"))
                .filter(
                  (node) =>
                    !node.closest("[data-target]") ||
                    node.closest("[data-target]") === within,
                )
                .map((node) => [
                  node.dataset.field!,
                  node.textContent?.trim() ?? "",
                ]),
            );
          const targets = Array.from(
            surface.querySelectorAll<HTMLElement>("[data-target]"),
            (node) => node.dataset.target!,
          );

          if (surfaceName === "org") {
            return {
              header: text("[data-field='header']"),
              targets,
              rows: Array.from(
                surface.querySelectorAll<HTMLElement>(
                  ".org__node[data-target]",
                ),
                (node) => ({
                  target: node.dataset.target!,
                  state: node.dataset.state!,
                  fields: fields(node),
                }),
              ),
              groups: Array.from(
                surface.querySelectorAll<HTMLElement>(".org__department"),
                (group) => ({
                  target: group.dataset.target!,
                  tone: group.dataset.tone!,
                  label: text("[data-field='label']", group),
                  employeeTargets: Array.from(
                    group.querySelectorAll<HTMLElement>(
                      ".org__node[data-target]",
                    ),
                    (node) => node.dataset.target!,
                  ),
                }),
              ),
            };
          }
          if (surfaceName === "todos") {
            return {
              header: text("[data-field='header']"),
              segments: Array.from(
                surface.querySelectorAll<HTMLElement>("[data-field='segment']"),
                (node) => node.textContent?.trim() ?? "",
              ),
              targets,
              rows: Array.from(
                surface.querySelectorAll<HTMLElement>(".todos__card"),
                (node) => ({
                  target: node.dataset.target!,
                  // The ambient relnotes card carries no card-level state:
                  // its single-owner state lives on its disc target.
                  state: node.dataset.state ?? null,
                  fields: fields(node),
                }),
              ),
            };
          }
          if (surfaceName === "flows") {
            return {
              header: text("[data-field='header']"),
              badge: text("[data-field='badge']"),
              trigger: text("[data-target='flow-trigger']").replace(/^\s+/, ""),
              progress: surface.querySelector<HTMLElement>(
                "[data-target='rail']",
              )!.dataset.progress!,
              targets,
              rows: Array.from(
                surface.querySelectorAll<HTMLElement>(".workflow__step"),
                (node) => ({
                  target: node.dataset.target!,
                  state: node.dataset.state!,
                  fields: fields(node),
                }),
              ),
            };
          }
          return {
            header: text("[data-field='header']"),
            run: text("[data-target='run-row']"),
            targets,
            rows: Array.from(
              surface.querySelectorAll<HTMLElement>(".triggers__binding"),
              (node) => ({
                target: node.dataset.target!,
                state: node.dataset.state!,
                fields: fields(node),
              }),
            ),
          };
        }, pane);
        expect(serialized).toEqual(expected[pane]);
      }
    }
  });
});
