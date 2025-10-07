import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  const supported = ['en', 'ja'] as const;
  const safeLocale = supported.includes(locale as any) ? locale : 'en';
  const messages = (await import(`./messages/${safeLocale}.json`)).default;
  return {locale: safeLocale, messages};
});


