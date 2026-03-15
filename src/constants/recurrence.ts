export enum RecurrenceFrequency {
  DAILY     = 'daily',
  WEEKLY    = 'weekly',
  BIWEEKLY  = 'biweekly',
  MONTHLY   = 'monthly',
  WEEKDAYS  = 'weekdays',
  CUSTOM    = 'custom',
}

export const RECURRENCE_LABELS: Record<RecurrenceFrequency, string> = {
  [RecurrenceFrequency.DAILY]:    'Täglich',
  [RecurrenceFrequency.WEEKLY]:   'Wöchentlich',
  [RecurrenceFrequency.BIWEEKLY]: 'Alle 2 Wochen',
  [RecurrenceFrequency.MONTHLY]:  'Monatlich',
  [RecurrenceFrequency.WEEKDAYS]: 'Mo–Fr',
  [RecurrenceFrequency.CUSTOM]:   'Benutzerdefiniert',
};
