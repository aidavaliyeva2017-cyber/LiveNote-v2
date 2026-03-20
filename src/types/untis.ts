export interface UntisCredentials {
  username: string;
  password: string;
}

export interface UntisSession {
  sessionId: string;
  personId: number;
  personType: number;
  klasseId: number;
}

export interface UntisSubjectRef {
  id: number;
  name: string;       // short name, e.g. "M"
  longname: string;   // full name, e.g. "Mathematik"
}

export interface UntisTeacherRef {
  id: number;
  name: string;       // abbreviation, e.g. "Mül"
  longname?: string;
}

export interface UntisRoomRef {
  id: number;
  name: string;       // e.g. "101"
  longname?: string;
}

export interface UntisKlasseRef {
  id: number;
  name: string;
  longname?: string;
}

export type UntisLessonCode = 'cancelled' | 'irregular' | undefined;

export interface UntisLesson {
  id: number;
  date: number;       // YYYYMMDD integer
  startTime: number;  // HHMM integer, e.g. 800 = 08:00
  endTime: number;
  su: UntisSubjectRef[];
  te: UntisTeacherRef[];
  ro: UntisRoomRef[];
  kl: UntisKlasseRef[];
  code?: UntisLessonCode;
  lstext?: string;    // lesson text / substitution info
  substText?: string;
  info?: string;
  activityType?: string;
}

export interface UntisSubject {
  id: number;
  name: string;
  longName: string;
  alternateName?: string;
  backColor?: string; // hex without #, e.g. "c0c0c0"
  foreColor?: string;
  active?: boolean;
}
