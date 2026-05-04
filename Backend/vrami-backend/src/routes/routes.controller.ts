import { Controller, Post, Body } from '@nestjs/common';
import { RoutesService } from './routes.service';

@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post('air-route')
  getAirRouteS(@Body() body: { points: { coords: [number, number] }[] }) {
    console.log('REQUEST GET AIR-ROUTE');
    console.log('BODY:', body);
    return this.routesService.getAirRouteCoords(body.points);
  }

  @Post('air-route')
  async getAirRoute(
    @Body('points') points: [number, number][],
  ): Promise<[number, number][]> {
    return this.routesService.calculateAirRoute(points);
  }
}