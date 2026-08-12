import mongoose, { Schema, Document, Model } from 'mongoose';

export type AssignedColor = 'Red' | 'Orange' | 'Yellow' | 'Blue' | 'Purple' | 'Green' | 'White' | 'Black';

export interface IChallenge extends Document {
    coupleId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    locationName: string;
    latitude?: number;
    longitude?: number;
    targetPhotoCount: number;
    assignedColor: AssignedColor;
    status: 'active' | 'completed';
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ChallengeSchema: Schema<IChallenge> = new Schema(
    {
        coupleId: {
            type: Schema.Types.ObjectId,
            ref: 'Couple',
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        locationName: {
            type: String,
            required: [true, 'Location name is required'],
            trim: true,
        },
        latitude: {
            type: Number,
            default: null,
        },
        longitude: {
            type: Number,
            default: null,
        },
        targetPhotoCount: {
            type: Number,
            required: true,
            min: 1,
        },
        assignedColor: {
            type: String,
            enum: ['Red', 'Orange', 'Yellow', 'Blue', 'Purple', 'Green', 'White', 'Black'],
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'completed'],
            default: 'active',
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Challenge: Model<IChallenge> = mongoose.models.Challenge || mongoose.model<IChallenge>('Challenge', ChallengeSchema);

export default Challenge;