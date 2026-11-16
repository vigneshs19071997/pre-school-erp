export const AREAS = [
  "Language & Communication", "Numeracy", "Fine Motor", "Gross Motor", "Social & Emotional", "Creativity & Art", "Self-help Habits",
];
export const TERMS = ["Term 1", "Term 2", "Term 3"];
export const RATING_LABELS = ["", "Beginning", "Developing", "Progressing", "Achieved", "Excelling"];
export const EXPENSE_CATEGORIES = ["Rent", "Utilities", "Teaching material", "Toys & play equipment", "Food & snacks", "Maintenance", "Transport", "Marketing", "Events", "Stationery", "Housekeeping", "Other"];
export const MOODS = [
  { v: "happy", e: "😄" }, { v: "excited", e: "🤩" }, { v: "calm", e: "😌" }, { v: "tired", e: "🥱" }, { v: "upset", e: "😢" },
];
export const MOOD_EMOJI: Record<string, string> = Object.fromEntries(MOODS.map((m) => [m.v, m.e]));
export const MEAL_LABEL: Record<string, string> = { all: "Ate all 😋", some: "Ate some", none: "Didn't eat" };
