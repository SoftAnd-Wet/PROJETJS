import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar';
import { MatiereService } from '../../services/matiere.service';
import { SessionService } from '../../services/session.service';
import { DisponibiliteService } from '../../services/disponibilite.service';
import { GroupeService } from '../../services/groupe.service';
import { environment } from '../../../environments/environment';

export interface Matiere {
  id?:                 number;
  nom:                 string;
  objectifHebdoHeures: number;
  priorite:            number;
  couleur?:            string;
  prioriteLibelle?:    'haute' | 'moyenne' | 'basse';
}

export interface Creneau {
  id?:   number;
  debut: string;
  fin:   string;
}

export interface Disponibilite {
  id?:      number;
  jour:     string;
  actif:    boolean;
  creneaux: Creneau[];
}

export interface SessionPlanifiee {
  id?:         number;
  matiere:     string;
  debut:       string;
  fin:         string;
  duree:       string;
  couleur:     string;
  priorite:    'haute' | 'moyenne' | 'basse';
  statut?:     string;
  typeSession: 'personnelle' | 'groupe';
  groupe?:     string;
}

export interface JourPlanning {
  jour:     string;
  date:     string;
  sessions: SessionPlanifiee[];
}

export interface Notification {
  id:        number;
  message:   string;
  type:      string;
  lue:       boolean;
  envoyeeLe: string;
}

