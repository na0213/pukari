# Phase 2: 空の画面とシャボン玉の描画

## このフェーズの目的
メイン画面（空）にシャボン玉がふわふわ浮かぶ状態を実装する。CSSアニメーションで「磨かれたシャボン玉」を表現する。

## 前提
- Phase 1 が完了していること
- CLAUDE.md の安全ルールに従うこと

---

## 指示

### 1. シャボン玉のCSSアニメーション（`src/styles/animations.css`）

シャボン玉の見た目と動きをCSSで実装してください。以下の仕様に従ってください。

**シャボン玉の見た目:**
- 円形（`border-radius: 50%`）
- 半透明のグラデーション背景（白→水色→薄紫）
- `radial-gradient` で光沢感（左上にハイライト）
- `box-shadow` で柔らかい影と微妙な発光
- border は極薄の白（シャボン玉の膜の表現）
- 内部に `::before` 疑似要素で小さな光の反射点

**シャボン玉のサイズ:**
- 基本サイズ: 80px〜120px（ランダム）
- 「そばに置いた」状態: 基本より20%大きい
- テキストは泡の中に極小フォントで数文字だけ表示（overflow hidden）

**ふわふわアニメーション:**
- `@keyframes float` — ゆっくり上下に漂う（振幅: 10px〜20px）
- 各泡にランダムな `animation-duration`（3s〜6s）と `animation-delay`
- 左右にも微妙に揺れる（`@keyframes sway`、振幅5px程度）
- `prefers-reduced-motion` の場合はアニメーション無効

**状態ごとの視覚的差分:**
```
floating（浮かんでいる）: 標準サイズ、薄い透明感
nearby（そばに置いた）:  少し大きい、色が少し濃い、画面手前に
touched（触れた）:       ほんのり光る（box-shadow glow追加）
done（できた）:          空に溶けるアニメーション（scale up + opacity 0）
drifted（遠くへ流れた）: 小さい、半透明、画面の端
```

### 2. SkyView コンポーネント（`src/components/Sky/SkyView.tsx`）

メイン画面を実装してください:

- 画面全体が空のグラデーション背景（CSS変数 `--sky-dawn` をデフォルト）
- 泡のデータ（とりあえずモックデータ5個）をランダムな位置に配置
- 各泡は `BubbleItem` コンポーネントで描画
- 画面下部に入力エリア（Phase 3で実装するので、今はプレースホルダー）
- 画面下部に「今日の空」ボタン（Phase 4で実装するので、今はプレースホルダー）

**モックデータ:**
```typescript
const mockBubbles: Bubble[] = [
  { id: '1', text: '記事の企画を考える', status: 'floating', createdAt: new Date() },
  { id: '2', text: '金魚の水換え', status: 'nearby', createdAt: new Date() },
  { id: '3', text: 'なんか疲れた', status: 'touched', createdAt: new Date(), touchedAt: new Date() },
  { id: '4', text: '新しいアプリのアイデア', status: 'floating', createdAt: new Date() },
  { id: '5', text: '洗濯物たたむ', status: 'floating', createdAt: new Date() },
];
```

### 3. BubbleItem コンポーネント（`src/components/Bubble/BubbleItem.tsx`）

個々のシャボン玉を描画:

- `Bubble` データを受け取って描画
- 状態に応じたCSSクラスを付与
- テキストは最初の6文字程度を極小で表示（溢れたら非表示）
- タップしたときのコールバックを受け取る（`onTap`）
- framer-motion で初期表示時にふわっと現れるアニメーション

### 4. 空の色ロジック（`src/hooks/useSkyColor.ts`）

「できた」数に応じて空の色を返すフック:

```typescript
function useSkyColor(doneCount: number): SkyPhase {
  if (doneCount === 0) return 'dawn';
  if (doneCount <= 2) return 'morning';
  if (doneCount <= 4) return 'afternoon';
  if (doneCount <= 6) return 'sunset';
  return 'night';
}
```

SkyView の背景グラデーションは、この `SkyPhase` に応じて CSS変数を切り替える。

---

## 完了条件

- [ ] シャボン玉がCSSアニメーションでふわふわ浮かんでいる
- [ ] 5つのモック泡が空にランダム配置されている
- [ ] 各状態（floating, nearby, touched）で見た目が異なる
- [ ] 空の背景がグラデーションで表示されている
- [ ] `prefers-reduced-motion` でアニメーションが停止する
- [ ] スマートフォン幅（375px）で問題なく表示される
