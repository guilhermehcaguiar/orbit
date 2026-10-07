import { Module } from '@nestjs/common';
import { UsersService } from '#app/modules/users/users.service';
import { DatabaseModule } from '#app/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
