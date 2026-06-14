import { Component, computed } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule }       from '@angular/material/icon';
import { MatButtonModule }     from '@angular/material/button';
import { MatTooltipModule }    from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { AuthService } from '../../features/auth/auth.service';
import { AdminDataService }    from '../admin-data.service';
import {MatBadge} from '@angular/material/badge';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  badgeSignal?: () => number;
  badgeColor?: string;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatBadge,
  ],
  templateUrl: './admin-shell.component.html',
  styleUrls:   ['./admin-shell.component.scss'],
})
export class AdminShellComponent {
  collapsed = false;

  constructor(
    public data: AdminDataService,
    private authService: AuthService,
    private router: Router
  ) {}

  get adminInitials(): string {
    const nom = this.adminName || 'A';
    return nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  get adminName(): string {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.nom ?? u.name ?? 'Admin';
    } catch {
      return 'Admin';
    }
  }

  get adminRole(): string {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.role ?? 'ADMIN';
    } catch {
      return 'ADMIN';
    }
  }

  readonly navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: 'Overview',
      items: [
        { path: 'dashboard',  label: 'Dashboard',  icon: 'dashboard'   },
        { path: 'analytics',  label: 'Analytics',  icon: 'bar_chart'   },
        { path: 'heatmap',    label: 'Heatmap',    icon: 'grid_on'     },
      ],
    },
    {
      label: 'Management',
      items: [
        { path: 'users',    label: 'Users',    icon: 'group',     badgeSignal: () => this.data.users().length,    badgeColor: 'green' },
        { path: 'sessions', label: 'Sessions', icon: 'menu_book', badgeSignal: () => this.data.liveCount(),       badgeColor: 'blue'  },
        { path: 'reports',  label: 'Reports',  icon: 'flag',      badgeSignal: () => this.data.openReports(),     badgeColor: 'red'   },
      ],
    },
    {
      label: 'System',
      items: [
        { path: 'settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ];

  formatBadge(val: number): string {
    return val > 999 ? (val / 1000).toFixed(1) + 'k' : String(val);
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('user');
        this.router.navigate(['/']);
      },
      error: () => {
        localStorage.removeItem('user');
        this.router.navigate(['/']);
      }
    });
  }
}
