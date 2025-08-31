export class Logger {
  private static log(level: string, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`, ...args);
  }

  static info(message: string, ...args: any[]) {
    this.log('INFO', message, ...args);
  }

  static error(message: string, ...args: any[]) {
    this.log('ERROR', message, ...args);
  }

  static warn(message: string, ...args: any[]) {
    this.log('WARN', message, ...args);
  }

  static debug(message: string, ...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, ...args);
    }
  }
}