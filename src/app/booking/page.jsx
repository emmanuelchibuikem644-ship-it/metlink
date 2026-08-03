"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import SubscriptionRoute from "../../components/SubscriptionRoute";

function BookingContent() {
  const [service, setService] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    notes: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("selectedService");

    if (saved) {
      setService(JSON.parse(saved));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!service) {
      setError("Please select a service first.");
      return;
    }

    setSaving(true);

    try {
      await api.createBooking({
        service_name: service.name,
        service_price: service.price,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        date: formData.date,
        time: formData.time,
        notes: formData.notes,
      });

      setSuccess("Booking submitted successfully. Awaiting approval.");
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        notes: "",
      });
    } catch (err) {
      setError(err.message || "Unable to submit booking right now.");
    } finally {
      setSaving(false);
    }
  };

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950 dark:bg-white">
        <div className="bg-ink-900/60 border border-white/10 p-8 rounded-xl shadow text-center dark:bg-white dark:border-ink-200">
          <h1 className="text-2xl font-bold mb-3 text-ink-50 dark:text-ink-950">
            No Service Selected
          </h1>

          <p className="text-ink-400 dark:text-ink-600">
            Please select a service from the Services page
            before making a booking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 p-8 dark:bg-ink-100/40">
      <div className="max-w-3xl mx-auto bg-ink-900/60 border border-white/10 rounded-xl shadow p-8 dark:bg-white dark:border-ink-200">

        <h1 className="text-3xl font-bold mb-6 text-ink-50 dark:text-ink-950">
          Book Appointment
        </h1>

        <div className="bg-ink-900/40 border border-white/10 p-4 rounded-lg mb-6 dark:bg-ink-100/60 dark:border-ink-200">
          <h2 className="font-semibold text-ink-50 dark:text-ink-950">Selected Service</h2>

          <p className="text-ink-400 dark:text-ink-600">{service.name}</p>

          <p className="text-green-600 font-bold">
            {service.price}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="text"
            placeholder="Full Name"
            required
            value={formData.full_name}
            onChange={(e) =>
              setFormData({
                ...formData,
                full_name: e.target.value,
              })
            }
            className="w-full border border-white/10 bg-ink-950 p-3 rounded-lg text-ink-50 outline-none focus:border-gold-400/50 dark:border-ink-200 dark:bg-white dark:text-ink-950"
          />

          <input
            type="email"
            placeholder="Email Address"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({
                ...formData,
                email: e.target.value,
              })
            }
            className="w-full border border-white/10 bg-ink-950 p-3 rounded-lg text-ink-50 outline-none focus:border-gold-400/50 dark:border-ink-200 dark:bg-white dark:text-ink-950"
          />

          <input
            type="tel"
            placeholder="Phone Number"
            required
            value={formData.phone}
            onChange={(e) =>
              setFormData({
                ...formData,
                phone: e.target.value,
              })
            }
            className="w-full border border-white/10 bg-ink-950 p-3 rounded-lg text-ink-50 outline-none focus:border-gold-400/50 dark:border-ink-200 dark:bg-white dark:text-ink-950"
          />

          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) =>
              setFormData({
                ...formData,
                date: e.target.value,
              })
            }
            className="w-full border border-white/10 bg-ink-950 p-3 rounded-lg text-ink-50 outline-none focus:border-gold-400/50 dark:border-ink-200 dark:bg-white dark:text-ink-950"
          />

          <input
            type="time"
            required
            value={formData.time}
            onChange={(e) =>
              setFormData({
                ...formData,
                time: e.target.value,
              })
            }
            className="w-full border border-white/10 bg-ink-950 p-3 rounded-lg text-ink-50 outline-none focus:border-gold-400/50 dark:border-ink-200 dark:bg-white dark:text-ink-950"
          />

          <textarea
            rows="5"
            placeholder="Notes / Special Requests"
            value={formData.notes}
            onChange={(e) =>
              setFormData({
                ...formData,
                notes: e.target.value,
              })
            }
            className="w-full border border-white/10 bg-ink-950 p-3 rounded-lg text-ink-50 outline-none focus:border-gold-400/50 dark:border-ink-200 dark:bg-white dark:text-ink-950"
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gold-400 text-ink-950 py-3 rounded-lg font-semibold hover:bg-gold-300 transition disabled:opacity-60"
          >
            {saving ? "Submitting…" : "Submit Booking Request"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <ProtectedRoute>
      <SubscriptionRoute>
        <BookingContent />
      </SubscriptionRoute>
    </ProtectedRoute>
  );
}
