import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SmoothScroll from '@/app/components/ui/SmoothScroll';
import './globals.css';
import Navbar from './components/navbar/Navbar';
import Footer from './components/Footer/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Utimely',
  description: 'A simpler way to manage your goals, focus, and time.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <SmoothScroll>
          <Navbar></Navbar>
          {children}
          <Footer></Footer>
        </SmoothScroll>
      </body>
    </html>
  );
}
