// かんたん入力の、共通の部品（ホームと、トレーナー用で使う）。
import { U } from "../app/BalanceCheck";
import { amountOf } from "./microLookup";
import { foodOfKey, isFoodKey, portionOf, registerFood } from "./foodunits";

export type Tile = { id: string; icon: string; label: string; vals: Record<string, number>; cat?: string };
export type Slot = { id: string; icon: string; label: string; tiles: Tile[] };

const T = (id: string, icon: string, label: string, vals: Record<string, number>, cat: string): Tile => ({ id, icon, label, vals, cat });
const NONE = (id: string, label: string): Tile => ({ id, icon: "⭕", label, vals: {}, cat: "定番" });

// 昼・夜で、共通の、メニュー（外食・料理の種類）。量は「ふつうの1人前」の目安。食品の組み合わせからの計算で、店・量で、ずれます。
const MAIN: [string, string, string, Record<string, number>, string][] = [
  ["teishoku-tonkatsu", "🍱", "とんかつ定食", { rice: 1, fried: 1.5, salad: 1, soup: 1 }, "和食"],
  ["teishoku-shoga", "🍱", "生姜焼き定食", { rice: 1, meat: 1, stir: 0.5, veg: 1, soup: 1 }, "和食"],
  ["teishoku-karaage", "🍱", "から揚げ定食", { rice: 1, fried: 1.5, salad: 1, soup: 1 }, "和食"],
  ["nimono", "🍲", "煮物・おでん定食", { rice: 1, soy: 1, rootveg: 1, egg: 1, soup: 1 }, "和食"],
  ["sushi", "🍣", "寿司（8〜10貫）", { rice: 1.5, fish: 1.5, out: 0.5 }, "和食"],
  ["tendon", "🍤", "天丼・天ぷら定食", { rice: 2, fried: 1, out: 1 }, "和食"],
  ["pasta-tomato", "🍝", "パスタ（トマト・オイル系）", { noodle: 1, out: 0.5 }, "洋食・イタリアン"],
  ["pasta-cream", "🍝", "パスタ（クリーム・カルボナーラ）", { noodle: 1, stir: 1, processed: 0.5, out: 1 }, "洋食・イタリアン"],
  ["pasta-meat", "🍝", "パスタ（ミートソース）", { noodle: 1, meat: 0.5, out: 0.5 }, "洋食・イタリアン"],
  ["pizza", "🍕", "ピザ（3切れ）", { bread: 2, yogurt: 1.5, processed: 1, out: 1 }, "洋食・イタリアン"],
  ["risotto", "🍚", "リゾット・ドリア", { rice: 1.5, yogurt: 1, stir: 0.5, out: 1 }, "洋食・イタリアン"],
  ["italian-set", "🥗", "イタリアン（前菜サラダ＋パスタ少なめ＋魚）", { salad: 1, noodle: 0.7, fish: 1, veg: 1 }, "洋食・イタリアン"],
  ["hamburg", "🍔", "ハンバーグ定食", { rice: 1, meat: 1, stir: 0.5, veg: 1, soup: 1 }, "洋食・イタリアン"],
  ["omurice", "🍳", "オムライス", { rice: 2, egg: 2, stir: 0.5, out: 0.5 }, "洋食・イタリアン"],
  ["stew", "🥘", "シチュー・グラタン＋パン", { yogurt: 1, veg: 1, meat: 0.5, stir: 0.5, bread: 1, out: 1 }, "洋食・イタリアン"],
  ["steak", "🥩", "ステーキ・グリル（サラダ・ごはん）", { meat: 1.5, salad: 1, rice: 1 }, "洋食・イタリアン"],
  ["chahan", "🍚", "チャーハン", { rice: 2, egg: 1, stir: 1, out: 0.5 }, "中華"],
  ["gyoza", "🥟", "餃子定食（6個）", { rice: 1, meat: 0.5, stir: 1, veg: 0.5, soup: 1, out: 0.5 }, "中華"],
  ["mabo", "🍛", "麻婆豆腐定食", { rice: 1, soy: 1.5, stir: 1, soup: 1, out: 0.5 }, "中華"],
  ["chukadon", "🥘", "中華丼・八宝菜", { rice: 1.5, seafood: 0.5, veg: 2, stir: 0.5, out: 0.5 }, "中華"],
  ["subuta", "🍖", "酢豚・揚げ物の中華定食", { rice: 1, meat: 0.5, fried: 1, veg: 0.5, soup: 1 }, "中華"],
  ["tanmen", "🍜", "タンメン（野菜たっぷりの麺）", { noodle: 1, veg: 2, out: 0.5 }, "中華"],
  ["dimsum", "🥢", "点心・飲茶（蒸し料理）", { meat: 0.5, seafood: 0.5, veg: 1, soy: 0.5, rice: 0.5 }, "中華"],
  ["bibimbap", "🍲", "ビビンバ", { rice: 1.5, egg: 1, greenveg: 1, veg: 1, meat: 0.5, out: 0.5 }, "韓国・焼肉"],
  ["sundubu", "🍲", "スンドゥブ（豆腐チゲ）＋ごはん", { rice: 1, soy: 1.5, seafood: 0.5, veg: 1, out: 0.5 }, "韓国・焼肉"],
  ["yakiniku", "🥓", "焼肉（肉・野菜・ごはん）", { rice: 1, meat: 2, veg: 1, salad: 1, out: 0.5 }, "韓国・焼肉"],
  ["yakiniku-lean", "🥩", "焼肉（赤身中心・野菜多め）", { rice: 1, meat: 1.5, veg: 2, salad: 1 }, "韓国・焼肉"],
  ["chijimi", "🥞", "チヂミ・ナムル＋ごはん", { veg: 1.5, egg: 1, stir: 0.5, rice: 1 }, "韓国・焼肉"],
  ["ramen", "🍜", "ラーメン", { noodle: 1.2, processed: 0.5, out: 1 }, "麺・丼"],
  ["tsukemen", "🍜", "つけ麺", { noodle: 1.5, processed: 0.5, out: 1 }, "麺・丼"],
  ["udon", "🍜", "かけうどん・そば", { noodle: 1, soy: 0.3 }, "麺・丼"],
  ["yakisoba", "🍝", "焼きそば", { noodle: 1, stir: 1, veg: 0.5, processed: 0.5 }, "麺・丼"],
  ["gyudon", "🍚", "牛丼", { rice: 2, meat: 1, out: 1 }, "麺・丼"],
  ["oyakodon", "🍳", "親子丼", { rice: 2, chicken: 1, egg: 1.5, out: 0.5 }, "麺・丼"],
  ["katsudon", "🍳", "カツ丼", { rice: 2, fried: 1, egg: 1, out: 0.5 }, "麺・丼"],
  ["curry", "🍛", "カレーライス", { rice: 2, stir: 1.5, veg: 0.5, meat: 0.5, out: 0.5 }, "麺・丼"],
  ["burger", "🍔", "ハンバーガー＋ポテト", { bread: 2, meat: 1, fried: 1.5, out: 1 }, "ファスト・カフェ"],
  ["fried-chicken", "🍗", "フライドチキン・ナゲット", { fried: 2, bread: 0.5, out: 1 }, "ファスト・カフェ"],
  ["cafe-sand", "🥪", "カフェのサンドイッチ＋ラテ", { bread: 2, egg: 1, milk: 1, out: 0.5 }, "ファスト・カフェ"],
  ["cafe-pasta", "🍝", "カフェランチ（パスタ＋サラダ）", { noodle: 1, salad: 1, out: 1 }, "ファスト・カフェ"],
  ["bowl", "🥗", "サラダボウル（チキン・野菜・穀物）", { salad: 2, chicken: 1, brown: 1, veg: 1 }, "ファスト・カフェ"],
  ["salad-only", "🥗", "サラダだけ", { salad: 2, veg: 1 }, "軽め"],
  ["soup-salad", "🥣", "スープ＋サラダ", { soup: 1, salad: 1, veg: 1 }, "軽め"],
  ["tofu-light", "🫘", "豆腐・納豆＋野菜（軽め）", { soy: 2, veg: 2, rice: 0.5 }, "軽め"],
  ["shake", "🥤", "プロテイン・牛乳＋バナナ", { milk: 1, fruit: 1, nuts: 0.5 }, "軽め"],
  ["juice-only", "🧃", "ジュース・ゼリーだけ", { sugar: 1.5 }, "軽め"],
  ["veg-juice", "🥬", "野菜ジュース・スープだけ", { veg: 1, sugar: 0.3, soup: 0.5 }, "軽め"],
  ["saba-misoni", "🐟", "さばの味噌煮定食", { rice: 1, fish: 1.2, veg: 1, soup: 1 }, "和食"],
  ["sashimi", "🍣", "刺身定食", { rice: 1, fish: 1.2, soy: 0.5, soup: 1 }, "和食"],
  ["yakizakana", "🐟", "焼き魚定食（あじ・さんま）", { rice: 1, fish: 1, veg: 1, soup: 1, pickle: 0.5 }, "和食"],
  ["tempura-soba", "🍜", "天ぷらそば", { noodle: 1, fried: 1, out: 0.5 }, "和食"],
  ["sukiyaki", "🍲", "すき焼き・しゃぶしゃぶ", { meat: 1.5, veg: 2, soy: 0.5, mush: 0.5, rice: 1 }, "和食"],
  ["onigiri-soup", "🍙", "おにぎり2個＋みそ汁", { rice: 2, soup: 1 }, "和食"],
  ["omelet", "🍳", "オムレツ＋パン＋サラダ", { egg: 2, bread: 1, salad: 1 }, "洋食・イタリアン"],
  ["hayashi", "🍛", "ハヤシライス", { rice: 2, meat: 0.7, stir: 1, out: 0.5 }, "洋食・イタリアン"],
  ["gratin", "🧀", "マカロニグラタン", { noodle: 0.8, yogurt: 1, stir: 0.5, out: 1 }, "洋食・イタリアン"],
  ["fish-fry", "🍤", "白身魚のフライ定食", { rice: 1, fried: 1, salad: 1, soup: 1 }, "洋食・イタリアン"],
  ["roastchicken", "🍗", "ローストチキン＋サラダ＋パン", { chicken: 1.5, salad: 1, bread: 1 }, "洋食・イタリアン"],
  ["caprese", "🥗", "カプレーゼ・サラダ＋パン", { salad: 1.5, yogurt: 1, bread: 1 }, "洋食・イタリアン"],
  ["pasta-seafood", "🍝", "パスタ（海鮮・ボンゴレ）", { noodle: 1, seafood: 1, out: 0.5 }, "洋食・イタリアン"],
  ["hoikoro", "🍖", "回鍋肉定食", { rice: 1, meat: 1, veg: 1.5, stir: 1, soup: 1, out: 0.5 }, "中華"],
  ["ebichili", "🍤", "エビチリ定食", { rice: 1, seafood: 1, stir: 1, soup: 1, out: 0.5 }, "中華"],
  ["tenshin", "🍳", "天津飯", { rice: 2, egg: 2, stir: 0.5, out: 0.5 }, "中華"],
  ["tantan", "🍜", "担々麺", { noodle: 1, meat: 0.5, stir: 1, out: 1 }, "中華"],
  ["champon", "🍜", "ちゃんぽん", { noodle: 1, seafood: 0.5, veg: 1.5, out: 1 }, "中華"],
  ["hiyashi", "🍜", "冷やし中華", { noodle: 1, egg: 0.5, veg: 1, processed: 0.5, out: 0.5 }, "中華"],
  ["samgye", "🍲", "参鶏湯", { chicken: 1.5, rice: 1, out: 0.5 }, "韓国・焼肉"],
  ["kimbap", "🍙", "キンパ（海苔巻き）", { rice: 2, egg: 0.5, veg: 1, out: 0.5 }, "韓国・焼肉"],
  ["reimen", "🍜", "冷麺", { noodle: 1, egg: 0.5, meat: 0.5, out: 0.5 }, "韓国・焼肉"],
  ["bulgogi", "🥩", "プルコギ定食", { rice: 1, meat: 1, veg: 1.5, stir: 0.5, out: 0.5 }, "韓国・焼肉"],
  ["kamatama", "🍜", "釜玉うどん", { noodle: 1, egg: 1 }, "麺・丼"],
  ["soumen", "🍜", "そうめん・ざるそば", { noodle: 0.8, veg: 0.3 }, "麺・丼"],
  ["unadon", "🍚", "うな丼", { rice: 2, fish: 1, out: 0.5 }, "麺・丼"],
  ["kaisendon", "🍣", "海鮮丼", { rice: 2, fish: 1.5, out: 0.5 }, "麺・丼"],
  ["butadon", "🍚", "豚丼", { rice: 2, meat: 1, out: 0.5 }, "麺・丼"],
  ["mapodon", "🍚", "麻婆丼", { rice: 2, soy: 1.5, stir: 1, out: 0.5 }, "麺・丼"],
  ["hotdog", "🌭", "ホットドッグ＋ポテト", { bread: 1.5, processed: 1, fried: 1, out: 1 }, "ファスト・カフェ"],
  ["subway", "🥖", "野菜多めのサンド（チキン）", { bread: 2, chicken: 1, salad: 1.5, out: 0.5 }, "ファスト・カフェ"],
  ["onepate", "🍽", "ワンプレートランチ（カフェ）", { rice: 1, chicken: 1, veg: 1.5, soup: 0.5, out: 0.5 }, "ファスト・カフェ"],
  ["gyudon-set", "🍚", "牛丼セット（サラダ・みそ汁）", { rice: 2, meat: 1, salad: 1, soup: 1, out: 0.5 }, "ファスト・カフェ"],
  ["onigiri-egg", "🍙", "おにぎり＋ゆで卵", { rice: 1, egg: 1 }, "軽め"],
  ["salad-chicken", "🥗", "サラダチキン＋サラダ", { chicken: 1, salad: 2 }, "軽め"],
  ["fruit-only", "🍎", "果物だけ", { fruit: 2 }, "軽め"],
  ["yogurt-nuts", "🥛", "ヨーグルト＋ナッツ", { yogurt: 1, nuts: 0.5 }, "軽め"],
  ["soup-only", "🍲", "具だくさんの汁物だけ", { soup: 1.5, veg: 1, soy: 0.5 }, "軽め"],
  ["z-buridaikon", "🐟", "ぶり大根定食", { rice: 1, fish: 1.2, rootveg: 1, soup: 1 }, "和食"],
  ["z-shogayaki", "🍖", "豚の生姜焼き定食", { rice: 1, meat: 1.2, salad: 1, soup: 1, base: 1 }, "和食"],
  ["z-tonkatsu", "🍤", "とんかつ定食", { rice: 1, fried: 1.5, salad: 1, soup: 1 }, "和食"],
  ["z-karaage", "🍗", "から揚げ定食", { rice: 1, fried: 1.5, salad: 1, soup: 1 }, "和食"],
  ["z-nikujaga", "🥔", "肉じゃが定食", { rice: 1, meat: 0.7, imo: 1.5, soup: 1 }, "和食"],
  ["z-tofusteak", "🫘", "豆腐ハンバーグ定食", { rice: 1, soy: 1.5, veg: 1, soup: 1 }, "和食"],
  ["z-saba-shio", "🐟", "さばの塩焼き定食", { rice: 1, fish: 1.3, pickle: 1, soup: 1 }, "和食"],
  ["z-chawan", "🥚", "茶碗蒸し＋ごはん＋小鉢", { rice: 1, egg: 1, veg: 1, soup: 1 }, "和食"],
  ["z-oden", "🍢", "おでん（大根・卵・こんにゃく）＋ごはん", { rice: 1, konjac: 1, egg: 1, rootveg: 1, processed: 0.5 }, "和食"],
  ["z-okonomi", "🥞", "お好み焼き", { noodle: 0.5, egg: 1, veg: 1.5, processed: 0.7, stir: 1 }, "和食"],
  ["z-takoyaki", "🐙", "たこ焼き（8個）", { noodle: 0.7, seafood: 0.5, fried: 0.5 }, "和食"],
  ["z-sushi-set", "🍣", "握り寿司（8貫）＋汁", { rice: 1.8, fish: 1.2, soup: 1 }, "和食"],
  ["z-chirashi", "🍣", "ちらし寿司", { rice: 1.8, fish: 1, egg: 0.5, veg: 0.5 }, "和食"],
  ["z-teishoku-vegi", "🥗", "野菜たっぷり定食（蒸し鶏・小鉢3つ）", { brown: 1, chicken: 1, greenveg: 1, veg: 1, mush: 1, soup: 1 }, "和食"],
  ["z-doria", "🍚", "ドリア", { rice: 1.8, milk: 1, yogurt: 1, meat: 0.3, out: 1 }, "洋食・イタリアン"],
  ["z-omurice", "🍳", "オムライス", { rice: 1.8, egg: 2, chicken: 0.5, base: 1, out: 0.5 }, "洋食・イタリアン"],
  ["z-cream-stew", "🥣", "クリームシチュー＋パン", { milk: 1, chicken: 0.7, imo: 1, greenveg: 1, bread: 1, base: 0.5 }, "洋食・イタリアン"],
  ["z-carbonara", "🍝", "カルボナーラ", { noodle: 1.3, egg: 1, processed: 1, yogurt: 1, out: 1 }, "洋食・イタリアン"],
  ["z-meatsauce", "🍝", "ミートソーススパゲッティ", { noodle: 1.3, meat: 0.7, veg: 0.5, out: 1 }, "洋食・イタリアン"],
  ["z-peperoncino", "🍝", "ペペロンチーノ", { noodle: 1.2, base: 1.5, out: 0.5 }, "洋食・イタリアン"],
  ["z-pizza", "🍕", "ピザ（3切れ）＋サラダ", { bread: 3, yogurt: 1.5, processed: 0.5, salad: 1, out: 1 }, "洋食・イタリアン"],
  ["z-steak", "🥩", "ステーキ＋サラダ＋ライス", { rice: 1, meat: 2, salad: 1, out: 0.5 }, "洋食・イタリアン"],
  ["z-grilled-chicken", "🍗", "チキンソテー＋野菜＋パン", { bread: 1, chicken: 1.3, greenveg: 1, base: 1 }, "洋食・イタリアン"],
  ["z-minestrone", "🍅", "ミネストローネ＋パン＋卵", { soup: 2, veg: 1, bread: 1, egg: 1 }, "洋食・イタリアン"],
  ["z-shumai", "🥟", "焼売・餃子定食", { rice: 1, meat: 0.8, veg: 0.5, fried: 0.7, soup: 1 }, "中華"],
  ["z-gyoza-set", "🥟", "餃子（6個）＋ごはん", { rice: 1, meat: 0.8, veg: 0.7, stir: 1 }, "中華"],
  ["z-chahan", "🍚", "チャーハン", { rice: 2, egg: 1, processed: 0.5, base: 1.5, out: 0.5 }, "中華"],
  ["z-tenshinhan", "🍳", "天津飯", { rice: 2, egg: 2, base: 1, out: 0.5 }, "中華"],
  ["z-mabo", "🌶", "麻婆豆腐定食", { rice: 1, soy: 1.3, meat: 0.3, stir: 1, soup: 1 }, "中華"],
  ["z-qingjiao", "🥒", "青椒肉絲定食", { rice: 1, meat: 0.8, veg: 1.5, stir: 1 }, "中華"],
  ["z-yurinchi", "🍗", "油淋鶏定食", { rice: 1, fried: 1.2, chicken: 0.5, salad: 1 }, "中華"],
  ["z-ramen-set", "🍜", "ラーメン＋半チャーハン", { noodle: 1.2, rice: 1, processed: 0.5, out: 1.5 }, "中華"],
  ["z-wantan", "🍜", "ワンタンスープ＋小さいごはん", { soup: 2, meat: 0.5, rice: 0.7, veg: 0.5 }, "中華"],
  ["z-bibimbap", "🍚", "ビビンバ", { rice: 1.5, meat: 0.7, veg: 2, egg: 1, out: 0.5 }, "韓国・焼肉"],
  ["z-sundubu", "🍲", "スンドゥブ（豆腐チゲ）＋ごはん", { rice: 1, soy: 1.5, seafood: 0.5, egg: 1, veg: 0.5, out: 0.5 }, "韓国・焼肉"],
  ["z-tteok", "🍢", "トッポギ", { rice: 1.5, processed: 0.5, out: 1 }, "韓国・焼肉"],
  ["z-sobameshi", "🍜", "ざるそば＋小丼", { noodle: 1, rice: 0.7, egg: 0.5 }, "麺・丼"],
  ["z-tendon", "🍤", "天丼", { rice: 2, fried: 1.5, out: 0.5 }, "麺・丼"],
  ["z-negitoro", "🍣", "ねぎとろ丼・鉄火丼", { rice: 2, fish: 1.2 }, "麺・丼"],
  ["z-sobabowl", "🍜", "鴨南蛮・肉そば", { noodle: 1, meat: 0.7, veg: 0.5 }, "麺・丼"],
  ["z-hiyashi-udon", "🍜", "ぶっかけうどん＋天ぷら1つ", { noodle: 1, fried: 0.5, soy: 0.3 }, "麺・丼"],
  ["z-champon2", "🍜", "冷やし中華（ハム・卵・きゅうり）", { noodle: 1.2, processed: 0.5, egg: 0.5, salad: 1 }, "麺・丼"],
  ["z-chickenburger", "🍔", "チキンバーガー＋サラダ", { bread: 2, chicken: 1, fried: 0.7, salad: 1, out: 1 }, "ファスト・カフェ"],
  ["z-fishburger", "🍔", "フィッシュバーガー", { bread: 2, fish: 0.7, fried: 0.7, out: 1 }, "ファスト・カフェ"],
  ["z-nugget", "🍗", "チキンナゲット＋ポテト", { fried: 2, chicken: 0.5, out: 1 }, "ファスト・カフェ"],
  ["z-bento-nori", "🍱", "のり弁当", { rice: 2, fried: 1, fish: 0.5, out: 1 }, "ファスト・カフェ"],
  ["z-bento-makunouchi", "🍱", "幕の内弁当", { rice: 1.5, fish: 0.7, egg: 0.5, veg: 1, pickle: 1, fried: 0.5, out: 1 }, "ファスト・カフェ"],
  ["z-sandwich-sala", "🥪", "サンドイッチ＋サラダ＋スープ", { bread: 2, chicken: 0.5, salad: 1, soup: 1 }, "ファスト・カフェ"],
  ["z-gyudon-nami", "🍚", "牛丼（並）＋サラダ＋みそ汁", { rice: 2, meat: 1, salad: 1, soup: 1, out: 1 }, "ファスト・カフェ"],
  ["z-teishoku-conv", "🏪", "コンビニ（サラダ・チキン・おにぎり）", { rice: 1, chicken: 1, salad: 1, soup: 0.5 }, "ファスト・カフェ"],
  ["z-conv-pasta", "🏪", "コンビニパスタ＋サラダ", { noodle: 1.3, salad: 1, out: 1 }, "ファスト・カフェ"],
  ["z-oats-bowl", "🥣", "オートミール＋卵＋納豆", { oats: 1.5, egg: 1, soy: 1 }, "軽め"],
  ["z-egg-salad", "🥗", "ゆで卵・サラダ・スープ", { egg: 2, salad: 1.5, soup: 1 }, "軽め"],
  ["z-tofu-salad", "🥗", "豆腐サラダ＋おにぎり1個", { soy: 1.5, salad: 1.5, rice: 1 }, "軽め"],
  ["z-banana-yogurt", "🍌", "バナナ＋ヨーグルト＋ナッツ", { fruit: 1.5, yogurt: 1, nuts: 0.5 }, "軽め"],
  ["z-miso-onigiri", "🍙", "焼きおにぎり2個＋みそ汁", { rice: 2, soup: 1 }, "軽め"],
  ["z-protein-meal", "💪", "高たんぱく食（鶏むね・卵・豆腐・野菜）", { chicken: 1.5, egg: 1, soy: 1, greenveg: 1.5, rice: 0.7 }, "軽め"],
  ["z-fish-protein", "🐟", "刺身・焼き魚＋豆腐＋サラダ（主食なし）", { fish: 1.5, soy: 1, salad: 1.5, soup: 1 }, "軽め"],];
