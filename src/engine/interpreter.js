import * as acorn from 'acorn';

/**
 * Environment class represents a Lexical Environment (Scope) in JavaScript.
 * It stores variables, functions, and a reference to its outer environment (for closures).
 */
class Environment {
  constructor(name, type, outer = null) {
    this.name = name; // e.g., "Global", "funcName()"
    this.type = type; // "global", "function", "block"
    this.outer = outer; // Reference to parent Environment
    this.record = new Map(); // Variable bindings: name -> { type: 'var'|'let'|'const'|'function', value: any }
  }

  // Define a variable in the current environment
  define(name, varType, value) {
    this.record.set(name, { type: varType, value });
  }

  // Update an existing variable (looks up the scope chain)
  assign(name, value) {
    let env = this;
    while (env) {
      if (env.record.has(name)) {
        const binding = env.record.get(name);
        if (binding.type === 'const' && binding.value !== '<uninitialized>') {
          throw new Error(`TypeError: Assignment to constant variable '${name}'`);
        }
        if (binding.value === '<uninitialized>') {
          // It was uninitialized (TDZ), now it's initialized
        }
        binding.value = value;
        return true;
      }
      env = env.outer;
    }
    // If we reach here in non-strict mode, it would be a global. Let's just create it in global for simplicity.
    // In strict mode it would be a ReferenceError. We will treat it as a global var.
    this.getGlobal().define(name, 'var', value);
    return true;
  }

  // Lookup a variable's value
  lookup(name) {
    let env = this;
    while (env) {
      if (env.record.has(name)) {
        const binding = env.record.get(name);
        if (binding.value === '<uninitialized>') {
          throw new ReferenceError(`Cannot access '${name}' before initialization`);
        }
        return binding.value;
      }
      env = env.outer;
    }
    // Specific handlers for built-ins in our mini-interpreter
    if (name === 'console' || name === 'setTimeout' || name === 'Promise' || name === 'fs') {
      return `[Built-in ${name}]`;
    }
    throw new ReferenceError(`${name} is not defined`);
  }

  getGlobal() {
    let env = this;
    while (env.outer) {
      env = env.outer;
    }
    return env;
  }

  // Serialize the environment chain for the timeline snapshot
  serialize(includeOuter = true) {
    const memory = {};
    for (const [key, b] of this.record.entries()) {
      let displayValue = b.value;
      if (b.type === 'function') {
        displayValue = `ƒ ${key}()`;
      } else if (typeof b.value === 'object' && b.value !== null) {
        if (b.value.__isFunction) {
           displayValue = `ƒ ${b.value.name || 'anonymous'}()`;
        } else if (b.value.__isPromise) {
           displayValue = `Promise {<${b.value.state}>}`;
        }
      } else if (typeof b.value === 'string' && b.value.startsWith('[Built-in')) {
        // Hide built-ins from memory view to reduce noise
        continue;
      }

      memory[key] = {
        type: b.type,
        value: displayValue
      };
    }

    const state = {
      name: this.name,
      type: this.type,
      memory
    };

    if (includeOuter && this.outer) {
      state.closure = this.outer.serialize(true);
    }
    return state;
  }
}

/**
 * The AST Interpreter that generates the visualization timeline.
 */
class Interpreter {
  constructor(code, callbacks = {}) {
    this.code = code;
    this.ast = acorn.parse(code, { ecmaVersion: 2022, locations: true });
    
    // Configs
    this.callbacks = callbacks;
    
    // State
    this.globalEnv = new Environment('Global', 'global');
    this.currentEnv = this.globalEnv;
    
    this.callStack = [];
    this.microtaskQueue = [];
    this.macrotaskQueue = [];
    this.webApis = [];
    this.libuvOps = [];
    this.consoleOutputs = [];
    
    this.timeline = [];
    this.stepId = 0;
    
    // Map of declared functions so we can execute them
    this.functions = new Map(); 
  }

