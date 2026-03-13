const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The issue is that I replaced `R$ ` with `<span className="font-mono">R$ </span><span className="font-mono">`
// and `.toLocaleString(...)` with `.toLocaleString(...)</span>`
// But some places lost their closing tags.
// Let's just revert the R$ and toLocaleString changes.
// I'll use regex to find `<span className="font-mono">R\$ <\/span><span className="font-mono">` and replace it back to `R$ `
content = content.replace(/<span className="font-mono">R\$ <\/span><span className="font-mono">/g, 'R$ ');
// And replace `.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>` with `.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
content = content.replace(/\.toLocaleString\('pt-BR', \{minimumFractionDigits: 2, maximumFractionDigits: 2\}\)}<\/span>/g, ".toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}");

// Now let's do it properly:
// Find all instances of `R$ {variable.toLocaleString(...)` and wrap them properly.
// Wait, it's easier to just add `font-mono` to the parent container.
// But I can't easily do that with regex.
// Let's just fix the syntax errors first.

fs.writeFileSync(filePath, content);
console.log('Fixed spans');
