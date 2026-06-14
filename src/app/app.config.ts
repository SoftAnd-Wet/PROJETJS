import { ApplicationConfig, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { lastValueFrom } from 'rxjs';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { routes } from './app.routes';
import { AuthService } from './features/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return lastValueFrom(authService.fetchCurrentUser()).catch(() => {});
    })
  ]
};
