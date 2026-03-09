import { useState, useEffect } from 'react';
import { useVisualizerState } from './hooks/useVisualizerState';
import CodeEditor from './components/CodeEditor/CodeEditor';
import CallStack from './components/CallStack/CallStack';
import MicrotaskQueue from './components/TaskQueues/MicrotaskQueue';
import MacrotaskQueue from './components/TaskQueues/MacrotaskQueue';
import EventLoop from './components/EventLoop/EventLoop';
import WebApis from './components/WebApis/WebApis';
import Libuv from './components/Libuv/Libuv';
import Console from './components/Console/Console';
import Controls from './components/Controls/Controls';
import StepLog from './components/StepLog/StepLog';
import ExecutionContexts from './components/Memory/ExecutionContexts';

import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const v = useVisualizerState();
  const { theme, toggleTheme } = useTheme();
  const [samples, setSamples] = useState([]);
  const [serverSamples, setServerSamples] = useState([]);
  const [jsSamples, setJsSamples] = useState([]);

  // Fetch sample snippets on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/samples')
      .then(r => r.json())
      .then(d => d.success && setSamples(d.samples))
      .catch(() => {});
    fetch('http://localhost:5000/api/server-samples')
      .then(r => r.json())
      .then(d => d.success && setServerSamples(d.samples))
      .catch(() => {});
    fetch('http://localhost:5000/api/js-execution-samples')
      .then(r => r.json())
      .then(d => d.success && setJsSamples(d.samples))
      .catch(() => {});
  }, []);

  // Auto-load first server/js sample when switching mode
  useEffect(() => {
    if (v.mode === 'multi-request' && serverSamples.length > 0) {
      v.setCode(serverSamples[0].code);
    } else if (v.mode === 'js-execution' && jsSamples.length > 0) {
      v.setCode(jsSamples[0].code);
    } else if (v.mode === 'code' && samples.length > 0) {
      v.setCode(samples[0].code);
    }
  }, [v.mode, serverSamples, jsSamples, samples]);

  const activeSamples = v.mode === 'multi-request' ? serverSamples 
                      : v.mode === 'js-execution' ? jsSamples 
                      : samples;

  return (
    <div className="h-screen w-screen bg-bg-primary overflow-hidden flex flex-col"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 20% 50%, rgba(0,212,255,0.03) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.03) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 80%, rgba(0,255,136,0.02) 0%, transparent 50%)
        `
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-2 mx-2.5 mt-2.5 mb-0 bg-bg-panel border border-border-subtle rounded-xl backdrop-blur-md shrink-0">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
            Node.js Engine Visualizer
          </h1>
          <p className="text-[11px] text-text-muted">Visualize Call Stack • Event Loop • Task Queues • Libuv • Web APIs</p>
        </div>
        <div className="flex items-center gap-3">
          {v.error && (
            <span className="text-[11px] text-neon-red font-medium px-3 py-1 bg-neon-red/10 rounded-lg border border-neon-red/20">
              ⚠️ {v.error}
            </span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-tertiary border border-border-subtle">
            <div className={`w-2 h-2 rounded-full ${v.isPlaying ? 'bg-neon-green animate-pulse' : v.timeline.length > 0 ? 'bg-neon-yellow' : 'bg-text-muted'}`} />
            <span className="text-[10px] font-semibold text-text-sub">
              {v.isPlaying ? 'Running' : v.timeline.length > 0 ? 'Paused' : 'Ready'}
            </span>
          </div>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 grid grid-cols-12 grid-rows-3 gap-3 p-3 min-h-0">
        {/* Row 1 & 2 Left: Code Editor (Spans 4 cols, 2 rows) */}
        <div className="col-span-4 row-span-2 h-full">
          <CodeEditor
            theme={theme}
            code={v.code} setCode={v.setCode}
            onRun={v.analyzeCode} isLoading={v.isLoading}
            mode={v.mode} setMode={v.setMode}
            numRequests={v.numRequests} setNumRequests={v.setNumRequests}
            samples={activeSamples}
            onSelectSample={s => v.setCode(s.code)}
            currentLine={v.currentLine}
          />
        </div>

        {/* Row 1 Middle: Call Stack & Queues */}
        <div className="col-span-2 row-span-1 h-full">
          <CallStack stack={v.currentState.callStack} highlighted={v.currentHighlight} />
        </div>
        <div className="col-span-2 row-span-1 h-full flex flex-col gap-3">
          <div className="flex-1 h-1/2 min-h-0">
            <MicrotaskQueue queue={v.currentState.microtaskQueue} highlighted={v.currentHighlight} />
          </div>
          <div className="flex-1 h-1/2 min-h-0">
            <MacrotaskQueue queue={v.currentState.macrotaskQueue} highlighted={v.currentHighlight} />
          </div>
        </div>

        {/* Row 1 & 2 Right: Event Loop (Spans 4 cols, 2 rows) */}
        {v.mode === 'js-execution' ? (
          <>
            <div className="col-span-2 row-span-2 h-full">
              <ExecutionContexts contexts={v.currentState.executionContexts || []} />
            </div>
            <div className="col-span-2 row-span-2 h-full">
              <EventLoop highlighted={v.currentHighlight} currentAction={v.currentAction} isPlaying={v.isPlaying} />
            </div>
          </>
        ) : (
          <div className="col-span-4 row-span-2 h-full">
            <EventLoop highlighted={v.currentHighlight} currentAction={v.currentAction} isPlaying={v.isPlaying} />
          </div>
        )}

        {/* Row 2 Middle: Web APIs & Libuv */}
        <div className="col-span-2 row-span-1 h-full">
          <WebApis apis={v.currentState.webApis} highlighted={v.currentHighlight} />
        </div>
        <div className="col-span-2 row-span-1 h-full">
          <Libuv ops={v.currentState.libuvOps} highlighted={v.currentHighlight} />
        </div>

        {/* Row 3: Bottom panels */}
        <div className="col-span-3 row-span-1 h-full">
          <Controls
            isPlaying={v.isPlaying} play={v.play} pause={v.pause}
            stepForward={v.stepForward} stepBackward={v.stepBackward} reset={v.reset}
            speed={v.speed} setSpeed={v.setSpeed}
            currentStep={v.currentStep} totalSteps={v.totalSteps}
            currentAction={v.currentAction}
          />
        </div>
        <div className="col-span-5 row-span-1 h-full">
          <Console outputs={v.currentState.consoleOutputs} highlighted={v.currentHighlight} />
        </div>
        <div className="col-span-4 row-span-1 h-full">
          <StepLog timeline={v.timeline} currentStep={v.currentStep} />
        </div>
      </div>
    </div>
  );
}
