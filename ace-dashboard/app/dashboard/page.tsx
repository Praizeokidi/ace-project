// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

export default async function DashboardPage() {
  // In a real app, fetch from Prisma:
  // const submissions = await prisma.submission.findMany({ include: { contact: true, organisation: true }, orderBy: { received_at: 'desc' } });
  
  const mockSubmissions = [
    {
      id: "1",
      reference: "ACE-CON-123456",
      type: "CONSULTATION",
      status: "NEW",
      received_at: new Date().toISOString(),
      contact: { full_name: "Jane Doe", email: "jane@example.com" },
      organisation: { name: "TechCorp Ltd" }
    },
    {
      id: "2",
      reference: "ACE-TRN-987654",
      type: "TRAINING",
      status: "CONTACTED",
      received_at: new Date(Date.now() - 86400000).toISOString(),
      contact: { full_name: "John Smith", email: "john@smith.com" },
      organisation: { name: "Smith & Co" }
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Recent Submissions</h2>
        <button className="px-4 py-2 bg-[#4259a9] text-white rounded hover:bg-blue-800 text-sm font-medium">
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Reference</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Contact</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Organisation</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockSubmissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="p-4 text-sm font-medium text-gray-900">{sub.reference}</td>
                <td className="p-4 text-sm text-gray-500">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {sub.type}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-500">
                  <div className="font-medium text-gray-900">{sub.contact.full_name}</div>
                  <div className="text-gray-500">{sub.contact.email}</div>
                </td>
                <td className="p-4 text-sm text-gray-500">{sub.organisation.name}</td>
                <td className="p-4 text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    sub.status === 'NEW' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {sub.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-500">
                  {new Date(sub.received_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
