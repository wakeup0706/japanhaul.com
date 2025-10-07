export default function Footer() {
    // For brevity, footer remains static English; could be moved to i18n if needed
    return (
        <footer className="mt-10 bg-black text-white">
            <div className="w-full px-6 lg:px-10 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-base">
				<div>
                    <div className="font-semibold mb-3 text-lg">Shop</div>
                    <ul className="space-y-2 pl-2 sm:pl-4">
						<li>Trending</li>
						<li>New arrivals</li>
						<li>On sale</li>
						<li>Collections</li>
					</ul>
				</div>
				<div>
                    <div className="font-semibold mb-3 text-lg">Customer care</div>
					<ul className="space-y-2">
						<li>My account</li>
						<li>Contact</li>
						<li>FAQs</li>
						<li>Shipping & returns</li>
					</ul>
				</div>
				<div>
                    <div className="font-semibold mb-3 text-lg">About</div>
					<ul className="space-y-2">
						<li>About us</li>
						<li>Careers</li>
						<li>Privacy</li>
						<li>Terms</li>
					</ul>
				</div>
			</div>
            <div className="border-t border-white/10">
                <div className="w-full px-6 lg:px-10 py-6 text-xs text-white/70">© 2025 JapanHaul Clone</div>
			</div>
		</footer>
	);
}
