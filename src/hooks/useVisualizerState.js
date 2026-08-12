import { useState, useCallback, useRef, useEffect } from 'react';
import { generateTimeline, generateMultiRequestTimeline } from '../engine/simulator';
import { Interpreter } from '../engine/interpreter';
import { generateBrowserTimeline } from '../engine/browserSimulator';

export function useVisualizerState() {
  const [code, setCode] = useState(`console.log('Start');

setTimeout(() => {
  console.log('Timeout callback');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise resolved');
});

console.log('End');`);

  const [timeline, setTimeline] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const getInitialMode = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (['code', 'multi-request', 'js-execution', 'browser-render'].includes(tab)) {
      return tab;
    }
    return 'browser-render'; // Default
  };

  const [mode, setMode] = useState(getInitialMode); // 'code' | 'multi-request' | 'js-execution' | 'browser-render'

  // Sync mode with URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') !== mode) {
      params.set('tab', mode);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [mode]);
  const [numRequests, setNumRequests] = useState(3);
  const intervalRef = useRef(null);

  // Update default code when mode changes
  useEffect(() => {
    if (mode === 'browser-render') {
      setCode(`<!DOCTYPE html>
<html>
<head>
  <style>
    .card { 
      background: white; 
      padding: 20px; 
      border-radius: 8px;
    }
    .title { 
      color: #333; 
      font-size: 24px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1 class="title">Hello Browser!</h1>
    <p>This is how rendering works.</p>
  </div>
  <script>
    console.log('DOM is fully parsed!');
  </script>
</body>
</html>`);
    } else if (mode === 'js-execution') {
      setCode(`function outer() {
  let count = 0;
  return function inner() {
    count++;
    console.log('Count is', count);
  }
}

const myClosure = outer();
myClosure();
myClosure();`);
    } else {
      setCode(`console.log('Start');

setTimeout(() => {
  console.log('Timeout callback');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise resolved');
});

console.log('End');`);
    }
    setTimeline([]);
    setCurrentStep(-1);
  }, [mode]);

  // Current state at this step
  const currentState = currentStep >= 0 && currentStep < timeline.length
    ? timeline[currentStep].state
    : {
        callStack: [],
        microtaskQueue: [],
        macrotaskQueue: [],
        webApis: [],
        libuvOps: [],
        consoleOutputs: [],
      };

  const currentHighlight = currentStep >= 0 && currentStep < timeline.length
    ? timeline[currentStep].highlight
    : null;

  const currentAction = currentStep >= 0 && currentStep < timeline.length
    ? timeline[currentStep]
    : null;

  const currentLine = currentStep >= 0 && currentStep < timeline.length
    ? timeline[currentStep].line || null
    : null;

  // Analyze code
  const analyzeCode = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setIsPlaying(false);
    clearInterval(intervalRef.current);
    
    // Use setTimeout to allow UI to update to loading state before heavy computation
    setTimeout(() => {
      try {
        let newTimeline = [];
        if (mode === 'multi-request') {
          const num = Math.min(Math.max(parseInt(numRequests) || 3, 1), 10);
          newTimeline = generateMultiRequestTimeline(code, num);
        } else if (mode === 'js-execution') {
          const interpreter = new Interpreter(code);
          newTimeline = interpreter.run();
        } else if (mode === 'browser-render') {
          newTimeline = generateBrowserTimeline(code);
        } else {
          newTimeline = generateTimeline(code);
        }
        
        setTimeline(newTimeline);
        setCurrentStep(-1);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }, 10);
  }, [code, mode, numRequests]);

  // Playback controls
  const play = useCallback(() => {
    if (currentStep >= timeline.length - 1) {
      setCurrentStep(-1);
    }
    setIsPlaying(true);
  }, [currentStep, timeline.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.min(prev + 1, timeline.length - 1));
  }, [timeline.length]);

  const stepBackward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.max(prev - 1, -1));
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(-1);
    clearInterval(intervalRef.current);
  }, []);

  // Auto-play effect
  useEffect(() => {
    if (isPlaying && timeline.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= timeline.length - 1) {
            setIsPlaying(false);
            clearInterval(intervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 800 / speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, timeline.length]);

  return {
    code, setCode,
    timeline, currentStep, currentState, currentHighlight, currentAction,
    currentLine,
    isPlaying, speed, setSpeed,
    error, isLoading,
    mode, setMode,
    numRequests, setNumRequests,
    analyzeCode,
    play, pause, stepForward, stepBackward, reset,
    totalSteps: timeline.length,
  };
}

