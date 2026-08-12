import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Challenge from '@/models/Challenge';
import Photo from '@/models/Photo';
import { authenticateRequest } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const payload = authenticateRequest(req);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const challengeId = (await params).id;
        const challenge = await Challenge.findById(challengeId);

        if (!challenge) {
            return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
        }

        const user = await User.findById(payload.userId);
        if (!user || challenge.coupleId.toString() !== user.coupleId?.toString()) {
            return NextResponse.json(
                { error: 'Forbidden: You do not have access to this challenge' },
                { status: 403 }
            );
        }

        const photos = await Photo.find({ challengeId: challenge._id }).sort({
            gridIndex: 1,
        });

        return NextResponse.json(
            {
                challenge,
                photos,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Fetch Challenge Detail Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}