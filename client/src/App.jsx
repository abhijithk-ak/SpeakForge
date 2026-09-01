import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useEffect, useState } from 'react';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';

// Auth guard
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages — public
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Pages — authenticated (stubs)
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import PracticePage from './pages/PracticePage';
import SessionPage from './pages/SessionPage';
import ResultsPage from './pages/ResultsPage';
import ProgressPage from './pages/ProgressPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import UsagePage from './pages/UsagePage';

// Practice Setup Pages
import InterviewSetupPage from './pages/practice/InterviewSetupPage';
import SpeechSetupPage from './pages/practice/SpeechSetupPage';
import ClientSetupPage from './pages/practice/ClientSetupPage';

// Preserve existing theme logic from original App.jsx
const App = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('speakforge-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('speakforge-theme', theme);
  }, [theme]);

  const onToggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public routes — use the marketing layout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* Onboarding route — no AppLayout sidebar */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          } />

          {/* Authenticated routes — use the app layout */}
          <Route element={
            <ProtectedRoute>
              <AppLayout theme={theme} onToggleTheme={onToggleTheme} />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/practice/interview" element={<InterviewSetupPage />} />
            <Route path="/practice/speech" element={<SpeechSetupPage />} />
            <Route path="/practice/client" element={<ClientSetupPage />} />
            <Route path="/results/:id" element={<ResultsPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/usage" element={<UsagePage />} />
          </Route>

          {/* Session — fullscreen, no sidebar */}
          <Route path="/session/:id" element={
            <ProtectedRoute>
              <SessionPage />
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
