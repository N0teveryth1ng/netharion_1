import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `${session.user.id}_${timestamp}_${randomString}.${file.name.split('.').pop()}`;
    const filepath = path.join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, new Uint8Array(bytes));

    // Update user's avatar in database
    const avatarUrl = `/uploads/avatars/${filename}`;
    await prisma.$queryRaw`
      UPDATE users 
      SET image = ${avatarUrl}, updated_at = NOW()
      WHERE _id = ${session.user.id}
    `;

    return NextResponse.json({ 
      success: true, 
      avatarUrl,
      message: 'Avatar uploaded successfully' 
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current avatar to delete file
    const user = await prisma.$queryRaw`
      SELECT image FROM users WHERE "_id" = ${session.user.id}
    ` as any[];

    if (user.length > 0 && user[0].image) {
      const currentAvatar = user[0].image;
      
      // Check if it's a custom avatar (in uploads directory)
      if (currentAvatar.includes('/uploads/avatars/')) {
        try {
          const filepath = path.join(process.cwd(), 'public', currentAvatar);
          await unlink(filepath);
        } catch (error) {
          console.error('Failed to delete avatar file:', error);
          // Continue even if file deletion fails
        }
      }
    }

    // Reset avatar to null or GitHub avatar
    await prisma.$queryRaw`
      UPDATE users 
      SET image = NULL, updated_at = NOW()
      WHERE _id = ${session.user.id}
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Avatar removed successfully' 
    });
  } catch (error) {
    console.error('Avatar removal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
