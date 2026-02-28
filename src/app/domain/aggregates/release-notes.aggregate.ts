import type { ReleaseEntity } from '../entities/release.entity';

/** Aggregate: the full release notes (list of releases). */
export interface ReleaseNotesAggregate {
  releases: ReleaseEntity[];
}
