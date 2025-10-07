import {getRequestConfig} from 'next-intl/server';
import type {GetRequestConfigParams} from 'next-intl/server';

export default getRequestConfig(async ({locale}: GetRequestConfigParams) => {
  const supported = ['en', 'ja'] as const;
  const current = typeof locale === 'string' ? locale : 'en';
  const safeLocale = (supported as readonly string[]).includes(current) ? current : 'en';
  const messages = (await import(`./messages/${safeLocale}.json`)).default;
  return {locale: safeLocale, messages};
});


