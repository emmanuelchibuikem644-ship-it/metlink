export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-14 dark:border-ink-200 dark:bg-ink-100">
      <div className="page-shell grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2">
          <div className="font-display text-xl italic text-ink-50 dark:text-ink-950">Meetlink</div>
          <p className="mt-3 max-w-xs text-sm text-ink-400 dark:text-ink-900">
            Compatibility, confirmed. A premium space for adults seeking real connection.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-3">Company</div>
          <ul className="space-y-2 text-sm text-ink-400 dark:text-ink-900">
            <li><a href="#" className="transition hover:text-ink-50 dark:hover:text-ink-950">About</a></li>
            <li><a href="#" className="transition hover:text-ink-50 dark:hover:text-ink-950">Contact</a></li>
            <li><a href="#" className="transition hover:text-ink-50 dark:hover:text-ink-950">Blog</a></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3">Legal</div>
          <ul className="space-y-2 text-sm text-ink-400 dark:text-ink-900">
            <li><a href="#" className="transition hover:text-ink-50 dark:hover:text-ink-950">Privacy Policy</a></li>
            <li><a href="#" className="transition hover:text-ink-50 dark:hover:text-ink-950">Terms of Service</a></li>
            <li><a href="#" className="transition hover:text-ink-50 dark:hover:text-ink-950">Cookie Policy</a></li>
            <li><a href="#" className="transition hover:text-ink-50 dark:hover:text-ink-950">Community Guidelines</a></li>
          </ul>
        </div>
      </div>
      <div className="page-shell mt-10 border-t border-white/5 px-0 pt-6 text-xs text-ink-500 dark:border-ink-200 dark:text-ink-900">
        © {new Date().getFullYear()} Meetlink. All rights reserved. Members must be 18 or older.
      </div>
    </footer>
  );
}
