import React from 'react';

type SubmissionType = 'CONSULTATION' | 'TRAINING' | 'PRIORITY_LIST' | 'CONTACT';

interface TypeBadgeProps {
  type: SubmissionType;
}

export default function TypeBadge({ type }: TypeBadgeProps) {
  const typeConfig: Record<SubmissionType, string> = {
    CONSULTATION: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10',
    TRAINING: 'bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-700/10',
    PRIORITY_LIST: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10',
    CONTACT: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-700/10',
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${typeConfig[type] || 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'}`}>
      {type ? type.replace('_', ' ') : 'UNKNOWN'}
    </span>
  );
}
