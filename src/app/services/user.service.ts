import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  getMonProfil(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profil`);
  }

  modifierProfil(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profil`, data);
  }

  changerMotDePasse(data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/mot-de-passe`, data);
  }

  supprimerCompte(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/compte`);
  }
}