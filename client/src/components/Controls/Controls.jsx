import { Play, Pause, SkipForward, SkipBack, RotateCcw, Gamepad2 } from 'lucide-react';

export default function Controls({
  isPlaying, play, pause, stepForward, stepBackward, reset,
  speed, setSpeed, currentStep, totalSteps, currentAction
}) {
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="flex flex-col bg-bg-panel border border-border-subtle rounded-lg backdrop-blur-md overflow-hidden h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <Gamepad2 size={14} className="text-text-muted" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-sub">Controls</span>
        {totalSteps > 0 && (
          <span className="ml-auto text-[9px] font-mono text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded-sm border border-border-subtle">
            {currentStep + 1} / {totalSteps}
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1 justify-between">
        {/* Transport buttons */}
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={reset}
            className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text-main hover:bg-bg-tertiary transition-all duration-200 cursor-pointer group"
            title="Reset"
          >
            <RotateCcw size={16} className="group-hover:-rotate-90 transition-transform duration-300" />
          </button>
          
          <button
            onClick={stepBackward}
            className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text-main hover:bg-bg-tertiary transition-all duration-200 cursor-pointer"
            title="Step back"
          >
            <SkipBack size={16} />
          </button>
          
          <button
            onClick={isPlaying ? pause : play}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer border hover:scale-105 active:scale-95 ${
              isPlaying 
                ? 'bg-neon-orange/10 text-neon-orange border-neon-orange/40 hover:shadow-[0_0_20px_rgba(255,107,53,0.4)] hover:bg-neon-orange/20'
                : 'bg-neon-green/10 text-neon-green border-neon-green/40 hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] hover:bg-neon-green/20'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={20} weight="fill" className="fill-current stroke-[2px]" />
            ) : (
              <Play size={22} weight="fill" className="fill-current stroke-[2px] ml-1" />
            )}
          </button>
          
          <button
            onClick={stepForward}
            className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text-main hover:bg-bg-tertiary transition-all duration-200 cursor-pointer"
            title="Step forward"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Progress bar */}
        {totalSteps > 0 && (
          <div className="w-full h-1 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--color-neon-cyan), var(--color-neon-purple))',
              }}
            />
          </div>
        )}

        {/* Speed control */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-text-muted font-semibold">SPEED</span>
          <input
            type="range" min="0.25" max="4" step="0.25"
            value={speed}
            onChange={e => setSpeed(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-neon-cyan cursor-pointer"
          />
          <span className="text-[9px] font-mono text-neon-cyan w-6 text-right">{speed}x</span>
        </div>

        {/* Current action display */}
        <div className="min-h-[50px]">
          {currentAction ? (
            <div className="px-2 py-1.5 rounded bg-bg-secondary border border-border-subtle animate-fade-up">
              <span className="text-[9px] font-bold text-neon-cyan font-mono block truncate">{currentAction.action}</span>
              <div className="text-[10px] text-text-main font-mono mt-0.5 truncate">{currentAction.detail}</div>
              {currentAction.phase && (
                <div className="text-[8px] text-text-muted mt-0.5 uppercase tracking-wider">
                  Phase: {currentAction.phase}
                </div>
              )}
            </div>
          ) : (
            <div className="px-2 py-1.5 rounded bg-bg-secondary/50 border border-border-subtle/50 h-full flex items-center justify-center">
              <span className="text-[9px] text-text-muted">No action</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
