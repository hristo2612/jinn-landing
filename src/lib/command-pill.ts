/**
 * Progressive enhancement for install-command pills.
 *
 * Without JavaScript the command text is already visible and selectable; this
 * only wires the copy button (clipboard write plus a transient "Copied" state).
 */
const COPIED_LABEL = "Copied";
const RESET_MS = 1400;

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path below.
  }

  const scratch = document.createElement("textarea");
  try {
    scratch.value = text;
    scratch.setAttribute("readonly", "");
    scratch.style.position = "fixed";
    scratch.style.opacity = "0";
    document.body.append(scratch);
    scratch.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    // Always remove the scratch node, even if execCommand throws.
    scratch.remove();
  }
}

export function installCommandPills(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    "[data-command-pill-copy]",
  );

  for (const button of buttons) {
    const pill = button.closest<HTMLElement>("[data-command-pill]");
    const status = pill?.querySelector<HTMLElement>(".command-pill__status");
    const command = button.dataset.command ?? "";
    let timer: ReturnType<typeof setTimeout> | undefined;

    button.addEventListener("click", () => {
      void writeClipboard(command).then((ok) => {
        if (!ok || !pill) return;
        pill.dataset.copied = "true";
        if (status) status.textContent = COPIED_LABEL;
        clearTimeout(timer);
        timer = setTimeout(() => {
          delete pill.dataset.copied;
          if (status) status.textContent = "";
        }, RESET_MS);
      });
    });
  }
}
