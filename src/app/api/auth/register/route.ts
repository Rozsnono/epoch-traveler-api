import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const body = await req.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        const passwordHash = await hashPassword(password);

        const newUser = await User.create({
            name,
            email: email.toLowerCase(),
            passwordHash,
        });

        const token = generateToken(newUser._id.toString(), newUser.email);

        return NextResponse.json(
            {
                message: 'User registered successfully',
                token,
                user: {
                    id: newUser._id.toString(),
                    name: newUser.name,
                    email: newUser.email,
                    coupleId: newUser.coupleId,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}