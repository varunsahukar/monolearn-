import React, { useState, useEffect, useCallback } from 'react';
import { 
  Code2, 
  Bug, 
  Zap, 
  MessageSquare, 
  ChevronDown, 
  Copy, 
  Check, 
  Play, 
  Terminal, 
  Sparkles,
  RefreshCcw,
  PlusCircle,
  XCircle,
  Info
} from 'lucide-react';
import { cn } from '../utils/cn';
import { clearPendingIntent, getPendingIntent } from '../utils/studyIntent';

const CodeMentor = () => {
  const createCodeContext = useCallback((item) => {
    if (item.type === 'code') {
      return `# Loaded from ${item.name}\n# Subject: ${item.subject}\n\n${item.preview || '# Neural preview unavailable'}`;
    }

    return `# Context lifted from ${item.name}\n# Subject: ${item.subject}\n# Type: ${item.type}\n\n"""\n${item.preview || 'No preview available yet.'}\n"""\n\n# Ask Code Mentor to extract patterns, pseudocode, or implementation guidance from this source.`;
  }, []);

  const [initialIntent] = useState(() => {
    const intent = getPendingIntent();
    return intent?.page === 'code' ? intent : null;
  });
  const [code, setCode] = useState(() => {
    if (initialIntent?.payload?.item) {
      return createCodeContext(initialIntent.payload.item);
    }

    return `def fibonacci(n):
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        # BUG: This recursive call is inefficient for large n
        return fibonacci(n-1) + fibonacci(n-2)

# Example usage
print(fibonacci(10))`;
  });
  
  const [language, setLanguage] = useState('python');
  const [activeTab, setActiveTab] = useState('explain');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [handoffNotice, setHandoffNotice] = useState(
    initialIntent?.payload?.notice || '',
  );

  useEffect(() => {
    if (initialIntent) {
      clearPendingIntent();
    }
  }, [initialIntent]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/chat/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          analysisType: activeTab,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze code');
      }

      const data = await response.json();

      setAnalysisResult({
        [activeTab]: data.analysis,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setAnalysisResult({
        error: `Analysis failed: ${error.message}. Make sure GEMINI_API_KEY is configured.`,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyFix = () => {
    // Generate fix suggestions using Grok's improve analysis
    if (!analysisResult?.[activeTab]) {
      setActiveTab('improve');
      handleAnalyze();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const tabs = [
    { id: 'explain', label: 'Explain', icon: Info },
    { id: 'bugs', label: 'Find Bugs', icon: Bug },
    { id: 'suggest', label: 'Improve', icon: Zap },
    { id: 'comments', label: 'Comments', icon: MessageSquare }
  ];

  const languages = ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust'];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {handoffNotice && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/8 px-4 py-3 text-[12px] text-emerald-100/90 animate-in fade-in slide-in-from-top-2 duration-300">
          <p>{handoffNotice}</p>
          <button
            onClick={() => setHandoffNotice('')}
            className="text-emerald-100/70 transition-colors hover:text-emerald-100"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[700px]">
        {/* Editor Section */}
        <div className="flex flex-col h-full bg-card border border-border/40 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/40 flex items-center justify-between bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border/60 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-secondary transition-all">
                  {language}
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-32 bg-card border border-border rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-10 p-1">
                  {languages.map(lang => (
                    <button 
                      key={lang} 
                      onClick={() => setLanguage(lang)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-secondary transition-all",
                        language === lang ? "bg-secondary text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-4 w-px bg-border/40" />
              <button 
                onClick={copyToClipboard}
                className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground transition-all flex items-center gap-2 text-[10px] font-bold uppercase"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? "Copied" : "Copy"}
              </button>
            </div>
            
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-5 py-2 bg-foreground text-background rounded-xl font-bold text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              {isAnalyzing ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Analyze
            </button>
          </div>

          <div className="flex-1 relative font-mono text-[13px] p-0 overflow-hidden">
            <textarea
              className="w-full h-full bg-transparent p-6 resize-none focus:outline-none scrollbar-hide text-foreground leading-relaxed"
              spellCheck="false"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="# Paste your code here..."
            />
            <div className="absolute right-4 bottom-4 px-2 py-1 bg-secondary/50 rounded-md border border-border/40 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
              L{code.split('\n').length} : C{code.length}
            </div>
          </div>

          <div className="p-4 bg-secondary/30 border-t border-border/40 flex items-center gap-3">
             <Terminal className="w-4 h-4 text-muted-foreground" />
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Console Output</span>
             {analysisResult && (
               <span className="text-[11px] font-mono text-green-500 animate-in fade-in">➜ {analysisResult.output}</span>
             )}
          </div>
        </div>

        {/* Results Section */}
        <div className="flex flex-col h-full space-y-6 overflow-y-auto no-scrollbar pb-12">
          {!analysisResult && !isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6 bg-secondary/20 rounded-3xl border border-dashed border-border/60">
              <div className="p-4 bg-card rounded-2xl border border-border shadow-sm">
                <Code2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Ready for Analysis</h3>
                <p className="text-muted-foreground text-sm max-w-[280px]">Paste your code and click analyze to get deep insights, bug fixes, and optimization suggestions.</p>
              </div>
            </div>
          ) : isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-full space-y-8 p-12 animate-pulse">
               <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-muted rounded-full" />
                  <div className="absolute inset-0 border-4 border-foreground rounded-full border-t-transparent animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-foreground" />
               </div>
               <div className="space-y-2 text-center">
                  <h3 className="text-lg font-bold">Neural Code Analysis</h3>
                  <p className="text-muted-foreground text-sm">Evaluating complexity, identifying logical flaws, and cross-referencing with best practices...</p>
               </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Tab Navigation */}
              <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/40 sticky top-0 z-10 backdrop-blur-md">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
                      activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/80"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic Content */}
              <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm min-h-[400px]">
                {activeTab === 'explain' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-3">
                      <h4 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Structural Logic</h4>
                      <p className="text-[14px] leading-relaxed text-foreground/90">{analysisResult.explanation}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-secondary/50 rounded-2xl border border-border/20">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Time Complexity</h5>
                        <p className="text-sm font-bold font-mono">{analysisResult.complexity.time}</p>
                      </div>
                      <div className="p-4 bg-secondary/50 rounded-2xl border border-border/20">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Space Complexity</h5>
                        <p className="text-sm font-bold font-mono">{analysisResult.complexity.space}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'bugs' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {analysisResult.bugs.map((bug, idx) => (
                      <div key={idx} className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md text-[10px] font-black uppercase">
                            <Bug className="w-3 h-3" />
                            {bug.severity}
                          </div>
                          <span className="text-[11px] font-mono text-muted-foreground">Line {bug.line}</span>
                        </div>
                        <p className="text-[13px] leading-relaxed font-medium">{bug.description}</p>
                        <button 
                          onClick={handleApplyFix}
                          className="w-full py-2.5 bg-red-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Apply Neural Fix
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'suggest' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Optimization Checklist</h4>
                    {analysisResult.improvements.map((imp, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-xl border border-border/10">
                         <div className="shrink-0 mt-0.5">
                            <PlusCircle className="w-4 h-4 text-foreground/50" />
                         </div>
                         <p className="text-[13px] text-foreground/80 leading-relaxed font-medium">{imp}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                    <div className="p-4 bg-secondary/50 rounded-full">
                      <MessageSquare className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground italic font-medium">Coming soon: Automated high-quality documentation and JSDoc generation.</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="p-5 bg-foreground text-background rounded-3xl space-y-4 shadow-xl">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Zap className="w-4 h-4" />
                       <h4 className="text-[11px] font-black uppercase tracking-widest">Efficiency Score</h4>
                    </div>
                    <span className="text-xl font-black">42/100</span>
                 </div>
                 <div className="h-2 w-full bg-background/20 rounded-full overflow-hidden">
                    <div className="h-full w-[42%] bg-background rounded-full transition-all duration-1000" />
                 </div>
                 <p className="text-[11px] font-medium opacity-80 leading-relaxed">
                    This implementation is suboptimal for larger inputs. Applying the 'Neural Fix' will improve efficiency by 98%.
                 </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeMentor;
