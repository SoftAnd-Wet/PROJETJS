// profil.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar';

export interface Disponibilite {
  jour:   string;
  actif:  boolean;
  debut:  string;
  fin:    string;
}

export interface Matiere {
  nom:      string;
  couleur:  string;
  priorite: 'haute' | 'moyenne' | 'basse';
}

@Component({
  selector:    'app-profil',
  standalone:  true,
  imports:     [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './profil.html',
  styleUrls:   ['./profil.css']
})
export class ProfilComponent implements OnInit {

  sidebarReduite = false;
  pageActive     = 'profil';

  /* ── Mode édition ── */
  modeEdition   = false;
  messageSucces = '';

  /* ── Upload avatar ── */
  apercuAvatar  = '';         // base64 de la prévisualisation
  erreurUpload  = '';
  tailleFichier = '';         // ex: '1.2 Mo'
  nomFichier    = '';         // nom du fichier choisi

  /* ── 1. Informations utilisateur ── */
  utilisateur = {
    nom:    'Alex Martin',
    email:  'alex.martin@email.com',
    role:   'Etudiant',
    avatar: 'https://i.pravatar.cc/120?img=5',
    dateInscription: '1 janvier 2025'
  };

  /* Copie pour l'édition */
  formulaire = { ...this.utilisateur, motDePasse: '', confirmMotDePasse: '' };
  erreurFormulaire = '';

  /* ── 2. Objectifs d'étude ── */
  objectifHebdo = 20;        // heures par semaine
  objectifTemp  = 20;        // valeur temporaire en édition
  heuresRealisees = 12;      // cette semaine

  get pctObjectif(): number {
    return Math.min(Math.round((this.heuresRealisees / this.objectifHebdo) * 100), 100);
  }

  /* ── 3. Disponibilités ── */
  disponibilites: Disponibilite[] = [
    { jour:'Lundi',    actif:true,  debut:'18:00', fin:'21:00' },
    { jour:'Mardi',    actif:true,  debut:'17:00', fin:'20:00' },
    { jour:'Mercredi', actif:true,  debut:'14:00', fin:'18:00' },
    { jour:'Jeudi',    actif:false, debut:'',      fin:''      },
    { jour:'Vendredi', actif:true,  debut:'18:00', fin:'22:00' },
    { jour:'Samedi',   actif:true,  debut:'09:00', fin:'13:00' },
    { jour:'Dimanche', actif:false, debut:'',      fin:''      },
  ];

  /* ── 4. Matières et priorités ── */
  matieres: Matiere[] = [
    { nom:'Mathematiques',   couleur:'#7c4dff', priorite:'haute'   },
    { nom:'Algorithmes',     couleur:'#1e88e5', priorite:'haute'   },
    { nom:'Base de donnees', couleur:'#00bcd4', priorite:'moyenne' },
    { nom:'IA et ML',        couleur:'#ff9100', priorite:'moyenne' },
    { nom:'Reseaux',         couleur:'#f44336', priorite:'basse'   },
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  /* ── Ouvrir / Fermer édition ── */
  ouvrirEdition(): void {
    this.formulaire = {
      ...this.utilisateur,
      motDePasse: '',
      confirmMotDePasse: ''
    };
    this.erreurFormulaire = '';
    this.objectifTemp     = this.objectifHebdo;
    this.apercuAvatar     = '';
    this.erreurUpload     = '';
    this.modeEdition      = true;
  }

  fermerEdition(): void {
    this.modeEdition      = false;
    this.erreurFormulaire = '';
  }

  /* ── Sauvegarder ── */
  sauvegarder(): void {
    // Validation
    if (!this.formulaire.nom.trim()) {
      this.erreurFormulaire = 'Le nom est obligatoire.';
      return;
    }
    if (!this.formulaire.email.trim() || !this.formulaire.email.includes('@')) {
      this.erreurFormulaire = 'Adresse email invalide.';
      return;
    }
    if (this.formulaire.motDePasse &&
        this.formulaire.motDePasse !== this.formulaire.confirmMotDePasse) {
      this.erreurFormulaire = 'Les mots de passe ne correspondent pas.';
      return;
    }
    if (this.objectifTemp <= 0 || this.objectifTemp > 80) {
      this.erreurFormulaire = "L'objectif doit etre entre 1 et 80 heures.";
      return;
    }

    // Appliquer les changements
    this.utilisateur.nom   = this.formulaire.nom.trim();
    this.utilisateur.email = this.formulaire.email.trim();
    this.objectifHebdo     = this.objectifTemp;
    // Appliquer le nouvel avatar s'il a été choisi
    if (this.apercuAvatar) {
      this.utilisateur.avatar = this.apercuAvatar;
      this.apercuAvatar = '';
    }

    this.modeEdition      = false;
    this.erreurFormulaire = '';
    this.messageSucces    = 'Profil mis a jour avec succes !';
    setTimeout(() => this.messageSucces = '', 3000);
  }

  /* ── Priorité ── */
  libellePriorite(p: string): string {
    return p === 'haute' ? 'Haute' : p === 'moyenne' ? 'Moyenne' : 'Basse';
  }

  changerPriorite(m: Matiere, p: 'haute' | 'moyenne' | 'basse'): void {
    m.priorite = p;
  }

  /* ── Upload avatar ── */
  declencherUpload(): void {
    // Créer un input file dynamique sans ViewChild
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => this.onFichierChoisi(e);
    input.click();
  }

  onFichierChoisi(event: Event): void {
    const input   = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    this.erreurUpload = '';
    this.nomFichier   = '';
    this.tailleFichier = '';

    if (!fichier) return;

    // ── Vérification du type MIME ──
    const typesAcceptes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!typesAcceptes.includes(fichier.type)) {
      this.erreurUpload = 'Format non supporté. Utilisez JPG, PNG, GIF ou WEBP.';
      return;
    }

    // ── Vérification de la taille (2 Mo max) ──
    const tailleMax = 2 * 1024 * 1024; // 2 Mo en octets
    if (fichier.size > tailleMax) {
      const tailleActuelle = (fichier.size / (1024 * 1024)).toFixed(1);
      this.erreurUpload = `Fichier trop lourd (${tailleActuelle} Mo). Maximum : 2 Mo.`;
      return;
    }

    // ── Infos affichées ──
    this.nomFichier    = fichier.name;
    this.tailleFichier = fichier.size < 1024 * 1024
      ? `${(fichier.size / 1024).toFixed(0)} Ko`
      : `${(fichier.size / (1024 * 1024)).toFixed(1)} Mo`;

    // ── Conversion en Base64 via FileReader ──
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const base64 = e.target?.result as string;
      // base64 = "data:image/jpeg;base64,/9j/4AAQ..."
      this.apercuAvatar = base64;
      this.cdr.detectChanges(); // forcer la mise à jour Angular
    };

    reader.onerror = () => {
      this.erreurUpload = 'Erreur lors de la lecture du fichier.';
    };

    // Lancer la lecture — FileReader convertit en data URL (base64)
    reader.readAsDataURL(fichier);
  }

  supprimerAvatar(): void {
    this.apercuAvatar = '';
    this.erreurUpload = '';
  }

  /* ── Disponibilité ── */
  toggleDispo(d: Disponibilite): void {
    d.actif = !d.actif;
    if (d.actif && !d.debut) {
      d.debut = '09:00';
      d.fin   = '12:00';
    }
  }
}