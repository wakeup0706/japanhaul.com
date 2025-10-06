import Link from "next/link";

export default async function ConfirmationPage({ params }: { params: Promise<{ lang: string }> }) {
	const { lang: rawLang } = await params;
	const lang = rawLang === "ja" ? "ja" : "en";
	const t = {
		en: { title: "Payment Confirmed", sub: "Thank you for your purchase!", track: "Track Delivery" },
		ja: { title: "支払いが確認されました", sub: "ご購入ありがとうございます！", track: "配送状況を確認" },
	}[lang];

	return (
		<section className="max-w-3xl mx-auto px-4 py-10 text-center">
			<h1 className="text-2xl font-semibold mb-2">{t.title}</h1>
			<p className="text-gray-600 mb-6">{t.sub}</p>
			<div className="border rounded p-4 text-left mb-6">
				<div className="font-semibold mb-2">Order #000123</div>
				<div className="text-sm text-gray-600">3 items · Total $45.00</div>
			</div>
			<Link href={`/${lang}/delivery`} className="inline-block bg-black text-white px-4 py-2 rounded">
				{t.track}
			</Link>
		</section>
	);
}
