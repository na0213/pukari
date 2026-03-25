# 修正指示：ビジュアル品質の全体的な向上

CLAUDE.md の安全ルールに従って修正してください。
**この修正はビジュアル面の大きな改善です。1ファイルずつ確認しながら進めてください。**

---

## 修正1: シャボン玉の質感を大幅に強化

### 対象ファイル: `src/components/Bubble/BubbleItem.tsx` / `BubbleItem.css`

現在の泡はフラットで「ただの丸」に見える。以下のCSS技法でリアルなシャボン玉に近づける。

**泡のCSS（全面書き換え）:**

```css
.bubble {
  border-radius: 50%;
  position: absolute;
  cursor: pointer;
  /* 基本の泡 */
  background: radial-gradient(
    circle at 30% 25%,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.15) 20%,
    rgba(173, 216, 230, 0.1) 40%,
    rgba(200, 170, 255, 0.05) 60%,
    rgba(255, 255, 255, 0.08) 80%,
    transparent 100%
  );
  /* 虹色の膜 */
  border: 1px solid rgba(255, 255, 255, 0.25);
  /* 光の反射 */
  box-shadow:
    inset 0 0 20px rgba(255, 255, 255, 0.15),
    inset -5px -5px 15px rgba(200, 170, 255, 0.08),
    0 0 15px rgba(173, 216, 230, 0.2);
  /* なめらかさ */
  backdrop-filter: blur(1px);
  transition: all 0.3s ease;
}

/* 光のハイライト（左上の丸い反射） */
.bubble::before {
  content: '';
  position: absolute;
  top: 12%;
  left: 18%;
  width: 25%;
  height: 20%;
  background: radial-gradient(
    ellipse,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 70%
  );
  border-radius: 50%;
}

/* 下部の虹色反射 */
.bubble::after {
  content: '';
  position: absolute;
  bottom: 15%;
  right: 15%;
  width: 30%;
  height: 15%;
  background: linear-gradient(
    135deg,
    rgba(255, 180, 200, 0.15),
    rgba(180, 200, 255, 0.15),
    rgba(180, 255, 200, 0.1)
  );
  border-radius: 50%;
  filter: blur(2px);
}
```

**状態ごとのバリエーション:**

```css
/* floating: 標準 */
.bubble-floating {
  animation: bubble-float var(--float-duration, 4s) ease-in-out infinite;
  opacity: 0.85;
}

/* nearby（キープ中）: やや明るく、存在感を出す */
.bubble-nearby {
  animation: bubble-float-active var(--float-duration, 3s) ease-in-out infinite;
  opacity: 1;
  box-shadow:
    inset 0 0 25px rgba(255, 255, 255, 0.2),
    inset -5px -5px 15px rgba(200, 170, 255, 0.1),
    0 0 20px rgba(100, 180, 255, 0.3),
    0 0 40px rgba(100, 180, 255, 0.1);
}

/* completed: 空に溶ける */
.bubble-completing {
  animation: bubble-dissolve 1.2s ease-out forwards;
}
```

**ふわふわアニメーションの強化:**

```css
/* ゆったり浮遊（通常） */
@keyframes bubble-float {
  0%, 100% {
    transform: translateY(0) translateX(0) rotate(0deg);
  }
  25% {
    transform: translateY(-12px) translateX(5px) rotate(1deg);
  }
  50% {
    transform: translateY(-5px) translateX(-3px) rotate(-0.5deg);
  }
  75% {
    transform: translateY(-15px) translateX(2px) rotate(0.5deg);
  }
}

/* キープ中の浮遊（少し活発） */
@keyframes bubble-float-active {
  0%, 100% {
    transform: translateY(0) translateX(0) scale(1);
  }
  33% {
    transform: translateY(-10px) translateX(6px) scale(1.02);
  }
  66% {
    transform: translateY(-18px) translateX(-4px) scale(0.98);
  }
}

/* 空に溶けるアニメーション */
@keyframes bubble-dissolve {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.6;
    box-shadow:
      0 0 30px rgba(255, 255, 255, 0.4),
      0 0 60px rgba(173, 216, 230, 0.3);
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
    box-shadow:
      0 0 50px rgba(255, 255, 255, 0.2),
      0 0 100px rgba(173, 216, 230, 0.1);
  }
}
```

