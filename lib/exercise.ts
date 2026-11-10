// 筋トレ以外の運動の記録。種類・1回の時間・週の回数。国の目安（身体活動・運動ガイド2023）と、くらべる。
export type OtherEx = { id: string; min: number; days: number };
export const OTHER_TYPES: { id: string; t: string; icon: string }[] = [
  { id: "walk", t: "ウォーキング", icon: "🚶" },
  { id: "brisk", t: "速歩", icon: "🏃" },
  { id: "jog", t: "ジョギング", icon: "👟" },
  { id: "bike", t: "自転車", icon: "🚴" },
  { id: "swim", t: "水泳・水中歩行", icon: "🏊" },
  { id: "yoga", t: "ヨガ・ストレッチ", icon: "🧘" },
  { id: "dance", t: "ダンス・エアロ", icon: "💃" },
  { id: "sport", t: "スポーツ（球技など）", icon: "🏐" },
  { id: "home", t: "自宅の運動", icon: "🏠" },
];
export const MINUTES = [10, 20, 30, 45, 60, 90];
export const labelOf = (id: string) => OTHER_TYPES.find((x) => x.id === id)?.t ?? id;
export const weeklyMin = (list: OtherEx[]) => list.reduce((s, x) => s + x.min * x.days, 0);
// 国の目安：歩行など 1日60分（65歳以上は40分）。1週間に直す。
export const guideMin = (band: number) => (band >= 5 ? 40 : 60) * 7;
export function describeEx(strengthDays: number, list: OtherEx[]): string[] {
  const out: string[] = [];
  if (strengthDays > 0) out.push(`筋トレ：週${strengthDays}回`);
  list.forEach((x) => out.push(`${labelOf(x.id)}：1回${x.min}分 × 週${x.days}回（週${x.min * x.days}分）`));
  return out;
}