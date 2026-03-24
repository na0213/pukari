# 修正指示：UI簡素化とシャボン玉サイズの動的変化

CLAUDE.md の安全ルールに従って修正してください。
**この修正は大きな変更です。1ファイルずつ確認しながら進めてください。**

---

## 変更の概要

以下を廃止し、アプリをシンプルにします:

- `touched` 状態と `touchedAt`（泡を開いて見るだけでは記録しない）
- `repeatable` フラグと「くりかえす」トグル
- `drifted` 状態と「遠くへ流す」機能
- 泡の長押しメニュー

代わりに:
- 全ての泡に「できた！」と「今日はここまで」の2つのボタンを出す
- 泡のサイズを個数に応じて動的に変化させる
- キープした泡は1.3倍大きく表示

---

## 修正1: 型定義の変更

### 対象ファイル: `src/types/bubble.ts`

```typescript
// シャボン玉の状態（簡素化）
export type BubbleStatus =
  | 'floating'    // 浮かんでいる（初期状態）
  | 'nearby'      // キープした
  | 'completed';  // できた（空に溶けた）

// シャボン玉のデータ（簡素化）
export interface Bubble {
  id: string;
  text: string;            // 1行のつぶやき
  memo?: string;           // 補足メモ（任意）
  status: BubbleStatus;
  sizeFactor: number;      // ★追加: ランダムサイズ係数（0.8〜1.2）作成時に決定
  createdAt: Date;
  completedAt?: Date;      // できた日時（completed のみ）
}

// 泡の日ごとの記録（変更なし）
export interface BubbleLog {
  id: string;
  bubbleId: string;
  date: string;            // YYYY-MM-DD
  type: 'done';            // ★変更: 'touched' を廃止。'done' のみ
  createdAt: Date;
}
```

**削除するフィールド:**
- `touchedAt` — 廃止
- `driftedAt` — 廃止
- `repeatable` — 廃止

**削除する状態:**
- `'touched'` — 廃止
- `'drifted'` — 廃止

---

## 修正2: useBubbles フックの変更

### 対象ファイル: `src/hooks/useBubbles.ts`

```typescript
interface UseBubblesReturn {
  bubbles: Bubble[];                          // 全ての泡
  activeBubbles: Bubble[];                    // floating + nearby の泡（空に見えている）
  completedBubbles: Bubble[];                 // 完了した泡

  addBubble: (text: string) => void;          // 新しい泡を追加（sizeFactor をランダム生成）
  keepBubble: (id: string) => void;           // ★名称変更: キープする（nearby に変更）
  markDone: (id: string) => void;             // できた！（completed に変更 + done ログ）
  markDoneToday: (id: string) => void;        // ★新規: 今日はここまで（done ログのみ。泡は残る）
  updateMemo: (id: string, memo: string) => void;
  removeBubble: (id: string) => void;         // 完全削除（ユーザー操作のみ）

  todayLogs: BubbleLog[];
  isBubbleDoneToday: (id: string) => boolean; // この泡は今日「ここまで」or「できた」済みか
  todayDoneCount: number;                     // 今日の done ログ数（空の色計算用）
  totalCount: number;
  canAdd: boolean;
}
```

**addBubble の変更:**
```typescript
function addBubble(text: string) {
  const newBubble: Bubble = {
    id: generateId(),
    text,
    status: 'floating',
    sizeFactor: 0.8 + Math.random() * 0.4,  // 0.8〜1.2 のランダム値
    createdAt: new Date(),
  };
  // ...保存処理
}
```

**markDone（できた！）の変更:**
```typescript
function markDone(id: string) {
  // 泡を completed に変更
  updateStatus(id, 'completed');
  // done ログを追加
  addLog({ bubbleId: id, date: todayStr(), type: 'done' });
}
```

**markDoneToday（今日はここまで）— 新規:**
```typescript
function markDoneToday(id: string) {
  // 泡の状態は変えない（floating or nearby のまま）
  // done ログだけ追加
  addLog({ bubbleId: id, date: todayStr(), type: 'done' });
}
```

**削除する関数:**
- `touchBubble` — 廃止
- `toggleRepeatable` — 廃止
- `driftedBubbles` — 廃止

**状態遷移ルール（簡素化）:**
```
floating → nearby（キープする）
floating → completed（できた！）
nearby → completed（できた！）

「今日はここまで」は状態を変えない。ログだけ追加。
逆方向の遷移は許可しない。
```

