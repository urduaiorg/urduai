import { useState, useEffect } from 'react';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';
import urduTranslations from '../localization/ur';

interface LocalizationHook {
  t: (key: string, params?: Record<string, any>) => string;
  locale: string;
  isRTL: boolean;
  changeLanguage: (language: string) => void;
}

export const useLocalization = (): LocalizationHook => {
  const [locale, setLocale] = useState('ur'); // Default to Urdu
  const [isRTL, setIsRTL] = useState(true);

  // Get translation for a key
  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.');
    let translation: any = urduTranslations;
    
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        // Return the key if translation is not found
        return key;
      }
    }
    
    if (typeof translation === 'string') {
      // Simple parameter replacement
      if (params) {
        return Object.keys(params).reduce((str, param) => {
          return str.replace(`{{${param}}}`, params[param]);
        }, translation);
      }
      return translation;
    }
    
    return key; // Return key if translation is not a string
  };

  // Change language
  const changeLanguage = (language: string) => {
    setLocale(language);
    
    // Set RTL based on language
    const rtlLanguages = ['ur', 'ar', 'fa', 'he'];
    const shouldBeRTL = rtlLanguages.includes(language);
    setIsRTL(shouldBeRTL);
    
    // Update I18nManager for RTL layout
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
    }
  };

  // Initialize localization
  useEffect(() => {
    // Get device locale safely using the correct API
    const deviceLocales = Localization.getLocales();
    const deviceLocale = deviceLocales?.[0]?.languageCode || '';
    
    // Check if device locale is supported (default to Urdu for this app)
    if (deviceLocale && deviceLocale.startsWith('ur')) {
      changeLanguage('ur');
    } else {
      // Default to Urdu for this app as per requirements
      changeLanguage('ur');
    }
  }, []);

  return {
    t,
    locale,
    isRTL,
    changeLanguage,
  };
};

export default useLocalization; 