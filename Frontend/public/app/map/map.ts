import { Component, OnInit, OnDestroy, Input, inject  } from '@angular/core';
import mapboxgl, { Map } from 'mapbox-gl';
import { IPoints } from './models/points.model';
import { mapIcons } from './map-icons';
import { Parada } from './models/parada.model';
import { MapService } from '@/services/map.service';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';

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

    this.map.flyTo({
      center: [lugar.lng, lugar.lat],
      zoom: 4,           // zoom al destino
      speed: 1.2,         // velocidad de la animación
      curve: 1.4,         // como se describe la curva
      easing: (t) => t, 
      essential: true
    });
    
    this.updateRoute();
    this.renderMarkers()
}

eraseMarker(lugar: Parada){
    this.points = this.points.filter(p => p.nombre !== lugar.nombre);
    console.log(`eraseMarker`)
    
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

  updateRoute() {
    if (this.points.length < 2) {
      if (this.map.getLayer('route-line')) {
        this.map.removeLayer('route-line');
      }
      if (this.map.getSource('route')) {
        this.map.removeSource('route');
      }
      return;
    }

    const coordsString = this.points.map((p) => p.coords.join(',')).join(';');

    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsString}?geometries=geojson&access_token=${this.accessToken}`;

    this.http.get<any>(directionsUrl).subscribe((response) => {
      const routeGeoJSON = response.routes[0].geometry;

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
          geometry: routeGeoJSON,
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
          'line-color': '#3b9ddd',
          'line-width': 5,
        },
      });
    });
  }
}

export { Map };
