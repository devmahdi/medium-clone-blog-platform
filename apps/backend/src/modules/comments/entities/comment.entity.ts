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
  Tree,
  TreeChildren,
  TreeParent,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('comments')
@Tree('closure-table')
@Index(['postId', 'createdAt'])
@Index(['userId'])
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

  @ManyToOne(() => User, (user) => user.comments, {
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

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields
  userDetails?: Partial<User>;
  repliesCount?: number;
  canEdit?: boolean; // Current user can edit this comment
  canDelete?: boolean; // Current user can delete this comment
}
