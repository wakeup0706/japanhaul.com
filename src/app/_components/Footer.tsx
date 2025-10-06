export default function Footer() {
	return (
		<footer className="border-t mt-10">
			<div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm text-gray-700">
				<div>
					<div className="font-semibold mb-3">Shop</div>
					<ul className="space-y-2">
						<li>Trending</li>
						<li>New arrivals</li>
						<li>On sale</li>
						<li>Collections</li>
					</ul>
				</div>
				<div>
					<div className="font-semibold mb-3">Customer care</div>
					<ul className="space-y-2">
						<li>My account</li>
						<li>Contact</li>
						<li>FAQs</li>
						<li>Shipping & returns</li>
					</ul>
				</div>
				<div>
					<div className="font-semibold mb-3">About</div>
					<ul className="space-y-2">
						<li>About us</li>
						<li>Careers</li>
						<li>Privacy</li>
						<li>Terms</li>
					</ul>
				</div>
			</div>
			<div className="border-t">
				<div className="max-w-6xl mx-auto px-4 py-6 text-xs text-gray-500">© 2025 JapanHaul Clone</div>
			</div>
		</footer>
	);
}
