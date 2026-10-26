import t1 from "@/assets/t1.jpg";
import ccImg from "@/assets/CC.png";
import t3 from "@/assets/t3.jpg";
import t4 from "@/assets/t4.jpg";
import t1Hover from "@/assets/neon-title-hover.mp4.asset.json";
import noCcImg from "@/assets/no_cc.png";
import topazAfter from "@/assets/topaz-after.png";
import topazBefore from "@/assets/topaz-before-low.jpg";
import comparison1Before from "@/assets/comparison-1-before.png";
import comparison1After from "@/assets/comparison-1-after.png";
import comparison2Before from "@/assets/comparison-2-before.png";
import comparison2After from "@/assets/comparison-2-after.png";
import comparison3Before from "@/assets/comparison-3-before.png";
import comparison3After from "@/assets/comparison-3-after.png";
import comparison4Before from "@/assets/comparison-4-before.png";
import comparison4After from "@/assets/comparison-4-after.png";

export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string;
  hoverVideo?: string;
  compareImage?: string;
  comparisonImages?: Array<{ beforeSrc: string; afterSrc: string }>;
  coverTitle?: string;
  blurb: string;
  description?: string;
  specs: string[];
};

export const products: Product[] = [
  { slug: "neon-title-pack", name: "Topaz Settings (OLD)", category: "Topaz", price: 0, image: comparison1After, hoverVideo: t1Hover.url, coverTitle: "Topaz Settings (OLD)", comparisonImages: [{ beforeSrc: comparison1Before, afterSrc: comparison1After }, { beforeSrc: comparison2Before, afterSrc: comparison2After }, { beforeSrc: comparison3Before, afterSrc: comparison3After }, { beforeSrc: comparison4Before, afterSrc: comparison4After }], blurb: "20 cinematic 3D title animations with light-streak reveals.", specs: ["Topaz 3.1.1", "4K / 1080p"] },
  { slug: "topaz-settings", name: "Topaz Settings", category: "Topaz", price: 5, image: topazAfter, compareImage: topazBefore, blurb: "See the before and after result of the Topaz settings.", specs: ["Topaz 3.1.1 version", "Topaz settings"] },
  { slug: "liquid-transitions", name: "Chihiro", category: "CC", price: 2.5, image: ccImg, compareImage: noCcImg, blurb: "", description: "This pack is non-refundable and may not be redistributed, except where applicable law requires otherwise. By purchasing, you confirm that you are authorized to use the payment method and authorize the full charge for this transaction.\n\nAccess may be denied if you are found to be sharing or leaking the pack, participating in a leak server, using an alternate account to evade restrictions, or otherwise appear to be involved in unauthorized distribution. In these cases, no refund will be provided except where required by applicable law.\n\nPlease review the product details before purchasing. Your statutory consumer rights are not affected by this policy.", specs: ["After Effects 2020+", "Plugins Req: Bcc. Magic Bullet Looks, Sapphire"] },
  { slug: "glitch-logo-reveal", name: "Glitch Logo Reveal", category: "Effects", price: 15, image: t3, blurb: "RGB-split glitch reveal for logos and wordmarks.", specs: ["After Effects 2020+", "1080p", "No plugins", "Audio included"] },
  { slug: "creator-overlays", name: "Creator Overlays", category: "PJF", price: 24, image: t4, blurb: "60 lower thirds, social tags and subscribe buttons.", specs: ["After Effects 2022+", "4K", "Essential Graphics", "Easy text edit"] },
];

export const categories = ["All", "Topaz", "CC", "Effects", "PJF"] as const;
