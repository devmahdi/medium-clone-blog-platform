import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Like } from '../../likes/entities/like.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ length: 100, nullable: true })
  fullName: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ nullable: true })
  avatarUrl: string | null;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken: string | null;

  @Column({ nullable: true })
  @Exclude()
  passwordResetToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  passwordResetExpires: Date | null;

  @Column({ default: 'user' })
  role: 'user' | 'admin';

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  // Self-referencing many-to-many for follows
  @ManyToMany(() => User, (user) => user.following)
  @JoinTable({
    name: 'follows',
    joinColumn: { name: 'followerId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'followingId', referencedColumnName: 'id' },
  })
  followers: User[];

  @ManyToMany(() => User, (user) => user.followers)
  following: User[];

  // Virtual fields (not stored in DB)
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean; // Current user follows this user
}
