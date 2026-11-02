import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {combineLatest} from 'rxjs';
import {map} from 'rxjs/operators';
import {VisitStatus} from '../../visits/visit-status';
import {
  selectAllVisits,
  selectVisitsError,
  selectVisitsLoading,
  selectVisitStatusCounts,
  VisitStatusCounts
} from './visits.selectors';

export const VISITS_BRIDGE_EVENT = 'petclinic-host:visits';

/** Visit fields exposed to other front ends (no description). */
export interface VisitsBridgeVisit {
  id: number;
  date: string;
  status: VisitStatus | null | undefined;
  petId: number | undefined;
}

export interface VisitsBridgeState {
  visits: VisitsBridgeVisit[];
  statusCounts: VisitStatusCounts;
  loading: boolean;
  error: string | null;
}

/** Publishes the visits state on window.petclinicHost.visits and as a browser event on every change. */
export function startVisitsBridge(store: Store): Subscription {
  return combineLatest([
    store.select(selectAllVisits),
    store.select(selectVisitStatusCounts),
    store.select(selectVisitsLoading),
    store.select(selectVisitsError)
  ]).pipe(
    map(([visits, statusCounts, loading, error]): VisitsBridgeState => ({
      visits: visits.map(v => ({id: v.id, date: v.date, status: v.status, petId: v.petId})),
      statusCounts: {...statusCounts},
      loading,
      error
    }))
  ).subscribe(state => {
    const host = ((window as any).petclinicHost = (window as any).petclinicHost || {});
    host.visits = state;
    window.dispatchEvent(new CustomEvent<VisitsBridgeState>(VISITS_BRIDGE_EVENT, {detail: state}));
  });
}
