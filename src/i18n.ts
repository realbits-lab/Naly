import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // Import messages based on the locale
  let messages;
  try {
    if (locale === 'ko') {
      messages = (await import('./messages/ko.json')).default;
    } else {
      messages = (await import('./messages/en.json')).default;
    }
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    // Fallback to English
    messages = (await import('./messages/en.json')).default;
  }

  return {
    messages
  };
});