import React, { useState } from 'react';
import { Search, SortAsc, SortDesc, Users, Calendar, Mail, Phone, Eye, Trash2, Award, Clock, CheckCircle2, XCircle, Loader, MessageSquare, Brain, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Candidate } from '../../types';

interface DashboardProps {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  searchQuery: string;
  sortBy: 'date' | 'score' | 'name' | 'progress';
  sortOrder: 'asc' | 'desc';
  onSearchChange: (query: string) => void;
  onSortChange: (sortBy: 'date' | 'score' | 'name' | 'progress') => void;
  onSelectCandidate: (candidateId: string | null) => void;
  onDeleteCandidate: (candidateId: string) => void;
  onGenerateSummary: (candidateId: string) => void;
  isGeneratingSummary: boolean;
  className?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  candidates,
  selectedCandidate,
  searchQuery,
  sortBy,
  sortOrder,
  onSearchChange,
  onSortChange,
  onSelectCandidate,
  onDeleteCandidate,
  onGenerateSummary,
  isGeneratingSummary,
  className = '',
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Auto-generate summary for completed candidates without summary
  React.useEffect(() => {
    if (selectedCandidate && 
        selectedCandidate.progress === 'completed' && 
        !selectedCandidate.summary && 
        !isGeneratingSummary) {
      onGenerateSummary(selectedCandidate.id);
    }
  }, [selectedCandidate, isGeneratingSummary, onGenerateSummary]);

  const getProgressIcon = (progress: Candidate['progress']) => {
    switch (progress) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'not_started':
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getProgressText = (progress: Candidate['progress']) => {
    switch (progress) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'not_started':
        return 'Not Started';
    }
  };

