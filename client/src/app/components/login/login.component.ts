import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styles: []
})
export class LoginComponent {
  loading = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Rediriger vers le dashboard si déjà connecté
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.loading = true;
    this.error = null;
    
    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      this.error = 'Échec de la connexion avec Google. Veuillez réessayer.';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }
} 