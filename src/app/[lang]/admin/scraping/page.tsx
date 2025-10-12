"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { ScrapedProduct } from "@/lib/scraper";
import type { Product } from "@/app/_data/products";

interface ScrapingResult {
    success: boolean;
    products?: ScrapedProduct[];
    count?: number;
    error?: string;
}

interface ScrapedProductsResponse {
    products: Product[];
    count: number;
}

export default function ScrapingAdminPage() {
    const { lang: rawLang } = useParams<{ lang: string }>();
    const lang = rawLang === "ja" ? "ja" : "en";
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [url, setUrl] = useState("");
    const [configType, setConfigType] = useState("generic");
    const [customConfig, setCustomConfig] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [scrapingResult, setScrapingResult] = useState<ScrapingResult | null>(null);
    const [scrapedProducts, setScrapedProducts] = useState<Product[]>([]);
    const [showCustomConfig, setShowCustomConfig] = useState(false);

    // Batch processing state
    const [useBatchProcessing, setUseBatchProcessing] = useState(false);
    const [startPage, setStartPage] = useState(1);
    const [endPage, setEndPage] = useState(3);
    const [batchSize, setBatchSize] = useState(1);

    // Check authentication on mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Check if user has admin privileges
                try {
                    const response = await fetch('/api/admin/check-access', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ uid: user.uid, email: user.email }),
                    });

                    const data = await response.json();
                    setIsAuthenticated(data.isAdmin || false);
                } catch {
                    setIsAuthenticated(false);
                }
            } else {
                setIsAuthenticated(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Handle logout
    const handleLogout = async () => {
        try {
            await signOut(auth);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Fetch existing scraped products on mount (only if authenticated)
    useEffect(() => {
        if (isAuthenticated) {
            fetchScrapedProducts();
        }
    }, [isAuthenticated]);

    const fetchScrapedProducts = async () => {
        try {
            const response = await fetch('/api/products/scraped');
            if (response.ok) {
                const data: ScrapedProductsResponse = await response.json();
                setScrapedProducts(data.products);
            }
        } catch (error) {
            console.error('Error fetching scraped products:', error);
        }
    };

    const handleScrape = async () => {
        if (!url) return;

        setIsLoading(true);
        setScrapingResult(null);

        try {
            const requestBody: {
                url: string;
                configType: string;
                customConfig?: Record<string, unknown>;
                startPage?: number;
                endPage?: number;
                batchSize?: number;
            } = { url, configType };

            if (showCustomConfig && customConfig) {
                try {
                    requestBody.customConfig = JSON.parse(customConfig);
                } catch {
                    setScrapingResult({
                        success: false,
                        error: 'Invalid JSON in custom configuration'
                    });
                    setIsLoading(false);
                    return;
                }
            }

            // Add batch processing parameters if enabled
            if (useBatchProcessing) {
                requestBody.startPage = startPage;
                requestBody.endPage = endPage;
                requestBody.batchSize = batchSize;
            }

            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // Handle different response formats
            if (result.success && result.products) {
                setScrapingResult({
                    success: true,
                    products: result.products,
                    count: result.products.length,
                });

                // Automatically add scraped products to the store
                await addProductsToStore(result.products);
                await fetchScrapedProducts(); // Refresh the list
            } else if (result.error) {
                setScrapingResult({
                    success: false,
                    error: result.error,
                });
            } else {
                setScrapingResult({
                    success: false,
                    error: 'Unexpected response format from server',
                });
            }

        } catch (error) {
            setScrapingResult({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const addProductsToStore = async (products: ScrapedProduct[]) => {
        try {
            const response = await fetch('/api/products/scraped', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    products,
                    replace: false,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to store products');
            }
        } catch (error) {
            console.error('Error storing products:', error);
        }
    };

    const clearScrapedProducts = async () => {
        try {
            const response = await fetch('/api/products/scraped', {
                method: 'DELETE',
            });

            if (response.ok) {
                setScrapedProducts([]);
                setScrapingResult(null);
            }
        } catch (error) {
            console.error('Error clearing products:', error);
        }
    };

    const deleteProduct = async (id: string) => {
        // For simplicity, we'll just clear all and re-add without the deleted product
        // In a real app, you'd want a more granular delete API
        const filteredProducts = scrapedProducts.filter(p => p.id !== id);
        try {
            const response = await fetch('/api/products/scraped', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    products: filteredProducts,
                    replace: true,
                }),
            });

            if (response.ok) {
                setScrapedProducts(filteredProducts);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    // Show loading while checking authentication
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">You need to be authenticated to access the admin panel.</p>
                    <Link
                        href={`/${lang}/admin/login`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-6 lg:px-10 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Product Scraping Admin</h1>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Logout
                    </button>
                </div>

                {/* Scraping Form */}
                <div className="bg-white rounded-lg border p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Scrape New Products</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Website URL</label>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com/products"
                                className="w-full px-3 py-2 border rounded-md"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Scraping Configuration</label>
                                <select
                                    value={configType}
                                    onChange={(e) => setConfigType(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                >
                                    <option value="generic">Generic</option>
                                    <option value="animeStore">Anime Store JP</option>
                                    <option value="amnibus">Amnibus</option>
                                    <option value="amazon">Amazon Style</option>
                                    <option value="ebay">eBay Style</option>
                                </select>
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={showCustomConfig}
                                        onChange={(e) => setShowCustomConfig(e.target.checked)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Custom Configuration</span>
                                </label>
                            </div>
                        </div>

                        {showCustomConfig && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Custom Configuration (JSON)</label>
                                <textarea
                                    value={customConfig}
                                    onChange={(e) => setCustomConfig(e.target.value)}
                                    placeholder={`{
  "selectors": {
    "productList": ".products, .product-grid, .items",
    "productCard": ".product, .item, article",
    "title": "h1, h2, .title, .product-title",
    "price": ".price, .amount, .cost",
    "originalPrice": ".original-price, .was-price",
    "image": "img, .product-image img",
    "description": ".description, .summary",
    "availability": ".stock, .availability"
  },
  "pagination": {
    "nextPageSelector": ".next, a[rel='next'], .pagination .next",
    "maxPages": 2
  }
}`}
                                    rows={8}
                                    className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                                />
                                <div className="mt-2 text-xs text-gray-600">
                                    💡 <strong>How to find selectors:</strong> Right-click on elements in the target website → Inspect Element → Look for class names and HTML structure → Test with document.querySelectorAll() in browser console
                                </div>
                            </div>
                        )}

                        {/* Batch Processing Section */}
                        <div className="border-t pt-4">
                            <div className="flex items-center mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={useBatchProcessing}
                                        onChange={(e) => setUseBatchProcessing(e.target.checked)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm font-medium">Enable Batch Processing</span>
                                </label>
                            </div>

                            {useBatchProcessing && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Start Page</label>
                                        <input
                                            type="number"
                                            value={startPage}
                                            onChange={(e) => setStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                                            min="1"
                                            className="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">End Page</label>
                                        <input
                                            type="number"
                                            value={endPage}
                                            onChange={(e) => setEndPage(Math.max(startPage, parseInt(e.target.value) || startPage))}
                                            min={startPage}
                                            className="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Batch Size (pages per request)</label>
                                        <input
                                            type="number"
                                            value={batchSize}
                                            onChange={(e) => setBatchSize(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))}
                                            min="1"
                                            max="10"
                                            className="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                </div>
                            )}

                            {useBatchProcessing && (endPage - startPage + 1) > 5 && (
                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <div className="text-sm text-yellow-800">
                                            <p className="font-semibold mb-1">⚠️ Large batch detected ({endPage - startPage + 1} pages)</p>
                                            <p className="mb-2">Scraping {endPage - startPage + 1} pages may timeout on Netlify free tier (26s limit).</p>
                                            <p className="font-semibold">Recommended approach:</p>
                                            <ul className="list-disc ml-5 mt-1 space-y-1">
                                                <li>Split into batches of <strong>3-5 pages</strong> each</li>
                                                <li>Example: Pages 1-5, then 6-10, then 11-15</li>
                                                <li>All products will accumulate in the list below</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleScrape}
                            disabled={isLoading || !url}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Scraping...' : useBatchProcessing ? `Start Batch Scraping (${startPage}-${endPage})` : 'Start Scraping'}
                        </button>
                    </div>

                    {/* Scraping Results */}
                    {scrapingResult && (
                        <div className={`mt-4 p-4 rounded-md ${scrapingResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <h3 className={`font-semibold ${scrapingResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                {scrapingResult.success ? 'Scraping Successful' : 'Scraping Failed'}
                            </h3>
                            <p className={`text-sm ${scrapingResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                {scrapingResult.success
                                    ? `Found ${scrapingResult.count} products`
                                    : scrapingResult.error
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Scraped Products Management */}
                <div className="bg-white rounded-lg border p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Scraped Products ({scrapedProducts.length})</h2>
                        {scrapedProducts.length > 0 && (
                            <button
                                onClick={clearScrapedProducts}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {scrapedProducts.length === 0 ? (
                        <p className="text-gray-500">No scraped products yet. Use the form above to scrape products from a website.</p>
                    ) : (
                        <div className="space-y-4">
                            {scrapedProducts.map((product) => (
                                <div key={product.id} className="flex items-start gap-4 p-4 border rounded-md">
                                    <div className="flex-shrink-0">
                                        {product.imageUrl ? (
                                            <Image
                                                src={product.imageUrl}
                                                alt={product.title || 'Product image'}
                                                width={64}
                                                height={64}
                                                className="w-16 h-16 object-cover rounded-md border"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 text-xs">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate">{product.title}</h3>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p>{product.brand} • {product.type} • ${product.price}</p>
                                            <p className="text-xs text-blue-600 break-all">Image: {product.imageUrl || 'Not available'}</p>
                                            {product.description && (
                                                <p className="text-xs text-gray-500 truncate">Desc: {product.description}</p>
                                            )}
                                            {product.availability === 'out' && (
                                                <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 text-xs rounded">Out of Stock</span>
                                            )}
                                            {product.labels?.map((label, index) => (
                                                <span key={index} className={`inline-block ml-1 px-2 py-1 text-xs rounded ${
                                                    label === 'Sold' ? 'bg-gray-100 text-gray-800' :
                                                    label === 'Used' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteProduct(product.id)}
                                        className="text-red-600 hover:text-red-800 text-sm flex-shrink-0"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
