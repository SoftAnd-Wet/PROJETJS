import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SessionDTO {
  id: number;
  debut: string;
  fin: string;
  dureePrevueMin: number;
  dureeReelleMin: number;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  completee: boolean;
  matiereId: number;
  matiereNom: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private apiUrl = 'http://localhost:8081/api/sessions';

  constructor(private http: HttpClient) {}

  getMesSessions(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}
