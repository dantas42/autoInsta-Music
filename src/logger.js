function format(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const extras = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level}] ${message}${extras}`;
}

export const logger = {
  info(message, context) {
    console.log(format("INFO", message, context));
  },
  warn(message, context) {
    console.warn(format("WARN", message, context));
  },
  error(message, context) {
    console.error(format("ERROR", message, context));
  }
};
