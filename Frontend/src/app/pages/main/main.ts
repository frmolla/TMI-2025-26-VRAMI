import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppConfigurator } from '@/layout/components/app.configurator';
import { AuthService } from '@/services/auth.service';
import { MapComponent } from 'public/app/map/map';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MapService } from '@/services/map.service';
import { Parada } from 'public/app/map/models/parada.model';

@Component({
    selector: 'app-main',
    standalone: true,
    imports: [MapComponent, CommonModule, FormsModule, DragDropModule],
    templateUrl: './main.html',
    styleUrl: './main.scss'
})

export class Main implements OnInit {

    private authService = inject(AuthService);
    private router = inject(Router);

    constructor(private mapService: MapService) {}

    user: any = null;

    lugarActual: string = '';
    ruta: Parada[] = [];
    sugerencias: Parada[] = [];
    timeoutId: any;

    ngOnInit() {
        // Al iniciar, verificamos si hay un usuario logueado
        this.user = this.authService.getUser();

        // Si no hay usuario (ni registrado ni invitado), mandamos al login
        if (!this.user) {
            this.router.navigate(['/auth/login']);
        }
        
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
    }

    async buscarCiudad(event: any) {
        const textoBuscado = event.target.value;

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        if (textoBuscado.length < 3) {
            this.sugerencias = [];
            return;
        }

        this.timeoutId = setTimeout(async () => {
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${textoBuscado}&limit=5&email=vrami_project@ejemplo.com`;
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                this.sugerencias = data.map((item: any) => ({
                    nombre: item.display_name,
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon)
                }));
            } catch (error) {
                console.error('Error conectando con la API de mapas:', error);
            }
        }, 500);
    }

    seleccionarSugerencia(lugar: Parada) {
        lugar.pos = this.ruta.length + 1;
        this.ruta.push(lugar);     
        
        // añadir punto de ruta
        this.mapService.addMarker(lugar);

        this.lugarActual = '';
        this.sugerencias = [];
    }

    eliminarParada(index: number) {
        const parada = this.ruta.at(index)
        if (parada){
            this.ruta.splice(index, 1);
            // eliminar punto de ruta
            this.mapService.eraseMarker(parada);
            this.mapService.reorder();
        }   
    }

    soltar(event: CdkDragDrop<Parada[]>) {
        moveItemInArray(this.ruta, event.previousIndex, event.currentIndex);

        this.ruta.forEach((p, index) => p.pos = index + 1);

        this.mapService.reorder();
    }

    onLogout() {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
    }
}