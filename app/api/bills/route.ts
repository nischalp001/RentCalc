import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.propertyId || !body.propertyName || !body.tenantName || !body.baseRent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create bill object
    const bill = {
      id: Date.now(),
      propertyId: body.propertyId,
      propertyName: body.propertyName,
      tenantName: body.tenantName,
      tenantEmail: body.tenantEmail || '',
      currentMonth: body.currentMonth,
      baseRent: body.baseRent,
      confirmedRent: body.confirmedRent || body.baseRent,
      breakdown: {
        baseRent: body.confirmedRent || body.baseRent,
        electricity: body.electricity || { amount: 0, previousUnit: 0, currentUnit: 0, rate: 0 },
        water: body.water || { amount: 0, previousUnit: 0, currentUnit: 0, rate: 0 },
        internet: body.internet || 0,
        ...body.otherCharges || {}
      },
      customFields: body.customFields || [],
      total: body.total || 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Store bill in localStorage (in real app, would be in database)
    // For now, return the bill object
    return NextResponse.json({ 
      success: true, 
      bill,
      message: 'Bill created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json(
      { error: 'Failed to create bill' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // In a real app, fetch from database
    // For now, return empty array
    return NextResponse.json({ bills: [] });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}
