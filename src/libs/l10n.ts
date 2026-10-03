let currentLocale: string = "en";
let translations: Record<string, Record<string, string>> = {};

export function setupL10N(locale: string, trans: Record<string, Record<string, string>>) {
  currentLocale = locale;
  translations = trans;
}

export function t(key: string): string {
  return translations[currentLocale]?.[key] ?? translations["en"]?.[key] ?? key;
}
