import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const addresses = await prisma.address.findMany({
      where: { userId: session.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(addresses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { fullName, phone, province, district, city, address, landmark, isDefault } = body;

    if (!fullName || !phone || !province || !district || !city || !address) {
      return NextResponse.json({ error: 'All required fields must be filled' }, { status: 400 });
    }

    // If setting as default, unset other defaults first
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If first address, make it default automatically
    const existingCount = await prisma.address.count({ where: { userId: session.userId } });

    const newAddress = await prisma.address.create({
      data: {
        userId: session.userId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        province: province.trim(),
        district: district.trim(),
        city: city.trim(),
        address: address.trim(),
        landmark: landmark?.trim() || null,
        isDefault: isDefault || existingCount === 0,
      },
    });

    return NextResponse.json(newAddress);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, fullName, phone, province, district, city, address, landmark, isDefault } = body;

    if (!id) return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

    // If setting as default, unset other defaults
    if (isDefault && !existing.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        ...(fullName && { fullName: fullName.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(province && { province: province.trim() }),
        ...(district && { district: district.trim() }),
        ...(city && { city: city.trim() }),
        ...(address && { address: address.trim() }),
        ...(landmark !== undefined && { landmark: landmark?.trim() || null }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

    await prisma.address.delete({ where: { id } });

    // If deleted address was default, make the most recent one default
    if (existing.isDefault) {
      const nextDefault = await prisma.address.findFirst({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
      });
      if (nextDefault) {
        await prisma.address.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
