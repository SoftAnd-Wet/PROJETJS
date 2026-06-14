import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../features/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {

  form = {
    nom: '',
    email: '',
    motDePasse: '',
    confirmMotDePasse: ''
  };

  erreur: string = '';
  chargement: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.erreur = '';

    if (this.form.motDePasse !== this.form.confirmMotDePasse) {
      this.erreur = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (this.form.motDePasse.length < 6) {
      this.erreur = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    this.chargement = true;

    this.authService.register(this.form.nom, this.form.email, this.form.motDePasse).subscribe({
      next: () => {
        this.chargement = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.chargement = false;
        this.erreur = err.error?.message || 'Erreur lors de l\'inscription';
      }
    });
  }
}
