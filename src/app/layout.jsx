import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import { ThemeProvider } from "../lib/theme-context";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import SupportChat from "../components/SupportChat";

export const metadata = {
  title: "Kindred — Compatibility, confirmed.",
  description:
    "Kindred is a premium dating platform for adults who want compatibility, not just a swipe.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col overflow-x-hidden">
        <ThemeProvider>
          <AuthProvider>
            <NavBar />
            <main className="flex-1">{children}</main>
            <Footer />
            <SupportChat />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
