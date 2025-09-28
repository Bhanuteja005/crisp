import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { PlayCircle, Trash2, User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Candidate } from '../types';

interface WelcomeBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onResume: () => void;
  onStartNew: () => void;
}

export const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onResume,
  onStartNew,
}) => {
  if (!candidate) return null;

  const currentQuestionIndex = candidate.currentQuestionIndex || 0;
  const totalQuestions = 6;
  const progressPercentage = (currentQuestionIndex / totalQuestions) * 100;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Welcome Back! 👋
                  </Dialog.Title>

                  <div className="space-y-4">
                    {/* Candidate Info */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">
                          {candidate.name && candidate.name.trim() ? candidate.name : 'Anonymous Candidate'}
                        </span>
                      </div>
                      
                      {candidate.email && (
                        <div className="text-sm text-blue-600 ml-8">
                          {candidate.email}
                        </div>
                      )}
                      
                      {candidate.phone && (
                        <div className="text-sm text-blue-600 ml-8">
                          {candidate.phone}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 text-sm text-blue-700">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Started: {candidate.startedAt ? new Date(candidate.startedAt).toLocaleString() : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Interview Progress</span>
                        <span className="font-medium text-gray-900">
                          {currentQuestionIndex}/{totalQuestions} questions
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        />
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm">
                      You have an unfinished interview session. Would you like to continue where you left off or start a new interview?
                    </p>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onResume}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Continue Interview
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onStartNew}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Start New
                    </motion.button>
                  </div>
                </motion.div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};