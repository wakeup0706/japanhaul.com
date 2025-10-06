import Link from "next/link";

export default async function CheckoutPage({ params }: { params: Promise<{ lang: string }> }) {
	const { lang: rawLang } = await params;
	const lang = rawLang === "ja" ? "ja" : "en";
	const t = {
		en: { title: "Checkout", address: "Shipping Address", payment: "Payment Method", pay: "Pay Now" },
		ja: { title: "チェックアウト", address: "配送先住所", payment: "支払い方法", pay: "今すぐ支払う" },
	}[lang];

	return (
		<section className="max-w-4xl mx-auto px-4 py-8">
			<h1 className="text-xl font-semibold mb-4">{t.title}</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="border rounded p-4">
					<h2 className="font-semibold mb-2">{t.address}</h2>
					<div className="space-y-2">
						<input className="border rounded p-2 w-full" placeholder="Name" />
						<input className="border rounded p-2 w-full" placeholder="Address" />
						<input className="border rounded p-2 w-full" placeholder="City" />
						<input className="border rounded p-2 w-full" placeholder="Postal Code" />
					</div>
				</div>
				<div className="border rounded p-4">
					<h2 className="font-semibold mb-2">{t.payment}</h2>
					<div className="space-y-2">
						<select className="border rounded p-2 w-full">
							<option>Credit Card</option>
							<option>PayPal</option>
						</select>
						<input className="border rounded p-2 w-full" placeholder="Card Number" />
					</div>
				</div>
			</div>
			<div className="mt-6">
				<Link href={`/${lang}/confirmation`} className="inline-block bg-black text-white px-4 py-2 rounded">
					{t.pay}
				</Link>
			</div>
		</section>
	);
}
