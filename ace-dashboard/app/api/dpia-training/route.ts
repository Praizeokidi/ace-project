import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const fullName = formData.get('full_name') as string;
    const organisationName = formData.get('organisation') as string;
    const jobTitle = formData.get('job_title') as string;
    const email = formData.get('business_email') as string;
    
    // Checkboxes
    const trainingTypes = formData.getAll('training_types[]');
    const audience = formData.getAll('audience[]');
    
    // Dropdowns / Radios
    const estimatedParticipants = formData.get('estimated_participants') as string;
    const deliveryFormat = formData.get('delivery_format') as string;
    const deliveryLocation = formData.get('delivery_location') as string || '';
    const preferredTimeline = formData.get('preferred_timeline') as string;
    
    const customRequirements = formData.get('custom_requirements') as string || '';
    
    const reference = `ACE-TRN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Here you would connect to Prisma as shown in the consultation route
    // await prisma.submission.create({ ... })

    return NextResponse.json({ ok: true, reference });
  } catch (error: any) {
    console.error('Error processing training:', error);
    return NextResponse.json({ ok: false, error: 'Failed to process submission' }, { status: 500 });
  }
}
