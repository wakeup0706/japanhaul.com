import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import HeroCarousel from "@/app/_components/HeroCarousel";
import { getAllProducts, type Product } from "@/app/_data/products";

export default async function LocalizedHome({ params }: { params: Promise<{ lang: string }> }) {
    const { lang: rawLang } = await params;
    const lang = rawLang === "ja" ? "ja" : "en";
    const t = await getTranslations({ locale: lang });

    // Fetch real products from database
    let products: Product[] = [];
    let isLoading = true;
    try {
        products = await getAllProducts(8); // Get 8 products for the home page
        isLoading = false;
    } catch (error) {
        console.error('Failed to fetch products for home page:', error);
        // Fallback to empty array - will show no products
        products = [];
        isLoading = false;
    }

    return (
        <section>
            {/* Hero Carousel */}
            <div className="w-full px-6 lg:px-10 py-8 mb-6">
                <HeroCarousel lang={lang} />
            </div>

            {/* Product grid with real products */}
            <div className="w-full px-6 lg:px-10 py-8">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
                        <p className="mt-4 text-gray-600">Loading products...</p>
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <Link key={product.id} href={`/${lang}/products/${product.id}`} className="group block">
                                <div className="aspect-square overflow-hidden rounded-lg border bg-white group-hover:shadow-sm transition">
                                    <Image
                                        src={product.imageUrl || "/placeholder.jpg"}
                                        alt={product.title}
                                        width={600}
                                        height={600}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="mt-2 text-sm leading-tight">
                                    <div className="font-bold group-hover:underline line-clamp-2">{product.title}</div>
                                    <div className="mt-0.5 text-[13px]">
                                        <span className="font-semibold text-black">${product.price.toFixed(2)} USD</span>
                                        {product.compareAt && (
                                            <span className="ml-2 text-gray-500 line-through text-xs">
                                                ${product.compareAt.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                    {product.availability === 'out' && (
                                        <div className="mt-1 text-xs text-red-600 font-medium">Out of Stock</div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-500 mb-4">No products available</div>
                        <Link href={`/${lang}/products`} className="text-blue-600 hover:text-blue-800 font-medium">
                            View all products →
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
