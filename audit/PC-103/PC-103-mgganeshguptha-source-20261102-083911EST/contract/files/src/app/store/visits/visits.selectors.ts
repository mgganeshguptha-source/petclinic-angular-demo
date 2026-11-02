import {createFeatureSelector, createSelector} from '@ngrx/store';
import {VISIT_STATUS_LABELS, VisitStatus} from '../../visits/visit-status';
import {VISITS_FEATURE_KEY, VisitsState} from './visits.reducer';

export type VisitStatusCounts = Record<VisitStatus, number> & { notSet: number };

export const selectVisitsState = createFeatureSelector<VisitsState>(VISITS_FEATURE_KEY);

export const selectAllVisits = createSelector(selectVisitsState, state => state.visits);
export const selectVisitsLoading = createSelector(selectVisitsState, state => state.loading);
export const selectVisitsError = createSelector(selectVisitsState, state => state.error);

export const selectVisitStatusCounts = createSelector(selectAllVisits, (visits): VisitStatusCounts => {
  const counts = {notSet: 0} as VisitStatusCounts;
  for (const key of Object.keys(VISIT_STATUS_LABELS) as VisitStatus[]) {
    counts[key] = 0;
  }
  for (const visit of visits) {
    const status = visit.status;
    if (typeof status === 'string' && Object.prototype.hasOwnProperty.call(VISIT_STATUS_LABELS, status)) {
      counts[status as VisitStatus]++;
    } else {
      counts.notSet++;
    }
  }
  return counts;
});
