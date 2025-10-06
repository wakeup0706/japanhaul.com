"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/app/(cart)/CartContext";

export default function CartDrawer({ lang, open, onClose }: { lang: string; open: boolean; onClose: () => void }) {
    const { state, dispatch, subtotal } = useCart();
    const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[1200]">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <aside className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="text-xl font-semibold inline-flex items-center gap-2">
                        <span>Your cart</span>
                        <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-black px-2 text-xs font-semibold text-white">{itemCount}</span>
                    </div>
                    <button className="rounded-full p-2 hover:bg-gray-100" onClick={onClose}>✕</button>
                </div>
                <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
                    {state.items.length === 0 && <div className="text-sm text-gray-600">Your cart is empty</div>}
                    {state.items.map((i) => (
                        <div key={i.id} className="flex items-center gap-3">
                            <div className="h-16 w-16 overflow-hidden rounded border bg-white">
                                {/* fallback if no image */}
                                <Image src={i.image || "/placeholder.jpg"} alt={i.title} width={64} height={64} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-base font-medium">{i.title}</div>
                                <div className="text-sm text-gray-600">${i.price.toFixed(2)} USD</div>
                            </div>
                            <div className="inline-flex items-center rounded-full border px-5 py-2 min-w-[140px] justify-between">
                                <button
                                    className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-base"
                                    onClick={() => {
                                        const next = i.quantity - 1;
                                        if (next < 1) dispatch({ type: "remove", id: i.id });
                                        else dispatch({ type: "setQty", id: i.id, quantity: next });
                                    }}
                                >-</button>
                                <span className="px-2 text-base min-w-[2rem] text-center">{i.quantity}</span>
                                <button className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-base" onClick={() => dispatch({ type: "setQty", id: i.id, quantity: i.quantity + 1 })}>+</button>
                            </div>
                            <button
                                className="ml-3 text-sm text-red-600 font-medium hover:underline"
                                onClick={() => dispatch({ type: "remove", id: i.id })}
                            >Remove</button>
                        </div>
                    ))}
                </div>
                <div className="border-t px-4 py-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span>Estimated total</span>
                        <span className="font-semibold">${subtotal.toFixed(2)} USD</span>
                    </div>
                    <div className="flex gap-3">
                        <Link href={`/${lang}/cart`} className="flex-1 rounded-full border px-4 py-3 text-center text-base font-medium transition-colors hover:bg-indigo-600 hover:text-white hover:border-indigo-600" onClick={onClose}>View Cart</Link>
                        <button className="flex-1 rounded-full bg-black px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-700">Checkout</button>
                    </div>
                </div>
            </aside>
        </div>
    );
}


