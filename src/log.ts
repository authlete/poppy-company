// A tiny leveled logger, no dependency. Set LOG_LEVEL (debug|info|warn|error) in the environment to
// change verbosity - on Vercel, set it in the project's env vars. Each call emits one JSON line via
// the matching console method, so Vercel tags the severity and the line stays queryable.
const LEVELS = ["debug", "info", "warn", "error"] as const;
type Level = (typeof LEVELS)[number];

const configured = process.env.LOG_LEVEL as Level | undefined;
const threshold = LEVELS.indexOf(configured && LEVELS.includes(configured) ? configured : "info");

const emit =
  (level: Level) =>
  (msg: string, fields: Record<string, unknown> = {}) => {
    if (LEVELS.indexOf(level) < threshold) return;
    console[level](JSON.stringify({ level, msg, ...fields }));
  };

export const log = {
  debug: emit("debug"),
  info: emit("info"),
  warn: emit("warn"),
  error: emit("error"),
};
