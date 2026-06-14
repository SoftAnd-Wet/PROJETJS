import { Routes } from '@angular/router';
import { AdminShellComponent }        from './shell/admin-shell.component';
import { DashboardOverviewComponent } from './pages/dashboard/dashboard-overview.component';
import { AnalyticsComponent }         from './pages/analytics/Analytics.component';
import { UserListComponent }          from './pages/user-list/list.component';
import { UserDetailComponent }        from './pages/user-detail/detail.component';
import { SessionListComponent }       from './pages/session-list/list.component';
import { ReportListComponent }        from './pages/report-list/list.component';
import { SettingsComponent }          from './pages/settings/Settings.component';
import { HeatmapComponent } from './pages/heatmap/heatmap.component';
export const ADMIN_ROUTES: Routes = [
  {
    path: 'admin',
    component: AdminShellComponent,
    children: [
      { path: '',           redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',  component: DashboardOverviewComponent },
      { path: 'analytics',  component: AnalyticsComponent         },
      { path: 'users',      component: UserListComponent           },
      { path: 'users/:id',  component: UserDetailComponent         },
      { path: 'sessions',   component: SessionListComponent        },
      { path: 'reports',    component: ReportListComponent         },
      { path: 'heatmap', component: HeatmapComponent },
      { path: 'settings',   component: SettingsComponent           },
    ],
  },
];
