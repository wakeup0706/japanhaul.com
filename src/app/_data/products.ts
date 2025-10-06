export type Product = {
    id: string;
    title: string;
    price: number;
    compareAt?: number;
    brand: string;
    type: string;
    availability: "in" | "out";
};

export const brands = ["Adele", "Apex heart", "Disney", "Calbee", "Bloom"] as const;

export const types = [
    "Anime Snacks",
    "Chocolate",
    "Mochi",
    "Kitchenware",
    "Candy, Gummy & Jelly",
] as const;

export const products: Product[] = Array.from({ length: 48 }).map((_, i) => {
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


