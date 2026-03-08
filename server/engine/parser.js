const acorn = require('acorn');
const walk = require('acorn-walk');

/**
 * Parse JavaScript code and extract execution-relevant information.
 * Identifies sync calls, async patterns, timers, promises, I/O, etc.
 */
function parseCode(code) {
  let ast;
  try {
    ast = acorn.parse(code, {
      ecmaVersion: 2022,
      sourceType: 'module',
      locations: true,
    });
  } catch (err) {
    throw new Error(`Parse error: ${err.message}`);
  }

  const operations = [];
  let opId = 0;

  // Walk the AST and extract operations
  walk.ancestor(ast, {
    CallExpression(node, ancestors) {
      // Skip nodes nested inside callback functions of async registrations
      if (isInsideAsyncCallback(node, ancestors, code)) return;
      const op = identifyCallExpression(node, ancestors, code, ++opId);
      if (op) operations.push(op);
    },
    VariableDeclaration(node, ancestors) {
      const declarations = node.declarations;
      for (const decl of declarations) {
        if (decl.init && decl.init.type === 'CallExpression') {
          // Already handled by CallExpression walker
        } else if (decl.init) {
          operations.push({
            id: ++opId,
            type: 'VARIABLE_DECLARATION',
            name: decl.id.name || 'variable',
            code: code.slice(node.start, node.end),
            line: node.loc.start.line,
            category: 'sync',
          });
        }
      }
    },
    FunctionDeclaration(node) {
      operations.push({
        id: ++opId,
        type: 'FUNCTION_DECLARATION',
        name: node.id ? node.id.name : 'anonymous',
        code: code.slice(node.start, Math.min(node.start + 60, node.end)) + (node.end - node.start > 60 ? '...' : ''),
        line: node.loc.start.line,
        category: 'declaration',
      });
    },
  });

  // Sort by line number to get execution order
  operations.sort((a, b) => a.line - b.line);

  return { ast, operations };
}

/**
 * Check if a node is nested inside the callback argument of an async call
 * (setTimeout, setInterval, setImmediate, fs.*, Promise.then, process.nextTick, etc.)
 */
function isInsideAsyncCallback(node, ancestors, code) {
  // Known async parent callee names/patterns
  const asyncCallees = [
    'setTimeout', 'setInterval', 'setImmediate', 'queueMicrotask',
  ];

  // Walk ancestors from innermost to outermost
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const ancestor = ancestors[i];
    if (ancestor === node) continue;

    // Check if this ancestor is a CallExpression that is an async registration
    if (ancestor.type === 'CallExpression') {
      const callee = ancestor.callee;
      // Direct name match (setTimeout, setInterval, etc.)
      if (callee.type === 'Identifier' && asyncCallees.includes(callee.name)) {
        // Check that our node is inside the callback argument, not the call itself
        if (isNodeInsideCallbackArg(node, ancestor)) return true;
      }
      // Member expression: fs.readFile, process.nextTick, etc.
      if (callee.type === 'MemberExpression') {
        const objName = callee.object.name || '';
        const propName = callee.property.name || '';
        if (objName === 'fs' || objName === 'http' ||
            (objName === 'process' && propName === 'nextTick') ||
            propName === 'then' || propName === 'catch' || propName === 'finally') {
          if (isNodeInsideCallbackArg(node, ancestor)) return true;
        }
      }
    }
  }
  return false;
}

/**
 * Check if 'node' is positioned inside one of the function-type arguments of 'callExpr'
 */
