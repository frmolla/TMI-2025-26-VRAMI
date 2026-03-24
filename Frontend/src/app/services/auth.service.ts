import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly STORAGE_KEY = 'user';

    login(email: string, password: string) {
        const user = {
            type: 'user',
            email: email
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    }

    loginAsGuest() {
        const user = {
            type: 'guest'
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    }

    getUser() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    }

    isLoggedIn(): boolean {
        return this.getUser() !== null;
    }

    logout() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}