import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
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

interface GlobePoint {
    x: number;
    y: number;
    visible: boolean;
    location: RouteLocation;
    index: number;
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
                    <p class="hero-copy">Vista previa conectada al backend con estadísticas, segmentos y una visualización tipo globo 3D.</p>
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
                                <span>#{{ project.id }}</span>
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
                                <p>Globo estilizado con proyección ortográfica y arcos de vuelo.</p>
                            </div>
                        </div>

                        <div class="globe-stage">
                            <div class="globe-back-glow"></div>
                            <div class="globe-shell"></div>
                            <svg class="globe-svg" viewBox="0 0 700 420" aria-label="3D route preview">
                                <defs>
                                    <radialGradient id="oceanGlow" cx="50%" cy="42%" r="65%">
                                        <stop offset="0%" stop-color="#2563eb" stop-opacity="0.45"></stop>
                                        <stop offset="55%" stop-color="#0f172a" stop-opacity="0.25"></stop>
                                        <stop offset="100%" stop-color="#020617" stop-opacity="0"></stop>
                                    </radialGradient>
                                    <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stop-color="#22d3ee"></stop>
                                        <stop offset="100%" stop-color="#38bdf8"></stop>
                                    </linearGradient>
                                    <filter id="softGlow">
                                        <feGaussianBlur stdDeviation="3.5" result="blur"></feGaussianBlur>
                                        <feMerge>
                                            <feMergeNode in="blur"></feMergeNode>
                                            <feMergeNode in="SourceGraphic"></feMergeNode>
                                        </feMerge>
                                    </filter>
                                </defs>

                                <ellipse cx="350" cy="210" rx="146" ry="146" class="sphere-shadow"></ellipse>
                                <circle cx="350" cy="210" r="146" class="sphere-outline"></circle>
                                <circle cx="350" cy="210" r="146" fill="url(#oceanGlow)"></circle>

                                <g class="globe-graticule">
                                    <ellipse cx="350" cy="210" rx="146" ry="146"></ellipse>
                                    <ellipse cx="350" cy="210" rx="110" ry="146"></ellipse>
                                    <ellipse cx="350" cy="210" rx="70" ry="146"></ellipse>
                                    <ellipse cx="350" cy="210" rx="35" ry="146"></ellipse>
                                    <path d="M204 210 H496"></path>
                                    <path d="M224 155 C280 145, 420 145, 476 155"></path>
                                    <path d="M224 265 C280 275, 420 275, 476 265"></path>
                                    <path d="M250 120 C300 105, 400 105, 450 120"></path>
                                    <path d="M250 300 C300 315, 400 315, 450 300"></path>
                                </g>

                                <g class="route-group" filter="url(#softGlow)">
                                    <path *ngFor="let path of globePaths()" [attr.d]="path" class="route-path route-path-glow"></path>
                                    <path *ngFor="let path of globePaths()" [attr.d]="path" class="route-path route-path-main"></path>
                                </g>

                                <g class="point-group">
                                    <g *ngFor="let point of globePoints()">
                                        <circle *ngIf="point.visible" [attr.cx]="point.x" [attr.cy]="point.y" r="6" class="route-point-core"></circle>
                                        <circle *ngIf="point.visible" [attr.cx]="point.x" [attr.cy]="point.y" r="12" class="route-point-ring"></circle>
                                        <text *ngIf="point.visible" [attr.x]="point.x + 14" [attr.y]="point.y - 10" class="route-label">
                                            {{ point.location.name }}
                                        </text>
                                    </g>
                                </g>
                            </svg>
                        </div>
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

            .globe-stage {
                position: relative;
                min-height: 420px;
                border-radius: 26px;
                overflow: hidden;
                background:
                    radial-gradient(circle at 30% 28%, rgba(59, 130, 246, 0.18), transparent 22%),
                    radial-gradient(circle at 70% 18%, rgba(34, 211, 238, 0.12), transparent 18%),
                    linear-gradient(180deg, rgba(4, 8, 20, 0.98), rgba(2, 6, 23, 1));
                border: 1px solid rgba(148, 163, 184, 0.16);
            }

