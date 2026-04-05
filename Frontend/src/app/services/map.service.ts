import { Injectable } from '@angular/core';
import { Subject, takeUntil  } from 'rxjs';
import { Parada } from 'public/app/map/models/parada.model';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  private markerAdd = new Subject<Parada>();
  private markerErase = new Subject<Parada>();
  private markerReorder = new Subject<void>();
  markerAdd$ = this.markerAdd.asObservable();
  markerErase$ = this.markerErase.asObservable();
  markerReorder$ = this.markerReorder.asObservable();

  addMarker(lugar: Parada) {
    this.markerAdd.next(lugar);
  }

  eraseMarker(lugar: Parada) {
    this.markerErase.next(lugar);
  }

  reorder() {
    this.markerReorder.next();
  }
}