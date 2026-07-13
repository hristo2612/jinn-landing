const mobileNavigationQuery = "(max-width: 49.99rem)";

function labelSearchInput(searchRoot: HTMLElement): void {
  const input = searchRoot.querySelector<HTMLInputElement>(
    ".pagefind-ui__search-input",
  );

  input?.setAttribute("aria-label", "Search documentation");
}

function enhanceSearch(): void {
  const searchRoot = document.getElementById("starlight__search");
  if (!searchRoot) return;

  labelSearchInput(searchRoot);
  new MutationObserver(() => labelSearchInput(searchRoot)).observe(searchRoot, {
    childList: true,
    subtree: true,
  });
}

function enhanceOverflowingTables(): void {
  const tables = Array.from(
    document.querySelectorAll<HTMLTableElement>(
      ".sl-markdown-content table:not(:where(.not-content *))",
    ),
  );
  const pageTitle =
    document.querySelector<HTMLElement>("main h1")?.textContent?.trim() ||
    "Documentation";

  tables.forEach((table, index) => {
    const updateOverflowContract = (): void => {
      const isOverflowing = table.scrollWidth > table.clientWidth + 1;

      if (!isOverflowing) {
        table.removeAttribute("tabindex");
        return;
      }

      table.tabIndex = 0;
      table.setAttribute(
        "aria-label",
        tables.length === 1
          ? `${pageTitle} data table`
          : `${pageTitle} data table ${index + 1} of ${tables.length}`,
      );
    };

    updateOverflowContract();
    new ResizeObserver(updateOverflowContract).observe(table);
  });
}

function revealCurrentMobileRoute(menuButton: HTMLButtonElement): void {
  const menu = menuButton.closest("starlight-menu-button");
  if (
    !window.matchMedia(mobileNavigationQuery).matches ||
    menu?.getAttribute("aria-expanded") !== "true"
  ) {
    return;
  }

  const sidebar = document.querySelector<HTMLElement>(".sidebar-pane");
  const currentRoute = sidebar?.querySelector<HTMLElement>(
    'a[aria-current="page"]',
  );
  if (!sidebar || !currentRoute) return;

  const sidebarRect = sidebar.getBoundingClientRect();
  const currentRouteRect = currentRoute.getBoundingClientRect();
  const routeIsVisible =
    currentRouteRect.top >= sidebarRect.top &&
    currentRouteRect.bottom <= sidebarRect.bottom;

  if (routeIsVisible) return;

  sidebar.scrollTop = Math.max(
    0,
    currentRoute.offsetTop -
      (sidebar.clientHeight - currentRoute.offsetHeight) / 2,
  );
}

function enhanceMobileNavigation(): void {
  const menuButton = document.querySelector<HTMLButtonElement>(
    "starlight-menu-button button",
  );
  if (!menuButton) return;

  menuButton.addEventListener("click", () => {
    requestAnimationFrame(() => revealCurrentMobileRoute(menuButton));
  });
}

enhanceSearch();
enhanceOverflowingTables();
enhanceMobileNavigation();
