enum LogLevel {
  TRACE = 1,
  DEBUG = 2,
  INFO = 3,
  WARN = 4,
  ERROR = 5,
  FATAL = 6,
  NONE = 7,
}

type LogFunc = (...data: any) => void;
const noop: LogFunc = () => {};

/**
 * Ths motivation behind this is to setup permanent logs instead of adding them when required
 * The problem with this is that we loose the line number info
 */
export default class Logger {
  label: string;
  level: LogLevel;

  trace: LogFunc = noop;
  debug: LogFunc = noop;
  info: LogFunc = noop;
  warn: LogFunc = noop;
  error: LogFunc = noop;
  fatal: LogFunc = noop;
  assert = console.assert;

  constructor(label: string = "logger") {
    this.label = label;
    this.level = LogLevel.INFO;

    this.adjustByLevel();
  }

  private adjustByLevel() {
    this.trace = this.level >= LogLevel.TRACE ? console.trace : noop;
    this.debug = this.level >= LogLevel.DEBUG ? console.debug : noop;
    this.info = this.level >= LogLevel.INFO ? console.info : noop;
    this.warn = this.level >= LogLevel.WARN ? console.warn : noop;
    this.error = this.level >= LogLevel.ERROR ? console.error : noop;
    this.fatal = this.level >= LogLevel.FATAL ? console.error : noop;
  }

  extend(label: string) {
    const extended = new Logger(this.label + ":" + label);
    extended.setLogLevel(this.level);
    return extended;
  }

  setLogLevel(level: LogLevel) {
    this.level = level;

    this.adjustByLevel();
  }

  silence() {
    this.setLogLevel(LogLevel.NONE);
  }
}
