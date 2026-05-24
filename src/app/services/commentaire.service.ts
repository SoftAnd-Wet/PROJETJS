import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CommentaireService {

  constructor(private http: HttpClient) {}

  private url(sessionId: number): string {
    return `${environment.apiUrl}/sessions/${sessionId}/commentaires`;
  }

  // GET /api/sessions/{sessionId}/commentaires
  getCommentaires(sessionId: number): Observable<any> {
    return this.http.get(this.url(sessionId));
  }

  // POST /api/sessions/{sessionId}/commentaires
  // Body: { contenu: string }
  ajouter(sessionId: number, contenu: string): Observable<any> {
    return this.http.post(this.url(sessionId), { contenu });
  }

  // DELETE /api/sessions/{sessionId}/commentaires/{id}
  supprimer(sessionId: number, commentaireId: number): Observable<any> {
    return this.http.delete(`${this.url(sessionId)}/${commentaireId}`);
  }
}