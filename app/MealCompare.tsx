"use client";

import { useMemo, useState } from "react";
import { FOODS } from "../lib/foods";

type Item = { name: string; g: number };
type Meal = { title: string; items: Item[] };
type Menu = {
  id: string;
  letter: string;
  name: string;
  short: string;
  tag: string;
  who: string;
  tips: string[];
  color: string;
  meals: Meal[];
};

// 日本食品標準成分表をもとにしたアプリ内の食品データで、1日の食事例を4つ組み立てた
const MENUS: Menu[] = [
  {
    id: "wa",
    letter: "A",
    name: "和食バランス",
    short: "和食",
    tag: "いちばん続けやすい、ごはん中心の定番",
    who: "はじめての人、家族と同じ食事で進めたい人、体型を維持したい人。",
    tips: ["ごはんは毎食150〜180gで、主食・主菜・副菜をそろえる", "朝は卵と納豆で、たんぱく質を先にとる", "間食はヨーグルトとバナナで、おやつの代わりに"],
    color: "#46c8ff",
    meals: [
      { title: "朝食", items: [{ name: "白ごはん", g: 150 }, { name: "卵", g: 100 }, { name: "納豆", g: 45 }, { name: "ほうれん草", g: 60 }] },
      { title: "昼食", items: [{ name: "白ごはん", g: 180 }, { name: "サケ（焼き）", g: 80 }, { name: "ブロッコリー", g: 80 }, { name: "絹ごし豆腐", g: 100 }] },
      { title: "夕食", items: [{ name: "白ごはん", g: 150 }, { name: "鶏むね肉（皮なし）", g: 120 }, { name: "キャベツ", g: 100 }, { name: "えのき", g: 50 }, { name: "オリーブオイル", g: 8 }] },
      { title: "間食", items: [{ name: "無糖ヨーグルト", g: 150 }, { name: "バナナ", g: 100 }] },
    ],
  },
  {
    id: "muscle",
    letter: "B",
    name: "高たんぱく・筋トレ",
    short: "高たんぱく",
    tag: "体づくり向け。たんぱく質もエネルギーも多め",
    who: "筋トレをしている人、体重を増やしたい人、運動量の多い人。",
    tips: ["たんぱく質は体重1kgあたり約2gを目安に、3〜4回に分けて", "トレの前後は、ごはんと肉で糖質とたんぱく質をしっかり", "食べきれないときは、間食のプロテインで補う"],
    color: "#ff6b57",
    meals: [
      { title: "朝食", items: [{ name: "オートミール", g: 50 }, { name: "牛乳", g: 200 }, { name: "卵", g: 150 }, { name: "バナナ", g: 100 }] },
      { title: "昼食", items: [{ name: "白ごはん", g: 250 }, { name: "鶏むね肉（皮なし）", g: 180 }, { name: "ブロッコリー", g: 100 }, { name: "トマト", g: 100 }] },
      { title: "夕食", items: [{ name: "白ごはん", g: 220 }, { name: "牛もも肉（赤身）", g: 150 }, { name: "納豆", g: 45 }, { name: "キャベツ", g: 100 }] },
      { title: "間食", items: [{ name: "プロテイン（ホエイ）", g: 30 }, { name: "無糖ヨーグルト", g: 200 }, { name: "アーモンド", g: 15 }] },
    ],
  },
  {
    id: "lowfat",
    letter: "C",
    name: "低脂質ダイエット",
    short: "低脂質",
    tag: "脂質をおさえて、量は食べられる",
    who: "ダイエット中で、食べる量は減らしたくない人。",
    tips: ["肉は、ささみ・むね・タラなど、脂の少ないものを選ぶ", "調理は、焼く・蒸す・ゆでるが中心。揚げ物は避ける", "脂質は1日16g前後。少なすぎると続かないので、卵黄や魚を足してもOK"],
    color: "#7ed957",
    meals: [
      { title: "朝食", items: [{ name: "全粒粉パン", g: 90 }, { name: "卵白", g: 100 }, { name: "低脂肪乳", g: 200 }] },
      { title: "昼食", items: [{ name: "玄米ごはん", g: 150 }, { name: "タラ", g: 120 }, { name: "ほうれん草", g: 80 }, { name: "トマト", g: 100 }] },
      { title: "夕食", items: [{ name: "白ごはん", g: 120 }, { name: "鶏ささみ", g: 120 }, { name: "大根", g: 100 }, { name: "えのき", g: 50 }, { name: "木綿豆腐", g: 100 }] },
      { title: "間食", items: [{ name: "無脂肪ヨーグルト（無糖）", g: 150 }, { name: "りんご", g: 150 }] },
    ],
  },
  {
    id: "lowcarb",
    letter: "D",
    name: "糖質オフ",
    short: "糖質オフ",
    tag: "ごはんを減らして、肉・魚・卵で満足感",
    who: "糖質を控えたい人、食後の眠気が気になる人。糖尿病などで薬を使っている人は、必ず医師に相談を。",
    tips: ["炭水化物は約34g。ごはんをやめて、野菜と豆腐でかさを出す", "脂質は多めになるので、体重を落としたい日は、油の量を調整", "食物繊維が不足しやすいので、野菜やきのこは毎食入れる"],
    color: "#ffd23f",
    meals: [
      { title: "朝食", items: [{ name: "卵", g: 150 }, { name: "アボカド", g: 70 }, { name: "ブロッコリー", g: 80 }, { name: "バター", g: 8 }] },
      { title: "昼食", items: [{ name: "鶏もも肉（皮つき）", g: 150 }, { name: "キャベツ", g: 120 }, { name: "トマト", g: 80 }, { name: "オリーブオイル", g: 10 }] },
      { title: "夕食", items: [{ name: "サケ（焼き）", g: 120 }, { name: "ほうれん草", g: 80 }, { name: "えのき", g: 50 }, { name: "木綿豆腐", g: 100 }] },
      { title: "間食", items: [{ name: "プロセスチーズ", g: 30 }, { name: "アーモンド", g: 20 }] },
    ],
  },
];