**各泡にランダムなアニメーション速度を設定:**
- `--float-duration`: 3s〜6s（ランダム）
- `animation-delay`: 0s〜3s（ランダム）
- 各泡が微妙に違うリズムで揺れることで、自然な空間になる

---

## 修正2: ホーム画面の背景を「空」にする

### 対象ファイル: `src/components/Sky/SkyView.tsx` / `SkyView.css`

現在の淡い水色一色を「空」に見えるようにする。

**背景に追加するレイヤー:**

```css
/* 基本のグラデーション（既存を維持） */
.sky-background {
  /* 既存の空の色グラデーション */
}

/* 雲レイヤー（極薄の白い楕円が2〜3個、ゆっくり動く） */
.sky-cloud {
  position: absolute;
  background: radial-gradient(
    ellipse 100% 60%,
    rgba(255, 255, 255, 0.12) 0%,
    transparent 70%
  );
  border-radius: 50%;
  pointer-events: none;
  animation: cloud-drift linear infinite;
}

.sky-cloud-1 {
  width: 300px;
  height: 100px;
  top: 8%;
  animation-duration: 60s;
}

.sky-cloud-2 {
  width: 200px;
  height: 70px;
  top: 25%;
  animation-duration: 80s;
  animation-delay: -20s;
}

.sky-cloud-3 {
  width: 250px;
  height: 80px;
  top: 15%;
  animation-duration: 70s;
  animation-delay: -40s;
}

@keyframes cloud-drift {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(calc(100vw + 100%)); }
}

/* 光の粒子レイヤー（極小の光が数個、ゆっくり明滅） */
.sky-particle {
  position: absolute;
  width: 3px;
  height: 3px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
  pointer-events: none;
  animation: particle-glow 4s ease-in-out infinite;
}

@keyframes particle-glow {
  0%, 100% { opacity: 0.1; transform: scale(0.8); }
  50% { opacity: 0.5; transform: scale(1.2); }
}
```

**SkyView.tsx で雲と粒子を生成:**
- 雲: 3個（固定。位置はCSS）
- 光の粒子: 5〜8個（位置とアニメーション速度をランダム生成）
- 粒子はシャボン玉より背面（z-index低い）

**prefers-reduced-motion の場合:**
- 雲は静止（画面上にランダム配置、動かない）
- 粒子のアニメーション停止

---

## 修正3: 「できた！」の演出を強化

### 対象ファイル: `src/components/Bubble/BubbleItem.tsx` / `BubbleItem.css`
### 追加対象: `src/components/Sky/SkyView.tsx` / `SkyView.css`

**泡が「できた！」で消えるとき:**

1. 泡が少し膨らむ（scale 1.0 → 1.3、0.3秒）
2. 泡の中から光が広がる（box-shadow が大きくなる）
3. 泡が透明になりながら上に浮いて消える（opacity 0、translateY -50px、0.9秒）
4. 泡が消えた瞬間、その位置に小さな光の粒子が数個パッと散る
5. **空の背景色がじんわり変わる**（次のSkyPhaseへのトランジション、1.5秒かけて）

**光の粒子エフェクト（泡が消えた瞬間）:**

```css
.bubble-sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
  animation: sparkle-burst 0.8s ease-out forwards;
  pointer-events: none;
}

@keyframes sparkle-burst {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--sparkle-x), var(--sparkle-y)) scale(0);
    opacity: 0;
  }
}
```

