export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
	const { lang: rawLang } = await params;
	const lang = rawLang === "ja" ? "ja" : "en";
	const t = {
		en: { title: "Log in", email: "Email", password: "Password", submit: "Log in" },
		ja: { title: "ログイン", email: "メール", password: "パスワード", submit: "ログイン" },
	}[lang];

	return (
		<section className="max-w-sm mx-auto px-4 py-10">
			<h1 className="text-xl font-semibold mb-4">{t.title}</h1>
			<form className="space-y-3">
				<input className="border rounded p-2 w-full" placeholder={t.email} />
				<input type="password" className="border rounded p-2 w-full" placeholder={t.password} />
				<button className="w-full bg-black text-white px-4 py-2 rounded">{t.submit}</button>
			</form>
		</section>
	);
}
