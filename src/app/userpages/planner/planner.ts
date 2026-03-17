import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { SidebarComponent }  from '../sidebar/sidebar';

export interface Matiere {
  nom:            string;
  objectifHeures: number;
  priorite:       'haute' | 'moyenne' | 'basse';
  couleur:        string;
}

export interface Creneau {
  debut: string;
  fin:   string;
}

export interface Disponibilite {
  jour:     string;
  actif:    boolean;
  creneaux: Creneau[];
}

export interface SessionPlanifiee {
  matiere:  string;
  debut:    string;
  fin:      string;
  duree:    string;
  couleur:  string;
  priorite: 'haute' | 'moyenne' | 'basse';
}

export interface JourPlanning {
  jour:     string;
  sessions: SessionPlanifiee[];
}

@Component({
  selector:    'app-planner',
  standalone:  true,
  imports:     [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './planner.html',
  styleUrls:   ['./planner.css']
})
export class PlannerComponent implements OnInit {

  pageActive     = 'planificateur';
  sidebarReduite = false;

  /* ── Matieres ── */
  matieres: Matiere[] = [
    { nom: 'Mathematiques',   objectifHeures: 5, priorite: 'haute',   couleur: '#7c4dff' },
    { nom: 'Algorithmes',     objectifHeures: 3, priorite: 'moyenne', couleur: '#1e88e5' },
    { nom: 'Base de donnees', objectifHeures: 4, priorite: 'haute',   couleur: '#00bcd4' },
    { nom: 'IA et ML',        objectifHeures: 2, priorite: 'basse',   couleur: '#ff9100' },
  ];

  formulaireMatiereOuvert = false;
  matiereEnEdition        = -1;
  erreurFormulaire        = '';   // message affiché sous le formulaire

  nouvelleMatiere: Matiere = {
    nom: '', objectifHeures: 2, priorite: 'moyenne', couleur: '#7c4dff'
  };

  readonly couleursDisponibles = [
    '#7c4dff', '#1e88e5', '#00bcd4', '#00c853',
    '#ff9100', '#f44336', '#e91e63', '#9c27b0',
    '#3f51b5', '#009688', '#8bc34a', '#ff5722'
  ];

  /* ── Disponibilites ── */
  disponibilites: Disponibilite[] = [
    { jour: 'Lundi',    actif: true,  creneaux: [{ debut: '18:00', fin: '21:00' }] },
    { jour: 'Mardi',    actif: true,  creneaux: [{ debut: '17:00', fin: '20:00' }] },
    { jour: 'Mercredi', actif: true,  creneaux: [{ debut: '14:00', fin: '18:00' }] },
    { jour: 'Jeudi',    actif: false, creneaux: [] },
    { jour: 'Vendredi', actif: true,  creneaux: [{ debut: '18:00', fin: '22:00' }] },
    { jour: 'Samedi',   actif: true,  creneaux: [{ debut: '09:00', fin: '13:00' }] },
    { jour: 'Dimanche', actif: false, creneaux: [] },
  ];

  // Stocke les erreurs de chevauchement : clé = "Lundi-0", valeur = message
  erreursCreneaux: Map<string, string> = new Map();

  /* ── Generation ── */
  dureeMaxSession = 1.5;
  enGeneration    = false;

  /* ── Resultat ── */
  planningGenere: JourPlanning[] = [];
  vueCalendrier  = true;

  get totalSessionsGenerees(): number {
    return this.planningGenere.reduce((acc, j) => acc + j.sessions.length, 0);
  }

  ngOnInit(): void {}

  /* ════ MATIERES ════ */

  libellePriorite(p: string): string {
    return p === 'haute' ? 'Haute' : p === 'moyenne' ? 'Moyenne' : 'Basse';
  }

  ouvrirFormulaireMatiere(): void {
    this.formulaireMatiereOuvert = true;
    this.matiereEnEdition        = -1;
    this.erreurFormulaire        = '';
    this.nouvelleMatiere = { nom: '', objectifHeures: 2, priorite: 'moyenne', couleur: '#7c4dff' };
  }

  modifierMatiere(index: number): void {
    this.matiereEnEdition        = index;
    this.formulaireMatiereOuvert = true;
    this.erreurFormulaire        = '';
    this.nouvelleMatiere         = { ...this.matieres[index] };
  }

  fermerFormulaireMatiere(): void {
    this.formulaireMatiereOuvert = false;
    this.matiereEnEdition        = -1;
    this.erreurFormulaire        = '';
  }

  // ✅ AMELIORATION 1 — Validation renforcée : nom + objectifHeures > 0 + doublon
  sauvegarderMatiere(): void {
    // 1. Nom obligatoire
    if (!this.nouvelleMatiere.nom.trim()) {
      this.erreurFormulaire = 'Le nom de la matiere est obligatoire.';
      return;
    }

    // 2. Objectif hebdomadaire > 0
    if (!this.nouvelleMatiere.objectifHeures || this.nouvelleMatiere.objectifHeures <= 0) {
      this.erreurFormulaire = "L'objectif hebdomadaire doit etre superieur a 0.";
      return;
    }

    // 3. Pas de doublon
    const nomNorm = this.nouvelleMatiere.nom.trim().toLowerCase();
    const doublon = this.matieres.some(
      (m, i) => m.nom.trim().toLowerCase() === nomNorm && i !== this.matiereEnEdition
    );
    if (doublon) {
      this.erreurFormulaire = 'Une matiere avec ce nom existe deja.';
      return;
    }

    // Sauvegarde
    if (this.matiereEnEdition >= 0) {
      this.matieres[this.matiereEnEdition] = { ...this.nouvelleMatiere };
    } else {
      this.matieres.push({ ...this.nouvelleMatiere });
    }
    this.fermerFormulaireMatiere();
  }

  supprimerMatiere(index: number): void {
    this.matieres.splice(index, 1);
  }

  /* ════ DISPONIBILITES ════ */

  ajouterCreneau(dispo: Disponibilite): void {
    const derniere = dispo.creneaux[dispo.creneaux.length - 1];
    const debut    = derniere ? derniere.fin : '08:00';
    const finH     = parseInt(debut.split(':')[0]) + 2;
    const fin      = `${String(Math.min(finH, 23)).padStart(2, '0')}:00`;
    dispo.creneaux.push({ debut, fin });
  }

  supprimerCreneau(dispo: Disponibilite, index: number): void {
    dispo.creneaux.splice(index, 1);
    this.erreursCreneaux.delete(`${dispo.jour}-${index}`);
    // Revalider les créneaux restants après suppression
    dispo.creneaux.forEach((_, i) => this.validerCreneau(dispo, i));
  }

  // ✅ AMELIORATION 2 — Détection de chevauchement à chaque modification
  validerCreneau(dispo: Disponibilite, indexModifie: number): void {
    const cle = `${dispo.jour}-${indexModifie}`;
    const cr  = dispo.creneaux[indexModifie];

    if (!cr.debut || !cr.fin) return;

    // Règle 1 : fin > debut
    if (cr.debut >= cr.fin) {
      this.erreursCreneaux.set(cle, "L'heure de fin doit etre apres le debut.");
      return;
    }

    const debutMin = this.heureEnMinutes(cr.debut);
    const finMin   = this.heureEnMinutes(cr.fin);

    // Règle 2 : pas de chevauchement avec les autres créneaux du même jour
    for (let i = 0; i < dispo.creneaux.length; i++) {
      if (i === indexModifie) continue;
      const autre      = dispo.creneaux[i];
      if (!autre.debut || !autre.fin) continue;
      const autreDebut = this.heureEnMinutes(autre.debut);
      const autreFin   = this.heureEnMinutes(autre.fin);

      // Chevauchement = les intervalles se croisent
      if (debutMin < autreFin && finMin > autreDebut) {
        this.erreursCreneaux.set(
          cle,
          `Chevauchement avec ${autre.debut} - ${autre.fin}`
        );
        return;
      }
    }

    // Pas d'erreur : nettoyer
    this.erreursCreneaux.delete(cle);
  }

  getErreurCreneau(jour: string, index: number): string {
    return this.erreursCreneaux.get(`${jour}-${index}`) ?? '';
  }

  get aDesErreurs(): boolean {
    return this.erreursCreneaux.size > 0;
  }

  /* Vérifie tous les créneaux avant génération */
  private creneauxTousTousTousTousValides(): boolean {
    for (const dispo of this.disponibilites) {
      if (!dispo.actif) continue;
      for (let i = 0; i < dispo.creneaux.length; i++) {
        if (this.erreursCreneaux.has(`${dispo.jour}-${i}`)) return false;
        const cr = dispo.creneaux[i];
        if (!cr.debut || !cr.fin || cr.debut >= cr.fin) return false;
      }
    }
    return true;
  }

  /* ════ GENERATION ════ */

  genererPlanning(): void {
    if (!this.creneauxTousTousTousTousValides()) {
      alert('Corrigez les creneaux invalides avant de generer le planning.');
      return;
    }

    this.enGeneration = true;

    const ordreP: Record<string, number> = { haute: 0, moyenne: 1, basse: 2 };
    const matieresTri = [...this.matieres].sort(
      (a, b) => ordreP[a.priorite] - ordreP[b.priorite]
    );

    const tempsRestant: Map<string, number> = new Map(
      matieresTri.map(m => [m.nom, m.objectifHeures * 60])
    );

    const dureeMaxMin = Math.round(this.dureeMaxSession * 60);
    const result: JourPlanning[] = [];

    for (const dispo of this.disponibilites) {
      const sessionsJour: SessionPlanifiee[] = [];

      if (dispo.actif) {
        // Tri des créneaux par heure de début (pas de chevauchement garanti)
        const creneauxTries = [...dispo.creneaux].sort(
          (a, b) => this.heureEnMinutes(a.debut) - this.heureEnMinutes(b.debut)
        );

        for (const creneau of creneauxTries) {
          let curseur      = this.heureEnMinutes(creneau.debut);
          const finCreneau = this.heureEnMinutes(creneau.fin);

          for (const matiere of matieresTri) {
            const restant = tempsRestant.get(matiere.nom) ?? 0;
            if (restant <= 0) continue;
            if (curseur >= finCreneau) break;

            const disponible   = finCreneau - curseur;
            const dureeSession = Math.min(restant, dureeMaxMin, disponible);
            if (dureeSession < 15) continue;

            const debutStr = this.minutesEnHeure(curseur);
            curseur       += dureeSession;
            const finStr   = this.minutesEnHeure(curseur);

            sessionsJour.push({
              matiere:  matiere.nom,
              debut:    debutStr,
              fin:      finStr,
              duree:    this.formatDuree(dureeSession),
              couleur:  matiere.couleur,
              priorite: matiere.priorite
            });

            tempsRestant.set(matiere.nom, restant - dureeSession);
          }
        }
      }

      result.push({ jour: dispo.jour, sessions: sessionsJour });
    }

    setTimeout(() => {
      this.planningGenere = result;
      this.enGeneration   = false;
    }, 700);
  }

  /* ════ Utilitaires ════ */

  private heureEnMinutes(heure: string): number {
    const [h, m] = heure.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  private minutesEnHeure(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private formatDuree(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }
}