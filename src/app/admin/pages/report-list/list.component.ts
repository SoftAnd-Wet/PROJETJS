import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatTooltipModule }from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminDataService }    from '../../admin-data.service';
import { StatusChipComponent } from '../../shared/status-chip/status-chip.component';
import { ReportStatus, AdminAction } from '../../models/admin.models';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule,
    MatTooltipModule, MatSnackBarModule,
    StatusChipComponent,
  ],
  templateUrl: './list.component.html',
  styleUrls:   ['./list.component.scss'],
})
export class ReportListComponent implements OnInit {

  statusFilter = signal<ReportStatus | 'all'>('all');
  searchQuery  = signal('');

  constructor(public data: AdminDataService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.data.loadReports();
  }

  readonly filtered = computed(() => {
    const f = this.statusFilter();
    const q = this.searchQuery().toLowerCase();
    return this.data.reports().filter(r => {
      const matchStatus = f === 'all' || r.status === f;
      const matchQuery  = !q ||
        r.id.toString().includes(q) ||
        r.reportedTarget.toLowerCase().includes(q) ||
        r.contentSnapshot.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  });

  readonly flaggedCount   = computed(() => this.data.reports().filter(r => r.status === 'flagged').length);
  readonly reviewingCount = computed(() => this.data.reports().filter(r => r.status === 'reviewing').length);

  setFilter(val: ReportStatus | 'all') { this.statusFilter.set(val); }
  setSearch(val: string) { this.searchQuery.set(val); }

  update(id: number, status: ReportStatus): void {
    this.data.updateReportStatus(id, status);
    const label = status === 'reviewing' ? 'under review' : status;
    this.snack.open(`Report #${id} marked as ${label}.`, 'Dismiss', { duration: 3000 });
  }

  ban(reportedUserId: number, reportId: number): void {
    this.data.toggleSuspend(reportedUserId);
    this.data.updateReportStatus(reportId, 'resolved', 'suspend_user');
    this.snack.open(`User #${reportedUserId} banned and report resolved.`, 'Dismiss', { duration: 3000 });
  }
}
