import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { HttpClient }        from '@angular/common/http';
import { forkJoin, of }      from 'rxjs';
import { catchError }        from 'rxjs/operators';
import { SidebarComponent }  from '../sidebar/sidebar';
import { environment }       from '../../../environments/environment';
import { NotificationService } from '../../services/notification.service';

export interface JourSemaine {
  jour:          string;
  concentration: number;
  revision:      number;
  lecture:       number;
}

export interface Matiere {
  nom:      string;
  heures:   string;
  pct:      number;
  couleur:  string;
  tendance: number;
}

export interface SessionJour {
  matiere:       string;
  heure:         string;
  duree:         string;
  couleur:       string;
  statut:        'termine' | 'en-cours' | 'planifie';
  libelleStatut: string;
}

export interface JourSerie {
  actif:      boolean;
  aujourdhui: boolean;
  libelle:    string;
}

@Component({
  selector:    'app-dashboard',
  standalone:  true,
  imports:     [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './dashboard.html',
  styleUrls:   ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  pageActive     = 'tableau-de-bord';
  sidebarReduite = false;
  recherche      = '';
  periodeSel     = 'Semaine';
  chargement     = true;

  private readonly COULEURS = [
    '#7c4dff','#1e88e5','#00bcd4','#00c853',
    '#ff9100','#f44336','#e91e63','#9c27b0'
  ];

  tempsEtudeAujourdhui = '0h';
  sessionsAujourdhui   = 0;
  progressionHebdo     = 0;
  totalHeuresSemaine   = 0;

  donneesSemaine: JourSemaine[] = [
    { jour:'Lun', concentration:0, revision:0, lecture:0 },
    { jour:'Mar', concentration:0, revision:0, lecture:0 },
    { jour:'Mer', concentration:0, revision:0, lecture:0 },
    { jour:'Jeu', concentration:0, revision:0, lecture:0 },
    { jour:'Ven', concentration:0, revision:0, lecture:0 },
    { jour:'Sam', concentration:0, revision:0, lecture:0 },
    { jour:'Dim', concentration:0, revision:0, lecture:0 },
  ];

  matieres:           Matiere[]    = [];
  sessionsJour:       SessionJour[] = [];
  sessionsJourToutes: SessionJour[] = [];
  serie           = 0;
  meilleuresSerie = 0;
  joursSerie: JourSerie[] = [];

  get totalCalcule(): number {
    return this.donneesSemaine.reduce(
      (acc, j) => acc + j.concentration + j.revision + j.lecture, 0
    );
  }

  get sessionsJourFiltrees(): SessionJour[] {
    if (!this.recherche.trim()) return this.sessionsJour;
    const mot = this.recherche.toLowerCase();
    return this.sessionsJour.filter(s =>
      s.matiere.toLowerCase().includes(mot) ||
      s.heure.includes(mot) ||
      s.libelleStatut.toLowerCase().includes(mot)
    );
  }

  get matieresFiltrees(): Matiere[] {
    if (!this.recherche.trim()) return this.matieres;
    const mot = this.recherche.toLowerCase();
    return this.matieres.filter(m => m.nom.toLowerCase().includes(mot));
  }

  get initialesUser(): string {
    try {
      const u   = JSON.parse(localStorage.getItem('user') || '{}');
      const nom = u.nom ?? u.name ?? 'U';
      return nom.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    } catch { return 'U'; }
  }

  constructor(
    private http: HttpClient,
    private cdr:  ChangeDetectorRef,
    public notifService: NotificationService  // ✅ service partagé
  ) {}

  ngOnInit(): void {
    this.construireGrilleSerie();
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.chargement = true;

    forkJoin({
      dashboard: this.http.get<any>(`${environment.apiUrl}/dashboard`)
                     .pipe(catchError(() => of(null))),
      sessions:  this.http.get<any>(`${environment.apiUrl}/sessions`)
                     .pipe(catchError(() => of({ data: [] }))),
      matieres:  this.http.get<any>(`${environment.apiUrl}/matieres`)
                     .pipe(catchError(() => of({ data: [] })))
    }).subscribe({
      next: ({ dashboard, sessions, matieres }) => {
        const dash     = dashboard?.data ?? dashboard ?? null;
        const sessData = sessions?.data  ?? sessions  ?? [];
        const matData  = matieres?.data  ?? matieres  ?? [];

        if (dash) {
          const minAuj = dash.tempsAujourdMin ?? 0;
          this.tempsEtudeAujourdhui = this.formatMin(minAuj);
          this.sessionsAujourdhui   = dash.sessionsAujourdNb ?? 0;
          const minSem              = dash.tempsSemainMin ?? 0;
          this.totalHeuresSemaine   = Math.round(minSem / 60 * 10) / 10;
          const comp = dash.sessionsCompletees ?? 0;
          const plan = (dash.sessionsPlanifiees ?? 0) + comp;
          this.progressionHebdo = plan > 0 ? Math.round((comp / plan) * 100) : 0;
        }

        this.traiterSessions(sessData);
        this.traiterMatieres(matData, sessData, dash);
        this.traiterGraphique(sessData);
        this.calculerSerie(sessData);

        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  private traiterSessions(sessions: any[]): void {
    const today = this.dateStr(new Date());
    const sessionsDuJour = sessions.filter(
      s => this.extraireDate(s.debut) === today
    );

    if (this.sessionsAujourdhui === 0) {
      this.sessionsAujourdhui = sessionsDuJour.length;
    }
    if (this.tempsEtudeAujourdhui === '0h') {
      const minAuj = sessionsDuJour
        .filter(s => (s.statut || '').toUpperCase() === 'TERMINEE')
        .reduce((a, s) => a + (s.dureeReelleMin || s.dureePrevueMin || 0), 0);
      this.tempsEtudeAujourdhui = this.formatMin(minAuj);
    }

    this.sessionsJour = sessionsDuJour.slice(0, 5).map((s: any, i: number) => ({
      matiere:       s.matiereNom || 'Session',
      heure:         this.extraireHeure(s.debut),
      duree:         this.formatMin(s.dureePrevueMin || 60),
      couleur:       this.COULEURS[i % this.COULEURS.length],
      statut:        this.mapStatut(s.statut),
      libelleStatut: this.libelleStatut(s.statut)
    }));

    this.sessionsJourToutes = [...this.sessionsJour];
  }

  private traiterMatieres(matieres: any[], sessions: any[], dash: any): void {
    const terminees      = sessions.filter(s => (s.statut || '').toUpperCase() === 'TERMINEE');
    const progressionsBD = dash?.progressionMatieres ?? [];

    this.matieres = matieres.map((m: any, i: number) => {
      const progBD = progressionsBD.find((p: any) => p.nom === m.nom);
      const prog   = progBD?.progression ?? 0;

      const minMat = terminees
        .filter(s => s.matiereId === m.id || s.matiereNom === m.nom)
        .reduce((a, s) => a + (s.dureeReelleMin || s.dureePrevueMin || 0), 0);

      return {
        nom:      m.nom,
        heures:   this.formatMin(minMat),
        pct:      Math.min(100, Math.round(prog)),
        couleur:  this.COULEURS[i % this.COULEURS.length],
        tendance: prog > 30 ? 1 : -1
      };
    });

    if (this.progressionHebdo === 0 && this.matieres.length > 0) {
      this.progressionHebdo = Math.round(
        this.matieres.reduce((a, m) => a + m.pct, 0) / this.matieres.length
      );
    }
  }

  private traiterGraphique(sessions: any[]): void {
    const lundi     = this.getLundi(new Date());
    const jours     = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    const terminees = sessions.filter(s => (s.statut || '').toUpperCase() === 'TERMINEE');

    this.donneesSemaine = jours.map((jour, i) => {
      const jourDate = new Date(lundi);
      jourDate.setDate(lundi.getDate() + i);
      const jourStr = this.dateStr(jourDate);

      const min = terminees
        .filter(s => this.extraireDate(s.debut) === jourStr)
        .reduce((a, s) => a + (s.dureeReelleMin || s.dureePrevueMin || 0), 0);

      const h = min / 60;
      return {
        jour,
        concentration: Math.round(h * 0.5 * 10) / 10,
        revision:      Math.round(h * 0.3 * 10) / 10,
        lecture:       Math.round(h * 0.2 * 10) / 10
      };
    });

    const totalFromSessions = Math.round(
      this.donneesSemaine.reduce(
        (a, j) => a + j.concentration + j.revision + j.lecture, 0
      ) * 10
    ) / 10;

    if (this.totalHeuresSemaine === 0) {
      this.totalHeuresSemaine = totalFromSessions;
    }
  }

  private calculerSerie(sessions: any[]): void {
    const dates = sessions
      .filter(s => (s.statut || '').toUpperCase() === 'TERMINEE')
      .map(s => this.extraireDate(s.debut))
      .filter((d, i, arr) => d && arr.indexOf(d) === i)
      .sort()
      .reverse();

    let serie = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (dates.includes(this.dateStr(d))) { serie++; }
      else if (i > 0) break;
    }

    this.serie           = serie;
    this.meilleuresSerie = Math.max(serie, 1);
    this.construireGrilleSerie();
  }

  private construireGrilleSerie(): void {
    const today = new Date();
    this.joursSerie = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      this.joursSerie.push({
        actif:      i < this.serie,
        aujourdhui: i === 0,
        libelle:    d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' })
      });
    }
  }

  private mapStatut(s: string): 'termine' | 'en-cours' | 'planifie' {
    const v = (s || '').toUpperCase();
    if (v === 'TERMINEE') return 'termine';
    if (v === 'EN_COURS') return 'en-cours';
    return 'planifie';
  }

  private libelleStatut(s: string): string {
    const v = (s || '').toUpperCase();
    if (v === 'TERMINEE') return 'Terminé';
    if (v === 'EN_COURS') return 'En cours';
    if (v === 'ANNULEE')  return 'Annulée';
    return 'Planifié';
  }

  private formatMin(min: number): string {
    if (!min || min <= 0) return '0h';
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${String(m).padStart(2, '0')}min`;
  }

  private dateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  private extraireDate(dt: string): string {
    if (!dt) return '';
    return dt.split('T')[0].split(' ')[0];
  }

  private extraireHeure(dt: string): string {
    if (!dt) return '--:--';
    const d = new Date(dt);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  private getLundi(d: Date): Date {
    const day   = d.getDay();
    const lundi = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day === 0) { lundi.setDate(lundi.getDate() + 1); }
    else           { lundi.setDate(lundi.getDate() - day + 1); }
    return lundi;
  }

  onRecherche(terme: string): void {
    this.recherche = terme;
    this.cdr.detectChanges();
  }

  onChangementPeriode(p: string): void {
    this.periodeSel = p;
    this.cdr.detectChanges();
  }

  onOuvrirProfil(): void {}
}