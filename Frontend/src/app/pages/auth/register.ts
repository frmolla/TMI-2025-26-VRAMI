import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { RippleModule } from 'primeng/ripple';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { AppConfigurator } from '@/layout/components/app.configurator';
import { AuthService } from '@/services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        CommonModule, ButtonModule, CheckboxModule, InputTextModule,
        FormsModule, RouterModule, RippleModule,
        InputIcon, IconField, AppConfigurator
    ],
    styleUrls: ['./register.scss'],
    template: `
        <div class="register-container">
            <div class="register-glass-card">

                <div class="register-header">
                    <img src="/images/pages/vrami-logo.png" alt="VRAMI Logo" class="main-logo">
                </div>

                <h2 style="color: white; margin: 0 0 0.5rem 0; font-size: 1.5rem;">Crear Cuenta</h2>
                <p style="color: rgba(255,255,255,0.5); margin-bottom: 1.5rem; font-size: 0.9rem;">Regístrate para empezar</p>

                <div class="form-content">
                    <p-iconfield class="w-full mb-4">
                        <p-inputicon class="pi pi-user" />
                        <input pInputText type="text" placeholder="Nombre" class="glass-input" [(ngModel)]="firstName" name="firstName" />
                    </p-iconfield>

                    <p-iconfield class="w-full mb-4">
                        <p-inputicon class="pi pi-envelope" />
                        <input pInputText type="email" placeholder="Email" class="glass-input" [(ngModel)]="email" name="email" />
                    </p-iconfield>

                    <p-iconfield class="w-full mb-4">
                        <p-inputicon class="pi pi-key" />
                        <input pInputText type="password" placeholder="Password (mín. 6 caracteres)" class="glass-input" [(ngModel)]="password" name="password" />
                    </p-iconfield>

                    <small *ngIf="errorMessage" class="error-msg">{{ errorMessage }}</small>
                    <small *ngIf="successMessage" class="success-msg">{{ successMessage }}</small>

                    <div class="terms-container">
                        <p-checkbox [(ngModel)]="confirmed" binary inputId="terms" />
                        <label for="terms">He leído los <span class="terms-link">Términos y Condiciones</span></label>
                    </div>

                    <div class="actions-container">
                        <button pButton pRipple label="Registrarse" class="btn-register w-full" (click)="onSubmit()"></button>
                        <button pButton pRipple severity="secondary" label="Cancelar" class="btn-cancel w-full" routerLink="/auth/login"></button>
                    </div>

                    <span class="login-link" style="margin-top: 1rem;">
                        ¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión aquí</a>
                    </span>
                </div>

                <div class="register-footer">
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
export class Register {
    private authService = inject(AuthService);
    private router = inject(Router);

    firstName: string = '';
    email: string = '';
    password: string = '';
    confirmed: boolean = false;
    errorMessage: string = '';
    successMessage: string = '';

    onSubmit() {
        this.errorMessage = '';
        this.successMessage = '';

        if (!this.firstName) {
            this.errorMessage = 'El nombre es obligatorio.';
            return;
        }

        if (!this.email || !this.email.includes('@')) {
            this.errorMessage = 'Ingresa un email válido.';
            return;
        }

        if (!this.password || this.password.length < 6) {
            this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
            return;
        }

        if (!this.confirmed) {
            this.errorMessage = 'Debes aceptar los términos y condiciones.';
            return;
        }

        this.authService.register(this.email, this.password, this.firstName).subscribe({
            next: () => {
                this.successMessage = '¡Registro exitoso!';
                this.router.navigate(['/']);
            },
            error: (error) => {
                this.errorMessage = error.message || 'Error al registrarse.';
            }
        });
    }
}