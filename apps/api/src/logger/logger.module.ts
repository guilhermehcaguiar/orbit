import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service.js';

const LOGGER_TOKEN = 'LOGGER_SERVICE';

@Global()
@Module({
  providers: [
    {
      provide: LOGGER_TOKEN,
      useClass: LoggerService,
    },
    LoggerService,
  ],
  exports: [LOGGER_TOKEN, LoggerService],
})
export class LoggerModule {}
