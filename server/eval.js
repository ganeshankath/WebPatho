const { performance } = require('node:perf_hooks');
const { fallbackExtract } = require('./assistant');

const cases = [
  ['old fridge and cardboard', ['fridge', 'cardboard']],
  ['sofa and some garden waste', ['furniture', 'garden']],
  ['microwave and batteries', ['electrical', 'batteries']],
  ['newspapers and glass jars', ['cardboard', 'glass']],
  ['broken freezer', ['fridge']],
  ['scrap metal and timber', ['metal', 'wood']],
  ['sealed paint tins', ['paint']],
  ['general rubbish bags', ['general']],
  ['old chair and cardboard boxes', ['furniture', 'cardboard']],
  ['Where can I take a kettle?', ['electrical']],
  ['Can I bring commercial waste?', []],
  ['I need to visit a centre tomorrow', []],
];
let passed = 0;
const start = performance.now();
for (const [input, expected] of cases) {
  const actual = fallbackExtract(input).items.sort();
  const okay = JSON.stringify(actual) === JSON.stringify([...expected].sort());
  if (okay) passed++;
  console.log(`${okay ? 'PASS' : 'FAIL'} ${input}: ${actual.join(', ') || '(none)'}`);
}
console.log(`\nGuided extraction baseline: ${passed}/${cases.length} scenarios (${Math.round(passed / cases.length * 100)}%) in ${(performance.now() - start).toFixed(1)} ms.`);
console.log('This measures the local guided extractor only. It is not an LLM task-completion score.');
if (passed !== cases.length) process.exitCode = 1;
