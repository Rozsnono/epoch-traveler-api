import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Couple from '@/models/Couple';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const payload = authenticateRequest(req);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const user = await User.findById(payload.userId).select('-passwordHash');
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let coupleData = null;
        if (user.coupleId) {
            coupleData = await Couple.findById(user.coupleId)
                .populate('partner1', 'name email')
                .populate('partner2', 'name email');
        }

        return NextResponse.json(
            {
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    coupleId: user.coupleId ? user.coupleId.toString() : null,
                },
                couple: coupleData,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Fetch Profile Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}