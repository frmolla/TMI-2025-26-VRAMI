import { Component, OnInit, OnDestroy  } from '@angular/core';
import mapboxgl, { Map } from 'mapbox-gl';
import { IPoints } from './models/points.model';
import { mapIcons } from './map-icons';
import { Parada } from './models/parada.model';
import { MapService } from '@/services/map.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-map',
  templateUrl: 'map.html',
  styleUrls: ['map.scss']
})
export class MapComponent implements OnInit, OnDestroy   {
map!: Map;
accessToken = 'pk.eyJ1IjoiZnJtb2xsYSIsImEiOiJjbThwZjZzNDMwOXNiMmtzY213c3JwZG5zIn0.yQ_fgbNya6IUaV-s4R9iSw'; // Add your public token here
mapStyle = 'mapbox://styles/mapbox/streets-v12'
points: IPoints[] = [];
markers: mapboxgl.Marker[] = [];

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
  });

  // this.map.on('click', (e) => {
  //   const coords = e.lngLat;
  //   this.points.push({ coords: [coords.lng, coords.lat], status: 'active' })
  //   console.log(`click`)
  //   this.renderMarkers()
  // });
}

addMarker(lugar: Parada){
    this.points.push({ nombre: lugar.nombre, coords: [lugar.lng, lugar.lat], status: 'active' })
    console.log(`addMarker`)
    this.renderMarkers()
}

eraseMarker(lugar: Parada){
    this.points = this.points.filter(p => p.nombre !== lugar.nombre);
    console.log(`eraseMarker`)
    this.renderMarkers()
}

renderMarkers() {
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];

    this.points.forEach((point, index) => {
      const markerEl = this.getMarkerElement(point.status);
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
      });

      this.markers.push(marker);
    });
  }

  getMarkerElement(status: IPoints['status']): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('map-marker', status);

    const rawSvg = mapIcons[status] || mapIcons['inactive'];

    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
    const svgElement = doc.documentElement;

    wrapper.appendChild(svgElement);
    return wrapper;
  }
}

export { Map };
