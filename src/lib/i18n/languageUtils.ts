import type { Language } from "./translations";

/**
 * Get the localized field value based on current language
 * For objects with name_sr, name_ru, name_en fields
 */
export function getLocalizedField<T extends Record<string, any>>(
  obj: T | null | undefined,
  fieldBase: string,
  language: Language,
  fallback: string = ""
): string {
  if (!obj) return fallback;

  const fieldMap: Record<Language, string[]> = {
    sr: [`${fieldBase}_sr`, `${fieldBase}`, `${fieldBase}_en`, `${fieldBase}_ru`],
    ru: [`${fieldBase}_ru`, `${fieldBase}_sr`, `${fieldBase}`, `${fieldBase}_en`],
    en: [`${fieldBase}_en`, `${fieldBase}`, `${fieldBase}_sr`, `${fieldBase}_ru`],
  };

  // Try fields in priority order for the selected language
  for (const field of fieldMap[language]) {
    const value = obj[field];
    if (value && typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
}

/**
 * Get localized name from an object
 */
export function getLocalizedName<T extends Record<string, any>>(
  obj: T | null | undefined,
  language: Language,
  fallback: string = ""
): string {
  return getLocalizedField(obj, "name", language, fallback);
}

/**
 * Get localized description from an object
 */
export function getLocalizedDescription<T extends Record<string, any>>(
  obj: T | null | undefined,
  language: Language,
  fallback: string = ""
): string {
  return getLocalizedField(obj, "description", language, fallback);
}
