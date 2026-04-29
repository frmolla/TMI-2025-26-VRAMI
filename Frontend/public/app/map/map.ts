import { Component, OnInit, OnDestroy, Input, inject  } from '@angular/core';
import mapboxgl, { Map } from 'mapbox-gl';
import { IPoints } from './models/points.model';
import { mapIcons } from './map-icons';
import { Parada } from './models/parada.model';
import { MapService } from '@/services/map.service';
import { catchError, EMPTY, of, Subject, takeUntil, timeout } from 'rxjs';
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

  // NUEVO: Escuchamos la orden de animar
    this.mapService.replayAnimation$.subscribe(() => {
      if (this.points.length < 2) return;
      // 1. DETENEMOS CUALQUIER ANIMACIÓN ANTIGUA
      if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
      }

      // 2. BORRAMOS LOS DATOS VIEJOS DE LA RUTA
      if (this.lineGeoJSON) {
          this.lineGeoJSON.geometry.coordinates = []; // Limpiamos las coordenadas
          if (this.routeSource) {
              this.routeSource.setData(this.lineGeoJSON); // Actualizamos el mapa para que se vea vacío
          }
      }

      // 3. Reiniciamos el índice y lanzamos la nueva animación
      this.currentAnimIndex = 0;
      if (this.routeMode === 'air') {
          const coords = this.getAirRouteCoords();
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

  // this.map.on('click', (e) => {
  //   const coords = e.lngLat;
  //   this.points.push({ coords: [coords.lng, coords.lat], status: 'active' })
  //   console.log(`click`)
  //   this.renderMarkers()
  // });
}

addMarker(lugar: Parada){
    this.points.push({ nombre: lugar.nombre, coords: [lugar.lng, lugar.lat], status: 'active', orden: lugar.pos })
    console.log(`addMarker`)

    // setTimeout(() => {
    //   this.map.flyTo({
    //     center: [lugar.lng, lugar.lat],
    //     zoom: 5,      // zoom al destino
    //     speed: 0.75,  // velocidad de la animación
    //     curve: 1.4,   // como se describe la curva
    //     easing: (t) => t,
    //     essential: true
    //   });
    // }, 200);
    
    //this.updateRoute();
    this.renderMarkers()

    if (this.routeMode === 'air' && this.points.length >= 2) {
        const coords = this.getAirRouteCoords();
        setTimeout(() => {
            this.animateCameraAndRouteContinuous(coords);
        }, 200);
    } else {
        setTimeout(() => {
            this.map.flyTo({
                center: [lugar.lng, lugar.lat],
                zoom: 5,
                speed: 0.75,
                curve: 1.4,
                easing: t => t,
                essential: true
            });
        }, 200);
    }
}

eraseMarker(lugar: Parada){
    this.points = this.points.filter(p => p.nombre !== lugar.nombre);
    console.log(`eraseMarker`)
    
    if (this.points.length < 2) 
      this.clearRoute();
    else
      this.updateRoute();

    this.renderMarkers()
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

getAirRouteCoords(): [number, number][] {
    if (this.points.length < 2) return [];

    let fullLine: any = null;

    for (let i = 0; i < this.points.length - 1; i++) {
        const start = turf.point(this.points[i].coords);
        const end = turf.point(this.points[i + 1].coords);

        const arc = turf.greatCircle(start, end, { npoints: 150 });

        if (!fullLine) fullLine = arc;
        else fullLine.geometry.coordinates.push(...arc.geometry.coordinates);
    }

    return fullLine.geometry.coordinates as [number, number][];
}

animateCameraAndRoute(coords: [number, number][]) {
    if (!coords || coords.length < 2) return;

    // Inicializamos línea vacía
    const lineGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] }
    };

    // Añadimos fuente si no existe
    if (!this.map.getSource('route')) {
        this.map.addSource('route', { type: 'geojson', data: lineGeoJSON });
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
    }

    const routeSource = this.map.getSource('route') as mapboxgl.GeoJSONSource;

    let i = 0;

    const step = () => {
        if (i >= coords.length - 1) return;

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

        // Actualizamos línea progresiva
        lineGeoJSON.geometry.coordinates.push(current);
        routeSource.setData(lineGeoJSON); // <--- así es correcto

        i++;
        requestAnimationFrame(step);
    };

    step();
}

