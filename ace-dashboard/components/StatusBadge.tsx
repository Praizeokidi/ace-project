import React from 'react';

type SubmissionStatus = 'NEW' | 'CONTACTED' | 'SPAM' | 'DUPLICATE' | 'QUALIFIED' | 'CLOSED_LOST' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

interface StatusBadgeProps {
  status: SubmissionStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<SubmissionStatus, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    CONTACTED: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    QUALIFIED: 'bg-indigo-100 text-indigo-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CLOSED_LOST: 'bg-red-100 text-red-800',
    SPAM: 'bg-red-100 text-red-800',
    DUPLICATE: 'bg-gray-100 text-gray-800',
    SCHEDULED: 'bg-cyan-100 text-cyan-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
      {status ? status.replace('_', ' ') : 'UNKNOWN'}
    </span>
  );
}
