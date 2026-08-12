import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Challenge from '@/models/Challenge';
import Photo from '@/models/Photo';
import { uploadPhotoToWebDAV } from '@/lib/webdav';
import { authenticateRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const payload = authenticateRequest(req);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const challengeId = formData.get('challengeId') as string | null;
        const rawColorMatch = formData.get('colorMatchPercentage') as string | null;
        const rawGridIndex = formData.get('gridIndex') as string | null;

        if (!file || !challengeId || rawColorMatch === null || rawGridIndex === null) {
            return NextResponse.json(
                { error: 'Missing required fields: file, challengeId, colorMatchPercentage, gridIndex' },
                { status: 400 }
            );
        }

        const user = await User.findById(payload.userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
        }

        if (challenge.status !== 'active') {
            return NextResponse.json(
                { error: 'Cannot upload photos to a completed or inactive challenge' },
                { status: 400 }
            );
        }

        const gridIndex = parseInt(rawGridIndex, 10);
        const colorMatchPercentage = parseFloat(rawColorMatch);

        // Read the file as an ArrayBuffer and convert to Node Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create unique filename for storage
        const timestamp = Date.now();
        const filename = `photo_grid${gridIndex}_${timestamp}.jpg`;
        const folderName = `challenge_${challenge._id.toString()}`;

        // Upload image to Synology NAS WebDAV server
        const webdavResult = await uploadPhotoToWebDAV(buffer, filename, folderName);

        // Create Photo document in Database
        const newPhoto = await Photo.create({
            challengeId: challenge._id,
            uploadedBy: user._id,
            webdavPath: webdavResult.webdavPath,
            webdavUrl: webdavResult.webdavUrl,
            colorMatchPercentage,
            gridIndex,
        });

        // Check if challenge total photo target is met
        const currentPhotoCount = await Photo.countDocuments({ challengeId: challenge._id });
        let isCompleted = false;

        if (currentPhotoCount >= challenge.targetPhotoCount) {
            challenge.status = 'completed';
            challenge.completedAt = new Date();
            await challenge.save();
            isCompleted = true;
        }

        return NextResponse.json(
            {
                message: 'Photo uploaded successfully',
                photo: newPhoto,
                isCompleted,
                totalUploaded: currentPhotoCount,
                targetPhotoCount: challenge.targetPhotoCount,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Photo Upload Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}