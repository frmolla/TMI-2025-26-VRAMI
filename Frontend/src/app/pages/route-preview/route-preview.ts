import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import mapboxgl, { Map, Marker } from 'mapbox-gl';
import * as turf from '@turf/turf';
import { AppTopbar } from '@/layout/components/app.topbar';

interface RouteLocation {
    name: string;
    country: string;
    lat: number;
    lng: number;
}

interface RouteSegment {
    from: RouteLocation;
    to: RouteLocation;
    distanceKm: number;
}

interface ProjectPreview {
    pointCount: number;
    totalDistanceKm: number;
    visitedCountriesCount: number;
    center: { lat: number; lng: number };
    segments: RouteSegment[];
}

interface ProjectEntity {
    id: string;
    name: string;
    description: string;
    animationType: string;
    speed: number;
    locations: RouteLocation[];
    preview: ProjectPreview;
    createdAt: string;
    updatedAt: string;
}

@Component({
    selector: 'app-route-preview',
    standalone: true,
    imports: [CommonModule, AppTopbar],
    template: `
        <section class="route-preview-page">
            <div app-topbar ></div>
            <div class="hero-card">
                <div>
                    <p class="eyebrow">VRAMI · Preview</p>
                    <h1>Previsualización de rutas</h1>
                    <p class="hero-copy">Globo 3D real con Mapbox · arrastra para rotar, rueda para hacer zoom.</p>
                </div>
                <button class="reload-btn" type="button" (click)="loadProjects()">Recargar</button>
            </div>

            <div class="layout-grid">
                <aside class="panel panel-projects">
                    <div class="panel-header">
                        <h2>Proyectos</h2>
                        <span class="project-counter">{{ projects().length }}</span>
                    </div>

                    <div class="project-list" *ngIf="projects().length; else emptyProjects">
                        <button
                            type="button"
                            class="project-card"
                            *ngFor="let project of projects()"
                            [class.active]="selectedProject()?.id === project.id"
                            (click)="selectProject(project)"
                        >
                            <div class="project-card-top">
                                <strong>{{ project.name }}</strong>
                                <span>#{{ project.id.slice(0, 8) }}</span>
                            </div>
                            <p>{{ project.description || 'Sin descripción' }}</p>
                            <div class="project-tags">
                                <span>{{ project.preview.pointCount }} puntos</span>
                                <span>{{ formatDistance(project.preview.totalDistanceKm) }}</span>
                            </div>
                        </button>
                    </div>
                </aside>

                <section class="content-column" *ngIf="selectedProject() as project; else emptyState">
                    <div class="panel summary-panel">
                        <div class="summary-heading">
                            <div>
                                <h2>{{ project.name }}</h2>
                                <p>{{ project.description || 'Proyecto de ruta multimedia' }}</p>
                            </div>
                            <div class="summary-badge">{{ project.animationType }}</div>
                        </div>

                        <div class="stats-grid">
                            <article class="stat-card">
                                <span class="stat-label">Puntos</span>
                                <strong class="stat-value">{{ project.preview.pointCount }}</strong>
                            </article>
                            <article class="stat-card">
                                <span class="stat-label">Distancia</span>
                                <strong class="stat-value">{{ formatDistance(project.preview.totalDistanceKm) }}</strong>
                            </article>
                            <article class="stat-card">
                                <span class="stat-label">Países</span>
                                <strong class="stat-value">{{ project.preview.visitedCountriesCount }}</strong>
                            </article>
                            <article class="stat-card">
                                <span class="stat-label">Velocidad</span>
                                <strong class="stat-value">x{{ project.speed || 1 }}</strong>
                            </article>
                        </div>
                    </div>

                    <div class="panel globe-panel">
                        <div class="panel-header with-copy">
                            <div>
                                <h2>Visualización 3D de la ruta</h2>
                                <p>Globo terráqueo real · arrastra · rueda para zoom · click derecho inclina.</p>
                            </div>
                            <button class="reset-btn" type="button" (click)="resetGlobeView()">Reset</button>
                        </div>

                        <div #globeContainer class="globe-canvas"></div>
                    </div>

                    <div class="bottom-grid">
                        <div class="panel timeline-panel">
                            <div class="panel-header with-copy">
                                <div>
                                    <h2>Ruta ordenada</h2>
                                    <p>Secuencia de ciudades recibida desde el backend.</p>
                                </div>
                            </div>

                            <div class="timeline">
                                <div class="timeline-item" *ngFor="let location of project.locations; let i = index">
                                    <div class="timeline-marker">
                                        <span>{{ i + 1 }}</span>
                                    </div>
                                    <div class="timeline-content">
                                        <strong>{{ location.name }}</strong>
                                        <span>{{ location.country }}</span>
                                        <small>{{ location.lat }}, {{ location.lng }}</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="panel segments-panel">
                            <div class="panel-header with-copy">
                                <div>
                                    <h2>Segmentos</h2>
                                    <p>Tramos del recorrido con distancia acumulada.</p>
                                </div>
                            </div>

                            <div class="segments-list">
                                <article class="segment-card" *ngFor="let segment of project.preview.segments; let i = index">
                                    <div>
                                        <span class="segment-index">{{ i + 1 }}</span>
                                        <strong>{{ segment.from.name }} → {{ segment.to.name }}</strong>
                                    </div>
                                    <span>{{ formatDistance(segment.distanceKm) }}</span>
                                </article>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <ng-template #emptyProjects>
                <div class="empty-box">
                    <p>No hay proyectos todavía.</p>
                </div>
            </ng-template>

            <ng-template #emptyState>
                <div class="panel empty-state">
                    <h2>Sin datos</h2>
                    <p>Crea un proyecto en Swagger o recarga la lista para comenzar la previsualización.</p>
                </div>
            </ng-template>
        </section>
    `,
    styles: [
        `
            :host {
                display: block;
            }

            .route-preview-page {
                min-height: 100%;
                padding: 1.5rem;
                background:
                    radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 30%),
                    radial-gradient(circle at top right, rgba(34, 211, 238, 0.14), transparent 22%),
                    linear-gradient(180deg, #020617 0%, #050816 48%, #020617 100%);
                color: #e5eefc;
            }

            .hero-card,
            .panel {
                border: 1px solid rgba(148, 163, 184, 0.2);
                background: rgba(10, 15, 28, 0.82);
                box-shadow: 0 18px 60px rgba(0, 0, 0, 0.28);
                backdrop-filter: blur(12px);
            }

            .hero-card {
                border-radius: 24px;
                padding: 1.5rem 1.6rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .eyebrow {
                margin: 0 0 0.35rem;
                font-size: 0.82rem;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: #7dd3fc;
            }

            .hero-card h1,
            .panel h2 {
                margin: 0;
                font-weight: 700;
                color: #f8fafc;
            }

            .hero-copy,
            .panel-header p,
            .summary-heading p {
                margin: 0.45rem 0 0;
                color: #94a3b8;
            }

            .reload-btn {
                border: none;
                border-radius: 16px;
                background: linear-gradient(135deg, #1d4ed8, #0f172a);
                color: #f8fafc;
                padding: 0.95rem 1.2rem;
                font-weight: 700;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                box-shadow: 0 10px 24px rgba(29, 78, 216, 0.3);
            }

            .reload-btn:hover {
                transform: translateY(-1px);
            }

            .reset-btn {
                border: 1px solid rgba(148, 163, 184, 0.3);
                background: rgba(15, 23, 42, 0.72);
                color: #e5eefc;
                padding: 0.5rem 0.9rem;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                font-size: 0.85rem;
            }

            .reset-btn:hover {
                background: rgba(30, 41, 59, 0.92);
                border-color: rgba(56, 189, 248, 0.4);
            }

            .layout-grid {
                display: grid;
                grid-template-columns: 360px minmax(0, 1fr);
                gap: 1rem;
                align-items: start;
            }

            .content-column,
            .bottom-grid {
                display: grid;
                gap: 1rem;
            }

            .bottom-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .panel {
                border-radius: 24px;
                padding: 1.25rem;
            }

            .panel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .panel-header.with-copy {
                align-items: flex-start;
            }

            .project-counter,
            .summary-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 2rem;
                padding: 0.45rem 0.8rem;
                border-radius: 999px;
                background: rgba(37, 99, 235, 0.18);
                color: #93c5fd;
                font-weight: 700;
                border: 1px solid rgba(59, 130, 246, 0.25);
            }

            .project-list,
            .segments-list,
            .timeline {
                display: grid;
                gap: 0.9rem;
            }

            .project-card,
            .segment-card {
                width: 100%;
                border: 1px solid rgba(148, 163, 184, 0.2);
                background: rgba(15, 23, 42, 0.72);
                color: #e5eefc;
                border-radius: 20px;
                padding: 1rem;
                text-align: left;
            }

            .project-card {
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .project-card:hover,
            .project-card.active {
                border-color: rgba(56, 189, 248, 0.55);
                box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.2), 0 14px 26px rgba(0, 0, 0, 0.22);
                transform: translateY(-1px);
            }

            .project-card-top,
            .segment-card,
            .summary-heading {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                align-items: flex-start;
            }

            .project-card-top strong,
            .timeline-content strong,
            .segment-card strong,
            .stat-value {
                color: #f8fafc;
            }

            .project-card p,
            .project-card span,
            .timeline-content span,
            .timeline-content small,
            .segment-card span {
                color: #94a3b8;
            }

            .project-card p {
                margin: 0.6rem 0 0.8rem;
            }

            .project-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.55rem;
            }

            .project-tags span {
                padding: 0.32rem 0.6rem;
                border-radius: 999px;
                background: rgba(30, 41, 59, 0.92);
                font-size: 0.82rem;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 0.9rem;
                margin-top: 1rem;
            }

            .stat-card {
                border-radius: 20px;
                padding: 1rem;
                background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(10, 15, 28, 0.9));
                border: 1px solid rgba(148, 163, 184, 0.16);
                min-height: 100px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }

            .stat-label {
                font-size: 0.95rem;
                color: #94a3b8;
                margin-bottom: 0.75rem;
            }

            .stat-value {
                font-size: 1.8rem;
                line-height: 1.1;
                font-weight: 800;
                color: #f8fafc;
                text-shadow: 0 2px 12px rgba(56, 189, 248, 0.15);
            }

            .globe-canvas {
                width: 100%;
                height: 480px;
                border-radius: 22px;
                overflow: hidden;
                background: #02060f;
                border: 1px solid rgba(148, 163, 184, 0.18);
            }

            .globe-canvas :global(.mapboxgl-ctrl-bottom-right),
            .globe-canvas :global(.mapboxgl-ctrl-bottom-left) {
                opacity: 0.5;
            }

            .globe-marker {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: radial-gradient(circle at 35% 30%, #f8fafc, #38bdf8 60%, #0c4a6e);
                border: 2px solid rgba(255, 255, 255, 0.9);
                box-shadow: 0 0 12px rgba(56, 189, 248, 0.8), 0 0 24px rgba(56, 189, 248, 0.4);
                cursor: pointer;
            }

            .timeline {
                position: relative;
                padding-left: 0.2rem;
            }

            .timeline-item {
                display: grid;
                grid-template-columns: 44px 1fr;
                gap: 0.8rem;
                align-items: start;
            }

            .timeline-item:not(:last-child) {
                padding-bottom: 1rem;
            }

            .timeline-marker {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: linear-gradient(180deg, #0f172a, #0b1222);
                border: 1px solid rgba(59, 130, 246, 0.28);
                display: grid;
                place-items: center;
                color: #f8fafc;
                font-weight: 700;
                position: relative;
            }

            .timeline-item:not(:last-child) .timeline-marker::after {
                content: '';
                position: absolute;
                left: 50%;
                top: 36px;
                width: 2px;
                height: calc(100% + 4px);
                transform: translateX(-50%);
                background: linear-gradient(180deg, rgba(125, 211, 252, 0.6), rgba(30, 41, 59, 0.2));
            }

            .timeline-content {
                padding-top: 0.2rem;
                display: grid;
                gap: 0.25rem;
            }

            .segment-card {
                align-items: center;
            }

            .segment-index {
                display: inline-grid;
                place-items: center;
                width: 24px;
                height: 24px;
                margin-right: 0.5rem;
                border-radius: 999px;
                background: rgba(30, 41, 59, 0.92);
                color: #7dd3fc;
                font-size: 0.8rem;
                font-weight: 700;
            }

            .empty-box,
            .empty-state {
                display: grid;
                place-items: center;
                min-height: 180px;
                text-align: center;
                color: #94a3b8;
            }

            @media (max-width: 1200px) {
                .layout-grid,
                .bottom-grid {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 860px) {
                .stats-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }

                .hero-card {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .globe-canvas {
                    height: 380px;
                }
            }

            @media (max-width: 560px) {
                .route-preview-page {
                    padding: 1rem;
                }

                .stats-grid {
                    grid-template-columns: 1fr;
                }

                .globe-canvas {
                    height: 320px;
                }
            }
        `
    ]
})
export class RoutePreviewComponent implements OnInit, AfterViewInit, OnDestroy {
    private readonly apiUrl = 'http://localhost:3000/projects';
    private readonly mapboxToken = 'pk.eyJ1IjoiZnJtb2xsYSIsImEiOiJjbThwZjZzNDMwOXNiMmtzY213c3JwZG5zIn0.yQ_fgbNya6IUaV-s4R9iSw';

