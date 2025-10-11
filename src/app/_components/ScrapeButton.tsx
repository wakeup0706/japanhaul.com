"use client";

import { useState } from "react";
import type { ScrapedProduct } from "@/lib/scraper";

interface ScrapeButtonProps {
    url: string;
    onScraped?: (products: ScrapedProduct[]) => void;
    className?: string;
    children?: React.ReactNode;
}

export default function ScrapeButton({ url, onScraped, className = "", children }: ScrapeButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleScrape = async () => {
        if (!url) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url,
                    configType: 'generic',
                }),
            });

            const result = await response.json();

            if (result.success && result.products) {
                onScraped?.(result.products);
            } else {
                setError(result.error || 'Scraping failed');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleScrape}
                disabled={isLoading || !url}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Scraping...
                    </>
                ) : (
                    children || 'Scrape Products'
                )}
            </button>

            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
