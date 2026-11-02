import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {VisitService} from '../../visits/visit.service';
import {loadVisits, loadVisitsFailure, loadVisitsSuccess} from './visits.actions';

export const LOAD_VISITS_ERROR_MESSAGE = 'Could not load visits.';

@Injectable()
export class VisitsEffects {

  loadVisits$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadVisits),
      switchMap(() =>
        this.visitService.getVisits().pipe(
          map(visits => loadVisitsSuccess({visits})),
          // The server's message is deliberately dropped.
          catchError(() => of(loadVisitsFailure({error: LOAD_VISITS_ERROR_MESSAGE})))
        )
      )
    )
  );

  constructor(private readonly actions$: Actions, private readonly visitService: VisitService) {
  }
}
