import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';
import type { ProjectEntity } from './projects.service';

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
}
