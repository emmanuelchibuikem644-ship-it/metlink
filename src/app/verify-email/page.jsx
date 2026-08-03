"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("checking"); // checking | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const uid = searchParams.get("uid");
    const token = searchParams.get("token");

    if (!uid || !token) {
      setStatus("error");
      setMessage("This verification link is missing information.");
      return;
    }

    api
      .verifyEmail({ uid, token })
      .then((res) => {
        setStatus("success");
        setMessage(res.detail);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [searchParams]);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-2">Email verification</p>
      <h1 className="font-display text-4xl text-ink-50">
        {status === "checking" && "Verifying…"}
        {status === "success" && "You're verified!"}
        {status === "error" && "Verification failed"}
      </h1>
      <p className="mt-4 text-sm text-ink-400">{message}</p>
      <Link href="/home" className="btn-primary mt-8">Go to dashboard</Link>
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-ink-400">Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
