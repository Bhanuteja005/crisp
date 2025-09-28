import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { 
  generateNextQuestion, 
  submitAnswer, 
  moveToNextQuestion, 
  startTimer, 
  tickTimer, 
  stopTimer,
  addChatMessage 
} from '../features/interviewee/interviewSlice';
import { addCandidate } from '../features/interviewer/candidateSlice';

export const useInterview = () => {
  const dispatch = useAppDispatch();
  const { 
    currentCandidate, 
    chatMessages, 
    timerState, 
    isInterviewActive, 
    missingFields,
    isGeneratingQuestion,
    isSubmittingAnswer 
  } = useAppSelector((state: any) => state.interview);

  const handleStartNextQuestion = useCallback(async () => {
    if (!currentCandidate) return;

    try {
      // Generate next question
      const result = await dispatch(generateNextQuestion()).unwrap();
      
      // Start timer for the question
      dispatch(startTimer({ seconds: result.timerSeconds }));
    } catch (error) {
      console.error('Failed to generate question:', error);
    }
  }, [dispatch, currentCandidate]);

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    if (!currentCandidate || !isInterviewActive) return;

    try {
      // Stop timer
      dispatch(stopTimer());
      
      // Submit answer for scoring
      await dispatch(submitAnswer(answer)).unwrap();
      
      // Use current candidate state for continuation logic BEFORE moving to next question
      const currentQuestionIndex = currentCandidate.currentQuestionIndex || 0;
      const isLastQuestion = currentQuestionIndex >= 5; // 0-based index, so 5 is the 6th question
      
      // Move to next question or complete interview
      dispatch(moveToNextQuestion());
      
      // Create updated candidate with completion status if it's the last question
      const candidateToAdd = isLastQuestion ? {
        ...currentCandidate,
        progress: 'completed' as const,
        completedAt: new Date().toISOString(),
        currentQuestionIndex: 5, // Keep at 5 for the last question
        score: currentCandidate.questions.length > 0 ? 
          Math.round(currentCandidate.questions.reduce((sum: number, q: any) => sum + (q.score || 0), 0) / currentCandidate.questions.length) : 
          undefined
      } : currentCandidate;
      
      // Always add/update candidate to candidates list
      dispatch(addCandidate(candidateToAdd));
      
      // Check if we should continue to next question
      if (currentQuestionIndex + 1 < 6) {
        // There are more questions, continue interview
        setTimeout(() => {
          handleStartNextQuestion();
        }, 1000);
      } else {
        // Interview completed
        dispatch(addChatMessage({
          type: 'system',
          content: 'Congratulations! You have completed the interview. Thank you for your time. Your responses will be reviewed by our team.',
        }));
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  }, [dispatch, currentCandidate, isInterviewActive, handleStartNextQuestion]);

  const handleTimerEnd = useCallback(() => {
    if (!currentCandidate || !isInterviewActive) return;
    
    // Auto-submit empty answer when timer ends
    const currentQuestionIndex = currentCandidate.currentQuestionIndex || 0;
    const currentQuestion = currentCandidate.questions[currentQuestionIndex];
    
    if (currentQuestion) {
      dispatch(addChatMessage({
        type: 'system',
        content: '⏰ Time\'s up! Moving to the next question.',
      }));
      
      handleSubmitAnswer(''); // Submit empty answer
    }
  }, [dispatch, currentCandidate, isInterviewActive, handleSubmitAnswer]);

  const handleTimerTick = useCallback(() => {
    dispatch(tickTimer());
  }, [dispatch]);

  return {
    currentCandidate,
    chatMessages,
    timerState,
    isInterviewActive,
    missingFields,
    isGeneratingQuestion,
    isSubmittingAnswer,
    handleStartNextQuestion,
    handleSubmitAnswer,
    handleTimerEnd,
    handleTimerTick,
  };
};