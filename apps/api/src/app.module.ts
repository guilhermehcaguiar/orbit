import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { fileURLToPath } from 'node:url';
import { validateEnvironment } from '#app/config/environment';
import { AuthModule } from '#app/modules/auth/auth.module';
import { UsersModule } from '#app/modules/users/users.module';
import { SubjectsModule } from '#app/modules/subjects/subjects.module';
import { ScheduleModule } from '#app/modules/schedule/schedule.module';
import { TasksModule } from '#app/modules/tasks/tasks.module';
import { ExamsModule } from '#app/modules/exams/exams.module';
import { FocusModule } from '#app/modules/focus/focus.module';
import { StudyPlansModule } from '#app/modules/study-plans/study-plans.module';
import { AiModule } from '#app/modules/ai/ai.module';
import { HealthModule } from '#app/modules/health/health.module';

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
export class AppModule {}
