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

export const browserSamples = [
  {
    title: "Basic HTML & CSS",
    description: "A simple card component to visualize basic parsing and painting.",
    code: `<!DOCTYPE html>
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
</html>`
  },
  {
    title: "Interactive JS UI",
    description: "A button that changes background color when clicked.",
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    .button { 
      background: #007bff; 
      color: white; 
      padding: 10px 20px;
    }
    .active {
      background: #28a745;
    }
  </style>
</head>
<body>
  <button class="button">Click Me</button>
  <script>
    document.querySelector('.button').addEventListener('click', () => {
      console.log('Button clicked!');
    });
  </script>
</body>
</html>`
  },
  {
    title: "Interactive Dashboard",
    description: "A complex, fully interactive dashboard with grids, buttons, and animations to test the layout and rendering pipeline.",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    :root {
      --bg: #0f172a;
      --panel: #1e293b;
      --text: #f8fafc;
      --accent: #3b82f6;
      --success: #10b981;
    }
    body {
      margin: 0;
      padding: 20px;
      background-color: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .dashboard {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .sidebar {
      background: var(--panel);
      padding: 20px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .nav-btn {
      background: transparent;
      color: var(--text);
      border: 1px solid transparent;
      padding: 12px;
      border-radius: 8px;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
    }
    .nav-btn:hover {
      background: rgba(255,255,255,0.05);
    }
    .nav-btn.active {
      background: var(--accent);
      border-color: #60a5fa;
    }
    .main-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .stat-card {
      background: var(--panel);
      padding: 24px;
      border-radius: 12px;
      border-top: 4px solid var(--accent);
      transition: transform 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-5px);
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      margin-top: 10px;
    }
    .action-panel {
      background: var(--panel);
      padding: 24px;
      border-radius: 12px;
    }
    .primary-btn {
      background: var(--success);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    }
    .primary-btn:active {
      transform: scale(0.95);
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <!-- Sidebar -->
    <aside class="sidebar">
      <h2>Server Admin</h2>
      <button class="nav-btn active">Overview</button>
      <button class="nav-btn">Analytics</button>
      <button class="nav-btn">Settings</button>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <div class="stats-grid">
        <div class="stat-card" style="border-top-color: #3b82f6">
          <div class="stat-title">Active Users</div>
          <div class="stat-value" id="user-count">1,204</div>
        </div>
        <div class="stat-card" style="border-top-color: #10b981">
          <div class="stat-title">Server Uptime</div>
          <div class="stat-value">99.9%</div>
        </div>
        <div class="stat-card" style="border-top-color: #f59e0b">
          <div class="stat-title">CPU Load</div>
          <div class="stat-value" id="cpu-load">24%</div>
        </div>
      </div>

      <div class="action-panel">
        <h3>Quick Actions</h3>
        <p>Run a heavy calculation to test the browser rendering performance.</p>
        <button class="primary-btn" id="refresh-btn">Run Diagnostics</button>
      </div>
    </main>
  </div>

  <script>
    // Make the sidebar interactive
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        navBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Make the Run Diagnostics button interactive
    const refreshBtn = document.getElementById('refresh-btn');
    const cpuLoad = document.getElementById('cpu-load');
    
    refreshBtn.addEventListener('click', () => {
      refreshBtn.innerText = 'Running...';
      refreshBtn.style.background = '#f59e0b';
      
      let load = 24;
      const interval = setInterval(() => {
        load += Math.floor(Math.random() * 15);
        if(load > 95) load = 95;
        cpuLoad.innerText = load + '%';
        cpuLoad.style.color = load > 80 ? '#ef4444' : '#f8fafc';
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        refreshBtn.innerText = 'Run Diagnostics';
        refreshBtn.style.background = '#10b981';
        cpuLoad.innerText = '24%';
        cpuLoad.style.color = '#f8fafc';
      }, 1500);
    });
  </script>
</body>
</html>`
  }
];

