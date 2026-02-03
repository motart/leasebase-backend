import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class JsonLogger implements LoggerService {
  log(message: any, context?: string) {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({ level: 'info', message, context, timestamp: new Date().toISOString() }),
    );
  }

  error(message: any, trace?: string, context?: string) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        trace,
        context,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  warn(message: any, context?: string) {
    // eslint-disable-next-line no-console
    console.warn(
      JSON.stringify({ level: 'warn', message, context, timestamp: new Date().toISOString() }),
    );
  }

  debug(message: any, context?: string) {
    // eslint-disable-next-line no-console
    console.debug(
      JSON.stringify({ level: 'debug', message, context, timestamp: new Date().toISOString() }),
    );
  }

  verbose(message: any, context?: string) {
    this.debug(message, context);
  }
}
