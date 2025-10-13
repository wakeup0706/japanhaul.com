import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'anime-store.jp' },
			{ protocol: 'https', hostname: 'cdn.shopify.com' },
			{ protocol: 'https', hostname: 'cdn.amnibus.com' },
			{ protocol: 'https', hostname: 'images.unsplash.com' },
		],
	},
};

export default withNextIntl(nextConfig);
