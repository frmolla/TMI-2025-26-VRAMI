import { Component, OnDestroy, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AppTopbar } from './app.topbar';
import { LayoutService } from '@/layout/service/layout.service';
import { AppConfigurator } from './app.configurator';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AppProfileMenu } from './app.profilemenu';

@Component({
    selector: 'app-simple-layout',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    imports: [CommonModule, AppTopbar, RouterModule, AppConfigurator, ToastModule, AppProfileMenu],
    template: `
        <div class="layout-container" [ngClass]="containerClass">
            <div class="app-layout-content-wrapper">
                <div class="topbar-row">
                    <div app-topbar></div>
                </div>

                <div class="app-layout-content">
                    <router-outlet></router-outlet>
                </div>

                <div class="app-layout-mask"></div>
            </div>
            <app-profile-menu />
            <app-configurator />
            <p-toast />
        </div>
    `,
    providers: [MessageService]
})
export class AppSimpleLayout implements OnDestroy {
    routerSubscription: Subscription;

    @ViewChild(AppTopbar) appTopbar!: AppTopbar;

    constructor(
        public layoutService: LayoutService,
        public renderer: Renderer2,
        public router: Router
    ) {
        this.routerSubscription = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {});
    }

    get containerClass() {
        const layoutConfig = this.layoutService.layoutConfig();
        return {
            'layout-light': !layoutConfig.darkTheme,
            'layout-dark': layoutConfig.darkTheme,
            'layout-horizontal': true
        };
    }

    ngOnDestroy() {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }
}