function isNodeInsideCallbackArg(node, callExpr) {
  for (const arg of callExpr.arguments) {
    if ((arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') &&
        node.start >= arg.start && node.end <= arg.end) {
      return true;
    }
  }
  return false;
}

function identifyCallExpression(node, ancestors, code, id) {
  const callee = node.callee;
  const codeSnippet = code.slice(node.start, Math.min(node.start + 80, node.end));
  const line = node.loc.start.line;

  // console.log, console.warn, console.error
  if (callee.type === 'MemberExpression' &&
      callee.object.name === 'console') {
    const method = callee.property.name;
    const argStr = extractArgs(node.arguments, code);
    return {
      id, type: 'CONSOLE', name: `console.${method}(${argStr})`,
      code: codeSnippet, line, category: 'sync',
      output: argStr,
    };
  }

  // setTimeout
  if (callee.name === 'setTimeout' || 
      (callee.type === 'MemberExpression' && callee.property.name === 'setTimeout')) {
    const delay = node.arguments[1] ? code.slice(node.arguments[1].start, node.arguments[1].end) : '0';
    const callbackName = getCallbackName(node.arguments[0], code);
    return {
      id, type: 'SET_TIMEOUT', name: `setTimeout(${callbackName}, ${delay})`,
      code: codeSnippet, line, category: 'timer',
      delay: parseInt(delay) || 0,
      callback: callbackName,
      callbackBody: node.arguments[0] ? code.slice(node.arguments[0].start, node.arguments[0].end) : '',
    };
  }

  // setInterval
  if (callee.name === 'setInterval') {
    const delay = node.arguments[1] ? code.slice(node.arguments[1].start, node.arguments[1].end) : '0';
    const callbackName = getCallbackName(node.arguments[0], code);
    return {
      id, type: 'SET_INTERVAL', name: `setInterval(${callbackName}, ${delay})`,
      code: codeSnippet, line, category: 'timer',
      delay: parseInt(delay) || 0,
      callback: callbackName,
    };
  }

  // setImmediate
  if (callee.name === 'setImmediate') {
    const callbackName = getCallbackName(node.arguments[0], code);
    return {
      id, type: 'SET_IMMEDIATE', name: `setImmediate(${callbackName})`,
      code: codeSnippet, line, category: 'check',
      callback: callbackName,
    };
  }

  // Promise.then, Promise.catch, Promise.resolve().then()
  if (callee.type === 'MemberExpression' && 
      (callee.property.name === 'then' || callee.property.name === 'catch' || callee.property.name === 'finally')) {
    const callbackName = getCallbackName(node.arguments[0], code);
    return {
      id, type: 'PROMISE_HANDLER', name: `.${callee.property.name}(${callbackName})`,
      code: codeSnippet, line, category: 'microtask',
      handler: callee.property.name,
      callback: callbackName,
      callbackBody: node.arguments[0] ? code.slice(node.arguments[0].start, node.arguments[0].end) : '',
    };
  }

  // Promise.resolve / Promise.reject
  if (callee.type === 'MemberExpression' &&
      callee.object.name === 'Promise' &&
      (callee.property.name === 'resolve' || callee.property.name === 'reject')) {
    return {
      id, type: 'PROMISE_STATIC', name: `Promise.${callee.property.name}()`,
      code: codeSnippet, line, category: 'sync',
    };
  }

  // new Promise()
  if (node.type === 'CallExpression' && callee.type === 'Identifier' && callee.name === 'Promise') {
    return null; // handled by NewExpression
  }

  // process.nextTick
  if (callee.type === 'MemberExpression' &&
      callee.object.name === 'process' && callee.property.name === 'nextTick') {
    const callbackName = getCallbackName(node.arguments[0], code);
    return {
      id, type: 'NEXT_TICK', name: `process.nextTick(${callbackName})`,
      code: codeSnippet, line, category: 'microtask',
      callback: callbackName,
      callbackBody: node.arguments[0] ? code.slice(node.arguments[0].start, node.arguments[0].end) : '',
    };
  }

  // queueMicrotask
  if (callee.name === 'queueMicrotask') {
    const callbackName = getCallbackName(node.arguments[0], code);
    return {
      id, type: 'QUEUE_MICROTASK', name: `queueMicrotask(${callbackName})`,
      code: codeSnippet, line, category: 'microtask',
      callback: callbackName,
      callbackBody: node.arguments[0] ? code.slice(node.arguments[0].start, node.arguments[0].end) : '',
    };
  }

  // fetch
  if (callee.name === 'fetch') {
    return {
      id, type: 'FETCH', name: `fetch(${extractArgs(node.arguments, code)})`,
      code: codeSnippet, line, category: 'webapi',
    };
  }

  // fs operations (callback-based I/O via libuv)
  if (callee.type === 'MemberExpression' &&
      callee.object.name === 'fs') {
    // The callback is typically the last argument
    const lastArg = node.arguments[node.arguments.length - 1];
    const callbackName = lastArg ? getCallbackName(lastArg, code) : 'callback';
    const callbackBody = lastArg ? code.slice(lastArg.start, lastArg.end) : '';
    return {
      id, type: 'FS_OPERATION', name: `fs.${callee.property.name}(...)`,
      code: codeSnippet, line, category: 'libuv',
      callback: callbackName,
      callbackBody,
    };
  }

  // http.createServer
  if (callee.type === 'MemberExpression' &&
      callee.object.name === 'http' && callee.property.name === 'createServer') {
    return {
      id, type: 'HTTP_SERVER', name: `http.createServer(...)`,
      code: codeSnippet, line, category: 'libuv',
    };
  }

  // Generic function call
  if (callee.type === 'Identifier') {
    return {
      id, type: 'FUNCTION_CALL', name: `${callee.name}()`,
      code: codeSnippet, line, category: 'sync',
    };
  }

  return null;
}

function extractArgs(args, code) {
  if (!args || args.length === 0) return '';
  return args.map(arg => {
    const raw = code.slice(arg.start, arg.end);
    return raw.length > 30 ? raw.slice(0, 30) + '...' : raw;
  }).join(', ');
}

function getCallbackName(arg, code) {
  if (!arg) return 'callback';
  if (arg.type === 'Identifier') return arg.name;
  if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
    if (arg.id && arg.id.name) return arg.id.name;
    // Try to get a short representation
    const body = code.slice(arg.start, Math.min(arg.start + 25, arg.end));
    return body.length < 25 ? body : '() => {...}';
  }
  return 'callback';
}

module.exports = { parseCode };
