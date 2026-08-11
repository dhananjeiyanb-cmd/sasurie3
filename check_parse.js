const ts = require('typescript');
const fs = require('fs');
const code = fs.readFileSync('src/views/StudentExamView.tsx', 'utf8');
const result = ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true);
console.log('Parse successful:', !!result);
console.log('Has parse errors:', result.parseDiagnostics.length > 0);
if (result.parseDiagnostics.length > 0) {
  result.parseDiagnostics.forEach(d => {
    const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    console.log('Parse error:', message);
  });
}