// さらに追加：家庭料理・居酒屋・コンビニ・エスニック・鍋・汁物・単品／副菜
const MORE: [string, string, string, Record<string, number>, string][] = [
  // 家庭料理
  ["w-nikudofu", "🍲", "肉豆腐定食", { rice: 1, meat: 0.7, soy: 1, veg: 1, soup: 1 }, "家庭料理"],
  ["w-teriyaki", "🍗", "鶏の照り焼き定食", { rice: 1, chicken: 1.2, veg: 1, soup: 1, base: 1 }, "家庭料理"],
  ["w-nanban", "🍗", "チキン南蛮定食", { rice: 1, fried: 1.2, egg: 0.5, salad: 1, soup: 1 }, "家庭料理"],
  ["w-oroshi-hamb", "🍔", "和風おろしハンバーグ定食", { rice: 1, meat: 1, veg: 1, soup: 1, base: 0.5 }, "家庭料理"],
  ["w-yasaiitame", "🥬", "野菜炒め定食", { rice: 1, veg: 2, meat: 0.5, stir: 1, soup: 1 }, "家庭料理"],
  ["w-mabonasu", "🍆", "麻婆なす定食", { rice: 1, meat: 0.5, veg: 1.5, stir: 1, soup: 1 }, "家庭料理"],
  ["w-tontoro", "🥓", "豚汁定食", { rice: 1, soup: 2, meat: 0.5, rootveg: 1 }, "家庭料理"],
  ["w-kenchin", "🍲", "けんちん汁定食", { rice: 1, soup: 2, rootveg: 1, soy: 0.5 }, "家庭料理"],
  ["w-nizakana", "🐟", "煮魚定食（かれい・きんめ）", { rice: 1, fish: 1.2, veg: 1, soup: 1 }, "家庭料理"],
  ["w-sashimi-set", "🍣", "刺身定食", { rice: 1, fish: 1.5, soup: 1, pickle: 0.5 }, "家庭料理"],
  ["w-dashimaki", "🥚", "だし巻き卵・焼き魚・ごはん", { rice: 1, egg: 1.5, fish: 0.8, soup: 1 }, "家庭料理"],
  ["w-gomoku", "🍚", "五目ごはん・みそ汁・小鉢", { rice: 1.5, veg: 1, soup: 1 }, "家庭料理"],
  ["w-homecurry", "🍛", "家庭のカレー（野菜多め）", { rice: 1.5, stir: 1.5, veg: 1, meat: 0.5 }, "家庭料理"],
  ["w-keema", "🍛", "キーマカレー（ひき肉・豆）", { rice: 1.5, meat: 0.7, beans: 0.5, veg: 1, stir: 1 }, "家庭料理"],
  ["w-stew", "🥘", "ビーフシチュー＋パン", { bread: 1, meat: 1, rootveg: 1, stir: 1, soup: 1 }, "家庭料理"],
  ["w-korokke", "🥔", "コロッケ定食", { rice: 1, fried: 1.5, salad: 1, soup: 1 }, "家庭料理"],
  ["w-mixfry", "🍤", "ミックスフライ定食（えび・白身）", { rice: 1, fried: 1.5, seafood: 0.5, salad: 1, soup: 1 }, "家庭料理"],
  ["w-shumai-set", "🥟", "シュウマイ・春巻き＋ごはん", { rice: 1, meat: 0.7, fried: 0.7, veg: 0.5 }, "家庭料理"],
  ["w-tamagoyaki-don", "🍳", "卵とじ丼（かつなし）", { rice: 2, egg: 2, veg: 0.5 }, "家庭料理"],
  ["w-yakimeshi", "🍚", "焼き飯（卵・ハム）＋スープ", { rice: 2, egg: 1, processed: 0.5, soup: 1, base: 1 }, "家庭料理"],
  ["w-pot-au-feu", "🥕", "ポトフ＋パン", { soup: 1.5, processed: 0.5, rootveg: 1.5, bread: 1 }, "家庭料理"],
  ["w-grilled-fish-light", "🐟", "焼き魚・納豆・みそ汁（主食小）", { rice: 0.7, fish: 1, soy: 1, soup: 1 }, "家庭料理"],
  ["w-eggplant-miso", "🍆", "なすの味噌炒め定食", { rice: 1, veg: 1.5, stir: 1, soup: 1 }, "家庭料理"],
  ["w-tofu-hambagu", "🫘", "豆腐ハンバーグ＋野菜", { rice: 1, soy: 1.5, veg: 1.5, base: 0.5 }, "家庭料理"],
  ["w-chikuzen", "🥕", "筑前煮・焼き魚定食", { rice: 1, rootveg: 1.5, chicken: 0.5, fish: 0.8, soup: 1 }, "家庭料理"],
  // 居酒屋
  ["w-izakaya-light", "🍻", "居酒屋（刺身・枝豆・焼き鳥・サラダ）", { fish: 1, beans: 1, chicken: 1, salad: 1, alcohol: 1 }, "居酒屋"],
  ["w-izakaya-heavy", "🍺", "居酒屋（唐揚げ・ポテト・ビール）", { fried: 2, imo: 1, alcohol: 2, out: 1 }, "居酒屋"],
  ["w-yakitori-5", "🍢", "焼き鳥5本（塩）", { chicken: 1.5, processed: 0.2 }, "居酒屋"],
  ["w-edamame-beer", "🫛", "枝豆・冷奴・ハイボール", { beans: 1, soy: 1, alcohol: 1 }, "居酒屋"],
  ["w-oden-set", "🍢", "おでん盛り合わせ（大根・卵・こんにゃく）", { rootveg: 1, egg: 1, konjac: 1, processed: 0.5 }, "居酒屋"],
  ["w-karaage-only", "🍗", "から揚げ（5個）", { fried: 2 }, "居酒屋"],
  ["w-nikuyaki", "🥩", "焼き肉・サンチュ・ビール", { meat: 2, salad: 1, alcohol: 1 }, "居酒屋"],
  ["w-sashimi-sake", "🍶", "刺身・日本酒", { fish: 1.5, alcohol: 1.5 }, "居酒屋"],
  ["w-ajitsuke-nori", "🍙", "〆のお茶漬け・焼きおにぎり", { rice: 1.2, pickle: 0.5 }, "居酒屋"],
  // コンビニ
  ["w-cv-salad-chicken", "🏪", "コンビニ：サラダチキン＋サラダ＋おにぎり", { chicken: 1, salad: 1, rice: 1 }, "コンビニ"],
  ["w-cv-bento", "🏪", "コンビニ：から揚げ弁当", { rice: 2, fried: 1.5, pickle: 0.3, out: 1 }, "コンビニ"],
  ["w-cv-pasta-salad", "🏪", "コンビニ：パスタ＋サラダ＋スープ", { noodle: 1.3, salad: 1, soup: 1, out: 1 }, "コンビニ"],
  ["w-cv-sandwich", "🏪", "コンビニ：サンドイッチ2個＋ヨーグルト", { bread: 2, egg: 1, processed: 0.5, yogurt: 1 }, "コンビニ"],
  ["w-cv-onigiri2", "🍙", "コンビニ：おにぎり2個＋味噌汁", { rice: 2, soup: 1 }, "コンビニ"],
  ["w-cv-soup-set", "🏪", "コンビニ：スープ春雨＋ゆで卵＋サラダ", { soup: 1, egg: 1, salad: 1 }, "コンビニ"],
  ["w-cv-noodle", "🏪", "コンビニ：冷し中華・ざるそば", { noodle: 1.3, egg: 0.5, out: 0.5 }, "コンビニ"],
  ["w-cv-hotsnack", "🏪", "コンビニ：ホットスナック（から揚げ棒）＋おにぎり", { fried: 1, rice: 1, out: 1 }, "コンビニ"],
  ["w-cv-protein", "🏪", "コンビニ：サバ缶・納豆・カット野菜", { fish: 1, soy: 1, salad: 1.5 }, "コンビニ"],
  ["w-cv-oden", "🏪", "コンビニ：おでん＋おにぎり", { rootveg: 1, egg: 1, konjac: 1, rice: 1 }, "コンビニ"],
  // エスニック・各国
  ["w-gapao", "🌶", "ガパオライス", { rice: 1.5, meat: 0.8, egg: 1, veg: 0.5, stir: 1 }, "エスニック"],
  ["w-pad-thai", "🍜", "パッタイ（タイ風焼きそば）", { noodle: 1.3, seafood: 0.5, egg: 0.5, stir: 1, out: 0.5 }, "エスニック"],
  ["w-tomyum", "🍲", "トムヤムクン＋ごはん", { soup: 2, seafood: 1, rice: 1 }, "エスニック"],
  ["w-pho", "🍜", "フォー", { noodle: 1, chicken: 0.7, veg: 0.5, out: 0.5 }, "エスニック"],
  ["w-banhmi", "🥖", "バインミー", { bread: 2, meat: 0.7, salad: 0.7, out: 0.5 }, "エスニック"],
  ["w-naan-curry", "🫓", "インドカレー（ナン・チキン）", { bread: 2, chicken: 1, stir: 1.5, out: 1 }, "エスニック"],
  ["w-tandoori", "🍗", "タンドリーチキン＋サラダ＋ライス", { chicken: 1.5, salad: 1, rice: 1 }, "エスニック"],
  ["w-dal", "🍛", "豆カレー（ダル）＋ライス", { rice: 1.5, beans: 1.5, veg: 1, stir: 0.5 }, "エスニック"],
  ["w-taco", "🌮", "タコス（2個）", { bread: 1.5, meat: 0.7, salad: 0.7, out: 1 }, "エスニック"],
  ["w-burrito", "🌯", "ブリトー", { bread: 2, meat: 0.7, beans: 0.5, out: 1 }, "エスニック"],
  ["w-paella", "🥘", "パエリア", { rice: 2, seafood: 1, veg: 0.5, base: 1, out: 0.5 }, "エスニック"],
  ["w-kebab", "🥙", "ケバブサンド", { bread: 1.5, chicken: 1, salad: 1, out: 0.5 }, "エスニック"],
  ["w-lomo", "🥩", "ロコモコ丼", { rice: 1.5, meat: 1, egg: 1, salad: 0.5, out: 0.5 }, "エスニック"],
  ["w-bibim-naengmyeon", "🍜", "ビビン冷麺", { noodle: 1, egg: 0.5, veg: 1, out: 0.5 }, "エスニック"],
  // 鍋・汁物
  ["w-chanko", "🍲", "ちゃんこ鍋（肉・野菜・豆腐）", { chicken: 1, veg: 2, soy: 1, mush: 1, noodle: 0.5 }, "鍋・汁物"],
  ["w-mizutaki", "🍲", "水炊き（ポン酢）＋ごはん少量", { chicken: 1.2, veg: 2, soy: 1, rice: 0.7 }, "鍋・汁物"],
  ["w-shabu", "🍲", "しゃぶしゃぶ（豚・野菜）", { meat: 1.2, veg: 2, mush: 1, soy: 0.5 }, "鍋・汁物"],
  ["w-kimchi-nabe", "🌶", "キムチ鍋＋ごはん", { meat: 0.7, soy: 1, veg: 1.5, rice: 1, out: 0.5 }, "鍋・汁物"],
  ["w-yosenabe", "🍲", "寄せ鍋（魚介・野菜）", { seafood: 1, fish: 0.7, veg: 2, soy: 0.7 }, "鍋・汁物"],
  ["w-tonyu-nabe", "🍲", "豆乳鍋", { soymilk: 1, meat: 0.7, veg: 2, soy: 0.7 }, "鍋・汁物"],
  ["w-sukiyaki-home", "🥩", "すき焼き（卵つき）＋ごはん", { meat: 1.2, soy: 0.5, veg: 1.5, egg: 1, rice: 1, base: 1 }, "鍋・汁物"],
  ["w-miso-soup-set", "🍲", "具だくさん味噌汁＋おにぎり2個", { soup: 2, rootveg: 0.5, rice: 2 }, "鍋・汁物"],
  ["w-minestrone-set", "🍅", "ミネストローネ＋パン＋ゆで卵", { soup: 2, veg: 1, bread: 1, egg: 1 }, "鍋・汁物"],
  ["w-ramen-vegi", "🍜", "野菜たっぷりタンメン", { noodle: 1.2, veg: 2, meat: 0.3, out: 1 }, "鍋・汁物"],
  // 単品・副菜
  ["w-s-hiyayakko", "🫘", "冷奴", { soy: 1 }, "単品・副菜"],
  ["w-s-natto", "🫘", "納豆ごはん", { rice: 1, soy: 1 }, "単品・副菜"],
  ["w-s-salad", "🥗", "野菜サラダ（ドレッシング）", { salad: 1.5, base: 0.5 }, "単品・副菜"],
  ["w-s-sunomono", "🥒", "酢の物・おひたし", { veg: 1, pickle: 0.3 }, "単品・副菜"],
  ["w-s-hijiki", "🌿", "ひじき煮・切干大根", { mush: 1, rootveg: 0.5 }, "単品・副菜"],
  ["w-s-kimpira", "🥕", "きんぴらごぼう", { rootveg: 1, stir: 0.5 }, "単品・副菜"],
  ["w-s-tamago", "🥚", "卵料理（目玉焼き・スクランブル）", { egg: 2, base: 0.5 }, "単品・副菜"],
  ["w-s-gyudon-small", "🍚", "ミニ丼（小盛り）", { rice: 1.2, meat: 0.5, out: 0.5 }, "単品・副菜"],
  ["w-s-potato-salad", "🥔", "ポテトサラダ", { imo: 1, processed: 0.3, base: 1 }, "単品・副菜"],
  ["w-s-corn-soup", "🌽", "コーンスープ", { soup: 1, milk: 0.5 }, "単品・副菜"],
  ["w-s-chawanmushi", "🥚", "茶碗蒸し", { egg: 1, veg: 0.3 }, "単品・副菜"],
  ["w-s-yakionigiri", "🍙", "焼きおにぎり", { rice: 1.2 }, "単品・副菜"],
  ["w-s-toast-cheese", "🍞", "チーズトースト", { bread: 1.5, yogurt: 1 }, "単品・副菜"],
  ["w-s-fruit-yogurt", "🍓", "フルーツヨーグルト", { yogurt: 1, fruit: 1 }, "単品・副菜"],
  ["w-s-smoothie", "🥤", "スムージー", { fruit: 1.5, milk: 0.5 }, "単品・副菜"],
  // ごはん・麺・パンの追加
  ["w-udon-niku", "🍜", "肉うどん", { noodle: 1, meat: 0.7, veg: 0.3 }, "麺・丼"],
  ["w-kitsune", "🍜", "きつねうどん", { noodle: 1, soy: 0.5, out: 0.3 }, "麺・丼"],
  ["w-tororo-soba", "🍜", "とろろそば", { noodle: 1, imo: 0.5 }, "麺・丼"],
  ["w-zarusoba-set", "🍜", "ざるそば＋天ぷら盛り", { noodle: 1, fried: 1 }, "麺・丼"],
  ["w-nabeyaki", "🍲", "鍋焼きうどん", { noodle: 1.2, egg: 1, fried: 0.5, veg: 0.5, chicken: 0.3 }, "麺・丼"],
  ["w-yakiudon", "🍝", "焼うどん", { noodle: 1.2, stir: 1, veg: 0.7, processed: 0.3 }, "麺・丼"],
  ["w-carbo-udon", "🍝", "釜玉うどん", { noodle: 1.2, egg: 1 }, "麺・丼"],
  ["w-sobacha", "🍜", "冷やしたぬきそば", { noodle: 1, fried: 0.5, egg: 0.5 }, "麺・丼"],
  ["w-tendon-mini", "🍤", "ミニ天丼＋そば", { rice: 1.2, fried: 1, noodle: 0.5 }, "麺・丼"],
  ["w-chirashi-mini", "🍣", "海鮮ちらし（小）", { rice: 1.3, fish: 1 }, "麺・丼"],
  ["w-umeshiso", "🍙", "梅しそ・鮭おにぎり2個＋野菜スープ", { rice: 2, soup: 1, veg: 0.5 }, "麺・丼"],
  ["w-meshi-tamago", "🍚", "卵かけごはん・みそ汁・納豆", { rice: 1.5, egg: 1, soy: 1, soup: 1 }, "麺・丼"],
  // 洋食・ファミレス・ファスト
  ["w-gratin-doria", "🧀", "グラタン＋サラダ＋パン", { milk: 1, yogurt: 1, bread: 1, salad: 1, out: 1 }, "洋食・イタリアン"],
  ["w-ham-sand-cafe", "🥪", "ハムチーズサンド＋スープ", { bread: 2, processed: 0.7, yogurt: 0.7, soup: 1 }, "洋食・イタリアン"],
  ["w-lunch-family", "🍽", "ファミレス日替わりランチ（肉・サラダ・ライス）", { rice: 1, meat: 1, salad: 1, soup: 0.7, out: 1 }, "洋食・イタリアン"],
  ["w-salmon-meuniere", "🐟", "サーモンのムニエル＋パン＋サラダ", { fish: 1.2, bread: 1, salad: 1, base: 1 }, "洋食・イタリアン"],
  ["w-pork-ginger-western", "🍖", "ポークソテー＋付け合わせ＋ライス", { meat: 1.2, rice: 1, veg: 1, base: 1 }, "洋食・イタリアン"],
  ["w-risotto", "🍚", "リゾット（きのこ・チーズ）", { rice: 1.5, mush: 1, yogurt: 0.5, base: 1, out: 0.5 }, "洋食・イタリアン"],
  ["w-lasagna", "🍝", "ラザニア＋サラダ", { noodle: 1, meat: 0.5, yogurt: 1, salad: 1, out: 1 }, "洋食・イタリアン"],
  ["w-fish-chips", "🍟", "フィッシュ＆チップス", { fried: 2, fish: 0.7, imo: 1, out: 1 }, "ファスト・カフェ"],
  ["w-hotdog-set", "🌭", "ホットドッグ＋ドリンク", { bread: 1.5, processed: 1, sugar: 1, out: 0.5 }, "ファスト・カフェ"],
  ["w-bowl-chicken", "🥗", "チキンサラダボウル（雑穀入り）", { brown: 1, chicken: 1.2, salad: 1.5, greenveg: 0.5 }, "ファスト・カフェ"],
  ["w-poke", "🥗", "ポケボウル（サーモン・アボカド）", { rice: 1, fish: 1, salad: 1, nuts: 0.3 }, "ファスト・カフェ"],
  ["w-acai", "🥣", "アサイーボウル", { fruit: 1.5, oats: 1, yogurt: 0.5, nuts: 0.3 }, "ファスト・カフェ"],
  // 軽め・高たんぱく
  ["w-light-egg-yogurt", "🥚", "ゆで卵2個・ヨーグルト・果物", { egg: 2, yogurt: 1, fruit: 1 }, "軽め"],
  ["w-light-tofu-natto", "🫘", "豆腐・納豆・サラダ・味噌汁", { soy: 2, salad: 1, soup: 1 }, "軽め"],
  ["w-light-tuna-salad", "🥗", "ツナ・豆・野菜のサラダ", { fish: 0.7, beans: 1, salad: 1.5 }, "軽め"],
  ["w-light-oats-milk", "🥣", "オートミール・牛乳・バナナ・ナッツ", { oats: 1.5, milk: 1, fruit: 1, nuts: 0.3 }, "軽め"],
  ["w-light-chicken-veg", "🍗", "蒸し鶏・ブロッコリー・玄米おにぎり", { chicken: 1.5, greenveg: 1.5, brown: 0.7 }, "軽め"],
];
const main = (p: string): Tile[] => [...MAIN, ...MORE].map(([k, icon, label, vals, cat]) => T(`${p}-x-${k}`, icon, label, vals, cat));

