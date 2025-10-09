"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function LoginPage() {
    const { lang: rawLang } = useParams<{ lang: string }>();
    const router = useRouter();
    const searchParams = useSearchParams();

    const lang = rawLang === "ja" ? "ja" : "en";
    const t = {
        en: { title: "Log in", email: "Email", password: "Password", submit: "Log in", create: "Create Account", forgot: "Forgot password?", google: "Continue with Google" },
        ja: { title: "ログイン", email: "メール", password: "パスワード", submit: "ログイン", create: "アカウント作成", forgot: "パスワードをお忘れですか?", google: "Googleで続行" },
    }[lang];

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const message = searchParams.get('message');
        const error = searchParams.get('error');

        if (message === 'PasswordReset') {
            setMessage({ type: 'success', text: lang === 'ja' ? 'パスワードが正常にリセットされました' : 'Password reset successfully!' });
        } else if (error) {
            setMessage({ type: 'error', text: error });
        }
    }, [searchParams, lang]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    isGoogleSignIn: false,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Redirect to dashboard or home page
                router.push('/');
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (error) {
            setMessage({ type: 'error', text: lang === 'ja' ? 'ログインエラー' : 'Login error' });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isGoogleSignIn: true,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Redirect to dashboard or home page
                router.push('/');
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (error) {
            setMessage({ type: 'error', text: lang === 'ja' ? 'Googleログインエラー' : 'Google sign-in error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="max-w-sm mx-auto px-4 py-14">
            <h1 className="text-2xl font-semibold mb-6">{t.title}</h1>

            {message && (
                <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-3 rounded border px-5 py-3 text-base font-medium mb-4 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                {/* Polished Google icon in a circular badge */}
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white ring-1 ring-gray-200 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.778 32.659 29.273 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.943 6.053 29.743 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.493 0 19.128-7.652 19.128-20 0-1.341-.138-2.651-.517-3.917z"/>
                        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.262 16.057 18.77 12 24 12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.943 6.053 29.743 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                        <path fill="#4CAF50" d="M24 44c5.186 0 9.86-1.719 13.54-4.671l-6.249-5.241C29.274 36.659 24.77 40 19.5 40 14.274 40 9.8 36.708 8.034 32.106l-6.6 5.082C4.737 41.775 13.66 44 24 44z"/>
                        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.36 4.659-5.865 8-11.303 8-5.226 0-9.7-3.292-11.466-7.894l-6.6 5.082C8.34 39.775 15.66 44 24 44c10.493 0 19.128-7.652 19.128-20 0-1.341-.138-2.651-.517-3.917z"/>
                    </svg>
                </span>
                {t.google}
            </button>

            <form className="space-y-4" onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border rounded p-3 w-full text-base"
                    placeholder={t.email}
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border rounded p-3 w-full text-base"
                    placeholder={t.password}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white px-5 py-3 rounded text-base font-medium disabled:opacity-50"
                >
                    {loading ? '...' : t.submit}
                </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-base">
                <Link href={`/${lang}/register`} className="underline hover:no-underline">{t.create}</Link>
                <Link href={`/${lang}/forgot-password`} className="underline hover:no-underline">{t.forgot}</Link>
            </div>
        </section>
    );
}
