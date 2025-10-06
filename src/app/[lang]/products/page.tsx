import Link from "next/link";

const mockProducts = Array.from({ length: 12 }).map((_, i) => ({
	id: `p${i + 1}`,
	title: `Product ${i + 1}`,
	price: (i + 1) * 3,
}));

export default async function ProductsPage({ params }: { params: Promise<{ lang: string }> }) {
	const { lang: rawLang } = await params;
	const lang = rawLang === "ja" ? "ja" : "en";
	const t = {
		en: { title: "All Products", price: "Price", view: "View" },
		ja: { title: "商品一覧", price: "価格", view: "詳細" },
	}[lang];

	return (
		<section className="max-w-6xl mx-auto px-4 py-8">
			<h1 className="text-xl font-semibold mb-4">{t.title}</h1>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{mockProducts.map((p) => (
					<div key={p.id} className="border rounded p-4">
						<div className="h-24 bg-gray-200 mb-2" />
						<div className="mb-1">{p.title}</div>
						<div className="text-sm text-gray-600 mb-2">{t.price}: ${p.price}</div>
						<Link href={`/${lang}/products/${p.id}`} className="text-blue-600 underline text-sm">
							{t.view}
						</Link>
					</div>
				))}
			</div>
		</section>
	);
}
