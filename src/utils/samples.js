export const samples = [
  {
    title: "Sync + Async Basics",
    description: "Shows the order of sync code, promises, and timers",
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
    title: "Multiple Timers",
    description: "Demonstrates timer ordering in the macrotask queue",
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
    title: "Promise Chain",
    description: "Visualizes microtask queue with chained promises",
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
    title: "Mixed Async",
    description: "Complex mix of microtasks and macrotasks",
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
    title: "File System (Libuv)",
    description: "Shows how fs operations use the libuv thread pool",
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

export const serverSamples = [
  {
    title: "API + DB Query",
    description:
      "Express handler that queries a database (simulated with fs.readFile) - shows I/O offloaded to libuv",
    code: `console.log('Request received');

const fs = require('fs');

fs.readFile('users.json', (err, data) => {
  console.log('DB query complete');
  console.log('Sending response');
});

console.log('Handler returned');`,
  },
  {
    title: "CPU Heavy API",
    description:
      "Handler with heavy sync computation - shows how it BLOCKS other requests",
    code: `console.log('Request received');

// Simulate CPU-intensive work (blocks the event loop!)
console.log('Starting heavy computation');
console.log('Still computing...');
console.log('Computation done');

console.log('Sending response');`,
  },
  {
    title: "Async Pipeline",
    description: "Multiple async steps chained - read → process → respond",
    code: `console.log('Request received');

const fs = require('fs');

fs.readFile('input.txt', (err, data) => {
  console.log('File read done');

  setTimeout(() => {
    console.log('Processing complete');
    console.log('Response sent');
  }, 100);
});

console.log('Handler returned');`,
  },
  {
    title: "Promise API",
    description:
      "Modern async handler using Promises - shows microtask queue",
    code: `console.log('Request received');

Promise.resolve().then(() => {
  console.log('Auth check passed');
});

Promise.resolve().then(() => {
  console.log('Data fetched');
  console.log('Response sent');
});

console.log('Handler returned');`,
  },
];

export const jsExecutionSamples = [
  {
    title: "Hoisting & Temporal Dead Zone",
    description: "Shows how var is initialized to undefined but let/const stay uninitialized in the TDZ.",
    code: `console.log('Start');
var a = 10;
let b = 20;
const c = 30;

function demo() {
  var d = 40;
  let e = 50;
  console.log('Inside demo', a, b, c, d, e);
}

demo();`
  },
  {
    title: "Closures (Lexical Scope)",
    description: "Visualizes how inner functions maintain a reference to their outer environment.",
    code: `function outer() {
  let count = 0;
  
  return function inner() {
    count++;
    console.log('Count is', count);
  }
}

const myClosure = outer();
myClosure();
myClosure();`
  },
  {
    title: "Async Closures",
    description: "Shows how closures persist even when called asynchronously later via the Event Loop.",
    code: `function setupHandlers() {
  let message = 'Hello from closure!';
  
  setTimeout(function cb1() {
    console.log(message);
    message = 'Message updated!';
  }, 100);
  
  setTimeout(function cb2() {
    console.log(message);
  }, 200);
}

setupHandlers();`
  }
];

