import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { UserService } from '../../services/user.service';
import { DisponibiliteService } from '../../services/disponibilite.service';
import { MatiereService } from '../../services/matiere.service';
import { DashboardService } from '../../services/dashboard.service';
import { Router } from '@angular/router';

export interface Disponibilite {
  id?:   number;
  jour:  string;
  actif: boolean;
  debut: string;
  fin:   string;
}

export interface Matiere {
  id?:                 number;
  nom:                 string;
  couleur:             string;
  priorite:            number;
  objectifHebdoHeures?: number;
}

@Component({
  selector:    'app-profil',
  standalone:  true,
  imports:     [CommonModule, FormsModule, SidebarComponent, RouterLink],
  templateUrl: './profil.html',
  styleUrls:   ['./profil.css']
})
export class ProfilComponent implements OnInit {

  sidebarReduite = false;
  pageActive     = 'profil';
  modeEdition    = false;
  messageSucces  = '';
  chargement     = true;

  apercuAvatar   = '';
  erreurUpload   = '';
  tailleFichier  = '';
  nomFichier     = '';

  utilisateur = {
    id:              0,
    nom:             '',
    email:           '',
    role:            '',
    dateInscription: ''
  };

  formulaire = {
    nom:               '',
    email:             '',
    ancienMotDePasse:  '',
    motDePasse:        '',
    confirmMotDePasse: ''
  };

  erreurFormulaire = '';

  objectifHebdo   = 0;
  objectifTemp    = 0;
  heuresRealisees = 0;

  get pctObjectif(): number {
    if (!this.objectifHebdo) return 0;
    return Math.min(
      Math.round((this.heuresRealisees / this.objectifHebdo) * 100),
      100
    );
  }

  readonly JOURS = [
    'Lundi','Mardi','Mercredi','Jeudi',
    'Vendredi','Samedi','Dimanche'
  ];

  disponibilites: Disponibilite[] = this.JOURS.map(j => ({
    jour: j, actif: false, debut: '09:00', fin: '12:00'
  }));

  matieres: Matiere[] = [];

  readonly COULEURS = [
    '#7c4dff','#1e88e5','#00bcd4','#00c853',
    '#ff9100','#f44336','#e91e63','#9c27b0'
  ];

  constructor(
    private userService:          UserService,
    private disponibiliteService: DisponibiliteService,
    private matiereService:       MatiereService,
    private dashboardService:     DashboardService,
    private router:               Router,
    private cdr:                  ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    this.chargerProfil();
    this.chargerDisponibilites();
    this.chargerMatieres();
    this.chargerHeuresRealisees();
  }

  /* ════════════════════
     CHARGEMENT
  ════════════════════ */

