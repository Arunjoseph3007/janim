enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
}

/**
 * Ths motivation behind this is to setup permanent logs instead of adding them when required
 * The problem with this is that we loose the line number info
 */
export default class Logger {
  label: string;
  level: LogLevel;

  constructor(label: string = "logger") {
    this.label = label;
    this.level = LogLevel.DEBUG;
  }

  extend(label: string) {
    const extended = new Logger(this.label + ":" + label);
    extended.setLogLevel(this.level);
    return extended;
  }

  private getLevelString(level: LogLevel) {
    switch (level) {
      case LogLevel.TRACE:
        return "TRACE";
      case LogLevel.DEBUG:
        return "DEBUG";
      case LogLevel.INFO:
        return "INFO";
      case LogLevel.WARN:
        return "WARN";
      case LogLevel.ERROR:
        return "ERROR";
      case LogLevel.FATAL:
        return "FATAL";
    }
  }

  getPrefix(level: LogLevel): any[] {
    return [this.label, this.getLevelString(level)];
  }

  setLogLevel(level: LogLevel) {
    this.level = level;
  }

  assert(condition?: boolean, ...data: any[]): void {
    console.assert(condition, ...data);
  }

  trace(...data: any[]) {
    if (this.level < LogLevel.TRACE) return;
    console.trace(this.label, ...data);
  }
  debug(...data: any[]) {
    if (this.level < LogLevel.DEBUG) return;
    console.debug(this.label, ...data);
  }
  info(...data: any[]) {
    if (this.level < LogLevel.INFO) return;
    console.info(this.label, ...data);
  }
  warn(...data: any[]) {
    if (this.level < LogLevel.WARN) return;
    console.warn(this.label, ...data);
  }
  error(...data: any[]) {
    if (this.level < LogLevel.ERROR) return;
    console.error(this.label, ...data);
  }
  fatal(...data: any[]) {
    if (this.level < LogLevel.FATAL) return;
    console.error(this.label, ...data);
  }
}
