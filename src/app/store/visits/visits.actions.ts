import {createAction, props} from '@ngrx/store';
import {Visit} from '../../visits/visit';

export const loadVisits = createAction('[Visits] Load Visits');
export const loadVisitsSuccess = createAction('[Visits] Load Visits Success', props<{ visits: Visit[] }>());
export const loadVisitsFailure = createAction('[Visits] Load Visits Failure', props<{ error: string }>());
