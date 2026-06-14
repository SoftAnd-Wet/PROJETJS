import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StatCardData } from '../../models/admin.models';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="stat-card">
      <div class="stat-header">
        <div
          class="stat-icon"
          [style.background]="iconBg(data.iconColor)"
          [style.color]="iconColor(data.iconColor)"
        >
          <mat-icon>{{ data.icon }}</mat-icon>
        </div>
        <span class="trend-badge" [class.up]="data.trendUp" [class.down]="!data.trendUp">
          {{ data.trendUp ? '↗' : '↘' }} {{ data.trend }}
        </span>
      </div>
      <div class="stat-value">{{ data.value }}</div>
      <div class="stat-label">{{ data.label }}</div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .stat-card {
      background: var(--bg2, #ffffff);
      border: none;
      border-radius: var(--radius-lg);
      padding: 18px 20px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .stat-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 26px rgba(15, 23, 42, 0.09);
    }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    .stat-icon {
      width: 36px; height: 36px;
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .trend-badge {
      font-size: 11.5px; font-weight: 500;
      padding: 3px 8px; border-radius: 20px;
    }
    .trend-badge.up   { background: rgba(78,203,143,.12);  color: #4ecb8f; }
    .trend-badge.down { background: rgba(245,107,107,.12); color: #f56b6b; }

    .stat-value {
      font-size: 26px; font-weight: 600;
      letter-spacing: -0.5px; margin-bottom: 4px; line-height: 1.1;
    }

    .stat-label { font-size: 12.5px; color: var(--muted, #64748b); }
  `],
})
export class StatCardComponent {
  @Input({ required: true }) data!: StatCardData;

  iconBg(type: StatCardData['iconColor']): string {
    const colors: Record<StatCardData['iconColor'], string> = {
      violet: 'rgba(124,110,245,.12)',
      blue: 'rgba(78,154,241,.12)',
      green: 'rgba(78,203,143,.12)',
      orange: 'rgba(245,148,78,.12)',
    };
    return colors[type];
  }

  iconColor(type: StatCardData['iconColor']): string {
    const colors: Record<StatCardData['iconColor'], string> = {
      violet: '#9d91f8',
      blue: '#4e9af1',
      green: '#4ecb8f',
      orange: '#f5944e',
    };
    return colors[type];
  }
}