export const SLOTS: Slot[] = [
  {
    id: "am",
    icon: "SUN",
    label: "朝",
    tiles: [
      T("am-wa", "🍚", "ごはん・卵・みそ汁", { rice: 1, egg: 1, soup: 1 }, "定番"),
      T("am-natto", "🫘", "納豆ごはん", { rice: 1, soy: 1, soup: 1 }, "定番"),
      T("am-pan", "🥐", "パン・卵", { bread: 2, egg: 1 }, "定番"),
      T("am-light", "🥖", "パン・牛乳", { bread: 1, milk: 1 }, "定番"),
      T("am-yo", "🍓", "ヨーグルト・果物", { yogurt: 1, fruit: 1 }, "定番"),
      T("am-oats", "🥣", "シリアル・オートミール", { oats: 1, milk: 1 }, "定番"),
      T("am-x-onigiri", "🍙", "おにぎり＋みそ汁", { rice: 1.5, soup: 1 }, "和食"),
      T("am-x-tkg", "🥚", "卵かけごはん・納豆卵", { rice: 1.5, egg: 1, soy: 0.5 }, "和食"),
      T("am-x-fish", "🐟", "焼き魚の和朝食", { rice: 1, fish: 1, greenveg: 1, soup: 1 }, "和食"),
      T("am-x-toast", "🍞", "トースト・ゆで卵・ヨーグルト", { bread: 1, egg: 1, yogurt: 1 }, "パン・カフェ"),
      T("am-x-cafe", "☕", "カフェのモーニング", { bread: 2, egg: 1, milk: 0.5, out: 0.5 }, "パン・カフェ"),
      T("am-x-conv", "🏪", "コンビニ（おにぎり＋ヨーグルト）", { rice: 1, yogurt: 1, out: 0.5 }, "パン・カフェ"),
      T("am-x-pastry", "🥐", "菓子パン＋コーヒー", { cake: 1 }, "パン・カフェ"),
      T("am-x-cereal", "🥣", "シリアル・牛乳・バナナ", { oats: 1, milk: 1, fruit: 1 }, "軽め"),
      T("am-x-smoothie", "🥤", "スムージー＋ゆで卵", { fruit: 1.5, milk: 0.5, egg: 1 }, "軽め"),
      T("am-x-juice", "🧃", "ジュースだけ", { sugar: 1.5 }, "軽め"),
      T("am-y-salmon", "🐟", "鮭の塩焼き・ごはん・みそ汁", { rice: 1, fish: 1, soup: 1 }, "和食"),
      T("am-y-nattoegg", "🥚", "納豆・卵・ごはん・みそ汁", { rice: 1, soy: 1, egg: 1, soup: 1 }, "和食"),
      T("am-y-ochazuke", "🍵", "お茶漬け・漬物", { rice: 1.5, pickle: 1 }, "和食"),
      T("am-y-tofu", "🫘", "冷奴・ごはん・みそ汁", { rice: 1, soy: 1, soup: 1 }, "和食"),
      T("am-y-hotcake", "🥞", "ホットケーキ・パンケーキ", { bread: 1.5, egg: 0.5, sugar: 0.5, out: 0.5 }, "パン・カフェ"),
      T("am-y-french", "🍞", "フレンチトースト", { bread: 2, egg: 1, milk: 0.5, sugar: 0.3 }, "パン・カフェ"),
      T("am-y-bagel", "🥯", "ベーグル＋クリームチーズ", { bread: 2, yogurt: 0.5 }, "パン・カフェ"),
      T("am-y-hotsand", "🥪", "ホットサンド（ハム・チーズ）", { bread: 2, processed: 0.5, yogurt: 0.5, out: 0.5 }, "パン・カフェ"),
      T("am-y-eggsand", "🥪", "卵サンド＋コーヒー", { bread: 2, egg: 1.5 }, "パン・カフェ"),
      T("am-y-fruit", "🍎", "果物だけ", { fruit: 2 }, "軽め"),
      T("am-y-soup", "🍲", "スープ＋トースト", { soup: 1, bread: 1 }, "軽め"),
      T("am-y-protein", "🥤", "プロテイン＋バナナ", { milk: 1, fruit: 1 }, "軽め"),
      T("am-y-granola", "🥣", "ヨーグルト・グラノーラ", { yogurt: 1, oats: 1, fruit: 0.5 }, "軽め"),
      T("am-y-coffee", "☕", "コーヒーだけ（ミルク入り）", { milk: 0.3 }, "軽め"),
      T("am-z-oatsegg", "🥣", "オートミール・卵・納豆", { oats: 1.5, egg: 1, soy: 0.5 }, "軽め"),
      T("am-z-yogurtnuts", "🥛", "ヨーグルト・ナッツ・バナナ", { yogurt: 1, nuts: 0.5, fruit: 1 }, "軽め"),
      T("am-z-smoothieprot", "🥤", "プロテインスムージー（豆乳・果物）", { soymilk: 1, fruit: 1 }, "軽め"),
      T("am-z-wbread", "🍞", "全粒粉パン・目玉焼き・サラダ", { wbread: 2, egg: 1, salad: 1 }, "パン・カフェ"),
      T("am-z-croissant", "🥐", "クロワッサン・カフェラテ", { cake: 0.8, milk: 1 }, "パン・カフェ"),
      T("am-z-sandwich", "🥪", "サンドイッチ（ハム・卵）・スープ", { bread: 2, processed: 0.5, egg: 1, soup: 1 }, "パン・カフェ"),
      T("am-z-onigirisalad", "🍙", "おにぎり・サラダチキン・みそ汁", { rice: 1.2, chicken: 1, soup: 1 }, "和食"),
      T("am-z-brown", "🍚", "玄米ごはん・焼き魚・納豆・小鉢", { brown: 1, fish: 1, soy: 1, veg: 1 }, "和食"),
      T("am-z-ham", "🍳", "ハムエッグ・トースト・サラダ", { bread: 1.5, processed: 0.5, egg: 1, salad: 1 }, "パン・カフェ"),
      T("am-z-porridge", "🍲", "おかゆ・梅干し・卵", { rice: 1, pickle: 1, egg: 1 }, "和食"),
      T("am-z-miso", "🍲", "具だくさんみそ汁・おにぎり", { soup: 2, rice: 1.2, veg: 1, soy: 0.5 }, "和食"),
      T("am-z-pasta", "🍝", "朝パスタ・サラダ", { noodle: 1, salad: 1, base: 1 }, "パン・カフェ"),
      T("am-z-bananaonly", "🍌", "バナナ・ゆで卵", { fruit: 1.5, egg: 1 }, "軽め"),
      T("am-w-umeshake", "🍙", "鮭おにぎり・卵焼き・みそ汁", { rice: 1.2, egg: 1, soup: 1 }, "和食"),
      T("am-w-tamagogohan", "🥚", "卵かけごはん・みそ汁・のり", { rice: 1.2, egg: 1, soup: 1 }, "和食"),
      T("am-w-aji-hiraki", "🐟", "あじの開き・ごはん・みそ汁", { rice: 1, fish: 1, soup: 1, pickle: 0.5 }, "和食"),
      T("am-w-nattou-tofu", "🫘", "納豆・冷奴・玄米ごはん", { brown: 1, soy: 2 }, "和食"),
      T("am-w-ochazuke-egg", "🍵", "お茶漬け・卵焼き", { rice: 1.2, egg: 1, pickle: 0.5 }, "和食"),
      T("am-w-okayu", "🍲", "おかゆ・梅干し・焼き鮭", { rice: 1, fish: 0.7, pickle: 0.5 }, "和食"),
      T("am-w-miso-soup-rich", "🍲", "具だくさん味噌汁・ごはん・納豆", { soup: 2, rice: 1, soy: 1 }, "和食"),
      T("am-w-toast-egg", "🍞", "トースト・目玉焼き・サラダ・コーヒー", { bread: 1.5, egg: 1, salad: 1 }, "パン・カフェ"),
      T("am-w-avocado-toast", "🥑", "アボカドトースト・ゆで卵", { bread: 1.5, nuts: 0.5, egg: 1 }, "パン・カフェ"),
      T("am-w-yogurt-bread", "🥖", "パン・ヨーグルト・果物", { bread: 1.5, yogurt: 1, fruit: 1 }, "パン・カフェ"),
      T("am-w-cereal-milk", "🥣", "シリアル・牛乳", { oats: 1.2, milk: 1 }, "パン・カフェ"),
      T("am-w-sand-cv", "🥪", "コンビニサンド・サラダ", { bread: 2, egg: 1, salad: 0.7, out: 0.5 }, "パン・カフェ"),
      T("am-w-croque", "🥐", "クロックムッシュ・スープ", { bread: 2, processed: 0.5, yogurt: 1, soup: 1 }, "パン・カフェ"),
      T("am-w-smoothie-bowl", "🍓", "スムージーボウル（バナナ・ベリー・グラノーラ）", { fruit: 1.5, yogurt: 0.7, oats: 0.7 }, "軽め"),
      T("am-w-protein-shake", "🥤", "プロテイン＋バナナ＋ナッツ", { milk: 1, fruit: 1, nuts: 0.5 }, "軽め"),
      T("am-w-soy-oats", "🥣", "豆乳オートミール・果物", { oats: 1.2, soymilk: 1, fruit: 1 }, "軽め"),
      T("am-w-vegesoup-egg", "🍲", "野菜スープ・ゆで卵", { soup: 1.5, veg: 1, egg: 1 }, "軽め"),
      T("am-w-ham-egg-rice", "🍳", "ハムエッグ・ごはん・サラダ", { rice: 1, egg: 1, processed: 0.5, salad: 1 }, "洋食・和洋"),
      T("am-w-sausage", "🌭", "ソーセージ・卵・パン・サラダ", { bread: 1.5, processed: 1, egg: 1, salad: 0.7 }, "洋食・和洋"),
      T("am-w-pancake-fruit", "🥞", "パンケーキ・フルーツ・ヨーグルト", { bread: 1.5, egg: 0.5, fruit: 1, yogurt: 0.7, sugar: 0.3 }, "洋食・和洋"),
      T("am-w-bowl-tofu", "🥗", "豆腐・卵・野菜のワンプレート", { soy: 1.5, egg: 1, salad: 1.5, rice: 0.5 }, "洋食・和洋"),      NONE("am-none", "食べない"),
    ],
  },
  {
    id: "noon",
    icon: "SUNNY",
    label: "昼",
    tiles: [
      T("no-set", "🍱", "定食（ごはん・主菜・汁）", { rice: 1, chicken: 1, veg: 1, soup: 1 }, "定番"),
      T("no-men", "🍜", "麺類", { noodle: 1, out: 1 }, "定番"),
      T("no-don", "🍛", "丼・カレー", { rice: 2, stir: 1, out: 1 }, "定番"),
      T("no-conv", "🍙", "コンビニ弁当", { rice: 1, fried: 1, out: 1 }, "定番"),
      T("no-onigiri", "🥗", "おにぎり・サラダチキン", { rice: 1, chicken: 1, salad: 1 }, "定番"),
      T("no-sand", "🥪", "サンドイッチ・パン", { bread: 2, egg: 1, out: 1 }, "定番"),
      ...main("no"),
      NONE("no-none", "食べない"),
    ],
  },
  {
    id: "pm",
    icon: "MOON",
    label: "夜",
    tiles: [
      T("pm-fish", "🐟", "魚の定食", { rice: 1, fish: 1, greenveg: 1, soup: 1 }, "定番"),
      T("pm-meat", "🍖", "肉料理", { rice: 1, meat: 1, veg: 1, stir: 1 }, "定番"),
      T("pm-nabe", "🍲", "鍋・煮物", { chicken: 1, veg: 2, soy: 1, mush: 1 }, "定番"),
      T("pm-fry", "🍤", "揚げ物", { rice: 1, fried: 1, salad: 1 }, "定番"),
      T("pm-men", "🍝", "麺類", { noodle: 1 }, "定番"),
      T("pm-out", "🍻", "外食・居酒屋", { out: 1, fried: 1, rice: 1 }, "定番"),
      ...main("pm"),
      NONE("pm-none", "食べない"),
    ],
  },
  {
    id: "snack",
    icon: "COOKIE",
    label: "おやつ・飲み物",
    tiles: [
      T("sn-cake", "🍰", "菓子パン・ケーキ", { cake: 1 }, "定番"),
      T("sn-choco", "🍫", "チョコ・スナック", { snack: 1 }, "定番"),
      T("sn-fruit", "🍎", "果物", { fruit: 1 }, "定番"),
      T("sn-yo", "🥛", "ヨーグルト", { yogurt: 1 }, "定番"),
      T("sn-sugar", "🥤", "甘い飲み物", { sugar: 1 }, "定番"),
      T("sn-juice", "🧃", "ジュースのみ", { sugar: 1.5 }, "定番"),
      T("sn-alc", "🍺", "お酒", { alcohol: 1 }, "定番"),
      T("sn-x-wagashi", "🍡", "和菓子（大福・どら焼き）", { cake: 0.8 }, "甘いもの"),
      T("sn-x-ice", "🍨", "アイスクリーム", { snack: 1 }, "甘いもの"),
      T("sn-x-frappe", "🧋", "甘いカフェドリンク", { sugar: 1.5, milk: 0.5 }, "甘いもの"),
      T("sn-x-cracker", "🍘", "せんべい・おかき", { snack: 0.7 }, "甘いもの"),
      T("sn-x-latte", "☕", "カフェラテ（砂糖なし）", { milk: 1 }, "軽め"),
      T("sn-x-vegjuice", "🥬", "野菜ジュース", { veg: 1, sugar: 0.3 }, "軽め"),
      T("sn-x-nutsfruit", "🥜", "ナッツ＋ドライフルーツ", { nuts: 1, fruit: 0.5 }, "軽め"),
      T("sn-x-granola", "🥣", "ヨーグルト＋グラノーラ", { yogurt: 1, oats: 0.5, fruit: 0.5 }, "軽め"),
      T("sn-x-protein", "🥛", "プロテイン・牛乳", { milk: 1 }, "軽め"),
      T("sn-x-onigiri", "🍙", "おにぎり（夜食）", { rice: 1 }, "軽め"),
      T("sn-y-pudding", "🍮", "プリン・ゼリー", { cake: 0.6 }, "甘いもの"),
      T("sn-y-cookie", "🍪", "クッキー・ビスケット", { snack: 1 }, "甘いもの"),
      T("sn-y-chips", "🥔", "ポテトチップス", { snack: 1.2 }, "甘いもの"),
      T("sn-y-donut", "🍩", "ドーナツ・大きい菓子パン", { cake: 1.3 }, "甘いもの"),
      T("sn-y-chocolate", "🍫", "チョコレート（板の1/3）", { snack: 0.7 }, "甘いもの"),
      T("sn-y-candy", "🍬", "あめ・グミ", { snack: 0.3 }, "甘いもの"),
      T("sn-y-egg", "🥚", "ゆで卵", { egg: 1 }, "軽め"),
      T("sn-y-cheese", "🧀", "チーズ", { yogurt: 1 }, "軽め"),
      T("sn-y-saladchicken", "🍗", "サラダチキン", { chicken: 1 }, "軽め"),
      T("sn-y-hoshiimo", "🍠", "干し芋・焼きいも", { imo: 1 }, "軽め"),
      T("sn-y-onigiri", "🍙", "おにぎり（小）", { rice: 0.7 }, "軽め"),
      T("sn-y-soymilk", "🥛", "豆乳", { soymilk: 1 }, "軽め"),
      T("sn-y-banana", "🍌", "バナナ", { fruit: 1.5 }, "軽め"),
      T("sn-y-probar", "🍫", "プロテインバー", { snack: 0.8, milk: 0.3 }, "軽め"),
      T("sn-z-cheesecake", "🍰", "ショートケーキ・チーズケーキ", { cake: 1.3 }, "甘いもの"),
      T("sn-z-shuku", "🍮", "シュークリーム・エクレア", { cake: 1 }, "甘いもの"),
      T("sn-z-icebar", "🍦", "アイスバー・かき氷", { sugar: 0.8 }, "甘いもの"),
      T("sn-z-dango", "🍡", "だんご・おはぎ", { cake: 0.8 }, "甘いもの"),
      T("sn-z-popcorn", "🍿", "ポップコーン", { snack: 0.8 }, "甘いもの"),
      T("sn-z-edamame", "🫛", "枝豆・ミックスナッツ（無塩）", { beans: 1, nuts: 0.5 }, "軽め"),
      T("sn-z-tofu", "🫘", "冷奴・豆腐バー", { soy: 0.7 }, "軽め"),
      T("sn-z-nori", "🍙", "ゆで卵＋チーズ", { egg: 1, yogurt: 0.7 }, "軽め"),
      T("sn-z-sakiika", "🐙", "さきいか・するめ・小魚", { smallfish: 1, snack: 0.2 }, "軽め"),
      T("sn-z-driedfruit", "🍇", "ドライフルーツ・干しぶどう", { fruit: 1 }, "軽め"),
      T("sn-z-kiwi", "🥝", "キウイ・みかん・りんご", { fruit: 1.2 }, "軽め"),
      T("sn-z-oatmilk", "🥛", "ホットミルク・甘酒", { milk: 1, sugar: 0.3 }, "軽め"),
      T("sn-z-pizzapan", "🍕", "ピザまん・肉まん", { bread: 1.5, meat: 0.3, out: 0.5 }, "甘いもの"),
      T("sn-z-fries", "🍟", "フライドポテト・から揚げ（小）", { fried: 1.3 }, "甘いもの"),
      T("dr-z-beerzero", "🍺", "ノンアルコールビール", { sugar: 0.2 }, "飲み物"),
      T("dr-z-highball", "🥃", "ハイボール・焼酎（水割り）", { alcohol: 0.7 }, "飲み物"),
      T("dr-z-chuhai", "🍹", "チューハイ・サワー・カクテル", { alcohol: 1, sugar: 0.7 }, "飲み物"),
      T("dr-z-sake", "🍶", "日本酒（1合）", { alcohol: 1.5 }, "飲み物"),
      T("dr-z-energy", "⚡", "エナジードリンク・スポーツドリンク", { sugar: 1 }, "飲み物"),
      T("dr-z-soymilkdr", "🥛", "豆乳・アーモンドミルク", { soymilk: 1 }, "飲み物"),
      T("dr-z-greentea-latte", "🍵", "抹茶ラテ・ココア", { milk: 1, sugar: 0.5 }, "飲み物"),
      T("sn-w-mochi", "🍡", "大福・おはぎ・みたらし団子", { cake: 0.9 }, "甘いもの"),
      T("sn-w-yokan", "🍮", "羊羹・どら焼き", { cake: 0.8 }, "甘いもの"),
      T("sn-w-taiyaki", "🐟", "たい焼き・今川焼き", { cake: 1 }, "甘いもの"),
      T("sn-w-crepe", "🥞", "クレープ", { cake: 1.5, milk: 0.3 }, "甘いもの"),
      T("sn-w-parfait", "🍨", "パフェ・サンデー", { snack: 1.5, fruit: 0.5, milk: 0.5 }, "甘いもの"),
      T("sn-w-macaron", "🍪", "マカロン・焼き菓子", { snack: 1 }, "甘いもの"),
      T("sn-w-ice-cream-pack", "🍦", "アイス（バニラ・コーン）", { snack: 1, milk: 0.3 }, "甘いもの"),
      T("sn-w-mochi-ice", "🍡", "雪見だいふく・アイスもなか", { snack: 0.8 }, "甘いもの"),
      T("sn-w-pocky", "🍫", "ポッキー・クッキーバー", { snack: 0.7 }, "甘いもの"),
      T("sn-w-senbei", "🍘", "せんべい・あられ", { snack: 0.6 }, "甘いもの"),
      T("sn-w-ramen-snack", "🍜", "カップ麺（小）", { instant: 0.6 }, "甘いもの"),
      T("sn-w-sweetpotato", "🍠", "焼き芋・干し芋", { imo: 1.2 }, "軽め"),
      T("sn-w-nori-cheese", "🧀", "チーズ・ナッツ・のり", { yogurt: 0.7, nuts: 0.5 }, "軽め"),
      T("sn-w-tomato", "🍅", "ミニトマト・きゅうり・野菜スティック", { salad: 1, greenveg: 0.5 }, "軽め"),
      T("sn-w-yogurt-fruit", "🥝", "ヨーグルト＋キウイ・みかん", { yogurt: 1, fruit: 1 }, "軽め"),
      T("sn-w-boiled-egg2", "🥚", "ゆで卵2個", { egg: 2 }, "軽め"),
      T("sn-w-tofu-bar", "🫘", "豆腐バー・枝豆", { soy: 1, beans: 0.5 }, "軽め"),
      T("sn-w-chicken-bar", "🍗", "サラダチキンバー・ゆで卵", { chicken: 0.7, egg: 1 }, "軽め"),
      T("sn-w-protein-bar2", "🍫", "プロテインバー・プロテインドリンク", { snack: 0.7, milk: 0.7 }, "軽め"),
      T("sn-w-dried-fish", "🐟", "するめ・小魚アーモンド", { smallfish: 1, nuts: 0.5 }, "軽め"),
      T("sn-w-oat-cookie", "🍪", "オートミールクッキー（手作り）", { oats: 0.7, snack: 0.5 }, "軽め"),
      T("sn-w-banana-pb", "🍌", "バナナ＋ピーナッツバター", { fruit: 1.5, nuts: 0.5 }, "軽め"),
      T("dr-w-coffee-black", "☕", "ブラックコーヒー・紅茶（無糖）", {}, "飲み物"),
      T("dr-w-latte-sugar", "☕", "カフェラテ（砂糖入り）", { milk: 1, sugar: 0.5 }, "飲み物"),
      T("dr-w-frappe", "🥤", "フラペチーノ・タピオカ", { sugar: 2, milk: 0.5 }, "飲み物"),
      T("dr-w-milk-tea", "🧋", "ミルクティー（加糖）", { milk: 1, sugar: 0.7 }, "飲み物"),
      T("dr-w-sports", "🥤", "スポーツドリンク（500ml）", { sugar: 1.2 }, "飲み物"),
      T("dr-w-energy", "⚡", "エナジードリンク", { sugar: 1.2 }, "飲み物"),
      T("dr-w-vegejuice", "🥬", "野菜ジュース・トマトジュース", { veg: 1, sugar: 0.3 }, "飲み物"),
      T("dr-w-amazake", "🍶", "甘酒・ホットココア", { sugar: 0.8, milk: 0.5 }, "飲み物"),
      T("dr-w-beer-can", "🍺", "ビール（350ml缶）", { alcohol: 0.8 }, "飲み物"),
      T("dr-w-lemon-sour", "🍋", "レモンサワー・酎ハイ", { alcohol: 1, sugar: 0.5 }, "飲み物"),
      T("dr-w-whisky", "🥃", "ウイスキー・焼酎（ロック）", { alcohol: 0.7 }, "飲み物"),
      T("dr-w-wine-glass", "🍷", "ワイン（グラス1杯）", { alcohol: 0.7 }, "飲み物"),
      T("dr-w-makgeolli", "🍶", "マッコリ・ハイボール", { alcohol: 1 }, "飲み物"),
      T("dr-y-tea", "🍵", "お茶・水・ブラックコーヒー", {}, "飲み物"),
      T("dr-y-juice", "🧃", "ジュース（果汁）", { sugar: 1.2 }, "飲み物"),
      T("dr-y-cola", "🥤", "コーラ・炭酸飲料", { sugar: 1.5 }, "飲み物"),
      T("dr-y-sweetcoffee", "☕", "加糖コーヒー・ラテ", { sugar: 0.8, milk: 0.3 }, "飲み物"),
      T("dr-y-beer", "🍺", "ビール（中ジョッキ）", { alcohol: 1 }, "飲み物"),
      T("dr-y-wine", "🍷", "ワイン（2杯）", { alcohol: 1 }, "飲み物"),
      T("dr-y-chuhai", "🍹", "チューハイ（1缶）", { alcohol: 0.8, sugar: 0.3 }, "飲み物"),      NONE("sn-none", "とらない"),
    ],
  },
];
export const ICON: Record<string, string> = { SUN: "🌅", SUNNY: "☀", MOON: "🌙", COOKIE: "🍪" };

