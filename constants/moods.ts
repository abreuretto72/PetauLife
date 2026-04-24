import { colors } from './colors';

export type MoodId =
  | 'ecstatic'
  | 'happy'
  | 'calm'
  | 'tired'
  | 'anxious'
  | 'sad'
  | 'playful'
  | 'sick';

export interface Mood {
  id: MoodId;
  label: string;
  label_en: string;
  color: string;
  score: number;
}

export const moods: Mood[] = [
  { id: 'ecstatic', label: 'Eufórico', label_en: 'Ecstatic', color: colors.warning, score: 100 },
  { id: 'happy', label: 'Feliz', label_en: 'Happy', color: colors.success, score: 85 },
  { id: 'playful', label: 'Brincalhão', label_en: 'Playful', color: colors.click, score: 80 },
  { id: 'calm', label: 'Calmo', label_en: 'Calm', color: colors.petrol, score: 65 },
  { id: 'tired', label: 'Cansado', label_en: 'Tired', color: colors.textDim, score: 40 },
  { id: 'anxious', label: 'Ansioso', label_en: 'Anxious', color: colors.warning, score: 30 },
  { id: 'sad', label: 'Triste', label_en: 'Sad', color: colors.sky, score: 20 },
  { id: 'sick', label: 'Doente', label_en: 'Sick', color: colors.danger, score: 10 },
];
