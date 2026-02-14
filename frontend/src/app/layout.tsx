import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'AcademicLink - Student Marketplace',
  description: 'Buy and sell academic materials within your university',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <div className="min-h-screen bg-white lg:bg-gray-50">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