export const SIZES = [
  { t: "少なめ", m: 0.7 },
  { t: "ふつう", m: 1 },
  { t: "多め", m: 1.4 },
];
// 「足したもの」：1食に、ちょっと足したもの。タップするたびに、0→1→2→0。
export const EXTRAS: { k: string; icon: string; label: string }[] = [
  { k: "salad", icon: "🥗", label: "サラダ" },
  { k: "veg", icon: "🥦", label: "野菜" },
  { k: "soup", icon: "🍲", label: "汁物" },
  { k: "egg", icon: "🥚", label: "卵" },
  { k: "soy", icon: "🫘", label: "納豆・豆腐" },
  { k: "meat", icon: "🍖", label: "肉" },
  { k: "fish", icon: "🐟", label: "魚" },
  { k: "rice", icon: "🍚", label: "ごはん" },
  { k: "fruit", icon: "🍎", label: "果物" },
  { k: "fried", icon: "🍤", label: "揚げ物" },
  { k: "sugar", icon: "🥤", label: "甘い飲み物" },
  { k: "chicken", icon: "🍗", label: "鶏むね・ささみ" },
  { k: "seafood", icon: "🦐", label: "えび・いか・貝" },
  { k: "smallfish", icon: "🐟", label: "小魚・しらす" },
  { k: "beans", icon: "🫘", label: "豆（煮豆・ひよこ豆）" },
  { k: "soymilk", icon: "🥛", label: "豆乳" },
  { k: "milk", icon: "🥛", label: "牛乳" },
  { k: "yogurt", icon: "🥣", label: "ヨーグルト・チーズ" },
  { k: "greenveg", icon: "🥬", label: "緑黄色野菜" },
  { k: "rootveg", icon: "🥕", label: "根菜" },
  { k: "mush", icon: "🍄", label: "きのこ・海藻" },
  { k: "konjac", icon: "🍥", label: "こんにゃく" },
  { k: "imo", icon: "🍠", label: "いも・かぼちゃ" },
  { k: "brown", icon: "🍚", label: "玄米・もち麦ごはん" },
  { k: "oats", icon: "🥣", label: "オートミール" },
  { k: "bread", icon: "🍞", label: "パン" },
  { k: "wbread", icon: "🍞", label: "全粒粉パン" },
  { k: "noodle", icon: "🍜", label: "麺" },
  { k: "nuts", icon: "🥜", label: "ナッツ" },
  { k: "pickle", icon: "🥒", label: "漬物・梅干し" },
  { k: "processed", icon: "🌭", label: "ハム・ソーセージ" },
  { k: "liver", icon: "🍖", label: "レバー" },
  { k: "stir", icon: "🍳", label: "炒め物" },
  { k: "cake", icon: "🍰", label: "菓子パン・ケーキ" },
  { k: "snack", icon: "🍫", label: "チョコ・スナック" },
  { k: "alcohol", icon: "🍺", label: "お酒" },
  { k: "instant", icon: "🍜", label: "カップ麺" },
];
export type St = { date: string; size: Record<string, number>; ext: Record<string, number> };
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
export const unitOf = (k: string) => U[k] ?? (registerFood(k) ? U[k] : undefined);
export const kc = (vals: Record<string, number>, m = 1) => Object.entries(vals).reduce((s, [k, v]) => s + (unitOf(k)?.kcal ?? 0) * v * m, 0);
export const r10 = (n: number) => Math.round(n / 10) * 10;


