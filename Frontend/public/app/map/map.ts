import { Component, OnInit, OnDestroy, Input, inject  } from '@angular/core';
import mapboxgl, { Map } from 'mapbox-gl';
import { IPoints } from './models/points.model';
import { mapIcons } from './map-icons';
import { Parada } from './models/parada.model';
import { MapService } from '@/services/map.service';
import { catchError, EMPTY, firstValueFrom, of, Subject, takeUntil, timeout } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import * as turf from '@turf/turf';

@Component({
  selector: 'app-map',
  templateUrl: 'map.html',
  styleUrls: ['map.scss']
})
export class MapComponent implements OnInit, OnDestroy {
map!: Map;
accessToken = 'pk.eyJ1IjoiZnJtb2xsYSIsImEiOiJjbThwZjZzNDMwOXNiMmtzY213c3JwZG5zIn0.yQ_fgbNya6IUaV-s4R9iSw'; // Add your public token here
mapStyle = 'mapbox://styles/mapbox/streets-v12'
points: IPoints[] = [];
@Input() ruta: Parada[] = [];
markers: mapboxgl.Marker[] = [];

private http = inject(HttpClient);

private destroy$ = new Subject<void>();
constructor(private mapService: MapService) {}
routeMode: 'driving' | 'air' | 'auto' = 'air';

currentAnimIndex = 0;
animationFrameId: any = null;
lineGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null = null;
routeSource: mapboxgl.GeoJSONSource | null = null;

private queue: [number, number][][] = [];
private isAnimating = false;

ngOnInit(): void {
  this.initMap();
  
  this.mapService.markerAdd$.subscribe(lugar => {
    this.addMarker(lugar);
  });

  this.mapService.markerErase$.subscribe(lugar => {
    this.eraseMarker(lugar);
  });

  this.mapService.markerReorder$.subscribe(() => {
      this.markerReorder();
    });

  this.mapService.replayAnimation$.subscribe(async () => {
    if (this.points.length < 2) return;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.resetRouteLayer();

    if (this.routeMode === 'air') {
      const coords = await this.getAirRouteFromApi();
      this.animateCameraAndRouteContinuous(coords);
    }
  });
}

ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

initMap() {
  mapboxgl.accessToken = this.accessToken;

  this.map = new mapboxgl.Map({
    container: 'map',
    style: this.mapStyle,
    center: [20, 50],
    zoom: 3,
    preserveDrawingBuffer: true,
  });

  this.map.on('load', () => {
    this.renderMarkers();
    this.updateRoute();
  });
}

addMarker(lugar: Parada) {
  this.points.push({
    nombre: lugar.nombre,
    coords: [lugar.lng, lugar.lat],
    status: 'active',
    orden: lugar.pos
  });

  this.renderMarkers();

  if (this.routeMode !== 'air') {
    this.map.flyTo({
      center: [lugar.lng, lugar.lat],
      zoom: 5,
      speed: 0.75,
      curve: 1.4,
      easing: t => t,
      essential: true
    });
    return;
  }

  if (this.points.length === 1) {
    const first = this.points[0];

    this.map.flyTo({
      center: first.coords,
      zoom: 6,
      speed: 0.8,
      curve: 1.4,
      essential: true
    });

    return;
  }

  this.getAirSegmentFromApi().then(coords => {
    this.queue.push(coords);
    this.runQueue();
  });
}

private runQueue() {
  if (this.isAnimating) return;
  if (this.queue.length === 0) return;

  this.isAnimating = true;

  const next = this.queue.shift()!;

  this.animateSegment(next).then(() => {
    this.isAnimating = false;
    this.runQueue(); // sigue con siguiente segmento
  });
}

animateSegment(coords: [number, number][]): Promise<void> {
  return new Promise(resolve => {
    if (!coords || coords.length < 2) {
      resolve();
      return;
    }

    if (!this.lineGeoJSON) {
      this.lineGeoJSON = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] }
      };
    }

    if (!this.routeSource) {
      this.map.addSource('route', {
        type: 'geojson',
        data: this.lineGeoJSON
      });

      this.map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ff6b6b',
          'line-width': 4
        }
      });

      this.routeSource = this.map.getSource('route') as mapboxgl.GeoJSONSource;
    }

    let i = 0;

    const step = () => {
      if (i >= coords.length - 1) {
        resolve(); // termina segmento
        return;
      }

      const current = coords[i];
      const next = coords[i + 1];

      const bearing = turf.bearing(
        turf.point(current),
        turf.point(next)
      );

      this.lineGeoJSON!.geometry.coordinates.push(current);
      this.routeSource!.setData(this.lineGeoJSON!);

      this.map.easeTo({
        center: current,
        bearing,
        pitch: 60,
        zoom: 5,
        duration: 120
      });

      i++;
      requestAnimationFrame(step);
    };

    step();
  });
}

eraseMarker(lugar: Parada) {
  this.points = this.points.filter(p => p.nombre !== lugar.nombre);

  if (this.points.length < 2) {
    this.clearRoute();
  }

  this.updateRoute();
  this.renderMarkers();
}

markerReorder() {
    this.points = this.ruta.map((p, index) => ({
        nombre: p.nombre,
        coords: [p.lng, p.lat],
        status: 'active',
        orden: index + 1
    }));

    this.updateRoute();
    this.renderMarkers(); 
}

