import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule }          from '@angular/common';
import { Router, RouterModule }  from '@angular/router';

export interface ItemNav {
  id:           string;
  libelle:      string;
  route:        string;
  badge?:       string | number;
  badgeClasse?: string;
}

export interface GroupeNav {
  libelle: string;
  items:   ItemNav[];
}

@Component({
  selector:    'app-sidebar',
  standalone:  true,
  imports:     [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls:   ['./sidebar.css']
})
export class SidebarComponent implements OnInit {

  /* ── Injection moderne (pas de constructeur) ── */
  private router = inject(Router);

  /* ── Entrées / Sorties ── */
  @Input()  itemActif = 'tableau-de-bord';
  @Input()  reduit    = false;
  @Output() navigationChange = new EventEmitter<string>();
  @Output() reduitChange     = new EventEmitter<boolean>();

  /* ── Données dynamiques ── */
  sessionsAujourdhui = 3;

  /* ── Structure de navigation ── */
  readonly groupes: GroupeNav[] = [
    {
      libelle: 'Tableau de bord',
      items: [
        { id: 'tableau-de-bord', libelle: 'Tableau de bord', route: '/dashboard' }
      ]
    },
    {
      libelle: 'Planification',
      items: [
        { id: 'planificateur', libelle: 'Planificateur', route: '/planner' },
        { id: 'sessions',      libelle: 'Sessions',      route: '/sessions', badge: 3 }
      ]
    },
    {
      libelle: 'Collaboration',
      items: [
        { id: 'groupes', libelle: 'Groupes', route: '/groupes', badge: 'Nouveau', badgeClasse: 'nouveau' }
      ]
    },
    {
      libelle: 'Analytique',
      items: [
        { id: 'statistiques', libelle: 'Statistiques', route: '/statistiques' }
      ]
    },
    {
      libelle: 'Utilisateur',
      items: [
        { id: 'profil',     libelle: 'Profil',     route: '/profil'     },
    
      ]
    }
  ];

  /* ── Infos utilisateur ── */
  utilisateur = {
    nom:    'Alex Martin',
    role:   'Etudiant',
    avatar: 'https://i.pravatar.cc/40?img=5'
  };

  ngOnInit(): void {
    // Synchroniser l'item actif avec l'URL courante
    const url = this.router.url;
    for (const groupe of this.groupes) {
      for (const item of groupe.items) {
        if (url.startsWith(item.route)) {
          this.itemActif = item.id;
          return;
        }
      }
    }
  }

  /** Bascule le mode reduit / developpe */
  basculer(): void {
    this.reduit = !this.reduit;
    this.reduitChange.emit(this.reduit);
  }

  /** Navigue vers une route */
  naviguer(id: string): void {
    this.itemActif = id;
    this.navigationChange.emit(id);
    for (const groupe of this.groupes) {
      const item = groupe.items.find(i => i.id === id);
      if (item) {
        this.router.navigate([item.route]);
        return;
      }
    }
  }

  /** Deconnexion */
  seDeconnecter(): void {
    this.router.navigate(['/login']);
  }

  tracerParId(_: number, item: ItemNav): string    { return item.id; }
  tracerParLibelle(_: number, g: GroupeNav): string { return g.libelle; }
}