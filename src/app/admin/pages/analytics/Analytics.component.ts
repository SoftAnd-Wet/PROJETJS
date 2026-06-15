import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }         from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdminDataService }     from '../../admin-data.service';
import { StatCardComponent }    from '../../shared/stat-card/stat-card.component';
import { StatCardData, BAR_DAYS } from '../../models/admin.models';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, StatCardComponent],
  templateUrl: './Analytics.component.html',
  styleUrls:   ['./Analytics.component.scss'],
})
export class AnalyticsComponent implements OnInit {
  constructor(public data: AdminDataService, private cdr: ChangeDetectorRef) {}

  statCards: StatCardData[] = [];
  weeklyGrowth: any[] = [];
  retentionDays: number[] = [];
  retentionPct: number[] = [];
  subjects: any[] = [];
  maxGrowthUsers = 1300;
  barDays = BAR_DAYS;
  maxBar  = 100;
  loading = true;

  barH(val: number, max: number): string {
    return Math.round((val / max) * 120) + 'px';
  }

  ngOnInit() {
    this.data.getTableauDeBord().subscribe(res => {
      this.loading = false;

      this.statCards = [
        { label: 'New users this month',    value: res.nouveauxUtilisateursCeMois.toString(), trend: '', trendUp: true, iconColor: 'violet', icon: 'group_add' },
        { label: 'Avg daily study time',    value: res.tempsMoyenEtudeHeures + 'h',           trend: '', trendUp: true, iconColor: 'blue',   icon: 'schedule' },
        { label: 'Avg members per session', value: res.moyenneMembresParSession.toString(),    trend: '', trendUp: true, iconColor: 'green',  icon: 'people' },
        { label: 'Avg study streak',        value: res.moyenneSerieEtude + 'd',               trend: '', trendUp: true, iconColor: 'orange', icon: 'local_fire_department' },
      ];

      this.weeklyGrowth = res.croissanceHebdomadaire.map((w: any) => ({
        label:    w.label,
        users:    w.utilisateurs,
        sessions: w.sessions
      }));
      this.maxGrowthUsers = Math.max(...this.weeklyGrowth.map((w: any) => w.users), 1);

      this.retentionDays = res.retention.jours;
      this.retentionPct  = res.retention.pourcentages;

      this.subjects = res.sessionsBySubject.map((s: any, i: number) => ({
        name:  s.nom,
        pct:   s.pct,
        color: ['#7c6ef5', '#4f9ef8', '#34c77b', '#f5a623', '#e85d5d'][i % 5]
      }));

      this.cdr.detectChanges();
    });
  }
}
