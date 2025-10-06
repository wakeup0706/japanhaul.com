import Link from "next/link";
import type { ReactNode } from "react";
import { CartProvider } from "@/app/(cart)/CartContext";
import PromoBar from "@/app/_components/PromoBar";
import Header from "@/app/_components/Header";
import CategoryBar from "@/app/_components/CategoryBar";
import Footer from "@/app/_components/Footer";

export default async function LangLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ lang: string }>;
}) {
	const { lang: rawLang } = await params;
	const lang = rawLang === "ja" ? "ja" : "en";

	return (
		<CartProvider>
			<div className="min-h-screen flex flex-col bg-white text-gray-900">
				<PromoBar />
				<Header lang={lang} />
				<CategoryBar lang={lang} />
				<main className="flex-1">
					{children}
				</main>
				<Footer />
			</div>
		</CartProvider>
	);
}
