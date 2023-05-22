import i18next from 'i18next';
import zhHansTranslation from '../locales/zh-Hans.json';
import zhHantTranslation from '../locales/zh-Hant.json';
import esTranslation from '../locales/es.json';
import jpTranslation from '../locales/jp.json';
import koTranslation from '../locales/ko.json';
import frTranslation from '../locales/fr.json';
import deTranslation from '../locales/de.json';
import ruTranslation from '../locales/ru.json';
import ukTranslation from '../locales/uk.json';
import viTranslation from '../locales/vi.json';
import arTranslation from '../locales/ar.json';
import ptTranslation from '../locales/pt.json';
import idTranslation from '../locales/id.json';

let currentlang: string = 'en';

const languages: Record<string, string> = {
  en: 'English',
  'zh-Hans': '简体中文', // simplified Chinese
  'zh-Hant': '繁體中文', // traditional Chinese
  es: 'Español', // Spanish
  jp: '日本語', // Japanese
  ko: '한국어', // Korean
  fr: 'Français', // French
  de: 'Deutsch', // German
  ru: 'Русский', // Russian
  uk: 'Українська', // Ukrainian
  vi: 'Tiếng Việt', // Vietnamese
  ar: 'العربية', // Arabic
  pt: 'Português', // Portuguese
  id: 'Indonesia', // Indonesia
};

i18next.init({
  lng: currentlang,
  fallbackLng: 'en',
  resources: {
    'zh-Hans': {
      translation: zhHansTranslation,
    },
    'zh-Hant': {
      translation: zhHantTranslation,
    },
    es: {
      translation: esTranslation,
    },
    jp: {
      translation: jpTranslation,
    },
    ko: {
      translation: koTranslation,
    },
    fr: {
      translation: frTranslation,
    },
    de: {
      translation: deTranslation,
    },
    ru: {
      translation: ruTranslation,
    },
    uk: {
      translation: ukTranslation,
    },
    vi: {
      translation: viTranslation,
    },
    ar: {
      translation: arTranslation,
    },
    pt: {
      translation: ptTranslation,
    },
    id: {
      translation: idTranslation,
    },
  },
});

/**
 * Adds a public method called "t" that takes a string parameter and returns a string.
 * @param key - The translation key to look up.
 * @returns The translated string.
 */
const t = (key: string): string => {
  if (!currentlang || currentlang === 'en') return key;
  return i18next.t(key) as string;
};

const setLanguage = (lang: string) => {
  currentlang = lang || 'en';
  i18next.changeLanguage(currentlang);
};

const getCurrentLanguagenName = () => {
  return languages[currentlang];
};

export default { setLanguage, t, getCurrentLanguagenName, languages };
