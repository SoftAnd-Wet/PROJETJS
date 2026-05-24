import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvitationGroupeService {

  private url = `${environment.apiUrl}/invitations`;

  constructor(private http: HttpClient) {}

  envoyerInvitation(groupeId: number, email: string): Observable<any> {
    return this.http.post(
      `${this.url}?groupeId=${groupeId}&email=${email}`, {}
    );
  }

  getMesInvitations(): Observable<any> {
    return this.http.get(this.url);
  }

  getMesInvitationsEnAttente(): Observable<any> {
    return this.http.get(`${this.url}/en-attente`);
  }

  accepterInvitation(id: number): Observable<any> {
    return this.http.patch(`${this.url}/${id}/accepter`, {});
  }

  refuserInvitation(id: number): Observable<any> {
    return this.http.patch(`${this.url}/${id}/refuser`, {});
  }
}