export type WorkoutType =
  | "run"
  | "strength"
  | "hiit"
  | "cycling"
  | "yoga"
  | "mobility"
  | "rest"
  | "crossfit"
  | "swim";

export type Intensity = "easy" | "moderate" | "hard" | "max";

export interface Workout {
  title: string;
  description: string;
  durationMinutes: number;
  date: string | null;
  dayOfWeek: string;
  time: string;
  workoutType: WorkoutType;
  intensity: Intensity;
}

export interface WeekSchedule {
  week: number;
  focus: string;
  progressionNote: string;
  workouts: Workout[];
}

export interface ProgressionPlan {
  weeks1to2: string | null;
  weeks3to4: string | null;
  weeks5to6: string | null;
  weeks7to8: string | null;
}

export interface TrainingProgram {
  programTitle: string;
  goal: string;
  duration: string;
  experienceLevel: string;
  weeklySchedule: WeekSchedule[];
  progressionPlan: ProgressionPlan;
  generalTips: string[];
}

export interface TimeSlot {
  day: string;
  time: string;
  duration: number;
}

export interface GeneratorFormData {
  goal: string;
  duration: string;
  availableDays: string[];
  availableTimeSlots: TimeSlot[];
  experienceLevel: string;
}

export interface CalendarEventRef {
  eventId: string;
  htmlLink: string;
}

export interface TrainingPreferences {
  preferredWorkoutTimes: string[];
  trainingStyle: string;
  recoveryPreferences: string[];
  gymAccess: boolean;
  availableEquipment: string[];
  goal?: string;
  experienceLevel?: string;
}