animateCameraAndRouteContinuous(coords: [number, number][]) {
    if (!coords || coords.length < 2) return;

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

    const lineGeoJSON = this.lineGeoJSON;
    const routeSource = this.routeSource;
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

  // drawAirRoute() {
  //   const coords = this.points.map(p => p.coords);

  //   if (coords.length >= 2) {
  //     let fullLine: any = null;

  //     for (let i = 0; i < coords.length - 1; i++) {
  //       const start = turf.point(coords[i]);
  //       const end = turf.point(coords[i + 1]);

  //       const arc = turf.greatCircle(start, end, {
  //         npoints: 150, 
  //       });

  //       if (!fullLine) {
  //         fullLine = arc;
  //       } else {
  //         fullLine.geometry.coordinates.push(...arc.geometry.coordinates);
  //       }
  //     }

  //     this.drawRoute(fullLine.geometry);
  //   }    
  // }

  drawAirRoute() {
      const coords = this.getAirRouteCoords();
      if(coords.length >= 2){
          this.drawRoute({ type: 'LineString', coordinates: coords });
          return coords;
      }
      return;
  }

  drawRoute(geometry: any) {
    if (this.map.getLayer('route-line')) {
      this.map.removeLayer('route-line');
    }
    if (this.map.getSource('route')) {
      this.map.removeSource('route');
    }

    this.map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry,
      },
    });

    this.map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': this.routeMode === 'air' ? '#ff6b6b' : '#3b9ddd',
        'line-width': 5,
        'line-dasharray': this.routeMode === 'air' ? [2, 2] : [1, 0],
      },
    });
  }

  // updateRoute() {
  //   if (this.points.length < 2) {
  //     if (this.map.getLayer('route-line')) {
  //       this.map.removeLayer('route-line');
  //     }
  //     if (this.map.getSource('route')) {
  //       this.map.removeSource('route');
  //     }
  //     return;
  //   }

  //   const coordsString = this.points.map((p) => p.coords.join(',')).join(';');

  //   const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsString}?geometries=geojson&access_token=${this.accessToken}`;

  //   this.http.get<any>(directionsUrl).subscribe((response) => {
  //     const routeGeoJSON = response.routes[0].geometry;

  //     if (this.map.getLayer('route-line')) {
  //       this.map.removeLayer('route-line');
  //     }
  //     if (this.map.getSource('route')) {
  //       this.map.removeSource('route');
  //     }

  //     this.map.addSource('route', {
  //       type: 'geojson',
  //       data: {
  //         type: 'Feature',
  //         properties: {},
  //         geometry: routeGeoJSON,
  //       },
  //     });

  //     this.map.addLayer({
  //       id: 'route-line',
  //       type: 'line',
  //       source: 'route',
  //       layout: {
  //         'line-join': 'round',
  //         'line-cap': 'round',
  //       },
  //       paint: {
  //         'line-color': '#3b9ddd',
  //         'line-width': 5,
  //       },
  //     });
  //   });
  // }

  updateRoute() {
    // menos de dos punto no es una ruta
    if (this.points.length < 2) {
      this.clearRoute();
      return;
    }

    // modo aéreo
    if (this.routeMode === 'air') {
      this.drawAirRoute();
      return;
    }

    const coordsString = this.points.map(p => p.coords.join(',')).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsString}?geometries=geojson&access_token=${this.accessToken}`;

    this.http.get<any>(url).pipe(
      timeout(this.routeMode === 'auto' ? 500 : 5000), // 👈 más tolerante si es manual
      catchError(() => {
        if (this.routeMode === 'auto') {
          this.drawAirRoute();
        }
        return EMPTY;
      })
    ).subscribe(response => {
      if (!response?.routes?.length) {
        if (this.routeMode === 'auto') {
          this.drawAirRoute();
        }
        return;
      }

      this.drawRoute(response.routes[0].geometry);
    });
  }

  clearRoute() {
    if (this.map.getLayer('route-line')) {
      this.map.removeLayer('route-line');
    }

    if (this.map.getSource('route')) {
      this.map.removeSource('route');
    }
  }
}

export { Map };
