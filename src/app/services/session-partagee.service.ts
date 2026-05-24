import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SessionPartageeService {

  // ✅ FIX : URL corrigée pour correspondre à SessionPartageeController
  // Backend expose /api/partages et non /api/sessions-partagees
  private apiUrl = `${environment.apiUrl}/partages`;

  constructor(private http: HttpClient) {}

  // POST /api/partages?sessionId=1&groupeId=2
  partager(sessionId: number, groupeId: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}?sessionId=${sessionId}&groupeId=${groupeId}`,
      {}
    );
  }

  // GET /api/partages/groupe/{groupeId}
  getSessionsPartageesParGroupe(groupeId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/groupe/${groupeId}`);
  }

  // DELETE /api/partages/{id}
  retirerPartage(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}