// 食事の選びかたから、1日ぶんの食品の数（BalanceCheckの入力）に直す
export function buildVals(n: St): Record<string, number> {
  const vals: Record<string, number> = {};
  SLOTS.forEach((s) =>
    s.tiles.forEach((t) => {
      const z = n.size[t.id];
      if (z !== undefined) for (const [k, v] of Object.entries(t.vals)) vals[k] = (vals[k] ?? 0) + v * SIZES[z].m;
    })
  );
  for (const [key, c] of Object.entries(n.ext)) {
    const k = key.split(":")[1];
    if (c > 0) {
      registerFood(k);
      vals[k] = (vals[k] ?? 0) + c;
    }
  }
  return vals;
}

// 1日の合計（調理の油・調味料の分を、1日1回ぶん足す。くわしい入力と、同じ計算）
export type Tot = { any: boolean; kcal: number; p: number; f: number; c: number; fi: number; salt: number };
export function totals(n: St): Tot {
  const all = buildVals(n);
  const t: Tot = { any: Object.keys(all).length > 0, kcal: 0, p: 0, f: 0, c: 0, fi: 0, salt: 0 };
  if (!t.any) return t;
  for (const [k, v] of Object.entries({ ...all, base: 1 })) {
    const u = unitOf(k);
    if (!u) continue;
    t.kcal += u.kcal * v;
    t.p += u.p * v;
    t.f += u.f * v;
    t.c += u.c * v;
    t.fi += u.fi * v;
    t.salt += u.salt * v;
  }
  return t;
}

