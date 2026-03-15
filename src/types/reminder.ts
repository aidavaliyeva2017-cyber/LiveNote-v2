export interface Reminder {
  id: string;
  task_id: string;
  reminder_time: string;      // ISO datetime
  notification_id?: string;   // Expo notification identifier
  notification_sent: boolean;
  user_acknowledged: boolean;
  created_at: string;
}
