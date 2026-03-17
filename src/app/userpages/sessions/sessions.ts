import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar';

export interface Session {
  id:       number;
  date:     string;
  matiere:  string;
  couleur:  string;
  debut:    string;
  fin:      string;
  duree:    string;
  statut:   'planifiee' | 'en-cours' | 'terminee' | 'manquee';
  priorite: 'haute' | 'moyenne' | 'basse';
  partagee: boolean;
  groupe?:  string;
  membres?: string[];
  hote?:    string;
}

export interface JourHistorique {
  date:     string;
  libelle:  string;
  sessions: number;
  heures:   number;
}

@Component({
  selector:    'app-sessions',
  standalone:  true,
  imports:     [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './sessions.html',
  styleUrls:   ['./sessions.css']
})
export class SessionsComponent implements OnInit {

  sidebarReduite = false;
  pageActive     = 'sessions';

  /* ── Onglet actif ── */
  ongletActif: 'aujourd-hui' | 'toutes' | 'groupes' | 'historique' = 'aujourd-hui';

  /* ── Recherche dans "toutes les sessions" ── */
  rechercheSession = '';

  /* ── Statistiques ── */
  tempsAujourdhui    = '3h 20min';
  sessionsCompletees = 4;
  objectifSemaine    = { fait: 12, total: 20 };

  /* ── Toutes les sessions ── */
  toutesLesSessions: Session[] = [
    { id:1,  date:'2025-03-13', matiere:'Mathematiques',   couleur:'#7c4dff', debut:'18:00', fin:'19:30', duree:'1h30', statut:'terminee',  priorite:'haute',   partagee:false },
    { id:2,  date:'2025-03-13', matiere:'Base de donnees', couleur:'#00bcd4', debut:'19:30', fin:'20:30', duree:'1h',   statut:'terminee',  priorite:'haute',   partagee:false },
    { id:3,  date:'2025-03-13', matiere:'Algorithmes',     couleur:'#1e88e5', debut:'21:00', fin:'22:00', duree:'1h',   statut:'planifiee', priorite:'moyenne', partagee:false },
    { id:4,  date:'2025-03-14', matiere:'Mathematiques',   couleur:'#7c4dff', debut:'17:00', fin:'18:30', duree:'1h30', statut:'planifiee', priorite:'haute',   partagee:false },
    { id:5,  date:'2025-03-14', matiere:'IA et ML',        couleur:'#ff9100', debut:'19:00', fin:'20:00', duree:'1h',   statut:'planifiee', priorite:'basse',   partagee:false },
    { id:6,  date:'2025-03-12', matiere:'Algorithmes',     couleur:'#1e88e5', debut:'18:00', fin:'19:30', duree:'1h30', statut:'terminee',  priorite:'moyenne', partagee:false },
    { id:7,  date:'2025-03-12', matiere:'Base de donnees', couleur:'#00bcd4', debut:'20:00', fin:'21:00', duree:'1h',   statut:'terminee',  priorite:'haute',   partagee:false },
    // Sessions de groupe
    { id:8,  date:'2025-03-13', matiere:'Algorithmes',     couleur:'#1e88e5', debut:'14:00', fin:'16:00', duree:'2h',   statut:'terminee',  priorite:'haute',   partagee:true, groupe:'Algo Team',  membres:['Alex','Sara','Karim'], hote:'Alex' },
    { id:9,  date:'2025-03-14', matiere:'Mathematiques',   couleur:'#7c4dff', debut:'10:00', fin:'12:00', duree:'2h',   statut:'planifiee', priorite:'haute',   partagee:true, groupe:'Math Squad', membres:['Alex','Lina','Omar'],  hote:'Lina' },
    { id:10, date:'2025-03-15', matiere:'Base de donnees', couleur:'#00bcd4', debut:'15:00', fin:'17:00', duree:'2h',   statut:'planifiee', priorite:'moyenne', partagee:true, groupe:'BD Masters', membres:['Alex','Sara'],         hote:'Sara' },
  ];

  /* ── Historique ── */
  historique: JourHistorique[] = [
    { date:'2025-03-13', libelle:"Aujourd'hui", sessions:3, heures:3.5 },
    { date:'2025-03-12', libelle:'Hier',         sessions:2, heures:3   },
    { date:'2025-03-11', libelle:'11 mars',      sessions:2, heures:3.5 },
    { date:'2025-03-10', libelle:'10 mars',      sessions:2, heures:3   },
  ];

  /* ── Modal partage ── */
  modalPartageOuvert = false;
  sessionAPartager:  Session | null = null;
  groupesDisponibles = ['Algo Team', 'Math Squad', 'BD Masters', 'AI Lab'];
  groupeSelectionne  = '';

  ngOnInit(): void {}

  /* ── Getters ── */
  get sessionsAujourdhui(): Session[] {
    return this.toutesLesSessions.filter(s => s.date === '2025-03-13');
  }

  get sessionsDeGroupe(): Session[] {
    return this.toutesLesSessions.filter(s => s.partagee);
  }

  /* ── Sessions filtrées par recherche ── */
  get sessionsFiltrees(): Session[] {
    if (!this.rechercheSession.trim()) return this.toutesLesSessions;
    const terme = this.rechercheSession.trim().toLowerCase();
    return this.toutesLesSessions.filter(s =>
      s.matiere.toLowerCase().includes(terme) ||
      s.debut.includes(terme) ||
      s.date.includes(terme) ||
      this.libelleStatut(s.statut).toLowerCase().includes(terme)
    );
  }

  get pctObjectifSemaine(): number {
    return Math.round((this.objectifSemaine.fait / this.objectifSemaine.total) * 100);
  }

  /* ── Lancer une session ── */
  lancerSession(s: Session): void {
    s.statut = 'en-cours';
  }

  /* ── Partage ── */
  ouvrirModalPartage(s: Session): void {
    this.sessionAPartager  = s;
    this.groupeSelectionne = '';
    this.modalPartageOuvert = true;
  }

  fermerModalPartage(): void {
    this.modalPartageOuvert = false;
    this.sessionAPartager   = null;
  }

  partagerSession(): void {
    if (!this.sessionAPartager || !this.groupeSelectionne) return;
    const shared: Session = {
      ...this.sessionAPartager,
      id:       Date.now(),
      partagee: true,
      groupe:   this.groupeSelectionne,
      membres:  ['Alex'],
      hote:     'Alex',
      statut:   'planifiee'
    };
    this.toutesLesSessions.push(shared);
    this.fermerModalPartage();
  }

  /* ── Utilitaires ── */
  libelleStatut(s: string): string {
    const map: Record<string, string> = {
      'planifiee': 'Planifiee',
      'en-cours':  'En cours',
      'terminee':  'Terminee',
      'manquee':   'Manquee'
    };
    return map[s] ?? s;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
  }

  initiales(nom: string): string {
    return nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}