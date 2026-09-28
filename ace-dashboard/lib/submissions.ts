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

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

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
      include: {
        contact: true,
        organisation: true,
      },
      orderBy: {
        received_at: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    submissions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getSubmissionById(id: string) {
  return prisma.submission.findUnique({
    where: { id },
    include: {
      contact: true,
      organisation: true,
      assigned_to: true,
      status_events: {
        orderBy: { created_at: 'desc' },
        include: { actor: true },
      },
      notes: {
        orderBy: { created_at: 'desc' },
        include: { author: true },
      },
      documents: true,
      consent_events: true,
    },
  });
}

export async function getSubmissionStats() {
  const [total, byTypeData, byStatusData, recentCount] = await Promise.all([
    prisma.submission.count(),
    prisma.submission.groupBy({
      by: ['type'],
      _count: { type: true },
    }),
    prisma.submission.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.submission.count({
      where: {
        received_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const byType = {
    [SubmissionType.CONSULTATION]: 0,
    [SubmissionType.TRAINING]: 0,
    [SubmissionType.PRIORITY_LIST]: 0,
    [SubmissionType.CONTACT]: 0,
  };

  byTypeData.forEach((item) => {
    byType[item.type] = item._count.type;
  });

  const byStatus = {
    [SubmissionStatus.NEW]: 0,
    [SubmissionStatus.CONTACTED]: 0,
    [SubmissionStatus.SPAM]: 0,
    [SubmissionStatus.DUPLICATE]: 0,
    [SubmissionStatus.QUALIFIED]: 0,
    [SubmissionStatus.CLOSED_LOST]: 0,
    [SubmissionStatus.SCHEDULED]: 0,
    [SubmissionStatus.IN_PROGRESS]: 0,
    [SubmissionStatus.COMPLETED]: 0,
  };

  byStatusData.forEach((item) => {
    byStatus[item.status] = item._count.status;
  });

  return {
    total,
    byType,
    byStatus,
    recentCount,
  };
}

export async function updateSubmissionStatus(id: string, newStatus: SubmissionStatus, actorId?: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const submission = await tx.submission.update({
      where: { id },
      data: { status: newStatus },
    });

    await tx.submissionStatusEvent.create({
      data: {
        submission_id: id,
        status: newStatus,
        actor_id: actorId,
        reason: reason,
      },
    });

    return submission;
  });
}

export async function createSubmissionFromForm(
  type: SubmissionType,
  contactData: { full_name: string; email: string; job_title?: string; telephone?: string; country?: string },
  orgData: { name: string; country?: string },
  payload: any,
  sourcePath: string,
  sourceIpHash: string,
  consents: { type: string; granted: boolean; source: string }[] = []
) {
  return prisma.$transaction(async (tx) => {
    // 1. Find or create the Organisation
    let organisation = null;
    if (orgData.name) {
      organisation = await tx.organisation.findFirst({
        where: { name: orgData.name, country: orgData.country },
      });

      if (!organisation) {
        organisation = await tx.organisation.create({
          data: {
            name: orgData.name,
            country: orgData.country,
          },
        });
      }
    }

    // 2. Find or create the Contact (upsert)
    const contact = await tx.contact.upsert({
      where: { email: contactData.email },
      update: {
        full_name: contactData.full_name,
        job_title: contactData.job_title,
        telephone: contactData.telephone,
        country: contactData.country,
        organisation_id: organisation?.id,
      },
      create: {
        email: contactData.email,
        full_name: contactData.full_name,
        job_title: contactData.job_title,
        telephone: contactData.telephone,
        country: contactData.country,
        organisation_id: organisation?.id,
      },
    });

    // 3. Generate a unique reference
    let prefix = 'CON';
    if (type === SubmissionType.TRAINING) prefix = 'TRN';
    if (type === SubmissionType.PRIORITY_LIST) prefix = 'PRL';
    if (type === SubmissionType.CONTACT) prefix = 'CNT';
    
    let reference = generateReference(prefix);
    
    // Ensure uniqueness
    let exists = await tx.submission.findUnique({ where: { reference } });
    while (exists) {
      reference = generateReference(prefix);
      exists = await tx.submission.findUnique({ where: { reference } });
    }

    // 4. Create the Submission with status NEW
    const submission = await tx.submission.create({
      data: {
        reference,
        type,
        status: SubmissionStatus.NEW,
        contact_id: contact.id,
        organisation_id: organisation?.id,
        payload: payload ? payload : Prisma.JsonNull,
        source_path: sourcePath,
        source_ip_hash: sourceIpHash,
        received_at: new Date(),
      },
    });

    // 5. Create initial SubmissionStatusEvent
    await tx.submissionStatusEvent.create({
      data: {
        submission_id: submission.id,
        status: SubmissionStatus.NEW,
        reason: 'Initial submission',
      },
    });

    // 6. Create relevant ConsentEvent records
    if (consents && consents.length > 0) {
      for (const consent of consents) {
        await tx.consentEvent.create({
          data: {
            contact_id: contact.id,
            submission_id: submission.id,
            consent_type: consent.type,
            granted: consent.granted,
            source: consent.source,
            ip_hash: sourceIpHash,
          },
        });
      }
    }

    return submission;
  });
}
