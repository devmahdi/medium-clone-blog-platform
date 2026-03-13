import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Like } from '../../likes/entities/like.entity';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('posts')
@Index(['status', 'publishedAt'])
@Index(['authorId', 'status'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  subtitle: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ nullable: true })
  coverImageUrl: string | null;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status: PostStatus;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  publishedAt: Date | null;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  commentCount: number;

  @Column({ type: 'int', default: 5, comment: 'Estimated reading time in minutes' })
  readingTimeMinutes: number;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null;

  @Column({ default: true })
  allowComments: boolean;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields
  isLiked?: boolean; // Current user liked this post
  authorDetails?: Partial<User>;
}
