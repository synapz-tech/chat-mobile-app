// jest-expo's preset setup requires `expo/virtual/streams` for its side effects
// (installs web stream globals, normally injected by Metro). In tests we don't
// need the real polyfill — a no-op keeps the preset from failing to resolve it.
module.exports = {};