**localStorage キーの変更:**
- `pukari-bubbles` — 泡データ（変更あり: フィールド削減）
- `pukari-logs` — ログデータ（変更あり: type は 'done' のみ）

---

## 修正3: BubbleDetail の変更

### 対象ファイル: `src/components/Bubble/BubbleDetail.tsx`

**画面構成（上から順に）:**

1. **泡のテキスト**（1行、太字）
2. **状態バッジ**（「キープ中」のみ表示。floating の場合は非表示）
3. **メモ欄**（「メモを追加...」プレースホルダー）
4. **作成日**（小さく「2026年3月22日 に浮かんだ」）
5. **ボタンエリア:**
   - **「今日はここまで」ボタン** — 左側。控えめなスタイル（アウトライン or テキストボタン）
   - **「できた！」ボタン** — 右側。メインスタイル（緑の背景）
6. **閉じるボタン**（右下に小さく「閉じる」）

**ボタンの状態:**

今日すでに done ログがある泡の場合:
- 「今日はここまで」→「✓ 今日は記録済み」（disabled、薄いグレー）
- 「できた！」→ そのまま押せる（完了したい場合もあるため）

今日まだ done ログがない泡の場合:
- 「今日はここまで」→ 押せる
- 「できた！」→ 押せる

**削除する要素:**
- 「くりかえす」トグルとキャプション — 廃止
- 「遠くへ流す」— 廃止（長押しメニューも廃止）
- 「触れた」バッジ — 廃止

---

## 修正4: BubbleItem のサイズ動的計算

### 対象ファイル: `src/components/Bubble/BubbleItem.tsx` / `BubbleItem.css`

**泡のサイズ計算:**

```typescript
// 個数に応じた基準サイズ（px）
function getBaseSize(totalCount: number): number {
  if (totalCount <= 10) return 90;
  if (totalCount <= 30) return 60;
  if (totalCount <= 60) return 42;
  return 30;  // 61〜100個
}

// 実際の泡サイズ
function getBubbleSize(totalCount: number, bubble: Bubble): number {
  const base = getBaseSize(totalCount);
  const keepMultiplier = bubble.status === 'nearby' ? 1.3 : 1.0;
  return Math.round(base * bubble.sizeFactor * keepMultiplier);
}
```

- `totalCount` は `activeBubbles.length`（空に見えている泡の数）
- `sizeFactor` は泡ごとに作成時に決まるランダム値（0.8〜1.2）
- `nearby`（キープ）の泡は 1.3 倍

**BubbleItem に `totalCount` を props で渡す:**
```typescript
interface BubbleItemProps {
  bubble: Bubble;
  totalCount: number;    // ★追加
  onTap: (id: string) => void;
}
```

**CSSの変更:**
- 固定サイズのクラス（`.bubble-floating`, `.bubble-nearby` 等のサイズ指定）を削除
- 代わりに `style={{ width: size, height: size }}` でインラインサイズを適用
- フォントサイズも泡のサイズに連動させる（泡サイズの 15% 程度）
- 泡が小さすぎるとき（35px以下）はテキストを非表示にする

**泡のテキスト表示ルール:**
- 泡サイズ 60px 以上: 最初の6文字を表示
- 泡サイズ 35px〜59px: 最初の3文字を表示
- 泡サイズ 35px 未満: テキスト非表示（色と大きさだけで区別）

---

## 修正5: SkyView の横スクロール対応

### 対象ファイル: `src/components/Sky/SkyView.tsx` / `SkyView.css`

空を**横方向にスクロール**できるようにする。「空を横に見渡す」感覚。

**レイアウト:**
- 空のエリアは横スクロール（`overflow-x: auto`, `overflow-y: hidden`）
- 泡は横長のエリアにランダム配置される
- スクロール方向はスマホの横スワイプで自然に操作できる

**空の幅（横幅）の計算:**
- 泡の個数に応じて横幅を動的に拡張する
- 1〜10個: 画面幅（100vw）に収める（スクロール不要）
- 11〜30個: 画面幅の 200%
- 31〜60個: 画面幅の 300%
- 61〜100個: 画面幅の 400%

**空の高さ:**
- 画面高さから入力バーと「今日の空」ボタンの高さを引いた固定値
- 泡は縦方向にはランダム配置されるが、はみ出さない

**固定要素（スクロールしても動かない）:**
- 入力バー: 画面下部に固定（`position: fixed`）
- 「今日の空」ボタン: 画面下部に固定
- 検索ボタン（修正9で追加）: 画面右下に固定

