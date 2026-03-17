import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar';

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

  /* ─── 1. TEMPS TOTAL ETUDIÉ ─── */
  tempsAujourdhui = '3h 20min';
  tempsSemaine    = '24h 30min';
  tempsMois       = '98h 15min';

  /* ─── 2. PROGRESSION PAR MATIÈRE ─── */
  progressionMatieres = [
    { nom:'Mathematiques',   couleur:'#7c4dff', heures:8,   objectif:10, pct:80  },
    { nom:'Algorithmes',     couleur:'#1e88e5', heures:6,   objectif:8,  pct:75  },
    { nom:'Base de donnees', couleur:'#00bcd4', heures:4.5, objectif:8,  pct:56  },
    { nom:'IA et ML',        couleur:'#ff9100', heures:3,   objectif:6,  pct:50  },
    { nom:'Reseaux',         couleur:'#f44336', heures:1.5, objectif:4,  pct:38  },
  ];

  /* ─── 3. SESSIONS PRÉVUES VS RÉALISÉES ─── */
  comparaisonSessions = [
    { matiere:'Algorithmes',     couleur:'#1e88e5', prevues:6, realisees:4 },
    { matiere:'Base de donnees', couleur:'#00bcd4', prevues:4, realisees:3 },
    { matiere:'Mathematiques',   couleur:'#7c4dff', prevues:5, realisees:5 },
    { matiere:'IA et ML',        couleur:'#ff9100', prevues:3, realisees:2 },
    { matiere:'Reseaux',         couleur:'#f44336', prevues:2, realisees:1 },
  ];

  get totalPrevues():   number { return this.comparaisonSessions.reduce((a,s) => a + s.prevues,   0); }
  get totalRealisees(): number { return this.comparaisonSessions.reduce((a,s) => a + s.realisees, 0); }
  get tauxGlobal():     number { return Math.round((this.totalRealisees / this.totalPrevues) * 100); }

  /* ─── 4. PRODUCTIVITÉ HEBDOMADAIRE ─── */
  productiviteHebdo = [
    { jour:'Lundi',     heures:2,   pct:50  },
    { jour:'Mardi',     heures:3,   pct:75  },
    { jour:'Mercredi',  heures:1,   pct:25  },
    { jour:'Jeudi',     heures:3.5, pct:88  },
    { jour:'Vendredi',  heures:1.5, pct:38  },
    { jour:'Samedi',    heures:2,   pct:50  },
    { jour:'Dimanche',  heures:1,   pct:25  },
  ];

  get maxHeures(): number {
    return Math.max(...this.productiviteHebdo.map(j => j.heures));
  }

  get totalHeuresSemaine(): number {
    return this.productiviteHebdo.reduce((a, j) => a + j.heures, 0);
  }

  ngOnInit(): void {}

  formatH(h: number): string {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return mm === 0 ? `${hh}h` : `${hh}h${mm}`;
  }
}