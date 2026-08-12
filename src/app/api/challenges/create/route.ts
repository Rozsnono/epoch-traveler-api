import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Couple from '@/models/Couple';
import Challenge, { AssignedColor } from '@/models/Challenge';
import { authenticateRequest } from '@/lib/auth';

const ASSIGNED_COLORS: AssignedColor[] = [
    'Red',
    'Orange',
    'Yellow',
    'Blue',
    'Purple',
    'Green',
    'White',
    'Black',
];

export async function POST(req: NextRequest) {
    try {
        const payload = authenticateRequest(req);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const user = await User.findById(payload.userId);
        if (!user || !user.coupleId) {
            return NextResponse.json(
                { error: 'You must be paired with a partner to start a challenge' },
                { status: 400 }
            );
        }

        const couple = await Couple.findById(user.coupleId);
        if (!couple || couple.status !== 'paired') {
            return NextResponse.json(
                { error: 'Couple profile is not active or paired' },
                { status: 400 }
            );
        }

        // Check if an active challenge already exists for this couple
        const activeChallenge = await Challenge.findOne({
            coupleId: couple._id,
            status: 'active',
        });

        if (activeChallenge) {
            return NextResponse.json(
                {
                    error: 'An active challenge is already in progress',
                    activeChallenge,
                },
                { status: 400 }
            );
        }

        const body = await req.json();
        const { locationName, latitude, longitude, targetPhotoCount } = body;

        if (!locationName) {
            return NextResponse.json(
                { error: 'Location name is required' },
                { status: 400 }
            );
        }

        const parsedCount = parseInt(targetPhotoCount, 10);
        if (isNaN(parsedCount) || parsedCount < 1) {
            return NextResponse.json(
                { error: 'Target photo count must be a number greater than 0' },
                { status: 400 }
            );
        }

        // Randomly select 1 of the 8 assigned colors
        const randomIndex = Math.floor(Math.random() * ASSIGNED_COLORS.length);
        const assignedColor = ASSIGNED_COLORS[randomIndex];

        const newChallenge = await Challenge.create({
            coupleId: couple._id,
            createdBy: user._id,
            locationName,
            latitude: latitude ? parseFloat(latitude.toString()) : undefined,
            longitude: longitude ? parseFloat(longitude.toString()) : undefined,
            targetPhotoCount: parsedCount,
            assignedColor,
            status: 'active',
        });

        return NextResponse.json(
            {
                message: 'Challenge created successfully',
                challenge: newChallenge,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create Challenge Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}