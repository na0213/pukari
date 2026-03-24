import { useState } from 'react';
import './styles/global.css';
import './styles/animations.css';
import SkyView from './components/Sky/SkyView';
import BlueLagoonView from './components/BlueLagoon/BlueLagoonView';
import AboutPage from './components/Pages/AboutPage';
import PwaGuidePage from './components/Pages/PwaGuidePage';
import { useAuth } from './hooks/useAuth';
import { useLagoon } from './hooks/useLagoon';

type CurrentPage = null | 'about' | 'pwa';

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
  const { loading } = useAuth();
  const lagoon = useLagoon();
  const [currentPage, setCurrentPage] = useState<CurrentPage>(null);

  if (loading) return <LoadingScreen />;

  return (
    <main>
      {lagoon.isInLagoon ? (
        <BlueLagoonView lagoon={lagoon} />
      ) : (
        <SkyView
          onEnterLagoon={lagoon.enterLagoon}
          onOpenAbout={() => setCurrentPage('about')}
          onOpenPwa={() => setCurrentPage('pwa')}
        />
      )}

      {currentPage === 'about' && (
        <AboutPage onClose={() => setCurrentPage(null)} />
      )}
      {currentPage === 'pwa' && (
        <PwaGuidePage onClose={() => setCurrentPage(null)} />
      )}
    </main>
  );
}

export default App;
