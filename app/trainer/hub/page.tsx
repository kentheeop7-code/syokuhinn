import type { Metadata } from "next";
import TrainerHub from "../../TrainerHub";
import TrainerNav from "../../TrainerNav";

export const metadata: Metadata = {
  title: "トレーナー専用 ハブ",
  description: "トレーナー用のページへ、ここからすべて行けます。",
  robots: { index: false, follow: false },
};

export default function Hub() {
  return (
    <main className="container">
      <h1 className="title sm">トレーナー専用 ハブ</h1>
      <TrainerNav />
      <TrainerHub />
    </main>
  );
}
