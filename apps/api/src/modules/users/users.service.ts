import { Injectable } from '@nestjs/common';
import { ProfilesRepository } from '../../database/repositories/profiles.repository.js';
import type { Profile, NewProfile } from '../../database/schema/profiles.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly profilesRepository: ProfilesRepository,
  ) {}

  async findById(id: string): Promise<Profile | null> {
    return this.profilesRepository.findById(id);
  }

  async findByEmail(email: string): Promise<Profile | null> {
    return this.profilesRepository.findByEmail(email);
  }

  async createProfile(profile: NewProfile): Promise<Profile> {
    return this.profilesRepository.create(profile);
  }

  async updateProfile(id: string, data: Partial<Pick<Profile, 'name' | 'avatarUrl'>>): Promise<Profile | null> {
    return this.profilesRepository.update(id, data);
  }
}
