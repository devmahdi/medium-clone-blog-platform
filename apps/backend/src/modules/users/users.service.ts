import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find user by identifier (ID, username, or email)
   */
  async findByIdentifier(identifier: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :identifier', { identifier })
      .orWhere('user.username = :identifier', { identifier })
      .orWhere('user.email = :identifier', { identifier })
      .loadRelationCountAndMap('user.followersCount', 'user.followers')
      .loadRelationCountAndMap('user.followingCount', 'user.following')
      .loadRelationCountAndMap('user.postsCount', 'user.posts')
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);

    // Update only provided fields
    Object.assign(user, updateUserDto);

    return this.userRepository.save(user);
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string, requestingUserId: string): Promise<void> {
    if (userId !== requestingUserId) {
      throw new ForbiddenException('You can only delete your own account');
    }

    const user = await this.findById(userId);
    await this.userRepository.remove(user);
  }

  /**
   * Get user with statistics
   */
  async getUserWithStats(identifier: string, currentUserId?: string): Promise<User> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :identifier', { identifier })
      .orWhere('user.username = :identifier', { identifier })
      .loadRelationCountAndMap('user.followersCount', 'user.followers')
      .loadRelationCountAndMap('user.followingCount', 'user.following')
      .loadRelationCountAndMap('user.postsCount', 'user.posts', 'posts', (qb) =>
        qb.where('posts.status = :status', { status: 'published' }),
      );

    const user = await queryBuilder.getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if current user is following this user
    if (currentUserId && currentUserId !== user.id) {
      const isFollowing = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.followers', 'follower', 'follower.id = :currentUserId', { currentUserId })
        .where('user.id = :userId', { userId: user.id })
        .andWhere('follower.id IS NOT NULL')
        .getCount();

      user.isFollowing = isFollowing > 0;
    }

    return user;
  }

  /**
   * Check if user exists by email or username
   */
  async exists(email: string, username: string): Promise<boolean> {
    const count = await this.userRepository.count({
      where: [{ email }, { username }],
    });

    return count > 0;
  }
}