            .globe-back-glow {
                position: absolute;
                inset: 10% 18%;
                background: radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 62%);
                filter: blur(30px);
            }

            .globe-shell {
                position: absolute;
                left: 50%;
                top: 50%;
                width: 292px;
                height: 292px;
                transform: translate(-50%, -50%);
                border-radius: 50%;
                background:
                    radial-gradient(circle at 32% 30%, rgba(255, 255, 255, 0.3), transparent 18%),
                    radial-gradient(circle at 42% 38%, rgba(125, 211, 252, 0.18), transparent 26%),
                    linear-gradient(180deg, rgba(30, 64, 175, 0.14), rgba(2, 6, 23, 0));
                box-shadow:
                    inset -28px -30px 60px rgba(2, 6, 23, 0.76),
                    inset 16px 16px 42px rgba(96, 165, 250, 0.12);
            }

            .globe-svg {
                position: relative;
                width: 100%;
                height: 420px;
                z-index: 2;
            }

            .sphere-shadow {
                fill: rgba(8, 15, 34, 0.25);
            }

            .sphere-outline {
                fill: none;
                stroke: rgba(148, 163, 184, 0.18);
                stroke-width: 1.2;
            }

            .globe-graticule ellipse,
            .globe-graticule path {
                fill: none;
                stroke: rgba(148, 163, 184, 0.14);
                stroke-width: 1;
            }

            .route-path {
                fill: none;
                stroke-linecap: round;
                stroke-linejoin: round;
            }

            .route-path-glow {
                stroke: rgba(34, 211, 238, 0.25);
                stroke-width: 8;
            }

            .route-path-main {
                stroke: url(#routeGlow);
                stroke-width: 3.2;
                stroke-dasharray: 10 8;
                animation: dashMove 18s linear infinite;
            }

            .route-point-core {
                fill: #f8fafc;
                stroke: #38bdf8;
                stroke-width: 2.5;
            }

            .route-point-ring {
                fill: rgba(56, 189, 248, 0.08);
                stroke: rgba(56, 189, 248, 0.34);
                stroke-width: 1.2;
            }

            .route-label {
                fill: #e2e8f0;
                font-size: 12px;
                font-weight: 600;
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

            @keyframes dashMove {
                from {
                    stroke-dashoffset: 0;
                }
                to {
                    stroke-dashoffset: -360;
                }
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
            }

            @media (max-width: 560px) {
                .route-preview-page {
                    padding: 1rem;
                }

                .stats-grid {
                    grid-template-columns: 1fr;
                }

                .globe-stage,
                .globe-svg {
                    min-height: 320px;
                    height: 320px;
                }
            }
        `
    ]
})
export class RoutePreviewComponent implements OnInit {
    private readonly apiUrl = 'http://localhost:3000/projects';

    readonly projects = signal<ProjectEntity[]>([]);
    readonly selectedProject = signal<ProjectEntity | null>(null);

    readonly globePoints = computed(() => {
        const project = this.selectedProject();
        if (!project) {
            return [] as GlobePoint[];
        }

        const centerLng = project.preview?.center?.lng ?? 0;

        return project.locations.map((location, index) => this.projectLocationToGlobe(location, index, centerLng));
    });

    readonly globePaths = computed(() => {
        const points = this.globePoints().filter((point) => point.visible);
        const paths: string[] = [];

        for (let i = 0; i < points.length - 1; i++) {
            paths.push(this.buildArcPath(points[i], points[i + 1]));
        }

        return paths;
    });

    constructor(private readonly http: HttpClient) {}

    ngOnInit(): void {
        this.loadProjects();
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
    }

    formatDistance(distanceKm: number): string {
        return `${distanceKm.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} km`;
    }

    private projectLocationToGlobe(location: RouteLocation, index: number, centerLng: number): GlobePoint {
        const radius = 146;
        const cx = 350;
        const cy = 210;
        const degToRad = Math.PI / 180;

        const lambda = (location.lng - centerLng) * degToRad;
        const phi = location.lat * degToRad;

        const x = radius * Math.cos(phi) * Math.sin(lambda);
        const y = -radius * Math.sin(phi);
        const z = radius * Math.cos(phi) * Math.cos(lambda);

        return {
            x: cx + x,
            y: cy + y,
            visible: z >= 0,
            location,
            index
        };
    }

    private buildArcPath(from: GlobePoint, to: GlobePoint): string {
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const lift = Math.max(26, distance * 0.22);

        return `M ${from.x} ${from.y} Q ${mx} ${my - lift} ${to.x} ${to.y}`;
    }
}