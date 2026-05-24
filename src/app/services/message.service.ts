import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MessageService {

  constructor(private http: HttpClient) {}

  private url(groupeId: number): string {
    return `${environment.apiUrl}/groupes/${groupeId}/messages`;
  }

  getMessages(groupeId: number): Observable<any> {
    return this.http.get(this.url(groupeId));
  }

  envoyerMessage(groupeId: number, contenu: string): Observable<any> {
    return this.http.post(this.url(groupeId), { contenu });
  }

  supprimerMessage(groupeId: number, messageId: number): Observable<any> {
    return this.http.delete(`${this.url(groupeId)}/${messageId}`);
  }
}