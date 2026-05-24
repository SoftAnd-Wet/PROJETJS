import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../services/session.service';
import { environment } from '../../../environments/environment';
import { SessionPartageeService } from '../../services/session-partagee.service';
import { GroupeService } from '../../services/groupe.service';
import { CommentaireService } from '../../services/commentaire.service';

type Onglet = 'aujourd-hui' | 'toutes' | 'groupes' | 'historique';
type StatutUI = 'planifiee' | 'en-cours' | 'terminee' | 'manquee';

interface SessionUI {
  id: number;
  date: string;
  matiere: string;
  couleur: string;
  debut: string;
  fin: string;
  duree: string;
  dureeMinutes: number;
  statut: StatutUI;
  priorite: 'haute' | 'moyenne' | 'basse';
  partagee: boolean;
  partageId?: number | null;
  groupe?: string;
  membres?: string[];
  hote?: string;
  completee?: boolean;
  matiereId?: number | null;
  estSessionGroupe?: boolean;
}

interface GroupeUI {
  id: number;
  nom: string;
}

interface CommentaireUI {
  id: number;
  auteurNom: string;
  contenu: string;
  creeLe: string;
  enEdition?: boolean;
  contenuEdition?: string;
}

interface JourHistorique {
  date: string;
  libelle: string;
  sessions: number;
  heures: number;
}

interface NotifUI {
  id: number;
  message: string;
  type: string;
  lue: boolean;
  envoyeeLe: string;
}

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './sessions.html',
  styleUrls: ['./sessions.css']
})
export class SessionsComponent implements OnInit {
  sidebarReduite = false;
  pageActive     = 'sessions';

  ongletActif: Onglet = 'aujourd-hui';
  rechercheSession    = '';

  tempsAujourdhui    = '0h 00min';
  sessionsCompletees = 0;
  objectifSemaine    = { fait: 0, total: Number(localStorage.getItem('objectif_hebdo_heures') || '20') };

  toutesLesSessions:  SessionUI[]      = [];
  sessionsGroupeList: SessionUI[]      = [];
  historique:         JourHistorique[] = [];

  // ── Partage ──
  modalPartageOuvert     = false;
  sessionAPartager: SessionUI | null = null;
  groupeSelectionneId:   number | null = null;
  groupeSelectionneName  = '';
  groupesDisponibles:    GroupeUI[] = [];
  chargementGroupes      = false;

  // ── Commentaires ──
  modalCommentairesOuvert        = false;
  sessionCommentairee: SessionUI | null = null;
  commentaires:        CommentaireUI[]  = [];
  chargementCommentaires = false;
  nouveauCommentaire     = '';
  envoiCommentaire       = false;

  // ── Notifications ──
  modalNotifsOuvert   = false;
  notifications:      NotifUI[] = [];
  chargementNotifs    = false;
  nbNotifsNonLues     = 0;

  chargement        = false;
  chargementSGroupe = false;
  erreur            = '';

  private readonly couleursGroupe = [
    '#1e88e5','#00bcd4','#009688','#3f51b5','#00c853',
    '#ff9100','#e91e63','#9c27b0'
  ];

  constructor(
    private sessionService:         SessionService,
    private sessionPartageeService: SessionPartageeService,
    private groupeService:          GroupeService,
    private commentaireService:     CommentaireService,
    private cdr:                    ChangeDetectorRef,
    private http:                   HttpClient,
    private router:                 Router
  ) {}

  ngOnInit(): void {
    this.chargerObjectif();
    this.chargerSessions();
    this.chargerGroupes();
    this.chargerSessionsDesGroupes();
    this.chargerNbNotifs();
  }

  /* ════════════════════
     NOTIFICATIONS
  ════════════════════ */

