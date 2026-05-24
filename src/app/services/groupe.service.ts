import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GroupeService {

  private url = `${environment.apiUrl}/groupes`;

  constructor(private http: HttpClient) {}

  getMesGroupes(): Observable<any> {
    return this.http.get(this.url);
  }

  creer(groupe: any): Observable<any> {
    return this.http.post(this.url, groupe);
  }

  inviter(id: number, email: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/invitations?groupeId=${id}&email=${email}`, {}
    );
  }

  quitter(id: number): Observable<any> {
    return this.http.delete(`${this.url}/${id}/quitter`);
  }

  getSessionsGroupe(id: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/partages/groupe/${id}`);

  }
  getMembresGroupe(id: number): Observable<any> {
    return this.http.get(`${this.url}/${id}/membres`);
  }

  // SOLUTION : envoyer le nom dans le body de la session
  // POST /api/sessions avec { nom, debut, fin, dureePrevueMin }
  creerSession(session: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/sessions`, session);
  }

  // POST /api/partages?sessionId=&groupeId= (inchangé)
  partagerSession(sessionId: number, groupeId: number): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/partages?sessionId=${sessionId}&groupeId=${groupeId}`,
      {}
    );
  }
}