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
import { Subscription } from 'rxjs';
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
    estaGrabando: boolean = false;
    mediaRecorder: MediaRecorder | null = null;
    videoChunks: BlobPart[] = [];
    tiempoGrabacion: number = 5;
    intervaloCronometro: any;
    animacionSub: Subscription | null = null;

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
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${textoBuscado}&limit=5&addressdetails=1&email=vrami_project@ejemplo.com`;
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                this.sugerencias = data.map((item: any) => ({
                    nombre: item.display_name,
                    pais: item.address ? item.address.country : 'Desconocido',
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
        const parada = this.ruta.at(index);
        if (parada) {
            this.ruta.splice(index, 1);
            // eliminar punto de ruta
            this.mapService.eraseMarker(parada);
            this.mapService.reorder();
        }
    }
    // Función para calcular la distancia total del itinerario
    get distanciaTotal(): number {
        if (this.ruta.length < 2) return 0;

        let total = 0;
        for (let i = 0; i < this.ruta.length - 1; i++) {
            const p1 = this.ruta[i];
            const p2 = this.ruta[i + 1];
            total += this.calcularDistanciaEntreDosPuntos(p1.lat, p1.lng, p2.lat, p2.lng);
        }
        return Math.round(total); // Redondeamos para que quede limpio
    }
    get totalPaises(): number {
        if (this.ruta.length === 0) return 0;

        // Mapeamos el país de cada parada y usamos Set para limpiar duplicados
        const paisesUnicos = new Set(this.ruta.map((punto) => punto.pais));

        return paisesUnicos.size;
    }

    // Fórmula de Haversine
    private calcularDistanciaEntreDosPuntos(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    soltar(event: CdkDragDrop<Parada[]>) {
        moveItemInArray(this.ruta, event.previousIndex, event.currentIndex);

        this.ruta.forEach((p, index) => (p.pos = index + 1));

        this.mapService.reorder();
    }

    onLogout() {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
    }

    async iniciarCaptura() {
        const canvas = document.querySelector('.mapboxgl-canvas') as HTMLCanvasElement;
        if (!canvas) return alert('No se encontró el mapa.');

        this.estaGrabando = true;
        this.tiempoGrabacion = 0;
        this.videoChunks = [];

        try {
            //fps del video
            const stream = canvas.captureStream(60);
            // Forzamos un Bitrate altísimo (8 Megabits por segundo)
            let options: MediaRecorderOptions = {
                mimeType: 'video/webm',
                videoBitsPerSecond: 8000000 // <--- LA CLAVE PARA LA CALIDAD
            };
            if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8')) {
                options.mimeType = 'video/webm; codecs=vp8';
            }
            this.mediaRecorder = new MediaRecorder(stream, options);

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) this.videoChunks.push(e.data);
            };

            this.mediaRecorder.onstop = async () => {
                const blob = new Blob(this.videoChunks, { type: 'video/webm' });
                if (blob.size < 5000) {
                    alert('Error: El vídeo está vacío. ¡El mapa no se movió!');
                    this.estaGrabando = false;
                } else {
                    await this.enviarVideoAlBackend(blob);
                    this.estaGrabando = false;
                }
            };

            // 1. Empezamos a grabar (100ms)
            this.mediaRecorder.start(100);

            // 2. Cronómetro hacia arriba (0s, 1s, 2s...)
            this.intervaloCronometro = setInterval(() => this.tiempoGrabacion++, 1000);

            // 3. Cuando el mapa llegue al destino, paramos con estilo
            this.animacionSub = this.mapService.animationFinished$.subscribe(() => {
                console.log('¡Animación 100% finalizada! Cortando grabación...');

                clearInterval(this.intervaloCronometro);

                if (this.mediaRecorder?.state !== 'inactive') {
                    this.mediaRecorder?.stop();
                }

                this.animacionSub?.unsubscribe();
            });

            // 4. ¡Disparamos la animación en el mapa!
            this.mapService.triggerAnimation();
        } catch (error) {
            console.error('Error al iniciar la grabación:', error);
            this.estaGrabando = false;
        }
    }

    async enviarVideoAlBackend(blob: Blob) {
        console.log(`Enviando vídeo para procesar...`);
        const formData = new FormData();
        formData.append('video', blob, 'captura.webm');

        try {
            const response = await fetch('http://localhost:3000/projects/1/video', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Falló la conversión en el backend');

            // 1. Recibimos la respuesta como un archivo binario (Blob)
            const mp4Blob = await response.blob();

            // 2. Creamos una URL temporal para ese archivo en la memoria del navegador
            const downloadUrl = window.URL.createObjectURL(mp4Blob);

            // 3. Creamos un enlace <a> invisible, le ponemos la URL y forzamos el clic
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = downloadUrl;
            link.download = 'Mi_Ruta_Viajera.mp4'; // El nombre que verá el usuario

            document.body.appendChild(link);
            link.click(); // ¡Esto abre la ventana de descarga del navegador!

            // 4. Limpiamos la basura para no consumir RAM
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(link);

            console.log('¡Descarga iniciada con éxito!');
        } catch (e) {
            console.error('Error al procesar/descargar el vídeo', e);
            alert('Hubo un error al generar tu MP4 final.');
        }
    }
}
