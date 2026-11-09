"use client";

import { useState } from "react";
import CondGuide from "./CondGuide";
import NutrientCond from "./NutrientCond";

// 持病・体質のある方向け。「食事と運動」と「栄養素の表」を、1か所にまとめて、切りかえる。
export default function CondHub() {
  const [v, setV] = useState<"guide" | "table">("guide");
  return (
    <div className="condhub">
      <div className="plpace" role="radiogroup" aria-label="表示の切りかえ">
        <button type="button" role="radio" aria-checked={v === "guide"} className={v === "guide" ? "on" : ""} onClick={() => setV("guide")}>
          食事と運動
        </button>
        <button type="button" role="radio" aria-checked={v === "table"} className={v === "table" ? "on" : ""} onClick={() => setV("table")}>
          栄養素の表
        </button>
      </div>
      {v === "guide" ? <CondGuide /> : <NutrientCond />}
    </div>
  );
}