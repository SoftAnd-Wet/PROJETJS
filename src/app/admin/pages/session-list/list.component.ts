import { Component, signal, computed } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { RouterModule }    from '@angular/router';
import { MatTableModule }  from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatTooltipModule }from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminDataService }    from '../../admin-data.service';
import { StatusChipComponent } from '../../shared/status-chip/status-chip.component';
import { SessionStatus }       from '../../models/admin.models';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatSnackBarModule, StatusChipComponent,
  ],
  templateUrl: './list.component.html',
  styleUrls:   ['./list.component.scss'],
})
export class SessionListComponent {

  readonly columns = ['subject', 'host', 'topic', 'members', 'duration', 'created', 'status', 'actions'];

  searchQuery    = signal('');
  statusFilter   = signal<SessionStatus | 'all'>('all');

  constructor(public data: AdminDataService, private snack: MatSnackBar) {}

  readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const s = this.statusFilter();
    return this.data.sessions().filter(sess => {
      const matchStatus = s === 'all' || sess.status === s;
      const matchQ      = !q
        || sess.subject.toLowerCase().includes(q)
        || sess.host.toLowerCase().includes(q)
        || sess.topic.toLowerCase().includes(q);
      return matchStatus && matchQ;
    });
  });

  setSearch(val: string)                   { this.searchQuery.set(val); }
  setFilter(val: SessionStatus | 'all')    { this.statusFilter.set(val); }

  delete(id: number, subject: string): void {
    this.data.deleteSession(id);
    this.snack.open(`Session "${subject}" deleted.`, 'Dismiss', { duration: 3000 });
  }
}
