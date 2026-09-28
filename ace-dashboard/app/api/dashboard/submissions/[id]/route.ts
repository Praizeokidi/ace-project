import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const submission = await prisma.submission.findUnique({
      where: { id },
      // include any potential relations if necessary
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error: any) {
    console.error('Failed to fetch submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    const { status, reason } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        status,
        ...(reason !== undefined && { 
          payload: {
            update: {
              reason
            }
          } 
        }), // Store reason in payload if applicable, or in a reason field if it exists
      },
    });

    return NextResponse.json(updatedSubmission);
  } catch (error: any) {
    console.error('Failed to update submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
