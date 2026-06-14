import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';
import { StatCardData } from '../../models/admin.models';
import {AdminDataService} from '../../admin-data.service';

interface HeatCell {
  date: string;
  count: number;
  level: number; // 0-4
}

interface HeatRow {
  day: string;
  cells: HeatCell[];
}

@Component({
  selector: 'app-heatmap',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss'],
})
export class HeatmapComponent implements OnInit{
  constructor(public data: AdminDataService) {}
   statCards: StatCardData[] = [];

  readonly weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  readonly hours = ['6AM','8AM','10AM','12PM','2PM','4PM','6PM','8PM','10PM'];

  // GitHub-style heatmap: rows = days of week, cols = weeks
  heatRows: HeatRow[] = [];
  hourlyRows: any[] = [];
  // Hourly distribution per day

  readonly maxHourly = 100;



  private toLevel(count: number): number {
    if (count === 0)  return 0;
    if (count < 30)   return 1;
    if (count < 55)   return 2;
    if (count < 80)   return 3;
    return 4;
  }

  cellColor(level: number): string {
    const colors = ['var(--heat-0)','var(--heat-1)','var(--heat-2)','var(--heat-3)','var(--heat-4)'];
    return colors[level];
  }

  hourlyHeight(val: number): string {
    return Math.round((val / this.maxHourly) * 80) + 'px';
  }
  ngOnInit() {
    this.data.getHeatmap().subscribe(res => {

      // Stat cards
      this.statCards = [
        { label: 'Total sessions this month', value: res.sessionsGlobalesCeMois.toString(),         trend: '', trendUp: true, iconColor: 'violet', icon: 'event_available' },
        { label: 'Most active day',           value: res.jourLePlusActif,                           trend: res.sessionsJourLePlusActif + ' sessions', trendUp: true, iconColor: 'blue', icon: 'star' },
        { label: 'Peak hour',                 value: res.heurePic + 'h',                            trend: '', trendUp: true, iconColor: 'green', icon: 'access_time' },
        { label: 'Streak champions',          value: res.streakChampions.toString(),                trend: '', trendUp: true, iconColor: 'orange', icon: 'local_fire_department' },
      ];

      // Heatmap — group by day
      const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      this.heatRows = days.map(day => ({
        day,
        cells: ['Semaine 1','Semaine 2','Semaine 3','Semaine 4'].map(semaine => {
          const cell = res.heatmap.find((c: any) => c.jour === day && c.semaine === semaine);
          const count = cell ? cell.count : 0;
          return { date: semaine, count, level: this.toLevel(count) };
        })
      }));

      // Hourly distribution — group by day
      this.hourlyRows = days.map(day => ({
        day,
        values: [6,8,10,12,14,16,18,20,22].map(hour => {
          const entry = res.distributionHoraire.find((d: any) => d.jour === day && d.heure === hour);
          return entry ? entry.count : 0;
        })
      }));

    });
  }
}
