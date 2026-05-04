import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LayoutService } from '@/layout/service/layout.service';

@Component({
    selector: '[app-topbar]',
    standalone: true,
    imports: [RouterModule],
    template: `
        <nav class="topbar-nav">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="topbar-nav-link">
                <i class="pi pi-home"></i>
                <span>Inicio</span>
            </a>
            <a routerLink="/route-preview" routerLinkActive="active" class="topbar-nav-link">
                <i class="pi pi-map"></i>
                <span>Mis Rutas</span>
            </a>
            <a routerLink="/user" routerLinkActive="active" class="topbar-nav-link">
                <i class="pi pi-sliders"></i>
                <span>Configuración</span>
            </a>
        </nav>

        <button type="button" class="topbar-icon-btn topbar-logout-btn" title="Cerrar sesión">
            <i class="pi pi-sign-out"></i>
        </button>
    `,
    host: { class: 'layout-topbar' }
})
export class AppTopbar {
    @ViewChild('menubutton') menuButton!: ElementRef<HTMLElement>;

    el = inject(ElementRef);

    constructor(public layoutService: LayoutService) {}

    onMenuButtonClick() {
        this.layoutService.onMenuToggle();
    }
}
