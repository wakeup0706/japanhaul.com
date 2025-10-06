export default async function RegisterPage({ params }: { params: Promise<{ lang: string }> }) {
	const { lang: rawLang } = await params;
	const lang = rawLang === "ja" ? "ja" : "en";
    const t = {
        en: { title: "Register", name: "Name", email: "Email", password: "Password", submit: "Create account", signin: "Sign in" },
        ja: { title: "新規登録", name: "名前", email: "メール", password: "パスワード", submit: "アカウント作成", signin: "ログイン" },
    }[lang];

    return (
        <section className="max-w-sm mx-auto px-4 py-14">
            <h1 className="text-2xl font-semibold mb-6">{t.title}</h1>
            <form className="space-y-4">
                <input className="border rounded p-3 w-full text-base" placeholder={t.name} />
                <input className="border rounded p-3 w-full text-base" placeholder={t.email} />
                <input type="password" className="border rounded p-3 w-full text-base" placeholder={t.password} />
                <button className="w-full bg-black text-white px-5 py-3 rounded text-base font-medium">{t.submit}</button>
            </form>
            <div className="mt-6 text-center text-base">
                <a href={`/${lang}/login`} className="inline-block underline hover:no-underline">{t.signin}</a>
            </div>
        </section>
    );
}
