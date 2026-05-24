import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MatiereService {

  private url = `${environment.apiUrl}/matieres`;

  constructor(private http: HttpClient) {}

  getMesMatieres(): Observable<any> {
    return this.http.get(this.url);
  }

  creer(matiere: any): Observable<any> {
    return this.http.post(this.url, matiere);
  }

  modifier(id: number, matiere: any): Observable<any> {
    return this.http.put(`${this.url}/${id}`, matiere);
  }

  supprimer(id: number): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }
}