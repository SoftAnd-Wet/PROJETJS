// src/app/auth/auth-modal/auth-modal.component.ts
import { Component, EventEmitter, Input, OnInit, Output ,ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

function passwordsMatch(group: AbstractControl) {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss']
})
export class AuthModalComponent implements OnInit {
  @Input() initialTab: 'login' | 'register' = 'login';
  @Output() close = new EventEmitter<void>();

  activeTab: 'login' | 'register' = 'login';
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.activeTab = this.initialTab;

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatch });
  }

  switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
    this.errorMessage = '';
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.loading = false;
        this.handleLoginSuccess(res);
        this.close.emit();
      },
      error: (err) => {
        console.log('LOGIN ERROR', err);
        this.errorMessage = err.status === 401
          ? 'Incorrect email or password.'
          : 'Login failed. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    const { name, email, password } = this.registerForm.value;

    this.authService.register(name, email, password).subscribe({
      next: () => {
        // Auto-login after register
        this.authService.login(email, password).subscribe({
          next: (res) => {
            this.loading = false;
            this.handleLoginSuccess(res);
            this.close.emit();
          },
          error: () => {
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.errorMessage = err.status === 401
          ? 'Incorrect email or password.'
          : 'Login failed. Please try again.';
        this.loading = false;
      }
    });
  }

  private handleLoginSuccess(res: any): void {
    const user = res?.data ?? res;
    localStorage.setItem('user', JSON.stringify(user));
    const role = String(user?.role || '').toUpperCase();
    const isAdmin = role === 'ADMIN' || role === 'ADMINISTRATEUR' || role === 'ROLE_ADMIN';
    if (isAdmin) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  // Getters for cleaner template access
  get lEmail() { return this.loginForm.get('email')!; }
  get lPassword() { return this.loginForm.get('password')!; }
  get rName() { return this.registerForm.get('name')!; }
  get rEmail() { return this.registerForm.get('email')!; }
  get rPassword() { return this.registerForm.get('password')!; }
  get rConfirm() { return this.registerForm.get('confirmPassword')!; }
}
