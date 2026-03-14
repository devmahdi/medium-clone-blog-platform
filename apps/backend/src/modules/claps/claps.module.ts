import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClapsController } from './claps.controller';
import { ClapsService } from './claps.service';
import { Clap } from './entities/clap.entity';
import { Post } from '../posts/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Clap, Post])],
  controllers: [ClapsController],
  providers: [ClapsService],
  exports: [ClapsService],
})
export class ClapsModule {}
