"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Product = {
    id: string;
    title: string;
    price: number;
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

const mockProducts: Product[] = Array.from({ length: 48 }).map((_, i) => ({
    id: `p${i + 1}`,
    title: `Product ${i + 1}`,
    price: (i + 1) * 3,
    brand: brands[i % brands.length],
    type: types[i % types.length],
    availability: i % 7 === 0 ? "out" : "in",
}));

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

    const priceMin = Number(searchParams.get("min")) || 0;
    const priceMax = Number(searchParams.get("max")) || 9999;
    const selectedAvailability = new Set(getMulti("avail"));
    const selectedBrands = new Set(getMulti("brand"));
    const selectedTypes = new Set(getMulti("type"));

    const filtered = useMemo(() => {
        return mockProducts.filter((p) => {
            if (p.price < priceMin || p.price > priceMax) return false;
            if (selectedAvailability.size > 0 && !selectedAvailability.has(p.availability)) return false;
            if (selectedBrands.size > 0 && !selectedBrands.has(p.brand)) return false;
            if (selectedTypes.size > 0 && !selectedTypes.has(p.type)) return false;
            return true;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    return (
        <section className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sidebar filters */}
                <aside className="lg:col-span-3 space-y-6">
                    {/* Availability */}
                    <div>
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold">Availability</h2>
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
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
                        <h2 className="text-sm font-semibold">Price</h2>
                        <div className="mt-3 flex items-center gap-3 text-sm">
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
                        <h2 className="text-sm font-semibold">Brand</h2>
                        <div className="mt-3 max-h-56 overflow-auto pr-1 space-y-2 text-sm">
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
                        <h2 className="text-sm font-semibold">Product type</h2>
                        <div className="mt-3 space-y-2 text-sm">
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
                </aside>

                {/* Products grid */}
                <div className="lg:col-span-9">
                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="text-xl font-semibold">All Products</h1>
                        <div className="text-sm text-gray-600">{filtered.length} products</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map((p) => (
                            <Link key={p.id} href={`${pathname}/${p.id}`} className="group block">
                                <div className="aspect-[4/3] rounded-lg bg-gray-100 border group-hover:shadow-sm transition" />
                                <div className="mt-2 text-sm">
                                    <div className="font-medium">{p.title}</div>
                                    <div className="text-gray-600">${p.price.toFixed(2)}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
