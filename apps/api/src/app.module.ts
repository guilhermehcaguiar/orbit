import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { fileURLToPath } from 'node:url';
import { validateEnvironment } from './config/environment.js';
import { LoggingMiddleware } from './common/middleware/logging.middleware.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { DatabaseModule } from './database/database.module.js';
import { LoggerModule } from './logger/logger.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { SubjectsModule } from './modules/subjects/subjects.module.js';
import { ScheduleModule } from './modules/schedule/schedule.module.js';
import { TasksModule } from './modules/tasks/tasks.module.js';
import { ExamsModule } from './modules/exams/exams.module.js';
import { FocusModule } from './modules/focus/focus.module.js';
import { StudyPlansModule } from './modules/study-plans/study-plans.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      skipProcessEnv: true,
      envFilePath: [
        fileURLToPath(new URL('../.env', import.meta.url)),
        fileURLToPath(new URL('../../../.env', import.meta.url)),
      ],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    LoggerModule,
    AuthModule,
    UsersModule,
    SubjectsModule,
    ScheduleModule,
    TasksModule,
    ExamsModule,
    FocusModule,
    StudyPlansModule,
    AiModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, LoggingMiddleware).forRoutes('*');
  }
}