import { useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { getExplanation } from '../../utils/explanations';

export default function StepLog({ timeline, currentStep , onMaximize }) {
  const endRef = useRef(null);
  const visibleSteps = timeline.slice(0, currentStep + 1);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentStep]);

  const actionColors = {
    PUSH_CALL_STACK: 'text-neon-cyan',
    POP_CALL_STACK: 'text-neon-cyan',
    LOG_OUTPUT: 'text-neon-yellow',
    REGISTER_WEB_API: 'text-neon-pink',
    QUEUE_MICROTASK: 'text-neon-purple',
    QUEUE_MACROTASK: 'text-neon-orange',
    DEQUEUE_MICROTASK: 'text-neon-purple',
    DEQUEUE_MACROTASK: 'text-neon-orange',
    EVENT_LOOP_START: 'text-neon-green',
    EVENT_LOOP_PHASE: 'text-neon-green',
    EVENT_LOOP_TICK: 'text-neon-green',
    TIMER_COMPLETE: 'text-neon-orange',
    API_COMPLETE: 'text-neon-pink',
    LIBUV_OPERATION: 'text-neon-green',
    LIBUV_COMPLETE: 'text-neon-green',
    EXECUTION_COMPLETE: 'text-neon-green',
    INCOMING_REQUEST: 'text-neon-cyan',
    CALL_STACK_EMPTY: 'text-text-muted',
    FUNCTION_DECLARE: 'text-neon-green',
    VARIABLE_ASSIGN: 'text-text-sub',
    ERROR: 'text-neon-red',
  };

  // Friendly action names for the log
  const friendlyAction = {
    PUSH_CALL_STACK: '▶ PUSH',
    POP_CALL_STACK: '◀ POP',
    LOG_OUTPUT: '📝 LOG',
    REGISTER_WEB_API: '🌐 WEB API',
    QUEUE_MICROTASK: '📥 MICRO',
    QUEUE_MACROTASK: '📥 MACRO',
    DEQUEUE_MICROTASK: '⬆ MICRO',
    DEQUEUE_MACROTASK: '⬆ MACRO',
    EVENT_LOOP_START: '🔄 START',
    EVENT_LOOP_PHASE: '🔄 PHASE',
    EVENT_LOOP_TICK: '🔄 TICK',
    TIMER_COMPLETE: '⏰ TIMER',
    API_COMPLETE: '✅ API',
    LIBUV_OPERATION: '🔧 LIBUV',
    LIBUV_COMPLETE: '✅ I/O',
    EXECUTION_COMPLETE: '🎉 DONE',
    INCOMING_REQUEST: '📡 REQ',
    CALL_STACK_EMPTY: '🟢 EMPTY',
    FUNCTION_DECLARE: '📋 FUNC',
    VARIABLE_ASSIGN: '📦 VAR',
    ERROR: '❌ ERROR',
  };

  return (
    <div className="flex flex-col bg-bg-panel border border-border-subtle rounded-lg backdrop-blur-md overflow-hidden h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <FileText size={14} className="text-text-muted" />
        <span className="text-[13px] font-semibold uppercase tracking-wider text-text-sub">Execution Log</span>
        <span className="ml-auto bg-bg-secondary text-text-muted text-[12px] font-bold px-1.5 py-0.5 rounded-sm border border-border-subtle">
          {visibleSteps.length} / {timeline.length}
        </span>
      
        {onMaximize && (
          <button 
            onClick={onMaximize}
            className="ml-2 p-1 text-text-muted hover:text-text-main hover:bg-bg-secondary rounded "
            title="Maximize"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto font-mono">
        {visibleSteps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-[13px] gap-1">
            <FileText size={24} className="opacity-40 mb-1" />
            <span>Run code to see execution log</span>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 px-2">
            {visibleSteps.map((step, i) => {
              const isCurrent = i === currentStep;
              const explanation = isCurrent ? getExplanation(step) : null;
              
              return (
                <div key={i}>
                  <div
                    className={`flex items-center gap-2 py-0.5 px-1 rounded animate-fade-up ${
                      isCurrent ? 'bg-neon-cyan/10 border border-neon-cyan/20 shrink-0' : 'bg-bg-secondary shrink-0'
                    }`}
                  >
                    <span className="text-text-muted font-bold min-w-[20px] text-right text-[13px]">{step.step}</span>
                    <span className={`font-semibold min-w-[80px] text-[12px] ${actionColors[step.action] || 'text-neon-cyan'}`}>
                      {friendlyAction[step.action] || step.action}
                    </span>
                    <span className="text-text-main flex-1 truncate text-[13px]">{step.detail}</span>
                  </div>
                  {/* Show explanation for current step */}
                  {isCurrent && explanation && (
                    <div className="ml-7 mr-1 mb-1 px-2 py-1.5 rounded bg-neon-cyan/5 border border-neon-cyan/10 text-[13px] text-text-sub leading-relaxed animate-fade-up">
                      {explanation}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>
    </div>
  );
}

