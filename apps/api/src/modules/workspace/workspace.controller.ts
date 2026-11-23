import { BadRequestException, Body, ConflictException, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { entrySchema, mergeLocalWorkspace, recordId, removeEntry, removeSubject, subjectSchema, workspaceSchema, workspaceWriteSchema, type Account, type Workspace } from '@orbit/contracts';
import { reopenConflictingPlan } from '@orbit/contracts/planner';
import { z } from 'zod';
import { SessionGuard, type AccountRequest } from '#app/modules/auth/session.guard';
import { WorkspaceRepository } from './workspace.repository.js';

const collections = { subjects: 'subject', tasks: 'task', assessments: 'exam' } as const;
const revisionSchema = workspaceWriteSchema.pick({ revision: true });
const mutationSchema = revisionSchema.extend({ record: z.record(z.string(), z.unknown()) });

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new BadRequestException('Confira os dados e os vínculos entre registros.');
  return result.data;
}

function collection(value: string) {
  if (!Object.hasOwn(collections, value)) throw new NotFoundException();
  return collections[value as keyof typeof collections];
}

@Controller()
@UseGuards(SessionGuard)
export class WorkspaceController {
  constructor(private readonly repository: WorkspaceRepository) {}

  @Get('workspace')
  read(@Req() { account }: AccountRequest) {
    return this.repository.read(account.id, account.name);
  }

  @Put('workspace')
  write(@Req() { account }: AccountRequest, @Body() body: unknown) {
    const { revision, workspace } = parse(workspaceWriteSchema, body);
    return this.save(account, revision, () => workspace);
  }

  @Post('workspace/import')
  @HttpCode(200)
  import(@Req() { account }: AccountRequest, @Body() body: unknown) {
    const { revision, workspace } = parse(workspaceWriteSchema, body);
    return this.save(account, revision, current => mergeLocalWorkspace(current, workspace));
  }

  @Get(':collection')
  async list(@Req() { account }: AccountRequest, @Param('collection') key: string) {
    const kind = collection(key);
    const { revision, workspace } = await this.repository.read(account.id, account.name);
    return { revision, records: kind === 'subject' ? workspace.subjects : workspace.entries.filter(item => item.kind === kind) };
  }

  @Get(':collection/:id')
  async detail(@Req() request: AccountRequest, @Param('collection') key: string, @Param('id') id: string) {
    const { revision, records } = await this.list(request, key);
    const record = records.find(item => item.id === id);
    if (!record) throw new NotFoundException();
    return { revision, record };
  }

  @Post(':collection')
  create(@Req() { account }: AccountRequest, @Param('collection') key: string, @Body() body: unknown) {
    return this.upsert(account, key, body);
  }

  @Patch(':collection/:id')
  update(@Req() { account }: AccountRequest, @Param('collection') key: string, @Param('id') id: string, @Body() body: unknown) {
    return this.upsert(account, key, body, parse(recordId, id));
  }

  @Delete(':collection/:id')
  remove(@Req() { account }: AccountRequest, @Param('collection') key: string, @Param('id') id: string, @Body() body: unknown) {
    const kind = collection(key);
    const { revision } = parse(revisionSchema, body);
    return this.save(account, revision, workspace => {
      const exists = kind === 'subject'
        ? workspace.subjects.some(item => item.id === id)
        : workspace.entries.some(item => item.kind === kind && item.id === id);
      if (!exists) throw new NotFoundException();
      return kind === 'subject' ? removeSubject(workspace, id) : removeEntry(workspace, id);
    });
  }

  private upsert(account: Account, key: string, body: unknown, id?: string) {
    const kind = collection(key);
    const { revision, record } = parse(mutationSchema, body);
    return this.save(account, revision, workspace => {
      if ('id' in record && id && record.id !== id) throw new BadRequestException('Identificador inválido.');
      if (kind === 'subject') {
        const existing = workspace.subjects.find(item => item.id === id);
        if (id && !existing) throw new NotFoundException();
        const subject = parse(subjectSchema, { ...existing, ...record });
        return { ...workspace, subjects: this.upsertItem(workspace.subjects, subject, id) };
      }
      const existing = workspace.entries.find(item => item.kind === kind && item.id === id);
      if (id && !existing) throw new NotFoundException();
      const entry = parse(entrySchema, { kind, ...existing, ...record });
      if (entry.kind !== kind) throw new BadRequestException('Tipo de registro inválido.');
      return { ...workspace, entries: this.upsertItem(workspace.entries, entry, id) };
    });
  }

  private upsertItem<T extends { id: string }>(items: T[], record: T, id?: string) {
    const exists = items.some(item => item.id === record.id);
    if (!id && exists) throw new ConflictException('Este identificador já existe.');
    if (!id) return [...items, record];
    if (id !== record.id) throw new BadRequestException('Identificador inválido.');
    if (!exists) throw new NotFoundException();
    return items.map(item => item.id === id ? record : item);
  }

  private async save(account: Account, revision: number, update: (workspace: Workspace) => Workspace) {
    const result = await this.repository.write(account.id, account.name, revision, current => reopenConflictingPlan(parse(workspaceSchema, update(current))));
    if (result.conflict) throw new ConflictException('Os dados mudaram em outro dispositivo. Recarregue para continuar.');
    return result.snapshot;
  }
}
