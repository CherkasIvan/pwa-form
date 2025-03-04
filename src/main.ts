import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);

if ('serviceWorker' in navigator) {
  console.log('Service Worker is supported in this browser.');
  console.log(navigator);

  window.addEventListener('load', () => {
    console.log('Page loaded. Registering Service Worker...');

    navigator.serviceWorker
      .register('browser/ngsw-worker.js')
      .then(
        (registration) => {
          console.log(
            'Service Worker registered with scope:',
            registration.scope
          );
          console.log('Service Worker state:', registration.active?.state);

          registration.active?.addEventListener('statechange', () => {
            console.log(
              'Service Worker state changed to:',
              registration.active?.state
            );
          });
        },
        (err) => {
          console.error('Service Worker registration failed:', err);
        }
      )
      .catch((err) => {
        console.error('Service Worker registration encountered an error:', err);
      });
  });
} else {
  console.log('Service Worker is not supported in this browser.');
}
