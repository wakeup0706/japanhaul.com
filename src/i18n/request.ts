import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}: {locale: string}) => {
  const supported = ['en', 'ja'] as const;
  const safeLocale = (supported as readonly string[]).includes(locale) ? locale : 'en';
  const messages = (await import(`./messages/${safeLocale}.json`)).default;
  return {locale: safeLocale, messages};
});