  const getProgressBadge = (progress: Candidate['progress']) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium";
    switch (progress) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'in_progress':
        return `${baseClasses} bg-blue-100 text-blue-700`;
      case 'not_started':
        return `${baseClasses} bg-gray-100 text-gray-600`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  };

  const completedCandidates = candidates.filter(c => c.progress === 'completed');
  const avgScore = completedCandidates.length > 0 
    ? completedCandidates.reduce((sum, c) => sum + (c.score || 0), 0) / completedCandidates.length 
    : 0;

  return (
    <div className={`h-full bg-card/50 backdrop-blur-sm rounded-3xl shadow-xl border border-border ${className} ${selectedCandidate ? 'grid grid-cols-[1fr_384px]' : 'block'}`}>
      {/* Main Content */}
      <div className="flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="p-8 border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-t-3xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Interview Dashboard
              </h2>
              <p className="text-muted-foreground mt-1">Manage and review candidate interviews</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{candidates.length} Candidates</span>
              </div>
              {completedCandidates.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">Avg Score: {avgScore.toFixed(1)}/100</span>
                </div>
              )}
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
              {(['date', 'score', 'name', 'progress'] as const).map((sortOption) => (
                <button
                  key={sortOption}
                  onClick={() => onSortChange(sortOption)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    sortBy === sortOption
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
                  {getSortIcon(sortOption)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="flex-1 overflow-y-auto p-6">
          {candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Users className="w-12 h-12 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Candidates Yet</h3>
              <p className="text-center max-w-md">
                Candidates will appear here after they complete their interviews. Switch to the Interviewee tab to start a new interview.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {candidates.map((candidate, index) => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={`p-6 border border-gray-200 rounded-2xl hover:shadow-lg transition-all cursor-pointer bg-white hover:bg-gradient-to-r hover:from-white hover:to-blue-50 ${
                      selectedCandidate?.id === candidate.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                    }`}
                    onClick={() => onSelectCandidate(candidate.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {(candidate.name && candidate.name.trim() ? candidate.name.charAt(0).toUpperCase() : 'A')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-xl font-semibold text-gray-900">
                                {candidate.name && candidate.name.trim() ? candidate.name : 'Anonymous Candidate'}
                              </h3>
                              <div className={getProgressBadge(candidate.progress)}>
                                {getProgressIcon(candidate.progress)}
                                {getProgressText(candidate.progress)}
                              </div>
                            </div>
                            {candidate.score !== undefined && (
                              <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium w-fit">
                                <Award className="w-4 h-4" />
                                Score: {candidate.score}/100
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Mail className="w-5 h-5 text-blue-500" />
                            <span className="font-medium text-gray-700">
                              {candidate.email && candidate.email.trim() ? candidate.email : 'No email provided'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Phone className="w-5 h-5 text-green-500" />
                            <span className="font-medium text-gray-700">
                              {candidate.phone && candidate.phone.trim() ? candidate.phone : 'No phone provided'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            <span className="font-medium text-gray-700">
                              {candidate.startedAt ? formatDate(candidate.startedAt) : formatDate(candidate.createdAt)}
                            </span>
                          </div>
                        </div>

                        {candidate.progress === 'in_progress' && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-2 text-sm text-blue-700 font-medium mb-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                Question {(candidate.currentQuestionIndex || 0) + 1} of 6
                              </span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${((candidate.currentQuestionIndex || 0) + 1) / 6 * 100}%` 
                                }}
                              />
                            </div>
                            <div className="text-xs text-blue-600 mt-1 font-medium">
                              {Math.round(((candidate.currentQuestionIndex || 0) + 1) / 6 * 100)}% Complete
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-6">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCandidate(candidate.id);
                          }}
                          className="p-3 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-5 h-5" />
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation(); 
                            setShowDeleteConfirm(candidate.id);
                          }}
                          className="p-3 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                          title="Delete candidate"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Detail Sidebar */}
      <AnimatePresence>
        {selectedCandidate && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white border-l shadow-2xl flex flex-col h-full"
          >
            {/* Detail Header */}
            <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50 rounded-tl-3xl flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Candidate Details</h3>
                <button
                  onClick={() => onSelectCandidate(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {(selectedCandidate.name && selectedCandidate.name.trim() ? selectedCandidate.name.charAt(0).toUpperCase() : 'A')}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {selectedCandidate.name && selectedCandidate.name.trim() ? selectedCandidate.name : 'Anonymous Candidate'}
                    </h4>
                    <div className={getProgressBadge(selectedCandidate.progress)}>
                      {getProgressIcon(selectedCandidate.progress)}
                      {getProgressText(selectedCandidate.progress)}
                    </div>
                  </div>
                </div>

                {/* AI Summary Section - Show at the top */}
                {selectedCandidate.progress === 'completed' && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-bold text-gray-900 flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-600" />
                        AI Summary Report
                      </h5>
                      {!selectedCandidate.summary && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onGenerateSummary(selectedCandidate.id)}
                          disabled={isGeneratingSummary}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                          {isGeneratingSummary ? (
                            <>
                              <Loader className="w-3 h-3 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            'Generate Summary'
                          )}
                        </motion.button>
                      )}
                    </div>

                    {isGeneratingSummary ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center gap-3">
                          <Loader className="w-8 h-8 animate-spin text-blue-600" />
                          <p className="text-sm text-gray-600">AI is analyzing the interview...</p>
                        </div>
                      </div>
                    ) : selectedCandidate.summary ? (
                      <div className="space-y-4">
                        {selectedCandidate.score !== undefined && (
                          <div className="flex items-center justify-center gap-2 px-6 py-3 bg-white rounded-xl shadow-sm border border-purple-200">
                            <Award className="w-6 h-6 text-purple-600" />
                            <span className="text-lg font-bold text-gray-900">
                              Overall Score: {selectedCandidate.score}/100
                            </span>
                          </div>
                        )}
                        
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <h6 className="font-medium text-gray-900 mb-2">Summary</h6>
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedCandidate.summary.summary}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {selectedCandidate.summary.strengths && selectedCandidate.summary.strengths.length > 0 && (
                            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                              <h6 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Strengths
                              </h6>
                              <ul className="text-sm text-green-800 space-y-1">
                                {selectedCandidate.summary.strengths.map((strength: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {selectedCandidate.summary.improvements && selectedCandidate.summary.improvements.length > 0 && (
                            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                              <h6 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Areas for Improvement
                              </h6>
                              <ul className="text-sm text-orange-800 space-y-1">
                                {selectedCandidate.summary.improvements.map((improvement: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                                    {improvement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600">Click "Generate Summary" to get AI insights</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-700">
                      {selectedCandidate.email && selectedCandidate.email.trim() ? selectedCandidate.email : 'No email provided'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-700">
                      {selectedCandidate.phone && selectedCandidate.phone.trim() ? selectedCandidate.phone : 'No phone provided'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-gray-700">
                      Started: {selectedCandidate.startedAt ? formatDate(selectedCandidate.startedAt) : formatDate(selectedCandidate.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interview Progress */}
            {selectedCandidate.progress === 'in_progress' && (
              <div className="p-6 border-b">
                <h5 className="font-medium text-gray-900 mb-3">Interview Progress</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Questions Answered</span>
                    <span className="font-medium">
                      {(selectedCandidate.currentQuestionIndex || 0) + 1} / 6
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${((selectedCandidate.currentQuestionIndex || 0) + 1) / 6 * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Questions and Answers */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Interview Questions & Answers
                  </h5>
                </div>

                {selectedCandidate.questions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No questions answered yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedCandidate.questions.map((question, index) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                      >
                        {/* Question Header */}
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                question.difficulty === 'easy' ? 'bg-green-100 text-green-700 border border-green-200' :
                                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {question.difficulty}
                              </span>
                            </div>
                            {question.score !== undefined && (
                              <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
                                question.score >= 80 ? 'bg-green-100 text-green-700 border border-green-200' :
                                question.score >= 60 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                <Award className="w-4 h-4" />
                                {question.score}/100
                              </div>
                            )}
                          </div>
                          <h6 className="text-sm font-semibold text-gray-900 leading-relaxed">
                            {question.text}
                          </h6>
                        </div>

                        {/* Answer and Feedback */}
                        <div className="p-6 space-y-4">
                          {question.answer ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Users className="w-4 h-4 text-blue-600" />
                                Candidate Answer
                              </div>
                              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                  {question.answer}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <XCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">No answer provided</p>
                            </div>
                          )}

                          {question.feedback && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Brain className="w-4 h-4 text-purple-600" />
                                AI Feedback
                              </div>
                              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                <p className="text-sm text-purple-800 leading-relaxed">
                                  {question.feedback}
                                </p>
                              </div>
                            </div>
                          )}

                          {question.feedback && question.score !== undefined && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Performance Analysis
                              </div>
                              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                                <p className="text-sm text-indigo-800 leading-relaxed">
                                  Score: {question.score}/100 - {question.feedback}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Candidate</h3>
              <p className="text-gray-600 text-sm mb-6">
                Are you sure you want to delete this candidate? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteCandidate(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};