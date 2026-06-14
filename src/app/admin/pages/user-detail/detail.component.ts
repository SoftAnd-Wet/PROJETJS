import { Component, computed, signal } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatTooltipModule }from '@angular/material/tooltip';
import { MatDividerModule }from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule }  from '@angular/material/table';
import { AdminDataService }    from '../../admin-data.service';
import { StatusChipComponent } from '../../shared/status-chip/status-chip.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatDividerModule, MatSnackBarModule, MatTableModule,
    StatusChipComponent,
  ],
  templateUrl: './detail.component.html',
  styleUrls:   ['./detail.component.scss'],
})
export class UserDetailComponent {

  readonly sessionColumns = ['subject', 'date', 'duration', 'members', 'role'];

  readonly user = computed(() => {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    return this.data.getUserById(id) ?? null;
  });

  // Mini bar chart: highest weekly value used to scale
  readonly maxWeekly = computed(() =>
    Math.max(...(this.user()?.weeklyHours ?? [1]))
  );

  readonly weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public  data: AdminDataService,
    private snack: MatSnackBar,
  ) {}

  barH(val: number): string {
    return Math.round((val / this.maxWeekly()) * 80) + 'px';
  }

  suspend(): void {
    const u = this.user();
    if (!u) return;
    this.data.toggleSuspend(u.id);
    const next = u.status === 'suspended' ? 'reactivated' : 'suspended';
    this.snack.open(`${u.name} has been ${next}.`, 'Dismiss', { duration: 3000 });
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }
}
