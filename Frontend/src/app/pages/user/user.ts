import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User as UserModel, UserRole, SubscriptionTier } from './models/user';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TabsModule } from 'primeng/tabs';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
@Component({
    selector: 'app-user',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, TagModule, ToastModule, DividerModule, ToggleSwitchModule, TabsModule, RippleModule],
    providers: [MessageService],
    templateUrl: './user.html',
    styleUrl: './user.scss'
})
export class User implements OnInit {
    private fb = inject(FormBuilder);
    private messageService = inject(MessageService);
    private http = inject(HttpClient);
    currentUser: UserModel = {
        id: 'usr_8f92k3j1a',
        uid: 'firebase_uid_abc123xyz',
        username: 'crisvr_dev',
        email: 'john.doe@vrami.io',
        displayName: 'John Doe',
        photoURL: `https://source.boringavatars.com/beam/120/JohnDoe`,
        role: 'admin',
        createdAt: new Date('2024-09-15'),
        lastLogin: new Date('2026-05-04T09:23:00'),
        settings: {
            theme: 'dark',
            language: 'es',
            notificationsEnabled: true,
            defaultExportFormat: 'mp4'
        },
        usage: {
            tier: 'pro',
            animationsCreated: 47,
            storageUsedBytes: 3_221_225_472,
            maxStorageLimit: 10_737_418_240
        }
    };

    profileForm!: FormGroup;
    settingsForm!: FormGroup;
    isDirty = signal(false);
    isSaving = signal(false);
    avatarPreview = signal<string | null>(null);

    themeOptions = [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'System', value: 'system' }
    ];

    languageOptions = [
        { label: 'Español', value: 'es' },
        { label: 'English', value: 'en' },
        { label: 'Français', value: 'fr' },
        { label: 'Deutsch', value: 'de' }
    ];

    exportFormatOptions = [
        { label: 'MP4', value: 'mp4', icon: 'pi pi-video' },
        { label: 'GIF', value: 'gif', icon: 'pi pi-image' },
        { label: 'WebM', value: 'webm', icon: 'pi pi-file-export' }
    ];

    roleOptions = [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Viewer', value: 'viewer' }
    ];

    ngOnInit(): void {
        this.buildForms();

        console.log('1. Llamando al backend...');

        this.http.get<any>('http://localhost:3000/users/me').subscribe({
            next: (datosReales) => {
                console.log('2. ¡Respuesta del backend recibida!', datosReales);

                // Sobreescribimos
                this.currentUser.username = datosReales.username;
                this.currentUser.displayName = datosReales.username;
                this.currentUser.email = datosReales.email;

                // Actualizamos el formulario
                this.profileForm.patchValue({
                    username: datosReales.username,
                    email: datosReales.email
                });
            },
            error: (err) => {
                console.error('2. ERROR FATAL: El backend ha rechazado la petición.', err);
            }
        });
    }

    buildForms(): void {
        this.profileForm = this.fb.group({
            displayName: [this.currentUser.displayName, [Validators.required, Validators.minLength(2)]],
            username: [this.currentUser.username, [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
            email: [this.currentUser.email, [Validators.required, Validators.email]],
            role: [this.currentUser.role]
        });

        this.settingsForm = this.fb.group({
            theme: [this.currentUser.settings.theme],
            language: [this.currentUser.settings.language],
            notificationsEnabled: [this.currentUser.settings.notificationsEnabled],
            defaultExportFormat: [this.currentUser.settings.defaultExportFormat]
        });

        this.profileForm.valueChanges.subscribe(() => this.isDirty.set(true));
        this.settingsForm.valueChanges.subscribe(() => this.isDirty.set(true));
    }

    get storagePercent(): number {
        return Math.round((this.currentUser.usage.storageUsedBytes / this.currentUser.usage.maxStorageLimit) * 100);
    }

    get storageUsedGB(): string {
        return (this.currentUser.usage.storageUsedBytes / 1_073_741_824).toFixed(1);
    }

    get storageLimitGB(): string {
        return (this.currentUser.usage.maxStorageLimit / 1_073_741_824).toFixed(0);
    }

    get storageFreeGB(): string {
        const free = this.currentUser.usage.maxStorageLimit - this.currentUser.usage.storageUsedBytes;
        return (free / 1_073_741_824).toFixed(1);
    }

    get storageColor(): string {
        const pct = this.storagePercent;
        if (pct < 50) return '#2dd4bf';
        if (pct < 80) return '#f59e0b';
        return '#ef4444';
    }

    get storageBarGradient(): string {
        const pct = this.storagePercent;
        if (pct < 50) return 'linear-gradient(90deg, #14b8a6, #2dd4bf)';
        if (pct < 80) return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
        return 'linear-gradient(90deg, #dc2626, #ef4444)';
    }

    get roleSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const map: Record<UserRole, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            admin: 'danger',
            editor: 'warn',
            viewer: 'info'
        };
        return map[this.currentUser.role];
    }

    get tierIcon(): string {
        const map: Record<SubscriptionTier, string> = {
            free: 'pi pi-user',
            pro: 'pi pi-star-fill',
            enterprise: 'pi pi-crown'
        };
        return map[this.currentUser.usage.tier];
    }

    get tierSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: Record<SubscriptionTier, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
            free: 'secondary',
            pro: 'info',
            enterprise: 'warn'
        };
        return map[this.currentUser.usage.tier];
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    getDaysSinceJoin(): number {
        const ms = Date.now() - this.currentUser.createdAt.getTime();
        return Math.floor(ms / (1000 * 60 * 60 * 24));
    }

    getPlanDescription(): string {
        const map: Record<SubscriptionTier, string> = {
            free: 'Basic access with limited storage and exports.',
            pro: 'Expanded storage, priority exports and advanced tools.',
            enterprise: 'Unlimited everything with dedicated support.'
        };
        return map[this.currentUser.usage.tier];
    }

    getProductivityScore(): number {
        const days = this.getDaysSinceJoin();
        if (days === 0) return 0;
        return Math.min(100, Math.round((this.currentUser.usage.animationsCreated / days) * 100));
    }

    onAvatarChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.avatarPreview.set(e.target?.result as string);
                this.isDirty.set(true);
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    onAvatarError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.displayName)}&background=2dd4bf&color=0f172a&size=200`;
    }

    triggerAvatarInput(): void {
        (document.getElementById('avatarInput') as HTMLInputElement)?.click();
    }

    saveChanges(): void {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Please fix the highlighted fields before saving.'
            });
            return;
        }
        this.isSaving.set(true);
        setTimeout(() => {
            this.currentUser = {
                ...this.currentUser,
                ...this.profileForm.value,
                settings: { ...this.currentUser.settings, ...this.settingsForm.value }
            };
            this.isDirty.set(false);
            this.isSaving.set(false);
            this.messageService.add({
                severity: 'success',
                summary: 'Profile Updated',
                detail: 'Your changes have been saved successfully.',
                life: 3000
            });
        }, 1500);
    }

    discardChanges(): void {
        this.buildForms();
        this.avatarPreview.set(null);
        this.isDirty.set(false);
        this.messageService.add({
            severity: 'info',
            summary: 'Changes Discarded',
            detail: 'Your profile has been reverted.',
            life: 2500
        });
    }
}
