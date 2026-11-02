import {createReducer, on} from '@ngrx/store';
import {Visit} from '../../visits/visit';
import {loadVisits, loadVisitsFailure, loadVisitsSuccess} from './visits.actions';

export const VISITS_FEATURE_KEY = 'visits';

export interface VisitsState {
  visits: Visit[];
  loading: boolean;
  error: string | null;
}

export const initialVisitsState: VisitsState = {
  visits: [],
  loading: false,
  error: null
};

export const visitsReducer = createReducer(
  initialVisitsState,
  on(loadVisits, (state): VisitsState => ({...state, loading: true, error: null})),
  on(loadVisitsSuccess, (state, {visits}): VisitsState => ({...state, visits, loading: false, error: null})),
  on(loadVisitsFailure, (state, {error}): VisitsState => ({...state, loading: false, error}))
);
