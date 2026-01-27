import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract basic fields
    const propertyName = formData.get('propertyName') as string;
    const propertyType = formData.get('propertyType') as string;
    const currency = formData.get('currency') as string;
    const price = formData.get('price') as string;
    const interval = formData.get('interval') as string;
    const rooms = formData.get('rooms') as string;
    const bathrooms = formData.get('bathrooms') as string;
    const kitchens = formData.get('kitchens') as string;
    const dinings = formData.get('dinings') as string;
    const livings = formData.get('livings') as string;
    const bikeParking = formData.get('bikeParking') as string;
    const carParking = formData.get('carParking') as string;
    const services = formData.getAll('services') as string[];
    const description = formData.get('description') as string;

    // Extract images
    const images: { file: File; label: string }[] = [];
    const imageKeys = Array.from(formData.keys()).filter(key => key.startsWith('image-'));
    const labelKeys = Array.from(formData.keys()).filter(key => key.startsWith('label-'));

    // Assuming images are uploaded as image-0, image-1, etc.
    for (let i = 0; ; i++) {
      const fileKey = `image-${i}`;
      const labelKey = `label-${i}`;
      const file = formData.get(fileKey) as File;
      const label = formData.get(labelKey) as string;

      if (!file) break; // No more images

      images.push({ file, label });
    }

    // Here you would typically send this data to your backend
    // For now, we'll just log it and return success
    console.log('Property Data:', {
      propertyName,
      propertyType,
      currency,
      price: parseFloat(price),
      interval,
      rooms: parseInt(rooms),
      bathrooms: parseInt(bathrooms),
      kitchens: parseInt(kitchens),
      dinings: parseInt(dinings),
      livings: parseInt(livings),
      bikeParking,
      carParking,
      services,
      description,
      imagesCount: images.length,
    });

    // In a real app, you might upload images to cloud storage and save URLs
    // Then send the complete data to your backend API

    return NextResponse.json({ success: true, message: 'Property added successfully' });
  } catch (error) {
    console.error('Error processing property form:', error);
    return NextResponse.json({ success: false, message: 'Failed to add property' }, { status: 500 });
  }
}