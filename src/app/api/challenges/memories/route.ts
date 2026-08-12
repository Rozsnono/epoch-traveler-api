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
            return NextResponse.json({ memories: [] }, { status: 200 });
        }

        const completedChallenges = await Challenge.find({
            coupleId: user.coupleId,
            status: 'completed',
        }).sort({ completedAt: -1 });

        const memories = await Promise.all(
            completedChallenges.map(async (challenge) => {
                const photos = await Photo.find({ challengeId: challenge._id }).sort({
                    gridIndex: 1,
                });
                return {
                    challenge,
                    photos,
                };
            })
        );

        return NextResponse.json({ memories }, { status: 200 });
    } catch (error) {
        console.error('Fetch Memories Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}