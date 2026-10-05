import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import AppShell from './appShell';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ASRS Inventory System',
  description: 'Automated Storage and Retrieval System Management',
  icons: {
    icon: "https://www.asrs.ae/wp-content/themes/asrs-august/assets/images/fav.png", // Points to public/favicon.ico
    // Optional: add Apple touch icons or dark mode icons
    // apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}