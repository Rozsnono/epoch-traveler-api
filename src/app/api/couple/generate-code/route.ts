import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Couple from '@/models/Couple';
import { authenticateRequest } from '@/lib/auth';

function generateRandomCode(length: number = 6): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST(req: NextRequest) {
    try {
        const payload = authenticateRequest(req);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const user = await User.findById(payload.userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.coupleId) {
            const existingCouple = await Couple.findById(user.coupleId);
            if (existingCouple && existingCouple.status === 'paired') {
                return NextResponse.json(
                    { error: 'You are already paired with a partner' },
                    { status: 400 }
                );
            }
            if (existingCouple && existingCouple.status === 'pending') {
                return NextResponse.json(
                    {
                        inviteCode: existingCouple.inviteCode,
                        status: existingCouple.status,
                        message: 'Active pairing code already exists',
                    },
                    { status: 200 }
                );
            }
        }

        let inviteCode = generateRandomCode(6);
        let codeExists = await Couple.findOne({ inviteCode });
        while (codeExists) {
            inviteCode = generateRandomCode(6);
            codeExists = await Couple.findOne({ inviteCode });
        }

        console.log(inviteCode)

        const newCouple = await Couple.create({
            partner1: user._id,
            inviteCode,
            status: 'pending',
        });

        user.coupleId = newCouple._id as any;
        await user.save();

        return NextResponse.json(
            {
                inviteCode: newCouple.inviteCode,
                status: newCouple.status,
                coupleId: newCouple._id.toString(),
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Generate Code Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}