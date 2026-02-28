import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { RELEASE_NOTES_REPOSITORY } from './application/ports/release-notes-repository.port';
import { InMemoryReleaseNotesRepository } from './infrastructure/adapters/in-memory-release-notes.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    { provide: RELEASE_NOTES_REPOSITORY, useClass: InMemoryReleaseNotesRepository },
  ],
};
