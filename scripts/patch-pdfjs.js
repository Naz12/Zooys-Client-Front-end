// Postinstall script to patch pdfjs-dist to remove canvas dependency
const fs = require('fs');
const path = require('path');

const pdfjsPath = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.js');

if (fs.existsSync(pdfjsPath)) {
  let content = fs.readFileSync(pdfjsPath, 'utf8');
  
  // Replace the canvas require with a stub
  const canvasStubPath = path.resolve(__dirname, '..', 'lib', 'webpack', 'canvas-stub.js');
  const relativePath = path.relative(path.dirname(pdfjsPath), canvasStubPath).replace(/\\/g, '/');
  
  content = content.replace(
    /const Canvas = require\(["']canvas["']\);/g,
    `const Canvas = require(${JSON.stringify(relativePath.startsWith('.') ? relativePath : './' + relativePath)});`
  );
  
  fs.writeFileSync(pdfjsPath, content, 'utf8');
  console.log('✅ Patched pdfjs-dist to use canvas stub');
} else {
  console.log('⚠️ pdfjs-dist not found, skipping patch');
}

