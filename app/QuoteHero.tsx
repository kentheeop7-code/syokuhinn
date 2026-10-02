"use client";

import { useEffect, useState } from "react";

const QUOTES = [
  { text: "千里の道も一歩から", by: "老子" },
  { text: "継続は力なり", by: "ことわざ" },
  {
    text: "小さなことを積み重ねることが、とんでもないところへ行く唯一の道",
    by: "イチロー",
  },
  {
    text: "10回で気分が良くなり、20回で見た目が変わり、30回で体のすべてが変わる",
    by: "ジョセフ・ピラティス",
  },
  { text: "練習をするほど輝きを増す", by: "B.K.S.アイアンガー" },
  { text: "できると思えばできる、できないと思えばできない", by: "ヘンリー・フォード" },
  { text: "立ち止まらない限り、どんなにゆっくりでも進めばいい", by: "孔子" },
  { text: "強さとは体力ではなく、不屈の意志から生まれる", by: "マハトマ・ガンジー" },
  { text: "今日できることを明日に延ばすな", by: "ベンジャミン・フランクリン" },
  { text: "努力する人は希望を語り、怠ける人は不満を語る", by: "井上靖" },
  { text: "夢を見ることができれば、それは実現できる", by: "ウォルト・ディズニー" },
  { text: "健康は最大の財産である", by: "ラルフ・ウォルドー・エマーソン" },
];

const INTERVAL_MS = 4000;

export default function QuoteHero() {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState(-1);

  const go = (n: number) => {
    setPrev(i);
    setI(n);
  };

  useEffect(() => {
    const id = setInterval(() => {
      setI((cur) => {
        setPrev(cur);
        return (cur + 1) % QUOTES.length;
      });
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="hero" aria-label="今日のひとこと">
      <span className="herolabel">TODAY&apos;S WORD</span>
      <div className="herostage">
        {QUOTES.map((q, n) => (
          <figure
            key={q.text}
            className={`hq${n === i ? " on" : n === prev ? " out" : ""}`}
            aria-hidden={n !== i}
          >
            <blockquote>{q.text}</blockquote>
            <figcaption>{q.by}</figcaption>
          </figure>
        ))}
      </div>
      <div className="herodots">
        {QUOTES.map((q, n) => (
          <button
            key={q.text}
            className={n === i ? "hdot on" : "hdot"}
            onClick={() => go(n)}
            aria-label={`${n + 1}番目の言葉`}
          />
        ))}
      </div>
    </section>
  );
}
