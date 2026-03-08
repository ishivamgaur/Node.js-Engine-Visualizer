import { useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';

export default function StepLog({ timeline, currentStep }) {
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
  };

  return (
    <div className="flex flex-col bg-bg-panel border border-border-subtle rounded-lg backdrop-blur-md overflow-hidden h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <FileText size={14} className="text-text-muted" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-sub">Execution Log</span>
        <span className="ml-auto bg-bg-secondary text-text-muted text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-border-subtle">
          {visibleSteps.length} / {timeline.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto font-mono">
        {visibleSteps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-[10px] gap-1">
            <FileText size={24} className="opacity-40 mb-1" />
            <span>Run code to see execution log</span>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 px-2">
            {visibleSteps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 py-0.5 rounded animate-fade-up ${
                  i === currentStep ? 'bg-neon-cyan/10 border border-neon-cyan/20 shrink-0' : 'bg-bg-secondary shrink-0'
                }`}
              >
                <span className="text-text-muted font-bold min-w-[20px] text-right text-[10px]">{step.step}</span>
                <span className={`font-semibold min-w-[100px] text-[10px] ${actionColors[step.action] || 'text-neon-cyan'}`}>
                  {step.action}
                </span>
                <span className="text-text-main flex-1 truncate text-[10px]">{step.detail}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>
    </div>
  );
}