export function slotKcal(n: St, s: Slot): number {
  let v = 0;
  s.tiles.forEach((t) => {
    const z = n.size[t.id];
    if (z !== undefined) v += kc(t.vals, SIZES[z].m);
  });
  for (const [key, c] of Object.entries(n.ext)) if (key.startsWith(s.id + ":")) v += kc({ [key.split(":")[1]]: c });
  return v;
}

// 文章にする（お客様に送る用）：「朝：ごはん・卵・みそ汁（ふつう）＋サラダ」
export function describe(n: St): string[] {
  const out: string[] = [];
  for (const s of SLOTS) {
    const parts: string[] = [];
    s.tiles.forEach((t) => {
      const z = n.size[t.id];
      if (z !== undefined) parts.push(t.id.endsWith("-none") ? t.label : `${t.label}（${SIZES[z].t}）`);
    });
    for (const [key, c] of Object.entries(n.ext)) {
      if (!key.startsWith(s.id + ":")) continue;
      const kk = key.split(":")[1];
      const x = EXTRAS.find((e) => e.k === kk);
      if (x) parts.push(`＋${x.label}${c > 1 ? `×${c}` : ""}`);
      else if (isFoodKey(kk)) {
        const fd = foodOfKey(kk);
        if (fd) parts.push(`＋${fd.name}（${portionOf(fd).label}）${c > 1 ? `×${c}` : ""}`);
      }
    }
    if (parts.length) out.push(`${s.label}：${parts.join("、")}（約${r10(slotKcal(n, s)).toLocaleString()}kcal）`);
  }
  return out;
}

export const goalOf = (sexKey: "f" | "m", band: number) => ({ p: amountOf("たんぱく質", sexKey, band), fi: amountOf("食物繊維", sexKey, band), salt: sexKey === "m" ? 7.5 : 6.5 });