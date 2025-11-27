import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from '../locales/en.json';
import tr from '../locales/tr.json';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
};
const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', 
    resources,
    lng: deviceLanguage, 
    fallbackLng: 'en',   
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;