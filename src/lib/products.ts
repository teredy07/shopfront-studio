import t1 from "@/assets/t1.jpg";
import ccImg from "@/assets/CC.png";
import t3 from "@/assets/t3.jpg";
import smoothPackPreview from "@/assets/smooth-pack-preview.avif";
import smoothPackPreviewVideo from "@/assets/smooth-pack-preview-video.mp4";
import tenKPackPreview from "@/assets/10k-pack-preview.avif";
import tenKPackVideo from "@/assets/10k-pack-video.mp4";
import tenKPackCc1 from "@/assets/10k-pack-cc1.avif";
import tenKPackCc2 from "@/assets/10k-pack-cc2.avif";
import tenKPackCc3 from "@/assets/10k-pack-cc3.avif";
import newWindowsCcPreview from "@/assets/new-windows-cc-preview.avif";
import qualityCc1 from "@/assets/quality-cc-1.avif";
import qualityCc2 from "@/assets/quality-cc-2.avif";
import qualityCc3 from "@/assets/quality-cc-3.avif";
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
  previewVideo?: string;
  previewSlides?: Array<{ type: "image" | "video" | "youtube"; src: string }>;
  blurb: string;
  description?: string;
  specs: string[];
};

export const products: Product[] = [
  { slug: "neon-title-pack", name: "Topaz Settings (OLD)", category: "Topaz", price: 0, image: comparison1After, hoverVideo: t1Hover.url, coverTitle: "Topaz Settings (OLD)", comparisonImages: [{ beforeSrc: comparison1Before, afterSrc: comparison1After }, { beforeSrc: comparison2Before, afterSrc: comparison2After }, { beforeSrc: comparison3Before, afterSrc: comparison3After }, { beforeSrc: comparison4Before, afterSrc: comparison4After }], blurb: "20 cinematic 3D title animations with light-streak reveals.", specs: ["Topaz 3.1.1", "4K / 1080p"] },
  { slug: "topaz-settings", name: "Topaz Settings", category: "Topaz", price: 5, image: topazAfter, compareImage: topazBefore, blurb: "See the before and after result of the Topaz settings.", specs: ["Topaz 3.1.1 version", "Topaz settings"] },
  { slug: "liquid-transitions", name: "Chihiro", category: "CC", price: 2.5, image: ccImg, compareImage: noCcImg, blurb: "", description: "This pack is non-refundable and may not be redistributed, except where applicable law requires otherwise. By purchasing, you confirm that you are authorized to use the payment method and authorize the full charge for this transaction.\n\nAccess may be denied if you are found to be sharing or leaking the pack, participating in a leak server, using an alternate account to evade restrictions, or otherwise appear to be involved in unauthorized distribution. In these cases, no refund will be provided except where required by applicable law.\n\nPlease review the product details before purchasing. Your statutory consumer rights are not affected by this policy.", specs: ["After Effects 2020+", "Plugins Req: Bcc. Magic Bullet Looks, Sapphire"] },
  { slug: "new-windows", name: "Quality CC", category: "CC", price: 0, image: newWindowsCcPreview, previewSlides: [{ type: "image", src: newWindowsCcPreview }, { type: "image", src: qualityCc1 }, { type: "image", src: qualityCc2 }, { type: "image", src: qualityCc3 }], blurb: "", specs: ["After Effects 2020+", "Plugins needed:", "Magic Bullets Looks"] },
  { slug: "glitch-logo-reveal", name: "Cashvibe Smooth Pack", category: "Packs", price: 0, image: smoothPackPreview, previewVideo: smoothPackPreviewVideo, blurb: "RGB-split glitch reveal for logos and wordmarks.", specs: ["After Effects 2017+", "Plugins needed:", "Magic Bullet Looks", "Sapphire", "BCC", "Twixtor", "Deep Glow", "Twitch", "Glichify", "Topaz Video AI 3.1.10"] },
  {
    slug: "10k-pack",
    name: "10K Pack!",
    category: "Packs",
    price: 0,
    image: tenKPackPreview,
    previewSlides: [
      { type: "image", src: tenKPackPreview },
      { type: "video", src: tenKPackVideo },
      { type: "image", src: tenKPackCc1 },
      { type: "image", src: tenKPackCc2 },
      { type: "image", src: tenKPackCc3 },
    ],
    blurb: "",
    specs: [
      "Softwares:",
      "Topaz Video AI",
      "After Effects 2025",
      "Plugins needed:",
      "Sapphire",
      "BCC",
      "Twixtor Pro",
      "RSMB",
      "Magic Bullet Looks",
      "Omino",
      "Universe",
      "Element 3D",
    ],
  },
];

export const categories = ["All", "Topaz", "CC", "Packs"] as const;
