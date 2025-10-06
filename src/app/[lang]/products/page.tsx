"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Product = {
    id: string;
    title: string;
    price: number;
    compareAt?: number; // original price for discount display
    brand: string;
    type: string;
    availability: "in" | "out";
};

const brands = ["Adele", "Apex heart", "Disney", "Calbee", "Bloom"] as const;
const types = [
    "Anime Snacks",
    "Chocolate",
    "Mochi",
    "Kitchenware",
    "Candy, Gummy & Jelly",
] as const;

const mockProducts: Product[] = Array.from({ length: 48 }).map((_, i) => {
    const base = (i + 1) * 3;
    const onSale = i % 3 === 0;
    return {
	id: `p${i + 1}`,
	title: `Product ${i + 1}`,
        price: onSale ? Math.round(base * 0.7 * 100) / 100 : base,
        compareAt: onSale ? base : undefined,
        brand: brands[i % brands.length],
        type: types[i % types.length],
        availability: i % 7 === 0 ? "out" : "in",
    };
});

export default function ProductsPage({ params }: { params: Promise<{ lang: string }> }) {
    // Resolve lang param (server-provided in app router)
    // We don't need translations for filters UI in this demo
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Helpers for URL state
    function getMulti(name: string): string[] {
        const value = searchParams.get(name);
        if (!value) return [];
        return value.split(",").filter(Boolean);
    }

    function setParam(name: string, values: string[] | string | null) {
        const sp = new URLSearchParams(searchParams.toString());
        if (values === null || (Array.isArray(values) && values.length === 0) || values === "") {
            sp.delete(name);
        } else if (Array.isArray(values)) {
            sp.set(name, values.join(","));
        } else {
            sp.set(name, values);
        }
        router.replace(`${pathname}?${sp.toString()}`);
    }

    function toggleInMulti(name: string, value: string) {
        const current = new Set(getMulti(name));
        if (current.has(value)) current.delete(value); else current.add(value);
        setParam(name, Array.from(current));
    }

    function removeFromMulti(name: string, value: string) {
        const current = new Set(getMulti(name));
        if (current.has(value)) {
            current.delete(value);
            setParam(name, Array.from(current));
        }
    }

    function chipClass(kind: "avail" | "brand" | "type" | "price") {
        switch (kind) {
            case "avail":
                return "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100";
            case "brand":
                return "bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100";
            case "type":
                return "bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100";
            case "price":
                return "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100";
            default:
                return "";
        }
    }

    const priceMin = Number(searchParams.get("min")) || 0;
    const priceMax = Number(searchParams.get("max")) || 9999;
    const sortParam = searchParams.get("sort") || "best"; // best | price-asc | price-desc | alpha-asc | alpha-desc | date-asc | date-desc
    const selectedAvailability = new Set(getMulti("avail"));
    const selectedBrands = new Set(getMulti("brand"));
    const selectedTypes = new Set(getMulti("type"));

    const filtered = useMemo(() => {
        const base = mockProducts.filter((p) => {
            if (p.price < priceMin || p.price > priceMax) return false;
            if (selectedAvailability.size > 0 && !selectedAvailability.has(p.availability)) return false;
            if (selectedBrands.size > 0 && !selectedBrands.has(p.brand)) return false;
            if (selectedTypes.size > 0 && !selectedTypes.has(p.type)) return false;
            return true;
        });
        const list = [...base];
        switch (sortParam) {
            case "price-asc":
                list.sort((a, b) => a.price - b.price); break;
            case "price-desc":
                list.sort((a, b) => b.price - a.price); break;
            case "alpha-asc":
                list.sort((a, b) => a.title.localeCompare(b.title)); break;
            case "alpha-desc":
                list.sort((a, b) => b.title.localeCompare(a.title)); break;
            // date-based not applicable on mock data; fall through to default
            default:
                break;
        }
        return list;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const [quickView, setQuickView] = useState<Product | null>(null);

	return (
        <section className="w-full px-6 lg:px-10 py-8">
            {/* Big page title */}
            <div className="w-full py-6">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">All items</h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Sidebar filters */}
                <aside className="lg:col-span-3 space-y-6 text-[15px]">
                    {/* Availability */}
                    <div>
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold">Availability</h2>
                        </div>
                        <div className="mt-3 space-y-2 text-base">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={selectedAvailability.has("in")} onChange={() => toggleInMulti("avail", "in")} />
                                <span>In stock</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={selectedAvailability.has("out")} onChange={() => toggleInMulti("avail", "out")} />
                                <span>Out of stock</span>
                            </label>
                        </div>
                    </div>

                    {/* Price */}
                    <div>
                        <h2 className="text-base font-semibold">Price</h2>
                        <div className="mt-3 flex items-center gap-3 text-base">
                            <div className="flex items-center gap-2">
                                <span>$</span>
                                <input
                                    type="number"
                                    className="w-20 rounded-md border px-2 py-1"
                                    value={priceMin}
                                    onChange={(e) => setParam("min", e.target.value)}
                                />
                            </div>
                            <span className="text-gray-400">to</span>
                            <div className="flex items-center gap-2">
                                <span>$</span>
                                <input
                                    type="number"
                                    className="w-20 rounded-md border px-2 py-1"
                                    value={priceMax === 9999 ? "" : priceMax}
                                    placeholder="Max"
                                    onChange={(e) => setParam("max", e.target.value || null)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Brand */}
                    <div>
                        <h2 className="text-base font-semibold">Brand</h2>
                        <div className="mt-3 max-h-56 overflow-auto pr-1 space-y-2 text-base">
                            {brands.map((b) => (
                                <label key={b} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedBrands.has(b)}
                                        onChange={() => toggleInMulti("brand", b)}
                                    />
                                    <span>{b}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Product type */}
                    <div>
                        <h2 className="text-base font-semibold">Product type</h2>
                        <div className="mt-3 space-y-2 text-base">
                            {types.map((t) => (
                                <label key={t} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedTypes.has(t)}
                                        onChange={() => toggleInMulti("type", t)}
                                    />
                                    <span>{t}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Extra filters to match reference richness */}
                    <div>
                        <h2 className="text-base font-semibold">Country/Region</h2>
                        <div className="mt-3 space-y-2 text-base">
                            {['Japan','Korea','Taiwan'].map((c) => (
                                <label key={c} className="flex items-center gap-2 opacity-60 cursor-not-allowed">
                                    <input type="checkbox" disabled />
                                    <span>{c}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-base font-semibold">Availability</h2>
                        <div className="mt-3 space-y-2 text-base">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={selectedAvailability.has("in")} onChange={() => toggleInMulti("avail", "in")} />
                                <span>In stock</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={selectedAvailability.has("out")} onChange={() => toggleInMulti("avail", "out")} />
                                <span>Out of stock</span>
                            </label>
                        </div>
                    </div>
                </aside>

                {/* Products grid */}
                <div className="lg:col-span-9">
                    {/* Active filter chips above product grid */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        {Array.from(selectedAvailability).map((v) => (
                            <button key={`avail-${v}`} onClick={() => removeFromMulti("avail", v)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${chipClass("avail")}`}>
                                <span>{v === "in" ? "In stock" : "Out of stock"}</span>
                                <span className="rounded-full bg-white/60 p-0.5" aria-hidden>×</span>
                            </button>
                        ))}
                        {Array.from(selectedBrands).map((b) => (
                            <button key={`brand-${b}`} onClick={() => removeFromMulti("brand", b)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${chipClass("brand")}`}>
                                <span>{b}</span>
                                <span className="rounded-full bg-white/60 p-0.5" aria-hidden>×</span>
                            </button>
                        ))}
                        {Array.from(selectedTypes).map((t) => (
                            <button key={`type-${t}`} onClick={() => removeFromMulti("type", t)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${chipClass("type")}`}>
                                <span>{t}</span>
                                <span className="rounded-full bg-white/60 p-0.5" aria-hidden>×</span>
                            </button>
                        ))}
                        {(priceMin > 0 || priceMax < 9999) && (
                            <button onClick={() => { setParam("min", null); setParam("max", null); }} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${chipClass("price")}`}>
                                <span>${priceMin} – {priceMax === 9999 ? "∞" : `$${priceMax}`}</span>
                                <span className="rounded-full bg-white/60 p-0.5" aria-hidden>×</span>
                            </button>
                        )}
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">{filtered.length} products</div>
                        <label className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Sort by:</span>
                            <select
                                className="rounded-md border px-2 py-1"
                                value={sortParam}
                                onChange={(e) => setParam("sort", e.target.value)}
                            >
                                <option value="best">Best selling</option>
                                <option value="alpha-asc">Alphabetically, A-Z</option>
                                <option value="alpha-desc">Alphabetically, Z-A</option>
                                <option value="price-asc">Price, low to high</option>
                                <option value="price-desc">Price, high to low</option>
                            </select>
                        </label>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map((p) => (
                            <Link key={p.id} href={`${pathname}/${p.id}`} className="group block">
                                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-gradient-to-br from-pink-50 to-blue-50 group-hover:shadow-md group-hover:-translate-y-0.5 transition-transform">
                                    {/* Quick view button */}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setQuickView(p); }}
                                        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition"
                                        aria-label="Quick view"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M21.75 12c0-1.6-3.9-6.75-9.75-6.75S2.25 10.4 2.25 12c0 1.6 3.9 6.75 9.75 6.75S21.75 13.6 21.75 12Zm-6.5 0a3.25 3.25 0 1 1-6.5 0 3.25 3.25 0 0 1 6.5 0Z" clipRule="evenodd"/></svg>
                                    </button>
                                    {p.compareAt && (
                                        <div className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">-{Math.round(((p.compareAt - p.price) / p.compareAt) * 100)}%</div>
                                    )}
                                    {/* Base image */}
                                    <Image
                                        src="/placeholder.jpg"
                                        alt={p.title}
                                        width={600}
                                        height={450}
                                        className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                                    />
                                    {/* Hover image (crossfade) */}
                                    <Image
                                        src="/placeholder_alt.jpg"
                                        alt={`${p.title} alt`}
                                        width={600}
                                        height={450}
                                        className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
                                    />
                                </div>
                                <div className="mt-2 text-sm">
                                    <div className="font-medium">{p.title}</div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-rose-600">${p.price.toFixed(2)} USD</span>
                                        {p.compareAt && (
                                            <span className="text-xs text-gray-500 line-through">${p.compareAt.toFixed(2)} USD</span>
                                        )}
                                    </div>
                                </div>
						</Link>
				))}
                    </div>
                </div>
			</div>

            {/* Quick View Drawer */}
            {quickView && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setQuickView(null)} />
                    <aside className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <div className="text-lg font-semibold">{quickView.title}</div>
                            <button className="rounded-full p-2 hover:bg-gray-100" onClick={() => setQuickView(null)} aria-label="Close">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-4">
                            <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border bg-gray-50">
                                <Image src="/placeholder.jpg" alt={quickView.title} width={900} height={675} className="h-full w-full object-cover" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-lg">
                                    <span className="font-semibold text-rose-600">${quickView.price.toFixed(2)} USD</span>
                                    {quickView.compareAt && (
                                        <span className="text-sm text-gray-500 line-through">${quickView.compareAt.toFixed(2)} USD</span>
                                    )}
                                </div>
                                <div className="mt-2 text-sm text-gray-600">In stock and ready to ship.</div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold mb-2">About this item</h3>
                                <p className="text-sm text-gray-700">Packed with a rotating selection of Japan-inspired goodies. This is placeholder text for the quick view drawer.</p>
                            </div>
                            <div className="pt-2">
                                <Link href={`${pathname}/${quickView.id}`} className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white">View full details</Link>
                            </div>
                        </div>
                    </aside>
                </div>
            )}
		</section>
	);
}
