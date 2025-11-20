// Webpack loader to replace require("canvas") with our stub
const path = require('path');

module.exports = function(source) {
  // Replace require("canvas") with require to our stub
  const stubPath = path.resolve(__dirname, 'canvas-stub.js');
  // Use relative path from the source file's location
  const relativePath = path.relative(
    path.dirname(this.resourcePath),
    stubPath
  ).replace(/\\/g, '/');
  
  return source.replace(
    /require\(["']canvas["']\)/g,
    `require(${JSON.stringify('./' + relativePath)})`
  );
};

