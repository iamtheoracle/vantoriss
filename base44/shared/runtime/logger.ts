const LOG_LEVELS = { trace: 0, debug: 1, info: 2, warn: 3, error: 4, fatal: 5 };
let currentLevel = LOG_LEVELS.info;

export const logger = {
  setLevel(level) { currentLevel = LOG_LEVELS[level] || LOG_LEVELS.info; },
  trace(msg, fields) { _log('trace', msg, fields); },
  debug(msg, fields) { _log('debug', msg, fields); },
  info(msg, fields) { _log('info', msg, fields); },
  warn(msg, fields) { _log('warn', msg, fields); },
  error(msg, fields) { _log('error', msg, fields); },
  fatal(msg, fields) { _log('fatal', msg, fields); },
};

function _log(level, msg, fields) {
  if (LOG_LEVELS[level] < currentLevel) return;
  const entry = { level, message: msg, timestamp: new Date().toISOString(), ...(fields || {}) };
  console.log(JSON.stringify(entry));
}

export function createTracer(traceId) {
  const spans = [];
  return {
    traceId,
    startSpan(name) {
      const span = { id: crypto.randomUUID(), traceId, name, startTime: Date.now() };
      spans.push(span);
      return {
        spanId: span.id,
        end() { span.endTime = Date.now(); span.duration = span.endTime - span.startTime; },
        setAttribute(key, value) { span[key] = value; },
      };
    },
    getSpans() { return spans; },
  };
}