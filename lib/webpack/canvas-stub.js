// Stub module for canvas (Node.js module not available in browser)
// This is used by pdfjs-dist's NodeCanvasFactory, but browser builds use DOMCanvasFactory
// Export an object that matches what NodeCanvasFactory expects
module.exports = {
  createCanvas: function() {
    // Return a mock canvas object
    return {
      width: 0,
      height: 0,
      getContext: function() {
        return null;
      }
    };
  }
};

