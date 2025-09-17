import { type AbstractIntlMessages } from 'next-intl';

export const locales = ['en', 'ko'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
};

export const localeLabels: Record<Locale, { name: string; nativeName: string }> = {
  en: {
    name: 'English',
    nativeName: 'English',
  },
  ko: {
    name: 'Korean',
    nativeName: '한국어',
  },
};

// Validate that a locale is supported
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Get the best matching locale from user preferences
export function getBestMatchingLocale(
  acceptLanguage: string | null,
  userPreference?: string | null
): Locale {
  // Use user preference if available and valid
  if (userPreference && isValidLocale(userPreference)) {
    return userPreference;
  }

  // Parse Accept-Language header
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase())
      .find(lang => {
        // Check exact match first
        if (isValidLocale(lang)) return true;
        // Check language part only (e.g., 'ko' from 'ko-KR')
        const langCode = lang.split('-')[0];
        return isValidLocale(langCode);
      });

    if (preferred) {
      const langCode = preferred.split('-')[0];
      if (isValidLocale(langCode)) {
        return langCode;
      }
    }
  }

  return defaultLocale;
}