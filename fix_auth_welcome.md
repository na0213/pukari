# 修正指示：ウェルカム画面 + Google認証 + メニュー更新

CLAUDE.md の安全ルールに従って修正してください。

---

## 修正1: ウェルカム画面の追加

### 新規ファイル: `src/components/Auth/WelcomeScreen.tsx` / `WelcomeScreen.css`

初回起動時にだけ表示するウェルカム画面。

**表示条件:**
- `localStorage` に `pukari-welcomed` キーが存在しない場合のみ表示
- ゲストまたはGoogleどちらかを選択したら `pukari-welcomed = true` を保存
- 2回目以降は表示しない（直接メイン画面）

**画面構成（上から順に）:**

```
ロゴ（/images/logo.png、なければ「Pukari」テキスト）
「float your thoughts, gently.」（サブテキスト、小さく）

（少し余白）

アイコン🔒 + テキスト:
「あなたのデータは安全なクラウドサーバーに
 暗号化して保存されます」
 文字サイズ: 13px、色: グレー

（少し余白）

[ G Googleでアカウントを作る ]
 ボタン: 白背景、Googleカラーのアイコン付き、角丸、影あり
 幅: 80%、中央揃え

（少し余白）

「まずはゲストで始める」
 テキストリンク: 小さめ（14px）、グレー系、下線あり
 その下に極小テキスト（12px、薄いグレー）:
 「端末・ブラウザが変わるとデータは引き継げません」
 「あとからアカウント作成もできます」
```

**デザイン:**
- 背景: 空のグラデーション（メイン画面と同じ dawn 色）
- 全体を縦中央揃え
- 柔らかい印象。glass morphism のカードなどは使わず、背景に溶け込む感じ

**「Googleでアカウントを作る」をタップした場合:**
1. Supabase の Google OAuth を実行
2. 認証成功 → `pukari-welcomed = true` を保存 → メイン画面へ
3. 認証失敗/キャンセル → ウェルカム画面に戻る

**「まずはゲストで始める」をタップした場合:**
1. Supabase の匿名認証を実行（既存の処理）
2. `pukari-welcomed = true` を保存
3. メイン画面へ

---

## 修正2: Supabase Google OAuth の設定

### 対象ファイル: `src/hooks/useAuth.ts`

Google認証のロジックを追加:

```typescript
async function signInWithGoogle() {
  if (!supabase) return { error: 'Supabase not connected' };
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  
  return { data, error };
}
```

**匿名ユーザーからGoogleアカウントへの昇格:**

```typescript
async function linkGoogleAccount() {
  if (!supabase) return { error: 'Supabase not connected' };
  
  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  
  return { data, error };
}
```

**useAuth のインターフェース更新:**

```typescript
interface UseAuthReturn {
  user: User | null;
  isAnonymous: boolean;       // ゲストかどうか
  isLoading: boolean;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  linkGoogleAccount: () => Promise<{ error?: string }>;  // ゲスト→Google昇格
  signOut: () => Promise<void>;
  displayName: string;        // ゲストなら「ゲスト」、Googleなら名前orメール
}
```

**displayName の決定ロジック:**
```typescript
const displayName = useMemo(() => {
  if (!user) return '';
  if (user.is_anonymous) return 'ゲスト';
  return user.user_metadata?.full_name 
    || user.user_metadata?.name 
    || user.email 
    || 'ユーザー';
}, [user]);
```

---

## 修正3: 右上メニューの更新

### 対象ファイル: `src/components/Layout/Header.tsx` / `Header.css`（サイドメニュー部分）

**ゲストユーザーの場合:**

```
☰ メニュー
├ Pukariについて
├ ホーム画面に追加する
├ ────────────
├ 🔒 ゲストとして利用中
│    データはこの端末に紐づいています
├ [ G Googleアカウントと連携する ]
└ ────────────
```

- 「ゲストとして利用中」は情報表示のみ（タップ不可）
- 「Googleアカウントと連携する」をタップ → linkGoogleAccount を実行
- 連携成功 → メニューがログイン済み表示に切り替わる

**Googleログイン済みの場合:**

```
☰ メニュー
├ Pukariについて
├ ホーム画面に追加する
├ ────────────
├ 👤 山田太郎（またはメールアドレス）
│    データは安全に同期されています
└ ログアウト
```

- ユーザー名の下に安心メッセージ
- 「ログアウト」をタップ → signOut を実行 → ウェルカム画面に戻る（`pukari-welcomed` を削除）

**「ログアウト」の確認ダイアログ:**
- 「ログアウトしますか？ゲスト利用中のデータは、再ログインで復元できます。」
- 「ログアウト」「やめる」の2択

---

## 修正4: App.tsx のフロー制御

### 対象ファイル: `src/App.tsx`

起動時のフロー:

```
アプリ起動
  ↓
pukari-welcomed が false？
  → Yes: ウェルカム画面を表示
  → No: 既存ユーザー。自動でセッション復元
         ↓
       セッションあり → メイン画面
       セッションなし → 匿名認証 → メイン画面
```

---

## Supabase側の設定（コードとは別にDashboardで行う）

以下はNatsumiがSupabase Dashboardで設定する必要がある手順です。
コード内にコメントとして残してください:

```
// ==========================================
// Supabase Google OAuth 設定手順:
//
// 1. Google Cloud Console (https://console.cloud.google.com)
//    - プロジェクト作成
//    - 「APIとサービス」→「認証情報」
//    - 「OAuth 2.0 クライアント ID」を作成
//    - アプリケーションの種類: ウェブアプリケーション
//    - 承認済みリダイレクト URI に以下を追加:
//      https://xxxxxxxx.supabase.co/auth/v1/callback
//      （xxxxxxxx は自分のSupabase Project ID）
//    - クライアントIDとクライアントシークレットをメモ
//
// 2. Supabase Dashboard
//    - Authentication → Providers → Google
//    - 「Enable Google provider」を ON
//    - Client ID と Client Secret を入力
//    - 「Save」
//
// 3. Vercel デプロイ時:
//    - 環境変数は既存の VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY のみ
//    - Google OAuth の設定は Supabase 側で完結する
// ==========================================
```

---

## 確認方法

1. `localStorage` から `pukari-welcomed` を削除してからアプリを開く
2. ウェルカム画面が表示されることを確認
3. 「まずはゲストで始める」→ メイン画面が表示されることを確認
4. 右上メニュー → 「ゲストとして利用中」が表示されていることを確認
5. アプリを閉じて再度開く → ウェルカム画面が表示されず、直接メイン画面が出ることを確認
6. 右上メニュー → 「Googleアカウントと連携する」が表示されていることを確認
7. **Google OAuth はSupabase Dashboardの設定が必要なため、今はエラーになってOK**
8. 「確認完了しました。サーバーを停止します。」と報告してからサーバーを停止する
9. **私の指示を待つ**

※ Google OAuth の動作確認は、Supabase Dashboard で Google プロバイダーを設定した後に行う
