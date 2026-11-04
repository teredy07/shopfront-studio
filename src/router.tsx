import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Fetch a page's code and data as soon as a link is hovered or focused.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    // Cross-fade between pages (and morph the product artwork) where the browser supports it.
    // "back" marks history traversals, which restore the catalog's scroll position, so the card
    // the visitor came from is on screen to receive the artwork (see styles.css).
    defaultViewTransition: {
      types: ({ fromLocation, toLocation, pathChanged }) => {
        if (!pathChanged) return false;
        const goingBack =
          fromLocation !== undefined &&
          toLocation.state.__TSR_index < fromLocation.state.__TSR_index;
        return goingBack ? ["page", "back"] : ["page"];
      },
    },
  });

  return router;
};
