const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The issue is that we have lines like:
// <span className="font-medium text-teal-600">R$ {d.income.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
// missing the closing </span>.
// Let's replace `maximumFractionDigits: 2})}` with `maximumFractionDigits: 2})}</span>`
// BUT ONLY if it's not already followed by `</span>`.

content = content.replace(/maximumFractionDigits: 2\}\)}(?!<\/span>)/g, 'maximumFractionDigits: 2})}</span>');

fs.writeFileSync(filePath, content);
console.log('Fixed spans again');
