import { parseCode } from './parser.js';

/**
 * Generates a step-by-step execution timeline from parsed JavaScript code.
 * Simulates the Node.js event loop behavior.
 */
function generateTimeline(code) {
  const { operations } = parseCode(code);
  const timeline = [];
  let stepId = 0;

  const callStack = [];
  const microtaskQueue = [];
  const macrotaskQueue = [];
  const webApis = [];
  const libuvOps = [];
  const consoleOutputs = [];

  function snapshot() {
    return {
      callStack: [...callStack],
      microtaskQueue: [...microtaskQueue],
      macrotaskQueue: [...macrotaskQueue],
      webApis: [...webApis],
      libuvOps: [...libuvOps],
      consoleOutputs: [...consoleOutputs],
    };
  }

  function addStep(action, detail, highlight, phase, line) {
    if (line === undefined) line = null;
    timeline.push({
      step: ++stepId,
      action,
      detail,
      highlight,
      phase,
      line,
      state: snapshot(),
    });
  }

  // Phase 1: Push global/main() to call stack
  callStack.push({ name: 'main()', type: 'main' });
  addStep('PUSH_CALL_STACK', 'main()', 'callStack', 'execution', 1);

  // Phase 2: Process all top-level operations
  const syncOps = [];
  const asyncRegistrations = [];

  for (const op of operations) {
    if (op.category === 'declaration') {
      addStep('FUNCTION_DECLARE', op.name, 'callStack', 'execution', op.line);
    } else if (op.category === 'sync') {
      syncOps.push(op);
    } else {
      asyncRegistrations.push(op);
    }
  }

  const allOps = operations.filter(op => op.category !== 'declaration');

  for (const op of allOps) {
    switch (op.category) {
      case 'sync': handleSyncOp(op); break;
      case 'timer': handleTimerRegistration(op); break;
      case 'microtask': handleMicrotaskRegistration(op); break;
      case 'webapi': handleWebApiRegistration(op); break;
      case 'libuv': handleLibuvRegistration(op); break;
      case 'check': handleCheckRegistration(op); break;
    }
  }

  // Phase 3: Pop main()
  callStack.pop();
  addStep('POP_CALL_STACK', 'main()', 'callStack', 'execution');
  addStep('CALL_STACK_EMPTY', 'Call stack is now empty', 'eventLoop', 'execution');

  // Phase 4: Event Loop — matches real Node.js libuv implementation
  // Real order: Timers → I/O Poll → Check → Close (with microtask drain between EACH)
  // The loop REPEATS until all queues are empty
  const hasAsync = microtaskQueue.length > 0 || macrotaskQueue.length > 0 || webApis.length > 0 || libuvOps.length > 0;
  if (hasAsync) {
    addStep('EVENT_LOOP_START', 'Event Loop begins — checking phases in order', 'eventLoop', 'eventLoop');

    let loopIteration = 0;
    const MAX_ITERATIONS = 3; // Safety guard

    while (loopIteration < MAX_ITERATIONS) {
      loopIteration++;
      const hadWork = { microtasks: false, timers: false, io: false, check: false, close: false };

      // ===== ① MICROTASKS (drain before every cycle) =====
      if (microtaskQueue.length > 0) {
        addStep('EVENT_LOOP_PHASE', '① Microtasks — found ' + microtaskQueue.length + ' (Promise.then, nextTick). Draining all...', 'microtaskQueue', 'eventLoop');
        processMicrotaskQueue();
        hadWork.microtasks = true;
      } else {
        addStep('EVENT_LOOP_PHASE', '① Microtasks — queue is empty, moving on', 'microtaskQueue', 'eventLoop');
      }

      // ===== ② TIMERS (setTimeout, setInterval) =====
      const timerApis = webApis.filter(a => a.type === 'timer');
      if (timerApis.length > 0) {
        addStep('EVENT_LOOP_PHASE', '② Timers — found ' + timerApis.length + ' expired timer(s)!', 'webApis', 'eventLoop');
        timerApis.sort((a, b) => (a.delay || 0) - (b.delay || 0));
        for (const api of timerApis) {
          const idx = webApis.findIndex(a => a === api);
          if (idx !== -1) webApis.splice(idx, 1);
          addStep('TIMER_COMPLETE', api.name + ' expired → callback ready', 'webApis', 'eventLoop');
          macrotaskQueue.push({ name: api.callback || api.name, type: 'timer', callbackBody: api.callbackBody || '', callbackStartLine: api.callbackStartLine, line: api.callbackStartLine || api.line });
          addStep('QUEUE_MACROTASK', (api.callback || api.name) + ' → Macrotask Queue', 'macrotaskQueue', 'eventLoop');
        }
        addStep('EVENT_LOOP_PHASE', '② Timers — executing timer callbacks now', 'macrotaskQueue', 'eventLoop');
        processCurrentMacrotasks();
        hadWork.timers = true;

        // Drain microtasks after timer callbacks (a callback may have created promises)
        if (microtaskQueue.length > 0) {
          addStep('EVENT_LOOP_PHASE', '① Microtasks — draining ' + microtaskQueue.length + ' created during timers', 'microtaskQueue', 'eventLoop');
          processMicrotaskQueue();
        }
      } else {
        addStep('EVENT_LOOP_PHASE', '② Timers — no expired timers, moving on', 'webApis', 'eventLoop');
      }

      // ===== ③ I/O POLL (fs.readFile, http, db queries) =====
      const currentLibuv = [...libuvOps];
      const nonTimerApis = webApis.filter(a => a.type !== 'timer');
      if (currentLibuv.length > 0 || nonTimerApis.length > 0) {
        const totalIO = currentLibuv.length + nonTimerApis.length;
        addStep('EVENT_LOOP_PHASE', '③ I/O Poll — found ' + totalIO + ' completed I/O operation(s)!', 'libuv', 'eventLoop');
        
        // Process libuv operations
        while (libuvOps.length > 0) {
          const op = libuvOps.shift();
          addStep('LIBUV_COMPLETE', op.name + ' completed (Thread ' + op.thread + ')', 'libuv', 'eventLoop');
          if (op.callbackBody || op.callback) {
            macrotaskQueue.push({
              name: op.callback || op.name + ' callback',
              type: 'io',
              callbackBody: op.callbackBody || '',
              callbackStartLine: op.callbackStartLine,
              line: op.callbackStartLine || op.line,
            });
            addStep('QUEUE_MACROTASK', (op.callback || op.name) + ' callback → Queue', 'macrotaskQueue', 'eventLoop');
          }
        }

        // Process non-timer web APIs
        for (const api of nonTimerApis) {
          const idx = webApis.findIndex(a => a === api);
          if (idx !== -1) webApis.splice(idx, 1);
          addStep('API_COMPLETE', api.name + ' completed', 'webApis', 'eventLoop');
        }

        if (macrotaskQueue.length > 0) {
          addStep('EVENT_LOOP_PHASE', '③ I/O Poll — executing I/O callbacks now', 'macrotaskQueue', 'eventLoop');
          processCurrentMacrotasks();
        }
        hadWork.io = true;

        // Drain microtasks after I/O callbacks
        if (microtaskQueue.length > 0) {
          addStep('EVENT_LOOP_PHASE', '① Microtasks — draining ' + microtaskQueue.length + ' created during I/O', 'microtaskQueue', 'eventLoop');
          processMicrotaskQueue();
        }
      } else {
        addStep('EVENT_LOOP_PHASE', '③ I/O Poll — no completed I/O, moving on', 'libuv', 'eventLoop');
      }

      // ===== ④ CHECK (setImmediate) =====
      if (macrotaskQueue.length > 0) {
        addStep('EVENT_LOOP_PHASE', '④ Check — found ' + macrotaskQueue.length + ' setImmediate callback(s)', 'macrotaskQueue', 'eventLoop');
        processCurrentMacrotasks();
        hadWork.check = true;

        // Drain microtasks after check callbacks
        if (microtaskQueue.length > 0) {
          addStep('EVENT_LOOP_PHASE', '① Microtasks — draining ' + microtaskQueue.length + ' created during check', 'microtaskQueue', 'eventLoop');
          processMicrotaskQueue();
        }
      } else {
        addStep('EVENT_LOOP_PHASE', '④ Check (setImmediate) — nothing here, moving on', 'macrotaskQueue', 'eventLoop');
      }

      // ===== ⑤ CLOSE CALLBACKS =====
      addStep('EVENT_LOOP_PHASE', '⑤ Close — no close callbacks, moving on', 'eventLoop', 'eventLoop');

      // Check if there's any remaining work — if yes, loop again
      const stillHasWork = microtaskQueue.length > 0 || macrotaskQueue.length > 0 || webApis.length > 0 || libuvOps.length > 0;
      if (!stillHasWork) {
        addStep('EVENT_LOOP_PHASE', '✅ All queues empty — Event Loop cycle complete!', 'eventLoop', 'eventLoop');
        break;
      } else {
        addStep('EVENT_LOOP_PHASE', '↩ Still has work — looping back to ① Microtasks', 'eventLoop', 'eventLoop');
      }
    }
  }

  addStep('EXECUTION_COMPLETE', 'All tasks completed', 'eventLoop', 'complete');
  return timeline;

  // --- Handler functions ---

  function handleSyncOp(op) {
    if (op.type === 'CONSOLE') {
      callStack.push({ name: op.name, type: 'console' });
      addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution', op.line);
      consoleOutputs.push(op.output);
      addStep('LOG_OUTPUT', op.output, 'console', 'execution', op.line);
      callStack.pop();
      addStep('POP_CALL_STACK', op.name, 'callStack', 'execution', op.line);
    } else if (op.type === 'FUNCTION_CALL') {
      callStack.push({ name: op.name, type: 'function' });
      addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution', op.line);
      callStack.pop();
      addStep('POP_CALL_STACK', op.name, 'callStack', 'execution', op.line);
    } else if (op.type === 'PROMISE_STATIC') {
      callStack.push({ name: op.name, type: 'promise' });
      addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution', op.line);
      callStack.pop();
      addStep('POP_CALL_STACK', op.name, 'callStack', 'execution', op.line);
    } else if (op.type === 'VARIABLE_DECLARATION') {
      addStep('VARIABLE_ASSIGN', op.name, 'callStack', 'execution', op.line);
    }
  }

  function handleTimerRegistration(op) {
    callStack.push({ name: op.name, type: 'timer' });
    addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution', op.line);
    webApis.push({ name: op.name, type: 'timer', delay: op.delay, callback: op.callback, callbackBody: op.callbackBody || '', callbackStartLine: op.callbackStartLine, line: op.line });
    addStep('REGISTER_WEB_API', op.name + ' -> Web APIs (' + op.delay + 'ms)', 'webApis', 'execution', op.line);
    callStack.pop();
    addStep('POP_CALL_STACK', op.name, 'callStack', 'execution', op.line);
  }

  function handleMicrotaskRegistration(op) {
    callStack.push({ name: op.name, type: 'microtask' });
    addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution', op.line);
    microtaskQueue.push({ name: op.callback || op.name, type: op.type, callbackBody: op.callbackBody || '', callbackStartLine: op.callbackStartLine, line: op.line });
    addStep('QUEUE_MICROTASK', op.name + ' -> Microtask Queue', 'microtaskQueue', 'execution', op.line);
    callStack.pop();
    addStep('POP_CALL_STACK', op.name, 'callStack', 'execution', op.line);
  }

  function handleWebApiRegistration(op) {
    callStack.push({ name: op.name, type: 'webapi' });
    addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution', op.line);
    webApis.push({ name: op.name, type: 'webapi', callbackBody: op.callbackBody || '', callbackStartLine: op.callbackStartLine, line: op.line });
    addStep('REGISTER_WEB_API', op.name + ' -> Web APIs', 'webApis', 'execution', op.line);
    callStack.pop();
    addStep('POP_CALL_STACK', op.name, 'callStack', 'execution', op.line);
  }

  function handleLibuvRegistration(op) {
    callStack.push({ name: op.name, type: 'libuv' });
    addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution', op.line);
    libuvOps.push({
      name: op.name, type: op.type, thread: libuvOps.length % 4,
      callback: op.callback || null,
      callbackBody: op.callbackBody || '',
      callbackStartLine: op.callbackStartLine,
      line: op.line,
    });
    addStep('LIBUV_OPERATION', op.name + ' -> Libuv Thread Pool (Thread ' + ((libuvOps.length - 1) % 4) + ')', 'libuv', 'execution', op.line);
    callStack.pop();
    addStep('POP_CALL_STACK', op.name, 'callStack', 'execution', op.line);
  }

  function handleCheckRegistration(op) {
    callStack.push({ name: op.name, type: 'check' });
    addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution', op.line);
    macrotaskQueue.push({ name: op.callback || op.name, type: 'setImmediate', callbackBody: op.callbackBody || '', callbackStartLine: op.callbackStartLine, line: op.line });
    addStep('QUEUE_MACROTASK', op.name + ' -> Macrotask Queue (check phase)', 'macrotaskQueue', 'execution', op.line);
    callStack.pop();
    addStep('POP_CALL_STACK', op.name, 'callStack', 'execution', op.line);
  }

  function processMicrotaskQueue() {
    if (microtaskQueue.length === 0) return;
    addStep('EVENT_LOOP_PHASE', 'Processing Microtask Queue', 'microtaskQueue', 'eventLoop');
    while (microtaskQueue.length > 0) {
      const task = microtaskQueue.shift();
      const runLine = task.callbackStartLine || task.line;
      addStep('DEQUEUE_MICROTASK', task.name + ' -> Call Stack', 'microtaskQueue', 'eventLoop', runLine);
      callStack.push({ name: task.name, type: 'microtask' });
      addStep('PUSH_CALL_STACK', task.name, 'callStack', 'eventLoop', runLine);
      executeCallbackConsoleLogs(task.callbackBody, runLine);
      callStack.pop();
      addStep('POP_CALL_STACK', task.name, 'callStack', 'eventLoop', runLine);
    }
  }

  function processCurrentMacrotasks() {
    while (macrotaskQueue.length > 0) {
      const task = macrotaskQueue.shift();
      const runLine = task.callbackStartLine || task.line;
      addStep('DEQUEUE_MACROTASK', task.name + ' -> Call Stack', 'macrotaskQueue', 'eventLoop', runLine);
      callStack.push({ name: task.name, type: 'macrotask' });
      addStep('PUSH_CALL_STACK', task.name, 'callStack', 'eventLoop', runLine);
      executeCallbackConsoleLogs(task.callbackBody, runLine);
      callStack.pop();
      addStep('POP_CALL_STACK', task.name, 'callStack', 'eventLoop', runLine);
      if (microtaskQueue.length > 0) {
        processMicrotaskQueue();
      }
    }
  }

  function executeCallbackConsoleLogs(body, baseLine) {
    if (!body) return;
    var re = new RegExp("console\\.log\\(\\s*['\"`](.+?)['\"`]\\s*\\)", "g");
    var m;
    while ((m = re.exec(body)) !== null) {
      var val = m[1];
      var name = "console.log('" + val + "')";
      
      const prefix = body.substring(0, m.index);
      const newlines = (prefix.match(/\n/g) || []).length;
      const actualLine = baseLine ? baseLine + newlines : undefined;
      
      callStack.push({ name: name, type: 'console', line: actualLine });
      addStep('PUSH_CALL_STACK', name, 'callStack', 'eventLoop', actualLine);
      consoleOutputs.push(val);
      addStep('LOG_OUTPUT', val, 'console', 'eventLoop', actualLine);
      callStack.pop();
      addStep('POP_CALL_STACK', name, 'callStack', 'eventLoop', actualLine);
    }
  }
}


