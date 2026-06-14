import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStatus, SessionStatus, ReportStatus } from '../../models/admin.models';

export type ChipStatus = UserStatus | SessionStatus | ReportStatus;

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="chip"
      [class.active]="status === 'active'"
      [class.suspended]="status === 'suspended'"
      [class.pending]="status === 'pending'"
      [class.inactive]="status === 'inactive'"
      [class.live]="status === 'live'"
      [class.open]="status === 'open'"
      [class.closed]="status === 'closed'"
      [class.flagged]="status === 'flagged'"
      [class.reviewing]="status === 'reviewing'"
      [class.resolved]="status === 'resolved'"
    >
      {{ status }}
    </span>
  `,
  styles: [`
    :host { display: inline-block; }

    .chip {
      display: inline-flex; align-items: center;
      font-size: 11.5px; font-weight: 500;
      padding: 3px 10px; border-radius: 20px; white-space: nowrap;
      text-transform: capitalize;
    }
    .chip.active    { background: rgba(78,203,143,.12);  color: #4ecb8f; }
    .chip.suspended { background: rgba(245,107,107,.12); color: #f56b6b; }
    .chip.pending   { background: rgba(245,148,78,.12);  color: #f5944e; }
    .chip.inactive  { background: #eef2f7;               color: #64748b; }
    .chip.live      { background: rgba(78,203,143,.12);  color: #4ecb8f; }
    .chip.open      { background: rgba(78,154,241,.12);  color: #4e9af1; }
    .chip.closed    { background: #eef2f7;               color: #64748b; }
    .chip.flagged   { background: rgba(245,107,107,.12); color: #f56b6b; }
    .chip.reviewing { background: rgba(245,148,78,.12);  color: #f5944e; }
    .chip.resolved  { background: rgba(78,203,143,.12);  color: #4ecb8f; }
  `],
})
export class StatusChipComponent {
  @Input({ required: true }) status!: ChipStatus;
}
