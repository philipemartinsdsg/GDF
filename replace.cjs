const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Colors
content = content.replace(/text-gray-/g, 'text-slate-');
content = content.replace(/bg-gray-/g, 'bg-slate-');
content = content.replace(/border-gray-/g, 'border-slate-');

content = content.replace(/text-blue-/g, 'text-teal-');
content = content.replace(/bg-blue-/g, 'bg-teal-');
content = content.replace(/border-blue-/g, 'border-teal-');
content = content.replace(/ring-blue-/g, 'ring-teal-');

content = content.replace(/text-green-/g, 'text-teal-');
content = content.replace(/bg-green-/g, 'bg-teal-');

content = content.replace(/text-red-/g, 'text-orange-');
content = content.replace(/bg-red-/g, 'bg-orange-');

content = content.replace(/text-purple-/g, 'text-slate-');
content = content.replace(/bg-purple-/g, 'bg-slate-');

// Typography
content = content.replace(/R\$ /g, '<span className="font-mono">R$ </span><span className="font-mono">');
content = content.replace(/\.toLocaleString\('pt-BR', \{minimumFractionDigits: 2, maximumFractionDigits: 2\}\)}/g, ".toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>");

// Fix the chart tooltip
content = content.replace(/<span className="font-mono">R\$ <\/span><span className="font-mono">\$\{value/g, 'R$ ${value');
content = content.replace(/\.toLocaleString\('pt-BR', \{minimumFractionDigits: 2, maximumFractionDigits: 2\}\)}<\/span>/g, ".toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}");

// Fix specific chart colors
content = content.replace(/fill="#10b981"/g, 'fill="#0D9488"'); // green to teal
content = content.replace(/fill="#3b82f6"/g, 'fill="#94A3B8"'); // blue to silver
content = content.replace(/fill="#f59e0b"/g, 'fill="#F97316"'); // amber to coral
content = content.replace(/fill="#ef4444"/g, 'fill="#F97316"'); // red to coral
content = content.replace(/fill="#8b5cf6"/g, 'fill="#0D9488"'); // purple to teal

// Radius
content = content.replace(/rounded-2xl/g, 'rounded-xl');

// Background
content = content.replace(/<div className="min-h-screen bg-slate-50">/g, '<div className="min-h-screen bg-[#F8FAFC]">');

fs.writeFileSync(filePath, content);
console.log('Done');
