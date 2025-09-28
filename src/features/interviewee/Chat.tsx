import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage, TimerState } from '../../types';
import { Timer } from '../../components/Timer';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onStartInterview: () => void;
  timerState: TimerState;
  onTimerTick: () => void;
  onTimerEnd: () => void;
  canStartInterview: boolean;
  isInterviewActive: boolean;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  isSubmitting?: boolean;
  className?: string;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  onSendMessage,
  onStartInterview,
  timerState,
  onTimerTick,
  onTimerEnd,
  canStartInterview,
  isInterviewActive,
  currentQuestionIndex = 0,
  totalQuestions = 6,
  isSubmitting = false,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    if (!isInterviewActive && canStartInterview) {
      onStartInterview();
      return;
    }
    
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const getMessageIcon = (type: ChatMessage['type']) => {
    switch (type) {
      case 'system':
        return <Bot className="w-4 h-4 text-primary" />;
      case 'question':
        return <Bot className="w-4 h-4 text-secondary-foreground" />;
      case 'user':
      case 'answer':
        return <User className="w-4 h-4 text-primary" />;
      default:
        return <Bot className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getMessageBg = (type: ChatMessage['type']) => {
    switch (type) {
      case 'system':
        return 'bg-primary/10 border-primary/20';
      case 'question':
        return 'bg-secondary border-border';
      case 'user':
      case 'answer':
        return 'bg-muted border-border';
      default:
        return 'bg-background border-border';
    }
  };

  const isQuestionMessage = (message: ChatMessage) => message.type === 'question';
  const latestQuestion = messages.filter(isQuestionMessage).pop();
  const showTimer = isInterviewActive && timerState.isActive && latestQuestion;

  return (
    <div className={`flex flex-col h-full bg-card rounded-lg shadow-sm border border-border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Interview Assistant</h3>
            <p className="text-xs text-muted-foreground">
              {isInterviewActive ? `Question ${currentQuestionIndex + 1} of ${totalQuestions}` : 'Ready to begin'}
            </p>
          </div>
        </div>
        
        {/* Progress bar */}
        {isInterviewActive && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-background rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/70"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Timer */}
      <AnimatePresence>
        {showTimer && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-3 bg-primary/10 border-b border-border flex items-center justify-center"
          >
            <Timer
              timeLeft={timerState.timeLeft}
              totalTime={timerState.totalTime}
              isActive={timerState.isActive}
              onTick={onTimerTick}
              onTimeUp={onTimerEnd}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={`${message.id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex items-start gap-3 p-3 rounded-lg border ${getMessageBg(message.type)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getMessageIcon(message.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {message.type === 'system' ? 'System' :
                     message.type === 'question' ? 'Interviewer' :
                     'You'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                  {message.content}
                </p>
                
                {message.isTyping && (
                  <div className="flex items-center gap-1 mt-2">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-muted-foreground rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">Typing...</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background/50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                !canStartInterview
                  ? "Please complete your contact information above"
                  : !isInterviewActive
                  ? "Type 'start' to begin the interview"
                  : "Type your answer here..."
              }
              disabled={!canStartInterview || isSubmitting}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-muted disabled:cursor-not-allowed transition-colors"
            />
          </div>
          
          <motion.button
            type="submit"
            disabled={!inputValue.trim() || !canStartInterview || isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {!isInterviewActive && canStartInterview ? 'Start' : 'Send'}
                </span>
              </>
            )}
          </motion.button>
        </form>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {canStartInterview ? (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Ready to start</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>Complete contact info first</span>
              </div>
            )}
          </div>
          
          {isInterviewActive && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Auto-submit when timer ends</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};