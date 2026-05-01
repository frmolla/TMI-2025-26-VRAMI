import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectsModule } from './projects/projects.module';
import { RoutesModule } from './routes/routes.module';
import { RoutesController } from './routes/routes.controller';
import { RoutesService } from './routes/routes.service';

@Module({
  imports: [ProjectsModule, RoutesModule],
  controllers: [AppController, RoutesController],
  providers: [AppService, RoutesService],
})
export class AppModule {}
