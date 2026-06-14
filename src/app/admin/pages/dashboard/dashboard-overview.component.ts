import { Component, OnInit , ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatTableModule }       from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule }     from '@angular/material/divider';
import { AdminDataService }     from '../../admin-data.service';
import { StatCardComponent }    from '../../shared/stat-card/stat-card.component';
import { StatusChipComponent }  from '../../shared/status-chip/status-chip.component';
import { StatCardData, BAR_DAYS, TOP_SUBJECTS, SubjectStat } from '../../models/admin.models';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatDividerModule,
    StatCardComponent,
    StatusChipComponent,
  ],
  templateUrl: './dashboard-overview.component.html',
  styleUrls:   ['./dashboard-overview.component.scss'],
})
export class DashboardOverviewComponent implements OnInit {

  constructor(public data: AdminDataService, private cdr: ChangeDetectorRef) {}
  statCards: StatCardData[] = [];

  barDays : any []  = [];
  subjects: any[] = [];
  recentUsers: any[] = [];

  readonly maxBar   = 100;

  readonly healthMetrics = [
    { label: 'Uptime',       value: '99.8%', color: 'var(--green)'  },
    { label: 'Avg response', value: '142ms', color: 'var(--blue)'   },
    { label: 'Error rate',   value: '0.4%',  color: 'var(--orange)' },
  ];

  barH(val: number): string {
    return Math.round((val / this.maxBar) * 120) + 'px';
  }

  ngOnInit() {
    this.data.getCompleteDashboard().subscribe(res => {
      console.log('full dashboard res:', res); // confirm keys match

      this.statCards = [
        { label: 'Total users',         value: res.totalUtilisateurs.toString(), trend: '', trendUp: true,  iconColor: 'violet', icon: 'group'       },
        { label: 'Active sessions now', value: res.sessionsActives.toString(),   trend: '', trendUp: true,  iconColor: 'blue',   icon: 'menu_book'   },
        { label: 'Study hours / week',  value: res.heuresEtudeSemaine + 'h',    trend: '', trendUp: true,  iconColor: 'green',  icon: 'trending_up' },
        { label: 'Open reports',        value: this.data.openReports().toString(), trend: '', trendUp: false, iconColor: 'orange', icon: 'flag'      },
      ];

      this.barDays  = res.activiteJournaliere;
      this.subjects = res.topMatieres.map((s: any, i: number) => ({
        name:  s.nom,
        pct:   s.pct,
        color: ['#7c6ef5', '#4f9ef8', '#34c77b', '#f5a623', '#e85d5d'][i % 5]
      }));

      this.recentUsers = res.inscriptionsRecentes.map((u: any) => ({
        ...u,
        status:   u.status ?? 'active',
        joinDate: new Date(u.joinDate).toLocaleDateString('fr-FR')
      }));

      this.cdr.detectChanges();
    });
  }
  get liveSessions()   { return this.data.sessions().filter(s => s.status === 'live'); }
}
