import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar';

export interface Membre {
  id:       number;
  nom:      string;
  role:     'admin' | 'membre';
  actif:    boolean;
  avatar?:  string;
}

export interface SessionGroupe {
  id:      number;
  matiere: string;
  couleur: string;
  jour:    string;
  heure:   string;
  fin:     string;
  duree:   string;
  statut:  'planifiee' | 'en-cours' | 'terminee';
  hote:    string;
}

export interface MessageChat {
  id:        number;
  auteur:    string;
  texte:     string;
  horodatage: string;
  moi:       boolean;
}

export interface Groupe {
  id:           number;
  nom:          string;
  description:  string;
  couleur:      string;
  emoji:        string;
  membres:      Membre[];
  sessions:     SessionGroupe[];
  messages:     MessageChat[];
  codeInvit:    string;
  dateCreation: string;
}

export interface Notification {
  id:      number;
  type:    'invitation' | 'session' | 'commentaire' | 'membre';
  texte:   string;
  groupe:  string;
  temps:   string;
  lu:      boolean;
}

@Component({
  selector:    'app-groupes',
  standalone:  true,
  imports:     [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './groupes.html',
  styleUrls:   ['./groupes.css']
})
export class GroupesComponent implements OnInit {

  sidebarReduite = false;
  pageActive     = 'groupes';

  /* ── Vue ── */
  ongletActif: 'mes-groupes' | 'notifications' = 'mes-groupes';
  groupeSelectionne: Groupe | null = null;
  panneauActif: 'membres' | 'sessions' | 'chat' = 'sessions';

  /* ── Modaux ── */
  modalCreerOuvert    = false;
  modalInviterOuvert  = false;
  modalSessionOuvert  = false;

  /* ── Nouveau groupe ── */
  nouveauGroupe = { nom: '', description: '', couleur: '#7c4dff', emoji: '📚' };
  readonly couleursGroupe = ['#7c4dff','#1e88e5','#00bcd4','#00c853','#ff9100','#f44336','#e91e63'];
  readonly emojisGroupe   = ['📚','💻','🔬','🧮','🤖','📊','🎯','⚡'];

  /* ── Invitation ── */
  emailInvitation = '';
  erreurInvitation = '';

  /* ── Nouvelle session ── */
  nouvelleSession = { matiere: '', heure: '', fin: '', jour: 'Lundi' };

  /* ── Chat ── */
  nouveauMessage = '';

  /* ── Données ── */
  mesgroupes: Groupe[] = [
    {
      id: 1, nom: 'Algo Team', description: 'Révision algorithmes et structures de données',
      couleur: '#1e88e5', emoji: '💻', codeInvit: 'ALGO42', dateCreation: '2025-03-01',
      membres: [
        { id:1, nom:'Alex Martin',  role:'admin',  actif:true  },
        { id:2, nom:'Sara Benali',  role:'membre', actif:true  },
        { id:3, nom:'Karim Idrissi',role:'membre', actif:false },
        { id:4, nom:'Lina Moussai', role:'membre', actif:true  },
      ],
      sessions: [
        { id:1, matiere:'Algorithmes',   couleur:'#1e88e5', jour:'Mardi',  heure:'19:00', fin:'21:00', duree:'2h',   statut:'planifiee', hote:'Alex'  },
        { id:2, matiere:'Structures',    couleur:'#7c4dff', jour:'Jeudi',  heure:'20:00', fin:'22:00', duree:'2h',   statut:'planifiee', hote:'Sara'  },
        { id:3, matiere:'Algorithmes',   couleur:'#1e88e5', jour:'Samedi', heure:'10:00', fin:'12:00', duree:'2h',   statut:'terminee',  hote:'Karim' },
      ],
      messages: [
        { id:1, auteur:'Sara',  texte:'On révise les graphes ce soir ?',       horodatage:'18:42', moi:false },
        { id:2, auteur:'Moi',   texte:'Oui je suis dispo à partir de 19h',     horodatage:'18:45', moi:true  },
        { id:3, auteur:'Karim', texte:'Je serai en retard, commencez sans moi',horodatage:'18:50', moi:false },
        { id:4, auteur:'Lina',  texte:'OK ! On démarre à 19h alors',           horodatage:'18:52', moi:false },
      ]
    },
    {
      id: 2, nom: 'Math Squad', description: 'Mathématiques et analyse pour les examens',
      couleur: '#7c4dff', emoji: '🧮', codeInvit: 'MATH99', dateCreation: '2025-02-20',
      membres: [
        { id:1, nom:'Alex Martin',  role:'membre', actif:true  },
        { id:5, nom:'Lina Moussai', role:'admin',  actif:true  },
        { id:6, nom:'Omar Fassi',   role:'membre', actif:true  },
      ],
      sessions: [
        { id:4, matiere:'Mathematiques', couleur:'#7c4dff', jour:'Lundi',   heure:'10:00', fin:'12:00', duree:'2h', statut:'planifiee', hote:'Lina' },
        { id:5, matiere:'Analyse',       couleur:'#9c27b0', jour:'Vendredi',heure:'14:00', fin:'16:00', duree:'2h', statut:'planifiee', hote:'Omar' },
      ],
      messages: [
        { id:5, auteur:'Lina', texte:'Chapitre 5 pour lundi svp',horodatage:'09:10', moi:false },
        { id:6, auteur:'Moi',  texte:'Vu ! Je prépare les exercices', horodatage:'09:15', moi:true },
      ]
    },
    {
      id: 3, nom: 'BD Masters', description: 'Base de données relationnelles et NoSQL',
      couleur: '#00bcd4', emoji: '📊', codeInvit: 'BD2025', dateCreation: '2025-03-05',
      membres: [
        { id:1, nom:'Alex Martin', role:'membre', actif:true  },
        { id:2, nom:'Sara Benali', role:'admin',  actif:true  },
      ],
      sessions: [
        { id:6, matiere:'Base de donnees', couleur:'#00bcd4', jour:'Mercredi', heure:'15:00', fin:'17:00', duree:'2h', statut:'planifiee', hote:'Sara' },
      ],
      messages: [
        { id:7, auteur:'Sara', texte:'Révision SQL pour mercredi', horodatage:'14:00', moi:false },
      ]
    }
  ];

  groupesDecouverte = [
    { id:10, nom:'IA Lab',       description:'Intelligence artificielle et ML', couleur:'#ff9100', emoji:'🤖', membres:7, ouvert:true  },
    { id:11, nom:'Reseaux Team', description:'Réseaux et sécurité informatique',couleur:'#e91e63', emoji:'🔬', membres:4, ouvert:true  },
    { id:12, nom:'Web Dev',      description:'Développement web full-stack',    couleur:'#00c853', emoji:'🎯', membres:9, ouvert:false },
  ];

  notifications: Notification[] = [
    { id:1, type:'invitation',   texte:'Sara vous invite à rejoindre "IA Lab"',       groupe:'IA Lab',    temps:'il y a 5 min',   lu:false },
    { id:2, type:'session',      texte:'Nouvelle session dans "Algo Team" — Mardi 19h',groupe:'Algo Team', temps:'il y a 1h',      lu:false },
    { id:3, type:'commentaire',  texte:'Karim a commenté la session Algorithmes',      groupe:'Algo Team', temps:'il y a 2h',      lu:true  },
    { id:4, type:'membre',       texte:'Omar a rejoint "Math Squad"',                  groupe:'Math Squad',temps:'il y a 3h',      lu:true  },
    { id:5, type:'session',      texte:'Rappel : session BD Masters dans 30 min',      groupe:'BD Masters',temps:'il y a 30 min',  lu:false },
  ];

  ngOnInit(): void {}

  /* ── Getters ── */
  get notificationsNonLues(): number {
    return this.notifications.filter(n => !n.lu).length;
  }

  get totalMembres(): number {
    const ids = new Set<number>();
    this.mesgroupes.forEach(g => g.membres.forEach(m => ids.add(m.id)));
    return ids.size;
  }

  /* ── Sélection groupe ── */
  ouvrirGroupe(g: Groupe): void {
    this.groupeSelectionne = g;
    this.panneauActif = 'sessions';
  }

  fermerGroupe(): void {
    this.groupeSelectionne = null;
  }

  /* ── Créer groupe ── */
  ouvrirModalCreer(): void {
    this.modalCreerOuvert = true;
    this.nouveauGroupe = { nom:'', description:'', couleur:'#7c4dff', emoji:'📚' };
  }

  creerGroupe(): void {
    if (!this.nouveauGroupe.nom.trim()) return;
    const g: Groupe = {
      id:           Date.now(),
      nom:          this.nouveauGroupe.nom.trim(),
      description:  this.nouveauGroupe.description.trim(),
      couleur:      this.nouveauGroupe.couleur,
      emoji:        this.nouveauGroupe.emoji,
      codeInvit:    Math.random().toString(36).substring(2,8).toUpperCase(),
      dateCreation: new Date().toISOString().slice(0,10),
      membres:      [{ id:1, nom:'Alex Martin', role:'admin', actif:true }],
      sessions:     [],
      messages:     []
    };
    this.mesgroupes.push(g);
    this.modalCreerOuvert = false;
  }

  quitterGroupe(id: number): void {
    this.mesgroupes = this.mesgroupes.filter(g => g.id !== id);
    if (this.groupeSelectionne?.id === id) this.groupeSelectionne = null;
  }

  /* ── Inviter ── */
  ouvrirModalInviter(): void {
    this.modalInviterOuvert = true;
    this.emailInvitation  = '';
    this.erreurInvitation = '';
  }

  envoyerInvitation(): void {
    if (!this.emailInvitation.trim()) {
      this.erreurInvitation = 'Entrez un email ou un nom.';
      return;
    }
    // Simulation : ajouter comme membre
    if (this.groupeSelectionne) {
      this.groupeSelectionne.membres.push({
        id:    Date.now(),
        nom:   this.emailInvitation.trim(),
        role:  'membre',
        actif: false
      });
    }
    this.modalInviterOuvert = false;
  }

  copierCode(code: string): void {
    navigator.clipboard?.writeText(code).catch(() => {});
  }

  /* ── Session groupe ── */
  ouvrirModalSession(): void {
    this.modalSessionOuvert = true;
    this.nouvelleSession = { matiere:'', heure:'', fin:'', jour:'Lundi' };
  }

  creerSessionGroupe(): void {
    if (!this.nouvelleSession.matiere.trim() || !this.nouvelleSession.heure) return;
    if (!this.groupeSelectionne) return;
    this.groupeSelectionne.sessions.push({
      id:      Date.now(),
      matiere: this.nouvelleSession.matiere,
      couleur: this.groupeSelectionne.couleur,
      jour:    this.nouvelleSession.jour,
      heure:   this.nouvelleSession.heure,
      fin:     this.nouvelleSession.fin || '—',
      duree:   '—',
      statut:  'planifiee',
      hote:    'Alex'
    });
    this.modalSessionOuvert = false;
  }

  /* ── Chat ── */
  envoyerMessage(): void {
    if (!this.nouveauMessage.trim() || !this.groupeSelectionne) return;
    this.groupeSelectionne.messages.push({
      id:         Date.now(),
      auteur:     'Moi',
      texte:      this.nouveauMessage.trim(),
      horodatage: new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),
      moi:        true
    });
    this.nouveauMessage = '';
  }

  /* ── Notifications ── */
  marquerLu(n: Notification): void { n.lu = true; }
  toutMarquerLu(): void { this.notifications.forEach(n => n.lu = true); }

  /* ── Rejoindre découverte ── */
  rejoindreSuggestion(id: number): void {
    const g = this.groupesDecouverte.find(x => x.id === id);
    if (!g) return;
    this.mesgroupes.push({
      id: g.id, nom: g.nom, description: g.description,
      couleur: g.couleur, emoji: g.emoji,
      codeInvit: Math.random().toString(36).substring(2,8).toUpperCase(),
      dateCreation: new Date().toISOString().slice(0,10),
      membres:  [{ id:1, nom:'Alex Martin', role:'membre', actif:true }],
      sessions: [], messages: []
    });
    this.groupesDecouverte = this.groupesDecouverte.filter(x => x.id !== id);
  }

  /* ── Utilitaires ── */
  initiales(nom: string): string {
    return nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  }

  libelleStatut(s: string): string {
    const m: Record<string,string> = { 'planifiee':'Planifiee','en-cours':'En cours','terminee':'Terminee' };
    return m[s] ?? s;
  }

  iconeNotif(type: string): string {
    const m: Record<string,string> = {
      'invitation':'👋','session':'📅','commentaire':'💬','membre':'👤'
    };
    return m[type] ?? '🔔';
  }
}