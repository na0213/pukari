import { useState, type ReactElement } from 'react';
import './PwaGuidePage.css';

type DeviceTab = 'iphone' | 'android' | 'pc';

interface PwaGuidePageProps {
  onClose: () => void;
}

function IPhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="7.5" y="3.5" width="9" height="17" rx="2.2" />
      <path d="M10 7h4" />
      <circle cx="12" cy="17.2" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 10h10v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
      <path d="M8 10l-1.5-2.5" />
      <path d="M16 10l1.5-2.5" />
      <line x1="9.5" y1="14" x2="9.5" y2="14" />
      <line x1="14.5" y1="14" x2="14.5" y2="14" />
      <path d="M10.2 5.2 L9.2 3.8" />
      <path d="M13.8 5.2 L14.8 3.8" />
      <line x1="9" y1="8" x2="15" y2="8" />
    </svg>
  );
}

function PcIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="5" width="16" height="11" rx="1.8" />
      <path d="M9 19h6" />
      <path d="M12 16v3" />
      <path d="M8 9h8" />
    </svg>
  );
}

const TABS: { key: DeviceTab; label: string; icon: () => ReactElement }[] = [
  { key: 'iphone',  label: 'iPhone',  icon: IPhoneIcon },
  { key: 'android', label: 'Android', icon: AndroidIcon },
  { key: 'pc',      label: 'PC / Mac', icon: PcIcon },
];

const STEPS: Record<DeviceTab, { step: string; desc: string }[]> = {
  iphone: [
    { step: 'Safariで開く',          desc: 'SafariでPukariを開きます。共有ボタンからホーム画面に追加できます。' },
    { step: '共有ボタンをタップ',    desc: '画面下部の共有ボタン（□に↑のアイコン）をタップします。' },
    { step: '「ホーム画面に追加」を選ぶ', desc: '下にスクロールして「ホーム画面に追加」をタップします。' },
    { step: '必要なら「Open as Web App」をON', desc: 'Webアプリとして使いたいときだけONにします。' },
    { step: '「追加」をタップ', desc: '右上の「追加」をタップすれば完了です。' },
  ],
  android: [
    { step: 'Chromeで開く',         desc: 'ChromeでPukariを開きます。右上のメニューから追加できます。' },
    { step: 'メニューを開く',       desc: '右上の「⋮」（縦3点）をタップしてメニューを開きます。' },
    { step: '「ホーム画面に追加」または「インストール」を選ぶ', desc: 'メニューの中から表示される方をタップします。' },
    { step: '確認して追加',     desc: 'ダイアログが出たら確認して追加すれば完了です。' },
  ],
  pc: [
    { step: 'ChromeまたはEdgeで開く', desc: 'Chrome・EdgeでPukariを開きます。' },
    { step: 'アドレスバーのアイコンをクリック', desc: 'URLバーの右端に表示されるインストールアイコンをクリックします。' },
    { step: '「インストール」をクリック', desc: 'ダイアログが出たら「インストール」をクリックします。' },
    { step: 'デスクトップから起動',  desc: 'デスクトップまたはアプリ一覧からPukariを起動できます。' },
  ],
};

export default function PwaGuidePage({ onClose }: PwaGuidePageProps) {
  const [activeTab, setActiveTab] = useState<DeviceTab>('iphone');

  return (
    <div className="pwa-overlay" onClick={onClose} aria-label="ホーム画面に追加する">
      <div
        className="pwa-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="ホーム画面に追加する"
      >
        <div className="pwa-header">
          <h2 className="pwa-title">ホーム画面に追加する</h2>
          <button
            className="pwa-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <p className="pwa-subtitle">
          ホーム画面に追加すると、アプリのように使えます。
        </p>

        {/* タブ */}
        <div className="pwa-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`pwa-tab ${activeTab === tab.key ? 'pwa-tab--active' : ''}`}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="pwa-tab-icon" aria-hidden="true"><tab.icon /></span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ステップ一覧 */}
        <div className="pwa-steps" role="tabpanel">
          {STEPS[activeTab].map((item, i) => (
            <div key={i} className="pwa-step">
              <div className="pwa-step-num" aria-hidden="true">{i + 1}</div>
              <div className="pwa-step-body">
                <p className="pwa-step-title">{item.step}</p>
                <p className="pwa-step-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