**スクロールバーの見た目:**
- デフォルトのスクロールバーは非表示にする（`scrollbar-width: none`, `::-webkit-scrollbar { display: none }`）
- スクロール可能であることを示すために、空の右端にうっすらグラデーション（フェードアウト）を表示する
- 泡が画面に収まっている場合はフェードアウトを表示しない

**スクロール位置の保持:**
- 泡の詳細を開いて閉じたとき、スクロール位置が戻らないようにする
- 新しい泡を追加したとき、その泡の位置にスクロールする

---

## 修正6: BubbleItem の長押しメニュー削除

### 対象ファイル: `src/components/Bubble/BubbleItem.tsx` / `BubbleItem.css`

- 長押しメニュー（「遠くへ流す」）を完全に削除する
- 長押しイベントのハンドラも削除する
- 泡はタップのみで反応する

---

## 修正7: useSkyColor の変更

### 対象ファイル: `src/hooks/useSkyColor.ts`

変更なし。`todayDoneCount` は `bubble_logs` の今日の `type = 'done'` をカウント。
「今日はここまで」も「できた！」も同じ `done` ログなので、両方カウントされる。

---

## 修正8: DailySkyView の変更

### 対象ファイル: `src/components/DailySky/DailySkyView.tsx`

**「触れたこと」セクションを廃止。**

表示するのは:
- 今日の空の色
- 「できたこと」一覧（done ログに対応する泡のテキスト）
  - 「できた！」で完了した泡も、「今日はここまで」の泡も同じ一覧に表示
  - 完了した泡には小さく「✓完了」マーク
  - 「今日はここまで」の泡にはマークなし（区別するが、目立たせない）
- 何もない日は「まだ何もなくても、大丈夫。」

**削除:**
- 「触れたこと」セクション
- 「触れた数」の表示

---

## 修正9: 泡の検索機能（新規追加）

### 新規ファイル: `src/components/Bubble/BubbleSearch.tsx` / `BubbleSearch.css`
### 追加対象: `src/components/Sky/SkyView.tsx`

泡が多いときに目的の泡を素早く見つけるための検索機能。

**検索ボタン:**
- 画面右下（入力バーの上あたり）に小さな検索アイコン（🔍）を常時表示
- `position: fixed` でスクロールに影響されない
- 泡が10個以下のときは非表示（少ないときは不要）

**検索パネル（検索ボタンをタップで開く）:**
- 画面下部からスライドアップするパネル
- パネル内に、現在空にある泡のテキスト一覧をリスト表示（セレクト形式）
- フリーテキスト入力欄はなし。一覧から選ぶだけ
- 一覧はスクロール可能
- 並び順: 作成日が新しい順

**セレクト後の挙動:**
- 一覧から泡を選択する
- 検索パネルが閉じる
- 空が自動スクロールして、選択された泡が画面中央に来る
- 選択された泡が2秒間キラッと光る（`box-shadow` のglow を一時的に強くする）
- 2秒後に光は消える（通常に戻る）

**検索パネルのデザイン:**
- すりガラス風の背景（`backdrop-filter: blur`）
- 角丸のカード内にリストが並ぶ
- 各項目は泡のテキスト（全文）と作成日（小さく）
- 「キープ中」の泡は項目の横に小さなマーク
- パネル外をタップで閉じる

---

## 確認方法

全ての修正が完了したら:

1. 開発サーバーを起動する
2. 泡を5個追加する → サイズにランダムなばらつきがあることを確認
3. 泡を20個追加する → 全体的にサイズが小さくなり、横スクロールで見渡せることを確認
4. 空の右端にうっすらフェードアウトが表示されることを確認
5. 1つの泡を「キープする」→ その泡だけ大きくなることを確認
6. 泡をタップして開く → ログに何も記録されないことを確認
7. 「今日はここまで」を押す → 泡が残り、ボタンが「✓ 今日は記録済み」に変わることを確認
8. 「できた！」を押す → 泡が空に溶けることを確認
9. 「今日の空」を開く → 「今日はここまで」と「できた！」が両方表示されることを確認
10. 泡が11個以上のとき、検索ボタンが表示されることを確認
11. 検索ボタンをタップ → 泡のリストが表示されることを確認
12. リストから泡を選択 → 空がスクロールして該当の泡が中央に来て、キラッと光ることを確認
13. 長押しで何も起きないことを確認
14. 「くりかえす」トグルが表示されないことを確認
15. 「確認完了しました。サーバーを停止します。」と報告してからサーバーを停止する
16. **私の指示を待つ**
