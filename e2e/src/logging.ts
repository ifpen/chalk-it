import { transports, createLogger, format, Logger } from 'winston';
import { config } from './test-config.js';

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new transports.Console({
      format: format.cli(),
    }),
    new transports.File({
      filename: process.env.LOG_FILE || `${config.outputsDir}/tests.log`,
      format: format.json(),
    }),
  ],
});

export function createModuleLogger(moduleName: string): Logger {
  return logger.child({ moduleName });
}
