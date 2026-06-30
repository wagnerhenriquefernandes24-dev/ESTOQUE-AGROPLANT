import fs from 'fs';

const files = [
  './routes/dashboard.js',
  './routes/movimentacoes.js'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\\`/g, '`');
  content = content.replace(/\\\${/g, '${');
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}