// =====================================================================
// MULTI-REQUEST TIMELINE WITH TRUE INTERLEAVING
// =====================================================================

function generateMultiRequestTimeline(code, numRequests) {
  const { operations } = parseCode(code);
  const timeline = [];
  let stepId = 0;

  const callStack = [];
  const microtaskQueue = [];
  const macrotaskQueue = [];
  const webApis = [];
  const libuvOps = [];
  const consoleOutputs = [];

  function snapshot() {
    return {
      callStack: [...callStack],
      microtaskQueue: [...microtaskQueue],
      macrotaskQueue: [...macrotaskQueue],
      webApis: [...webApis],
      libuvOps: [...libuvOps],
      consoleOutputs: [...consoleOutputs],
    };
  }

  function addStep(action, detail, highlight, phase, line, requestId) {
    if (line === undefined) line = null;
    if (requestId === undefined) requestId = null;
    timeline.push({
      step: ++stepId,
      action: action,
      detail: detail,
      highlight: highlight,
      phase: phase,
      line: line,
      requestId: requestId,
      state: snapshot(),
    });
  }

  const allOps = operations.filter(op => op.category !== 'declaration');

  // ---------------------------------------------------------------
  // PHASE 1: Server Start
  // ---------------------------------------------------------------
  addStep('EVENT_LOOP_START',
    'Node.js HTTP server started - single-threaded event loop ready',
    'eventLoop', 'server');
  addStep('LIBUV_OPERATION',
    'Libuv listening for incoming TCP connections on the main thread',
    'libuv', 'server');

  if (numRequests > 1) {
    addStep('INCOMING_REQUEST',
      numRequests + ' concurrent requests arrive at the server simultaneously',
      'eventLoop', 'server');
    addStep('EVENT_LOOP_PHASE',
      'Node.js is single-threaded - it will process requests ONE AT A TIME on the call stack, but async I/O runs in parallel on libuv threads',
      'eventLoop', 'server');
  }

  // ---------------------------------------------------------------
  // PHASE 2: Process each request's SYNCHRONOUS code (interleaved)
  // ---------------------------------------------------------------
  let threadCounter = 0;

  for (let reqId = 1; reqId <= numRequests; reqId++) {
    const reqLabel = 'Req#' + reqId;

    addStep('INCOMING_REQUEST',
      'Request #' + reqId + ' picked up by event loop',
      'eventLoop', 'request', null, reqId);

    callStack.push({ name: 'handler(req' + reqId + ', res' + reqId + ')', type: 'main' });
    addStep('PUSH_CALL_STACK',
      'handler(req' + reqId + ', res' + reqId + ') pushed to Call Stack',
      'callStack', 'request', null, reqId);

    // Execute each operation
    for (const op of allOps) {
      const label = '[' + reqLabel + '] ' + op.name;

      switch (op.category) {
        case 'sync':
          if (op.type === 'CONSOLE') {
            callStack.push({ name: label, type: 'console' });
            addStep('PUSH_CALL_STACK', label, 'callStack', 'request', op.line, reqId);
            consoleOutputs.push('[' + reqLabel + '] ' + op.output);
            addStep('LOG_OUTPUT', '[' + reqLabel + '] ' + op.output, 'console', 'request', op.line, reqId);
            callStack.pop();
            addStep('POP_CALL_STACK', label, 'callStack', 'request', op.line, reqId);
          } else if (op.type === 'FUNCTION_CALL' || op.type === 'PROMISE_STATIC') {
            callStack.push({ name: label, type: op.type === 'FUNCTION_CALL' ? 'function' : 'promise' });
            addStep('PUSH_CALL_STACK', label, 'callStack', 'request', op.line, reqId);
            callStack.pop();
            addStep('POP_CALL_STACK', label, 'callStack', 'request', op.line, reqId);
          } else if (op.type === 'VARIABLE_DECLARATION') {
            addStep('VARIABLE_ASSIGN', label, 'callStack', 'request', op.line, reqId);
          }
          break;

        case 'timer':
          callStack.push({ name: label, type: 'timer' });
          addStep('PUSH_CALL_STACK', label, 'callStack', 'request', op.line, reqId);
          webApis.push({
            name: label, type: 'timer', delay: op.delay,
            callback: op.callback, callbackBody: op.callbackBody || '',
            line: op.line, reqId: reqId
          });
          addStep('REGISTER_WEB_API',
            label + ' -> Web APIs (' + op.delay + 'ms) - runs in BACKGROUND',
            'webApis', 'request', op.line, reqId);
          callStack.pop();
          addStep('POP_CALL_STACK', label, 'callStack', 'request', op.line, reqId);
          break;

        case 'microtask':
          callStack.push({ name: label, type: 'microtask' });
          addStep('PUSH_CALL_STACK', label, 'callStack', 'request', op.line, reqId);
          microtaskQueue.push({
            name: '[' + reqLabel + '] ' + (op.callback || op.name),
            type: op.type, callbackBody: op.callbackBody || '',
            line: op.line, reqId: reqId
          });
          addStep('QUEUE_MICROTASK',
            label + ' -> Microtask Queue',
            'microtaskQueue', 'request', op.line, reqId);
          callStack.pop();
          addStep('POP_CALL_STACK', label, 'callStack', 'request', op.line, reqId);
          break;

        case 'libuv': {
          const threadId = threadCounter % 4;
          callStack.push({ name: label, type: 'libuv' });
          addStep('PUSH_CALL_STACK', label, 'callStack', 'request', op.line, reqId);
          libuvOps.push({
            name: label, type: op.type, thread: threadId,
            callback: op.callback || null, callbackBody: op.callbackBody || '',
            line: op.line, reqId: reqId
          });
          threadCounter++;
          addStep('LIBUV_OPERATION',
            label + ' -> Libuv Thread ' + threadId + ' - I/O runs in PARALLEL while main thread is free',
            'libuv', 'request', op.line, reqId);
          callStack.pop();
          addStep('POP_CALL_STACK', label, 'callStack', 'request', op.line, reqId);
          break;
        }

        case 'check':
          callStack.push({ name: label, type: 'check' });
          addStep('PUSH_CALL_STACK', label, 'callStack', 'request', op.line, reqId);
          macrotaskQueue.push({
            name: '[' + reqLabel + '] ' + (op.callback || op.name),
            type: 'setImmediate', callbackBody: op.callbackBody || '',
            line: op.line, reqId: reqId
          });
          addStep('QUEUE_MACROTASK',
            label + ' -> Macrotask Queue',
            'macrotaskQueue', 'request', op.line, reqId);
          callStack.pop();
          addStep('POP_CALL_STACK', label, 'callStack', 'request', op.line, reqId);
          break;

        case 'webapi':
          callStack.push({ name: label, type: 'webapi' });
          addStep('PUSH_CALL_STACK', label, 'callStack', 'request', op.line, reqId);
          webApis.push({ name: label, type: 'webapi', line: op.line, reqId: reqId });
          addStep('REGISTER_WEB_API',
            label + ' -> Web APIs',
            'webApis', 'request', op.line, reqId);
          callStack.pop();
          addStep('POP_CALL_STACK', label, 'callStack', 'request', op.line, reqId);
          break;
      }
    }

    // Handler returns - call stack is now EMPTY
    callStack.pop();
    addStep('POP_CALL_STACK',
      'handler(req' + reqId + ') returned - call stack is now EMPTY',
      'callStack', 'request', null, reqId);

    // KEY INSIGHT: the call stack is free for the next request
    if (reqId < numRequests) {
      addStep('CALL_STACK_EMPTY',
        'Call Stack is FREE - event loop can pick up Request #' + (reqId + 1) + ' immediately! This is why Node.js handles concurrency despite being single-threaded.',
        'eventLoop', 'request', null, reqId);
    } else {
      addStep('CALL_STACK_EMPTY',
        'All ' + numRequests + ' requests sync code processed. Async I/O is running in parallel on libuv threads. Now waiting for completions...',
        'eventLoop', 'request', null, reqId);
    }
  }

  // ---------------------------------------------------------------
  // PHASE 3: Event Loop processes async completions
  // ---------------------------------------------------------------

  // Drain microtask queue
  if (microtaskQueue.length > 0) {
    addStep('EVENT_LOOP_PHASE',
      'Microtask Queue - draining ' + microtaskQueue.length + ' microtasks before any macrotask phase',
      'microtaskQueue', 'eventLoop');

    while (microtaskQueue.length > 0) {
      const task = microtaskQueue.shift();
      addStep('DEQUEUE_MICROTASK', task.name + ' -> Call Stack', 'microtaskQueue', 'eventLoop', task.line);
      callStack.push({ name: task.name, type: 'microtask' });
      addStep('PUSH_CALL_STACK', task.name, 'callStack', 'eventLoop', task.line);
      execCbLogs(task.callbackBody, task.reqId);
      callStack.pop();
      addStep('POP_CALL_STACK', task.name, 'callStack', 'eventLoop', task.line);
    }
  }

  // Timers Phase
  const timerApis = webApis.filter(a => a.type === 'timer');
  if (timerApis.length > 0) {
    addStep('EVENT_LOOP_PHASE',
      'Timers Phase - ' + timerApis.length + ' timer(s) completed',
      'webApis', 'eventLoop');

    timerApis.sort((a, b) => (a.delay || 0) - (b.delay || 0));
    for (const api of timerApis) {
      const idx = webApis.findIndex(a => a === api);
      if (idx !== -1) webApis.splice(idx, 1);
      addStep('TIMER_COMPLETE',
        api.name + ' timer fired -> callback enters Macrotask Queue',
        'webApis', 'eventLoop', api.line);
      macrotaskQueue.push({
        name: api.callback || api.name, type: 'timer',
        callbackBody: api.callbackBody || '', line: api.line, reqId: api.reqId
      });
      addStep('QUEUE_MACROTASK',
        (api.callback || api.name) + ' -> Macrotask Queue',
        'macrotaskQueue', 'eventLoop', api.line);
    }

    addStep('EVENT_LOOP_PHASE',
      'Processing timer callbacks one at a time - each gets the ENTIRE call stack',
      'macrotaskQueue', 'eventLoop');

    while (macrotaskQueue.length > 0) {
      const task = macrotaskQueue.shift();
      addStep('DEQUEUE_MACROTASK', task.name + ' dequeued -> Call Stack', 'macrotaskQueue', 'eventLoop', task.line);
      callStack.push({ name: task.name, type: 'macrotask' });
      addStep('PUSH_CALL_STACK', task.name, 'callStack', 'eventLoop', task.line);
      execCbLogs(task.callbackBody, task.reqId);
      callStack.pop();
      addStep('POP_CALL_STACK', task.name, 'callStack', 'eventLoop', task.line);
      if (macrotaskQueue.length > 0) {
        addStep('CALL_STACK_EMPTY',
          'Call Stack empty - event loop picks up next callback (' + macrotaskQueue.length + ' remaining)',
          'eventLoop', 'eventLoop');
      }
    }
  }

  // Libuv I/O Completions
  if (libuvOps.length > 0) {
    addStep('EVENT_LOOP_PHASE',
      'Poll Phase - ' + libuvOps.length + ' I/O operation(s) completed on libuv threads',
      'libuv', 'eventLoop');

    const completingOps = [...libuvOps];
    for (const op of completingOps) {
      addStep('LIBUV_COMPLETE',
        op.name + ' finished on Thread ' + op.thread + ' - callback ready',
        'libuv', 'eventLoop', op.line);
    }

    while (libuvOps.length > 0) {
      const op = libuvOps.shift();
      if (op.callbackBody || op.callback) {
        const cbName = op.callback || op.name + ' callback';
        macrotaskQueue.push({
          name: cbName, type: 'io',
          callbackBody: op.callbackBody || '', line: op.line, reqId: op.reqId
        });
        addStep('QUEUE_MACROTASK',
          cbName + ' -> Macrotask Queue (response will be sent here)',
          'macrotaskQueue', 'eventLoop', op.line);
      }
    }

    if (macrotaskQueue.length > 0) {
      addStep('EVENT_LOOP_PHASE',
        'Processing I/O callbacks one at a time - each response uses the single thread',
        'macrotaskQueue', 'eventLoop');

      while (macrotaskQueue.length > 0) {
        const task = macrotaskQueue.shift();
        addStep('DEQUEUE_MACROTASK', task.name + ' dequeued -> Call Stack', 'macrotaskQueue', 'eventLoop', task.line);
        callStack.push({ name: task.name, type: 'macrotask' });
        addStep('PUSH_CALL_STACK', task.name, 'callStack', 'eventLoop', task.line);
        execCbLogs(task.callbackBody, task.reqId);
        callStack.pop();
        addStep('POP_CALL_STACK', task.name, 'callStack', 'eventLoop', task.line);
        if (macrotaskQueue.length > 0) {
          addStep('CALL_STACK_EMPTY',
            'Call Stack empty - event loop picks up next I/O callback (' + macrotaskQueue.length + ' remaining)',
            'eventLoop', 'eventLoop');
        }
      }
    }
  }

  // Remaining macrotasks
  if (macrotaskQueue.length > 0) {
    addStep('EVENT_LOOP_PHASE',
      'Check Phase - ' + macrotaskQueue.length + ' remaining callback(s)',
      'macrotaskQueue', 'eventLoop');

    while (macrotaskQueue.length > 0) {
      const task = macrotaskQueue.shift();
      addStep('DEQUEUE_MACROTASK', task.name + ' -> Call Stack', 'macrotaskQueue', 'eventLoop', task.line);
      callStack.push({ name: task.name, type: 'macrotask' });
      addStep('PUSH_CALL_STACK', task.name, 'callStack', 'eventLoop', task.line);
      execCbLogs(task.callbackBody, task.reqId);
      callStack.pop();
      addStep('POP_CALL_STACK', task.name, 'callStack', 'eventLoop', task.line);
    }
  }

  // Non-timer web APIs cleanup
  const remainingApis = webApis.filter(a => a.type !== 'timer');
  for (const api of remainingApis) {
    const idx = webApis.findIndex(a => a === api);
    if (idx !== -1) webApis.splice(idx, 1);
  }

  // ---------------------------------------------------------------
  // PHASE 4: All done
  // ---------------------------------------------------------------
  addStep('EXECUTION_COMPLETE',
    'All ' + numRequests + ' requests processed! Node.js handled them all on a SINGLE THREAD by interleaving sync code and offloading I/O to libuv thread pool.',
    'eventLoop', 'complete');

  return timeline;

  function execCbLogs(body, reqId) {
    if (!body) return;
    var re = new RegExp("console\\.log\\(\\s*['\"`](.+?)['\"`]\\s*\\)", "g");
    var m;
    while ((m = re.exec(body)) !== null) {
      var val = m[1];
      var lbl = reqId
        ? '[Req#' + reqId + "] console.log('" + val + "')"
        : "console.log('" + val + "')";
      callStack.push({ name: lbl, type: 'console' });
      addStep('PUSH_CALL_STACK', lbl, 'callStack', 'eventLoop');
      consoleOutputs.push(reqId ? '[Req#' + reqId + '] ' + val : val);
      addStep('LOG_OUTPUT', reqId ? '[Req#' + reqId + '] ' + val : val, 'console', 'eventLoop');
      callStack.pop();
      addStep('POP_CALL_STACK', lbl, 'callStack', 'eventLoop');
    }
  }
}

export { generateTimeline, generateMultiRequestTimeline };