  snapshot() {
    // Collect active execution contexts (we show the top of the stack's environment, plus global)
    // The visualizer might want to see the whole environment chain of the active context.
    const activeContexts = [];
    let env = this.currentEnv;
    while (env) {
      activeContexts.push(env.serialize(false)); // Don't deeply nest closures, just push them flat-ish
      env = env.outer;
    }

    return {
      callStack: [...this.callStack],
      microtaskQueue: [...this.microtaskQueue],
      macrotaskQueue: [...this.macrotaskQueue],
      webApis: [...this.webApis],
      libuvOps: [...this.libuvOps],
      consoleOutputs: [...this.consoleOutputs],
      executionContexts: activeContexts, // New field for visualizing memory!
    };
  }

  addStep(action, detail, highlight, phase, line = null) {
    this.timeline.push({
      step: ++this.stepId,
      action,
      detail,
      highlight,
      phase,
      line,
      state: this.snapshot(),
    });
  }

  run() {
    try {
      // 1. Creation Phase (Global)
      this.callStack.push({ name: 'main()', type: 'main' });
      this.addStep('PUSH_CALL_STACK', 'main()', 'callStack', 'execution', 1);
      
      this.addStep('MEMORY_CREATION', 'Global Execution Context (Creation Phase)', 'memory', 'execution', 1);
      this.creationPhase(this.ast.body, this.globalEnv);

      // 2. Execution Phase (Global)
      this.addStep('CODE_EXECUTION', 'Global Execution Context (Execution Phase)', 'memory', 'execution', 1);
      this.executeBlock(this.ast.body);

      this.callStack.pop();
      this.addStep('POP_CALL_STACK', 'main()', 'callStack', 'execution');
      
      // Clear global env from active visualization pool when main pops
      this.currentEnv = null;
      this.addStep('CALL_STACK_EMPTY', 'Call stack is empty', 'eventLoop', 'execution');

      // 3. Event Loop Phase
      this.runEventLoop();

      // Ensure completely clear for the final step
      this.currentEnv = null; 
      this.addStep('EXECUTION_COMPLETE', 'All tasks completed', 'eventLoop', 'complete');
    } catch (err) {
      if (!err._logged) {
        this.addStep('ERROR', `Runtime Error: ${err.message}`, 'console', 'execution');
        this.consoleOutputs.push(`❌ ${err.message}`);
      }
    }
    return this.timeline;
  }

  // --- 1. Memory Creation Phase --- //
  
  creationPhase(statements, env) {
    // Hoist variables and functions
    for (const node of statements) {
      if (node.type === 'FunctionDeclaration') {
        const name = node.id.name;
        // Functions are fully hoisted
        const fnObj = { __isFunction: true, name, node, closure: env };
        env.define(name, 'function', fnObj);
        this.addStep('HOIST_FUNCTION', `Hoisted function: ${name}`, 'memory', 'execution', node.loc.start.line);
      } else if (node.type === 'VariableDeclaration') {
        const isVar = node.kind === 'var';
        for (const decl of node.declarations) {
          if (decl.id.type === 'Identifier') {
            const name = decl.id.name;
            // vars are hoisted with 'undefined', let/const with '<uninitialized>'
            const initialValue = isVar ? undefined : '<uninitialized>';
            env.define(name, node.kind, initialValue);
            this.addStep('HOIST_VARIABLE', `Hoisted ${node.kind}: ${name} = ${initialValue}`, 'memory', 'execution', node.loc.start.line);
          }
        }
      }
    }
  }

  // --- 2. Execution Phase --- //

  executeBlock(statements) {
    for (const node of statements) {
      try {
        this.evaluate(node);
      } catch (e) {
        if (!e._logged) {
          this.addStep('ERROR', `Runtime Error: ${e.message}`, 'console', 'execution', node.loc ? node.loc.start.line : null);
          this.consoleOutputs.push(`❌ ${e.message}`);
          e._logged = true;
        }
        throw e;
      }
    }
  }

