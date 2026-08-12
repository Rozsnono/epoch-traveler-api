import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICouple extends Document {
    partner1: mongoose.Types.ObjectId;
    partner2?: mongoose.Types.ObjectId;
    inviteCode: string;
    status: 'pending' | 'paired';
    createdAt: Date;
    updatedAt: Date;
}

const CoupleSchema: Schema<ICouple> = new Schema(
    {
        partner1: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        partner2: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        inviteCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'paired'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

// Clear model cache in dev environment to allow hot-reloading
if (mongoose.models.Couple) {
    delete mongoose.models.Couple;
}

const Couple: Model<ICouple> = mongoose.model<ICouple>('Couple', CoupleSchema);

// Synchronize indexes to automatically drop obsolete ones (like pairingCode_1)
if (process.env.NODE_ENV !== 'production') {
    Couple.syncIndexes().catch((err) => {
        console.log('Syncing Couple indexes:', err.message);
    });
}

export default Couple;