  get initialesUser(): string {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const nom = u.nom ?? u.name ?? 'U';
      return nom.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    } catch { return 'U'; }
  }

  chargerNbNotifs(): void {
    this.http.get<any>(`${environment.apiUrl}/notifications/count`).subscribe({
      next: (res) => {
        this.nbNotifsNonLues = res?.data ?? res ?? 0;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  ouvrirNotifs(): void {
    this.modalNotifsOuvert = true;
    this.chargementNotifs  = true;
    this.http.get<any>(`${environment.apiUrl}/notifications`).subscribe({
      next: (res) => {
        this.notifications   = res?.data ?? res ?? [];
        this.nbNotifsNonLues = this.notifications.filter(n => !n.lue).length;
        this.chargementNotifs = false;
        this.cdr.detectChanges();
      },
      error: () => { this.chargementNotifs = false; }
    });
  }

  fermerNotifs(): void {
    this.modalNotifsOuvert = false;
  }

  marquerLue(id: number): void {
    this.http.patch<any>(`${environment.apiUrl}/notifications/${id}/lire`, {}).subscribe({
      next: () => {
        const n = this.notifications.find(x => x.id === id);
        if (n) { n.lue = true; this.nbNotifsNonLues = Math.max(0, this.nbNotifsNonLues - 1); }
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  marquerToutesLues(): void {
    this.http.patch<any>(`${environment.apiUrl}/notifications/lire-toutes`, {}).subscribe({
      next: () => {
        this.notifications.forEach(n => n.lue = true);
        this.nbNotifsNonLues = 0;
        this.cdr.detectChanges();
      },
      error: () => {}
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

  formatNotifDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  /* ════════════════════
     OBJECTIF
  ════════════════════ */

  chargerObjectif(): void {
    this.http.get<any>(`${environment.apiUrl}/matieres`).subscribe({
      next: (res) => {
        const matieres: any[] = res?.data ?? res ?? [];
        const total = matieres.reduce((a, m) => a + (m.objectifHebdoHeures || 0), 0);
        if (total > 0) {
          this.objectifSemaine = { ...this.objectifSemaine, total };
          localStorage.setItem('objectif_hebdo_heures', String(total));
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  get objectifHebdoTotal(): number {
    return Number(localStorage.getItem('objectif_hebdo_heures') || '20');
  }

  /* ════════════════════
     CHARGEMENT SESSIONS
  ════════════════════ */

  chargerSessions(): void {
    this.chargement = true;
    this.erreur     = '';
    this.sessionService.getMesSessions().subscribe({
      next: (res) => {
        const data = res?.data ?? [];
        this.toutesLesSessions = data.map((s: any) => this.mapperSession(s));
        this.calculerStatistiques();
        this.genererHistorique();
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erreur            = err?.error?.message || 'Impossible de charger les sessions.';
        this.toutesLesSessions = [];
        this.calculerStatistiques();
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  chargerSessionsDesGroupes(): void {
    this.chargementSGroupe = true;
    this.groupeService.getMesGroupes().subscribe({
      next: (resGroupes) => {
        const groupes: any[] = resGroupes?.data ?? resGroupes ?? [];
        if (!groupes.length) { this.chargementSGroupe = false; this.cdr.detectChanges(); return; }

        const promises: Promise<SessionUI[]>[] = groupes.map((g: any, gi: number) =>
          this.groupeService.getSessionsGroupe(g.id).toPromise()
            .then((res: any) => {
              const data: any[] = res?.data ?? res ?? [];
              return data.map((s: any) => {
                const sessionId = s.sessionId ?? s.id;
                let nom = s.sessionNom ?? s.sessionMatiereNom ?? s.matiereNom ?? g.nom + ' — session';
                if (!nom || nom === 'Session libre') nom = g.nom + ' — session';
                const debutBrut = s.sessionDebut || s.debut || null;
                const finBrut   = s.sessionFin   || s.fin   || null;
                const debutDate = debutBrut ? new Date(debutBrut) : null;
                const finDate   = finBrut   ? new Date(finBrut)   : null;
                const dureeMin  = s.sessionDureePrevueMin || s.dureePrevueMin ||
                  (debutDate && finDate
                    ? Math.round((finDate.getTime() - debutDate.getTime()) / 60000)
                    : 0);
                return {
                  id:               sessionId,
                  date:             debutDate ? debutDate.toISOString().split('T')[0] : '',
                  matiere:          nom,
                  couleur:          this.couleursGroupe[gi % this.couleursGroupe.length],
                  debut:            debutDate ? this.fmtHeure(debutDate) : '--:--',
                  fin:              finDate   ? this.fmtHeure(finDate)   : '--:--',
                  duree:            this.formatDuree(dureeMin),
                  dureeMinutes:     dureeMin,
                  statut:           this.mapperStatut(s.sessionStatut || s.statut),
                  priorite:         'moyenne' as const,
                  partagee:         true,
                  groupe:           g.nom,
                  hote:             'Membre',
                  membres:          ['Membre'],
                  estSessionGroupe: true
                } as SessionUI;
              });
            }).catch(() => [])
        );

        Promise.all(promises).then(all => {
          const dejaVus = new Set<number>();
          this.sessionsGroupeList = all.flat().filter(s => {
            if (dejaVus.has(s.id)) return false;
            dejaVus.add(s.id);
            return true;
          });
          this.chargementSGroupe = false;
          this.cdr.detectChanges();
        });
      },
      error: () => { this.chargementSGroupe = false; this.cdr.detectChanges(); }
    });
  }

  chargerGroupes(): void {
    this.chargementGroupes = true;
    this.groupeService.getMesGroupes().subscribe({
      next: (res) => {
        const data: any[] = res?.data ?? res ?? [];
        this.groupesDisponibles = data.map((g: any) => ({ id: g.id, nom: g.nom }));
        this.chargementGroupes  = false;
        this.cdr.detectChanges();
      },
      error: () => { this.groupesDisponibles = []; this.chargementGroupes = false; }
    });
  }

  private mapperSession(s: any): SessionUI {
    return {
      id:           s.id,
      date:         this.extraireDate(s.debut),
      matiere:      s.matiereNom || s.nom || 'Matière',
      couleur:      this.couleurParMatiere(s.matiereNom),
      debut:        this.extraireHeure(s.debut),
      fin:          this.extraireHeure(s.fin),
      duree:        this.formatDuree(s.dureePrevueMin || 0),
      dureeMinutes: s.dureePrevueMin || 0,
      statut:       this.mapperStatut(s.statut),
      priorite:     'moyenne',
      partagee:     false,
      partageId:    null,
      completee:    !!s.completee,
      matiereId:    s.matiereId ?? null,
      estSessionGroupe: false
    };
  }

  private mapperStatut(statut: string): StatutUI {
    const v = (statut || '').toUpperCase();
    if (v === 'PLANIFIEE') return 'planifiee';
    if (v === 'EN_COURS')  return 'en-cours';
    if (v === 'TERMINEE')  return 'terminee';
    if (v === 'ANNULEE')   return 'manquee';
    return 'planifiee';
  }

  private couleurParMatiere(matiere: string): string {
    const map: Record<string, string> = {
      'Mathématiques': '#7c4dff', 'Mathematiques': '#7c4dff',
      'Base de données': '#00bcd4', 'Algorithmes': '#1e88e5',
      'IA et ML': '#ff9100', 'Réseaux': '#00c853',
      'Java': '#f44336', 'Sécurité': '#9c27b0'
    };
    return map[matiere] || '#7c4dff';
  }

  /* ════════════════════
     GETTERS
  ════════════════════ */

  get sessionsAujourdhui(): SessionUI[] {
    const today = this.aujourdhui();
    const perso  = this.toutesLesSessions.filter(s => s.date === today);
    const groupe = this.sessionsGroupeList.filter(s => s.date === today);
    const ids = new Set(perso.map(s => s.id));
    return [...perso, ...groupe.filter(s => !ids.has(s.id))];
  }

  get sessionsDeGroupe(): SessionUI[] {
    const partagees    = this.toutesLesSessions.filter(s => s.partagee);
    const idsPartagees = new Set(partagees.map(s => s.id));
    const deGroupe     = this.sessionsGroupeList.filter(s => !idsPartagees.has(s.id));
    return [...partagees, ...deGroupe];
  }

  get sessionsFiltrees(): SessionUI[] {
    let liste = [...this.toutesLesSessions];
    if (this.rechercheSession.trim()) {
      const mot = this.rechercheSession.toLowerCase();
      liste = liste.filter(s =>
        s.matiere.toLowerCase().includes(mot) || s.date.includes(mot) ||
        s.debut.includes(mot) || this.libelleStatut(s.statut).toLowerCase().includes(mot)
      );
    }
    return liste.sort((a, b) =>
      `${a.date}T${a.debut}`.localeCompare(`${b.date}T${b.debut}`)
    );
  }

  get pctObjectifSemaine(): number {
    if (!this.objectifSemaine.total) return 0;
    return Math.min(100, Math.round((this.objectifSemaine.fait / this.objectifSemaine.total) * 100));
  }

  /* ════════════════════
     ACTIONS SESSIONS
  ════════════════════ */

  lancerSession(s: SessionUI): void {
    if (s.estSessionGroupe) return;
    this.sessionService.demarrer(s.id).subscribe({
      next: (res) => { this.mettreAJourSession(s.id, res?.data, { statut: 'en-cours' }); this.calculerStatistiques(); this.cdr.detectChanges(); },
      error: (err) => alert(err?.error?.message || 'Erreur lors du lancement.')
    });
  }

  terminerSession(s: SessionUI): void {
    if (s.estSessionGroupe) return;
    this.sessionService.terminer(s.id, s.dureeMinutes || 60).subscribe({
      next: (res) => {
        this.mettreAJourSession(s.id, res?.data, { statut: 'terminee', completee: true });
        this.calculerStatistiques(); this.genererHistorique(); this.cdr.detectChanges();
      },
      error: (err) => alert(err?.error?.message || 'Erreur lors de la finalisation.')
    });
  }

  annulerSession(s: SessionUI): void {
    if (s.estSessionGroupe) return;
    this.sessionService.annuler(s.id).subscribe({
      next: (res) => { this.mettreAJourSession(s.id, res?.data, { statut: 'manquee' }); this.calculerStatistiques(); this.cdr.detectChanges(); },
      error: (err) => alert(err?.error?.message || "Erreur lors de l'annulation.")
    });
  }

  private mettreAJourSession(id: number, updated: any, fallback: Partial<SessionUI>): void {
    const idx = this.toutesLesSessions.findIndex(x => x.id === id);
    if (idx === -1) return;
    const ancien = this.toutesLesSessions[idx];
    this.toutesLesSessions[idx] = updated
      ? { ...this.mapperSession(updated), partagee: ancien.partagee, partageId: ancien.partageId, groupe: ancien.groupe, membres: ancien.membres, hote: ancien.hote }
      : { ...ancien, ...fallback };
  }

  /* ════════════════════
     PARTAGE
  ════════════════════ */

  ouvrirModalPartage(s: SessionUI): void {
    this.sessionAPartager = s; this.groupeSelectionneId = null;
    this.groupeSelectionneName = ''; this.modalPartageOuvert = true;
  }

  fermerModalPartage(): void {
    this.modalPartageOuvert = false; this.sessionAPartager = null;
    this.groupeSelectionneId = null; this.groupeSelectionneName = '';
  }

  selectionnerGroupe(g: GroupeUI): void {
    this.groupeSelectionneId = g.id; this.groupeSelectionneName = g.nom;
  }

  partagerSession(): void {
    if (!this.sessionAPartager || !this.groupeSelectionneId) return;
    this.sessionPartageeService.partager(this.sessionAPartager.id, this.groupeSelectionneId).subscribe({
      next: (res) => {
        const data = res?.data;
        const s = this.sessionAPartager!;
        s.partagee = true; s.partageId = data?.id ?? null;
        s.groupe = data?.groupeNom ?? this.groupeSelectionneName;
        s.hote = 'Moi'; s.membres = ['Moi'];
        this.calculerStatistiques(); this.fermerModalPartage(); this.cdr.detectChanges();
      },
      error: (err) => alert(err?.error?.message || 'Erreur lors du partage.')
    });
  }

  /* ════════════════════
     COMMENTAIRES
  ════════════════════ */

  ouvrirCommentaires(s: SessionUI): void {
    this.sessionCommentairee     = s;
    this.commentaires            = [];
    this.nouveauCommentaire      = '';
    this.modalCommentairesOuvert = true;
    this.chargerCommentaires(s.id);
  }

  fermerCommentaires(): void {
    this.modalCommentairesOuvert = false;
    this.sessionCommentairee     = null;
    this.commentaires            = [];
    this.nouveauCommentaire      = '';
  }

  chargerCommentaires(sessionId: number): void {
    this.chargementCommentaires = true;
    this.commentaireService.getCommentaires(sessionId).subscribe({
      next: (res) => {
        const data: any[] = res?.data ?? res ?? [];
        this.commentaires = data.map((c: any) => ({
          id: c.id, auteurNom: c.auteurNom, contenu: c.contenu,
          creeLe: c.creeLe, enEdition: false, contenuEdition: c.contenu
        }));
        this.chargementCommentaires = false;
        this.cdr.detectChanges();
      },
      error: () => { this.chargementCommentaires = false; }
    });
  }

  ajouterCommentaire(): void {
    if (!this.nouveauCommentaire.trim() || !this.sessionCommentairee || this.envoiCommentaire) return;
    this.envoiCommentaire = true;
    this.commentaireService.ajouter(this.sessionCommentairee.id, this.nouveauCommentaire.trim()).subscribe({
      next: (res) => {
        const c = res?.data ?? res;
        this.commentaires.push({
          id: c.id, auteurNom: c.auteurNom, contenu: c.contenu,
          creeLe: c.creeLe, enEdition: false, contenuEdition: c.contenu
        });
        this.nouveauCommentaire = '';
        this.envoiCommentaire   = false;
        this.cdr.detectChanges();
      },
      error: (err) => { this.envoiCommentaire = false; alert(err?.error?.message || 'Erreur ajout commentaire.'); }
    });
  }

  activerEdition(c: CommentaireUI): void { c.enEdition = true; c.contenuEdition = c.contenu; }
  annulerEdition(c: CommentaireUI): void  { c.enEdition = false; }

  supprimerCommentaire(c: CommentaireUI): void {
    if (!confirm('Supprimer ce commentaire ?') || !this.sessionCommentairee) return;
    this.commentaireService.supprimer(this.sessionCommentairee.id, c.id).subscribe({
      next: () => { this.commentaires = this.commentaires.filter(x => x.id !== c.id); this.cdr.detectChanges(); },
      error: (err) => alert(err?.error?.message || 'Erreur suppression.')
    });
  }

  formatCommentaireDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  /* ════════════════════
     STATISTIQUES
  ════════════════════ */

  calculerStatistiques(): void {
    const terminees = this.toutesLesSessions.filter(s => s.statut === 'terminee');
    const min       = this.sessionsAujourdhui
      .filter(s => !s.estSessionGroupe && s.statut === 'terminee')
      .reduce((a, s) => a + s.dureeMinutes, 0);
    this.tempsAujourdhui    = this.minutesVersTexte(min);
    this.sessionsCompletees = terminees.length;
    const h = terminees.reduce((a, s) => a + s.dureeMinutes, 0) / 60;
    this.objectifSemaine = { fait: Number(h.toFixed(1)), total: this.objectifHebdoTotal };
  }

  genererHistorique(): void {
    const map = new Map<string, { sessions: number; heures: number }>();
    this.toutesLesSessions.filter(s => s.statut === 'terminee').forEach(s => {
      const c = map.get(s.date) || { sessions: 0, heures: 0 };
      c.sessions += 1; c.heures += s.dureeMinutes / 60;
      map.set(s.date, c);
    });
    this.historique = Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, val]) => ({
        date, libelle: this.libelleJourHistorique(date),
        sessions: val.sessions, heures: Number(val.heures.toFixed(1))
      }));
  }

  /* ════════════════════
     UTILITAIRES
  ════════════════════ */

  libelleStatut(statut: StatutUI): string {
    switch (statut) {
      case 'planifiee': return 'Planifiée';
      case 'en-cours':  return 'En cours';
      case 'terminee':  return 'Terminée';
      case 'manquee':   return 'Manquée';
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  initiales(nom: string): string {
    return (nom || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  private fmtHeure(d: Date): string {
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  private extraireDate(dt: string): string { return new Date(dt).toISOString().split('T')[0]; }
  private extraireHeure(dt: string): string { return this.fmtHeure(new Date(dt)); }

  private formatDuree(min: number): string {
    if (!min || min <= 0) return '—';
    const h = Math.floor(min / 60), m = min % 60;
    if (h === 0) return `${m}min`; if (m === 0) return `${h}h`;
    return `${h}h${String(m).padStart(2,'0')}`;
  }

  private minutesVersTexte(min: number): string {
    const h = Math.floor(min / 60), m = min % 60;
    return `${h}h ${String(m).padStart(2,'0')}min`;
  }

  private aujourdhui(): string { return new Date().toISOString().split('T')[0]; }

  private libelleJourHistorique(date: string): string {
    const today = this.aujourdhui();
    const hier  = new Date(); hier.setDate(hier.getDate() - 1);
    if (date === today) return "Aujourd'hui";
    if (date === hier.toISOString().split('T')[0]) return 'Hier';
    return new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
}