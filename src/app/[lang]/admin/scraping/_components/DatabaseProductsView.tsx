"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ScrapedProductDB {
    id: string;
    title: string;
    price: number;
    originalPrice?: number;
    brand: string;
    category: string;
    imageUrl?: string;
    description?: string;
    availability: 'in' | 'out';
    sourceUrl: string;
    sourceSite: string;
    condition?: "new" | "used" | "refurbished";
    isSoldOut?: boolean;
    labels?: string[];
    scrapedAt: { seconds: number };
    lastUpdated: { seconds: number };
    isActive: boolean;
}

interface ScrapingJob {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    sourceSite: string;
    productsScraped: number;
    productsAdded: number;
    productsUpdated: number;
    startedAt: { seconds: number };
    completedAt?: { seconds: number };
    errorMessage?: string;
}

interface Stats {
    totalProducts: number;
    activeProducts: number;
    inStockProducts: number;
    outOfStockProducts: number;
    lastScrapedAt?: string;
}

export function DatabaseProductsView() {
    const [products, setProducts] = useState<ScrapedProductDB[]>([]);
    const [jobs, setJobs] = useState<ScrapingJob[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');
    const [sourceFilter, setSourceFilter] = useState<string>('all');

    useEffect(() => {
        loadData();
    }, [filter, sourceFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load products
            const productsUrl = new URL('/api/products/db', window.location.origin);
            if (filter !== 'all') {
                productsUrl.searchParams.set('availability', filter);
            }
            if (sourceFilter !== 'all') {
                productsUrl.searchParams.set('source', sourceFilter);
            }
            
            const productsResponse = await fetch(productsUrl);
            const productsData = await productsResponse.json();
            setProducts(productsData.products || []);

            // Load stats
            const statsResponse = await fetch('/api/products/db?action=stats');
            const statsData = await statsResponse.json();
            setStats(statsData.stats);

            // Load recent jobs
            const jobsResponse = await fetch('/api/products/db?action=jobs&limit=5');
            const jobsData = await jobsResponse.json();
            setJobs(jobsData.jobs || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await fetch(`/api/products/db?id=${productId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setProducts(products.filter(p => p.id !== productId));
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const handleClearAll = async () => {
        if (!confirm('Are you sure you want to clear ALL products? This cannot be undone!')) return;
        if (!confirm('Really? This will delete all scraped products from the database!')) return;

        try {
            const response = await fetch('/api/products/db?action=clear', {
                method: 'DELETE',
            });

            if (response.ok) {
                setProducts([]);
                loadData(); // Reload stats
            }
        } catch (error) {
            console.error('Error clearing products:', error);
        }
    };

    const formatDate = (timestamp: { seconds: number }) => {
        return new Date(timestamp.seconds * 1000).toLocaleString();
    };

    const uniqueSources = [...new Set(products.map(p => p.sourceSite))];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Total Products</div>
                        <div className="text-2xl font-bold">{stats.totalProducts}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Active</div>
                        <div className="text-2xl font-bold text-green-600">{stats.activeProducts}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">In Stock</div>
                        <div className="text-2xl font-bold text-blue-600">{stats.inStockProducts}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Out of Stock</div>
                        <div className="text-2xl font-bold text-red-600">{stats.outOfStockProducts}</div>
                    </div>
                </div>
            )}

            {/* Recent Jobs */}
            {jobs.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Scraping Jobs</h3>
                    <div className="space-y-2">
                        {jobs.map((job) => (
                            <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <div>
                                    <div className="font-medium">{job.sourceSite}</div>
                                    <div className="text-sm text-gray-600">
                                        {formatDate(job.startedAt)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`inline-block px-2 py-1 text-xs rounded-full ${
                                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        job.status === 'failed' ? 'bg-red-100 text-red-800' :
                                        job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {job.status}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {job.productsScraped} products
                                        {job.status === 'completed' && ` (${job.productsAdded} new, ${job.productsUpdated} updated)`}
                                    </div>
                                    {job.errorMessage && (
                                        <div className="text-xs text-red-600 mt-1">{job.errorMessage}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters and Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div>
                        <label className="text-sm text-gray-600 mr-2">Availability:</label>
                        <select 
                            value={filter} 
                            onChange={(e) => setFilter(e.target.value as 'all' | 'in' | 'out')}
                            className="border rounded px-3 py-2"
                        >
                            <option value="all">All</option>
                            <option value="in">In Stock</option>
                            <option value="out">Out of Stock</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600 mr-2">Source:</label>
                        <select 
                            value={sourceFilter} 
                            onChange={(e) => setSourceFilter(e.target.value)}
                            className="border rounded px-3 py-2"
                        >
                            <option value="all">All Sources</option>
                            {uniqueSources.map(source => (
                                <option key={source} value={source}>{source}</option>
                            ))}
                        </select>
                    </div>

                    <div className="ml-auto space-x-2">
                        <button
                            onClick={loadData}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Refresh
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Clear All
                        </button>
                    </div>
                </div>

                <div className="text-sm text-gray-600">
                    Showing {products.length} products
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg shadow p-4">
                        {product.imageUrl && (
                            <div className="relative w-full h-48 mb-3 bg-gray-100 rounded">
                                <Image
                                    src={product.imageUrl}
                                    alt={product.title}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        )}
                        <h3 className="font-semibold mb-2 line-clamp-2">{product.title}</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Price:</span>
                                <span className="font-bold">${product.price}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Source:</span>
                                <span>{product.sourceSite}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className={product.availability === 'in' ? 'text-green-600' : 'text-red-600'}>
                                    {product.availability === 'in' ? 'In Stock' : 'Out of Stock'}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                                Scraped: {formatDate(product.scrapedAt)}
                            </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <a
                                href={product.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                                View Source
                            </a>
                            <button
                                onClick={() => handleDelete(product.id)}
                                className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {products.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No products found. Run a scraping job to add products.
                </div>
            )}
        </div>
    );
}
