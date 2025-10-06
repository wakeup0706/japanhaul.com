export default async function RegisterPage({ params }: { params: Promise<{ lang: string }> }) {
	const { lang: rawLang } = await params;
	const lang = rawLang === "ja" ? "ja" : "en";
	const t = {
		en: { title: "Register", name: "Name", email: "Email", password: "Password", submit: "Create account" },
		ja: { title: "新規登録", name: "名前", email: "メール", password: "パスワード", submit: "アカウント作成" },
	}[lang];

	return (
		<section className="max-w-sm mx-auto px-4 py-10">
			<h1 className="text-xl font-semibold mb-4">{t.title}</h1>
			<form className="space-y-3">
				<input className="border rounded p-2 w-full" placeholder={t.name} />
				<input className="border rounded p-2 w-full" placeholder={t.email} />
				<input type="password" className="border rounded p-2 w-full" placeholder={t.password} />
				<button className="w-full bg-black text-white px-4 py-2 rounded">{t.submit}</button>
			</form>
		</section>
	);
}
