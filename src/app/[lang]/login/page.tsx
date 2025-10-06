export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
	const { lang: rawLang } = await params;
	const lang = rawLang === "ja" ? "ja" : "en";
    const t = {
        en: { title: "Log in", email: "Email", password: "Password", submit: "Log in", create: "Create Account" },
        ja: { title: "ログイン", email: "メール", password: "パスワード", submit: "ログイン", create: "アカウント作成" },
    }[lang];

    return (
        <section className="max-w-sm mx-auto px-4 py-14">
            <h1 className="text-2xl font-semibold mb-6">{t.title}</h1>
            <form className="space-y-4">
                <input className="border rounded p-3 w-full text-base" placeholder={t.email} />
                <input type="password" className="border rounded p-3 w-full text-base" placeholder={t.password} />
                <button className="w-full bg-black text-white px-5 py-3 rounded text-base font-medium">{t.submit}</button>
            </form>
            <div className="mt-6 text-center text-base">
                <a href={`/${lang}/register`} className="inline-block underline hover:no-underline">{t.create}</a>
            </div>
        </section>
    );
}
