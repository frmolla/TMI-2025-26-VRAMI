import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';
import type { ProjectEntity } from './projects.service';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { Express } from 'express'; // El import clave para evitar errores

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(): ProjectEntity[] {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): ProjectEntity {
    return this.projectsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProjectDto): ProjectEntity {
    return this.projectsService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): { message: string } {
    return this.projectsService.remove(id);
  }

  @Post(':id/video')
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Res() res: Response,
  ) {
    if (!file) throw new Error('No llegó el archivo');
    console.log(
      `Recibido vídeo crudo de ${file.size} bytes. Pasando a FFmpeg...`,
    );

    const videoPath = await this.projectsService.processVideo(id, file);
    return res.download(videoPath, `Ruta_Animada_${id}.mp4`);
  }
}
