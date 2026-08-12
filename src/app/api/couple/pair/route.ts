import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Couple from '@/models/Couple';
import { authenticateRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const payload = authenticateRequest(req);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const body = await req.json();
        const { inviteCode } = body;

        if (!inviteCode) {
            return NextResponse.json(
                { error: 'Invite code is required' },
                { status: 400 }
            );
        }

        const currentUser = await User.findById(payload.userId);
        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const couple = await Couple.findOne({
            inviteCode: inviteCode.trim().toUpperCase(),
            status: 'pending',
        });

        if (!couple) {
            return NextResponse.json(
                { error: 'Invalid or expired invite code' },
                { status: 404 }
            );
        }

        if (couple.partner1.toString() === currentUser._id.toString()) {
            return NextResponse.json(
                { error: 'You cannot pair with your own invite code' },
                { status: 400 }
            );
        }

        couple.partner2 = currentUser._id as any;
        couple.status = 'paired';
        await couple.save();

        currentUser.coupleId = couple._id as any;
        await currentUser.save();

        const updatedCouple = await Couple.findById(couple._id)
            .populate('partner1', 'name email')
            .populate('partner2', 'name email');

        return NextResponse.json(
            {
                message: 'Successfully paired with partner!',
                couple: updatedCouple,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Pairing Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}