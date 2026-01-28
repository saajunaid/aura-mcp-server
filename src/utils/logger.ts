export class Logger {
  private prefix = '[AURA]';
  
  info(message: string, ...args: any[]): void {
    console.error(`${this.prefix} ${message}`, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    console.error(`${this.prefix} WARN: ${message}`, ...args);
  }
  
  error(message: string, error?: any): void {
    console.error(`${this.prefix} ERROR: ${message}`, error);
  }
  
  debug(message: string, ...args: any[]): void {
    if (process.env.DEBUG) {
      console.error(`${this.prefix} DEBUG: ${message}`, ...args);
    }
  }
}