  evaluate(node) {
    if (!node) return undefined;

    switch (node.type) {
      case 'ExpressionStatement':
        return this.evaluate(node.expression);
        
      case 'VariableDeclaration':
        for (const decl of node.declarations) {
          if (decl.init) {
            const val = this.evaluate(decl.init);
            const name = decl.id.name;
            this.currentEnv.assign(name, val);
            this.addStep('VARIABLE_ASSIGN', `${name} = ${this.formatValue(val)}`, 'memory', 'execution', node.loc.start.line);
          } else {
             // Let variables default to undefined if no init
             if (node.kind === 'let' || node.kind === 'var') {
                this.currentEnv.assign(decl.id.name, undefined);
             }
          }
        }
        return undefined;

      case 'AssignmentExpression': {
        if (node.left.type === 'Identifier') {
          const val = this.evaluate(node.right);
          this.currentEnv.assign(node.left.name, val);
          this.addStep('VARIABLE_ASSIGN', `${node.left.name} = ${this.formatValue(val)}`, 'memory', 'execution', node.loc.start.line);
          return val;
        }
        // Simplified: ignoring member assignments for now
        return undefined;
      }

      case 'Literal':
        return node.value;

      case 'Identifier':
        return this.currentEnv.lookup(node.name);

      case 'BinaryExpression': {
        const left = this.evaluate(node.left);
        const right = this.evaluate(node.right);
        switch (node.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': return left / right;
          case '===': return left === right;
          case '==': return left == right;
          case '!==': return left !== right;
          case '!=': return left != right;
          case '>': return left > right;
          case '<': return left < right;
          case '>=': return left >= right;
          case '<=': return left <= right;
          default: return undefined;
        }
      }

      case 'ArrowFunctionExpression':
      case 'FunctionExpression': {
        // Return a function object capturing the current environment
        const name = node.id ? node.id.name : 'anonymous';
        return { __isFunction: true, name, node, closure: this.currentEnv };
      }

      case 'CallExpression': {
        return this.evaluateCall(node);
      }
      
      case 'BlockStatement': {
         // Create a new block environment for let/const
         const blockEnv = new Environment('Block', 'block', this.currentEnv);
         const previousEnv = this.currentEnv;
         this.currentEnv = blockEnv;
         
         this.creationPhase(node.body, blockEnv); // Hoist let/const into block
         this.executeBlock(node.body);
         
         this.currentEnv = previousEnv;
         return undefined;
      }
      
      case 'IfStatement': {
         const test = this.evaluate(node.test);
         if (test) {
            this.evaluate(node.consequent);
         } else if (node.alternate) {
            this.evaluate(node.alternate);
         }
         return undefined;
      }

      default:
        // Skip unsupported nodes
        return undefined;
    }
  }

