import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../features/auth/auth.service';

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
    password: ''
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

    this.authService.login(this.form.email, this.form.password).subscribe({
      next: (user) => {
        this.chargement = false;
        const resolvedUser = (user as any)?.data ?? user;
        localStorage.setItem('user', JSON.stringify(resolvedUser));
        const role = String(resolvedUser?.role || '').toUpperCase();
        const isAdmin = role === 'ADMIN' || role === 'ADMINISTRATEUR' || role === 'ROLE_ADMIN';
        if (isAdmin) {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.chargement = false;
        this.erreur = err.error?.message || 'Email ou mot de passe incorrect';
      }
    });
  }
}
