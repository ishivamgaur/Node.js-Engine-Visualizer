const { generateTimeline } = require('./engine/interpreter');
const util = require('util');

const code = `
var x = 10;
let y = 20;

function outer() {
   let b = 50;
   console.log('outer x', x);
   function inner() {
      console.log('inner b', b);
   }
   setTimeout(inner, 100);
}
outer();
`;

console.log('Compiling and generating timeline...');
try {
  const timeline = generateTimeline(code);
  console.log(`Timeline generated with ${timeline.length} steps.`);
  // Log the first few steps that demonstrate memory creation
  for (let i = 0; i < 15 && i < timeline.length; i++) {
     console.log(`Step ${timeline[i].step}: [${timeline[i].action}] ${timeline[i].detail}`);
     if (timeline[i].action === 'MEMORY_CREATION') {
        console.log(util.inspect(timeline[i].state.executionContexts, { depth: null }));
     }
  }
} catch (err) {
  console.error(err);
}
