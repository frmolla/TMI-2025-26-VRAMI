import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Usamos sessionStorage para que se borre SOLO al cerrar la pestaña
    private readonly STORAGE_KEY = 'user';

    login(email: string, password: string) {
        const user = {
            type: 'user',
            email: email
        };

        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    }

    loginAsGuest() {
        const user = {
            type: 'guest'
        };

        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    }

    getUser() {
        const data = sessionStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    }

    isLoggedIn(): boolean {
        return this.getUser() !== null;
    }

    logout() {
        sessionStorage.removeItem(this.STORAGE_KEY);
    }
}