  evaluateCall(node) {
    const line = node.loc.start.line;
    let calleeName = '';
    
    // Determine callee name and resolve the function
    if (node.callee.type === 'Identifier') {
      calleeName = node.callee.name;
    } else if (node.callee.type === 'MemberExpression') {
      const obj = node.callee.object.name || (node.callee.object.type === 'Identifier' ? node.callee.object.name : 'obj');
      const prop = node.callee.property.name || (node.callee.property.type === 'Identifier' ? node.callee.property.name : 'prop');
      calleeName = `${obj}.${prop}`;
    }

    // Evaluate arguments
    const args = node.arguments.map(arg => this.evaluate(arg));
    const argsString = args.map(a => this.formatValue(a)).join(', ');
    const callLabel = `${calleeName}(${argsString})`;

    // --- Built-in APIs ---

    if (calleeName === 'console.log') {
      this.callStack.push({ name: callLabel, type: 'console', line });
      this.addStep('PUSH_CALL_STACK', callLabel, 'callStack', 'execution', line);
      
      // We join them as space separated string like real console.log
      const output = args.map(a => this.formatValue(a, false)).join(' ');
      this.consoleOutputs.push(output);
      this.addStep('LOG_OUTPUT', output, 'console', 'execution', line);
      
      this.callStack.pop();
      this.addStep('POP_CALL_STACK', callLabel, 'callStack', 'execution', line);
      return undefined;
    }

    if (calleeName === 'setTimeout') {
      this.callStack.push({ name: callLabel, type: 'timer', line });
      this.addStep('PUSH_CALL_STACK', callLabel, 'callStack', 'execution', line);
      
      const cb = args[0];
      const delay = args[1] || 0;
      const cbStr = cb && cb.name ? cb.name : 'anonymous callback';
      
      this.webApis.push({ name: callLabel, type: 'timer', delay, callbackObj: cb, line });
      this.addStep('REGISTER_WEB_API', `${callLabel} (${delay}ms)`, 'webApis', 'execution', line);
      
      this.callStack.pop();
      this.addStep('POP_CALL_STACK', callLabel, 'callStack', 'execution', line);
      return undefined;
    }

    if (calleeName === 'Promise.resolve') {
      this.callStack.push({ name: callLabel, type: 'promise', line });
      this.addStep('PUSH_CALL_STACK', callLabel, 'callStack', 'execution', line);
      
      this.callStack.pop();
      this.addStep('POP_CALL_STACK', callLabel, 'callStack', 'execution', line);
      
      return {
         __isPromise: true, state: 'resolved', value: args[0],
         then(cb) {
            // Simplified chaining
         }
      };
    }
    
    // .then() handler (very simplified)
    if (node.callee.type === 'MemberExpression' && node.callee.property.name === 'then') {
       const promiseObj = this.evaluate(node.callee.object);
       const cb = args[0];
       
       this.callStack.push({ name: callLabel, type: 'microtask', line });
       this.addStep('PUSH_CALL_STACK', callLabel, 'callStack', 'execution', line);
       
       // Queue microtask
       this.microtaskQueue.push({ name: cb.name || 'promise callback', callbackObj: cb, line });
       this.addStep('QUEUE_MICROTASK', `${cb.name || 'promise callback'} -> Microtask Queue`, 'microtaskQueue', 'execution', line);
       
       this.callStack.pop();
       this.addStep('POP_CALL_STACK', callLabel, 'callStack', 'execution', line);
       return promiseObj; // return promise to allow chaining
    }

    // --- User-defined Function Execution ---
    let fnObj;
    try {
      if (node.callee.type === 'Identifier') {
         fnObj = this.currentEnv.lookup(node.callee.name);
      } else if (node.callee.type === 'ArrowFunctionExpression' || node.callee.type === 'FunctionExpression') {
         fnObj = this.evaluate(node.callee);
      }
    } catch(e) { /* might be a built-in not mocked */ }

    if (fnObj && fnObj.__isFunction) {
      this.executeFunction(fnObj, args, callLabel, line);
      // For now, assume it returns undefined (we can add a 'return' interceptor later if fully needed)
      return undefined;
    } else {
       // Mock unrecognised functions
       this.callStack.push({ name: callLabel, type: 'function', line });
       this.addStep('PUSH_CALL_STACK', callLabel, 'callStack', 'execution', line);
       this.callStack.pop();
       this.addStep('POP_CALL_STACK', callLabel, 'callStack', 'execution', line);
    }
    return undefined;
  }

  executeFunction(fnObj, args, callLabel, line) {
    // 1. Setup Execution Context
    this.callStack.push({ name: callLabel, type: 'function', line });
    this.addStep('PUSH_CALL_STACK', callLabel, 'callStack', 'execution', line);

    // Create a new Environment. ITS OUTER IS fnObj.closure! (This is how Closures work!)
    const funcEnv = new Environment(`${fnObj.name} Context`, 'function', fnObj.closure);
    
    // Map arguments
    const params = fnObj.node.params || [];
    params.forEach((param, i) => {
       if (param.type === 'Identifier') {
          funcEnv.define(param.name, 'var', args[i] !== undefined ? args[i] : undefined);
       }
    });
    
    // Switch to new environment
    const previousEnv = this.currentEnv;
    this.currentEnv = funcEnv;
    
    // 2. Creation Phase for Function (hoist vars/inner functions)
    this.addStep('MEMORY_CREATION', `Creation Phase for ${fnObj.name}`, 'memory', 'execution', fnObj.node.loc.start.line);
    
    const bodyNodes = fnObj.node.body.type === 'BlockStatement' ? fnObj.node.body.body : [fnObj.node.body];
    this.creationPhase(bodyNodes, funcEnv);

    // 3. Execution Phase
    this.addStep('CODE_EXECUTION', `Executing ${fnObj.name}`, 'memory', 'execution', fnObj.node.loc.start.line);
    
    // Check for explicit return statement inside the block
    let returnVal = undefined;
    for (const stmt of bodyNodes) {
       try {
          if (stmt.type === 'ReturnStatement') {
             returnVal = this.evaluate(stmt.argument);
             break; // Stop execution on return
          } else {
             this.evaluate(stmt);
          }
       } catch(e) {
          if (!e._logged) {
             this.addStep('ERROR', `Runtime Error: ${e.message}`, 'console', 'execution', stmt.loc ? stmt.loc.start.line : line);
             this.consoleOutputs.push(`❌ ${e.message}`);
             e._logged = true;
          }
          throw e;
       }
    }

    // 4. Teardown
    this.currentEnv = previousEnv; // Restore previous scope
    this.callStack.pop();
    this.addStep('POP_CALL_STACK', callLabel, 'callStack', 'execution', line);
    
    return returnVal;
  }