@Component({
  selector:    'app-planner',
  standalone:  true,
  imports:     [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './planner.html',
  styleUrls:   ['./planner.css']
})
export class PlannerComponent implements OnInit, OnDestroy {

  pageActive     = 'planificateur';
  sidebarReduite = false;

  readonly couleursDisponibles = [
    '#7c4dff','#1e88e5','#00bcd4','#00c853',
    '#ff9100','#f44336','#e91e63','#9c27b0',
    '#3f51b5','#009688','#8bc34a','#ff5722'
  ];

  couleursMatieres = new Map<number, string>();

  matieres:               Matiere[] = [];
  formulaireMatiereOuvert = false;
  matiereEnEdition        = -1;
  erreurFormulaire        = '';
  chargementMatieres      = false;
  enSauvegarde            = false;

  nouvelleMatiere: Matiere = {
    nom: '', objectifHebdoHeures: 2, priorite: 2, couleur: '#7c4dff'
  };

  readonly JOURS = [
    'Lundi','Mardi','Mercredi','Jeudi',
    'Vendredi','Samedi','Dimanche'
  ];

  readonly JOURS_ENUM: Record<string, string> = {
    'Lundi':    'LUNDI',    'Mardi':    'MARDI',
    'Mercredi': 'MERCREDI', 'Jeudi':    'JEUDI',
    'Vendredi': 'VENDREDI', 'Samedi':   'SAMEDI',
    'Dimanche': 'DIMANCHE'
  };

  disponibilites: Disponibilite[] = this.JOURS.map(j => ({
    jour: j, actif: false, creneaux: []
  }));

  erreursCreneaux  = new Map<string, string>();
  chargementDispos = false;
  erreurDispos     = '';

  dureeMaxSession = 2;
  enGeneration    = false;
  semainePlanif   = this.getLundiSemaine();

  planningGenere:   JourPlanning[] = [];
  vueCalendrier     = true;
  messageGeneration = '';

  ongletActif: 'planning' | 'notifications' = 'planning';
  notifications:   Notification[] = [];
  chargementNotifs = false;
  nbNotifsNonLues  = 0;
  private notifInterval: any;

  private sessionNomCache = new Map<number, string>();

  datesSemaine: string[] = [];

  get totalSessionsGenerees(): number {
    return this.planningGenere.reduce((a, j) => a + j.sessions.length, 0);
  }

  get aDesErreurs(): boolean {
    return this.erreursCreneaux.size > 0;
  }

  constructor(
    private matiereService:       MatiereService,
    private sessionService:       SessionService,
    private disponibiliteService: DisponibiliteService,
    private groupeService:        GroupeService,
    private router:               Router,
    private http:                 HttpClient,
    private cdr:                  ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    try {
      const normal  = localStorage.getItem('session_nom_cache');
      const persist = localStorage.getItem('session_nom_cache_persist');
      const source  = normal ?? persist;
      if (source) {
        const obj = JSON.parse(source);
        this.sessionNomCache = new Map(
          Object.entries(obj).map(([k, v]) => [Number(k), v as string])
        );
      }
    } catch {}

    this.calculerDatesSemaine(this.semainePlanif);
    this.chargerMatieres();
    this.chargerDisponibilites();
    this.chargerNbNotifs();
    this.notifInterval = setInterval(() => this.chargerNbNotifs(), 15000);
  }

  ngOnDestroy(): void {
    if (this.notifInterval) clearInterval(this.notifInterval);
  }

  calculerDatesSemaine(lundiStr: string): void {
    // ✅ Parser sans UTC
    const [y, m, d] = lundiStr.split('-').map(Number);
    const lundi = new Date(y, m - 1, d);
    this.datesSemaine = this.JOURS.map((_, i) => {
      const jour = new Date(lundi);
      jour.setDate(lundi.getDate() + i);
      return jour.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    });
  }

  getDateJour(jourNom: string): string {
    const idx = this.JOURS.indexOf(jourNom);
    return idx >= 0 ? (this.datesSemaine[idx] ?? '') : '';
  }

  getInitialesUser(): string {
    try {
      const u   = JSON.parse(localStorage.getItem('user') || '{}');
      const nom = u.nom ?? u.name ?? 'U';
      return nom.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    } catch { return 'U'; }
  }

  allerVersGroupes(): void {
    this.router.navigate(['/groupes'], { queryParams: { tab: 'notifications' } });
  }

  /* ════════════════════ MATIÈRES ════════════════════ */

  chargerMatieres(): void {
    this.chargementMatieres = true;
    this.matiereService.getMesMatieres().subscribe({
      next: (res) => {
        const liste: any[] = res?.data ?? res ?? [];
        this.matieres = liste.map((m: any, i: number) => ({
          ...m,
          prioriteLibelle: this.prioriteVersLibelle(m.priorite),
          couleur: this.couleursMatieres.get(m.id) ??
                   this.couleursDisponibles[(m.id || i) % this.couleursDisponibles.length]
        }));
        this.chargementMatieres = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: () => {
        this.matieres = []; this.chargementMatieres = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  prioriteVersLibelle(p: number): 'haute' | 'moyenne' | 'basse' {
    return p === 1 ? 'haute' : p === 2 ? 'moyenne' : 'basse';
  }

  libellePriorite(p: any): string {
    if (p === 1 || p === 'haute')   return 'Haute';
    if (p === 2 || p === 'moyenne') return 'Moyenne';
    return 'Basse';
  }

  ouvrirFormulaireMatiere(): void {
    if (this.formulaireMatiereOuvert) return;
    this.formulaireMatiereOuvert = true;
    this.matiereEnEdition = -1;
    this.erreurFormulaire = '';
    this.enSauvegarde     = false;
    this.nouvelleMatiere  = { nom: '', objectifHebdoHeures: 2, priorite: 2, couleur: '#7c4dff' };
  }

  modifierMatiere(index: number): void {
    this.matiereEnEdition        = index;
    this.formulaireMatiereOuvert = true;
    this.erreurFormulaire        = '';
    this.enSauvegarde            = false;
    const m = this.matieres[index];
    this.nouvelleMatiere = { ...m, couleur: m.couleur || '#7c4dff' };
  }

  fermerFormulaireMatiere(): void {
    this.formulaireMatiereOuvert = false;
    this.matiereEnEdition        = -1;
    this.erreurFormulaire        = '';
    this.enSauvegarde            = false;
  }

  sauvegarderMatiere(): void {
    if (this.enSauvegarde) return;
    this.erreurFormulaire = '';
    if (!this.nouvelleMatiere.nom?.trim()) {
      this.erreurFormulaire = 'Le nom est obligatoire.'; return;
    }
    if (!this.nouvelleMatiere.objectifHebdoHeures || this.nouvelleMatiere.objectifHebdoHeures <= 0) {
      this.erreurFormulaire = "L'objectif doit être supérieur à 0."; return;
    }
    this.enSauvegarde = true;
    const payload = {
      nom:                 this.nouvelleMatiere.nom.trim(),
      priorite:            Number(this.nouvelleMatiere.priorite),
      objectifHebdoHeures: Number(this.nouvelleMatiere.objectifHebdoHeures)
    };
    if (this.matiereEnEdition >= 0) {
      const id     = this.matieres[this.matiereEnEdition].id!;
      const couleur = this.nouvelleMatiere.couleur || '#7c4dff';
      this.matiereService.modifier(id, payload).subscribe({
        next: (res) => {
          const updated = res?.data ?? res;
          this.matieres[this.matiereEnEdition] = {
            ...(updated || payload), id, couleur,
            prioriteLibelle: this.prioriteVersLibelle(Number(payload.priorite))
          };
          this.couleursMatieres.set(id, couleur);
          this.fermerFormulaireMatiere();
          setTimeout(() => this.cdr.detectChanges(), 0);
          this.chargerMatieres();
        },
        error: (err) => {
          this.enSauvegarde = false;
          this.erreurFormulaire = err?.error?.message || 'Erreur modification';
          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
    } else {
      const couleur = this.nouvelleMatiere.couleur || '#7c4dff';
      this.matiereService.creer(payload).subscribe({
        next: (res) => {
          const created = res?.data ?? res;
          if (created?.id) {
            this.couleursMatieres.set(created.id, couleur);
            this.matieres = [{
              ...created, couleur,
              prioriteLibelle: this.prioriteVersLibelle(created.priorite)
            }, ...this.matieres];
          }
          this.fermerFormulaireMatiere();
          setTimeout(() => this.cdr.detectChanges(), 0);
          this.chargerMatieres();
        },
        error: (err) => {
          this.enSauvegarde = false;
          this.erreurFormulaire = err?.error?.message || 'Erreur création';
          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
    }
  }

  supprimerMatiere(index: number): void {
    if (!confirm('Supprimer cette matière ?')) return;
    const id = this.matieres[index].id;
    if (!id) return;
    this.matieres = this.matieres.filter((_, i) => i !== index);
    setTimeout(() => this.cdr.detectChanges(), 0);
    this.matiereService.supprimer(id).subscribe({
      next: () => this.chargerMatieres(),
      error: (err) => {
        alert(err?.error?.message || 'Erreur suppression');
        this.chargerMatieres();
      }
    });
  }

  /* ════════════════════ DISPONIBILITÉS ════════════════════ */

  chargerDisponibilites(): void {
    this.chargementDispos = true;
    this.erreurDispos     = '';
    this.disponibiliteService.getMesDisponibilites().subscribe({
      next: (res) => {
        const disposBD: any[] = res?.data ?? res ?? [];
        this.disponibilites = this.JOURS.map(jour => {
          const cr = disposBD.filter(
            (d: any) => (d.jour || '').toUpperCase() === this.JOURS_ENUM[jour]
          );
          return {
            jour, actif: cr.length > 0,
            creneaux: cr.map((d: any) => ({
              id:    d.id,
              debut: this.extraireHeure(d.heureDebut),
              fin:   this.extraireHeure(d.heureFin)
            }))
          };
        });
        this.chargementDispos = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (err) => {
        this.erreurDispos = err?.error?.message || 'Impossible de charger.';
        this.chargementDispos = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  private extraireHeure(h: any): string {
    if (!h) return '08:00';
    return String(h).substring(0, 5);
  }

  ajouterCreneau(dispo: Disponibilite): void {
    const dernier = dispo.creneaux[dispo.creneaux.length - 1];
    const debut   = dernier?.fin || '08:00';
    const h       = parseInt(debut.split(':')[0], 10);
    const fin     = `${String(Math.min(h + 2, 23)).padStart(2, '0')}:00`;
    dispo.creneaux.push({ debut, fin });
    this.sauvegarderCreneauAuto(dispo, dispo.creneaux.length - 1);
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  private sauvegarderCreneauAuto(dispo: Disponibilite, index: number): void {
    const cr    = dispo.creneaux[index];
    const crAny = cr as any;
    if (crAny.id || !cr.debut || !cr.fin) return;
    this.disponibiliteService.creer({
      jour: this.JOURS_ENUM[dispo.jour],
      heureDebut: cr.debut + ':00',
      heureFin:   cr.fin   + ':00'
    }).subscribe({
      next: (res) => {
        const saved = res?.data ?? res;
        if (saved?.id) (dispo.creneaux[index] as any).id = saved.id;
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: () => {}
    });
  }

  supprimerCreneau(dispo: Disponibilite, index: number): void {
    const cr = dispo.creneaux[index] as any;
    if (cr.id) {
      this.disponibiliteService.supprimer(cr.id).subscribe({
        next: () => {
          dispo.creneaux.splice(index, 1);
          if (dispo.creneaux.length === 0) dispo.actif = false;
          this.recalculerErreursJour(dispo);
          setTimeout(() => this.cdr.detectChanges(), 0);
        },
        error: (err) => alert(err?.error?.message || 'Erreur suppression')
      });
    } else {
      dispo.creneaux.splice(index, 1);
      if (dispo.creneaux.length === 0) dispo.actif = false;
      this.recalculerErreursJour(dispo);
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }

  mettreAJourCreneau(dispo: Disponibilite, index: number): void {
    this.validerCreneau(dispo, index);
    const cr    = dispo.creneaux[index];
    const crAny = cr as any;
    if (!cr.debut || !cr.fin || this.getErreurCreneau(dispo.jour, index)) return;
    if (crAny.id) {
      const ancienId = crAny.id;
      crAny.id = null;
      this.disponibiliteService.supprimer(ancienId).subscribe({
        next: () => this.sauvegarderCreneauAuto(dispo, index),
        error: () => { crAny.id = ancienId; }
      });
    } else {
      this.sauvegarderCreneauAuto(dispo, index);
    }
  }

  validerCreneau(dispo: Disponibilite, i: number): void {
    const cle = `${dispo.jour}-${i}`;
    const cr  = dispo.creneaux[i];
    if (!cr?.debut || !cr?.fin) { this.erreursCreneaux.delete(cle); return; }
    if (cr.debut >= cr.fin) {
      this.erreursCreneaux.set(cle, "L'heure de fin doit être après le début."); return;
    }
    const dMin = this.hEnMin(cr.debut);
    const fMin = this.hEnMin(cr.fin);
    for (let j = 0; j < dispo.creneaux.length; j++) {
      if (j === i) continue;
      const a = dispo.creneaux[j];
      if (dMin < this.hEnMin(a.fin) && fMin > this.hEnMin(a.debut)) {
        this.erreursCreneaux.set(cle, `Chevauchement avec ${a.debut}-${a.fin}`); return;
      }
    }
    this.erreursCreneaux.delete(cle);
  }

  recalculerErreursJour(dispo: Disponibilite): void {
    for (let i = 0; i < dispo.creneaux.length + 5; i++) {
      this.erreursCreneaux.delete(`${dispo.jour}-${i}`);
    }
    dispo.creneaux.forEach((_, i) => this.validerCreneau(dispo, i));
  }

  getErreurCreneau(jour: string, i: number): string {
    return this.erreursCreneaux.get(`${jour}-${i}`) ?? '';
  }

  /* ════════════════════ NOTIFICATIONS ════════════════════ */

  chargerNotifications(): void {
    this.chargementNotifs = true;
    this.http.get<any>(`${environment.apiUrl}/notifications`).subscribe({
      next: (res) => {
        this.notifications   = res?.data ?? res ?? [];
        this.nbNotifsNonLues = this.notifications.filter(
          n => !n.lue && n.type !== 'MESSAGE_GROUPE'
        ).length;
        this.chargementNotifs = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: () => {
        this.chargementNotifs = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  chargerNbNotifs(): void {
    this.http.get<any>(`${environment.apiUrl}/notifications/count`).subscribe({
      next: (res) => {
        this.nbNotifsNonLues = res?.data ?? res ?? 0;
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: () => {}
    });
  }

  marquerLue(id: number): void {
    this.http.patch<any>(`${environment.apiUrl}/notifications/${id}/lire`, {}).subscribe({
      next: () => {
        const n = this.notifications.find(x => x.id === id);
        if (n) { n.lue = true; this.nbNotifsNonLues = Math.max(0, this.nbNotifsNonLues - 1); }
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: () => {}
    });
  }

  marquerToutesLues(): void {
    this.http.patch<any>(`${environment.apiUrl}/notifications/lire-toutes`, {}).subscribe({
      next: () => {
        this.notifications.forEach(n => n.lue = true);
        this.nbNotifsNonLues = 0;
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: () => {}
    });
  }

  supprimerNotif(id: number): void {
    this.marquerLue(id);
    this.notifications = this.notifications.filter(n => n.id !== id);
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  iconeNotif(type: string): string {
    const map: Record<string, string> = {
      'RAPPEL_SESSION':   '⏰',
      'INVITATION_GROUPE':'👥',
      'OBJECTIF_ATTEINT': '🏆',
      'MESSAGE_GROUPE':   '💬'
    };
    return map[type] ?? '🔔';
  }

  /* ════════════════════ GÉNÉRATION ════════════════════ */

  genererPlanning(): void {
    if (this.enGeneration) return;
    if (this.matieres.length === 0) { alert('Ajoutez au moins une matière.'); return; }

    const disposValides = this.disponibilites.filter(
      d => d.actif && d.creneaux.length > 0 &&
           d.creneaux.every(cr => cr.debut && cr.fin && cr.debut < cr.fin)
    );
    if (disposValides.length === 0) {
      alert('Ajoutez au moins une disponibilité valide.'); return;
    }

    const lundiSemaine = this.getLundiDepuisDate(this.semainePlanif);
    this.semainePlanif = lundiSemaine;
    this.calculerDatesSemaine(lundiSemaine);
    this.enGeneration      = true;
    this.messageGeneration = '';
    this.planningGenere    = [];
    setTimeout(() => this.cdr.detectChanges(), 0);

    const nouveaux: Promise<any>[] = [];
    for (const dispo of disposValides) {
      for (const cr of dispo.creneaux) {
        const crAny = cr as any;
        if (!crAny.id && cr.debut && cr.fin) {
          nouveaux.push(this.disponibiliteService.creer({
            jour:       this.JOURS_ENUM[dispo.jour],
            heureDebut: cr.debut + ':00',
            heureFin:   cr.fin   + ':00'
          }).toPromise());
        }
      }
    }

    Promise.all(nouveaux).then(() => {
      Promise.all([
        this.sessionService.planifier(lundiSemaine, this.dureeMaxSession).toPromise(),
        this.getSessionsGroupe(lundiSemaine)
      ]).then(([resPlanning, sessionsGroupe]) => {
        const perso: any[] = (resPlanning as any)?.data ?? resPlanning ?? [];
        this.planningGenere = this.construirePlanning(perso, sessionsGroupe, lundiSemaine);
        this.enGeneration   = false;
        if (this.totalSessionsGenerees === 0) {
          this.messageGeneration = 'Aucune session générée. Vérifiez vos disponibilités et objectifs.';
        } else {
          this.messageGeneration = `${this.totalSessionsGenerees} session(s) planifiée(s) !`;
          setTimeout(() => { this.messageGeneration = ''; }, 5000);
        }
        setTimeout(() => this.cdr.detectChanges(), 0);
      }).catch((err) => {
        this.enGeneration      = false;
        this.messageGeneration = err?.error?.message || 'Erreur génération.';
        setTimeout(() => this.cdr.detectChanges(), 0);
      });
    }).catch(() => {
      this.enGeneration      = false;
      this.messageGeneration = 'Erreur sauvegarde disponibilités.';
      setTimeout(() => this.cdr.detectChanges(), 0);
    });
  }

  private getSessionsGroupe(lundiStr: string): Promise<any[]> {
    const [ly, lm, ld] = lundiStr.split('-').map(Number);
    const lundiDate = new Date(ly, lm - 1, ld, 0, 0, 0, 0);

    const finSemDate = new Date(lundiDate);
    finSemDate.setDate(lundiDate.getDate() + 7);

    const debutSemStr = lundiStr;
    const finSemStr   = `${finSemDate.getFullYear()}-${String(finSemDate.getMonth()+1).padStart(2,'0')}-${String(finSemDate.getDate()).padStart(2,'0')}`;

    return new Promise(resolve => {
      this.groupeService.getMesGroupes().subscribe({
        next: (res) => {
          const groupes: any[] = res?.data ?? res ?? [];
          if (!groupes.length) { resolve([]); return; }

          const couleursGroupe = ['#1e88e5','#00bcd4','#009688','#3f51b5','#00c853'];
          const groupesUniques = groupes.filter((g, index, self) =>
            index === self.findIndex(x => x.nom === g.nom)
          );
          const sessionsDejaTreatees = new Set<number>();

          Promise.all(
            groupesUniques.map((g: any, gi: number) =>
              this.groupeService.getSessionsGroupe(g.id).toPromise()
                .then((r: any) => {
                  const raw: any[] = r?.data ?? r ?? [];
                  const resultats: any[] = [];

                  for (const s of raw) {
                    const sessionId = s.sessionId ?? s.id;
                    if (sessionsDejaTreatees.has(sessionId)) continue;
                    sessionsDejaTreatees.add(sessionId);

                    const nomCache = this.sessionNomCache.get(sessionId) ??
                                     this.sessionNomCache.get(s.id) ?? null;
                    let nom: string = s.sessionNom ?? nomCache ??
                                      s.sessionMatiereNom ?? s.matiereNom ?? '';
                    if (!nom || nom === 'Session libre') {
                      nom = s.sessionNom ?? nomCache ?? (g.nom + ' — session');
                    }

                    const debutBrut = s.sessionDebut || s.debut || null;
                    const finBrut   = s.sessionFin   || s.fin   || null;
                    if (!debutBrut) continue;

                    const debutDate  = this.parseDate(debutBrut);
                    const finDate2: Date | null = finBrut ? this.parseDate(finBrut) : null;
                    if (!debutDate || isNaN(debutDate.getTime())) continue;

                    const debutDateStr = `${debutDate.getFullYear()}-${String(debutDate.getMonth()+1).padStart(2,'0')}-${String(debutDate.getDate()).padStart(2,'0')}`;
                    const dansLaSemaine = debutDateStr >= debutSemStr && debutDateStr < finSemStr;

                    const dureePrevueMin =
                      s.sessionDureePrevueMin || s.dureePrevueMin ||
                      (finDate2 ? Math.round(
                        (finDate2.getTime() - debutDate.getTime()) / 60000
                      ) : 90);

                    if (dansLaSemaine) {
                      resultats.push({
                        id: sessionId, debutDate, finDate: finDate2,
                        matiereNom: nom, groupeNom: g.nom,
                        groupeColor: couleursGroupe[gi % couleursGroupe.length],
                        statut: s.sessionStatut || s.statut,
                        dureePrevueMin, estGroupe: true
                      });
                    } else {
                      // Session hors semaine → projeter sur le même jour de la semaine courante
                      const jourSemaine = debutDate.getDay();
                      const jourIndex   = jourSemaine === 0 ? 6 : jourSemaine - 1;
                      const dispoJour   = this.disponibilites[jourIndex];
                      if (!dispoJour?.actif || dispoJour.creneaux.length === 0) continue;

                      const jourCible = new Date(lundiDate);
                      jourCible.setDate(lundiDate.getDate() + jourIndex);
                      jourCible.setHours(debutDate.getHours(), debutDate.getMinutes(), 0, 0);

                      let finCible: Date | null = null;
                      if (finDate2 !== null) {
                        finCible = new Date(lundiDate);
                        finCible.setDate(lundiDate.getDate() + jourIndex);
                        finCible.setHours(finDate2.getHours(), finDate2.getMinutes(), 0, 0);
                      }

                      resultats.push({
                        id: sessionId, debutDate: jourCible, finDate: finCible,
                        matiereNom: nom, groupeNom: g.nom,
                        groupeColor: couleursGroupe[gi % couleursGroupe.length],
                        statut: s.sessionStatut || s.statut,
                        dureePrevueMin, estGroupe: true
                      });
                    }
                  }
                  return resultats;
                }).catch(() => [])
            )
          ).then(all => resolve(all.flat()));
        },
        error: () => resolve([])
      });
    });
  }

  // ✅ Parser robuste : gère ISO, MySQL, microsecondes, fuseau horaire
  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date(NaN);
    try {
      const propre = dateStr.replace(' ', 'T').split('.')[0];
      const [datePart, timePart = '00:00:00'] = propre.split('T');
      const [y, mo, d]  = datePart.split('-').map(Number);
      const [h, mi, se] = (timePart + ':0:0').split(':').map(Number);
      if (!y || !mo || !d) return new Date(NaN);
      // ✅ Constructeur local (pas UTC) → pas de décalage TZ
      return new Date(y, mo - 1, d, h || 0, mi || 0, se || 0);
    } catch {
      return new Date(NaN);
    }
  }

  private construirePlanning(perso: any[], groupe: any[], lundiStr: string): JourPlanning[] {
    const [ly, lm, ld] = lundiStr.split('-').map(Number);
    const lundi = new Date(ly, lm - 1, ld, 0, 0, 0, 0);
    const map   = new Map<string, SessionPlanifiee[]>();
    this.JOURS.forEach(j => map.set(j, []));

    for (const s of perso) {
      if (!s.debut) continue;
      const d = this.parseDate(s.debut);
      if (!d || isNaN(d.getTime())) continue;
      const jourIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
      const mObj      = this.matieres.find(m => m.id === s.matiereId);
      map.get(this.JOURS[jourIndex])?.push({
        id:          s.id,
        matiere:     s.matiereNom || 'Matière',
        debut:       this.fmtDate(d),
        fin:         this.fmtDate(this.parseDate(s.fin)),
        duree:       this.fmtDuree(s.dureePrevueMin ?? 60),
        couleur:     mObj?.couleur || '#7c4dff',
        priorite:    mObj?.prioriteLibelle || 'moyenne',
        statut:      s.statut,
        typeSession: 'personnelle'
      });
    }

    for (const s of groupe) {
      const d: Date | null = s.debutDate;
      if (!d || isNaN(d.getTime())) continue;
      const jourIndex     = d.getDay() === 0 ? 6 : d.getDay() - 1;
      const finD: Date | null = s.finDate;
      const jourNom       = this.JOURS[jourIndex];

      // ✅ Sessions de groupe toujours affichées (pas de filtre chevauchement)
      map.get(jourNom)?.push({
        id:          s.id,
        matiere:     s.matiereNom || 'Session groupe',
        debut:       this.fmtDate(d),
        fin:         finD && !isNaN(finD.getTime()) ? this.fmtDate(finD) : '--:--',
        duree:       this.fmtDuree(s.dureePrevueMin ?? 60),
        couleur:     s.groupeColor || '#1e88e5',
        priorite:    'moyenne',
        statut:      s.statut,
        typeSession: 'groupe',
        groupe:      s.groupeNom || 'Groupe'
      });
    }

    return this.JOURS.map((j, i) => {
      const jourDate = new Date(lundi);
      jourDate.setDate(lundi.getDate() + i);
      return {
        jour: j,
        date: jourDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        sessions: (map.get(j) || []).sort((a, b) => a.debut.localeCompare(b.debut))
      };
    });
  }

  /* ════════════════════ EXPORT PDF ════════════════════ */

  telechargerPDF(): void {
    const html    = this.genererHtmlPlanningPourPDF();
    const fenetre = window.open('', '_blank', 'width=1200,height=800');
    if (!fenetre) { alert('Autorisez les popups pour télécharger le PDF.'); return; }
    fenetre.document.write(html);
    fenetre.document.close();
    fenetre.focus();
    setTimeout(() => { fenetre.print(); }, 800);
  }

  private genererHtmlPlanningPourPDF(): string {
    const colonnes = this.planningGenere.map(j => {
      const sessions = j.sessions.map(s => `
        <div class="session" style="border-left:3px solid ${s.couleur};background:${s.couleur}18;">
          <div class="session-heure">${s.debut} – ${s.fin}</div>
          <div class="session-nom" style="color:${s.couleur};">${s.matiere}</div>
          ${s.typeSession === 'groupe'
            ? `<div class="session-groupe">👥 ${s.groupe}</div>`
            : ''}
          <div class="session-duree">${s.duree}</div>
        </div>`).join('');
      return `<div class="col">
        <div class="col-header">${j.jour.toUpperCase()}</div>
        <div class="col-date">${j.date}</div>
        ${sessions || '<div class="libre">Libre</div>'}
      </div>`;
    }).join('');

    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
      <title>Planning ${this.semainePlanif}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:white;color:#1a1a2e;padding:20px;}
        .header{background:linear-gradient(135deg,#7c4dff,#5c35cc);color:white;padding:16px 20px;border-radius:10px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;}
        .header h1{font-size:18px;font-weight:800;}.header p{font-size:12px;opacity:.85;margin-top:4px;}
        .legende{display:flex;gap:12px;font-size:11px;}.legende span{display:flex;align-items:center;gap:5px;}
        .dot{width:10px;height:10px;border-radius:50%;display:inline-block;}
        .grille{display:flex;gap:6px;}.col{flex:1;min-width:0;}
        .col-header{background:#f5f3ff;color:#7c4dff;font-size:10px;font-weight:700;text-align:center;padding:6px 4px 0;border-radius:6px 6px 0 0;}
        .col-date{background:#f5f3ff;color:#9e86d4;font-size:9px;text-align:center;padding:0 4px 6px;border-radius:0 0 6px 6px;margin-bottom:6px;}
        .session{border-radius:6px;padding:6px 8px;margin-bottom:5px;}
        .session-heure{font-size:9px;color:#888;margin-bottom:2px;}
        .session-nom{font-size:11px;font-weight:700;margin-bottom:2px;}
        .session-groupe{font-size:9px;color:#1e88e5;margin-bottom:2px;}
        .session-duree{font-size:9px;color:#aaa;}
        .libre{color:#ccc;text-align:center;font-size:10px;padding:12px 0;}
        .footer{margin-top:14px;text-align:center;font-size:10px;color:#bbb;}
        @media print{body{padding:8px;}@page{size:landscape;margin:1cm;}
          .header,.session,.col-header,.col-date{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
      </style>
    </head><body>
      <div class="header">
        <div><h1>Planning — semaine du ${this.semainePlanif}</h1>
          <p>${this.totalSessionsGenerees} session(s) • Généré par Planify</p></div>
        <div class="legende">
          <span><span class="dot" style="background:#7c4dff;"></span>Personnelle</span>
          <span><span class="dot" style="background:#1e88e5;"></span>Groupe</span>
        </div>
      </div>
      <div class="grille">${colonnes}</div>
      <div class="footer">Planify • ${new Date().toLocaleDateString('fr-FR')}</div>
    </body></html>`;
  }

  imprimerPlanning(): void {
    const fenetre = window.open('', '_blank');
    if (!fenetre) return;
    fenetre.document.write(this.genererHtmlPlanningPourPDF());
    fenetre.document.close();
    fenetre.focus();
    setTimeout(() => { fenetre.print(); fenetre.close(); }, 600);
  }

  /* ════════════════════ UTILITAIRES ════════════════════ */

  private getLundiSemaine(): string {
    // ✅ Utiliser les méthodes locales pour éviter le décalage UTC
    const t   = new Date();
    const day = t.getDay();
    const d   = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    if (day === 0) { d.setDate(d.getDate() + 1); }
    else           { d.setDate(d.getDate() - day + 1); }
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  private getLundiDepuisDate(dateStr: string): string {
    // ✅ Parser sans UTC : "2026-05-03" → new Date(2026, 4, 3) local
    const [y, m, da] = dateStr.split('-').map(Number);
    const d   = new Date(y, m - 1, da);
    const day = d.getDay();
    if (day === 0) { d.setDate(d.getDate() + 1); }
    else           { d.setDate(d.getDate() - day + 1); }
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  private parseDateLocale(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    const d = this.parseDate(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  private fmtDate(d: Date | null): string {
    if (!d || isNaN(d.getTime())) return '--:--';
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  private fmtDuree(min: number): string {
    if (!min || min <= 0) return '—';
    const h = Math.floor(min / 60), m = min % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h${m}min`;
  }

  private hEnMin(h: string): number {
    if (!h || h === '--:--') return 0;
    const [hh, mm] = h.split(':').map(Number);
    return hh * 60 + (mm || 0);
  }
}