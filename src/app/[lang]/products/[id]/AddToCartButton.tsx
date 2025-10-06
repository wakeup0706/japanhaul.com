"use client";

import { useCart } from "@/app/(cart)/CartContext";

export default function AddToCartButton({ id, title, price, label }: { id: string; title: string; price: number; label: string }) {
	const { dispatch } = useCart();
	return (
		<button
			className="bg-black text-white px-4 py-2 rounded"
			onClick={() => dispatch({ type: "add", item: { id, title, price } })}
		>
			{label}
		</button>
	);
}
