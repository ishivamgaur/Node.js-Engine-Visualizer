import React, { useState, useEffect } from 'react';
import { useVisualizerState } from './hooks/useVisualizerState';
import { samples, serverSamples, jsExecutionSamples as jsSamples } from './utils/samples';
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

import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Maximize2, X, AlertTriangle } from 'lucide-react';

const HHandle = () => (
  <PanelResizeHandle className="w-2 h-full flex items-center justify-center hover:bg-neon-cyan/20 cursor-col-resize transition-colors z-30">
    <div className="w-[1px] h-12 bg-border-subtle" />
  </PanelResizeHandle>
);

const VHandle = () => (
  <PanelResizeHandle className="h-2 w-full flex items-center justify-center hover:bg-neon-cyan/20 cursor-row-resize transition-colors z-30">
    <div className="h-[1px] w-12 bg-border-subtle" />
  </PanelResizeHandle>
);

function FocusWrapper({ id, focusedId, setFocusedId, children, title }) {
  if (focusedId && focusedId !== id) return null;
  const isFocused = focusedId === id;
  
  const childWithProps = React.isValidElement(children) 
    ? React.cloneElement(children, { onMaximize: isFocused ? null : () => setFocusedId(id) }) 
    : children;

  if (isFocused) {
    return (
      <div className="fixed inset-4 z-[100] bg-bg-panel backdrop-blur-xl border border-border-light shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-xl flex flex-col p-2 animate-fade-up">
        <div className="flex justify-between items-center mb-2 px-2 shrink-0">
          <h2 className="text-base font-bold text-neon-cyan uppercase tracking-widest">{title} - FOCUSED VIEW</h2>
          <button onClick={() => setFocusedId(null)} className="p-2 hover:bg-neon-red/20 text-text-muted hover:text-neon-red rounded-lg transition-colors border border-transparent hover:border-neon-red/30">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 min-h-0 relative">
          {childWithProps}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full group flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 relative">
        {childWithProps}
      </div>
    </div>
  );
}

export default function App() {
  const v = useVisualizerState();
  const { theme, toggleTheme } = useTheme();
  const [focusedId, setFocusedId] = useState(null);

  useEffect(() => {
    if (v.mode === 'multi-request' && serverSamples.length > 0) {
      v.setCode(serverSamples[0].code);
    } else if (v.mode === 'js-execution' && jsSamples.length > 0) {
      v.setCode(jsSamples[0].code);
    } else if (v.mode === 'code' && samples.length > 0) {
      v.setCode(samples[0].code);
    }
  }, [v.mode]);

  const activeSamples = v.mode === 'multi-request' ? serverSamples 
                      : v.mode === 'js-execution' ? jsSamples 
                      : samples;

  return (
    <div className="h-screen w-screen bg-bg-primary overflow-hidden flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 m-2 bg-bg-panel border border-border-subtle rounded-xl shrink-0 z-50">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-text-main">
            {v.mode === 'js-execution' ? 'JS Engine Visualizer' : 'Node.js Engine Visualizer'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {v.error && (
            <span className="flex items-center gap-1.5 text-[13px] text-neon-red font-medium px-3 py-1 bg-neon-red/10 rounded-lg border border-neon-red/20">
              <AlertTriangle size={14} /> {v.error}
            </span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-tertiary border border-border-subtle">
            <div className={`w-2 h-2 rounded-full ${v.isPlaying ? 'bg-neon-green animate-pulse shadow-[0_0_8px_rgba(0,255,136,0.6)]' : v.timeline.length > 0 ? 'bg-neon-yellow shadow-[0_0_8px_rgba(255,230,0,0.4)]' : 'bg-text-muted'}`} />
            <span className="text-[13px] font-semibold text-text-sub">
              {v.isPlaying ? 'Running' : v.timeline.length > 0 ? 'Paused' : 'Ready'}
            </span>
          </div>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </header>

      {/* Main Resizable Workspace */}
      <div className="flex-1 min-h-0 px-2 pb-2 w-full relative">
        
        {/* Overlay dark backdrop if something is focused */}
        {focusedId && <div className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm z-[90] rounded-xl" />}

        <PanelGroup orientation="horizontal" className="h-full w-full">
          
          {/* COLUMN 1: Code & Console */}
          <Panel defaultSize={33} minSize={20}>
            <PanelGroup orientation="vertical">
              <Panel defaultSize={60} minSize={20}>
                <FocusWrapper id="editor" focusedId={focusedId} setFocusedId={setFocusedId} title="Code Editor">
                  <CodeEditor
                    theme={theme} code={v.code} setCode={v.setCode}
                    onRun={v.analyzeCode} isLoading={v.isLoading}
                    mode={v.mode} setMode={v.setMode}
                    numRequests={v.numRequests} setNumRequests={v.setNumRequests}
                    samples={activeSamples} onSelectSample={s => v.setCode(s.code)}
                    currentLine={v.currentLine}
                  />
                </FocusWrapper>
              </Panel>
              
              <VHandle />
              
              <Panel defaultSize={10} minSize={8}>
                <Controls
                  isPlaying={v.isPlaying} play={v.play} pause={v.pause}
                  stepForward={v.stepForward} stepBackward={v.stepBackward} reset={v.reset}
                  speed={v.speed} setSpeed={v.setSpeed}
                  currentStep={v.currentStep} totalSteps={v.totalSteps}
                  currentAction={v.currentAction}
                />
              </Panel>

              <VHandle />
              
              <Panel defaultSize={30} minSize={15}>
                <FocusWrapper id="console" focusedId={focusedId} setFocusedId={setFocusedId} title="Terminal Console">
                  <Console outputs={v.currentState.consoleOutputs} highlighted={v.currentHighlight} />
                </FocusWrapper>
              </Panel>
            </PanelGroup>
          </Panel>

          <HHandle />

          {/* COLUMN 2: Execution Engine */}
          <Panel defaultSize={33} minSize={20}>
            <PanelGroup orientation="vertical">
              <Panel defaultSize={50} minSize={20}>
                <FocusWrapper id="stack" focusedId={focusedId} setFocusedId={setFocusedId} title="Call Stack">
                  <CallStack stack={v.currentState.callStack} highlighted={v.currentHighlight} />
                </FocusWrapper>
              </Panel>

              <VHandle />

              <Panel defaultSize={50} minSize={20}>
                {v.mode === 'js-execution' ? (
                  <FocusWrapper id="memory" focusedId={focusedId} setFocusedId={setFocusedId} title="Memory / Contexts">
                    <ExecutionContexts contexts={v.currentState.executionContexts || []} />
                  </FocusWrapper>
                ) : (
                  <PanelGroup orientation="vertical">
                    <Panel defaultSize={40} minSize={20}>
                      <FocusWrapper id="memory" focusedId={focusedId} setFocusedId={setFocusedId} title="Memory / Contexts">
                        <ExecutionContexts contexts={v.currentState.executionContexts || []} />
                      </FocusWrapper>
                    </Panel>
                    <VHandle />
                    <Panel defaultSize={60} minSize={20}>
                      <PanelGroup orientation="horizontal">
                        <Panel defaultSize={50} minSize={20}>
                          <FocusWrapper id="webapi" focusedId={focusedId} setFocusedId={setFocusedId} title="Web/Node APIs">
                            <WebApis apis={v.currentState.webApis} highlighted={v.currentHighlight} />
                          </FocusWrapper>
                        </Panel>
                        <HHandle />
                        <Panel defaultSize={50} minSize={20}>
                          <FocusWrapper id="libuv" focusedId={focusedId} setFocusedId={setFocusedId} title="Libuv Thread Pool">
                            <Libuv ops={v.currentState.libuvOps} highlighted={v.currentHighlight} />
                          </FocusWrapper>
                        </Panel>
                      </PanelGroup>
                    </Panel>
                  </PanelGroup>
                )}
              </Panel>
            </PanelGroup>
          </Panel>

          <HHandle />

          {/* COLUMN 3: Task Queues & Loop */}
          <Panel defaultSize={34} minSize={20}>
            <PanelGroup orientation="vertical">
              <Panel defaultSize={30} minSize={15}>
                <PanelGroup orientation="horizontal">
                  <Panel defaultSize={50} minSize={20}>
                    <FocusWrapper id="micro" focusedId={focusedId} setFocusedId={setFocusedId} title="Microtask Queue">
                      <MicrotaskQueue queue={v.currentState.microtaskQueue} highlighted={v.currentHighlight} />
                    </FocusWrapper>
                  </Panel>
                  
                  <HHandle />
                  
                  <Panel defaultSize={50} minSize={20}>
                    <FocusWrapper id="macro" focusedId={focusedId} setFocusedId={setFocusedId} title="Macrotask Queue">
                      <MacrotaskQueue queue={v.currentState.macrotaskQueue} highlighted={v.currentHighlight} />
                    </FocusWrapper>
                  </Panel>
                </PanelGroup>
              </Panel>

              <VHandle />

              <Panel defaultSize={40} minSize={20}>
                <FocusWrapper id="loop" focusedId={focusedId} setFocusedId={setFocusedId} title="Event Loop Tracker">
                  <EventLoop highlighted={v.currentHighlight} currentAction={v.currentAction} isPlaying={v.isPlaying} />
                </FocusWrapper>
              </Panel>

              <VHandle />

              <Panel defaultSize={20} minSize={10}>
                <FocusWrapper id="log" focusedId={focusedId} setFocusedId={setFocusedId} title="Execution Step Log">
                  <StepLog timeline={v.timeline} currentStep={v.currentStep} />
                </FocusWrapper>
              </Panel>
            </PanelGroup>
          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
}

