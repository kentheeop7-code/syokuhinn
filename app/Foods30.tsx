import { NUT_BASIS, foodsFor, unitLabel } from "../lib/foodlist";

// たんぱく質10gをとれる食品15種と、脂質が多い食品15種（合わせて30種）。お客様向け資料用。
export default function Foods30() {
  const blocks = [
    { k: "p" as const, t: "たんぱく質 10g をとれる食品（15種）", rows: foodsFor("p", 10).filter((r) => !/乾|粉|ソース|ふりかけ/.test(r.name)).slice(0, 15) },
    { k: "f" as const, t: "脂質が多い食品（脂質10gをとれる量・15種）", rows: foodsFor("f", 10).filter((r) => !/油|ラード|ショートニング|マーガリン|ドレッシング|マヨ/.test(r.name)).slice(0, 15) },
  ];
  return (
    <>
      <p className="rnote">上の15種は「たんぱく質10gをとれる量」、下の15種は「脂質が多い食品（脂質10gをとれる量）」です。脂質は、とりすぎないよう、量の目安に、使ってください。</p>
      <div className="fufoods">
        {blocks.map((b) => (
          <div key={b.k} className="fufood">
            <p className="fufh">{b.t}</p>
            <table className="rtable rinct">
              <tbody>
                {b.rows.map((r) => (
                  <tr key={r.name}>
                    <th>
                      {r.name}
                      <small style={{ display: "block", fontWeight: 400, color: "#667" }}>{unitLabel(r)}</small>
                    </th>
                    <td>{r.g}g</td>
                    <td>{r.kcal}kcal</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="rxr">根拠：{NUT_BASIS[b.k]}</p>
          </div>
        ))}
      </div>
    </>
  );
}
