import { FilterState } from './types';

export function filterToSearchParams(filter: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filter.consulates.length > 0) {
    params.set('consulates', filter.consulates.join(','));
  }
  if (filter.deCity) {
    params.set('deCity', filter.deCity);
  }
  if (filter.appointmentMonthFrom) {
    params.set('appointmentMonthFrom', filter.appointmentMonthFrom);
  }
  if (filter.appointmentMonthTo) {
    params.set('appointmentMonthTo', filter.appointmentMonthTo);
  }
  if (filter.onlyWithResult) {
    params.set('onlyWithResult', 'true');
  }
  // excludeOutliers is NOT sent to server - applied client-side

  return params;
}
