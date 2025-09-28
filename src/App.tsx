import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { store, persistor } from './app/store';
import { LandingPage } from './components/LandingPage';
import { InterviewLayout } from './components/InterviewLayout';
import { WelcomeBackModal } from './components/WelcomeBackModal';
import { useAppSelector, useAppDispatch } from './hooks/redux';
import { setShowWelcomeModal } from './app/uiSlice';
import { resumeInterview, clearCurrentInterview } from './features/interviewee/interviewSlice';
import './index.css';
import './App.css';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const showWelcomeModal = useAppSelector((state: any) => state.ui.showWelcomeModal);
  const currentCandidate = useAppSelector((state: any) => state.interview.currentCandidate);

  useEffect(() => {
    // Check if there's an unfinished interview on app load
    // Only show modal once when app loads, not on every state change
    if (currentCandidate && 
        currentCandidate.progress === 'in_progress' && 
        (currentCandidate.currentQuestionIndex || 0) < 6 &&
        (currentCandidate.currentQuestionIndex || 0) > 0 && // Has started but not finished
        !showWelcomeModal) { // Don't show if already showing
      dispatch(setShowWelcomeModal(true));
    }
  }, [dispatch]); // Remove currentCandidate dependency to prevent repeated triggers

  const handleResumeInterview = () => {
    dispatch(resumeInterview());
    dispatch(setShowWelcomeModal(false));
    navigate('/interview');
  };

  const handleStartNewInterview = () => {
    dispatch(clearCurrentInterview());
    dispatch(setShowWelcomeModal(false));
    navigate('/interview');
  };

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/interview" element={<InterviewLayout />} />
      </Routes>

      <WelcomeBackModal
        isOpen={showWelcomeModal}
        onClose={() => dispatch(setShowWelcomeModal(false))}
        candidate={currentCandidate}
        onResume={handleResumeInterview}
        onStartNew={handleStartNewInterview}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="w-12 h-12 border-4 border-purple-400 border-b-transparent rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Crisp Interview
                </h2>
                <p className="text-gray-600 animate-pulse">Loading interview platform...</p>
              </div>
            </div>
          </div>
        }
        persistor={persistor}
      >
        <Router>
          <AppContent />
        </Router>
      </PersistGate>
    </Provider>
  );
};

export default App;
