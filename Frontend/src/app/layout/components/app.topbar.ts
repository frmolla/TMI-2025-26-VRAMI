import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
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

        <button type="button" class="topbar-icon-btn topbar-logout-btn" title="Cerrar sesión" (click)="onLogout()">
            <i class="pi pi-sign-out"></i>
        </button>
    `,
    host: { class: 'layout-topbar' }
})
export class AppTopbar {
    @ViewChild('menubutton') menuButton!: ElementRef<HTMLElement>;
    router = inject(Router);
    el = inject(ElementRef);

    constructor(public layoutService: LayoutService) {}

    onMenuButtonClick() {
        this.layoutService.onMenuToggle();
    }
    onLogout() {
        // A. Borramos el token JWT (Asegúrate de que 'token' es el nombre que usaste al guardarlo)
        localStorage.removeItem('token'); 
        
        // B. (Opcional) Si guardaste más cosas, como datos del usuario, bórralos también
        // localStorage.removeItem('user'); 

        // C. Redirigimos a la pantalla de login (cambia '/login' por la ruta real de tu login)
        this.router.navigate(['/auth/login']); 
    }
}
