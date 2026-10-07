import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service.js';
import { ProfilesRepository } from './repositories/profiles.repository.js';

@Global()
@Module({
  providers: [
    DatabaseService,
    {
      provide: 'DATABASE',
      useFactory: (databaseService: DatabaseService) => databaseService.getDatabase(),
      inject: [DatabaseService],
    },
    ProfilesRepository,
  ],
  exports: [DatabaseService, 'DATABASE', ProfilesRepository],
})
export class DatabaseModule {}
