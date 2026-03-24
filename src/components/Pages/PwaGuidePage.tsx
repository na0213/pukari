import { useState } from 'react';
import './PwaGuidePage.css';

type DeviceTab = 'iphone' | 'android' | 'pc';

interface PwaGuidePageProps {
  onClose: () => void;
}

const TABS: { key: DeviceTab; label: string; icon: string }[] = [
  { key: 'iphone',  label: 'iPhone',   icon: '🍎' },
  { key: 'android', label: 'Android',  icon: '🤖' },
  { key: 'pc',      label: 'PC / Mac', icon: '💻' },
];

const STEPS: Record<DeviceTab, { step: string; desc: string }[]> = {
  iphone: [
    { step: 'Safariで開く',          desc: 'PukariはSafariからのみホーム画面に追加できます。ChromeやFirefoxでは追加できません。' },
    { step: '共有ボタンをタップ',    desc: '画面下部の共有ボタン（□に↑のアイコン）をタップします。' },
    { step: '「ホーム画面に追加」を選ぶ', desc: '下にスクロールして「ホーム画面に追加」をタップします。' },
    { step: '名前を確認して「追加」', desc: '名前はそのままでOK。右上の「追加」をタップすれば完了です。' },
  ],
  android: [
    { step: 'Chromeで開く',         desc: 'PukariはChromeからホーム画面に追加できます。' },
    { step: 'メニューを開く',       desc: '右上の「⋮」（縦3点）をタップしてメニューを開きます。' },
    { step: '「ホーム画面に追加」を選ぶ', desc: 'メニューの中から「ホーム画面に追加」をタップします。' },
    { step: '「追加」をタップ',     desc: '確認ダイアログが出たら「追加」をタップすれば完了です。' },
  ],
  pc: [
    { step: 'ChromeまたはEdgeで開く', desc: 'PukariはChrome・EdgeからPCにインストールできます。' },
    { step: 'アドレスバーのアイコンをクリック', desc: 'URLバーの右端にインストールアイコン（↓）が表示されます。' },
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
              <span className="pwa-tab-icon" aria-hidden="true">{tab.icon}</span>
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
