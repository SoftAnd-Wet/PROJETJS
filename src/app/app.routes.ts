import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

import { LoginComponent } from './userpages/login/login';
import { RegisterComponent } from './userpages/register/register';

import { DashboardComponent } from './userpages/dashboard/dashboard';
import { PlannerComponent } from './userpages/planner/planner';
import { SessionsComponent } from './userpages/sessions/sessions';
import { GroupesComponent } from './userpages/groupes/groupes';
import { StatistiquesComponent } from './userpages/statistiques/statistiques';
import { ProfilComponent } from './userpages/profil/profil';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    component: DashboardComponent
  },
  {
    path: 'planner',
    canActivate: [authGuard],
    component: PlannerComponent
  },
  {
    path: 'sessions',
    canActivate: [authGuard],
    component: SessionsComponent
  },
  {
    path: 'groupes',
    canActivate: [authGuard],
    component: GroupesComponent
  },
  {
    path: 'statistiques',
    canActivate: [authGuard],
    component: StatistiquesComponent
  },
  {
    path: 'profil',
    canActivate: [authGuard],
    component: ProfilComponent
  },

  { path: '**', redirectTo: 'login' }
  
];