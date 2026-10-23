import t1 from "@/assets/t1.jpg";
import t2 from "@/assets/t2.jpg";
import t3 from "@/assets/t3.jpg";
import t4 from "@/assets/t4.jpg";
import t1Hover from "@/assets/neon-title-hover.mp4.asset.json";

export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string;
  hoverVideo?: string;
  blurb: string;
  specs: string[];
};

export const products: Product[] = [
  { slug: "neon-title-pack", name: "Neon Title Pack", category: "Topaz", price: 29, image: t1, hoverVideo: t1Hover.url, blurb: "20 cinematic 3D title animations with light-streak reveals.", specs: ["After Effects 2022+", "4K / 1080p", "No plugins", "Video tutorial"] },
  { slug: "liquid-transitions", name: "Liquid Transitions", category: "CC", price: 19, image: t2, blurb: "40 fluid shape transitions. Drag, drop, recolor in one click.", specs: ["After Effects 2021+", "4K", "No plugins", "Color controls"] },
  { slug: "glitch-logo-reveal", name: "Glitch Logo Reveal", category: "Effects", price: 15, image: t3, blurb: "RGB-split glitch reveal for logos and wordmarks.", specs: ["After Effects 2020+", "1080p", "No plugins", "Audio included"] },
  { slug: "creator-overlays", name: "Creator Overlays", category: "PJF", price: 24, image: t4, blurb: "60 lower thirds, social tags and subscribe buttons.", specs: ["After Effects 2022+", "4K", "Essential Graphics", "Easy text edit"] },
  ...[
    ["cinematic-cc-pack", "Cinematic CC Pack", 22, t1, "Teal & orange film looks for any footage."],
    ["vintage-film-cc", "Vintage Film CC", 18, t3, "Warm faded tones with subtle grain."],
    ["moody-dark-cc", "Moody Dark CC", 17, t4, "Deep shadows and crushed blacks for edits."],
    ["pastel-dream-cc", "Pastel Dream CC", 16, t2, "Soft pastel grades for aesthetic edits."],
    ["anime-vibrant-cc", "Anime Vibrant CC", 20, t1, "Punchy saturated colors for anime edits."],
    ["black-white-cc", "Black & White CC", 12, t3, "High-contrast monochrome looks."],
  ].map(([slug, name, price, image, blurb]) => ({
    slug: slug as string, name: name as string, category: "CC", price: price as number, image: image as string, blurb: blurb as string,
    specs: ["After Effects 2020+", "Adjustment layer", "No plugins", "Intensity slider"],
  })),
];

export const categories = ["All", "Topaz", "CC", "Effects", "PJF"] as const;
