export default function CallStack({ stack, highlighted }) {
  return (
    <div
      className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden transition-all duration-300 h-full ${highlighted === "callStack" ? "border-neon-cyan/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]" : "border-border-subtle"}`}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <span className="text-xs">📚</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-sub">
          Call Stack
        </span>
        <span className="ml-auto bg-bg-secondary text-text-muted text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-border-subtle">
          {stack.length}
        </span>
      </div>
      <div className="flex-1 p-2 overflow-y-auto flex flex-col justify-end">
        {stack.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-[10px] gap-1">
            <span className="text-xl opacity-50 mb-1">📭</span>
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
                  className={`font-mono text-[10px] font-medium px-2 py-1 rounded animate-stack-push truncate ${colors[frame.type] || colors.main}`}
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
