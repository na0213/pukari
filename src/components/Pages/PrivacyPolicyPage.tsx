import './PrivacyPolicyPage.css';

interface PrivacyPolicyPageProps {
  onClose: () => void;
}

export default function PrivacyPolicyPage({ onClose }: PrivacyPolicyPageProps) {
  return (
    <div className="privacy-overlay" onClick={onClose} aria-label="プライバシーポリシー">
      <div
        className="privacy-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="プライバシーポリシー"
      >
        <div className="privacy-header">
          <button
            className="privacy-back"
            onClick={onClose}
            aria-label="戻る"
          >
            ← 戻る
          </button>
        </div>

        <div className="privacy-body">
          <h1 className="privacy-title">Pukari プライバシーポリシー</h1>
          <p className="privacy-date">最終更新日: 2026年3月25日</p>

          <section className="privacy-section">
            <h2 className="privacy-heading">1. 収集する情報</h2>
            <p className="privacy-sub-heading">■ ゲスト利用の場合</p>
            <ul className="privacy-list">
              <li>匿名のユーザーID（自動生成）</li>
              <li>アプリ内で入力したデータ（シャボン玉のテキスト、メモ、記録）</li>
            </ul>
            <p className="privacy-note">※ メールアドレスや氏名などの個人情報は収集しません。</p>

            <p className="privacy-sub-heading">■ Googleアカウント連携の場合</p>
            <ul className="privacy-list">
              <li>メールアドレス</li>
              <li>表示名（Googleアカウントの名前）</li>
              <li>プロフィール画像のURL</li>
              <li>アプリ内で入力したデータ</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">2. データの利用目的</h2>
            <p className="privacy-text">収集した情報は、以下の目的にのみ使用します。</p>
            <ul className="privacy-list">
              <li>アプリの機能提供（データの保存・同期）</li>
              <li>ユーザー認証</li>
              <li>アプリの改善</li>
            </ul>
            <p className="privacy-text">第三者への販売、広告目的での利用は一切行いません。</p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">3. データの保管</h2>
            <ul className="privacy-list">
              <li>データはSupabase（AWS上のクラウドサービス）に保管されます</li>
              <li>保管地域: Northeast Asia（東京リージョン）</li>
              <li>通信はTLS（SSL）により暗号化されています</li>
              <li>データベースは暗号化された状態で保存されています</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">4. データの共有</h2>
            <p className="privacy-text">
              もくもくモードでは、入室中に限り意気込みのテキストが他のユーザーに表示されます。メールアドレスや氏名など、個人を特定できる情報は他のユーザーに表示されません。退出時に意気込みのデータは削除されます。
            </p>
            <p className="privacy-text">
              それ以外のデータ（シャボン玉、記録など）は他のユーザーに共有されることはありません。
            </p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">5. データの削除</h2>
            <ul className="privacy-list">
              <li>アプリ内でシャボン玉を個別に削除できます</li>
              <li>アカウント作成後は、アカウントおよびすべてのデータを削除できます</li>
              <li>ゲスト利用の場合も、端末・ブラウザに保存されたデータを削除できます</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">6. Cookieとローカルストレージ</h2>
            <p className="privacy-text">
              本アプリは、認証情報の保持とアプリの設定保存のためにブラウザのローカルストレージを使用します。トラッキング目的のCookieは使用しません。アナリティクスツールは使用していません。
            </p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">7. 未成年者の利用</h2>
            <p className="privacy-text">
              本アプリは年齢制限を設けていませんが、13歳未満のお子様が利用する場合は保護者の同意のもとでご利用ください。
            </p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">8. ポリシーの変更</h2>
            <p className="privacy-text">
              本ポリシーは予告なく変更される場合があります。重要な変更がある場合は、アプリ内でお知らせします。
            </p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">9. お問い合わせ</h2>
            <p className="privacy-text">プライバシーに関するお問い合わせは、Googleフォームで受け付けます。</p>
            <p className="privacy-text">
              <a
                className="privacy-form-link"
                href="https://docs.google.com/forms/d/e/1FAIpQLSfqVVqapZrdozhCV_0ZiiUdOvI33dhlpgR-J2uGTBvSoz_g6g/viewform?usp=sharing&ouid=112748739579810757791"
                target="_blank"
                rel="noreferrer"
              >
                お問い合わせフォームを開く
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
