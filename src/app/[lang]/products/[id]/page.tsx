import Link from "next/link";
import AddToCartButton from "./AddToCartButton";

export default async function ProductDetail({ params }: { params: Promise<{ lang: string; id: string }> }) {
	const { lang: rawLang, id } = await params;
	const lang = rawLang === "ja" ? "ja" : "en";
	const t = {
		en: { back: "Back", title: "Product", add: "Add to Cart", desc: "Placeholder description." },
		ja: { back: "戻る", title: "商品", add: "カートに入れる", desc: "プレースホルダーの説明。" },
	}[lang];

	return (
		<section className="max-w-4xl mx-auto px-4 py-8">
			<Link href={`/${lang}/products`} className="text-sm underline text-blue-600">{t.back}</Link>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
				<div className="h-64 bg-gray-200 rounded" />
				<div>
					<h1 className="text-xl font-semibold mb-2">{t.title} {id}</h1>
					<p className="text-gray-600 mb-4">{t.desc}</p>
					<AddToCartButton id={id} title={`${t.title} ${id}`} price={20} label={t.add} />
				</div>
			</div>
		</section>
	);
}
