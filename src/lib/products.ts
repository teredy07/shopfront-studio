import t1 from "@/assets/t1.jpg";
import ccImg from "@/assets/cc.jpg.asset.json";
import t3 from "@/assets/t3.jpg";
import t4 from "@/assets/t4.jpg";
import t1Hover from "@/assets/neon-title-hover.mp4.asset.json";
import noCcImg from "@/assets/no_cc.png.asset.json";

export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string;
  hoverVideo?: string;
  compareImage?: string;
  blurb: string;
  specs: string[];
};

export const products: Product[] = [
  { slug: "neon-title-pack", name: "Neon Title Pack", category: "Topaz", price: 29, image: t1, hoverVideo: t1Hover.url, blurb: "20 cinematic 3D title animations with light-streak reveals.", specs: ["After Effects 2022+", "4K / 1080p", "No plugins", "Video tutorial"] },
  { slug: "liquid-transitions", name: "Liquid Transitions", category: "CC", price: 19, image: ccImg.url, compareImage: noCcImg.url, blurb: "40 fluid shape transitions. Drag, drop, recolor in one click.", specs: ["After Effects 2021+", "4K", "No plugins", "Color controls"] },
  { slug: "glitch-logo-reveal", name: "Glitch Logo Reveal", category: "Effects", price: 15, image: t3, blurb: "RGB-split glitch reveal for logos and wordmarks.", specs: ["After Effects 2020+", "1080p", "No plugins", "Audio included"] },
  { slug: "creator-overlays", name: "Creator Overlays", category: "PJF", price: 24, image: t4, blurb: "60 lower thirds, social tags and subscribe buttons.", specs: ["After Effects 2022+", "4K", "Essential Graphics", "Easy text edit"] },
];

export const categories = ["All", "Topaz", "CC", "Effects", "PJF"] as const;
