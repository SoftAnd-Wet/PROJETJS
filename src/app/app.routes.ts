import { Routes } from '@angular/router';
import { DashboardComponent } from './userpages/dashboard/dashboard';
import { PlannerComponent } from'./userpages/planner/planner'
import { SessionsComponent } from'./userpages/sessions/sessions'
import { GroupesComponent } from'./userpages/groupes/groupes'
import { StatistiquesComponent } from'./userpages/statistiques/statistiques'
import { ProfilComponent } from'./userpages/profil/profil'

export const routes: Routes = [
  { path:'dashboard', component: DashboardComponent },
  { path:'planner', component: PlannerComponent },
  { path:'sessions', component: SessionsComponent },
  { path:'groupes', component: GroupesComponent },
  { path:'statistiques', component: StatistiquesComponent },
  { path:'profil', component: ProfilComponent }


];