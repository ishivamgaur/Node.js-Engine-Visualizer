import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FileCode2, Minus, Plus, Play, Loader2 } from 'lucide-react';

export default function CodeEditor({ theme, code, setCode, onRun, isLoading, mode, setMode, numRequests, setNumRequests, samples, onSelectSample, currentLine , onMaximize }) {
  const isLight = theme === 'light';
  const [fontSize, setFontSize] = useState(12);
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);
  
  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#00000000',
      },
    });
    monaco.editor.defineTheme('custom-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#00000000',
      },
    });
  }

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // Update line highlight decoration when currentLine changes
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (currentLine && currentLine > 0) {
      const newDecorations = [
        {
          range: {
            startLineNumber: currentLine,
            startColumn: 1,
            endLineNumber: currentLine,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: 'active-line-highlight',
            glyphMarginClassName: 'active-line-glyph',
            overviewRuler: {
              color: '#00d4ff',
              position: 1,
            },
          },
        },
      ];
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
      editor.revealLineInCenter(currentLine);
    } else {
      // Clear decorations
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }
  }, [currentLine]);

  return (
    <div className="flex flex-col bg-bg-panel border border-border-subtle rounded-lg backdrop-blur-md overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <FileCode2 size={14} className="text-text-muted" />
        <span className="text-[13px] font-semibold uppercase tracking-wider text-text-sub">Engine Code</span>
        <div className="ml-auto flex gap-1.5 items-center">
          <select
            value={mode}
            onChange={e => setMode(e.target.value)}
            className="bg-bg-secondary text-text-main border border-border-subtle rounded px-2 py-0.5 text-[13px] font-sans cursor-pointer focus:outline-none focus:border-neon-cyan"
          >
            <option value="code">Analysis</option>
            <option value="multi-request">Concurrent</option>
            <option value="js-execution">JS Execution</option>
            <option value="browser-render">Browser Render</option>
          </select>
          {mode === 'multi-request' && (
            <input
              type="number" min="1" max="10"
              value={numRequests}
              onChange={e => setNumRequests(parseInt(e.target.value) || 3)}
              className="bg-bg-secondary text-text-main border border-border-subtle rounded px-1 py-0.5 text-[13px] font-mono w-14 text-center focus:outline-none focus:border-neon-cyan"
              title="Concurrent requests (1-10)"
            />
          )}
          <button
            onClick={onRun}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-[13px] font-bold bg-bg-secondary text-text-main border border-border-subtle hover:bg-bg-tertiary hover:border-border-light  disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} className="fill-current" />} {isLoading ? 'Analyzing' : 'Run'}
          </button>
        
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
      </div>

      {/* Sample snippets */}
      {samples && samples.length > 0 && (
        <div className="flex gap-1.5 px-2 py-1.5 border-b border-border-subtle overflow-x-auto shrink-0 bg-bg-secondary/50 scrollbar-hide">
          <span className="text-[12px] text-text-muted self-center mr-1 whitespace-nowrap uppercase tracking-wider font-semibold">Samples</span>
          {samples.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelectSample(s)}
              title={s.description}
              className="px-2 py-0.5 text-[12px] font-medium whitespace-nowrap bg-bg-tertiary border border-border-subtle rounded text-text-sub hover:text-text-main hover:border-border-light transition-all duration-150 cursor-pointer"
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 min-h-0 bg-bg-panel relative">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme={isLight ? 'custom-light' : 'custom-dark'}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          value={code}
          onChange={val => setCode(val || '')}
          options={{
            fontSize: fontSize,
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
            glyphMargin: true,
            mouseWheelZoom: true,
          }}
        />
        
        {/* Floating Text Size Controls */}
        <div className="absolute bottom-3 right-5 flex items-center gap-1 bg-bg-panel border border-border-subtle rounded-md shadow-lg backdrop-blur-md p-1 z-10 transition-opacity opacity-40 hover:opacity-100">
          <button
            onClick={() => setFontSize(prev => Math.max(8, prev - 1))}
            className="p-1 rounded text-text-muted hover:text-text-main hover:bg-bg-tertiary transition-colors"
            title="Decrease font size"
          >
            <Minus size={14} />
          </button>
          <span className="text-[13px] font-mono text-text-sub w-4 text-center select-none">{fontSize}</span>
          <button
            onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
            className="p-1 rounded text-text-muted hover:text-text-main hover:bg-bg-tertiary transition-colors"
            title="Increase font size"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
