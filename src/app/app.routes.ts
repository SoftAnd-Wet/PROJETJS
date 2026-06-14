import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { DashboardComponent } from './userpages/dashboard/dashboard';
import { PlannerComponent } from './userpages/planner/planner';
import { SessionsComponent } from './userpages/sessions/sessions';
import { GroupesComponent } from './userpages/groupes/groupes';
import { StatistiquesComponent } from './userpages/statistiques/statistiques';
import { ProfilComponent } from './userpages/profil/profil';
import { ADMIN_ROUTES } from './admin/admin.routes';
import { authGuard, roleGuard } from './features/auth/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  // any logged in user
  { path: 'dashboard',    component: DashboardComponent,   canActivate: [authGuard] },
  { path: 'planner',      component: PlannerComponent,     canActivate: [authGuard] },
  { path: 'sessions',     component: SessionsComponent,    canActivate: [authGuard] },
  { path: 'groupes',      component: GroupesComponent,     canActivate: [authGuard] },
  { path: 'statistiques', component: StatistiquesComponent,canActivate: [authGuard] },
  { path: 'profil',       component: ProfilComponent,      canActivate: [authGuard] },

  // admin only
  ...ADMIN_ROUTES,

  { path: '**', redirectTo: '' }
];
