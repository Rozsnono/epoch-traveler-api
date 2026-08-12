import { createClient, WebDAVClient } from 'webdav';

const WEBDAV_URL = process.env.WEBDAV_URL;
const WEBDAV_USERNAME = process.env.WEBDAV_USERNAME;
const WEBDAV_PASSWORD = process.env.WEBDAV_PASSWORD;

if (!WEBDAV_URL || !WEBDAV_USERNAME || !WEBDAV_PASSWORD) {
    throw new Error('Please define WEBDAV_URL, WEBDAV_USERNAME, and WEBDAV_PASSWORD in .env.local');
}

const client: WebDAVClient = createClient(WEBDAV_URL, {
    username: WEBDAV_USERNAME,
    password: WEBDAV_PASSWORD,
});

export interface UploadResult {
    webdavPath: string;
    webdavUrl: string;
}

export async function uploadPhotoToWebDAV(
    buffer: Buffer,
    filename: string,
    folderName: string
): Promise<UploadResult> {
    try {
        const targetFolder = `/${folderName}`;
        const targetPath = `${targetFolder}/${filename}`;

        // Ensure the folder for this specific challenge/couple exists
        const folderExists = await client.exists(targetFolder);
        if (!folderExists) {
            await client.createDirectory(targetFolder);
        }

        // Upload the file buffer to Synology WebDAV
        await client.putFileContents(targetPath, buffer, { overwrite: true });

        const fullUrl = `${WEBDAV_URL!.replace(/\/$/, '')}${targetPath}`;

        return {
            webdavPath: targetPath,
            webdavUrl: fullUrl,
        };
    } catch (error) {
        console.error('WebDAV Upload Error:', error);
        throw new Error('Failed to upload image to WebDAV storage');
    }
}

export async function getPhotoBufferFromWebDAV(webdavPath: string): Promise<Buffer> {
    try {
        const fileContent = await client.getFileContents(webdavPath, { format: 'binary' });
        return Buffer.from(fileContent as ArrayBuffer);
    } catch (error) {
        console.error('WebDAV Fetch Error:', error);
        throw new Error('Failed to fetch image from WebDAV storage');
    }
}