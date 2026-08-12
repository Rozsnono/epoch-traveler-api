import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPhoto extends Document {
    challengeId: mongoose.Types.ObjectId;
    uploadedBy: mongoose.Types.ObjectId;
    webdavPath: string;
    webdavUrl: string;
    colorMatchPercentage: number;
    gridIndex: number;
    createdAt: Date;
    updatedAt: Date;
}

const PhotoSchema: Schema<IPhoto> = new Schema(
    {
        challengeId: {
            type: Schema.Types.ObjectId,
            ref: 'Challenge',
            required: true,
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        webdavPath: {
            type: String,
            required: true,
        },
        webdavUrl: {
            type: String,
            required: true,
        },
        colorMatchPercentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        gridIndex: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Photo: Model<IPhoto> = mongoose.models.Photo || mongoose.model<IPhoto>('Photo', PhotoSchema);

export default Photo;