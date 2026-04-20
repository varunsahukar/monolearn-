import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  ArrowRight,
  Trophy,
  BookOpen,
  Zap,
  BarChart3,
  Filter,
  Check,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useVault } from '../hooks/useVault';
import { clearPendingIntent, getPendingIntent } from '../utils/studyIntent';
import { cn } from '../utils/cn';

// Default fallback questions (shown if no vault items and API fails)
const DEFAULT_QUESTIONS = [
  {
    id: 1,
    subject: 'Data Structures',
    question: "Which of the following describes the time complexity of a recursive Fibonacci function without memoization?",
    options: ["O(n)", "O(log n)", "O(2^n)", "O(n log n)"],
    correct: 2,
    explanation: "Each call results in two more recursive calls, leading to exponential growth in the total number of calls.",
    source: "sorting_algorithms.py"
  }
];

const QuizLab = () => {
  const { items } = useVault();
  const [initialIntent] = useState(() => {
    const intent = getPendingIntent();
    return intent?.page === 'quiz' ? intent : null;
  });
  const shouldStartWithQuiz = Boolean(initialIntent?.payload?.autoGenerate && items.length > 0);
  const [quizStarted, setQuizStarted] = useState(shouldStartWithQuiz);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizData, setQuizData] = useState([]);
  const [mastery, setMastery] = useState(0);
  const [handoffNotice, setHandoffNotice] = useState(
    initialIntent?.payload?.notice || '',
  );

  useEffect(() => {
    if (initialIntent) {
      clearPendingIntent();
    }
  }, [initialIntent]);

  const handleOptionSelect = (idx) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === quizData[currentQuestionIndex].correct) {
      setScore(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setMastery(Math.round((score / quizData.length) * 100));
      setQuizStarted(false);
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setQuizData([]);
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Quiz Header Stats */}
      {handoffNotice && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-violet-500/15 bg-violet-500/8 px-4 py-3 text-[12px] text-violet-100/90 animate-in fade-in slide-in-from-top-2 duration-300">
          <p>{handoffNotice}</p>
          <button
            onClick={() => setHandoffNotice('')}
            className="text-violet-100/70 transition-colors hover:text-violet-100"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-secondary rounded-2xl">
              <Trophy className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Mastery</p>
              <h4 className="text-xl font-black">{mastery}%</h4>
            </div>
          </div>
          <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-secondary rounded-2xl">
              <Zap className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Topics Mastered</p>
              <h4 className="text-xl font-black">{mastery > 70 ? '8' : '3'} / 12</h4>
            </div>
          </div>
          <div className="bg-foreground text-background rounded-3xl p-6 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-background/10 rounded-2xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Global Rank</p>
              <h4 className="text-xl font-black">Top 5%</h4>
            </div>
          </div>
        </div>

      {quizStarted && (
        <div className="space-y-8 pb-12">
          {/* Quiz Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={resetQuiz} className="p-2 hover:bg-secondary rounded-xl transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-widest">Neural Evaluation</h3>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Question {currentQuestionIndex + 1} of {quizData.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl border border-border/40">
              <Trophy className="w-4 h-4 text-foreground/50" />
              <span className="text-sm font-black tracking-tight">{score}</span>
            </div>
          </div>

          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-foreground transition-all duration-500 ease-out" 
              style={{ width: `${((currentQuestionIndex + 1) / quizData.length) * 100}%` }} 
            />
          </div>

          {/* Question Card */}
          <div className="bg-card border border-border/40 rounded-[40px] p-8 md:p-12 shadow-sm space-y-10 animate-in slide-in-from-right-4 duration-500">
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-black">
                      {currentQuestionIndex + 1}
                   </div>
                   <div className="h-px flex-1 bg-border/40" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold leading-tight">
                   {quizData[currentQuestionIndex].question}
                </h3>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {quizData[currentQuestionIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className={cn(
                      "group w-full p-5 rounded-2xl border text-left text-[14px] font-medium transition-all flex items-center justify-between",
                      selectedOption === null 
                        ? "bg-secondary/30 border-border/40 hover:border-foreground/40 hover:bg-secondary/50"
                        : idx === quizData[currentQuestionIndex].correct
                          ? "bg-green-500/10 border-green-500/40 text-green-700"
                          : selectedOption === idx
                            ? "bg-red-500/10 border-red-500/40 text-red-700"
                            : "bg-secondary/10 border-border/20 opacity-50"
                    )}
                  >
                    <span>{option}</span>
                    {selectedOption !== null && idx === quizData[currentQuestionIndex].correct && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {selectedOption === idx && idx !== quizData[currentQuestionIndex].correct && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </button>
                ))}
             </div>

             {showExplanation && (
               <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="p-6 bg-secondary/30 rounded-3xl border border-border/40 space-y-4">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <BookOpen className="w-4 h-4 text-muted-foreground" />
                           <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">AI Insights</h4>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-foreground text-background rounded-md text-[9px] font-black uppercase tracking-widest">
                           Source: {quizData[currentQuestionIndex].source}
                        </div>
                     </div>
                     <p className="text-[13px] leading-relaxed text-foreground/80 font-medium">
                        {quizData[currentQuestionIndex].explanation}
                     </p>
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full py-5 bg-foreground text-background rounded-2xl font-bold text-[13px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-foreground/10"
                  >
                    {currentQuestionIndex < quizData.length - 1 ? "Next Analysis" : "View Final Results"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizLab;