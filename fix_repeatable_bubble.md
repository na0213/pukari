# 修正指示：くりかえし泡（Repeatable Bubble）の追加

CLAUDE.md の安全ルールに従って修正してください。既存ファイルを編集する前に確認を取ってください。

**この修正は複数ファイルにまたがる大きな変更です。1ファイルずつ確認しながら進めてください。**

---

## 背景

現在の設計では「できた！」を押すと泡が空に溶けて消える。しかし「英単語50個」のように毎日くりかえしたいタスクの場合、毎日新しい泡を作るか、消えた泡を復活させる必要があり不自然。また100個の枠を無駄に消費する。

**解決策:** 「できた」を泡の状態変更ではなく、日ごとの記録（ログ）として別管理する。泡自体は空に浮かんだまま。

---

## 修正1: 型定義の変更

### 対象ファイル: `src/types/bubble.ts`

以下を追加・変更してください:

```typescript
// シャボン玉の状態（変更）
// 'done' を削除。「できた」は状態ではなくログで管理する。
export type BubbleStatus = 
  | 'floating'   // 浮かんでいる（初期状態）
  | 'nearby'     // そばに置いた
  | 'touched'    // 触れた（自動記録）
  | 'completed'  // 完了（1回きりの泡が「できた」になった場合）
  | 'drifted';   // 遠くへ流れた

// シャボン玉のデータ（変更）
export interface Bubble {
  id: string;
  text: string;            // 1行のつぶやき
  memo?: string;           // 補足メモ（任意）
  status: BubbleStatus;
  repeatable: boolean;     // ★追加: くりかえし泡かどうか
  createdAt: Date;
  touchedAt?: Date;        // 最後に触れた日時（自動）
  completedAt?: Date;      // 完了日時（1回きりの泡のみ）
  driftedAt?: Date;        // 遠くへ流れた日時
}

// ★新規追加: 泡の日ごとの記録
export interface BubbleLog {
  id: string;
  bubbleId: string;
  date: string;            // YYYY-MM-DD
  type: 'done' | 'touched';
  createdAt: Date;
}
```

---

## 修正2: useBubbles フックの変更

### 対象ファイル: `src/hooks/useBubbles.ts`

インターフェースを以下に変更:

```typescript
interface UseBubblesReturn {
  bubbles: Bubble[];                          // 全ての泡
  activeBubbles: Bubble[];                    // floating + nearby + touched の泡（空に見えている）
  completedBubbles: Bubble[];                 // 完了した泡（1回きり）
  driftedBubbles: Bubble[];                   // 遠くへ流れた泡
  
  addBubble: (text: string) => void;          // 新しい泡を追加
  updateStatus: (id: string, status: BubbleStatus) => void;  // 状態変更
  updateMemo: (id: string, memo: string) => void;            // メモ更新
  toggleRepeatable: (id: string) => void;     // ★追加: くりかえしトグル
  
  // ★変更: 「できた」の処理を分岐
  markDone: (id: string) => void;             // できた！（repeatable なら記録のみ、1回きりなら完了）
  touchBubble: (id: string) => void;          // 触れた（自動記録用）→ ログに記録
  
  removeBubble: (id: string) => void;         // 完全削除（ユーザー操作のみ）
  
  // ★追加: ログ関連
  todayLogs: BubbleLog[];                     // 今日の全ログ
  isBubbleDoneToday: (id: string) => boolean; // この泡は今日「できた」か？
  
  todayDoneCount: number;                     // 今日のできた数（ログからカウント）
  todayTouchedCount: number;                  // 今日の触れた数（ログからカウント）
  totalCount: number;                         // 全泡数（上限チェック用）
  canAdd: boolean;                            // 追加可能か
}
```

**markDone の挙動:**
```typescript
function markDone(id: string) {
  const bubble = getBubbleById(id);
  if (!bubble) return;
  
  if (bubble.repeatable) {
    // くりかえし泡: ログに「今日できた」を追加。泡はそのまま残る。
    addLog({ bubbleId: id, date: todayStr(), type: 'done' });
  } else {
    // 1回きりの泡: 泡の状態を completed に変更。空に溶けるアニメーション。
    updateStatus(id, 'completed');
    addLog({ bubbleId: id, date: todayStr(), type: 'done' });
  }
}
```

**touchBubble の挙動:**
```typescript
function touchBubble(id: string) {
  // ログに「今日触れた」を追加（同じ日に重複しない）
  addLog({ bubbleId: id, date: todayStr(), type: 'touched' });
  // 泡の touchedAt も更新
  updateBubbleTouchedAt(id, new Date());
}
```

**ログの保存:**
- localStorage のキーは `pukari-logs`
- `bubble_logs` は `{ bubbleId, date, type }` の組み合わせでユニーク（同じ泡・同じ日・同じtypeは1回だけ）