getAirSegmentFromApi(): Promise<[number, number][]> {
  const lastTwo = this.points.slice(-2);

  return firstValueFrom(
    this.http.post<[number, number][]>(
      'http://localhost:3000/routes/air-route',
      { points: lastTwo }
    )
  );
}

getAirRouteFromApi(): Promise<[number, number][]> {
  return firstValueFrom(
    this.http.post<[number, number][]>(
      'http://localhost:3000/routes/air-route',
      { points: this.points }
    )
  );
}

animateCameraAndRouteContinuous(coords: [number, number][]) {
  if (!coords || coords.length < 2) return;

  this.resetRouteLayer();
  this.ensureRouteLayer();

   this.currentAnimIndex = 0;

   if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
    }

    // Inicializamos línea vacía la primera vez
    if (!this.lineGeoJSON) {
        this.lineGeoJSON = {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [] }
        };
    }

    // Inicializamos fuente y capa si no existe
    if (!this.routeSource) {
        this.map.addSource('route', { type: 'geojson', data: this.lineGeoJSON });
        this.map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
                'line-color': '#ff6b6b',
                'line-width': 4,
                'line-dasharray': [2, 2],
                'line-opacity': 0.8
            }
        });
        this.routeSource = this.map.getSource('route') as mapboxgl.GeoJSONSource;
    }

    const lineGeoJSON = this.lineGeoJSON!;
    const routeSource = this.routeSource!;
    if (!lineGeoJSON || !routeSource) return;

    let i = this.currentAnimIndex;
    // Si hay una animación vieja corriendo, la destruimos.
    if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
    }
    const step = () => {
        if (i >= coords.length - 1) {
            this.currentAnimIndex = i;
            //nuevo!
            this.map.once('idle', () => {
                this.mapService.notifyAnimationFinished();
            });
            return;
        }

        const current = coords[i];
        const next = coords[i + 1];
        if (!current || !next) return;

        const bearing = turf.bearing(turf.point(current), turf.point(next));

        // Actualizamos cámara
        this.map.easeTo({
            center: [current[0], current[1]],
            bearing,
            pitch: 60,
            zoom: 5,
            duration: 50,
            easing: t => t
        });

        // Línea progresiva usando variables locales
        lineGeoJSON.geometry.coordinates.push(current);
        routeSource.setData(lineGeoJSON);

        i++;
        this.currentAnimIndex = i;

        this.animationFrameId = requestAnimationFrame(step);
    };

    step();
}

renderMarkers() {
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];

    this.points.forEach((point, index) => {
      const markerEl = this.getMarkerElement(point);
      console.debug(`index: ${index}`)

      const marker = new mapboxgl.Marker({
        element: markerEl,
        draggable: true,
      })
        .setLngLat(point.coords)
        .addTo(this.map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        this.points[index].coords = [lngLat.lng, lngLat.lat];
        console.log(`drag`)
        this.updateRoute();
      });

      this.markers.push(marker);
    });
  }

  getMarkerElement(point: IPoints): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('map-marker', point.status);

    const rawSvg = mapIcons.marker(point);

    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
    const svgElement = doc.documentElement;

    wrapper.appendChild(svgElement);
    return wrapper;
  }

  private resetRouteLayer() {
    if (this.map.getLayer('route-line')) {
      this.map.removeLayer('route-line');
    }

    if (this.map.getSource('route')) {
      this.map.removeSource('route');
    }

    this.routeSource = null;

    this.lineGeoJSON = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: []
      }
    };
  }

  private ensureRouteLayer() {
    if (this.routeSource) return;

    this.map.addSource('route', {
      type: 'geojson',
      data: this.lineGeoJSON!
    });

    this.map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#ff6b6b',
        'line-width': 4,
        'line-opacity': 0.85
      }
    });

    this.routeSource = this.map.getSource('route') as mapboxgl.GeoJSONSource;
  }

  async drawAirRoute() {
      const coords = await this.getAirSegmentFromApi();
      if(coords.length >= 2){
          this.drawRoute({ type: 'LineString', coordinates: coords });
          return coords;
      }
      return;
  }

  drawRoute(geometry: any) {
    this.resetRouteLayer();
    this.ensureRouteLayer();

    this.lineGeoJSON!.geometry = geometry;

    this.routeSource!.setData(this.lineGeoJSON!);
  }

  async updateRoute() {
    if (this.points.length < 2) {
      this.clearRoute();
      return;
    }

    if (this.routeMode === 'air') {
      const coords = await this.getAirRouteFromApi();
      this.drawRoute({
        type: 'LineString',
        coordinates: coords
      });
      return;
    }

    const coordsString = this.points.map(p => p.coords.join(',')).join(';');

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsString}?geometries=geojson&access_token=${this.accessToken}`;

    this.http.get<any>(url).pipe(
      catchError(() => {
        this.drawAirRoute();
        return EMPTY;
      })
    ).subscribe(res => {
      if (!res?.routes?.length) return;

      this.drawRoute(res.routes[0].geometry);
    });
  }

  clearRoute() {
    this.resetRouteLayer();

    this.animationFrameId = null;
    this.queue = [];
    this.isAnimating = false;
    this.currentAnimIndex = 0;
  }
}

export { Map };
