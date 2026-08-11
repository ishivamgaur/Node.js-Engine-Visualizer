import { Layers, Inbox } from 'lucide-react';
import Tooltip from '../Tooltip';

export default function CallStack({ stack, highlighted , onMaximize }) {
  return (
    <div
      className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden  h-full ${highlighted === "callStack" ? "border-neon-cyan/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]" : "border-border-subtle"}`}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <Layers size={14} className="text-text-muted" />
        <Tooltip text="CALL STACK: Executes synchronous JavaScript code one frame at a time (LIFO: Last In, First Out). The V8 engine halts completely if this gets blocked by slow code!">
          <span className="text-[13px] font-semibold uppercase tracking-wider text-text-sub cursor-default">
            Call Stack
          </span>
        </Tooltip>
        <span className="ml-auto bg-bg-secondary text-text-muted text-[12px] font-bold px-1.5 py-0.5 rounded-sm border border-border-subtle">
          {stack.length}
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
      <div className="flex-1 p-2 overflow-y-auto flex flex-col justify-end">
        {stack.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-[13px] gap-1">
            <Inbox size={24} className="opacity-50 mb-1" />
            <span>Stack is empty</span>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-1.5">
            {stack.map((frame, i) => {
              const colors = {
                main: "bg-neon-cyan/10 text-neon-cyan border-l-2 border-l-neon-cyan",
                function:
                  "bg-neon-green/10 text-neon-green border-l-2 border-l-neon-green",
                console:
                  "bg-neon-yellow/10 text-neon-yellow border-l-2 border-l-neon-yellow",
                timer:
                  "bg-neon-orange/10 text-neon-orange border-l-2 border-l-neon-orange",
                promise:
                  "bg-neon-purple/10 text-neon-purple border-l-2 border-l-neon-purple",
                microtask:
                  "bg-neon-purple/10 text-neon-purple border-l-2 border-l-neon-purple",
                macrotask:
                  "bg-neon-orange/10 text-neon-orange border-l-2 border-l-neon-orange",
                webapi:
                  "bg-neon-pink/10 text-neon-pink border-l-2 border-l-neon-pink",
                libuv:
                  "bg-neon-green/10 text-neon-green border-l-2 border-l-neon-green",
                check:
                  "bg-neon-yellow/10 text-neon-yellow border-l-2 border-l-neon-yellow",
              };
              return (
                <div
                  key={`${frame.name}-${i}`}
                  className={`font-mono text-[13px] font-medium px-2 py-0.5 rounded animate-stack-push truncate ${colors[frame.type] || colors.main}`}
                  title={frame.name}
                >
                  {frame.name}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

