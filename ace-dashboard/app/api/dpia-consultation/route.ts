import { NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Extract fields
    const fullName = formData.get('full_name') as string;
    const organisationName = formData.get('organisation') as string;
    const jobTitle = formData.get('job_title') as string;
    const email = formData.get('business_email') as string;
    const telephone = formData.get('telephone') as string || '';
    const country = formData.get('country') as string;
    const processingDescription = formData.get('processing_description') as string;
    const projectStage = formData.get('project_stage') as string;
    const dpiaStatus = formData.get('dpia_status') as string;
    
    // Checkboxes (multi-select)
    const supportNeeds = formData.getAll('support_needs[]');
    const riskIndicators = formData.getAll('risk_indicators[]');
    
    // Additional fields
    const consultationFormat = formData.get('consultation_format') as string || '';
    const preferredDate = formData.get('preferred_date') as string || '';
    const preferredTime = formData.get('preferred_time') as string || '';
    const alternativeDatetime = formData.get('alternative_datetime') as string || '';
    const additionalInformation = formData.get('additional_information') as string || '';
    
    // File
    const file = formData.get('existing_dpia_file') as File | null;
    let fileKey = null;
    if (file && file.size > 0) {
      // In a real app, upload this file to S3/Cloudflare R2 here
      // fileKey = await uploadFileToStorage(file);
    }
    
    // To wire this up to the Prisma DB in the future:
    /*
    let org = await prisma.organisation.findFirst({ where: { name: organisationName } });
    if (!org) {
      org = await prisma.organisation.create({ data: { name: organisationName, country } });
    }
    
    let contact = await prisma.contact.findUnique({ where: { email } });
    if (!contact) {
      contact = await prisma.contact.create({
        data: { organisation_id: org.id, full_name: fullName, job_title: jobTitle, email, telephone, country }
      });
    }
    
    const reference = `ACE-CON-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    
    const submission = await prisma.submission.create({
      data: {
        reference,
        type: 'CONSULTATION',
        status: 'NEW',
        contact_id: contact.id,
        organisation_id: org.id,
        source_path: '/ebook/consultation/consultation.html',
        source_ip_hash: 'placeholder',
        received_at: new Date(),
        payload: {
          supportNeeds,
          processingDescription,
          riskIndicators,
          projectStage,
          dpiaStatus,
          consultationFormat,
          preferredDate,
          preferredTime,
          alternativeDatetime,
          additionalInformation
        }
      }
    });
    */

    const reference = `ACE-CON-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Return success
    return NextResponse.json({ ok: true, reference });
  } catch (error: any) {
    console.error('Error processing consultation:', error);
    return NextResponse.json({ ok: false, error: 'Failed to process submission' }, { status: 500 });
  }
}
