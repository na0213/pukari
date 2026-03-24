# 修正指示：泡の一覧ページ（月ごとの履歴表示）

CLAUDE.md の安全ルールに従って修正してください。

---

## 背景

メイン画面（空）は「今のシャボン玉」、「今日の空」は「今日のできたこと」が見える。しかし**「この泡、今月どのくらいやれたか」が分からない**。

泡ごとの月単位の履歴が見えるページを追加する。GitHubの草のように、できた日にドットが色づく。びっしり埋まっていなくても、ポツポツ色がついているだけで「ゼロじゃない」と分かる。

---

## 新規ファイル

```
src/components/BubbleList/
  BubbleListView.tsx      # 一覧ページ本体
  BubbleListView.css
  BubbleListItem.tsx      # 各泡の行（テキスト + 月ドット）
  BubbleListItem.css
  MonthDots.tsx            # 月のドット表示コンポーネント
  MonthDots.css
```

---

## 修正1: BubbleListView（一覧ページ本体）

### 対象ファイル: `src/components/BubbleList/BubbleListView.tsx` / `BubbleListView.css`

**アクセス方法:**
- メイン画面（空）の下部に、入力バーの左側あたりに小さなリストアイコン（☰ または 三）を追加
- タップすると一覧ページが画面下からスライドアップ（フルスクリーンオーバーレイ）
- 「今日の空」ボタンと同じ挙動パターン

**画面構成:**

#### ヘッダー部
- 左上: 「×」閉じるボタン
- 中央: 「シャボン玉一覧」タイトル
- 右上: 表示月の切り替え（「◀ 3月 ▶」の形式で前月・翌月に移動）

#### リスト部
- 各泡が1行ずつ縦に並ぶ
- スクロール可能
- 並び順: キープ中（nearby）の泡が上 → その他は作成日が新しい順
- 完了した泡（completed）はリストの最下部に薄く表示（区別はするが目立たせない）

#### 各行の構成（BubbleListItem）
```
[泡テキスト（左）]                    [月ドット（右）]
 英単語50個                           ● ● ○ ○ ● ○ ● ...
```

**閉じ方:**
- 「×」ボタン
- 下にスワイプ

---

## 修正2: BubbleListItem（各泡の行）

### 対象ファイル: `src/components/BubbleList/BubbleListItem.tsx` / `BubbleListItem.css`

**各行の表示内容:**

左側:
- 泡のテキスト（1行、溢れたら省略）
- テキストの下に小さく状態バッジ（「キープ中」のみ。それ以外は非表示）

右側:
- MonthDots コンポーネント（その月のできた日をドットで表示）

**タップ時の挙動:**
- 行をタップすると BubbleDetail（泡の詳細モーダル）が開く
- 一覧ページは背面に残る（閉じない）
- BubbleDetail を閉じると一覧ページに戻る

---

## 修正3: MonthDots（月のドット表示）

### 対象ファイル: `src/components/BubbleList/MonthDots.tsx` / `MonthDots.css`

**Props:**
```typescript
interface MonthDotsProps {
  bubbleId: string;
  year: number;
  month: number;     // 1-12
  logs: BubbleLog[]; // この泡のログ（フィルター済み）
}
```

**表示:**
- その月の日数分の小さなドット（●/○）を横一列に表示
- 「できた」日（done ログがある日）: 塗りつぶしドット ● （色は空のテーマに合わせた水色〜青系）
- 何もない日: 空ドット ○ （薄いグレー）
- 今日より未来の日: ドットなし（表示しない）

**ドットのサイズ:**
- 6px × 6px の小さな丸
- ドット間の余白: 2px
- 1ヶ月分（28〜31個）が1行に収まるサイズ

**ドットの色:**
```css
.dot-done {
  background-color: #64B5F6;  /* 空の青に合わせる */
  border-radius: 50%;
}

.dot-empty {
  background-color: #E0E0E0;
  border-radius: 50%;
}
```

**月の日数に応じた自動調整:**
- 2月は28 or 29個、4月は30個、1月は31個など
- JavaScriptの `new Date(year, month, 0).getDate()` で取得

---

## 修正4: SkyView にリストボタンを追加

### 対象ファイル: `src/components/Sky/SkyView.tsx` / `SkyView.css`

- 画面下部の固定エリアに、リストアイコンボタンを追加
- 配置: 入力バーの左側（「今日の空」ボタンと入力バーの間くらい）
- アイコン: シンプルなリスト記号（☰）または横線3本
- サイズ: 小さめ（空の景色を邪魔しない）
- タップで BubbleListView をスライドアップ表示

**下部の配置イメージ:**
```
[☰ リスト]  [       入力バー       ]  [🔍 検索]
                [今日の空]
```

---

## 修正5: useBubbles に月別ログ取得を追加

### 対象ファイル: `src/hooks/useBubbles.ts`

以下を追加:

```typescript
// 特定の泡の、特定月のログを取得
function getLogsForBubbleMonth(
  bubbleId: string,
  year: number,
  month: number
): BubbleLog[] {
  return logs.filter(log =>
    log.bubbleId === bubbleId &&
    log.type === 'done' &&
    log.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)
  );
}
```

これを useBubbles の返り値に追加:
```typescript
interface UseBubblesReturn {
  // ...既存のもの
  getLogsForBubbleMonth: (bubbleId: string, year: number, month: number) => BubbleLog[];
}
```

---

## デザインのトーン

- 全体的に控えめ。データを「見せつける」のではなく「そっと見せる」
- ドットが少ない泡があっても、否定的なメッセージは出さない
- 完了した泡は薄く表示するが、「完了おめでとう」のような演出はしない（静かに）
- 背景は白系。空の画面とトーンを合わせる（すりガラス風）

---

## 確認方法

1. 開発サーバーを起動する
2. メイン画面の下部にリストアイコンが表示されていることを確認
3. リストアイコンをタップ → 一覧ページがスライドアップすることを確認
4. 泡が作成日順に並んでいることを確認（キープ中が上）
5. 泡の右側に今月のドットが表示されていることを確認
6. 「今日はここまで」or「できた！」を押した泡のドットが塗りつぶされていることを確認
7. 何もしていない日のドットが空（薄いグレー）であることを確認
8. 「◀ ▶」で前月に切り替えられることを確認（前月にログがあればドットが色づく）
9. 一覧の泡をタップ → BubbleDetail が開くことを確認
10. BubbleDetail を閉じると一覧ページに戻ることを確認
11. 「×」または下スワイプで一覧ページが閉じることを確認
12. 「確認完了しました。サーバーを停止します。」と報告してからサーバーを停止する
13. **私の指示を待つ**
