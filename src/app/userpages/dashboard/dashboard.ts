import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { SidebarComponent }  from '../sidebar/sidebar';

/* ── Interfaces ── */
export interface JourSemaine {
  jour:          string;   // ex: 'Lun'
  concentration: number;   // heures
  revision:      number;
  lecture:       number;
}

export interface Matiere {
  nom:      string;
  heures:   string;
  pct:      number;    // 0-100
  couleur:  string;
  tendance: number;    // >0 hausse, <0 baisse
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

  /* ── État sidebar ── */
  pageActive     = 'tableau-de-bord';
  sidebarReduite = false;

  /* ── Barre supérieure ── */
  recherche   = '';
  periodeSel  = 'Semaine';

  /* ── Cartes statistiques ── */
  tempsEtudeAujourdhui  = '4h 20min';
  sessionsAujourdhui    = 3;
  progressionHebdo      = 68;
  totalHeuresSemaine    = 24;

  /* ── Données graphique hebdomadaire ── */
  donneesSemaine: JourSemaine[] = [
    { jour: 'Lun', concentration: 3,   revision: 1,   lecture: 0.5 },
    { jour: 'Mar', concentration: 5,   revision: 2,   lecture: 1   },
    { jour: 'Mer', concentration: 4,   revision: 1.5, lecture: 0.5 },
    { jour: 'Jeu', concentration: 6,   revision: 2,   lecture: 1.5 },
    { jour: 'Ven', concentration: 2,   revision: 0.5, lecture: 0   },
    { jour: 'Sam', concentration: 3.5, revision: 1,   lecture: 1   },
    { jour: 'Dim', concentration: 1,   revision: 0.5, lecture: 0.5 },
  ];

  /* ── Matières ── */
  matieres: Matiere[] = [
    { nom: 'Mathématiques', heures: '2h 30min', pct: 80, couleur: '#7c4dff', tendance:  1 },
    { nom: 'Algorithmes',   heures: '1h 45min', pct: 60, couleur: '#1e88e5', tendance:  1 },
    { nom: 'Base de données', heures: '1h 10min', pct: 40, couleur: '#00bcd4', tendance: -1 },
    { nom: 'IA & ML',       heures: '45min',    pct: 25, couleur: '#ff9100', tendance:  1 },
    { nom: 'Réseaux',       heures: '30min',    pct: 15, couleur: '#f44336', tendance: -1 },
  ];

  /* ── Sessions du jour ── */
  sessionsJour: SessionJour[] = [
    { matiere: 'Mathématiques',   heure: '09:00', duree: '1h 30min', couleur: '#7c4dff', statut: 'termine',  libelleStatut: 'Terminé'   },
    { matiere: 'Algorithmes',     heure: '11:00', duree: '1h 00min', couleur: '#1e88e5', statut: 'termine',  libelleStatut: 'Terminé'   },
    { matiere: 'Base de données', heure: '14:00', duree: '1h 00min', couleur: '#00bcd4', statut: 'en-cours', libelleStatut: 'En cours'  },
    { matiere: 'IA & ML',         heure: '16:30', duree: '45min',    couleur: '#ff9100', statut: 'planifie', libelleStatut: 'Planifié'  },
    { matiere: 'Réseaux',         heure: '18:00', duree: '30min',    couleur: '#f44336', statut: 'planifie', libelleStatut: 'Planifié'  },
  ];

  /* ── Série d'étude ── */
  serie         = 7;
  meilleuresSerie = 21;
  joursSerie: JourSerie[] = [];

  ngOnInit(): void {
    this.construireGrilleSerie();
  }

  /** Construit la grille 28 jours pour la série */
  private construireGrilleSerie(): void {
    const aujourd = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(aujourd);
      d.setDate(aujourd.getDate() - i);
      this.joursSerie.push({
        actif:      i < this.serie,
        aujourdhui: i === 0,
        libelle:    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      });
    }
  }

  /** Calcule le total des heures de la semaine */
  get totalCalcule(): number {
    return this.donneesSemaine.reduce(
      (acc, j) => acc + j.concentration + j.revision + j.lecture, 0
    );
  }

  /** Recherche (à brancher sur un service) */
  onRecherche(terme: string): void {
    console.log('Recherche :', terme);
  }

  /** Changement de période du graphique (à brancher sur un service) */
  onChangementPeriode(periode: string): void {
    this.periodeSel = periode;
    console.log('Période sélectionnée :', periode);
    // Appeler votre service ici pour charger les données correspondantes
  }
}