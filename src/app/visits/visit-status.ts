/** Allowed visit statuses, as defined by the API's VisitStatus enum. */
export type VisitStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export const VISIT_STATUS_LABELS: Readonly<Record<VisitStatus, string>> = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};
