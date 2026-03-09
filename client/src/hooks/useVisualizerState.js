import { useState, useCallback, useRef, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

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
  const [mode, setMode] = useState('code'); // 'code' | 'multi-request'
  const [numRequests, setNumRequests] = useState(3);
  const intervalRef = useRef(null);

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
  const analyzeCode = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setIsPlaying(false);
    clearInterval(intervalRef.current);
    try {
      let endpoint = '/analyze';
      let body = { code };

      if (mode === 'multi-request') {
        endpoint = '/multi-request';
        body = { code, numRequests };
      } else if (mode === 'js-execution') {
        endpoint = '/js-execution';
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setTimeline(data.timeline);
      setCurrentStep(-1);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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