  // --- 3. Event Loop --- //
  // Very simplistic event loop identical to what the visualizer expects visually
  runEventLoop() {
    const hasWork = () => this.microtaskQueue.length > 0 || this.macrotaskQueue.length > 0 || this.webApis.length > 0;
    
    if (hasWork()) {
       this.addStep('EVENT_LOOP_START', 'Event Loop begins', 'eventLoop', 'eventLoop');
    }

    let iterations = 0;
    while (hasWork() && iterations++ < 50) { // arbitrary limit to prevent infinite loops in bad user code
      // 1. Drain microtasks
      if (this.microtaskQueue.length > 0) {
        this.addStep('EVENT_LOOP_PHASE', `① Microtasks - draining ${this.microtaskQueue.length}`, 'microtaskQueue', 'eventLoop');
        while (this.microtaskQueue.length > 0) {
           const task = this.microtaskQueue.shift();
           this.addStep('DEQUEUE_MICROTASK', `${task.name} -> Call Stack`, 'microtaskQueue', 'eventLoop', task.line);
           if (task.callbackObj && task.callbackObj.__isFunction) {
              this.currentEnv = this.globalEnv; // Callbacks execute from global stack context
              this.executeFunction(task.callbackObj, [], `${task.name}()`, task.line);
              this.currentEnv = null; // Clear when callstack empties
           }
        }
      }

      // 2. Macrotasks (Timers)
      const timers = this.webApis.filter(a => a.type === 'timer');
      if (timers.length > 0) {
         timers.sort((a,b) => a.delay - b.delay); // simplified sorting
         for (const timer of timers) {
            const idx = this.webApis.indexOf(timer);
            this.webApis.splice(idx, 1);
            
            this.addStep('TIMER_COMPLETE', `${timer.name} expired`, 'webApis', 'eventLoop', timer.line);
            this.macrotaskQueue.push({ 
               name: timer.callbackObj && timer.callbackObj.name ? timer.callbackObj.name : timer.name,
               type: 'timer',
               callbackObj: timer.callbackObj,
               line: timer.line 
            });
            this.addStep('QUEUE_MACROTASK', `${timer.name} callback -> Macrotask Queue`, 'macrotaskQueue', 'eventLoop', timer.line);
         }
      }

      if (this.macrotaskQueue.length > 0) {
         this.addStep('EVENT_LOOP_PHASE', `② Macrotasks - running callbacks`, 'macrotaskQueue', 'eventLoop');
         // Run ONE macrotask per tick
         const task = this.macrotaskQueue.shift();
         this.addStep('DEQUEUE_MACROTASK', `${task.name} -> Call Stack`, 'macrotaskQueue', 'eventLoop', task.line);
         if (task.callbackObj && task.callbackObj.__isFunction) {
             this.currentEnv = this.globalEnv; // Callbacks execute from global stack context
             this.executeFunction(task.callbackObj, [], `${task.name}()`, task.line);
             this.currentEnv = null; // Clear when callstack empties
         }
      }
    }
  }


  // --- Utils --- //
  formatValue(val, withQuotes = true) {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (val === '<uninitialized>') return '<uninitialized>';
    if (typeof val === 'string') return withQuotes ? `'${val}'` : val;
    if (typeof val === 'object') {
       if (val.__isFunction) return `[Function: ${val.name}]`;
       if (val.__isPromise) return `Promise {<${val.state}>}`;
    }
    return String(val);
  }
}

function generateTimeline(code) {
  const interpreter = new Interpreter(code);
  return interpreter.run();
}

export { Interpreter, Environment, generateTimeline };

