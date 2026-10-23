import t1 from "@/assets/t1.jpg";
import t2 from "@/assets/t2.jpg";
import t3 from "@/assets/t3.jpg";
import t4 from "@/assets/t4.jpg";

export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string;
  blurb: string;
  specs: string[];
};

export const products: Product[] = [
  { slug: "neon-title-pack", name: "Neon Title Pack", category: "Titles", price: 29, image: t1, blurb: "20 cinematic 3D title animations with light-streak reveals.", specs: ["After Effects 2022+", "4K / 1080p", "No plugins", "Video tutorial"] },
  { slug: "liquid-transitions", name: "Liquid Transitions", category: "Transitions", price: 19, image: t2, blurb: "40 fluid shape transitions. Drag, drop, recolor in one click.", specs: ["After Effects 2021+", "4K", "No plugins", "Color controls"] },
  { slug: "glitch-logo-reveal", name: "Glitch Logo Reveal", category: "Logo", price: 15, image: t3, blurb: "RGB-split glitch reveal for logos and wordmarks.", specs: ["After Effects 2020+", "1080p", "No plugins", "Audio included"] },
  { slug: "creator-overlays", name: "Creator Overlays", category: "Lower thirds", price: 24, image: t4, blurb: "60 lower thirds, social tags and subscribe buttons.", specs: ["After Effects 2022+", "4K", "Essential Graphics", "Easy text edit"] },
];
