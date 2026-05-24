import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { DashboardService } from '../../services/dashboard.service';

export interface ItemNav {
  id: string;
  libelle: string;
  route: string;
  badge?: string | number;
  badgeClasse?: string;
}

export interface GroupeNav {
  libelle: string;
  items: ItemNav[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {

  private router = inject(Router);
  private userService = inject(UserService);
  private dashboardService = inject(DashboardService);

  @Input() itemActif = 'tableau-de-bord';
  @Input() reduit = false;
  @Output() navigationChange = new EventEmitter<string>();
  @Output() reduitChange = new EventEmitter<boolean>();

  sessionsAujourdhui = 0;

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
        { id: 'sessions', libelle: 'Sessions', route: '/sessions', badge: 0 }
      ]
    },
    {
      libelle: 'Collaboration',
      items: [
        { id: 'groupes', libelle: 'Groupes', route: '/groupes' }
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
        { id: 'profil', libelle: 'Profil', route: '/profil' }
      ]
    }
  ];

  utilisateur = {
    nom: '',
    role: ''
  };

  ngOnInit(): void {
    this.synchroniserItemActif();
    this.chargerProfilSidebar();
    this.chargerSessionsAujourdhui();
  }

  private synchroniserItemActif(): void {
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

  private chargerProfilSidebar(): void {
    this.userService.getMonProfil().subscribe({
      next: (res) => {
        const u = res?.data ?? res;

        this.utilisateur = {
          nom: u?.nom || 'Utilisateur',
          role: u?.role === 'ADMINISTRATEUR' ? 'Administrateur' : 'Étudiant'
        };
      },
      error: () => {
        const userLocal = localStorage.getItem('user');
        if (userLocal) {
          try {
            const u = JSON.parse(userLocal);
            this.utilisateur = {
              nom: u?.nom || 'Utilisateur',
              role: u?.role === 'ADMINISTRATEUR' ? 'Administrateur' : 'Étudiant'
            };
          } catch {
            this.utilisateur = { nom: 'Utilisateur', role: 'Étudiant' };
          }
        } else {
          this.utilisateur = { nom: 'Utilisateur', role: 'Étudiant' };
        }
      }
    });
  }

  private chargerSessionsAujourdhui(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        const data = res?.data ?? res;

        // adapte selon ton backend
        this.sessionsAujourdhui =
          data?.sessionsAujourdhui ??
          data?.nbSessionsAujourdhui ??
          data?.sessionsAujourdHui ??
          0;

        const itemSessions = this.groupes
          .flatMap(g => g.items)
          .find(i => i.id === 'sessions');

        if (itemSessions) {
          itemSessions.badge = this.sessionsAujourdhui;
        }
      },
      error: () => {
        this.sessionsAujourdhui = 0;
      }
    });
  }

  basculer(): void {
    this.reduit = !this.reduit;
    this.reduitChange.emit(this.reduit);
  }

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

  seDeconnecter(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  tracerParId(_: number, item: ItemNav): string {
    return item.id;
  }

  tracerParLibelle(_: number, g: GroupeNav): string {
    return g.libelle;
  }
}