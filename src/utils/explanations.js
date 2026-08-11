/**
 * Maps simulator step actions into plain-English educational explanations.
 * This helps users understand HOW the Node.js event loop works at each step.
 */

const explanations = {
  // ── Call Stack Operations ──
  PUSH_CALL_STACK: (detail) => {
    if (detail.includes('main()')) {
      return '🟢 Node.js starts running your code! The main() function enters the Call Stack. This is where JavaScript runs code, step by step.';
    }
    if (detail.includes('console.log')) {
      return '📝 console.log() is normal, fast code. It goes onto the Call Stack, prints your message, and finishes immediately without waiting.';
    }
    if (detail.includes('setTimeout')) {
      return '⏱️ setTimeout() is called! JavaScript sees it\'s a timer, so it quickly hands it over to the background (Web APIs/Node.js) to count down. The Call Stack moves on instantly!';
    }
    if (detail.includes('Promise')) {
      return '🤝 A Promise is made. The code inside `.then()` will go to the Microtask Queue. Microtasks are VIPs (Very Important Priorities)!';
    }
    if (detail.includes('.then')) {
      return '🔗 The `.then()` callback is ready! It enters the VIP Microtask Queue. It will run before any regular Timers do.';
    }
    if (detail.includes('nextTick')) {
      return '⚡ process.nextTick() is called! This is the highest priority VIP. It jumps ahead of almost everything to run next.';
    }
    if (detail.includes('fs.') || detail.includes('readFile') || detail.includes('writeFile')) {
      return '📂 Node.js needs to read/write a file. Reading files is slow! So, Node.js hands this heavy work to the Libuv background workers so your main code doesn\'t get stuck waiting.';
    }
    if (detail.includes('setImmediate')) {
      return '📌 setImmediate() puts a task in the Check Phase. It will run right after the background I/O workers finish their current tasks.';
    }
    if (detail.includes('handler(')) {
      return '🔵 A user requested your server! The handler function enters the Call Stack. Node.js only serves one request on the Call Stack at a exact moment.';
    }
    if (detail.includes('[Req#')) {
      const match = detail.match(/\[Req#(\d+)\]/);
      const reqNum = match ? match[1] : '?';
      if (detail.includes('console.log')) {
        return `📝 Request #${reqNum} prints to the console. This is super fast and doesn't slow down the server.`;
      }
      if (detail.includes('fs.') || detail.includes('readFile')) {
        return `📂 Request #${reqNum} needs a database or file. Instead of pausing the server, Node.js gives this to a background worker thread. The server is now free to handle other users!`;
      }
      return `⚙️ Request #${reqNum} is running its code.`;
    }
    return '⬆️ A function enters the Call Stack to run.';
  },

  POP_CALL_STACK: (detail) => {
    if (detail.includes('main()')) {
      return '✅ The main code finished! The Call Stack is empty. Now the Event Loop steps in to look for background tasks that have finished.';
    }
    if (detail.includes('handler(') && detail.includes('EMPTY')) {
      return '🏁 The request handler finished its fast code. Heavy tasks were sent to the background. The Call Stack is completely FREE for the next user!';
    }
    if (detail.includes('console.log')) {
      return '⬇️ console.log() finished printing and leaves the Call Stack.';
    }
    return '⬇️ The function finished and leaves the Call Stack.';
  },

  // ── Console ──
  LOG_OUTPUT: (detail) => {
    if (detail.includes('[Req#')) {
      return '🖥️ The server prints a log message.';
    }
    return '🖥️ Text shows up on the screen.';
  },

  // ── Variable & Function Declarations ──
  VARIABLE_ASSIGN: () => '📦 JavaScript creates a variable. This happens instantly.',
  FUNCTION_DECLARE: () => '📋 JavaScript reads a function so it can be used later.',

  // ── Async Registration ──
  REGISTER_WEB_API: (detail) => {
    if (detail.includes('setTimeout') || detail.includes('Timer')) {
      return '⏱️ The countdown started in the background! When the time is up, the task will move to the queue to run.';
    }
    return '🌐 A background task started. The main program just keeps going!';
  },

  QUEUE_MICROTASK: (detail) => {
    if (detail.includes('.then')) {
      return '🔗 A Promise finished! The `.then()` code joins the VIP Microtask Queue. The Event Loop will run this BEFORE any Timers.';
    }
    if (detail.includes('nextTick')) {
      return '⚡ process.nextTick() task joins the VIP Microtask Queue. It will run almost immediately!';
    }
    return '📥 Task joined the VIP Microtask Queue.';
  },

  QUEUE_MACROTASK: (detail) => {
    if (detail.includes('Timer') || detail.includes('setTimeout')) {
      return '📥 The timer finished counting! Its code is moved to the Macrotask Queue, waiting its turn to run on the Call Stack.';
    }
    if (detail.includes('callback') && (detail.includes('response') || detail.includes('Macrotask'))) {
      return '📥 The background worker finished the heavy file/DB task! The response code is put in the queue to be sent to the user.';
    }
    return '📥 Task joined the normal Macrotask Queue.';
  },

  // ── Libuv / I/O ──
  LIBUV_OPERATION: (detail) => {
    if (detail.includes('listening') || detail.includes('TCP')) {
      return '🎧 The server is listening for users. This uses the computer\'s operating system, not a worker thread.';
    }
    if (detail.includes('PARALLEL') || detail.includes('Thread')) {
      const threadMatch = detail.match(/Thread (\d+)/);
      const threadNum = threadMatch ? threadMatch[1] : '?';
      return `🔄 A heavy task (like reading a file) is given to Libuv Worker Thread ${threadNum}. Node.js has 4 default workers. If a 5th heavy task arrives, it will just wait in line until one of these 4 workers is free!`;
    }
    return '🔧 Heavy work was handed to a Libuv background worker. The main JavaScript thread doesn\'t have to wait!';
  },

  LIBUV_COMPLETE: (detail) => {
    const threadMatch = detail.match(/Thread (\d+)/);
    const threadNum = threadMatch ? threadMatch[1] : '?';
    return `✅ Worker Thread ${threadNum} finished its heavy task! The result is sent to the queue so the main code can use it.`;
  },

  // ── Event Loop Phases ──
  EVENT_LOOP_START: (detail) => {
    if (detail.includes('server')) {
      return '🚀 The Event Loop starts spinning! It constantly asks: "Is there any background work that finished?" This loop is the secret to why Node.js is so fast.';
    }
    return '🔄 The Event Loop begins! Since the Call Stack is empty, it starts checking its phases to see if any background tasks are ready to run.';
  },

  EVENT_LOOP_PHASE: (detail) => {
    if (detail.includes('Microtask')) {
      return '🔮 MICROTASK PHASE (VIP): The event loop checks this VIP queue FIRST. All Promises and nextTicks run here. It won\'t move on until this queue is totally empty!';
    }
    if (detail.includes('Timer')) {
      const processingMatch = detail.includes('Processing');
      if (processingMatch) {
        return '⏱️ TIMERS PHASE: Running the timer code now! After every single timer, the event loop quickly checks the VIP Microtask queue just in case.';
      }
      return '⏱️ TIMERS PHASE: The Event Loop checks if any setTimeout/setInterval timers have finished counting down.';
    }
    if (detail.includes('Poll') || detail.includes('I/O')) {
      const processingMatch = detail.includes('Processing');
      if (processingMatch) {
        return '📨 I/O POLL PHASE: Running the code for finished files or databases! This is usually where we finally send the response back to the user.';
      }
      return '📨 I/O POLL PHASE: The Event Loop checks if any heavy background workers (files, databases, networks) are finished.';
    }
    if (detail.includes('Check')) {
      return '✔️ CHECK PHASE: setImmediate() tasks run right here. It happens right after checking the I/O Poll phase.';
    }
    if (detail.includes('Web APIs')) {
      return '🌐 The Event Loop checks if any browser background tasks are done.';
    }
    return '🔄 The Event Loop spins to the next phase, checking for finished work. It goes: Timers → I/O → Check → Close.';
  },

  // ── Dequeue Operations ──
  DEQUEUE_MICROTASK: () => '⬆️ A VIP Microtask is moved to the Call Stack to run immediately! It cuts in line before regular Macrotasks.',

  DEQUEUE_MACROTASK: () => '⬆️ A regular Macrotask (like a finished timer or file read) is moved to the Call Stack to run.',

  // ── Timer ──
  TIMER_COMPLETE: () => '⏰ Beep! The timer finished counting down in the background. The code is now ready to run.',

  // ── Server / Request ──
  INCOMING_REQUEST: (detail) => {
    if (detail.includes('picked up')) {
      const match = detail.match(/#(\d+)/);
      const reqNum = match ? match[1] : '?';
      return `📡 Node.js is now serving Request #${reqNum}! It starts running its code on the Call Stack.`;
    }
    if (detail.includes('concurrent')) {
      return '📡 Multiple users are hitting the server at the exact same time! Since Node.js has one main thread, it handles the fast parts of each request super quickly, and throws the slow parts to the background workers.';
    }
    return '📡 A user sent a request to the server!';
  },

  CALL_STACK_EMPTY: (detail) => {
    if (detail.includes('FREE') && detail.includes('Request')) {
      return '💡 MAGIC MOMENT: The Call Stack is EMPTY! Instead of waiting for a file/database to finish, Node.js immediately starts serving the next user request! This is why it handles thousands of users easily.';
    }
    if (detail.includes('All') && detail.includes('sync code')) {
      return '💡 All users were served their fast code! Now, their slow file/database tasks are running in parallel in the background (Libuv).';
    }
    if (detail.includes('picks up next')) {
      return '🔄 Call Stack is empty again. The Event Loop keeps spinning, looking for the next piece of work.';
    }
    return '✅ The Call Stack is empty. Ready for the next task.';
  },

  // ── Completion ──
  EXECUTION_COMPLETE: (detail) => {
    if (detail.includes('requests')) {
      return '🎉 WOW! All requests finished! Node.js did this fast by running the quick code on the main thread, and giving the heavy file reading to background workers.';
    }
    return '🎉 Everything is completely finished! The Call Stack is empty and the Event Loop is asleep.';
  },

  API_COMPLETE: () => '✅ A background task finished.',
  PROMISE_STATIC: () => '🤝 A Promise was created and finished instantly.',
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

