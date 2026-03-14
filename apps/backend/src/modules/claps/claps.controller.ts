import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ClapsService } from './claps.service';
import { ClapDto } from './dto/clap.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Claps')
@Controller('claps')
export class ClapsController {
  constructor(private readonly clapsService: ClapsService) {}

  @Post('/articles/:articleId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Clap for an article',
    description:
      'Add claps to an article (like Medium claps). Users can clap up to 50 times per article.',
  })
  @ApiParam({
    name: 'articleId',
    description: 'Article UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Claps added successfully',
    schema: {
      type: 'object',
      properties: {
        userClaps: {
          type: 'number',
          description: 'Total claps by current user for this article',
        },
        totalClaps: {
          type: 'number',
          description: 'Total claps from all users',
        },
        added: {
          type: 'number',
          description: 'Number of claps added in this request',
        },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({
    status: 400,
    description: 'Maximum 50 claps per article exceeded',
  })
  async clapArticle(
    @Param('articleId') articleId: string,
    @Body() clapDto: ClapDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.clapsService.clapArticle(articleId, userId, clapDto);
  }

  @Get('/articles/:articleId')
  @Public()
  @ApiOperation({
    summary: 'Get clap count for an article',
    description:
      'Returns total claps and current user\'s clap count (if authenticated)',
  })
  @ApiParam({
    name: 'articleId',
    description: 'Article UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Clap counts retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalClaps: {
          type: 'number',
          description: 'Total claps from all users',
        },
        userClaps: {
          type: 'number',
          description: 'Claps by current user (0 if not authenticated)',
        },
        maxClaps: {
          type: 'number',
          description: 'Maximum claps allowed per user',
          example: 50,
        },
        canClap: {
          type: 'boolean',
          description: 'Whether user can add more claps',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async getArticleClaps(@Param('articleId') articleId: string, @Req() req?: any) {
    const userId = req?.user?.sub;
    return this.clapsService.getArticleClaps(articleId, userId);
  }
}
