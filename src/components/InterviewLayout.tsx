import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Users, Sparkles, MessageSquare, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { setActiveTab } from '../app/uiSlice';
import { startNewInterview, setResumeData, updateCandidateField, startInterview, addChatMessage, clearCurrentInterview } from '../features/interviewee/interviewSlice';
import { selectFilteredAndSortedCandidates, setSearchQuery, setSortBy, selectCandidate, deleteCandidate, generateCandidateSummary, addCandidate, updateCandidate, fixCandidateProgress } from '../features/interviewer/candidateSlice';
import { ResumeUpload } from '../features/interviewee/ResumeUpload';
import { Chat } from '../features/interviewee/Chat';
import { Dashboard } from '../features/interviewer/Dashboard';
import { WelcomeBackModal } from './WelcomeBackModal';
import { useInterview } from '../hooks/useInterview';
import type { ResumeData } from '../types';

export const InterviewLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state: any) => state.ui.activeTab);
  const candidates = useAppSelector(selectFilteredAndSortedCandidates);
  const candidatesState = useAppSelector((state: any) => state.candidates);
  const { 
    selectedCandidate, 
    searchQuery, 
    sortBy, 
    sortOrder, 
    isGeneratingSummary 
  } = candidatesState;

  const {
    currentCandidate,
    chatMessages,
    timerState,
    isInterviewActive,
    missingFields,
    isSubmittingAnswer,
    handleStartNextQuestion,
    handleSubmitAnswer,
    handleTimerEnd,
    handleTimerTick,
  } = useInterview();

  const [hasStartedInterview, setHasStartedInterview] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  // Fix any candidates that should be completed on component mount
  useEffect(() => {
    dispatch(fixCandidateProgress());
  }, [dispatch]);

  // Check for unfinished interview on component mount (only when user returns)
  useEffect(() => {
    if (currentCandidate && 
        currentCandidate.progress === 'in_progress' && 
        (currentCandidate.currentQuestionIndex || 0) > 0 && 
        !isInterviewActive && 
        !hasStartedInterview) {
      setShowWelcomeBack(true);
    }
  }, [currentCandidate, isInterviewActive, hasStartedInterview]);

  // Handle tab switching
  const handleTabChange = (tab: 'interviewee' | 'interviewer') => {
    dispatch(setActiveTab(tab));
  };

  // Handle resume upload
  const handleResumeUploaded = (resumeData: ResumeData) => {
    dispatch(setResumeData(resumeData));
  };

  // Handle test resume file generation


  // Handle field updates
  const handleFieldUpdate = (field: 'name' | 'email' | 'phone', value: string) => {
    dispatch(updateCandidateField({ field, value }));
  };

  // Handle starting interview
  const handleInterviewStart = () => {
    if (missingFields.length === 0 && currentCandidate) {
      dispatch(startInterview());
      setHasStartedInterview(true);
      
      // Add welcome message and start first question
      dispatch(addChatMessage({
        type: 'system',
        content: `Perfect! Let's begin your technical interview. You'll be asked 6 questions of varying difficulty. Each question has a time limit, so answer thoughtfully but efficiently. Good luck! 🚀`,
      }));
      
      // Start first question after a brief delay
      setTimeout(() => {
        handleStartNextQuestion();
      }, 1500);
    }
  };

  // Handle starting new interview
  const handleStartNew = () => {
    dispatch(startNewInterview({ 
      name: currentCandidate?.name || '', 
      email: currentCandidate?.email || '', 
      phone: currentCandidate?.phone || '' 
    }));
    setHasStartedInterview(false);
    setShowWelcomeBack(false);
  };

  // Handle welcome back modal actions
  const handleResumeInterview = () => {
    setShowWelcomeBack(false);
    if (currentCandidate) {
      // Ensure candidate is in the candidates list
      const existingCandidate = candidates.find(c => c.id === currentCandidate.id);
      if (!existingCandidate) {
        dispatch(addCandidate(currentCandidate));
      } else {
        dispatch(updateCandidate(currentCandidate));
      }
      
      // Resume the interview state
      dispatch(startInterview());
      setHasStartedInterview(true);
      
      // Add resume message
      dispatch(addChatMessage({
        type: 'system',
        content: `Welcome back! You're currently on question ${(currentCandidate.currentQuestionIndex || 0) + 1} of 6. Let's continue with your interview.`,
      }));
    }
  };

  const handleStartNewFromModal = () => {
    dispatch(clearCurrentInterview());
    setShowWelcomeBack(false);
    // Don't pass empty strings - let the reducer check for existing data
    dispatch(startNewInterview({}));
    setHasStartedInterview(false);
  };

  // Handle message sending
  const handleSendMessage = (message: string) => {
    if (!isInterviewActive && !hasStartedInterview) {
      handleInterviewStart();
      return;
    }

    if (isInterviewActive) {
      handleSubmitAnswer(message);
    }
  };

  const canStartInterview = missingFields.length === 0 && currentCandidate;

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Fully Responsive */}
      <header className="bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                to="/" 
                className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium hidden xs:inline">Back</span>
              </Link>
              <div className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 bg-gradient-to-r from-primary to-primary/80 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="w-4 sm:w-5 lg:w-7 h-4 sm:h-5 lg:h-7 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Crisp Interview</h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium hidden lg:block">AI-Powered Technical Assessment</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-base font-bold text-foreground">Crisp</h1>
              </div>
            </div>

            {/* Navigation Tabs - Fully Responsive */}
            <nav className="flex items-center bg-muted/50 rounded-2xl p-1.5 relative backdrop-blur-sm">
              <motion.div
                className="absolute top-1.5 bottom-1.5 bg-background rounded-xl shadow-lg border border-border"
                animate={{
                  left: activeTab === 'interviewee' ? '6px' : 'calc(50% + 3px)',
                  width: 'calc(50% - 9px)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
              
              <button
                onClick={() => handleTabChange('interviewee')}
                className={`relative px-3 sm:px-6 lg:px-8 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 z-10 flex items-center gap-1 sm:gap-2 lg:gap-3 ${
                  activeTab === 'interviewee'
                    ? 'text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden xs:inline sm:inline">Interviewee</span>
                <span className="xs:hidden sm:hidden">Interview</span>
              </button>
              
              <button
                onClick={() => handleTabChange('interviewer')}
                className={`relative px-3 sm:px-6 lg:px-8 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 z-10 flex items-center gap-1 sm:gap-2 lg:gap-3 ${
                  activeTab === 'interviewer'
                    ? 'text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden xs:inline sm:inline">Interviewer</span>
                <span className="xs:hidden sm:hidden">Dashboard</span>
              </button>
            </nav>

            {/* Status indicator - Responsive */}
            <div className="flex items-center gap-1 sm:gap-3">
              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1 sm:py-2 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium border border-primary/20 shadow-sm">
                <Sparkles className="w-3 sm:w-4 h-3 sm:h-4 animate-pulse" />
                <span className="hidden sm:inline">AI Ready</span>
                <span className="sm:hidden">AI</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Fully Responsive */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'interviewee' ? (
            <motion.div
              key="interviewee"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)] lg:h-[calc(100vh-220px)]"
            >
              {/* Left Panel - Resume Upload - Responsive */}
              <div className="bg-card backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-border p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
                  <div className="space-y-4 sm:space-y-6">
                  <div className="text-center">
                    <div className="w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 bg-gradient-to-r from-primary to-primary/80 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                      <Brain className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1 sm:mb-2">
                      Welcome to Crisp Interview
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Your AI-powered technical assessment platform
                    </p>
                  </div>
                  
                  
                  <ResumeUpload
                    onResumeUploaded={handleResumeUploaded}
                    onFieldUpdate={handleFieldUpdate}
                    existingData={{
                      name: currentCandidate?.name,
                      email: currentCandidate?.email,
                      phone: currentCandidate?.phone,
                    }}
                    missingFields={missingFields}
                  />                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    {!currentCandidate ? (
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStartNew}
                        className="w-full px-6 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary/70 transition-all font-medium flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <Sparkles className="w-5 h-5" />
                        Start New Interview
                      </motion.button>
                    ) : canStartInterview && !isInterviewActive && !hasStartedInterview ? (
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleInterviewStart}
                        className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <MessageSquare className="w-5 h-5" />
                        Begin Interview
                      </motion.button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Right Panel - Chat - Responsive */}
              <div className="bg-card backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-border overflow-hidden">
                <Chat
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  onStartInterview={handleInterviewStart}
                  timerState={timerState}
                  onTimerTick={handleTimerTick}
                  onTimerEnd={handleTimerEnd}
                  canStartInterview={!!canStartInterview}
                  isInterviewActive={isInterviewActive}
                  currentQuestionIndex={currentCandidate?.currentQuestionIndex}
                  totalQuestions={6}
                  isSubmitting={isSubmittingAnswer}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="interviewer"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-[calc(100vh-220px)]"
            >
              <Dashboard
                candidates={candidates}
                selectedCandidate={selectedCandidate}
                searchQuery={searchQuery}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSearchChange={(query) => dispatch(setSearchQuery(query))}
                onSortChange={(sortBy) => dispatch(setSortBy(sortBy))}
                onSelectCandidate={(id) => dispatch(selectCandidate(id))}
                onDeleteCandidate={(id) => dispatch(deleteCandidate(id))}
                onGenerateSummary={(id) => dispatch(generateCandidateSummary(id))}
                isGeneratingSummary={isGeneratingSummary}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Welcome Back Modal */}
      <WelcomeBackModal
        isOpen={showWelcomeBack}
        onClose={() => setShowWelcomeBack(false)}
        candidate={currentCandidate}
        onResume={handleResumeInterview}
        onStartNew={handleStartNewFromModal}
      />
    </div>
  );
};