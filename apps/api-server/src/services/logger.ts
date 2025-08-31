export class Logger {
  private static log(level: string, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    console.log(`[${timestamp}] [${level}] ${message}${formattedArgs}`);
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
    if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
      this.log('DEBUG', message, ...args);
    }
  }
}