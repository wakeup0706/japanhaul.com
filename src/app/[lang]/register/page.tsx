"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function RegisterPage() {
    const { lang: rawLang } = useParams<{ lang: string }>();
    const router = useRouter();

    const lang = rawLang === "ja" ? "ja" : "en";
    const t = {
        en: { title: "Register", name: "Name", email: "Email", password: "Password", submit: "Create account", signin: "Sign in", google: "Create account with Google" },
        ja: { title: "新規登録", name: "名前", email: "メール", password: "パスワード", submit: "アカウント作成", signin: "ログイン", google: "Googleでアカウント作成" },
    }[lang];

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Create user in Firebase Auth first (client-side)
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update the user's display name
            if (name) {
                await updateProfile(user, {
                    displayName: name
                });
            }

            // Send user data to API for server-side processing (if needed)
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    name,
                    isGoogleSignIn: false,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Sign out the user after successful registration (they'll need to login)
                await auth.signOut();
                // Redirect to login page with success message
                router.push(`/${lang}/login?message=RegistrationSuccess`);
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (error) {
            console.error('Registration error:', error);
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : (lang === 'ja' ? '登録エラー' : 'Registration error')
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setMessage(null);

        try {
            // Google Sign-In using Firebase client SDK
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if this user is already registered in Firebase Auth
            // If user already exists, redirect to login instead of registering
            if (user.metadata.lastSignInTime) {
                // User already exists, redirect to login
                await auth.signOut();
                setMessage({
                    type: 'error',
                    text: lang === 'ja'
                        ? 'このメールアドレスは既に登録されています。ログインしてください。'
                        : 'This email is already registered. Please log in instead.'
                });
                return;
            }

            // User is new and being registered, proceed with registration
            // Send user data to API for server-side processing (if needed)
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
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
            console.error('Google registration error:', error);
            setMessage({ type: 'error', text: lang === 'ja' ? 'Google登録エラー' : 'Google registration error' });
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
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="border rounded p-3 w-full text-base"
                    placeholder={t.name}
                />
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

            <div className="mt-6 text-center text-base">
                <Link href={`/${lang}/login`} className="inline-block underline hover:no-underline">{t.signin}</Link>
            </div>
        </section>
    );
}
