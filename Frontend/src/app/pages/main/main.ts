import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppConfigurator } from '@/layout/components/app.configurator';
import { AuthService } from '@/services/auth.service';
import { MapComponent } from 'public/app/map/map';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
export interface Parada {
    nombre: string;
    lat: number;
    lng: number;
}

@Component({
    selector: 'app-main',
    imports: [MapComponent, CommonModule, FormsModule, DragDropModule],
    templateUrl: './main.html',
    styleUrl: './main.scss'
})
export class Main {
    lugarActual: string = '';
    ruta: Parada[] = [];
    sugerencias: Parada[] = [];
    timeoutId: any;

    async buscarCiudad(event: any) {
        const textoBuscado = event.target.value;

        // Si el usuario sigue tecleando, cancelamos la cuenta atrás anterior
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        if (textoBuscado.length < 3) {
            this.sugerencias = [];
            return;
        }
        // Iniciamos una nueva cuenta atrás de 500 milisegundos (medio segundo)
        this.timeoutId = setTimeout(async () => {
            try {
                // seañade un email inventado al final de la URL (requisito de Nominatim para no bloquearte)
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${textoBuscado}&limit=5&email=vrami_project@ejemplo.com`;

                const response = await fetch(url);

                // Si el servidor nos da un error (ej. 403 Forbidden), lanzamos el aviso
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
        this.ruta.push(lugar);
        this.lugarActual = '';
        this.sugerencias = [];
    }

    eliminarParada(index: number) {
        this.ruta.splice(index, 1);
    }

    soltar(event: CdkDragDrop<Parada[]>) {
        moveItemInArray(this.ruta, event.previousIndex, event.currentIndex);
    }
}
