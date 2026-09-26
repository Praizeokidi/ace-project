import Link from "next/link";
import { LayoutDashboard, Users, FileText, Settings, LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-[#4259a9]">ACE Dashboard</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md">
            <LayoutDashboard className="w-5 h-5 mr-3 text-gray-500" />
            Submissions
          </Link>
          <Link href="/dashboard/contacts" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md">
            <Users className="w-5 h-5 mr-3 text-gray-400" />
            Contacts
          </Link>
          <Link href="/dashboard/documents" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md">
            <FileText className="w-5 h-5 mr-3 text-gray-400" />
            Documents
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md">
            <LogOut className="w-5 h-5 mr-3 text-gray-400" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold text-gray-800">Admin Area</h1>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#4259a9] text-white flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </header>
        <div className="p-8 flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
