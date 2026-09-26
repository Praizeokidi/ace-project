import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">ACE Data Protection Dashboard</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl text-center">
        Welcome to the ACE Dashboard. Here you can view incoming submissions for DPIA consultations, training requests, priority lists, and newsletters.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-2">Submissions Overview</h2>
          <p className="text-gray-500 mb-4">View and manage all client submissions.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline font-medium">Go to Dashboard →</Link>
        </div>
      </div>
    </div>
  );
}
