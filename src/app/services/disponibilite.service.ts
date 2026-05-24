import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DisponibiliteService {

  private url = `${environment.apiUrl}/disponibilites`;

  constructor(private http: HttpClient) {}

  getMesDisponibilites(): Observable<any> {
    return this.http.get(this.url);
  }

  creer(dispo: any): Observable<any> {
    return this.http.post(this.url, dispo);
  }

  supprimer(id: number): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }
}