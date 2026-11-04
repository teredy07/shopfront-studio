/**
 * Shared-element page transitions: a product's artwork morphs between its catalog card and
 * the product page. A view-transition-name must be unique on the page when a transition
 * starts, so exactly one element carries it at a time.
 */
export const SHARED_MEDIA_NAME = "product-media";

let lastViewedSlug: string | null = null;

/**
 * Called by the product page so that, on history back, the catalog can morph the artwork into the
 * card it came from (the card is marked with data-last-viewed; styles.css names it).
 */
export function rememberViewedProduct(slug: string) {
  lastViewedSlug = slug;
}

export function wasLastViewed(slug: string) {
  return lastViewedSlug === slug;
}

/** Hands the shared name to `element` (the card being opened) and takes it from everything else. */
export function claimSharedMedia(element: HTMLElement | null) {
  if (typeof document === "undefined") return;
  for (const node of document.querySelectorAll<HTMLElement>("[data-shared-media]")) {
    node.style.setProperty("view-transition-name", node === element ? SHARED_MEDIA_NAME : "none");
  }
}
