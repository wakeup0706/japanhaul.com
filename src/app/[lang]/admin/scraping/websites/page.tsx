"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { WebsiteConfig, WEBSITE_CONFIGS, getEnabledWebsites, getWebsitesNeedingUpdate } from "@/lib/scraping-config";

export default function WebsiteManagementPage() {
    const { lang: rawLang } = useParams<{ lang: string }>();
    const lang = rawLang === "ja" ? "ja" : "en";
    const router = useRouter();
    const t = useTranslations();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [websites, setWebsites] = useState<WebsiteConfig[]>(WEBSITE_CONFIGS);
    const [editingWebsite, setEditingWebsite] = useState<WebsiteConfig | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastScrapeResults, setLastScrapeResults] = useState<{ success: boolean; totalProducts?: number; websitesUpdated?: number; error?: string } | null>(null);

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
                } catch (error) {
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

    // Load websites on mount (only if authenticated)
    useEffect(() => {
        if (isAuthenticated) {
            setWebsites(WEBSITE_CONFIGS);
        }
    }, [isAuthenticated]);

    const handleToggleWebsite = (name: string) => {
        const updatedWebsites = websites.map(w =>
            w.name === name ? { ...w, enabled: !w.enabled } : w
        );
        setWebsites(updatedWebsites);
        // In a real app, you'd save this to a database
    };

    const handleScrapeNow = async () => {
        setIsLoading(true);
        setLastScrapeResults(null);

        try {
            const response = await fetch('/api/scrape/scheduled?force=true');
            const result = await response.json();

            setLastScrapeResults(result);

            if (result.success) {
                // Refresh the page to show updated data
                window.location.reload();
            }
        } catch (error) {
            console.error('Error running manual scrape:', error);
            setLastScrapeResults({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const enabledWebsites = getEnabledWebsites();
    const websitesNeedingUpdate = getWebsitesNeedingUpdate();

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
                    <h1 className="text-3xl font-bold">Website Management</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={handleScrapeNow}
                            disabled={isLoading}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Scraping...' : 'Scrape All Now'}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Scraping Results */}
                {lastScrapeResults && (
                    <div className={`mb-6 p-4 rounded-md ${lastScrapeResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <h3 className={`font-semibold ${lastScrapeResults.success ? 'text-green-800' : 'text-red-800'}`}>
                            {lastScrapeResults.success ? 'Scraping Successful' : 'Scraping Failed'}
                        </h3>
                        <p className={`text-sm ${lastScrapeResults.success ? 'text-green-700' : 'text-red-700'}`}>
                            {lastScrapeResults.success
                                ? `${lastScrapeResults.totalProducts} products scraped from ${lastScrapeResults.websitesUpdated} websites`
                                : lastScrapeResults.error
                            }
                        </p>
                    </div>
                )}

                {/* Website Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg border p-6">
                        <h3 className="text-lg font-semibold mb-2">Enabled Websites</h3>
                        <p className="text-3xl font-bold text-green-600">{enabledWebsites.length}</p>
                        <p className="text-sm text-gray-600">Active scraping sources</p>
                    </div>
                    <div className="bg-white rounded-lg border p-6">
                        <h3 className="text-lg font-semibold mb-2">Need Update</h3>
                        <p className="text-3xl font-bold text-orange-600">{websitesNeedingUpdate.length}</p>
                        <p className="text-sm text-gray-600">Due for refresh</p>
                    </div>
                    <div className="bg-white rounded-lg border p-6">
                        <h3 className="text-lg font-semibold mb-2">Update Frequency</h3>
                        <p className="text-3xl font-bold text-blue-600">30min</p>
                        <p className="text-sm text-gray-600">Automated schedule</p>
                    </div>
                </div>

                {/* Website List */}
                <div className="bg-white rounded-lg border">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-xl font-semibold">Configured Websites</h2>
                    </div>
                    <div className="divide-y">
                        {websites.map((website) => (
                            <div key={website.name} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={website.enabled}
                                                onChange={() => handleToggleWebsite(website.name)}
                                                className="rounded"
                                            />
                                            <div>
                                                <h3 className="font-semibold">{website.name}</h3>
                                                <p className="text-sm text-gray-600">{website.url}</p>
                                                {website.schedule && (
                                                    <p className="text-xs text-blue-600">
                                                        Updates every {website.schedule.intervalMinutes} minutes
                                                        {website.schedule.lastRun && (
                                                            <span className="ml-2">
                                                                (Last: {website.schedule.lastRun.toLocaleTimeString()})
                                                            </span>
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            website.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {website.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Setup Instructions</h3>
                    <div className="space-y-3 text-sm">
                        <p><strong>1. Configure Websites:</strong> Edit <code>src/lib/scraping-config.ts</code> to add your target websites</p>
                        <p><strong>2. Set Up Cron Job:</strong> Run <code>node scripts/setup-cron.js</code> to enable automated scraping</p>
                        <p><strong>3. Monitor Logs:</strong> Check <code>logs/scraping.log</code> for scraping activity</p>
                        <p><strong>4. Manual Scraping:</strong> Use "Scrape All Now" button for immediate updates</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
