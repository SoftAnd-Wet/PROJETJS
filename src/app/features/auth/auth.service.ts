import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';

export interface UserInfo {
  id: number;
  nom: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8081/api/auth';

  // undefined = still checking, null = not logged in
  private currentUserSubject = new BehaviorSubject<UserInfo | null | undefined>(undefined);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<UserInfo> {
    return this.http.post<UserInfo>(`${this.apiUrl}/login`, { email, password })
      .pipe(tap(user => this.currentUserSubject.next(user)));
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {})
      .pipe(tap(() => this.currentUserSubject.next(null)));
  }

  // Call this on app startup to restore session
  fetchCurrentUser(): Observable<UserInfo | null> {
    return this.http.get<UserInfo>(`${this.apiUrl}/me`)
      .pipe(
        tap(user => this.currentUserSubject.next(user)),
        catchError(() => {
          this.currentUserSubject.next(null);
          return of(null);
        })
      );
  }

  get currentUser(): UserInfo | null | undefined {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null &&
      this.currentUserSubject.value !== undefined;
  }

  hasRole(role: string): boolean {
    return this.currentUserSubject.value?.role === role;
  }
  register(nom: string, email: string, password: string): Observable<UserInfo> {
    return this.http.post<UserInfo>(`${this.apiUrl}/register`, { nom, email, password });
  }
}
