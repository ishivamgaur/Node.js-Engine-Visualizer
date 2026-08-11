import { Play, Pause, SkipForward, SkipBack, RotateCcw, Gamepad2 } from 'lucide-react';
import { getExplanation } from '../../utils/explanations';

export default function Controls({ isPlaying, play, pause, stepForward, stepBackward, reset,
  speed, setSpeed, currentStep, totalSteps, currentAction
, onMaximize }) {
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="flex flex-col bg-bg-panel border border-border-subtle rounded-lg backdrop-blur-md overflow-hidden h-full">
      {/* Header and Progress Bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border-subtle bg-bg-tertiary relative overflow-hidden">
        <Gamepad2 size={14} className="text-text-muted shrink-0 relative z-10" />
        <span className="text-[12px] font-semibold uppercase tracking-wider text-text-sub relative z-10">Controls</span>
        
        {totalSteps > 0 && (
          <span className="ml-auto text-[11px] font-mono text-text-muted relative z-10 bg-bg-secondary px-1 rounded-sm border border-border-subtle">
            {currentStep + 1}/{totalSteps}
          </span>
        )}
      
        {onMaximize && (
          <button 
            onClick={onMaximize}
            className="ml-2 p-0.5 text-text-muted hover:text-text-main hover:bg-bg-secondary rounded relative z-10"
            title="Maximize"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
          </button>
        )}

        {/* Progress bar integrated into header background */}
        {totalSteps > 0 && (
          <div 
            className="absolute left-0 bottom-0 h-[2px] bg-neon-cyan transition-all duration-300 opacity-80"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>

      {/* Main Controls Row */}
      <div className="p-2 flex items-center justify-between flex-1">
        
        {/* Speed control (Left) */}
        <div className="flex items-center gap-1.5 w-1/3">
          <span className="text-[10px] text-text-muted font-bold tracking-wider">SPEED</span>
          <input
            type="range" min="0.25" max="4" step="0.25"
            value={speed}
            onChange={e => setSpeed(parseFloat(e.target.value))}
            className="w-16 h-1 accent-neon-cyan cursor-pointer"
          />
          <span className="text-[11px] font-mono text-neon-cyan w-6">{speed}x</span>
        </div>

        {/* Transport buttons (Center) */}
        <div className="flex items-center gap-4 justify-center w-1/3">
          <button
            onClick={stepBackward}
            className="text-text-muted hover:text-text-main transition-colors cursor-pointer"
            title="Step back"
          >
            <SkipBack size={16} />
          </button>
          
          <button
            onClick={isPlaying ? pause : play}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors cursor-pointer bg-bg-tertiary text-text-main hover:bg-border-subtle`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={16} weight="fill" />
            ) : (
              <Play size={16} weight="fill" className="ml-0.5" />
            )}
          </button>
          
          <button
            onClick={stepForward}
            className="text-text-muted hover:text-text-main transition-colors cursor-pointer"
            title="Step forward"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Reset (Right) */}
        <div className="flex items-center justify-end w-1/3 pr-2">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-text-muted hover:text-text-main hover:bg-bg-tertiary transition-all duration-200 cursor-pointer group"
            title="Reset"
          >
            <RotateCcw size={12} className="group-hover:-rotate-90 transition-transform duration-300" />
            <span className="text-[11px] font-semibold uppercase">Reset</span>
          </button>
        </div>

      </div>
    </div>
  );
}
