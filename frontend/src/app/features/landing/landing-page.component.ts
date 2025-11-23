import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../core/auth.service';
import { ParameterService } from '../../core/parameter.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, ButtonModule, MessageModule, TranslateModule],
  templateUrl: './landing-page.component.html'
})
export class LandingPageComponent implements OnInit {
  enabledProviders = signal<string[]>([]);
  errorMessage = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private parameterService: ParameterService,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['error'] === 'inactive') {
        this.translate.get('LANDING.ERROR_INACTIVE').subscribe(msg => {
          this.errorMessage.set(msg);
        });
      }
    });

    this.parameterService.getParameter('AUTH_PROVIDERS').subscribe({
      next: (param) => {
        if (param && param.value) {
          this.enabledProviders.set(param.value.split(',').map(p => p.trim()));
        }
      },
      error: () => {
        // Fallback or default behavior if parameter fetch fails
        console.warn('Failed to fetch AUTH_PROVIDERS, defaulting to empty.');
      }
    });
  }

  login(provider: string) {
    this.authService.login(provider);
  }

  isProviderEnabled(provider: string): boolean {
    return this.enabledProviders().includes(provider);
  }
}