- 粒子は5〜8個。各粒子に `--sparkle-x` と `--sparkle-y` をランダムに設定（-30px〜30px）
- 0.8秒後に自動で DOM から削除

**空の色トランジション:**

```css
.sky-background {
  transition: background 1.5s ease-in-out;
}
```

これで「できた！」を押すたびに空の色がじんわり変わる。

---

## 修正4: オーロラ画面（ブルーラグーン）の泡を強化

### 対象ファイル: `src/components/BlueLagoon/BlueLagoonView.tsx` / `BlueLagoonView.css`
### 対象: `src/components/BlueLagoon/LagoonBubbleItem.tsx` / `LagoonBubbleItem.css`

**オーロラ画面の泡:**

- サイズを大きくする: 70px → 100px（自分の泡）、80px（他の人の泡）
- 動きをゆったりに: animation-duration 6s〜10s（メイン画面の泡より遅い）

**オーロラと泡の光の干渉:**

```css
.lagoon-bubble {
  /* 基本のシャボン玉スタイル（修正1と同じ） */
  /* 加えて、オーロラの光を反射する効果 */
  mix-blend-mode: screen;
  background: radial-gradient(
    circle at 30% 25%,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(100, 255, 200, 0.1) 30%,
    rgba(150, 100, 255, 0.08) 60%,
    transparent 100%
  );
  box-shadow:
    inset 0 0 25px rgba(100, 255, 200, 0.1),
    0 0 20px rgba(100, 255, 200, 0.15),
    0 0 40px rgba(150, 100, 255, 0.08);
}

/* オーロラのグロー効果（泡の周りにオーロラ色のぼんやりした光） */
.lagoon-bubble::after {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(100, 255, 200, 0.06) 0%,
    transparent 70%
  );
  animation: aurora-reflect 8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes aurora-reflect {
  0%, 100% {
    background: radial-gradient(circle, rgba(100, 255, 200, 0.06) 0%, transparent 70%);
  }
  50% {
    background: radial-gradient(circle, rgba(150, 100, 255, 0.06) 0%, transparent 70%);
  }
}
```

泡の周りの色がオーロラの緑〜紫にゆっくり変化して、オーロラと干渉している感じが出る。

---

## 修正5: 全体のフォントとUI質感の統一

### 対象ファイル: `src/styles/global.css`

```css
/* ボタンやカードの glass morphism を統一 */
.glass-panel {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
}

/* 泡の中のテキスト */
.bubble-text {
  color: rgba(50, 50, 80, 0.7);
  font-weight: 500;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
  font-size: inherit;
}

/* ダークモード対応の泡テキスト（オーロラ画面用） */
.bubble-text-dark {
  color: rgba(220, 220, 255, 0.9);
  text-shadow: 0 0 8px rgba(100, 200, 255, 0.3);
}
```

既存のカード、モーダル、パネルに `.glass-panel` クラスを適用する。
統一された glass morphism で全体の質感を揃える。

---

## 確認方法

1. 開発サーバーを起動する
2. **泡の質感:** シャボン玉に光の反射（左上のハイライト）と虹色の下部反射が見えること
3. **泡の動き:** 各泡がそれぞれ違うリズムでゆったり浮遊していること
4. **キープ中の泡:** 通常の泡より明るく、やや存在感があること
5. **ホームの背景:** 極薄の雲がゆっくり流れていること。光の粒子が明滅していること
6. **「できた！」演出:** 泡が膨らみ→光が広がり→粒子が散り→空の色がじんわり変わること
7. **オーロラ画面:** 泡が大きく、ゆったり動き、オーロラの色を反射していること
8. **glass morphism:** モーダルやパネルの背景が統一されたすりガラス感であること
9. **prefers-reduced-motion:** アニメーションが停止しても見た目が崩れないこと
10. **スマホ幅（375px）:** 全てが正しく表示されること
11. 「確認完了しました。サーバーを停止します。」と報告してからサーバーを停止する
12. **私の指示を待つ**
