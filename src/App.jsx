import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, GraduationCap } from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import GlobalTutorModal from './components/ui/GlobalTutorModal';
import LandingPage from './pages/LandingPage';
import { 
  KnowledgeChat, 
  VideoHub, 
  CodeMentor, 
  QuizLab, 
  LearningVault,
  Guide
} from './pages';
import { cn } from './utils/cn';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [isStarted, setIsStarted] = useState(() => {
    return true; // Temporarily bypass landing page for testing
    // return localStorage.getItem('solo-tutor-started') === 'true';
  });
  const [activePage, setActivePage] = useState('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [isGlobalTutorOpen, setIsGlobalTutorOpen] = useState(false);
  const statusResetRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('solo-tutor-started', isStarted);
  }, [isStarted]);

  const handleNavigationIntent = useCallback((event) => {
    const { page, status: nextStatus } = event.detail || {};

    if (page) {
      setActivePage(page);
    }

    if (nextStatus) {
      setStatus(nextStatus);
      window.clearTimeout(statusResetRef.current);
      statusResetRef.current = window.setTimeout(() => {
        setStatus('Ready');
      }, 4200);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('solo-tutor:navigate', handleNavigationIntent);

    return () => {
      window.removeEventListener('solo-tutor:navigate', handleNavigationIntent);
      window.clearTimeout(statusResetRef.current);
    };
  }, [handleNavigationIntent]);

  const renderPage = () => {
    switch (activePage) {
      case 'chat': return <KnowledgeChat />;
      case 'video': return <VideoHub />;
      case 'code': return <CodeMentor />;
      case 'quiz': return <QuizLab />;
      case 'vault': return <LearningVault />;
      case 'guide': return <Guide />;
      default: return <KnowledgeChat />;
    }
  };

  if (!isStarted) {
    return <LandingPage onStart={() => setIsStarted(true)} />;
  }

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground transition-colors duration-300 flex selection:bg-foreground selection:text-background",
      theme === 'dark' ? 'dark' : ''
    )}>
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onLogoClick={() => setIsStarted(false)}
      />
      
      <main className={cn(
        "flex-1 flex flex-col transition-all duration-300 grid-background",
        isSidebarCollapsed ? "ml-20" : "ml-64"
      )}>
        <Navbar 
          activePage={activePage} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          status={status}
          onLogoClick={() => setIsStarted(false)}
        />
        
        <div className="flex-1 overflow-auto p-12 relative">
          <div className="max-w-5xl mx-auto h-full">
            {renderPage()}
          </div>
          
          {/* Global Tutor Floating Button */}
          <button 
            onClick={() => setIsGlobalTutorOpen(true)}
            className="fixed bottom-8 right-8 p-3.5 bg-foreground text-background rounded-xl shadow-2xl hover:scale-105 transition-all flex items-center gap-3 z-50 group border border-border/20"
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-foreground rounded-full" />
            </div>
            <span className="text-[13px] font-bold pr-1 max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-300 whitespace-nowrap">Global Tutor</span>
          </button>
        </div>
      </main>

      <GlobalTutorModal 
        isOpen={isGlobalTutorOpen} 
        onClose={() => setIsGlobalTutorOpen(false)} 
      />
    </div>
  );
}

export default App;