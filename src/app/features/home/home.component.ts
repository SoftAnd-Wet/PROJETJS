// src/app/home/home.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AuthModalComponent } from '../auth/auth-modal/auth-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, AuthModalComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  showModal = false;
  modalTab: 'login' | 'register' = 'login';

  constructor(public authService: AuthService) {}

  openLogin() {
    this.modalTab = 'login';
    this.showModal = true;
  }

  openRegister() {
    this.modalTab = 'register';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  logout() {
    this.authService.logout().subscribe();
  }
}
