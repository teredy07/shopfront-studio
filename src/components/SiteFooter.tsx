import { Link } from "@tanstack/react-router";

import { categories } from "@/lib/products";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-14 sm:px-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="max-w-sm">
          <Link to="/" className="font-display text-2xl font-extrabold text-foreground">
            ca<span className="text-gold">$</span>hvibe
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            After Effects packs, ColorCorrection and Topaz settings for editors and creators.
          </p>
        </div>
        <nav aria-label="Browse packs">
          <p className="eyebrow">Browse</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
            {categories.map((category) => (
              <li key={category}>
                <Link
                  to="/"
                  search={category === "All" ? {} : { category }}
                  hash="packs"
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  {category === "All" ? "All packs" : category}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} cashvibe. All rights reserved.</p>
          <p>Prices shown in EUR.</p>
        </div>
      </div>
    </footer>
  );
}
