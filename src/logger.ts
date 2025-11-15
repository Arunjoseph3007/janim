export enum JLogLevel {
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
export default class JLogger {
  label: string;
  private level: JLogLevel;

  trace: LogFunc = noop;
  debug: LogFunc = noop;
  log: LogFunc = noop;
  info: LogFunc = noop;
  warn: LogFunc = noop;
  error: LogFunc = noop;
  fatal: LogFunc = noop;
  assert = console.assert;

  constructor(label: string = "logger") {
    this.label = label;
    this.level = JLogLevel.INFO;

    this.adjustByLevel();
  }

  private adjustByLevel() {
    this.trace = this.level <= JLogLevel.TRACE ? console.trace : noop;
    this.debug = this.level <= JLogLevel.DEBUG ? console.debug : noop;
    this.log = this.level <= JLogLevel.DEBUG ? console.info : noop;
    this.info = this.level <= JLogLevel.INFO ? console.info : noop;
    this.warn = this.level <= JLogLevel.WARN ? console.warn : noop;
    this.error = this.level <= JLogLevel.ERROR ? console.error : noop;
    this.fatal = this.level <= JLogLevel.FATAL ? console.error : noop;
  }

  extend(label: string) {
    const extended = new JLogger(this.label + ":" + label);
    extended.setLogLevel(this.level);
    return extended;
  }

  setLogLevel(level: JLogLevel) {
    this.level = level;

    this.adjustByLevel();
  }

  getLogLevel() {
    return this.level;
  }

  silence() {
    this.setLogLevel(JLogLevel.NONE);
  }
}
