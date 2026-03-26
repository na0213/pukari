import { useState } from 'react';
import './styles/global.css';
import './styles/animations.css';
import SkyView from './components/Sky/SkyView';
import BlueLagoonView from './components/BlueLagoon/BlueLagoonView';
import AboutPage from './components/Pages/AboutPage';
import GuestGuidePage from './components/Pages/GuestGuidePage';
import PwaGuidePage from './components/Pages/PwaGuidePage';
import PrivacyPolicyPage from './components/Pages/PrivacyPolicyPage';
import WelcomeScreen from './components/Auth/WelcomeScreen';
import { useAuth } from './hooks/useAuth';
import { useLagoon } from './hooks/useLagoon';

type CurrentPage = null | 'about' | 'guest' | 'pwa' | 'privacy';

function LoadingScreen() {
  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--sky-dawn)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(100, 181, 246, 0.5)',
          animation: 'float 2s ease-in-out infinite',
          border: '1px solid rgba(255,255,255,0.5)',
        }}
      />
      <p
        style={{
          fontSize: '13px',
          color: 'rgba(80, 120, 160, 0.7)',
          letterSpacing: '0.05em',
        }}
      >
        空を準備しています…
      </p>
    </main>
  );
}

function App() {
  const auth = useAuth();
  const lagoon = useLagoon();
  const [currentPage, setCurrentPage] = useState<CurrentPage>(null);
  const { isLoading, user } = auth;

  const handleSignOut = async () => {
    setCurrentPage(null);
  };

  if (isLoading) return <LoadingScreen />;

  // 未ログイン時はウェルカム画面
  if (!user) {
    return (
      <>
        <WelcomeScreen
          auth={auth}
          onOpenPrivacy={() => setCurrentPage('privacy')}
        />
        {currentPage === 'privacy' && (
          <PrivacyPolicyPage onClose={() => setCurrentPage(null)} />
        )}
      </>
    );
  }

  return (
    <main>
      {lagoon.isInLagoon ? (
        <BlueLagoonView lagoon={lagoon} />
      ) : (
      <SkyView
          onEnterLagoon={lagoon.enterLagoon}
          onOpenAbout={() => setCurrentPage('about')}
          onOpenGuest={() => setCurrentPage('guest')}
          onOpenPwa={() => setCurrentPage('pwa')}
          onOpenPrivacy={() => setCurrentPage('privacy')}
          auth={auth}
          onSignOut={handleSignOut}
        />
      )}

      {currentPage === 'about' && (
        <AboutPage onClose={() => setCurrentPage(null)} />
      )}
      {currentPage === 'guest' && (
        <GuestGuidePage
          onClose={() => setCurrentPage(null)}
          auth={auth}
        />
      )}
      {currentPage === 'pwa' && (
        <PwaGuidePage onClose={() => setCurrentPage(null)} />
      )}
      {currentPage === 'privacy' && (
        <PrivacyPolicyPage onClose={() => setCurrentPage(null)} />
      )}
    </main>
  );
}

export default App;
