import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Res,
  Request,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Response } from 'express';
import type { Express } from 'express';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAllByUser(@Request() req: any) {
    return this.projectsService.findByUserId(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req: any) {
    const project = await this.projectsService.findOne(id);
    if (project.user_id !== req.user.id) {
      throw new Error('Unauthorized');
    }
    return project;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateProjectDto, @Request() req: any) {
    return this.projectsService.create(dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req: any) {
    const project = await this.projectsService.findOne(id);
    if (project.user_id !== req.user.id) {
      throw new Error('Unauthorized');
    }
    return this.projectsService.remove(id);
  }

  @Post(':id/video')
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Res() res: Response,
  ) {
    if (!file) throw new Error('No video file provided');

    console.log(`Recibido vídeo de ${file.size} bytes. Procesando con FFmpeg...`);
    const videoPath = await this.projectsService.processVideo(id, file);
    return res.download(videoPath, `Ruta_Animada_${id}.mp4`);
  }
}