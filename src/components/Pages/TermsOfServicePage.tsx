import './PrivacyPolicyPage.css';

interface TermsOfServicePageProps {
  onClose: () => void;
}

export default function TermsOfServicePage({ onClose }: TermsOfServicePageProps) {
  return (
    <div className="privacy-overlay" onClick={onClose} aria-label="利用規約">
      <div
        className="privacy-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="利用規約"
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
          <h1 className="privacy-title">Pukari 利用規約</h1>
          <p className="privacy-date">最終更新日: 2026年3月27日</p>

          <section className="privacy-section">
            <h2 className="privacy-heading">1. この規約について</h2>
            <p className="privacy-text">
              この利用規約は、Pukari（以下「本サービス」）の利用条件を定めるものです。ユーザーは、本サービスを利用することで本規約に同意したものとみなされます。
            </p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">2. 利用資格</h2>
            <p className="privacy-text">
              本サービスは、年齢を問わず利用できます。ただし、13歳未満の方が利用する場合は、保護者の同意のもとでご利用ください。
            </p>
            <p className="privacy-text">
              Googleアカウント連携を利用する場合は、Googleアカウントの利用条件もあわせて遵守してください。
            </p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">3. アカウントと利用方法</h2>
            <ul className="privacy-list">
              <li>ゲスト利用では、端末またはブラウザ単位でデータが保存されます。</li>
              <li>Googleアカウント連携では、データはクラウドに保存・同期されます。</li>
              <li>ユーザーは、自己の責任においてアカウント情報を管理するものとします。</li>
              <li>不正アクセス、なりすまし、第三者へのアカウント共有は禁止します。</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">4. 禁止事項</h2>
            <ul className="privacy-list">
              <li>法令または公序良俗に反する利用</li>
              <li>第三者の権利を侵害する行為</li>
              <li>本サービスの運営を妨げる行為</li>
              <li>不正アクセス、改ざん、リバースエンジニアリング</li>
              <li>他のユーザーを不当に誹謗中傷する行為</li>
              <li>本サービスの意図しない方法でのデータ取得や利用</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">5. コンテンツとデータ</h2>
            <p className="privacy-text">
              ユーザーが本サービスに入力したテキスト、メモ、記録などのデータは、ユーザー自身が責任を持って管理してください。
            </p>
            <p className="privacy-text">
              本サービスは、データの保存・同期・表示のためにこれらの情報を扱いますが、第三者への販売や広告目的の利用は行いません。
            </p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">6. もくもくモードについて</h2>
            <p className="privacy-text">
              もくもくモードでは、入室中に限り他のユーザーの意気込みが表示されます。退出時には、もくもくモード用のデータは削除されます。
            </p>
            <p className="privacy-text">
              ユーザーは、公開される内容に配慮し、個人情報や機微な情報を入力しないようにしてください。
            </p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">7. サービスの変更・停止</h2>
            <p className="privacy-text">
              本サービスの内容は、予告なく変更・追加・停止されることがあります。保守、障害対応、法令対応、またはその他やむを得ない事情により、一時的または恒久的にサービスを停止する場合があります。
            </p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">8. 免責事項</h2>
            <p className="privacy-text">
              本サービスは現状有姿で提供されます。データの消失、同期遅延、通信障害、端末故障、または外部サービスの障害により生じた損害について、運営者は法令上許される範囲で責任を負いません。
            </p>
            <p className="privacy-text">
              ただし、運営者に故意または重過失がある場合はこの限りではありません。
            </p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">9. 知的財産権</h2>
            <p className="privacy-text">
              本サービスに関するプログラム、デザイン、ロゴ、文章、画像などの知的財産権は、運営者または正当な権利者に帰属します。ユーザーが入力した内容の権利は、原則としてユーザーに帰属します。
            </p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">10. 規約の変更</h2>
            <p className="privacy-text">
              運営者は、必要と判断した場合、本規約を変更できるものとします。重要な変更がある場合は、本サービス内で告知します。変更後に本サービスを利用した場合、変更後の規約に同意したものとみなします。
            </p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">11. 準拠法・お問い合わせ</h2>
            <p className="privacy-text">
              本規約は日本法を準拠法とします。本規約に関するお問い合わせは、アプリ内の案内または運営者が指定する方法で受け付けます。
            </p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-heading">12. 運営者情報</h2>
            <ul className="privacy-list">
              <li>運営者: natomi</li>
              <li>制定日: 2026年3月</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
