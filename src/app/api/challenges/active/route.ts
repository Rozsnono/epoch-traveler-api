import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Challenge from '@/models/Challenge';
import Photo from '@/models/Photo';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const payload = authenticateRequest(req);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const user = await User.findById(payload.userId);
        if (!user || !user.coupleId) {
            return NextResponse.json(
                { challenge: null, photos: [] },
                { status: 200 }
            );
        }

        const challenge = await Challenge.findOne({
            coupleId: user.coupleId,
            status: 'active',
        });

        if (!challenge) {
            return NextResponse.json(
                { challenge: null, photos: [] },
                { status: 200 }
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
        console.error('Fetch Active Challenge Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}