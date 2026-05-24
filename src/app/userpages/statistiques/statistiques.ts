import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { HttpClient }        from '@angular/common/http';
import { forkJoin, of }      from 'rxjs';
import { catchError }        from 'rxjs/operators';
import { SidebarComponent }  from '../sidebar/sidebar';
import { environment }       from '../../../environments/environment';
import { NotificationService } from '../../services/notification.service';  // ✅ ajout

interface ProgressionMatiere {
  nom:      string;
  couleur:  string;
  heures:   number;
  objectif: number;
  pct:      number;
}

interface ComparaisonSession {
  matiere:   string;
  couleur:   string;
  prevues:   number;
  realisees: number;
}

interface ProductiviteJour {
  jour:   string;
  heures: number;
  pct:    number;
}

@Component({
  selector:    'app-statistiques',
  standalone:  true,
  imports:     [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './statistiques.html',
  styleUrls:   ['./statistiques.css']
})
export class StatistiquesComponent implements OnInit {

  sidebarReduite = false;
  pageActive     = 'statistiques';
  chargement     = true;

  private readonly COULEURS = [
    '#7c4dff','#1e88e5','#00bcd4','#00c853',
    '#ff9100','#f44336','#e91e63','#9c27b0'
  ];

  /* ─── 1. TEMPS TOTAL ÉTUDIÉ ─── */
  tempsAujourdhui       = '0h';
  tempsSemaine          = '0h';
  tempsMois             = '0h';
  totalHeuresSemaineNum = 0;

  /* ─── 2. PROGRESSION PAR MATIÈRE ─── */
  progressionMatieres: ProgressionMatiere[] = [];

  /* ─── 3. SESSIONS PRÉVUES VS RÉALISÉES ─── */
  comparaisonSessions: ComparaisonSession[] = [];

  get totalPrevues():   number { return this.comparaisonSessions.reduce((a, s) => a + s.prevues,   0); }
  get totalRealisees(): number { return this.comparaisonSessions.reduce((a, s) => a + s.realisees, 0); }
  get tauxGlobal():     number {
    if (!this.totalPrevues) return 0;
    return Math.round((this.totalRealisees / this.totalPrevues) * 100);
  }

  /* ─── 4. PRODUCTIVITÉ HEBDOMADAIRE ─── */
  productiviteHebdo: ProductiviteJour[] = [];

  get totalHeuresSemaine(): number {
    return this.productiviteHebdo.reduce((a, j) => a + j.heures, 0);
  }

  get totalObjectifSemaine(): number {
    const fromMatieres = this.progressionMatieres.reduce((a, m) => a + (m.objectif || 0), 0);
    if (fromMatieres > 0) return fromMatieres;
    return Number(localStorage.getItem('objectif_hebdo_heures') || '20');
  }

  constructor(
    private http: HttpClient,
    private cdr:  ChangeDetectorRef,
    public notifService: NotificationService  // ✅ ajout
  ) {}

  ngOnInit(): void {
    this.chargerStatistiques();
  }

  chargerStatistiques(): void {
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
        const sessData = (sessions as any)?.data ?? sessions ?? [];
        const matData  = (matieres as any)?.data  ?? matieres  ?? [];

        if (dash) {
          this.tempsAujourdhui       = this.formatMin(dash.tempsAujourdMin ?? 0);
          this.tempsSemaine          = this.formatMin(dash.tempsSemainMin  ?? 0);
          this.tempsMois             = this.formatMin(dash.tempsMoisMin    ?? 0);
          this.totalHeuresSemaineNum = Math.round((dash.tempsSemainMin ?? 0) / 60 * 10) / 10;
        } else {
          this.calculerTempsDepuisSessions(sessData);
        }

        this.calculerProgression(matData, sessData, dash);
        this.calculerComparaison(matData, sessData);
        this.calculerProductivite(sessData);

        if (this.totalObjectifSemaine > 0) {
          localStorage.setItem('objectif_hebdo_heures', String(this.totalObjectifSemaine));
        }

        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  /* ════ CALCULS ════ */

  private calculerTempsDepuisSessions(sessions: any[]): void {
    const today       = new Date();
    const todayStr    = this.dateStr(today);
    const lundiSem    = this.getLundi(today);
    const finSem      = new Date(lundiSem.getTime() + 7 * 86400000);
    const premierMois = new Date(today.getFullYear(), today.getMonth(), 1);
    const terminees   = sessions.filter(s => (s.statut || '').toUpperCase() === 'TERMINEE');

    const minAuj = terminees
      .filter(s => this.extraireDate(s.debut) === todayStr)
      .reduce((a, s) => a + (s.dureeReelleMin || s.dureePrevueMin || 0), 0);
    this.tempsAujourdhui = this.formatMin(minAuj);

    const minSem = terminees
      .filter(s => { const d = new Date(s.debut); return d >= lundiSem && d < finSem; })
      .reduce((a, s) => a + (s.dureeReelleMin || s.dureePrevueMin || 0), 0);
    this.tempsSemaine          = this.formatMin(minSem);
    this.totalHeuresSemaineNum = Math.round(minSem / 60 * 10) / 10;

    const minMois = terminees
      .filter(s => new Date(s.debut) >= premierMois)
      .reduce((a, s) => a + (s.dureeReelleMin || s.dureePrevueMin || 0), 0);
    this.tempsMois = this.formatMin(minMois);
  }

  private calculerProgression(matieres: any[], sessions: any[], dash: any): void {
    const terminees      = sessions.filter(s => (s.statut || '').toUpperCase() === 'TERMINEE');
    const progressionsBD = dash?.progressionMatieres ?? [];

    this.progressionMatieres = matieres.map((m: any, i: number) => {
      const progBD   = progressionsBD.find((p: any) => p.nom === m.nom);
      const objectif = m.objectifHebdoHeures || (progBD?.objectif ?? 4);

      const minMat = terminees
        .filter(s => s.matiereId === m.id || s.matiereNom === m.nom)
        .reduce((a, s) => a + (s.dureeReelleMin || s.dureePrevueMin || 0), 0);
      const heures = Math.round(minMat / 60 * 10) / 10;

      const prog = progBD?.progression > 0
        ? Math.min(100, Math.round(progBD.progression))
        : Math.min(100, Math.round((heures / objectif) * 100));

      return { nom: m.nom, couleur: this.COULEURS[i % this.COULEURS.length], heures, objectif, pct: prog };
    });
  }

  private calculerComparaison(matieres: any[], sessions: any[]): void {
    this.comparaisonSessions = matieres.map((m: any, i: number) => {
      const sessMatiere = sessions.filter(
        s => s.matiereId === m.id || s.matiereNom === m.nom
      );
      return {
        matiere:   m.nom,
        couleur:   this.COULEURS[i % this.COULEURS.length],
        prevues:   sessMatiere.length,
        realisees: sessMatiere.filter(s => (s.statut || '').toUpperCase() === 'TERMINEE').length
      };
    }).filter(s => s.prevues > 0);
  }

  private calculerProductivite(sessions: any[]): void {
    const JOURS     = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
    const lundi     = this.getLundi(new Date());
    const terminees = sessions.filter(s => (s.statut || '').toUpperCase() === 'TERMINEE');

    const heuresParJour = JOURS.map((jour, i) => {
      const jourDate = new Date(lundi);
      jourDate.setDate(lundi.getDate() + i);
      const jourStr = this.dateStr(jourDate);

      const min = terminees
        .filter(s => this.extraireDate(s.debut) === jourStr)
        .reduce((a, s) => a + (s.dureeReelleMin || s.dureePrevueMin || 0), 0);

      return { jour, heures: Math.round(min / 60 * 10) / 10 };
    });

    const maxH = Math.max(...heuresParJour.map(j => j.heures), 1);
    this.productiviteHebdo = heuresParJour.map(j => ({
      ...j,
      pct: Math.round((j.heures / maxH) * 100)
    }));
  }

  /* ════ UTILITAIRES ════ */

  formatH(h: number): string {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return mm === 0 ? `${hh}h` : `${hh}h${mm}`;
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

  private getLundi(d: Date): Date {
    const day   = d.getDay();
    const lundi = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day === 0) { lundi.setDate(lundi.getDate() + 1); }
    else           { lundi.setDate(lundi.getDate() - day + 1); }
    return lundi;
  }

  get nbNotifs(): number {
    try {
      const n = localStorage.getItem('nb_notifs_non_lues');
      return n ? Number(n) : 0;
    } catch { return 0; }
  }

  get initialesUser(): string {
    try {
      const u   = JSON.parse(localStorage.getItem('user') || '{}');
      const nom = u.nom ?? u.name ?? 'U';
      return nom.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    } catch { return 'U'; }
  }
}