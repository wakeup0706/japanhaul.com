"use client";

import Link from "next/link";
import { useCart } from "@/app/(cart)/CartContext";

export default function CartView({ lang }: { lang: "en" | "ja" }) {
	const { state, subtotal, dispatch } = useCart();
	const t = {
		en: { title: "Your Cart", checkout: "Proceed to Checkout", empty: "Your cart is empty", remove: "Remove", subtotal: "Subtotal" },
		ja: { title: "カート", checkout: "レジに進む", empty: "カートは空です", remove: "削除", subtotal: "小計" },
	}[lang];

	return (
		<section className="max-w-4xl mx-auto px-4 py-8">
			<h1 className="text-xl font-semibold mb-4">{t.title}</h1>
			{state.items.length === 0 ? (
				<div className="text-gray-600">{t.empty}</div>
			) : (
				<>
					<div className="space-y-3 mb-6">
						{state.items.map((item) => (
							<div key={item.id} className="flex items-center gap-4 border rounded p-3">
								<div className="w-16 h-16 bg-gray-200 rounded" />
								<div className="flex-1">
									<div>{item.title}</div>
									<div className="text-sm text-gray-600">$ {item.price} × {item.quantity}</div>
								</div>
								<button className="text-sm underline" onClick={() => dispatch({ type: "remove", id: item.id })}>{t.remove}</button>
							</div>
						))}
					</div>
					<div className="flex items-center justify-between mb-4">
						<div className="text-sm text-gray-700">{t.subtotal}: $ {subtotal.toFixed(2)}</div>
						<Link href={`/${lang}/checkout`} className="inline-block bg-black text-white px-4 py-2 rounded">
							{t.checkout}
						</Link>
					</div>
				</>
			)}
		</section>
	);
}
