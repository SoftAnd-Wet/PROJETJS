import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SessionService {

  private url = `${environment.apiUrl}/sessions`;

  constructor(private http: HttpClient) {}

  getMesSessions(): Observable<any> {
    return this.http.get(this.url);
  }

  // ── FIX : passe dureeMax en heures au backend ──
  planifier(semaine: string, dureeMax: number = 1.5): Observable<any> {
    return this.http.post(
      `${this.url}/planifier?semaine=${semaine}&dureeMax=${dureeMax}`,
      {}
    );
  }

  demarrer(id: number): Observable<any> {
    return this.http.patch(`${this.url}/${id}/demarrer`, {});
  }

  terminer(id: number, dureeReelleMin: number = 0): Observable<any> {
    return this.http.patch(
      `${this.url}/${id}/terminer?dureeReelleMin=${dureeReelleMin}`, {}
    );
  }

  annuler(id: number): Observable<any> {
    return this.http.patch(`${this.url}/${id}/annuler`, {});
  }

  creer(data: any): Observable<any> {
    return this.http.post(this.url, data);
  }

  supprimer(id: number): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }
}