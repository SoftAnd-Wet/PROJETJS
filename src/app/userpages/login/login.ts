import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  form = {
    email: '',
    motDePasse: ''
  };

  erreur: string = '';
  chargement: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.erreur = '';
    this.chargement = true;

    this.authService.login(this.form).subscribe({
      next: () => {
        this.chargement = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.chargement = false;
        this.erreur = err.error?.message || 'Email ou mot de passe incorrect';
      }
    });
  }
}