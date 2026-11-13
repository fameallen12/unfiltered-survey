export type QType = "multi" | "single" | "rating" | "text";
export interface Question {
  key: string; // maps to DB column
  title: string;
  prompt: string;
  type: QType;
  options?: string[];
  required: boolean;
}

export const QUESTIONS: Question[] = [
  { key: "creative_category", title: "About you", prompt: "What best describes you?", type: "multi", required: true,
    options: ["Graphic Designer","Photographer","Videographer / Filmmaker","Content Creator","Illustrator / Digital Artist","UI/UX Designer","Social Media Manager","Brand / Marketing Professional","Student / Beginner Creative","Other"] },
  { key: "usage_frequency", title: "Resource usage", prompt: "How often do you use external creative resources such as stock photos, textures, mockups or templates?", type: "single", required: true,
    options: ["Daily","Several times a week","Once a week","Occasionally","Rarely","Never"] },
  { key: "platforms", title: "Current platforms", prompt: "Where do you currently get your creative resources?", type: "multi", required: true,
    options: ["Freepik","Envato Elements","Adobe Stock","Shutterstock","Unsplash","Pexels","Pixabay","Pinterest","Google Images","Social media communities","Other platforms","I create everything myself"] },
  { key: "challenges", title: "Challenges", prompt: "What challenges do you experience when searching for or purchasing creative resources?", type: "multi", required: true,
    options: ["Expensive resources","Difficulty finding quality resources","Limited African-focused or culturally relevant visuals","Unclear licensing and usage rights","Difficulty making payments","Limited access to suitable free resources","Difficulty finding specific mockups, textures or backgrounds","Other"] },
  { key: "usefulness_rating", title: "Marketplace relevance", prompt: "If there were a marketplace where you could discover and purchase individual creative assets, how useful would it be to you?", type: "rating", required: true },
  { key: "asset_categories", title: "Asset preferences", prompt: "Which types of resources would you most likely use or purchase?", type: "multi", required: true,
    options: ["Stock photographs","African lifestyle and cultural photographs","Textures and backgrounds","Mockups","Social media templates","Branding and graphic design resources","Illustrations and vectors","Icons and design elements","Video footage","Other"] },
  { key: "desired_features", title: "Desired features", prompt: "Which features would you like UNFILTERED to offer?", type: "multi", required: true,
    options: ["Advanced search and filters","Categories and curated collections","Preview before purchasing","Personal and commercial licences","Affordable individual asset purchases","Purchase and download history","Favourites and saved collections","Discount codes and promotions","Creator profiles and portfolios","Ability for creatives to upload and sell resources","Customer reviews and ratings","Other"] },
  { key: "payment_methods", title: "Payment preferences", prompt: "Which payment methods would you prefer?", type: "multi", required: true,
    options: ["Mobile Money","Debit / Credit Cards","PayPal","Bank Transfer","Other"] },
  { key: "price_range", title: "Pricing", prompt: "What would you consider a reasonable price for a single high-quality creative asset?", type: "single", required: true,
    options: ["Less than $1","$1–$3","$4–$6","$7–$10","More than $10","It depends on the asset and its quality"] },
  { key: "open_feedback", title: "Open feedback", prompt: "What is one thing you would love to see on UNFILTERED, or one recommendation you have for making it genuinely valuable to creatives?", type: "text", required: false },
];

export type Answers = Record<string, string | string[] | number | undefined>;
export const MAX_TEXT = 1500;

/** Shared by client and server. Returns an error message, or null if valid. */
export function validateAnswer(q: Question, v: unknown): string | null {
  if (q.type === "text") {
    if (v == null || v === "") return q.required ? "Please answer this question." : null;
    return typeof v === "string" && v.length <= MAX_TEXT ? null : `Keep your answer under ${MAX_TEXT} characters.`;
  }
  if (q.type === "rating") {
    return Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5 ? null : "Pick a rating from 1 to 5.";
  }
  if (q.type === "single") {
    return typeof v === "string" && q.options!.includes(v) ? null : "Choose one option.";
  }
  if (!Array.isArray(v) || v.length === 0) return "Choose at least one option.";
  const ok = v.length <= q.options!.length && new Set(v).size === v.length && v.every((x) => typeof x === "string" && q.options!.includes(x));
  return ok ? null : "Invalid selection.";
}
