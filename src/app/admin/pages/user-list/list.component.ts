import { Component, signal, computed } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { RouterModule }    from '@angular/router';
import { MatTableModule }  from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatTooltipModule }from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminDataService }   from '../../admin-data.service';
import { StatusChipComponent } from '../../shared/status-chip/status-chip.component';
import { UserStatus } from '../../models/admin.models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatSnackBarModule, StatusChipComponent,
  ],
  templateUrl: './list.component.html',
  styleUrls:   ['./list.component.scss'],
})
export class UserListComponent {

  readonly columns = ['user', 'email', 'joined', 'sessions', 'hours', 'streak', 'status', 'arrow'];

  searchQuery  = signal('');
  statusFilter = signal<UserStatus | 'all'>('all');

  constructor(public data: AdminDataService, private snack: MatSnackBar) {}

  readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const s = this.statusFilter();
    return this.data.users().filter(u => {
      const matchStatus = s === 'all' || u.status === s;
      const matchQ      = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matchStatus && matchQ;
    });
  });

  setSearch(val: string)         { this.searchQuery.set(val); }
  setFilter(val: UserStatus | 'all') { this.statusFilter.set(val); }

  suspend(userId: number, name: string, currentStatus: string): void {
    this.data.toggleSuspend(userId);
    const next = currentStatus === 'suspended' ? 'reactivated' : 'suspended';
    this.snack.open(`${name} has been ${next}.`, 'Dismiss', { duration: 3000 });
  }
}
