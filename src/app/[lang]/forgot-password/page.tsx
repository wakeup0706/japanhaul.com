"use client";
import { useParams } from "next/navigation";

export default function ForgotPasswordPage() {
    const { lang: rawLang } = useParams<{ lang: string }>();
    const lang = rawLang === "ja" ? "ja" : "en";
    const t = {
        en: { title: "Forgot password", email: "Email", submit: "Send reset link" },
        ja: { title: "パスワードをお忘れですか", email: "メール", submit: "リセットリンクを送信" },
    }[lang];

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const email = (data.get("email") as string) || "";
        const url = `/api/auth/login?returnTo=/api/auth/reset?email=${encodeURIComponent(email)}`;
        window.location.href = url;
    }

    return (
        <section className="max-w-sm mx-auto px-4 py-14">
            <h1 className="text-2xl font-semibold mb-6">{t.title}</h1>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <input name="email" required className="border rounded p-3 w-full text-base" placeholder={t.email} />
                <button className="w-full bg-black text-white px-5 py-3 rounded text-base font-medium" type="submit">{t.submit}</button>
            </form>
        </section>
    );
}


