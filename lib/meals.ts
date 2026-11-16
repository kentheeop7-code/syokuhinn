// かんたん入力の、共通の部品（ホームと、トレーナー用で使う）。
import { U } from "../app/BalanceCheck";
import { amountOf } from "./microLookup";

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
const main = (p: string): Tile[] => MAIN.map(([k, icon, label, vals, cat]) => T(`${p}-x-${k}`, icon, label, vals, cat));

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
      T("am-z-bananaonly", "🍌", "バナナ・ゆで卵", { fruit: 1.5, egg: 1 }, "軽め"),      NONE("am-none", "食べない"),
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
];
export type St = { date: string; size: Record<string, number>; ext: Record<string, number> };
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
export const kc = (vals: Record<string, number>, m = 1) => Object.entries(vals).reduce((s, [k, v]) => s + (U[k]?.kcal ?? 0) * v * m, 0);
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
    if (c > 0) vals[k] = (vals[k] ?? 0) + c;
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
    const u = U[k];
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
      const x = EXTRAS.find((e) => e.k === key.split(":")[1]);
      if (x) parts.push(`＋${x.label}${c > 1 ? `×${c}` : ""}`);
    }
    if (parts.length) out.push(`${s.label}：${parts.join("、")}（約${r10(slotKcal(n, s)).toLocaleString()}kcal）`);
  }
  return out;
}

export const goalOf = (sexKey: "f" | "m", band: number) => ({ p: amountOf("たんぱく質", sexKey, band), fi: amountOf("食物繊維", sexKey, band), salt: sexKey === "m" ? 7.5 : 6.5 });