import Editor from '@monaco-editor/react';

export default function CodeEditor({ code, setCode, onRun, isLoading, mode, setMode, numRequests, setNumRequests, samples, onSelectSample }) {
  return (
    <div className="flex flex-col bg-bg-panel border border-border-subtle rounded-lg backdrop-blur-md overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <span className="text-xs">📝</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-sub">Engine Code</span>
        <div className="ml-auto flex gap-1.5 items-center">
          <select
            value={mode}
            onChange={e => setMode(e.target.value)}
            className="bg-bg-secondary text-text-main border border-border-subtle rounded px-2 py-0.5 text-[10px] font-sans cursor-pointer focus:outline-none focus:border-neon-cyan"
          >
            <option value="code">Analysis</option>
            <option value="multi-request">Concurrent</option>
          </select>
          {mode === 'multi-request' && (
            <input
              type="number" min="1" max="10"
              value={numRequests}
              onChange={e => setNumRequests(parseInt(e.target.value) || 3)}
              className="bg-bg-secondary text-text-main border border-border-subtle rounded px-1 py-0.5 text-[10px] font-mono w-10 text-center focus:outline-none focus:border-neon-cyan"
              title="Concurrent requests"
            />
          )}
          <button
            onClick={onRun}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold bg-gradient-to-r from-neon-cyan to-cyan-600 text-black border border-neon-cyan hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all duration-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳' : '▶'} {isLoading ? 'Analyzing' : 'Run'}
          </button>
        </div>
      </div>

      {/* Sample snippets */}
      {samples && samples.length > 0 && (
        <div className="flex gap-1.5 px-2 py-1.5 border-b border-border-subtle overflow-x-auto shrink-0 bg-bg-secondary/50 scrollbar-hide">
          <span className="text-[9px] text-text-muted self-center mr-1 whitespace-nowrap uppercase tracking-wider font-semibold">Samples</span>
          {samples.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelectSample(s)}
              title={s.description}
              className="px-2 py-0.5 text-[9px] font-medium whitespace-nowrap bg-bg-tertiary border border-border-subtle rounded text-text-sub hover:text-text-main hover:border-border-light transition-all duration-150 cursor-pointer"
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 min-h-0 bg-[#1e1e1e]">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={val => setCode(val || '')}
          options={{
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            padding: { top: 8, bottom: 8 },
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            renderWhitespace: 'none',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
          }}
        />
      </div>
    </div>
  );
}
