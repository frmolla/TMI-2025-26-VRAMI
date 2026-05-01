import { Injectable } from '@nestjs/common';
import * as turf from '@turf/turf';

@Injectable()
export class RoutesService {
  getAirRouteCoords(points: { coords: [number, number] }[]): [number, number][] {
    if (points.length < 2) return [];

    let fullLine: any = null;

    for (let i = 0; i < points.length - 1; i++) {
      const start = turf.point(points[i].coords);
      const end = turf.point(points[i + 1].coords);

      const arc = turf.greatCircle(start, end, { npoints: 150 });

      if (!fullLine) fullLine = arc;
      else fullLine.geometry.coordinates.push(...arc.geometry.coordinates);
    }

    return fullLine.geometry.coordinates as [number, number][];
  }
}