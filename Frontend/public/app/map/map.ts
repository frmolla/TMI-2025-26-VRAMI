import { AfterViewInit, Component } from '@angular/core';
import mapboxgl, { Map } from 'mapbox-gl';

@Component({
  selector: 'app-map',
  templateUrl: 'map.html',
  styleUrls: ['map.scss']
})
export class MapComponent implements AfterViewInit {
map!: Map;
accessToken = 'pk.eyJ1IjoiZnJtb2xsYSIsImEiOiJjbThwZjZzNDMwOXNiMmtzY213c3JwZG5zIn0.yQ_fgbNya6IUaV-s4R9iSw'; // Add your public token here
mapStyle = 'mapbox://styles/mapbox/streets-v12'

ngAfterViewInit(): void {
    mapboxgl.accessToken = this.accessToken;
    this.map = new mapboxgl.Map({
      container: 'map', // matches the div ID
      style: this.mapStyle,
      center: [20, 50], // [lng, lat]
      zoom: 3,
    });
  }
}