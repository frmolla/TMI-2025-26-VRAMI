import { Component, ElementRef, inject, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // 1. IMPORTANTE: Necesario para usar *ngIf
import { RouterModule, Router } from '@angular/router';
import { LayoutService } from '@/layout/service/layout.service';

@Component({
    selector: '[app-topbar]',
    standalone: true,
    imports: [RouterModule, CommonModule], // 2. Añadido CommonModule
    template: `
        <nav class="topbar-nav">
            <!-- Inicio lo ven TODOS (Usuarios e Invitados) -->
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="topbar-nav-link">
                <i class="pi pi-home"></i>
                <span>Inicio</span>
            </a>

            <!-- Estas opciones SOLO las ven los usuarios con sesión iniciada -->
            <ng-container *ngIf="isLogged">
                <a routerLink="/route-preview" routerLinkActive="active" class="topbar-nav-link">
                    <i class="pi pi-map"></i>
                    <span>Mis Rutas</span>
                </a>
                <a routerLink="/user" routerLinkActive="active" class="topbar-nav-link">
                    <i class="pi pi-sliders"></i>
                    <span>Configuración</span>
                </a>
            </ng-container>
        </nav>

        <button type="button" class="topbar-icon-btn topbar-logout-btn" title="Cerrar sesión" (click)="onLogout()">
            <i class="pi pi-sign-out"></i>
        </button>
    `,
    host: { class: 'layout-topbar' }
})
export class AppTopbar {
    @ViewChild('menubutton') menuButton!: ElementRef<HTMLElement>;

    el = inject(ElementRef);
    router = inject(Router);

    constructor(public layoutService: LayoutService) {}

    get isLogged(): boolean {
        return !!localStorage.getItem('access_token');
    }

    onMenuButtonClick() {
        this.layoutService.onMenuToggle();
    }

    onLogout() {
        localStorage.removeItem('access_token');
        this.router.navigate(['/auth/login']);
    }
}
