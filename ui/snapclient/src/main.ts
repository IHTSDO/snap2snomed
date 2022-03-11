import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular';
import { Integrations } from '@sentry/tracing';

import { AppModule } from './app/app.module';
import { AppConfig, APP_CONFIG } from './app/app.config';

fetch(`/assets/config.json`)
  .then((response) => response.json())
  .then((snapConfig) => {
    console.log('Fetching config from: ' + `${snapConfig.apiBaseUrl}/config`);
    fetch(`${snapConfig.apiBaseUrl}/config`)
      .then((response) => response.json())
      .then((config) => {
        if (config.production) {
          enableProdMode();
        }
        config.apiBaseUrl = `${snapConfig.apiBaseUrl}`;

        Sentry.init({
          // if the DSN is set to an empty string Sentry reporting is disabled
          // if set to a URL that isn't correct (not a Sentry endpoint) the app will fail to load
          dsn: `${config.sentryDsn}`,
          environment: `${config.sentryEnvironment}`,
          release: `${config.sentryRelease}`,
          integrations: [
            // Registers and configures the Tracing integration,
            // which automatically instruments your application to monitor its
            // performance, including custom Angular routing instrumentation
            new Integrations.BrowserTracing({
              tracingOrigins: ['localhost', 'https://snap2snomed.app', 'https://dev.snap2snomed.app'],
              routingInstrumentation: Sentry.routingInstrumentation,
            }),
          ],

          // Set tracesSampleRate to 1.0 to capture 100%
          // of transactions for performance monitoring.
          // We recommend adjusting this value in production
          tracesSampleRate: 1.0,
        });

        platformBrowserDynamic([{ provide: APP_CONFIG, useValue: config }])
          .bootstrapModule(AppModule)
          .then(success => console.log(`Bootstrap success`))
          .catch((err) => console.error(err));
      })
      .catch((err) => {
        const error = document.getElementById('backenderror');
        if (error) {
          error.style.display = 'block';
        }
        console.error(err);
      });
  })
  .catch((err) => {
    // The application cannot continue from here
    const error = document.getElementById('backenderror');
    if (error) {
      error.style.display = 'block';
      error.classList.add('alert', 'alert-danger');
      error.textContent = 'Could not load application configuration!';
    }
    console.error(err);
  });
