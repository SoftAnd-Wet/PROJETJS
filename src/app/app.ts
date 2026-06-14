import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './features/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('PROJETJS');

  constructor(private authService: AuthService) {
    this.authService.fetchCurrentUser().subscribe({ error: () => {} });
  }

  ngOnInit() {
    this.authService.fetchCurrentUser().subscribe({
      error: () => {}
    });
  }
}
