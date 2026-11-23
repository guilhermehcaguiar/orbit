import { Module } from '@nestjs/common';
import { AuthModule } from '#app/modules/auth/auth.module';
import { WorkspaceRepository } from './workspace.repository.js';
import { WorkspaceController } from './workspace.controller.js';

@Module({ imports: [AuthModule], providers: [WorkspaceRepository], controllers: [WorkspaceController] })
export class WorkspaceModule {}
