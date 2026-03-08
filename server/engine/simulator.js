const { parseCode } = require('./parser');

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

  // Helper to snapshot current state
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

  function addStep(action, detail, highlight, phase = 'execution') {
    timeline.push({
      step: ++stepId,
      action,
      detail,
      highlight,
      phase,
      state: snapshot(),
    });
  }

  // Phase 1: Push global/main() to call stack
  callStack.push({ name: 'main()', type: 'main' });
  addStep('PUSH_CALL_STACK', 'main()', 'callStack', 'execution');

  // Phase 2: Process all top-level operations (synchronous execution)
  const syncOps = [];
  const asyncRegistrations = [];

  for (const op of operations) {
    if (op.category === 'declaration') {
      // Function declarations are hoisted - just note them
      addStep('FUNCTION_DECLARE', op.name, 'callStack', 'execution');
    } else if (op.category === 'sync') {
      syncOps.push(op);
    } else {
      asyncRegistrations.push(op);
    }
  }

  // Execute sync operations and async registrations in source order
  const allOps = [...operations].filter(op => op.category !== 'declaration');

  for (const op of allOps) {
    switch (op.category) {
      case 'sync':
        handleSyncOp(op);
        break;
      case 'timer':
        handleTimerRegistration(op);
        break;
      case 'microtask':
        handleMicrotaskRegistration(op);
        break;
      case 'webapi':
        handleWebApiRegistration(op);
        break;
      case 'libuv':
        handleLibuvRegistration(op);
        break;
      case 'check':
        handleCheckRegistration(op);
        break;
    }
  }

  // Phase 3: Pop main() from call stack
  callStack.pop();
  addStep('POP_CALL_STACK', 'main()', 'callStack', 'execution');
  addStep('CALL_STACK_EMPTY', 'Call stack is now empty', 'eventLoop', 'execution');

  // Phase 4: Event Loop begins
  const hasAsync = microtaskQueue.length > 0 || macrotaskQueue.length > 0 || webApis.length > 0 || libuvOps.length > 0;
  if (hasAsync) {
    addStep('EVENT_LOOP_START', 'Event Loop begins processing', 'eventLoop', 'eventLoop');
  }

  // ── Drain microtask queue first (always runs before any macrotask phase) ──
  processMicrotaskQueue();

  // ── Timers Phase: complete timers in Web APIs → macrotask queue ──
  const timerApis = webApis.filter(a => a.type === 'timer');
  const nonTimerApis = webApis.filter(a => a.type !== 'timer');

  if (timerApis.length > 0) {
    addStep('EVENT_LOOP_PHASE', 'Timers Phase — checking completed timers', 'webApis', 'eventLoop');

    // Sort by delay (shortest first)
    timerApis.sort((a, b) => (a.delay || 0) - (b.delay || 0));

    for (const api of timerApis) {
      const idx = webApis.findIndex(a => a === api);
      if (idx !== -1) webApis.splice(idx, 1);

      addStep('TIMER_COMPLETE', `${api.name} completed → Macrotask Queue`, 'webApis', 'eventLoop');
      macrotaskQueue.push({ name: api.callback || api.name, type: 'timer', callbackBody: api.callbackBody || '' });
      addStep('QUEUE_MACROTASK', `${api.callback || api.name} → Macrotask Queue`, 'macrotaskQueue', 'eventLoop');
    }

    // Process timer macrotasks now (Timers phase)
    addStep('EVENT_LOOP_PHASE', 'Processing Timer callbacks', 'macrotaskQueue', 'eventLoop');
    processCurrentMacrotasks();
  }

  // ── Drain microtasks again after timers ──
  processMicrotaskQueue();

  // ── Poll / I/O Phase: libuv operations complete → their callbacks run ──
  if (libuvOps.length > 0) {
    addStep('EVENT_LOOP_PHASE', 'Poll Phase — I/O callbacks from Libuv', 'libuv', 'eventLoop');

    while (libuvOps.length > 0) {
      const op = libuvOps.shift();
      addStep('LIBUV_COMPLETE', `${op.name} completed (Thread ${op.thread})`, 'libuv', 'eventLoop');

      // The I/O callback goes to the macrotask queue
      if (op.callbackBody || op.callback) {
        macrotaskQueue.push({
          name: op.callback || op.name + ' callback',
          type: 'io',
          callbackBody: op.callbackBody || '',
        });
        addStep('QUEUE_MACROTASK', `${op.callback || op.name} callback → Macrotask Queue`, 'macrotaskQueue', 'eventLoop');
      }
    }

    // Process I/O macrotasks
    processCurrentMacrotasks();
  }

  // ── Drain microtasks again after I/O ──
  processMicrotaskQueue();

  // ── Check Phase: setImmediate callbacks (already queued) ──
  if (macrotaskQueue.length > 0) {
    addStep('EVENT_LOOP_PHASE', 'Check Phase — remaining callbacks', 'macrotaskQueue', 'eventLoop');
    processCurrentMacrotasks();
  }

  // ── Process any remaining non-timer web APIs ──
  if (nonTimerApis.length > 0) {
    addStep('EVENT_LOOP_PHASE', 'Web APIs completing...', 'webApis', 'eventLoop');
    for (const api of nonTimerApis) {
      const idx = webApis.findIndex(a => a === api);
      if (idx !== -1) webApis.splice(idx, 1);
      addStep('API_COMPLETE', `${api.name} completed`, 'webApis', 'eventLoop');
    }
  }

  // Final step
  addStep('EXECUTION_COMPLETE', 'All tasks completed', 'eventLoop', 'complete');

  return timeline;

  // --- Handler functions ---

  function handleSyncOp(op) {
    if (op.type === 'CONSOLE') {
      callStack.push({ name: op.name, type: 'console' });
      addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution');

      consoleOutputs.push(op.output);
      addStep('LOG_OUTPUT', op.output, 'console', 'execution');

      callStack.pop();
      addStep('POP_CALL_STACK', op.name, 'callStack', 'execution');
    } else if (op.type === 'FUNCTION_CALL') {
      callStack.push({ name: op.name, type: 'function' });
      addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution');
      callStack.pop();
      addStep('POP_CALL_STACK', op.name, 'callStack', 'execution');
    } else if (op.type === 'PROMISE_STATIC') {
      callStack.push({ name: op.name, type: 'promise' });
      addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution');
      callStack.pop();
      addStep('POP_CALL_STACK', op.name, 'callStack', 'execution');
    } else if (op.type === 'VARIABLE_DECLARATION') {
      addStep('VARIABLE_ASSIGN', op.name, 'callStack', 'execution');
    }
  }

  function handleTimerRegistration(op) {
    callStack.push({ name: op.name, type: 'timer' });
    addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution');

    const apiEntry = { name: op.name, type: 'timer', delay: op.delay, callback: op.callback, callbackBody: op.callbackBody || '' };
    webApis.push(apiEntry);
    addStep('REGISTER_WEB_API', `${op.name} → Web APIs (${op.delay}ms)`, 'webApis', 'execution');

    callStack.pop();
    addStep('POP_CALL_STACK', op.name, 'callStack', 'execution');
  }

  function handleMicrotaskRegistration(op) {
    callStack.push({ name: op.name, type: 'microtask' });
    addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution');

    microtaskQueue.push({ name: op.callback || op.name, type: op.type, callbackBody: op.callbackBody || '' });
    addStep('QUEUE_MICROTASK', `${op.name} → Microtask Queue`, 'microtaskQueue', 'execution');

    callStack.pop();
    addStep('POP_CALL_STACK', op.name, 'callStack', 'execution');
  }

  function handleWebApiRegistration(op) {
    callStack.push({ name: op.name, type: 'webapi' });
    addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution');

    webApis.push({ name: op.name, type: 'webapi' });
    addStep('REGISTER_WEB_API', `${op.name} → Web APIs`, 'webApis', 'execution');

    callStack.pop();
    addStep('POP_CALL_STACK', op.name, 'callStack', 'execution');
  }

  function handleLibuvRegistration(op) {
    callStack.push({ name: op.name, type: 'libuv' });
    addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution');

    libuvOps.push({
      name: op.name, type: op.type, thread: libuvOps.length % 4,
      callback: op.callback || null,
      callbackBody: op.callbackBody || '',
    });
    addStep('LIBUV_OPERATION', `${op.name} → Libuv Thread Pool (Thread ${(libuvOps.length - 1) % 4})`, 'libuv', 'execution');

    callStack.pop();
    addStep('POP_CALL_STACK', op.name, 'callStack', 'execution');
  }

  function handleCheckRegistration(op) {
    callStack.push({ name: op.name, type: 'check' });
    addStep('PUSH_CALL_STACK', op.name, 'callStack', 'execution');

    macrotaskQueue.push({ name: op.callback || op.name, type: 'setImmediate', callbackBody: op.callbackBody || '' });
    addStep('QUEUE_MACROTASK', `${op.name} → Macrotask Queue (check phase)`, 'macrotaskQueue', 'execution');

    callStack.pop();
    addStep('POP_CALL_STACK', op.name, 'callStack', 'execution');
  }

  function processMicrotaskQueue() {
    if (microtaskQueue.length === 0) return;

    addStep('EVENT_LOOP_PHASE', 'Processing Microtask Queue', 'microtaskQueue', 'eventLoop');

    while (microtaskQueue.length > 0) {
      const task = microtaskQueue.shift();
      addStep('DEQUEUE_MICROTASK', `${task.name} → Call Stack`, 'microtaskQueue', 'eventLoop');

      callStack.push({ name: task.name, type: 'microtask' });
      addStep('PUSH_CALL_STACK', task.name, 'callStack', 'eventLoop');

      // Execute console.log inside callback body
      executeCallbackConsoleLogs(task.callbackBody);

      callStack.pop();
      addStep('POP_CALL_STACK', task.name, 'callStack', 'eventLoop');
    }
  }

  /**
   * Process all currently-queued macrotasks (drains the queue at this point in time).
   * After each macrotask, microtasks are drained.
   */
  function processCurrentMacrotasks() {
    while (macrotaskQueue.length > 0) {
      const task = macrotaskQueue.shift();
      addStep('DEQUEUE_MACROTASK', `${task.name} → Call Stack`, 'macrotaskQueue', 'eventLoop');

      callStack.push({ name: task.name, type: 'macrotask' });
      addStep('PUSH_CALL_STACK', task.name, 'callStack', 'eventLoop');

      // Execute console.log inside callback body
      executeCallbackConsoleLogs(task.callbackBody);

      callStack.pop();
      addStep('POP_CALL_STACK', task.name, 'callStack', 'eventLoop');

      // After each macrotask, drain microtasks
      if (microtaskQueue.length > 0) {
        processMicrotaskQueue();
      }
    }
  }

  /**
   * Find all console.log(...) calls inside a callback body string and generate log steps.
   */
  function executeCallbackConsoleLogs(body) {
    if (!body) return;
    // Match all console.log calls with string arguments
    const regex = /console\.log\(\s*['\"`](.+?)['\"`]\s*\)/g;
    let match;
    while ((match = regex.exec(body)) !== null) {
      const loggedValue = match[1];
      callStack.push({ name: `console.log('${loggedValue}')`, type: 'console' });
      addStep('PUSH_CALL_STACK', `console.log('${loggedValue}')`, 'callStack', 'eventLoop');
      consoleOutputs.push(loggedValue);
      addStep('LOG_OUTPUT', loggedValue, 'console', 'eventLoop');
      callStack.pop();
      addStep('POP_CALL_STACK', `console.log('${loggedValue}')`, 'callStack', 'eventLoop');
    }
  }
}

/**
 * Generate a timeline for multiple concurrent requests
 */
function generateMultiRequestTimeline(code, numRequests) {
  const { operations } = parseCode(code);
  const timeline = [];
  let stepId = 0;

  function addStep(action, detail, highlight, phase, requestId) {
    timeline.push({
      step: ++stepId,
      action, detail, highlight, phase,
      requestId: requestId || null,
      state: {
        callStack: [],
        microtaskQueue: [],
        macrotaskQueue: [],
        webApis: [],
        libuvOps: [],
        consoleOutputs: [],
        activeRequests: [],
      },
    });
  }

  // Event loop initialization
  addStep('EVENT_LOOP_START', 'Node.js server started, listening for connections', 'eventLoop', 'server');
  addStep('LIBUV_OPERATION', 'Libuv polling for new connections', 'libuv', 'server');

  const threadPool = [false, false, false, false]; // 4 libuv threads

  // Simulate incoming requests
  for (let i = 1; i <= numRequests; i++) {
    addStep('INCOMING_REQUEST', `Request #${i} received`, 'eventLoop', 'request', i);
    addStep('PUSH_CALL_STACK', `requestHandler(req${i}, res${i})`, 'callStack', 'request', i);

    // Find available thread
    const threadIdx = threadPool.findIndex(t => !t);
    if (threadIdx !== -1) {
      threadPool[threadIdx] = true;
      addStep('LIBUV_OPERATION', `Request #${i} → Thread ${threadIdx} (I/O processing)`, 'libuv', 'request', i);
    } else {
      addStep('QUEUE_MACROTASK', `Request #${i} queued (all threads busy)`, 'macrotaskQueue', 'request', i);
    }

    addStep('POP_CALL_STACK', `requestHandler(req${i}, res${i}) - non-blocking`, 'callStack', 'request', i);
    addStep('EVENT_LOOP_TICK', `Event Loop ready for next request`, 'eventLoop', 'request', i);
  }

  // Process completions
  for (let i = 1; i <= Math.min(numRequests, 4); i++) {
    addStep('LIBUV_COMPLETE', `Request #${i} I/O completed on Thread ${i - 1}`, 'libuv', 'response', i);
    addStep('QUEUE_MACROTASK', `Request #${i} callback → Macrotask Queue`, 'macrotaskQueue', 'response', i);
    threadPool[i - 1] = false;
  }

  // Event loop processes callbacks
  for (let i = 1; i <= numRequests; i++) {
    addStep('DEQUEUE_MACROTASK', `Request #${i} callback dequeued`, 'macrotaskQueue', 'response', i);
    addStep('PUSH_CALL_STACK', `sendResponse(res${i})`, 'callStack', 'response', i);
    addStep('LOG_OUTPUT', `Response sent for Request #${i}`, 'console', 'response', i);
    addStep('POP_CALL_STACK', `sendResponse(res${i})`, 'callStack', 'response', i);
  }

  addStep('EXECUTION_COMPLETE', 'All requests processed', 'eventLoop', 'complete');

  return timeline;
}

module.exports = { generateTimeline, generateMultiRequestTimeline };
