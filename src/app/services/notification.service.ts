import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface NotifUI {
  id:        number;
  message:   string;
  type:      string;
  lue:       boolean;
  envoyeeLe: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private _nbNonLues  = new BehaviorSubject<number>(0);
  private _notifs     = new BehaviorSubject<NotifUI[]>([]);
  private _modal      = new BehaviorSubject<boolean>(false);
  private _chargement = new BehaviorSubject<boolean>(false);

  nbNonLues$  = this._nbNonLues.asObservable();
  notifs$     = this._notifs.asObservable();
  modal$      = this._modal.asObservable();
  chargement$ = this._chargement.asObservable();

  constructor(private http: HttpClient) {
    this.chargerCount();
    interval(30000).subscribe(() => this.chargerCount());
  }

  chargerCount(): void {
    // ✅ Compte notifs + invitations en attente
    forkJoin({
      notifs:      this.http.get<any>(`${environment.apiUrl}/notifications/count`)
                       .pipe(catchError(() => of(0))),
      invitations: this.http.get<any>(`${environment.apiUrl}/invitations`)
                       .pipe(catchError(() => of({ data: [] })))
    }).subscribe({
      next: ({ notifs, invitations }) => {
        const nbNotifs = notifs?.data ?? notifs ?? 0;
        const invData: any[] = invitations?.data ?? invitations ?? [];
        const nbInvitEnAttente = invData.filter((i: any) => i.statut === 'EN_ATTENTE').length;
        this._nbNonLues.next(Number(nbNotifs) + nbInvitEnAttente);
      },
      error: () => {}
    });
  }

  ouvrirModal(): void {
    this._modal.next(true);
    this._chargement.next(true);

    // ✅ Charge notifs + invitations ensemble
    forkJoin({
      notifs:      this.http.get<any>(`${environment.apiUrl}/notifications`)
                       .pipe(catchError(() => of({ data: [] }))),
      invitations: this.http.get<any>(`${environment.apiUrl}/invitations`)
                       .pipe(catchError(() => of({ data: [] })))
    }).subscribe({
      next: ({ notifs, invitations }) => {
        const notifsData: any[]  = notifs?.data ?? notifs ?? [];
        const invitData: any[]   = invitations?.data ?? invitations ?? [];

        // ✅ Convertir les invitations EN_ATTENTE en notifs
        const invitNotifs: NotifUI[] = invitData
          .filter((i: any) => i.statut === 'EN_ATTENTE')
          .map((i: any) => ({
            id:        -(i.id),  // id négatif pour distinguer
            message:   `${i.emetteurNom} vous invite à rejoindre "${i.groupeNom}"`,
            type:      'INVITATION_GROUPE',
            lue:       false,
            envoyeeLe: i.creeLe
          }));

        // ✅ Fusionner et trier par date décroissante
        const toutes: NotifUI[] = [...notifsData, ...invitNotifs]
          .sort((a, b) =>
            new Date(b.envoyeeLe).getTime() - new Date(a.envoyeeLe).getTime()
          );

        this._notifs.next(toutes);
        this._nbNonLues.next(toutes.filter(n => !n.lue).length);
        this._chargement.next(false);
      },
      error: () => this._chargement.next(false)
    });
  }

  fermerModal(): void {
    this._modal.next(false);
  }

  marquerLue(id: number): void {
    // Invitations ont id négatif — pas d'appel API
    if (id < 0) {
      const notifs = this._notifs.value.map(n =>
        n.id === id ? { ...n, lue: true } : n
      );
      this._notifs.next(notifs);
      this._nbNonLues.next(notifs.filter(n => !n.lue).length);
      return;
    }

    this.http.patch<any>(`${environment.apiUrl}/notifications/${id}/lire`, {}).subscribe({
      next: () => {
        const notifs = this._notifs.value.map(n =>
          n.id === id ? { ...n, lue: true } : n
        );
        this._notifs.next(notifs);
        this._nbNonLues.next(notifs.filter(n => !n.lue).length);
      },
      error: () => {}
    });
  }

  marquerToutesLues(): void {
    this.http.patch<any>(`${environment.apiUrl}/notifications/lire-toutes`, {}).subscribe({
      next: () => {
        const notifs = this._notifs.value.map(n => ({ ...n, lue: true }));
        this._notifs.next(notifs);
        this._nbNonLues.next(0);
      },
      error: () => {}
    });
  }

  accepterInvitation(invitationId: number): void {
    // id négatif → vrai id = Math.abs(id)
    const realId = Math.abs(invitationId);
    this.http.patch<any>(`${environment.apiUrl}/invitations/${realId}/accepter`, {}).subscribe({
      next: () => {
        // Supprimer la notif invitation du modal
        const notifs = this._notifs.value.filter(n => n.id !== invitationId);
        this._notifs.next(notifs);
        this._nbNonLues.next(notifs.filter(n => !n.lue).length);
      },
      error: (err) => alert(err?.error?.message || 'Erreur acceptation.')
    });
  }

  refuserInvitation(invitationId: number): void {
    const realId = Math.abs(invitationId);
    this.http.patch<any>(`${environment.apiUrl}/invitations/${realId}/refuser`, {}).subscribe({
      next: () => {
        const notifs = this._notifs.value.filter(n => n.id !== invitationId);
        this._notifs.next(notifs);
        this._nbNonLues.next(notifs.filter(n => !n.lue).length);
      },
      error: (err) => alert(err?.error?.message || 'Erreur refus.')
    });
  }

  iconeNotif(type: string): string {
    const map: Record<string, string> = {
      'RAPPEL_SESSION':    '⏰',
      'INVITATION_GROUPE': '👥',
      'OBJECTIF_ATTEINT':  '🏆',
      'MESSAGE_GROUPE':    '💬'
    };
    return map[type] ?? '🔔';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }
}