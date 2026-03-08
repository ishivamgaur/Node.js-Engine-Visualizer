/**
 * Maps simulator step actions into plain-English educational explanations.
 * This helps users understand HOW the Node.js event loop works at each step.
 */

const explanations = {
  // ── Call Stack Operations ──
  PUSH_CALL_STACK: (detail) => {
    if (detail.includes('main()')) {
      return '🟢 Node.js starts executing your code. The main() function is added to the Call Stack — this is where JavaScript runs code, one function at a time.';
    }
    if (detail.includes('console.log')) {
      return '📝 console.log() is a synchronous function. It goes onto the Call Stack, executes immediately, prints output, and gets removed. No waiting needed!';
    }
    if (detail.includes('setTimeout')) {
      return '⏱️ setTimeout() is called — but the timer itself does NOT run on the Call Stack! JavaScript registers it and immediately hands it off to the Web APIs (browser) or libuv (Node.js) to handle in the background.';
    }
    if (detail.includes('Promise')) {
      return '🤝 A Promise is being created or resolved. Promise callbacks (.then) go to the Microtask Queue, which has HIGHER priority than setTimeout callbacks.';
    }
    if (detail.includes('.then')) {
      return '🔗 The .then() callback is registered. When the Promise resolves, this callback will be added to the Microtask Queue — which runs BEFORE any setTimeout callbacks.';
    }
    if (detail.includes('nextTick')) {
      return '⚡ process.nextTick() has the HIGHEST priority of all async callbacks. It runs before Promises and before any I/O callbacks. Use it carefully!';
    }
    if (detail.includes('fs.') || detail.includes('readFile') || detail.includes('writeFile')) {
      return '📂 A file system operation is called. Since disk I/O is slow, Node.js hands this off to the libuv thread pool so the Call Stack stays free for other work!';
    }
    if (detail.includes('setImmediate')) {
      return '📌 setImmediate() schedules a callback to run in the Check Phase of the event loop — right after I/O callbacks are processed.';
    }
    if (detail.includes('handler(')) {
      return '🔵 The request handler function is pushed to the Call Stack. JavaScript can only execute ONE function at a time on the Call Stack.';
    }
    if (detail.includes('[Req#')) {
      const match = detail.match(/\[Req#(\d+)\]/);
      const reqNum = match ? match[1] : '?';
      if (detail.includes('console.log')) {
        return `📝 Request #${reqNum}'s console.log runs synchronously on the Call Stack. This is fast — no blocking!`;
      }
      if (detail.includes('fs.') || detail.includes('readFile')) {
        return `📂 Request #${reqNum} calls a file/database operation. This gets offloaded to a libuv thread so the main thread stays FREE for other requests!`;
      }
      return `⚙️ Request #${reqNum}'s code is executing on the Call Stack. Remember: only ONE request's code runs at a time.`;
    }
    return '⬆️ A function is pushed onto the Call Stack. JavaScript executes functions one at a time, top to bottom.';
  },

  POP_CALL_STACK: (detail) => {
    if (detail.includes('main()')) {
      return '✅ main() finished! All synchronous code has been executed. The Call Stack is now empty — time for the Event Loop to check if there are any async callbacks waiting.';
    }
    if (detail.includes('handler(') && detail.includes('EMPTY')) {
      return '🏁 The request handler returned. All its synchronous code ran, and any async operations (DB queries, file reads) were offloaded to background threads. The Call Stack is FREE!';
    }
    if (detail.includes('console.log')) {
      return '⬇️ console.log() finished and is removed from the Call Stack. It was synchronous — in and out, no waiting.';
    }
    return '⬇️ Function finished executing and is removed from the Call Stack. The stack moves on to the next function (if any).';
  },

  // ── Console ──
  LOG_OUTPUT: (detail) => {
    if (detail.includes('[Req#')) {
      return '🖥️ Output is printed to the console. In a real server, this would be a server-side log line.';
    }
    return '🖥️ Text is printed to the console. console.log() is synchronous — it runs immediately when called.';
  },

  // ── Variable & Function Declarations ──
  VARIABLE_ASSIGN: () => '📦 A variable is declared and assigned. This is synchronous — it happens immediately on the Call Stack.',
  FUNCTION_DECLARE: () => '📋 A function is declared (hoisted to the top). It\'s now available to be called but hasn\'t run yet.',

  // ── Async Registration ──
  REGISTER_WEB_API: (detail) => {
    if (detail.includes('setTimeout') || detail.includes('Timer')) {
      return '⏱️ The timer is now running in the background (Web APIs). The Call Stack is free to continue with other code! When the timer expires, the callback will be moved to the Macrotask Queue.';
    }
    return '🌐 An async operation is registered with the Web APIs. It runs in the background while the Call Stack continues with other code.';
  },

  QUEUE_MICROTASK: (detail) => {
    if (detail.includes('.then')) {
      return '🔗 The .then() callback joined the Microtask Queue. Microtasks have HIGHER priority — the event loop will run ALL microtasks before checking any timers or I/O callbacks!';
    }
    if (detail.includes('nextTick')) {
      return '⚡ process.nextTick() callback joins the Microtask Queue. It has the HIGHEST priority and will run before Promise callbacks and definitely before setTimeout.';
    }
    return '📥 Callback added to the Microtask Queue. Microtasks ALWAYS run before macrotasks (setTimeout, I/O).';
  },

  QUEUE_MACROTASK: (detail) => {
    if (detail.includes('Timer') || detail.includes('setTimeout')) {
      return '📥 Timer\'s callback moved to the Macrotask Queue. It will wait here until the event loop picks it up and puts it on the Call Stack to execute.';
    }
    if (detail.includes('callback') && (detail.includes('response') || detail.includes('Macrotask'))) {
      return '📥 I/O callback moved to the Macrotask Queue. The event loop will execute this on the Call Stack, which is where the response (res.send) typically happens.';
    }
    return '📥 Callback added to the Macrotask Queue. The event loop processes one macrotask at a time, then checks for microtasks.';
  },

  // ── Libuv / I/O ──
  LIBUV_OPERATION: (detail) => {
    if (detail.includes('listening') || detail.includes('TCP')) {
      return '🎧 Libuv is listening for incoming connections. This uses the OS kernel (epoll/kqueue/IOCP) and does NOT use a thread pool thread.';
    }
    if (detail.includes('PARALLEL') || detail.includes('Thread')) {
      const threadMatch = detail.match(/Thread (\d+)/);
      const threadNum = threadMatch ? threadMatch[1] : '?';
      return `🔄 This I/O operation runs on libuv Thread ${threadNum}. Node.js has 4 threads in its default thread pool. While this runs in the BACKGROUND, the main JavaScript thread is FREE to handle other requests!`;
    }
    return '🔧 An I/O operation is sent to libuv\'s thread pool. These run in parallel on separate threads while the main event loop stays free.';
  },

  LIBUV_COMPLETE: (detail) => {
    const threadMatch = detail.match(/Thread (\d+)/);
    const threadNum = threadMatch ? threadMatch[1] : '?';
    return `✅ I/O finished on Thread ${threadNum}! The callback is now ready and will be moved to the Macrotask Queue for the event loop to process on the main thread.`;
  },

  // ── Event Loop Phases ──
  EVENT_LOOP_START: (detail) => {
    if (detail.includes('server')) {
      return '🚀 The Node.js event loop is running! It continuously checks: "Is there any work to do?" — callbacks to run, I/O to process, or timers that expired. This is what makes Node.js non-blocking!';
    }
    return '🔄 The Event Loop begins! Since the Call Stack is empty but there are pending async operations, the Event Loop starts checking its phases one by one for callbacks to execute.';
  },

  EVENT_LOOP_PHASE: (detail) => {
    if (detail.includes('Microtask')) {
      return '🔮 MICROTASK PHASE: The event loop checks the Microtask Queue FIRST, before anything else. All Promise callbacks and process.nextTick callbacks run here. The queue must be COMPLETELY drained before moving on.';
    }
    if (detail.includes('Timer')) {
      const processingMatch = detail.includes('Processing');
      if (processingMatch) {
        return '⏱️ TIMERS PHASE: Now executing timer callbacks one at a time. Each callback gets the full Call Stack. After EACH callback, the event loop checks for new microtasks!';
      }
      return '⏱️ TIMERS PHASE: The event loop checks if any setTimeout/setInterval timers have expired. If so, their callbacks are moved to the Macrotask Queue for execution.';
    }
    if (detail.includes('Poll') || detail.includes('I/O')) {
      const processingMatch = detail.includes('Processing');
      if (processingMatch) {
        return '📨 POLL PHASE — PROCESSING I/O CALLBACKS: Each callback runs on the main thread\'s Call Stack one at a time. This is where your response (res.json, res.send) actually gets sent!';
      }
      return '📨 POLL PHASE: The event loop checks for completed I/O operations (file reads, network requests, database queries). This is the busiest phase in most Node.js servers.';
    }
    if (detail.includes('Check')) {
      return '✔️ CHECK PHASE: The event loop runs setImmediate() callbacks here. This phase runs right after the Poll (I/O) phase.';
    }
    if (detail.includes('Web APIs')) {
      return '🌐 The event loop checks if any Web API operations (timers, network) have completed and moves their callbacks to the appropriate queue.';
    }
    return '🔄 The event loop moves to the next phase, checking for work to do. It cycles through: Timers → I/O → Check → Close, repeating until there\'s nothing left.';
  },

  // ── Dequeue Operations ──
  DEQUEUE_MICROTASK: () => '⬆️ A microtask is taken from the Microtask Queue and placed on the Call Stack to execute. Microtasks always run before macrotasks!',

  DEQUEUE_MACROTASK: () => '⬆️ A macrotask (timer/I/O callback) is taken from the Macrotask Queue and placed on the Call Stack to execute. The event loop processes ONE macrotask, then checks for microtasks again.',

  // ── Timer ──
  TIMER_COMPLETE: () => '⏰ Timer expired! The timer was running in the background (Web APIs/libuv) and its wait time is over. The callback is now ready to execute.',

  // ── Server / Request ──
  INCOMING_REQUEST: (detail) => {
    if (detail.includes('picked up')) {
      const match = detail.match(/#(\d+)/);
      const reqNum = match ? match[1] : '?';
      return `📡 Request #${reqNum} is being processed! The event loop picks it up and starts running its handler code on the Call Stack. Only ONE request runs at a time.`;
    }
    if (detail.includes('concurrent')) {
      return '📡 Multiple requests arrive at the same time! But Node.js is single-threaded — it can only process ONE request\'s code at a time on the Call Stack. Let\'s see how it handles this...';
    }
    return '📡 A new request has arrived at the server.';
  },

  CALL_STACK_EMPTY: (detail) => {
    if (detail.includes('FREE') && detail.includes('Request')) {
      return '💡 KEY INSIGHT: The Call Stack is EMPTY! The event loop immediately picks up the next request. This is THE reason Node.js can handle thousands of concurrent requests — it never waits for I/O, it just moves on!';
    }
    if (detail.includes('All') && detail.includes('sync code')) {
      return '💡 All requests\' synchronous code has been processed! The I/O operations are running in PARALLEL on libuv threads. When they complete, the event loop will process their callbacks one by one.';
    }
    if (detail.includes('picks up next')) {
      return '🔄 Call Stack is empty again — the event loop picks up the next callback. This is the "loop" in "event loop" — it keeps checking and processing!';
    }
    return '✅ The Call Stack is empty. The event loop is now free to check for pending callbacks.';
  },

  // ── Completion ──
  EXECUTION_COMPLETE: (detail) => {
    if (detail.includes('requests')) {
      return '🎉 All done! Every request was handled on a SINGLE thread. Node.js achieved concurrency by: 1) Running sync code fast, 2) Offloading I/O to threads, 3) Using the event loop to interleave everything!';
    }
    return '🎉 All code execution is complete! The Call Stack is empty, all queues are drained, and the event loop has no more work to do.';
  },

  API_COMPLETE: () => '✅ The Web API operation completed. Any callback associated with it will be queued for execution.',
  PROMISE_STATIC: () => '🤝 Promise.resolve/reject creates an immediately resolved/rejected promise.',
};

/**
 * Get a plain-English explanation for a timeline step.
 * @param {Object} step - The timeline step object with action, detail, phase
 * @returns {string} Human-readable explanation
 */
export function getExplanation(step) {
  if (!step) return '';
  
  const handler = explanations[step.action];
  if (!handler) return '';
  
  if (typeof handler === 'function') {
    return handler(step.detail || '');
  }
  return handler;
}

export default getExplanation;
