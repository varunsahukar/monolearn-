import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Search,
  FileText,
  Video,
  Code,
  ChevronRight,
  Bot,
  Zap,
  MessageSquare,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useVault } from '../../hooks/useVault';
import { cn } from '../../utils/cn';

const GlobalTutorModal = ({ isOpen, onClose }) => {
  const { items } = useVault();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "I'm your SOLO TUTOR assistant. I have access to your entire vault. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await fetch('/api/chat/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input,
          context: items.slice(0, 5).map(item => ({
            name: item.name,
            type: item.type || 'document',
            content: item.preview || item.content || item.name,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        citations: items.slice(0, 5).map(item => ({
          name: item.name,
          type: item.type
        }))
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I encountered an error: ${error.message}. Please ensure the API is configured correctly.`,
        citations: []
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      
      <div className={cn(
        "relative bg-card border border-border/40 rounded-[40px] shadow-2xl shadow-foreground/20 flex flex-col overflow-hidden transition-all duration-500 ease-out",
        isMaximized ? "w-full h-full max-w-6xl max-h-[90vh]" : "w-full max-w-2xl h-[700px]"
      )}>
        {/* Modal Header */}
        <div className="p-6 border-b border-border/40 flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-foreground rounded-2xl flex items-center justify-center text-background shadow-lg">
               <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Global Neural Tutor</h3>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Connected to Vault ({items.length} items)</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 hover:bg-secondary rounded-xl text-muted-foreground transition-all"
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-xl text-muted-foreground transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
           {/* Chat Section */}
           <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto no-scrollbar bg-gradient-to-b from-transparent to-secondary/10">
              {messages.map((m, idx) => (
                <div key={idx} className={cn(
                  "flex gap-4 max-w-[90%]",
                  m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-border/40 shadow-sm",
                    m.role === 'user' ? "bg-secondary" : "bg-foreground"
                  )}>
                    {m.role === 'user' ? <MessageSquare className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-background" />}
                  </div>
                  
                  <div className="space-y-3">
                    <div className={cn(
                      "p-4 rounded-2xl text-[14px] leading-relaxed shadow-sm",
                      m.role === 'user' 
                        ? "bg-foreground text-background font-medium rounded-tr-none" 
                        : "bg-card border border-border/40 rounded-tl-none"
                    )}>
                      {m.content}
                    </div>
                    {m.citations && m.citations.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {m.citations.map((cite, i) => (
                          <div key={i} className="flex items-center gap-2 px-2 py-1 bg-secondary/50 border border-border/40 rounded-lg text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <FileText className="w-3 h-3" />
                            {cite.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isThinking && (
                <div className="flex gap-4 max-w-[90%] mr-auto animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-background animate-spin-slow" />
                  </div>
                  <div className="p-4 bg-card border border-border/40 rounded-2xl rounded-tl-none flex gap-1">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
           </div>

           {/* Vault Quick View (Only on large screens or when maximized) */}
           {(isMaximized || window.innerWidth > 1024) && (
             <div className="w-full sm:w-72 border-l border-border/40 p-6 bg-secondary/20 flex flex-col gap-6">
                <div className="space-y-1">
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Neural Context</h4>
                   <p className="text-[12px] font-bold text-foreground/80">I am currently cross-referencing your entire library.</p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
                   {items.map(item => (
                     <div key={item.id} className="p-3 bg-card border border-border/40 rounded-xl space-y-2 group cursor-pointer hover:border-foreground/20 transition-all shadow-sm">
                        <div className="flex items-center gap-2">
                           {item.type === 'pdf' ? <FileText className="w-3.5 h-3.5 text-red-500" /> : 
                            item.type === 'video' ? <Video className="w-3.5 h-3.5 text-blue-500" /> : 
                            <Code className="w-3.5 h-3.5 text-green-500" />}
                           <span className="text-[11px] font-bold truncate group-hover:text-foreground transition-colors">{item.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                           <span>{item.subject}</span>
                           <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                     </div>
                   ))}
                   {items.length === 0 && (
                     <div className="text-center py-12 space-y-4 opacity-50">
                        <Search className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-[11px] font-black uppercase tracking-widest">Vault Empty</p>
                     </div>
                   )}
                </div>
             </div>
           )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-border/40 bg-secondary/10">
           <div className="relative group">
              <input
                type="text"
                placeholder="Ask your global neural tutor anything..."
                className="w-full bg-card border border-border/60 rounded-2xl px-5 py-4 pr-16 text-[14px] focus:outline-none focus:border-foreground/20 transition-all shadow-xl shadow-foreground/[0.02]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-foreground text-background rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalTutorModal;