const byName = new Map(FOODS.map((f) => [f.name, f]));
const r1 = (n: number) => Math.round(n * 10) / 10;

function total(menu: Menu) {
  let p = 0,
    f = 0,
    c = 0,
    fi = 0,
    salt = 0;
  for (const m of menu.meals)
    for (const i of m.items) {
      const food = byName.get(i.name);
      if (!food) continue;
      const k = i.g / 100;
      p += food.p * k;
      f += food.f * k;
      c += food.c * k;
      fi += (food.fi ?? 0) * k;
      salt += (food.salt ?? 0) * k;
    }
  return { p, f, c, fi, salt, kcal: p * 4 + f * 9 + c * 4 };
}

type Goal = { p: string; f: string; c: string };

export default function MealCompare({
  goal,
  onAdd,
}: {
  goal: Goal;
  onAdd: (name: string, grams: number) => void;
}) {
  const [sel, setSel] = useState("wa");
  const [added, setAdded] = useState("");
  const rows = useMemo(() => MENUS.map((m) => ({ menu: m, t: total(m) })), []);
  const best = {
    p: Math.max(...rows.map((r) => r.t.p)),
    f: Math.min(...rows.map((r) => r.t.f)),
    c: Math.min(...rows.map((r) => r.t.c)),
    kcal: Math.min(...rows.map((r) => r.t.kcal)),
  };
  const cur = rows.find((r) => r.menu.id === sel) ?? rows[0];
  const gp = parseFloat(goal.p),
    gf = parseFloat(goal.f),
    gc = parseFloat(goal.c);
  const hasGoal = gp > 0 && gf > 0 && gc > 0;
  const gk = hasGoal ? gp * 4 + gf * 9 + gc * 4 : 0;

  return (
    <section className="card mcmp" aria-label="1日の食事例の比較">
      <h2 className="h2">🍽 1日の食事例をくらべる</h2>
      <p className="mnote">4つのタイプを、ひと目で比べられます。タップすると、くわしい献立が下に出ます。</p>

      <div className="mtable">
        <div className="mhdr" aria-hidden>
          <span>メニュー</span>
          <span>kcal</span>
          <span className="hp">P</span>
          <span className="hf">F</span>
          <span className="hc">C</span>
        </div>
        {hasGoal && (
          <div className="mgoalrow">
            <b>🎯 あなたの目標</b>
            <span className="num">{Math.round(gk)}</span>
            <span className="num">{Math.round(gp)}</span>
            <span className="num">{Math.round(gf)}</span>
            <span className="num">{Math.round(gc)}</span>
          </div>
        )}
        {rows.map(({ menu, t }) => {
          const e = t.kcal || 1;
          const pp = Math.round(((t.p * 4) / e) * 100);
          const fp = Math.round(((t.f * 9) / e) * 100);
          const cp = Math.max(0, 100 - pp - fp);
          return (
            <button
              key={menu.id}
              className={sel === menu.id ? "mrow on" : "mrow"}
              onClick={() => {
                setSel(menu.id);
                setAdded("");
              }}
              aria-pressed={sel === menu.id}
              style={{ ["--mc" as string]: menu.color }}
            >
              <span className="mname">
                <i className="mletter">{menu.letter}</i>
                <b>{menu.short}</b>
              </span>
              <span className={t.kcal === best.kcal ? "num best" : "num"}>{Math.round(t.kcal)}</span>
              <span className={t.p === best.p ? "num p best" : "num p"}>{Math.round(t.p)}</span>
              <span className={t.f === best.f ? "num f best" : "num f"}>{Math.round(t.f)}</span>
              <span className={t.c === best.c ? "num c best" : "num c"}>{Math.round(t.c)}</span>
              <span className="mbar" aria-label={`エネルギー比 P${pp}% F${fp}% C${cp}%`}>
                <i className="bp" style={{ width: `${pp}%` }}>
                  {pp >= 12 && `${pp}%`}
                </i>
                <i className="bf" style={{ width: `${fp}%` }}>
                  {fp >= 12 && `${fp}%`}
                </i>
                <i className="bc" style={{ width: `${cp}%` }}>
                  {cp >= 12 && `${cp}%`}
                </i>
              </span>
            </button>
          );
        })}
      </div>      <p className="mlegend">
        <span><i className="dp" />P たんぱく質</span>
        <span><i className="df" />F 脂質</span>
        <span><i className="dc" />C 炭水化物</span>
        <span>数字はg（kcalのみ除く）／◎＝いちばん多い・少ない</span>
      </p>

      <div className="mdetail" style={{ ["--mc" as string]: cur.menu.color }}>
        <h3>
          <i className="mletter">{cur.menu.letter}</i>
          {cur.menu.name}の献立
        </h3>
        <p className="mtag">{cur.menu.tag}</p>
        <p className="mwho"><b>向いている人</b>{cur.menu.who}</p>
        <div className="mmeals">
          {cur.menu.meals.map((m) => (
            <div key={m.title} className="mmeal">
              <b>{m.title}</b>
              <ul>
                {m.items.map((i) => (
                  <li key={i.name}>
                    {i.name} <span>{i.g}g</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="msum">
          合計 <b>{Math.round(cur.t.kcal)}kcal</b>　食物繊維 {r1(cur.t.fi)}g　塩分 {r1(cur.t.salt)}g
          {hasGoal && (
            <>
              <br />
              目標との差　P{cur.t.p - gp >= 0 ? "+" : ""}
              {r1(cur.t.p - gp)}g　F{cur.t.f - gf >= 0 ? "+" : ""}
              {r1(cur.t.f - gf)}g　C{cur.t.c - gc >= 0 ? "+" : ""}
              {r1(cur.t.c - gc)}g
            </>
          )}
        </p>
        <div className="mtips">
          <b>続けるコツ</b>
          <ul>
            {cur.menu.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <button
          className="btn"
          onClick={() => {
            cur.menu.meals.forEach((m) => m.items.forEach((i) => onAdd(i.name, i.g)));
            setAdded(cur.menu.id);
          }}
        >
          {added === cur.menu.id ? "✓ 今日の記録に追加しました" : "＋ この献立を今日の記録に追加"}
        </button>
      </div>
      <p className="mnote small">
        食材は一例です。同じ栄養の食品に置きかえても大丈夫です。必要なエネルギーは、年齢・体格・活動量で変わります。
      </p>
    </section>
  );
}




