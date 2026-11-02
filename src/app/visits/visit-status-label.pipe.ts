import {Pipe, PipeTransform} from '@angular/core';
import {VISIT_STATUS_LABELS, VisitStatus} from './visit-status';

/** Turns a visit status into a readable label; missing/blank gives "Not set", unknown values pass through. */
@Pipe({name: 'visitStatusLabel'})
export class VisitStatusLabelPipe implements PipeTransform {
  transform(status: string | null | undefined): string {
    if (typeof status !== 'string' || status.trim() === '') {
      return 'Not set';
    }
    return Object.prototype.hasOwnProperty.call(VISIT_STATUS_LABELS, status)
      ? VISIT_STATUS_LABELS[status as VisitStatus]
      : status;
  }
}
