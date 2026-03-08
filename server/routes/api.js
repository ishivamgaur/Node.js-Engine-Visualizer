const express = require('express');
const router = express.Router();
const { generateTimeline, generateMultiRequestTimeline } = require('../engine/simulator');

// POST /api/analyze - Analyze code and return execution timeline
router.post('/analyze', (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required and must be a string' });
    }
    const timeline = generateTimeline(code);
    res.json({ success: true, timeline, totalSteps: timeline.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/multi-request - Simulate multiple requests
router.post('/multi-request', (req, res) => {
  try {
    const { code, numRequests = 3 } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required' });
    }
    const num = Math.min(Math.max(parseInt(numRequests) || 3, 1), 10);
    const timeline = generateMultiRequestTimeline(code, num);
    res.json({ success: true, timeline, totalSteps: timeline.length, numRequests: num });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sample snippets for quick demos
router.get('/samples', (req, res) => {
  const samples = [
    {
      title: 'Sync + Async Basics',
      description: 'Shows the order of sync code, promises, and timers',
      code: `console.log('Start');

setTimeout(() => {
  console.log('Timeout callback');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise resolved');
});

console.log('End');`,
    },
    {
      title: 'Multiple Timers',
      description: 'Demonstrates timer ordering in the macrotask queue',
      code: `console.log('First');

setTimeout(() => {
  console.log('Timer 1 - 100ms');
}, 100);

setTimeout(() => {
  console.log('Timer 2 - 0ms');
}, 0);

setTimeout(() => {
  console.log('Timer 3 - 50ms');
}, 50);

console.log('Last');`,
    },
    {
      title: 'Promise Chain',
      description: 'Visualizes microtask queue with chained promises',
      code: `console.log('Script start');

Promise.resolve()
  .then(() => {
    console.log('Promise 1');
  })
  .then(() => {
    console.log('Promise 2');
  });

Promise.resolve().then(() => {
  console.log('Promise 3');
});

console.log('Script end');`,
    },
    {
      title: 'Mixed Async',
      description: 'Complex mix of microtasks and macrotasks',
      code: `console.log('Start');

setTimeout(() => {
  console.log('setTimeout 1');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise 1');
  setTimeout(() => {
    console.log('setTimeout 2');
  }, 0);
});

process.nextTick(() => {
  console.log('nextTick');
});

console.log('End');`,
    },
    {
      title: 'File System (Libuv)',
      description: 'Shows how fs operations use the libuv thread pool',
      code: `const fs = require('fs');

console.log('Reading file...');

fs.readFile('data.txt', (err, data) => {
  console.log('File read complete');
});

setTimeout(() => {
  console.log('Timer done');
}, 0);

console.log('Program continues');`,
    },
  ];

  res.json({ success: true, samples });
});

module.exports = router;