---

## 修正3: BubbleDetail の変更

### 対象ファイル: `src/components/Bubble/BubbleDetail.tsx`

**変更点:**

1. 「くりかえす」トグルを追加:
   - 泡の詳細画面の補足メモ欄の下に、小さなトグルスイッチ
   - ラベル: 「くりかえす」
   - デフォルト: OFF
   - ONにすると `bubble.repeatable = true` になる

2. 「できた！」ボタンの挙動を分岐:
   - `repeatable = false` の場合: 「できた！」→ 泡が空に溶けるアニメーション（今まで通り）
   - `repeatable = true` の場合: 「今日できた！」→ ボタンが「✓ できた」に変わる（泡は残る）
   - `repeatable = true` かつ今日すでに done の場合: ボタンを「✓ 今日はできた」（押せない状態）で表示

3. 「できた！」ボタンの文言変更:
   - `repeatable = false`: 「できた！」（今まで通り）
   - `repeatable = true` かつ今日まだ: 「今日できた！」
   - `repeatable = true` かつ今日済み: 「✓ 今日はできた」（disabled）

---

## 修正4: BubbleItem の見た目変更

### 対象ファイル: `src/components/Bubble/BubbleItem.tsx` / `BubbleItem.css`

**くりかえし泡の見た目:**
- `repeatable = true` の泡は、通常の泡と区別するために **泡の中に小さなリピートマーク（↻）** を極小で表示する（テキストの下、3〜4px程度のアイコン）
- 今日すでに「できた」のくりかえし泡は、**泡がほんのり緑がかった光** を持つ（`box-shadow` に薄い緑を追加）
- 翌日になるとこの光はリセットされる

---

## 修正5: useSkyColor の変更

### 対象ファイル: `src/hooks/useSkyColor.ts`

**空の色の計算方法を変更:**

今まで: `bubbles` の状態が `done` のものをカウント
これから: `bubble_logs` から今日の `type = 'done'` をカウント

```typescript
function useSkyColor(todayDoneCount: number): SkyPhase {
  // todayDoneCount は useBubbles.todayDoneCount から取得
  // 計算ロジックは同じ
  if (todayDoneCount === 0) return 'dawn';
  if (todayDoneCount <= 2) return 'morning';
  if (todayDoneCount <= 4) return 'afternoon';
  if (todayDoneCount <= 6) return 'sunset';
  return 'night';
}
```

**重要:** くりかえし泡で毎日「できた」を押しても、その日のカウントに加算される。つまり、くりかえし泡3つ ＋ 1回きりの泡2つ で「できた」なら、todayDoneCount = 5 → sunset。

---

## 修正6: DailySkyView の変更

### 対象ファイル: `src/components/DailySky/DailySkyView.tsx`

**「今日の空」の表示を bubble_logs ベースに変更:**

- 「できたこと」一覧: 今日の `bubble_logs` から `type = 'done'` のログを取得し、対応する泡のテキストを表示
- 「触れたこと」一覧: 今日の `bubble_logs` から `type = 'touched'` のログを取得
- くりかえし泡は、テキストの横に小さく「↻」マークを表示（毎日の記録であることが分かるように）

**過去の空も同様:**
- 過去の日付の `bubble_logs` から取得

---

## 修正7: 状態遷移ルールの更新

### 対象ファイル: `src/hooks/useBubbles.ts`

新しい状態遷移:

```
■ 1回きりの泡（repeatable = false）:
floating → nearby（そばに置く）
floating → completed（できた！→ 空に溶ける）
floating → drifted（遠くへ流す）
nearby → completed（できた！→ 空に溶ける）
nearby → drifted（遠くへ流す）
touched → completed（できた！→ 空に溶ける）
touched → drifted（遠くへ流す）
drifted → floating（戻す）

■ くりかえし泡（repeatable = true）:
floating → nearby（そばに置く）
floating → drifted（遠くへ流す）
nearby → drifted（遠くへ流す）
drifted → floating（戻す）

※ くりかえし泡は completed にならない。「できた」はログのみ。
※ 「触れた」は全ての泡でログに記録（泡を開いた時点で自動）。
```

---

## 確認方法

全ての修正が完了したら:

1. 開発サーバーを起動する
2. 新しい泡を作り、「くりかえす」をONにする
3. 「今日できた！」を押して、泡が空に残っていることを確認する
4. ボタンが「✓ 今日はできた」に変わっていることを確認する
5. 別の1回きりの泡を作り、「できた！」で空に溶けることを確認する
6. 「今日の空」を開いて、両方の記録が表示されていることを確認する
7. 空の色が「今日のできた数」（くりかえし＋1回きり合算）で正しく変わることを確認する
8. 「確認完了しました。サーバーを停止します。」と報告してからサーバーを停止する
9. **私の指示を待つ**
