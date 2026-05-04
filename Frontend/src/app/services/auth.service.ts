import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    isGuest: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';
  private tokenKey = 'access_token';
  private userKey = 'user';

  private http = inject(HttpClient);
  private userSubject = new BehaviorSubject<any>(this.getStoredUser());
  user$ = this.userSubject.asObservable();

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response: AuthResponse) => {
          if (response.access_token) {
            localStorage.setItem(this.tokenKey, response.access_token);
            localStorage.setItem(this.userKey, JSON.stringify(response.user));
            this.userSubject.next(response.user);
          }
        }),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Login failed'));
        })
      );
  }

  register(email: string, password: string, firstName?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, { email, password, firstName })
      .pipe(
        tap((response: AuthResponse) => {
          if (response.access_token) {
            localStorage.setItem(this.tokenKey, response.access_token);
            localStorage.setItem(this.userKey, JSON.stringify(response.user));
            this.userSubject.next(response.user);
          }
        }),
        catchError(error => throwError(() => new Error(error.error?.message || 'Registration failed')))
      );
  }

  loginAsGuest(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/guest`, {})
      .pipe(
        tap((response: AuthResponse) => {
          if (response.access_token) {
            localStorage.setItem(this.tokenKey, response.access_token);
            localStorage.setItem(this.userKey, JSON.stringify(response.user));
            this.userSubject.next(response.user);
          }
        }),
        catchError(error => throwError(() => new Error('Guest login failed')))
      );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getStoredUser(): any {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.userSubject.next(null);
  }
}