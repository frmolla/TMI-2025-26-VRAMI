import { Controller, Post, Body } from '@nestjs/common';
import { RoutesService } from './routes.service';

@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post('air-route')
  getAirRoute(@Body() body: { points: { coords: [number, number] }[] }) {
    console.log('REQUEST GET AIR-ROUTE');
    console.log('BODY:', body);
    return this.routesService.getAirRouteCoords(body.points);
  }
}