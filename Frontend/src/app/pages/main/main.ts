import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppConfigurator } from '@/layout/components/app.configurator';
import { AuthService } from '@/services/auth.service';
import { CommonModule } from '@angular/common';

// ⚠️ deja tu import del map como está
import { MapComponent } from 'public/app/map/map';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './main.html'
})
export class Main implements OnInit {

  user: any = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.user = this.authService.getUser();

    if (!this.user) {
      this.router.navigate(['/auth/login']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}