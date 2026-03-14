import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Tree,
  TreeChildren,
  TreeParent,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

export enum CommentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  HIDDEN = 'hidden',
  DELETED = 'deleted',
}

@Entity('comments')
@Tree('closure-table')
@Index(['postId', 'createdAt'])
@Index(['userId'])
@Index(['status'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid' })
  postId: string;

  @ManyToOne(() => Post, (post) => post.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @TreeParent()
  parent: Comment | null;

  @TreeChildren()
  replies: Comment[];

  @Column({
    type: 'enum',
    enum: CommentStatus,
    default: CommentStatus.APPROVED,
  })
  status: CommentStatus;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: false })
  isEdited: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields (not stored in DB)
  userDetails?: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  repliesCount?: number;
  depth?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}
