import { Component, OnInit, OnDestroy, ViewChild,
         ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar';
import { GroupeService } from '../../services/groupe.service';
import { InvitationGroupeService } from '../../services/invitation-groupe.service';
import { MessageService } from '../../services/message.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../services/notification.service';

export interface Membre {
  id:    number;
  nom:   string;
  role:  'admin' | 'membre';
  actif: boolean;
}

export interface SessionGroupe {
  id:      number;
  matiere: string;
  couleur: string;
  jour:    string;
  heure:   string;
  fin:     string;
  duree:   string;
  statut:  'planifiee' | 'en-cours' | 'terminee';
  hote:    string;
}

export interface MessageChat {
  id:         number;
  auteur:     string;
  auteurId:   number;
  texte:      string;
  horodatage: string;
  moi:        boolean;
}

export interface Groupe {
  id:           number;
  nom:          string;
  description:  string;
  couleur:      string;
  emoji:        string;
  membres:      Membre[];
  sessions:     SessionGroupe[];
  messages:     MessageChat[];
  codeInvit:    string;
  dateCreation: string;
}

export interface InvitationGroupe {
  id:              number;
  groupeId:        number;
  groupeNom:       string;
  emetteurId:      number;
  emetteurNom:     string;
  destinataireId:  number;
  destinataireNom: string;
  statut:          'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';
  creeLe:          string;
}

@Component({
  selector:    'app-groupes',
  standalone:  true,
  imports:     [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './groupes.html',
  styleUrls:   ['./groupes.css']
})
export class GroupesComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('chatFin') chatFin!: ElementRef;

  nouvellesNotifChat  = false;
  notificationsChat:  any[] = [];
  private notifPollInterval: any = null;

  sidebarReduite    = false;
  pageActive        = 'groupes';
  ongletActif:      'mes-groupes' | 'notifications' = 'mes-groupes';
  groupeSelectionne: Groupe | null = null;
  panneauActif:     'membres' | 'sessions' | 'chat' = 'sessions';

  modalCreerOuvert   = false;
  modalInviterOuvert = false;
  modalSessionOuvert = false;

  nouveauGroupe = {
    nom: '', description: '', couleur: '#7c4dff', emoji: '📚'
  };

  readonly couleursGroupe = [
    '#7c4dff','#1e88e5','#00bcd4','#00c853',
    '#ff9100','#f44336','#e91e63'
  ];
  readonly emojisGroupe = [
    '📚','💻','🔬','🧮','🤖','📊','🎯','⚡'
  ];
  readonly JOURS = [
    'Lundi','Mardi','Mercredi','Jeudi',
    'Vendredi','Samedi','Dimanche'
  ];

  emailInvitation    = '';
  erreurInvitation   = '';
  invitationEnvoyee  = false;
  invitationEnCours  = false;

  nouvelleSession = { matiere:'', heure:'', fin:'', jour:'Lundi' };
  erreurSession   = '';
  sessionEnCours  = false;
  nouveauMessage  = '';
  envoyageMessage = false;

  mesgroupes:  Groupe[]           = [];
  invitations: InvitationGroupe[] = [];

  private sessionNomCache = new Map<number, string>();

  chargement            = false;
  chargementMessages    = false;
  chargementInvitations = false;
  creationEnCours       = false;
  erreur                = '';
  erreurInvitations     = '';

  monUserId  = 0;
  monUserNom = '';

  private chatPollInterval:  any = null;
  private defilementNecessaire   = false;

  constructor(
    private groupeService:           GroupeService,
    private invitationGroupeService: InvitationGroupeService,
    private messageService:          MessageService,
    private cdr:                     ChangeDetectorRef,
    public notifService: NotificationService,
    private http:                    HttpClient
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u        = JSON.parse(userStr);
        this.monUserId  = u.userId ?? u.id ?? 0;
        this.monUserNom = u.nom    ?? u.name ?? '';
      } catch {}
    }

    this.restaurerCacheNoms();
    this.chargerTout();
    this.demarrerPollNotifications();
  }

  ngOnDestroy(): void {
    this.arreterPollChat();
    this.arreterPollNotifications();
  }

  ngAfterViewChecked(): void {
    if (this.defilementNecessaire) {
      this.defilerVersLeBas();
      this.defilementNecessaire = false;
    }
  }

  /* ════════════════════
     CHARGEMENT
  ════════════════════ */

  chargerTout(): void {
    this.chargement            = true;
    this.chargementInvitations = true;
    this.erreur                = '';
    this.erreurInvitations     = '';

    forkJoin({
      groupes:     this.groupeService.getMesGroupes()
                       .pipe(catchError(() => of(null))),
      invitations: this.invitationGroupeService.getMesInvitations()
                       .pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ groupes, invitations }) => {
        if (groupes) {
          const data: any[] = groupes?.data ?? groupes ?? [];
          const selectedId  = this.groupeSelectionne?.id ?? null;

          this.mesgroupes = data.map((g: any, i: number) => ({
            id:           g.id,
            nom:          g.nom,
            description:  g.description || '',
            couleur:      this.couleursGroupe[i % this.couleursGroupe.length],
            emoji:        this.emojisGroupe[i % this.emojisGroupe.length],
            membres:      [],
            sessions:     [],
            messages:     [],
            codeInvit:    `GRP${g.id}`,
            dateCreation: new Date().toISOString().slice(0, 10)
          }));

          this.chargerDetailsGroupesEnParallele();

          if (selectedId) {
            const retrouve = this.mesgroupes.find(g => g.id === selectedId);
            this.groupeSelectionne = retrouve || null;
            if (this.groupeSelectionne)
              this.chargerDetailGroupe(this.groupeSelectionne);
          }
        } else {
          this.erreur = 'Impossible de charger les groupes.';
        }

        if (invitations) {
          this.invitations = invitations?.data ?? invitations ?? [];
        } else {
          this.erreurInvitations = 'Impossible de charger les invitations.';
        }

        this.chargement            = false;
        this.chargementInvitations = false;
        this.cdr.detectChanges();
      }
    });
  }

  chargerDetailsGroupesEnParallele(): void {
    if (this.mesgroupes.length === 0) return;
    this.mesgroupes.forEach(g =>
      forkJoin({
        sessions: this.groupeService.getSessionsGroupe(g.id)
                      .pipe(catchError(() => of(null))),
        membres:  this.groupeService.getMembresGroupe(g.id)
                      .pipe(catchError(() => of(null)))
      }).subscribe({
        next: ({ sessions, membres }) => {
          if (sessions)
            g.sessions = (sessions?.data ?? sessions ?? [])
              .map((s: any) => this.mapSession(s, g.couleur));
          if (membres)
            g.membres = (membres?.data ?? membres ?? [])
              .map((m: any) => this.mapMembre(m));
          this.cdr.detectChanges();
        }
      })
    );
  }

  chargerDetailGroupe(groupe: Groupe): void {
    forkJoin({
      sessions: this.groupeService.getSessionsGroupe(groupe.id)
                    .pipe(catchError(() => of(null))),
      membres:  this.groupeService.getMembresGroupe(groupe.id)
                    .pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ sessions, membres }) => {
        if (sessions)
          groupe.sessions = (sessions?.data ?? sessions ?? [])
            .map((s: any) => this.mapSession(s, groupe.couleur));
        if (membres)
          groupe.membres = (membres?.data ?? membres ?? [])
            .map((m: any) => this.mapMembre(m));
        this.cdr.detectChanges();
      }
    });
  }

  /* ════════════════════
     GROUPES
  ════════════════════ */

  chargerMesGroupes(): void { this.chargerTout(); }

  ouvrirGroupe(g: Groupe): void {
    this.groupeSelectionne = g;
    this.panneauActif      = 'sessions';
    this.arreterPollChat();
    this.chargerDetailGroupe(g);
  }

  fermerGroupe(): void {
    this.arreterPollChat();
    this.groupeSelectionne = null;
  }

  ouvrirModalCreer(): void {
    this.modalCreerOuvert = true;
    this.nouveauGroupe = { nom:'', description:'', couleur:'#7c4dff', emoji:'📚' };
  }

  creerGroupe(): void {
    if (!this.nouveauGroupe.nom.trim() || this.creationEnCours) return;
    this.creationEnCours = true;

    this.groupeService.creer({
      nom:         this.nouveauGroupe.nom.trim(),
      description: this.nouveauGroupe.description.trim()
    }).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        if (data?.id) {
          this.mesgroupes = [{
            id:           data.id,
            nom:          data.nom,
            description:  data.description || '',
            couleur:      this.nouveauGroupe.couleur,
            emoji:        this.nouveauGroupe.emoji,
            membres:      [],
            sessions:     [],
            messages:     [],
            codeInvit:    `GRP${data.id}`,
            dateCreation: new Date().toISOString().slice(0, 10)
          }, ...this.mesgroupes];
        } else {
          this.chargerTout();
        }
        this.modalCreerOuvert = false;
        this.creationEnCours  = false;
      },
      error: (err) => {
        this.creationEnCours = false;
        alert(err?.error?.message || 'Erreur création groupe.');
      }
    });
  }

  quitterGroupe(id: number): void {
    if (!confirm('Quitter ce groupe ?')) return;
    this.groupeService.quitter(id).subscribe({
      next: () => {
        this.mesgroupes = this.mesgroupes.filter(g => g.id !== id);
        if (this.groupeSelectionne?.id === id) {
          this.arreterPollChat();
          this.groupeSelectionne = null;
        }
      },
      error: (err) => alert(err?.error?.message || 'Erreur.')
    });
  }

  get totalMembres(): number {
    const ids = new Set<number>();
    this.mesgroupes.forEach(g => g.membres.forEach(m => ids.add(m.id)));
    return ids.size;
  }

  get totalSessionsGroupes(): number {
    return this.mesgroupes.reduce((t,g) => t+(g.sessions?.length||0), 0);
  }

  trackByGroupe(i: number, g: Groupe): number { return g.id; }

  /* ════════════════════
     MEMBRES
  ════════════════════ */

  afficherNomMembre(m: Membre): string {
    if (!m) return 'Membre';
    return m.id === this.monUserId ? 'Vous' : (m.nom || 'Membre');
  }

  afficherRoleMembre(m: Membre): string {
    if (!m) return 'Membre';
    return m.role === 'admin' ? 'Administrateur' : 'Membre';
  }

  /* ════════════════════
     INVITATIONS
  ════════════════════ */

  chargerInvitations(): void {
    this.chargementInvitations = true;
    this.invitationGroupeService.getMesInvitations().subscribe({
      next: (res) => {
        this.invitations           = res?.data ?? res ?? [];
        this.chargementInvitations = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erreurInvitations     = err?.error?.message || 'Erreur invitations.';
        this.chargementInvitations = false;
      }
    });
  }

  get invitationsEnAttente(): InvitationGroupe[] {
    return this.invitations.filter(i => i.statut === 'EN_ATTENTE');
  }

  get invitationsTraitees(): InvitationGroupe[] {
    return this.invitations.filter(i => i.statut !== 'EN_ATTENTE');
  }

  get notificationsNonLues(): number {
    return this.invitationsEnAttente.length;
  }

  accepterInvitation(id: number): void {
    this.invitationGroupeService.accepterInvitation(id).subscribe({
      next: () => this.chargerTout(),
      error: (err) => alert(err?.error?.message || 'Erreur acceptation.')
    });
  }

  refuserInvitation(id: number): void {
    this.invitationGroupeService.refuserInvitation(id).subscribe({
      next: () => this.chargerInvitations(),
      error: (err) => alert(err?.error?.message || 'Erreur refus.')
    });
  }

  ouvrirModalInviter(): void {
    this.modalInviterOuvert = true;
    this.emailInvitation    = '';
    this.erreurInvitation   = '';
    this.invitationEnvoyee  = false;
    this.invitationEnCours  = false;
  }

  envoyerInvitation(): void {
    if (this.invitationEnCours) return;

    this.erreurInvitation  = '';
    this.invitationEnvoyee = false;

    if (!this.emailInvitation.trim()) {
      this.erreurInvitation = 'Entrez un email valide.';
      return;
    }
    if (!this.groupeSelectionne) return;

    this.invitationEnCours = true;

    this.invitationGroupeService.envoyerInvitation(
      this.groupeSelectionne.id,
      this.emailInvitation.trim()
    ).subscribe({
      next: () => {
        this.invitationEnvoyee = true;
        this.invitationEnCours = false;
        this.emailInvitation   = '';
        this.erreurInvitation  = '';
        setTimeout(() => {
          this.modalInviterOuvert = false;
          this.invitationEnvoyee  = false;
        }, 2500);
      },
      error: (err) => {
        this.invitationEnCours = false;
        this.invitationEnvoyee = false;
        this.erreurInvitation  =
          err?.error?.message || "Impossible d'envoyer l'invitation.";
      }
    });
  }

  copierCode(code: string): void {
    navigator.clipboard?.writeText(code).catch(() => {});
  }

  /* ════════════════════
     SESSIONS GROUPE
  ════════════════════ */

  chargerSessionsDuGroupe(groupeId: number): void {
    this.groupeService.getSessionsGroupe(groupeId).subscribe({
      next: (res) => {
        const data: any[] = res?.data ?? res ?? [];
        if (!this.groupeSelectionne ||
            this.groupeSelectionne.id !== groupeId) return;
        this.groupeSelectionne.sessions =
          data.map(s => this.mapSession(s, this.groupeSelectionne!.couleur));
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  ouvrirModalSession(): void {
    this.modalSessionOuvert = true;
    this.erreurSession      = '';
    this.sessionEnCours     = false;
    this.nouvelleSession    = { matiere:'', heure:'', fin:'', jour:'Lundi' };
  }

  creerSessionGroupe(): void {
    if (this.sessionEnCours) return;

    this.erreurSession = '';
    if (!this.nouvelleSession.matiere.trim()) {
      this.erreurSession = 'Le nom de la session est obligatoire.'; return;
    }
    if (!this.nouvelleSession.heure) {
      this.erreurSession = "L'heure de début est obligatoire."; return;
    }
    if (!this.groupeSelectionne) return;

    this.sessionEnCours = true;

    const nomSaisi = this.nouvelleSession.matiere.trim();
    const groupeId = this.groupeSelectionne.id;

    // ✅ FIX DATE : calculer le PROCHAIN jour correspondant au choix
    // Ex: dimanche + "Lundi" → lundi demain (pas lundi passé il y a 6 jours)
    const jourIndex = this.JOURS.indexOf(this.nouvelleSession.jour); // 0=Lundi...6=Dimanche

    const now        = new Date();
    const jourActuel = now.getDay(); // 0=Dim, 1=Lun...6=Sam

    // Convertir: JOURS[0]=Lundi→getDay()=1, JOURS[6]=Dimanche→getDay()=0
    const jourCibleGetDay = jourIndex === 6 ? 0 : jourIndex + 1;

    // Nb de jours pour atteindre le prochain jourCible
    let diff = jourCibleGetDay - jourActuel;
    if (diff <= 0) diff += 7; // jamais dans le passé → toujours futur

    const jourCible = new Date(now);
    jourCible.setDate(now.getDate() + diff);
    jourCible.setHours(0, 0, 0, 0);

    // Appliquer heure début
    const [hD, mD] = this.nouvelleSession.heure.split(':').map(Number);
    const debut = new Date(jourCible);
    debut.setHours(hD, mD, 0, 0);

    // Calculer fin
    let fin = new Date(debut);
    fin.setHours(debut.getHours() + 1, debut.getMinutes(), 0, 0);

    if (this.nouvelleSession.fin) {
      const [hF, mF] = this.nouvelleSession.fin.split(':').map(Number);
      const finTemp  = new Date(jourCible);
      finTemp.setHours(hF, mF, 0, 0);
      if (finTemp > debut) fin = finTemp;
    }

    // Anti-chevauchement
    const chevauchement = this.groupeSelectionne!.sessions.some(s => {
      const sDebut = this.hEnMin(s.heure);
      const sFin   = this.hEnMin(s.fin);
      const nDebut = this.hEnMin(this.nouvelleSession.heure);
      const nFin   = this.nouvelleSession.fin
        ? this.hEnMin(this.nouvelleSession.fin)
        : nDebut + 60;
      if (s.jour !== this.nouvelleSession.jour) return false;
      return nDebut < sFin && nFin > sDebut;
    });

    if (chevauchement) {
      this.erreurSession  = 'Ce créneau chevauche une session existante.';
      this.sessionEnCours = false;
      return;
    }

    const dureePrevueMin = Math.round((fin.getTime() - debut.getTime()) / 60000);

    const payload = {
      nom:           nomSaisi,
      debut:         this.formatDateLocale(debut),
      fin:           this.formatDateLocale(fin),
      dureePrevueMin
    };

    // Étape 1 : créer la session
    this.groupeService.creerSession(payload).subscribe({
      next: (res) => {
        const sessionCreee = res?.data ?? res;

        if (!sessionCreee?.id) {
          this.erreurSession  = 'Session créée mais ID manquant.';
          this.sessionEnCours = false;
          return;
        }

        const sessionId = sessionCreee.id;
        this.sessionNomCache.set(sessionId, nomSaisi);
        this.sauvegarderCacheNoms();

        // Étape 2 : partager dans le groupe
        this.groupeService.partagerSession(sessionId, groupeId).subscribe({
          next: (resPartage) => {
            const partage = resPartage?.data ?? resPartage;
            if (partage?.id)        this.sessionNomCache.set(partage.id, nomSaisi);
            if (partage?.sessionId) this.sessionNomCache.set(partage.sessionId, nomSaisi);
            this.sauvegarderCacheNoms();

            this.chargerSessionsDuGroupe(groupeId);
            this.sessionEnCours     = false;
            this.modalSessionOuvert = false;
            this.nouvelleSession    = { matiere: '', heure: '', fin: '', jour: 'Lundi' };
          },
          error: (err) => {
            this.sessionEnCours = false;
            this.erreurSession  = err?.error?.message || 'Erreur lors du partage.';
          }
        });
      },
      error: (err) => {
        this.sessionEnCours = false;
        this.erreurSession  = err?.error?.message || 'Erreur création session.';
      }
    });
  }

  private sauvegarderCacheNoms(): void {
    try {
      const obj: Record<string, string> = {};
      this.sessionNomCache.forEach((v, k) => { obj[String(k)] = v; });
      const json = JSON.stringify(obj);
      localStorage.setItem('session_nom_cache', json);
      localStorage.setItem('session_nom_cache_persist', json);
    } catch {}
  }

  private restaurerCacheNoms(): void {
    try {
      const normal  = localStorage.getItem('session_nom_cache');
      const persist = localStorage.getItem('session_nom_cache_persist');
      const source  = normal ?? persist;
      if (source) {
        const obj = JSON.parse(source);
        this.sessionNomCache = new Map(
          Object.entries(obj).map(([k, v]) => [Number(k), v as string])
        );
        if (!normal && persist) {
          localStorage.setItem('session_nom_cache', persist);
        }
      }
    } catch {}
  }

  private formatDateLocale(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}` +
           `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  }

  /* ════════════════════
     CHAT
  ════════════════════ */

  ouvrirChat(): void {
    if (!this.groupeSelectionne) return;
    this.panneauActif       = 'chat';
    this.notificationsChat  = [];
    this.nouvellesNotifChat = false;
    this.chargerMessages(this.groupeSelectionne.id);
    this.demarrerPollChat(this.groupeSelectionne.id);
    this.marquerNotifsChatLues();
  }

  ouvrirChatDepuisNotif(notif: any): void {
    const groupeNomExtrait =
      this.extraireNomGroupeDepuisMessage(notif.message || '');

    let groupe = this.mesgroupes.find(g =>
      g.nom === groupeNomExtrait ||
      g.id  === notif.groupeId   ||
      g.id  === notif.idGroupe
    );

    if (!groupe && this.mesgroupes.length > 0) groupe = this.mesgroupes[0];

    if (!groupe) {
      this.chargerTout();
      setTimeout(() => this.ouvrirChatDepuisNotif(notif), 1500);
      return;
    }

    this.notificationsChat  = this.notificationsChat.filter(n => n.id !== notif.id);
    this.nouvellesNotifChat = this.notificationsChat.length > 0;

    this.ongletActif        = 'mes-groupes';
    this.groupeSelectionne  = groupe;
    this.panneauActif       = 'chat';

    this.chargerDetailGroupe(groupe);
    this.chargerMessages(groupe.id);
    this.demarrerPollChat(groupe.id);
    this.marquerNotifsChatLues();

    setTimeout(() => {
      this.defilementNecessaire = true;
      this.cdr.detectChanges();
    }, 300);
  }

  private extraireNomGroupeDepuisMessage(message: string): string {
    const match = message.match(/dans\s+"([^"]+)"/);
    return match ? match[1] : '';
  }

  chargerMessages(groupeId: number): void {
    this.chargementMessages = true;
    this.messageService.getMessages(groupeId).subscribe({
      next: (res) => {
        const data: any[] = res?.data ?? res ?? [];
        if (!this.groupeSelectionne ||
            this.groupeSelectionne.id !== groupeId) return;
        this.groupeSelectionne.messages = data.map(m => this.mapMessage(m));
        this.chargementMessages   = false;
        this.defilementNecessaire = true;
        this.cdr.detectChanges();
      },
      error: () => { this.chargementMessages = false; }
    });
  }

  demarrerPollChat(groupeId: number): void {
    this.arreterPollChat();
    this.chatPollInterval = setInterval(() => {
      if (!this.groupeSelectionne ||
          this.groupeSelectionne.id !== groupeId ||
          this.panneauActif !== 'chat') {
        this.arreterPollChat(); return;
      }
      this.rafraichirMessages(groupeId);
    }, 5000);
  }

  arreterPollChat(): void {
    if (this.chatPollInterval) {
      clearInterval(this.chatPollInterval);
      this.chatPollInterval = null;
    }
  }

  rafraichirMessages(groupeId: number): void {
    this.messageService.getMessages(groupeId).subscribe({
      next: (res) => {
        const data: any[] = res?.data ?? res ?? [];
        if (!this.groupeSelectionne ||
            this.groupeSelectionne.id !== groupeId) return;
        const avant = this.groupeSelectionne.messages.length;
        this.groupeSelectionne.messages = data.map(m => this.mapMessage(m));
        if (this.groupeSelectionne.messages.length > avant)
          this.defilementNecessaire = true;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  envoyerMessage(): void {
    if (!this.nouveauMessage.trim() ||
        !this.groupeSelectionne ||
        this.envoyageMessage) return;

    const contenu  = this.nouveauMessage.trim();
    const groupeId = this.groupeSelectionne.id;
    this.envoyageMessage = true;
    this.nouveauMessage  = '';

    this.messageService.envoyerMessage(groupeId, contenu).subscribe({
      next: (res) => {
        const msg = res?.data ?? res;
        if (msg && this.groupeSelectionne?.id === groupeId) {
          this.groupeSelectionne.messages.push(this.mapMessage(msg));
          this.defilementNecessaire = true;
        }
        this.envoyageMessage = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.envoyageMessage = false;
        this.nouveauMessage  = contenu;
        alert(err?.error?.message || 'Erreur envoi message.');
      }
    });
  }

  supprimerMessage(messageId: number): void {
    if (!this.groupeSelectionne) return;
    const groupeId = this.groupeSelectionne.id;
    this.messageService.supprimerMessage(groupeId, messageId).subscribe({
      next: () => {
        if (this.groupeSelectionne)
          this.groupeSelectionne.messages =
            this.groupeSelectionne.messages.filter(m => m.id !== messageId);
        this.cdr.detectChanges();
      },
      error: (err) => alert(err?.error?.message || 'Erreur suppression.')
    });
  }

  /* ════════════════════
     NOTIFICATIONS CHAT
  ════════════════════ */

  demarrerPollNotifications(): void {
    this.verifierNotificationsChat();
    this.notifPollInterval = setInterval(() => {
      this.verifierNotificationsChat();
    }, 8000);
  }

  arreterPollNotifications(): void {
    if (this.notifPollInterval) {
      clearInterval(this.notifPollInterval);
      this.notifPollInterval = null;
    }
  }

  verifierNotificationsChat(): void {
    this.http.get<any>(
      `${environment.apiUrl}/notifications/non-lues`
    ).subscribe({
      next: (res) => {
        const data: any[]  = res?.data ?? res ?? [];
        const msgsGroupe    = data.filter(
          (n: any) => n.type === 'MESSAGE_GROUPE'
        );
        this.notificationsChat  = msgsGroupe;
        this.nouvellesNotifChat = msgsGroupe.length > 0;

        if (this.groupeSelectionne &&
            this.panneauActif === 'chat' &&
            msgsGroupe.length > 0) {
          this.rafraichirMessages(this.groupeSelectionne.id);
          this.marquerNotifsChatLues();
        }
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  marquerNotifsChatLues(): void {
    this.http.patch<any>(
      `${environment.apiUrl}/notifications/lire-toutes`, {}
    ).subscribe({
      next: () => {
        this.nouvellesNotifChat = false;
        this.notificationsChat  = [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.nouvellesNotifChat = false;
        this.notificationsChat  = [];
      }
    });
  }

  private defilerVersLeBas(): void {
    try {
      this.chatFin?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  /* ════════════════════
     MAPPERS
  ════════════════════ */

  private mapMessage(m: any): MessageChat {
    const d = new Date(m.envoyeLe);
    return {
      id:         m.id,
      auteur:     m.auteurNom || 'Inconnu',
      auteurId:   m.auteurId  || 0,
      texte:      m.contenu,
      horodatage: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
      moi:        m.auteurId === this.monUserId
    };
  }

  private mapSession(s: any, couleur: string): SessionGroupe {
    const sessionId = s.sessionId ?? s.id;
    const partageId = s.id;

    const nomBDD   = s.sessionNom ?? null;
    const nomCache =
      this.sessionNomCache.get(sessionId) ??
      this.sessionNomCache.get(partageId) ??
      null;

    let nom = nomBDD
           ?? nomCache
           ?? s.sessionMatiereNom
           ?? s.matiereNom
           ?? 'Session';

    if (nom === 'Session libre') {
      nom = nomBDD ?? nomCache ?? 'Session';
    }

    return {
      id:      sessionId,
      matiere: nom,
      couleur,
      jour:    this.extraireJourFR(s.debut || s.sessionDebut),
      heure:   this.extraireHeure(s.debut  || s.sessionDebut),
      fin:     this.extraireHeure(s.fin    || s.sessionFin),
      duree:   this.calculerDureeDepuisDates(
                 s.debut || s.sessionDebut,
                 s.fin   || s.sessionFin
               ),
      statut:  this.mapStatutSession(s.statut || s.sessionStatut),
      hote:    'Membre'
    };
  }

  private mapMembre(m: any): Membre {
    return {
      id:    m.utilisateurId ?? m.id,
      nom:   m.nom || m.utilisateurNom || 'Membre',
      role:  (m.role === 'PROPRIETAIRE' ? 'admin' : 'membre') as 'admin'|'membre',
      actif: true
    };
  }

  /* ════════════════════
     UTILITAIRES
  ════════════════════ */

  initiales(nom: string): string {
    return (nom || '?')
      .split(' ').map(n => n[0]).join('')
      .toUpperCase().slice(0, 2);
  }

  libelleStatut(s: string): string {
    const m: Record<string,string> = {
      planifiee:'Planifiée','en-cours':'En cours',terminee:'Terminée'
    };
    return m[s] ?? s;
  }

  iconeStatutInvit(statut: string): string {
    if (statut === 'ACCEPTEE') return '✅';
    if (statut === 'REFUSEE')  return '❌';
    return '⏳';
  }

  mapStatutSession(s: string): 'planifiee'|'en-cours'|'terminee' {
    const u = (s||'').toUpperCase();
    if (u === 'EN_COURS') return 'en-cours';
    if (u === 'TERMINEE') return 'terminee';
    return 'planifiee';
  }

  private extraireHeure(dt: string): string {
    if (!dt) return '--:--';
    const d = new Date(dt);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  private extraireJourFR(dt: string): string {
    if (!dt) return '—';
    const j = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    return j[new Date(dt).getDay()];
  }

  private calculerDureeDepuisDates(debut: string, fin: string): string {
    if (!debut||!fin) return '—';
    const diff = Math.max(
      0,
      Math.round((new Date(fin).getTime()-new Date(debut).getTime())/60000)
    );
    const h = Math.floor(diff/60);
    const m = diff%60;
    if (h===0) return `${m}min`;
    if (m===0) return `${h}h`;
    return `${h}h${String(m).padStart(2,'0')}`;
  }

  private hEnMin(h: string): number {
    if (!h || h === '--:--') return 0;
    const [hh, mm] = h.split(':').map(Number);
    return hh * 60 + (mm || 0);
  }
}