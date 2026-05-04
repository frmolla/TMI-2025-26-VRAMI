import { Injectable } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Parada } from 'public/app/map/models/parada.model';

@Injectable({
    providedIn: 'root'
})
export class MapService {
    private markerAdd = new Subject<Parada>();
    private markerErase = new Subject<Parada>();
    private markerReorder = new Subject<void>();

    // 1. Canal para la orden de volver a animar
    private replayAnimation = new Subject<void>();
    // 2. Canal para avisar de que la animación ha terminado
    private animationFinished = new Subject<void>();

    markerAdd$ = this.markerAdd.asObservable();
    markerErase$ = this.markerErase.asObservable();
    markerReorder$ = this.markerReorder.asObservable();
    animationFinished$ = this.animationFinished.asObservable();
    replayAnimation$ = this.replayAnimation.asObservable();

    addMarker(lugar: Parada) {
        this.markerAdd.next(lugar);
    }

    eraseMarker(lugar: Parada) {
        this.markerErase.next(lugar);
    }

    reorder() {
        this.markerReorder.next();
    }

    // Funciones para disparar los nuevos eventos
    triggerAnimation() {
        this.replayAnimation.next();
    }

    notifyAnimationFinished() {
        this.animationFinished.next();
    }
}
