import prisma from '@/lib/prisma';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import TypeBadge from '@/components/TypeBadge';
import { Inbox, FileText, Briefcase, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardOverview() {
  const totalSubmissions = await prisma.submission.count();
  const consultations = await prisma.submission.count({ where: { type: 'CONSULTATION' } });
  const trainings = await prisma.submission.count({ where: { type: 'TRAINING' } });
  const priorityList = await prisma.submission.count({ where: { type: 'PRIORITY_LIST' } });

  const recentSubmissions = await prisma.submission.findMany({
    take: 10,
    orderBy: { received_at: 'desc' },
    include: {
      contact: true,
      organisation: true,
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Submissions" value={totalSubmissions} icon={Inbox} color="text-blue-600" />
        <MetricCard title="Consultation Leads" value={consultations} icon={Briefcase} color="text-purple-600" />
        <MetricCard title="Training Requests" value={trainings} icon={FileText} color="text-cyan-600" />
        <MetricCard title="Priority List" value={priorityList} icon={Star} color="text-amber-600" />
      </div>

      {/* Recent Submissions */}
      <div className="bg-white shadow rounded-lg mt-8">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Submissions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organisation</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentSubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{submission.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><TypeBadge type={submission.type as any} /></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{submission.contact?.full_name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{submission.contact?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{submission.organisation?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={submission.status as any} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(submission.received_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentSubmissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No recent submissions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
