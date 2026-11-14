/**
 * Custom Jest resolver to handle Node.js built-in protocol imports (node:url, node:path, etc.)
 * Required because Jest 25 doesn't natively understand the node: prefix.
 */
module.exports = (request, options) => {
  // Strip the node: prefix so Jest resolves it as a normal built-in
  if (request.startsWith('node:')) {
    return options.defaultResolver(request.slice(5), options);
  }
  return options.defaultResolver(request, options);
};

