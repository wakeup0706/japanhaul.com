"use client";

import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "./AddToCartButton";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { products } from "@/app/_data/products";
import type { Product } from "@/app/_data/products";

export default function ProductDetail({ params }: { params: Promise<{ lang: string; id: string }> }) {
    const t = useTranslations("productDetail");
    const [openBar, setOpenBar] = useState(false);
    const [qty, setQty] = useState(1);
    const { lang: routeLang, id } = use(params);
	const lang = routeLang === "ja" ? "ja" : "en";

    const product: Product = products.find((p) => p.id === id) || ({ id, title: `${t("title")} ${id}`, price: 44.99 } as Product);

    const formatPrice = (amount: number) =>
        new Intl.NumberFormat(lang === "ja" ? "ja-JP" : "en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2
        }).format(amount);

    return (
        <section className="w-full px-6 lg:px-10 py-12 md:py-16" onScrollCapture={(e) => {
            const sc = (e.currentTarget as HTMLElement).scrollTop;
            setOpenBar(sc > 500);
        }}>
            <div className="max-w-6xl mx-auto">
                <Link href={`/${lang}/products`} className="text-sm underline text-blue-600">{t("back")}</Link>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
                    <div className="lg:col-span-7 space-y-4">
                        <div className="aspect-square overflow-hidden rounded-xl border bg-white">
                            <Image src="/placeholder.jpg" alt={product.title} width={1200} height={1200} className="h-full w-full object-cover" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {[0,1,2].map((i) => (
                                <div key={i} className="aspect-[4/3] overflow-hidden rounded-lg border bg-white">
                                    <Image src="/placeholder.jpg" alt={`${product.title} ${i+1}`} width={600} height={450} className="h-full w-full object-cover" />
                                </div>
                            ))}
                        </div>
                        {/* Feature badges under the gallery */}
                        <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
                            <div className="w-auto inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors">
                                <span className="h-2 w-2 rounded-full bg-current"></span>
                                <span>{t("shipsTokyo")}</span>
                            </div>
                            <div className="w-auto inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors">
                                <span className="h-2 w-2 rounded-full bg-current"></span>
                                <span>{t("securePayments")}</span>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-5">
                        <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                        <div className="text-lg mb-2 flex items-center gap-2">
                            <span className={`${product.compareAt ? "text-rose-600 font-semibold" : "text-black font-semibold"}`}>{formatPrice(product.price)}</span>
                            {product.compareAt && (
                                <span className="text-base text-black line-through">{formatPrice(product.compareAt)}</span>
                            )}
                        </div>
                        <div className="text-sm text-gray-600 mb-4">{t("description")}</div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="inline-flex items-center rounded-full border px-4 py-2 min-w-[140px] justify-between">
                                <button className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-gray-100" onClick={() => setQty(Math.max(1, qty-1))}>-</button>
                                <span className="px-3 min-w-[2rem] text-center">{qty}</span>
                                <button className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-gray-100" onClick={() => setQty(qty+1)}>+</button>
                            </div>
                            <AddToCartButton id={product.id} title={product.title} price={product.price} label={t("addToCart")} image="/placeholder.jpg" quantity={qty} />
                        </div>
                        {/* badges moved under images */}
                        <hr className="my-6" />
                            <div className="space-y-2 text-sm">
                                <div className="font-semibold">{t("whatsInside")}</div>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>{t("feature1")}</li>
                                <li>{t("feature2")}</li>
                                <li>{t("feature3")}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-16 md:mt-20">
                    <h2 className="text-xl font-semibold mb-6 text-center">{t("youMayLike")}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {products.slice(0,4).map((p) => (
                            <Link key={p.id} href={`/${lang}/products/${p.id}`} className="group block">
                                <div className="aspect-[4/3] overflow-hidden rounded-lg border bg-white">
                                    <Image src="/placeholder.jpg" alt={p.title} width={600} height={450} className="h-full w-full object-cover group-hover:scale-105 transition" />
                                </div>
                                <div className="mt-2 text-sm">
                                    <div className="font-medium group-hover:underline">{p.title}</div>
                                    <div className="mt-0.5 flex items-center gap-2">
                                        <span className={`${p.compareAt ? "text-rose-600 font-semibold" : "text-black font-semibold"}`}>{formatPrice(p.price)}</span>
                                        {p.compareAt && (
                                            <span className="text-xs text-black line-through">{formatPrice(p.compareAt)}</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sticky footer add-to-cart bar */}
            {openBar && (
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur">
                    <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className="truncate font-medium">{product.title}</div>
                            <div className="text-sm flex items-center gap-2">
                                <span className={`${product.compareAt ? "text-rose-600 font-semibold" : "text-black font-semibold"}`}>{formatPrice(product.price)}</span>
                                {product.compareAt && (
                                    <span className="text-xs text-black line-through">{formatPrice(product.compareAt)}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="inline-flex items-center rounded-full border px-4 py-2 min-w-[140px] justify-between">
                                <button className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-gray-100" onClick={() => setQty(Math.max(1, qty-1))}>-</button>
                                <span className="px-3 min-w-[2rem] text-center">{qty}</span>
                                <button className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-gray-100" onClick={() => setQty(qty+1)}>+</button>
                            </div>
                            <AddToCartButton id={product.id} title={product.title} price={product.price} label={t("addToCart")} image="/placeholder.jpg" />
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