    @ViewChild('globeContainer') globeContainer!: ElementRef<HTMLDivElement>;

    readonly projects = signal<ProjectEntity[]>([]);
    readonly selectedProject = signal<ProjectEntity | null>(null);

    private map: Map | null = null;
    private markers: Marker[] = [];
    private viewReady = false;

    constructor(private readonly http: HttpClient) {}

    ngOnInit(): void {
        this.loadProjects();
    }

    ngAfterViewInit(): void {
        this.viewReady = true;
        this.initGlobeIfNeeded();
    }

    ngOnDestroy(): void {
        this.clearMarkers();
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    loadProjects(): void {
        this.http.get<ProjectEntity[]>(this.apiUrl).subscribe({
            next: (projects) => {
                this.projects.set(projects);
                if (!projects.length) {
                    this.selectedProject.set(null);
                    return;
                }

                const currentId = this.selectedProject()?.id;
                const currentProject = projects.find((project) => project.id === currentId) ?? projects[0];
                this.selectedProject.set(currentProject);
                this.renderProjectOnGlobe(currentProject);
            },
            error: (error) => {
                console.error('Error loading projects', error);
                this.projects.set([]);
                this.selectedProject.set(null);
            }
        });
    }

    selectProject(project: ProjectEntity): void {
        this.selectedProject.set(project);
        this.renderProjectOnGlobe(project);
    }

    resetGlobeView(): void {
        const project = this.selectedProject();
        if (!this.map || !project) return;
        const center = project.preview?.center;
        this.map.flyTo({
            center: center ? [center.lng, center.lat] : [0, 20],
            zoom: 1.5,
            pitch: 0,
            bearing: 0,
            duration: 1200
        });
    }

    formatDistance(distanceKm: number): string {
        return `${distanceKm.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} km`;
    }

    private initGlobeIfNeeded(): void {
        if (this.map || !this.viewReady || !this.globeContainer) return;

        mapboxgl.accessToken = this.mapboxToken;

        this.map = new mapboxgl.Map({
            container: this.globeContainer.nativeElement,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            projection: { name: 'globe' } as any,
            center: [0, 20],
            zoom: 1.4,
            pitch: 0,
            bearing: 0,
            attributionControl: false
        });

        this.map.on('style.load', () => {
            if (!this.map) return;
            this.map.setFog({
                color: 'rgb(186, 210, 235)',
                'high-color': 'rgb(36, 92, 223)',
                'horizon-blend': 0.02,
                'space-color': 'rgb(11, 11, 25)',
                'star-intensity': 0.6
            } as any);

            const project = this.selectedProject();
            if (project) {
                this.renderProjectOnGlobe(project);
            }
        });
    }

    private renderProjectOnGlobe(project: ProjectEntity): void {
        if (!this.viewReady) return;
        this.initGlobeIfNeeded();
        if (!this.map) return;
        if (!this.map.isStyleLoaded()) {
            this.map.once('style.load', () => this.renderProjectOnGlobe(project));
            return;
        }

        this.clearMarkers();
        this.clearRouteLayer();

        const locations = project.locations ?? [];
        if (!locations.length) return;

        locations.forEach((location, idx) => {
            const el = document.createElement('div');
            el.className = 'globe-marker';
            el.title = `${idx + 1}. ${location.name}`;
            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([location.lng, location.lat])
                .addTo(this.map!);
            this.markers.push(marker);
        });

        if (locations.length >= 2) {
            const arcCoords: [number, number][] = [];
            for (let i = 0; i < locations.length - 1; i++) {
                const from = turf.point([locations[i].lng, locations[i].lat]);
                const to = turf.point([locations[i + 1].lng, locations[i + 1].lat]);
                const arc = turf.greatCircle(from, to, { npoints: 100 });
                arcCoords.push(...(arc.geometry.coordinates as [number, number][]));
            }

            const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: arcCoords }
            };

            this.map.addSource('route-preview-line', { type: 'geojson', data: geojson });
            this.map.addLayer({
                id: 'route-preview-line-glow',
                type: 'line',
                source: 'route-preview-line',
                layout: { 'line-cap': 'round', 'line-join': 'round' },
                paint: {
                    'line-color': '#22d3ee',
                    'line-width': 8,
                    'line-opacity': 0.25,
                    'line-blur': 4
                }
            });
            this.map.addLayer({
                id: 'route-preview-line-main',
                type: 'line',
                source: 'route-preview-line',
                layout: { 'line-cap': 'round', 'line-join': 'round' },
                paint: {
                    'line-color': '#38bdf8',
                    'line-width': 2.5
                }
            });
        }

        const center = project.preview?.center;
        this.map.flyTo({
            center: center ? [center.lng, center.lat] : [locations[0].lng, locations[0].lat],
            zoom: 1.5,
            pitch: 0,
            bearing: 0,
            duration: 1500
        });
    }

    private clearMarkers(): void {
        this.markers.forEach((m) => m.remove());
        this.markers = [];
    }

    private clearRouteLayer(): void {
        if (!this.map) return;
        ['route-preview-line-main', 'route-preview-line-glow'].forEach((id) => {
            if (this.map!.getLayer(id)) this.map!.removeLayer(id);
        });
        if (this.map.getSource('route-preview-line')) {
            this.map.removeSource('route-preview-line');
        }
    }
}
