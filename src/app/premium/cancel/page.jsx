import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-2">Checkout canceled</p>
      <h1 className="font-display text-4xl text-ink-50">No charge was made.</h1>
      <p className="mt-4 text-sm text-ink-400">You can upgrade any time from the pricing page.</p>
      <Link href="/premium" className="btn-primary mt-8">Back to pricing</Link>
    </section>
  );
}
