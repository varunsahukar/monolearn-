import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  Paperclip, 
  X, 
  Bot, 
  User, 
  Sparkles,
  Search,
  FileText,
  Video,
  Code,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useVault } from '../hooks/useVault';
import { clearPendingIntent, getPendingIntent } from '../utils/studyIntent';
import { cn } from '../utils/cn';

const KnowledgeChat = () => {
  const { items } = useVault();
  const [initialIntent] = useState(() => {
    const intent = getPendingIntent();
    return intent?.page === 'chat' ? intent : null;
  });
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your SOLO TUTOR guide. Select some materials from your vault, and I'll help you understand them with citations.",
      timestamp: new Date()
    },
    ...(initialIntent?.payload?.message
      ? [{
          id: initialIntent.id,
          role: 'assistant',
          content: initialIntent.payload.message,
          timestamp: new Date(),
        }]
      : []),
  ]);
  const [input, setInput] = useState(initialIntent?.payload?.prompt || '');
  const [isThinking, setIsThinking] = useState(false);
  const [selectedContext, setSelectedContext] = useState(() => {
    if (!initialIntent?.payload?.itemIds?.length) {
      return [];
    }

    return items.filter((item) => initialIntent.payload.itemIds.includes(item.id));
  });
  const [showVaultSelector, setShowVaultSelector] = useState(false);
  const [handoffNotice, setHandoffNotice] = useState(initialIntent?.payload?.notice || '');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    if (initialIntent) {
      clearPendingIntent();
    }
  }, [initialIntent]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await fetch('/api/chat/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.content,
          context: selectedContext.map(item => ({
            name: item.name,
            type: item.type || 'document',
            content: item.preview || item.content || item.name,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from LLM');
      }

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        citations: selectedContext.map(c => ({ name: c.name, snippet: `From: ${c.name}` })),
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I encountered an error: ${error.message}. Make sure the XAI_API_KEY is configured.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const toggleContext = (item) => {
    setSelectedContext(prev =>
      prev.find(i => i.id === item.id)
        ? prev.filter(i => i.id !== item.id)
        : [...prev, item]
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Context Bar */}
      {handoffNotice && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-sky-500/15 bg-sky-500/8 px-4 py-3 text-[12px] text-sky-100/90 animate-in fade-in slide-in-from-top-2 duration-300">
          <p>{handoffNotice}</p>
          <button
            onClick={() => setHandoffNotice('')}
            className="text-sky-100/70 transition-colors hover:text-sky-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 pb-4 border-b border-border/40 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setShowVaultSelector(!showVaultSelector)}
          className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-border text-foreground rounded-lg text-xs font-bold transition-all shrink-0"
        >
          <Paperclip className="w-3.5 h-3.5" />
          <span>Add Context</span>
          <ChevronDown className={cn("w-3 h-3 transition-transform", showVaultSelector ? "rotate-180" : "")} />
        </button>

        {selectedContext.map(item => (
          <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 bg-foreground text-background rounded-lg text-[11px] font-bold shrink-0 animate-in zoom-in-95">
            <span className="truncate max-w-[120px]">{item.name}</span>
            <button onClick={() => toggleContext(item)} className="hover:text-red-400 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-[11px] text-muted-foreground italic">No files in vault to use as context.</p>
        )}
      </div>

      {/* Vault Selector Dropdown */}
      {showVaultSelector && (
        <div className="absolute top-12 left-0 right-0 z-20 mt-2 p-2 bg-card border border-border rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto space-y-1 p-1">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => toggleContext(item)}
                className={cn(
                  "w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-all",
                  selectedContext.find(i => i.id === item.id) ? "bg-secondary font-bold" : "hover:bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{item.name}</span>
                </div>
                {selectedContext.find(i => i.id === item.id) && <X className="w-3.5 h-3.5" />}
              </button>
            ))}
            {items.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">Your vault is empty.</div>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide">
        {messages.map((m) => (
          <div key={m.id} className={cn(
            "flex gap-4 max-w-[85%]",
            m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-border/40 shadow-sm",
              m.role === 'user' ? "bg-secondary" : "bg-foreground"
            )}>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-background" />}
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
                  {m.citations.map((cite, idx) => (
                    <button key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-secondary hover:bg-border border border-border/40 rounded-md text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all group">
                      <ExternalLink className="w-3 h-3" />
                      {cite.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isThinking && (
          <div className="flex gap-4 max-w-[85%] mr-auto animate-pulse">
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

      {/* Input Area */}
      <div className="pt-4 border-t border-border/40">
        <div className="relative group">
          <textarea
            rows="1"
            placeholder={items.length === 0 ? "Upload materials to the vault first..." : "Ask your global tutor anything..."}
            disabled={items.length === 0 || isThinking}
            className="w-full bg-card border border-border/60 rounded-2xl px-5 py-4 pr-24 text-[14px] focus:outline-none focus:border-foreground/20 transition-all resize-none shadow-xl shadow-foreground/[0.02] disabled:opacity-50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button className="p-2 hover:bg-secondary rounded-xl text-muted-foreground transition-all">
              <Mic className="w-4 h-4" />
            </button>
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="p-2.5 bg-foreground text-background rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-3 font-medium uppercase tracking-widest opacity-50">
          Powered by SOLO TUTOR Intelligence
        </p>
      </div>
    </div>
  );
};

export default KnowledgeChat;
