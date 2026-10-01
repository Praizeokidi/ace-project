import crypto from 'node:crypto';
import prisma from './prisma';
import { generateReference } from './utils';
import { SubmissionType, SubmissionStatus, Prisma } from '@prisma/client';

export type SubmissionFilters = {
  type?: SubmissionType;
  status?: SubmissionStatus;
  search?: string;
  page?: number;
  limit?: number;
};

export async function getSubmissions(filters?: SubmissionFilters) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;
  const where: Prisma.SubmissionWhereInput = {};

  if (filters?.type) where.type = filters.type;
  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [
      { reference: { contains: filters.search, mode: 'insensitive' } },
      { contact: { full_name: { contains: filters.search, mode: 'insensitive' } } },
      { contact: { email: { contains: filters.search, mode: 'insensitive' } } },
      { organisation: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      include: { contact: true, organisation: true },
      orderBy: { received_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.submission.count({ where }),
  ]);

  return { submissions, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getSubmissionById(id: string) {
  return prisma.submission.findUnique({
    where: { id },
    include: {
      contact: true,
      organisation: true,
      assigned_to: true,
      status_events: { orderBy: { occurred_at: 'desc' }, include: { actor: true } },
      notes: { orderBy: { created_at: 'desc' }, include: { author: true } },
      documents: true,
      consents: true,
    },
  });
}

export async function getSubmissionStats() {
  const [total, byTypeData, byStatusData, recentCount] = await Promise.all([
    prisma.submission.count(),
    prisma.submission.groupBy({ by: ['type'], _count: { type: true } }),
    prisma.submission.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.submission.count({
      where: { received_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const byType: Record<string, number> = {};
  byTypeData.forEach((item) => { byType[item.type] = item._count.type; });
  const byStatus: Record<string, number> = {};
  byStatusData.forEach((item) => { byStatus[item.status] = item._count.status; });

  return { total, byType, byStatus, recentCount };
}

export async function updateSubmissionStatus(
  id: string,
  newStatus: SubmissionStatus,
  actorId?: string,
  reason?: string,
) {
  return prisma.$transaction(async (tx) => {
    const submission = await tx.submission.update({ where: { id }, data: { status: newStatus } });
    await tx.submissionStatusEvent.create({
      data: {
        submission_id: id,
        from_status: submission.status,
        to_status: newStatus,
        actor_id: actorId,
        reason,
        occurred_at: new Date(),
      },
    });
    return submission;
  });
}

type CreateSubmissionInput = {
  type: SubmissionType;
  email: string;
  name: string;
  organization?: string;
  job_title?: string;
  telephone?: string;
  country?: string;
  payload: Record<string, unknown>;
  source_path?: string;
  source_ip_hash?: string;
  privacy_consent?: boolean;
  marketing_consent?: boolean;
};

export async function createSubmissionFromForm(input: CreateSubmissionInput) {
  const organizationName = input.organization?.trim() || 'Website enquiry';
  const organizationCountry = input.country?.trim() || 'Not provided';
  const sourceIpHash = crypto
    .createHash('sha256')
    .update(input.source_ip_hash || 'unknown')
    .digest('hex');

  return prisma.$transaction(async (tx) => {
    const existingOrganisation = await tx.organisation.findFirst({
      where: { name: organizationName, country: organizationCountry },
    });
    const organisation = existingOrganisation || await tx.organisation.create({
      data: { name: organizationName, country: organizationCountry },
    });

    const contact = await tx.contact.upsert({
      where: { email: input.email },
      update: {
        full_name: input.name,
        job_title: input.job_title || 'Not provided',
        telephone: input.telephone || 'Not provided',
        country: organizationCountry,
        organisation_id: organisation.id,
      },
      create: {
        email: input.email,
        full_name: input.name,
        job_title: input.job_title || 'Not provided',
        telephone: input.telephone || 'Not provided',
        country: organizationCountry,
        organisation_id: organisation.id,
      },
    });

    let reference = generateReference(input.type === SubmissionType.CONSULTATION ? 'CON' : input.type === SubmissionType.TRAINING ? 'TRN' : input.type === SubmissionType.PRIORITY_LIST ? 'PRL' : 'CNT');
    while (await tx.submission.findUnique({ where: { reference } })) {
      reference = generateReference('ACE');
    }

    const submission = await tx.submission.create({
      data: {
        reference,
        type: input.type,
        status: SubmissionStatus.NEW,
        contact_id: contact.id,
        organisation_id: organisation.id,
        payload: input.payload as Prisma.InputJsonValue,
        source_path: input.source_path || 'website',
        source_ip_hash: sourceIpHash,
        received_at: new Date(),
      },
    });

    await tx.submissionStatusEvent.create({
      data: {
        submission_id: submission.id,
        to_status: SubmissionStatus.NEW,
        reason: 'Initial submission',
        occurred_at: new Date(),
      },
    });

    await tx.consentEvent.createMany({
      data: [
        ...(input.privacy_consent !== undefined ? [{ contact_id: contact.id, submission_id: submission.id, kind: 'PRIVACY' as const, granted: input.privacy_consent, policy_version: 'current', captured_at: new Date() }] : []),
        ...(input.marketing_consent !== undefined ? [{ contact_id: contact.id, submission_id: submission.id, kind: 'MARKETING' as const, granted: input.marketing_consent, policy_version: 'current', captured_at: new Date() }] : []),
      ],
    });

    return submission;
  });
}
