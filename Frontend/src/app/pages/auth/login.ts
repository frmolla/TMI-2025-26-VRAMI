import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { LayoutService } from '@/layout/service/layout.service';
import { AppConfigurator } from '@/layout/components/app.configurator';
import { AuthService } from '@/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, InputIcon, IconField, AppConfigurator],
    styleUrls: ['./login.scss'],
    template: `
        <div class="login-container">
            <div class="login-glass-card">
                <div class="login-header">
                    <img src="/images/pages/vrami-logo.png" alt="VRAMI Logo" class="main-logo" />
                </div>

                <div class="form-content">
                    <p-iconfield class="w-full mb-4">
                        <p-inputicon class="pi pi-envelope" />
                        <input pInputText type="email" placeholder="Email" class="glass-input" [(ngModel)]="email" name="email" />
                    </p-iconfield>

                    <p-iconfield class="w-full mb-2">
                        <p-inputicon class="pi pi-key" />
                        <input pInputText type="password" placeholder="Password" class="glass-input" [(ngModel)]="password" name="password" />
                    </p-iconfield>

                    <small *ngIf="errorMessage" class="error-msg">{{ errorMessage }}</small>

                    <div class="actions-container" style="padding-top: 25px">
                        <button pButton pRipple label="Login" class="btn-login w-full" (click)="login()"></button>
                        <button pButton pRipple severity="secondary" label="Entrar como invitado" class="btn-guest w-full" (click)="loginGuest()"></button>
                    </div>

                    <span class="signup-text"> Don’t have an account? <a routerLink="/auth/register">Sign-up here</a> </span>
                </div>

                <div class="login-footer">
                    <div class="footer-brand">
                        <span class="brand-name">VRAMI</span>
                    </div>
                    <span class="copyright">Copyright 2026</span>
                </div>
            </div>
        </div>
        <app-configurator [simple]="true" />
    `
})
export class Login {
    layoutService = inject(LayoutService);
    private authService = inject(AuthService);
    private router = inject(Router);

    email = '';
    password = '';
    errorMessage = '';

    login() {
        if (!this.email || !this.password) {
            this.errorMessage = 'Debes ingresar email y contraseña.';
            return;
        }

        this.authService.login(this.email, this.password).subscribe({
            next: () => {
                this.errorMessage = '';
                this.router.navigate(['/user']);
            },
            error: (error) => {
                this.errorMessage = error.message || 'Login failed';
            }
        });
    }

    loginGuest() {
        this.authService.loginAsGuest().subscribe({
            next: () => {
                this.errorMessage = '';
                localStorage.removeItem('access_token');

                this.router.navigate(['/']);
            },
            error: (error) => {
                this.errorMessage = 'Guest login failed';
            }
        });
    }
}
