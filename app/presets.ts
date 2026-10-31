// いつもの食事に近いものを、1タップで入れる（ホームの先頭と、食事のバランスで共通）
export const PRESETS: { id: string; icon: string; short: string; label: string; vals: Record<string, number> }[] = [
  { id: "wa", icon: "🍙", short: "和食", label: "和食ごはん派", vals: { rice: 3, fish: 2, soy: 2, egg: 1, greenveg: 2, veg: 2, mush: 1, soup: 2, pickle: 1, fruit: 1, milk: 1 } },
  { id: "pan", icon: "🥐", short: "パン・軽め", label: "パン・軽め", vals: { bread: 3, rice: 1, egg: 2, milk: 1, yogurt: 1, fruit: 1, salad: 1, veg: 2, chicken: 1, meat: 1, snack: 1, out: 1, soup: 1 } },
  { id: "men", icon: "🍜", short: "麺・丼・外食", label: "麺・丼・外食が多い", vals: { noodle: 2, rice: 1, out: 2, fried: 1, meat: 1, egg: 1, sugar: 1, veg: 1 } },
  { id: "meat", icon: "🍖", short: "肉・こってり", label: "肉・こってり中心", vals: { rice: 3, meat: 2, chicken: 1, fried: 1, stir: 1, veg: 1, processed: 1, snack: 1 } },
  { id: "healthy", icon: "🥗", short: "ヘルシー", label: "ヘルシー・野菜多め", vals: { brown: 2, rice: 1, fish: 2, chicken: 1, soy: 2, greenveg: 2, veg: 2, salad: 1, mush: 1, fruit: 2, yogurt: 1, milk: 1, soup: 1 } },
];
