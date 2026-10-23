import t1 from "@/assets/t1.jpg";
import ccImg from "@/assets/CC.png";
import t3 from "@/assets/t3.jpg";
import t4 from "@/assets/t4.jpg";
import t1Hover from "@/assets/neon-title-hover.mp4.asset.json";
import noCcImg from "@/assets/no_cc.png";
import topazAfter from "@/assets/topaz-after.png";
import topazBefore from "@/assets/topaz-before-low.jpg";

export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string;
  hoverVideo?: string;
  compareImage?: string;
  blurb: string;
  description?: string;
  specs: string[];
};

export const products: Product[] = [
  { slug: "neon-title-pack", name: "Neon Title Pack", category: "Topaz", price: 29, image: t1, hoverVideo: t1Hover.url, blurb: "20 cinematic 3D title animations with light-streak reveals.", specs: ["After Effects 2022+", "4K / 1080p", "No plugins", "Video tutorial"] },
  { slug: "topaz-settings", name: "Topaz Settings", category: "Topaz", price: 29, image: topazAfter, compareImage: topazBefore, blurb: "See the before and after result of the Topaz settings.", specs: ["Before / after comparison", "Topaz settings"] },
  { slug: "liquid-transitions", name: "Chihiro", category: "CC", price: 2.5, image: ccImg, compareImage: noCcImg, blurb: "", description: "This pack is non-refundable and may not be redistributed, except where applicable law requires otherwise. By purchasing, you confirm that you are authorized to use the payment method and authorize the full charge for this transaction.\n\nAccess may be denied if you are found to be sharing or leaking the pack, participating in a leak server, using an alternate account to evade restrictions, or otherwise appear to be involved in unauthorized distribution. In these cases, no refund will be provided except where required by applicable law.\n\nPlease review the product details before purchasing. Your statutory consumer rights are not affected by this policy.", specs: ["After Effects 2021+", "4K", "No plugins", "Color controls"] },
  { slug: "glitch-logo-reveal", name: "Glitch Logo Reveal", category: "Effects", price: 15, image: t3, blurb: "RGB-split glitch reveal for logos and wordmarks.", specs: ["After Effects 2020+", "1080p", "No plugins", "Audio included"] },
  { slug: "creator-overlays", name: "Creator Overlays", category: "PJF", price: 24, image: t4, blurb: "60 lower thirds, social tags and subscribe buttons.", specs: ["After Effects 2022+", "4K", "Essential Graphics", "Easy text edit"] },
];

export const categories = ["All", "Topaz", "CC", "Effects", "PJF"] as const;
