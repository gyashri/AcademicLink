'use client';

import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="lg:ml-64 min-h-screen bg-white lg:bg-gray-50">
        <div className="lg:max-w-6xl lg:mx-auto lg:py-6 lg:px-8">
          <div className="lg:bg-white lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-100">
            {children}
          </div>
        </div>
      </main>
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}
