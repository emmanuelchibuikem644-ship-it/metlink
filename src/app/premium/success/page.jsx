import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-2">Payment received</p>
      <h1 className="font-display text-4xl text-ink-50">Welcome to Premium.</h1>
      <p className="mt-4 text-sm text-ink-400">Your subscription is active — thanks for supporting Kindred.</p>
      <Link href="/home" className="btn-primary mt-8">Go to dashboard</Link>
    </section>
  );
}
