import prisma from '@/lib/prisma';
import StatusBadge from '@/components/StatusBadge';
import TypeBadge from '@/components/TypeBadge';
import Link from 'next/link';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    type?: string;
    search?: string;
    page?: string;
  };
}

export default async function SubmissionsPage({ searchParams }: PageProps) {
  const typeFilter = searchParams.type;
  const searchStr = searchParams.search;
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 20;

  const where: Prisma.SubmissionWhereInput = {};

  if (typeFilter && typeFilter !== 'ALL') {
    where.type = typeFilter as any;
  }

  if (searchStr) {
    where.OR = [
      { reference: { contains: searchStr, mode: 'insensitive' } },
      { contact: { full_name: { contains: searchStr, mode: 'insensitive' } } },
      { contact: { email: { contains: searchStr, mode: 'insensitive' } } },
    ];
  }

  const [submissions, totalCount] = await Promise.all([
    prisma.submission.findMany({
      where,
      orderBy: { received_at: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        contact: true,
        organisation: true,
      },
    }),
    prisma.submission.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const tabs = [
    { name: 'All', value: 'ALL' },
    { name: 'Consultation', value: 'CONSULTATION' },
    { name: 'Training', value: 'TRAINING' },
    { name: 'Priority List', value: 'PRIORITY_LIST' },
    { name: 'Contact', value: 'CONTACT' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Submissions</h1>
        <a 
          href="/api/dashboard/submissions?format=csv"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Export CSV
        </a>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Filters and Search */}
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  href={`/dashboard/submissions?type=${tab.value}${searchStr ? `&search=${searchStr}` : ''}`}
                  className={`${
                    (typeFilter === tab.value) || (!typeFilter && tab.value === 'ALL')
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.name}
                </Link>
              ))}
            </nav>
            <div className="w-full sm:max-w-xs">
              <form method="GET" action="/dashboard/submissions">
                {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative">
                  <input
                    id="search"
                    name="search"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
                    placeholder="Search name, email, ref..."
                    defaultValue={searchStr || ''}
                  />
                  <button type="submit" className="hidden">Search</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Table */}
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
              {submissions.map((submission) => (
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
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No submissions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Link
                href={`/dashboard/submissions?page=${Math.max(1, page - 1)}${typeFilter ? `&type=${typeFilter}` : ''}${searchStr ? `&search=${searchStr}` : ''}`}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </Link>
              <Link
                href={`/dashboard/submissions?page=${Math.min(totalPages, page + 1)}${typeFilter ? `&type=${typeFilter}` : ''}${searchStr ? `&search=${searchStr}` : ''}`}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </Link>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Link
                    href={`/dashboard/submissions?page=${Math.max(1, page - 1)}${typeFilter ? `&type=${typeFilter}` : ''}${searchStr ? `&search=${searchStr}` : ''}`}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Previous</span>
                    &laquo;
                  </Link>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <Link
                    href={`/dashboard/submissions?page=${Math.min(totalPages, page + 1)}${typeFilter ? `&type=${typeFilter}` : ''}${searchStr ? `&search=${searchStr}` : ''}`}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Next</span>
                    &raquo;
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