  chargerProfil(): void {
    this.chargement = true;
    this.userService.getMonProfil().subscribe({
      next: (res) => {
        const u = res?.data ?? res;
        if (!u || !u.nom) {
          this.chargement = false;
          this.cdr.detectChanges();
          return;
        }
        this.utilisateur = {
          id:              u.id    || 0,
          nom:             u.nom   || '',
          email:           u.email || '',
          role:            u.role === 'ADMINISTRATEUR' ? 'Administrateur' : 'Étudiant',
          dateInscription: this.formatDate(u.dateInscription)
        };
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.chargement = false;
        this.cdr.detectChanges();
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  chargerDisponibilites(): void {
    this.disponibiliteService.getMesDisponibilites().subscribe({
      next: (res) => {
        const disposBD: any[] = res?.data ?? res ?? [];
        this.disponibilites = this.JOURS.map(jour => {
          const trouvee = disposBD.find(
            (d: any) => d.jour?.toLowerCase() === jour.toLowerCase()
          );
          return {
            id:    trouvee?.id,
            jour,
            actif: !!trouvee,
            debut: trouvee?.heureDebut
              ? trouvee.heureDebut.substring(0, 5) : '09:00',
            fin: trouvee?.heureFin
              ? trouvee.heureFin.substring(0, 5) : '12:00'
          };
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur disponibilités:', err);
      }
    });
  }

  chargerMatieres(): void {
    this.matiereService.getMesMatieres().subscribe({
      next: (res) => {
        const liste: any[] = res?.data ?? res ?? [];
        this.matieres = liste.map((m: any, i: number) => ({
          id:                  m.id,
          nom:                 m.nom,
          couleur:             this.COULEURS[i % this.COULEURS.length],
          priorite:            m.priorite,
          objectifHebdoHeures: m.objectifHebdoHeures
        }));
        this.objectifHebdo = this.matieres.reduce(
          (acc, m) => acc + (m.objectifHebdoHeures || 0), 0
        );
        localStorage.setItem('objectif_hebdo_heures', String(this.objectifHebdo || 20));
        this.objectifTemp = this.objectifHebdo;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur matières:', err);
      }
    });
  }

  chargerHeuresRealisees(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        const minutes = data?.tempsSemainMin || 0;
        this.heuresRealisees = Math.round((minutes / 60) * 10) / 10;
        this.cdr.detectChanges();
      },
      error: () => {
        this.heuresRealisees = 0;
      }
    });
  }

  /* ════════════════════
     ÉDITION
  ════════════════════ */

  ouvrirEdition(): void {
    this.formulaire = {
      nom:               this.utilisateur.nom,
      email:             this.utilisateur.email,
      ancienMotDePasse:  '',
      motDePasse:        '',
      confirmMotDePasse: ''
    };
    this.objectifTemp     = this.objectifHebdo;
    this.erreurFormulaire = '';
    this.apercuAvatar     = '';
    this.erreurUpload     = '';
    this.nomFichier       = '';
    this.tailleFichier    = '';
    this.modeEdition      = true;
  }

  fermerEdition(): void {
    this.modeEdition      = false;
    this.erreurFormulaire = '';
  }

  sauvegarder(): void {
    this.erreurFormulaire = '';

    if (!this.formulaire.nom.trim()) {
      this.erreurFormulaire = 'Le nom est obligatoire.';
      return;
    }
    if (!this.formulaire.email.includes('@')) {
      this.erreurFormulaire = 'Email invalide.';
      return;
    }
    if (this.formulaire.motDePasse &&
        this.formulaire.motDePasse !== this.formulaire.confirmMotDePasse) {
      this.erreurFormulaire = 'Les mots de passe ne correspondent pas.';
      return;
    }
    if (this.formulaire.motDePasse &&
        this.formulaire.motDePasse.length < 6) {
      this.erreurFormulaire = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }
    if (this.formulaire.motDePasse && !this.formulaire.ancienMotDePasse) {
      this.erreurFormulaire = 'Veuillez saisir l\'ancien mot de passe.';
      return;
    }

    this.userService.modifierProfil({
      nom:   this.formulaire.nom.trim(),
      email: this.formulaire.email.trim()
    }).subscribe({
      next: (res) => {
        const u = res?.data ?? res;
        this.utilisateur.nom   = u?.nom   || this.formulaire.nom;
        this.utilisateur.email = u?.email || this.formulaire.email;

        if (this.formulaire.motDePasse) {
          this.userService.changerMotDePasse({
            ancienMotDePasse:  this.formulaire.ancienMotDePasse,
            nouveauMotDePasse: this.formulaire.motDePasse
          }).subscribe({
            next:  () => this.sauvegarderDisponibilites(),
            error: (err) => {
              this.erreurFormulaire =
                err.error?.message || 'Ancien mot de passe incorrect.';
            }
          });
        } else {
          this.sauvegarderDisponibilites();
        }
      },
      error: (err) => {
        this.erreurFormulaire =
          err.error?.message || 'Erreur lors de la modification du profil.';
      }
    });
  }

  private sauvegarderDisponibilites(): void {
    const promesses: Promise<any>[] = [];

    for (const dispo of this.disponibilites) {
      if (dispo.actif && !dispo.id) {
        promesses.push(
          this.disponibiliteService.creer({
            jour:       dispo.jour.toUpperCase(),
            heureDebut: dispo.debut + ':00',
            heureFin:   dispo.fin   + ':00'
          }).toPromise()
        );
      } else if (!dispo.actif && dispo.id) {
        promesses.push(
          this.disponibiliteService.supprimer(dispo.id).toPromise()
        );
      }
    }

    Promise.all(promesses)
      .then(() => {
        this.finSauvegarde();
      })
      .catch((err) => {
        console.error('Erreur sauvegarde disponibilités:', err);
        this.erreurFormulaire = 'Erreur lors de la sauvegarde des disponibilités.';
      });
  }

  private finSauvegarde(): void {
    this.modeEdition      = false;
    this.erreurFormulaire = '';
    this.messageSucces    = 'Profil mis à jour avec succès !';
    this.chargerDisponibilites();
    this.chargerMatieres();
    this.chargerHeuresRealisees();
    setTimeout(() => this.messageSucces = '', 4000);
    this.cdr.detectChanges();
  }

  /* ════════════════════
     PRIORITÉS
  ════════════════════ */

  libellePriorite(p: number | string): string {
    if (p === 1 || p === 'haute')   return 'Haute';
    if (p === 2 || p === 'moyenne') return 'Moyenne';
    return 'Basse';
  }

  classPriorite(p: number | string): string {
    if (p === 1 || p === 'haute')   return 'prio-haute';
    if (p === 2 || p === 'moyenne') return 'prio-moyenne';
    return 'prio-basse';
  }

  changerPriorite(m: Matiere, p: 'haute' | 'moyenne' | 'basse'): void {
    const valeur = p === 'haute' ? 1 : p === 'moyenne' ? 2 : 3;
    this.matiereService.modifier(m.id!, {
      nom:                 m.nom,
      priorite:            valeur,
      objectifHebdoHeures: m.objectifHebdoHeures
    }).subscribe({
      next: () => {
        m.priorite = valeur;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erreurFormulaire =
          err.error?.message || 'Erreur changement de priorité.';
      }
    });
  }

  /* ════════════════════
     DISPONIBILITÉS
  ════════════════════ */

  toggleDispo(d: Disponibilite): void {
    if (d.actif && !d.debut) {
      d.debut = '09:00';
      d.fin   = '12:00';
    }
  }

  /* ════════════════════
     SUPPRIMER COMPTE
  ════════════════════ */

  supprimerCompte(): void {
    if (!confirm('Êtes-vous sûr ? Cette action est irréversible.')) return;
    this.userService.supprimerCompte().subscribe({
      next: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.erreurFormulaire =
          err.error?.message || 'Erreur suppression du compte.';
      }
    });
  }

  /* ════════════════════
     UPLOAD AVATAR
  ════════════════════ */

  declencherUpload(): void {
    const input    = document.createElement('input');
    input.type     = 'file';
    input.accept   = 'image/*';
    input.onchange = (e: Event) => this.onFichierChoisi(e);
    input.click();
  }

  onFichierChoisi(event: Event): void {
    const input   = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    this.erreurUpload  = '';
    this.nomFichier    = '';
    this.tailleFichier = '';
    if (!fichier) return;

    const typesAcceptes = ['image/jpeg','image/png','image/gif','image/webp'];
    if (!typesAcceptes.includes(fichier.type)) {
      this.erreurUpload = 'Format non supporté. JPG, PNG, GIF ou WEBP.';
      return;
    }
    if (fichier.size > 2 * 1024 * 1024) {
      this.erreurUpload = 'Fichier trop lourd. Maximum 2 Mo.';
      return;
    }
    this.nomFichier    = fichier.name;
    this.tailleFichier = fichier.size < 1024 * 1024
      ? `${(fichier.size / 1024).toFixed(0)} Ko`
      : `${(fichier.size / (1024 * 1024)).toFixed(1)} Mo`;

    const reader  = new FileReader();
    reader.onload = (e) => {
      this.apercuAvatar = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(fichier);
  }

  supprimerAvatar(): void {
    this.apercuAvatar  = '';
    this.erreurUpload  = '';
    this.nomFichier    = '';
    this.tailleFichier = '';
  }

  /* ════════════════════
     UTILITAIRES
  ════════════════════ */

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }
}