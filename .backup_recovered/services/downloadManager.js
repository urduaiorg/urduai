import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// The local directory path for storing guides
const GUIDES_DIR = FileSystem.documentDirectory + 'guides/';

/**
 * Ensures the target 'guides' directory exists on the device before reading/writing.
 */
export async function ensureDirExists() {
    const dirInfo = await FileSystem.getInfoAsync(GUIDES_DIR);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(GUIDES_DIR, { intermediates: true });
    }
}

/**
 * Downloads a guide from Google Drive to the local FileSystem directory.
 * @param {string} driveFileId - The Google Drive file ID.
 * @param {string} guideId - The unique ID of the guide from data structure.
 * @param {function} onProgress - Optional callback function to track downloading bytes.
 * @returns {object} The downloaded fileURI payload.
 */
export async function downloadGuide(driveFileId, guideId, onProgress = null) {
    await ensureDirExists();

    // Convert Drive File ID to direct download export link
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`;
    const fileUri = GUIDES_DIR + `${guideId}.pdf`;

    try {
        if (onProgress) {
            const downloadResumable = FileSystem.createDownloadResumable(
                downloadUrl,
                fileUri,
                {},
                (downloadProgress) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    onProgress(progress >= 0 ? progress : 0); // Guard against indeterminate -1 
                }
            );
            const { uri } = await downloadResumable.downloadAsync();
            return { success: true, uri };
        } else {
            const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri);
            return { success: true, uri };
        }
    } catch (e) {
        return { success: false, error: e };
    }
}

/**
 * Check if the PDF file already exists in local storage.
 * @param {string} guideId 
 */
export async function isGuideDownloaded(guideId) {
    const fileUri = GUIDES_DIR + `${guideId}.pdf`;
    const info = await FileSystem.getInfoAsync(fileUri);
    return info.exists;
}

/**
 * Request to natively open/share the PDF file via the OS PDF reader.
 * @param {string} guideId 
 */
export async function openGuide(guideId) {
    const fileUri = GUIDES_DIR + `${guideId}.pdf`;
    const info = await FileSystem.getInfoAsync(fileUri);

    if (info.exists) {
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Read AI Guide'
            });
            return true;
        } else {
            return false;
        }
    }
    return false;
}

/**
 * Delete a specific guide file.
 * @param {string} guideId 
 */
export async function deleteGuide(guideId) {
    const fileUri = GUIDES_DIR + `${guideId}.pdf`;
    try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Hard delete the entire directory and reset.
 */
export async function deleteAllGuides() {
    try {
        await FileSystem.deleteAsync(GUIDES_DIR, { idempotent: true });
        await ensureDirExists();
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Returns the storage size occupied by all downloaded guides.
 * @returns {number} Size in megabytes (MB)
 */
export async function getDownloadedSize() {
    try {
        await ensureDirExists();
        const files = await FileSystem.readDirectoryAsync(GUIDES_DIR);

        let totalSize = 0;
        for (const file of files) {
            const fileUri = GUIDES_DIR + file;
            const info = await FileSystem.getInfoAsync(fileUri);
            if (info.exists && !info.isDirectory) {
                totalSize += info.size;
            }
        }

        // Convert Bytes to MegaBytes (MB) returning 1 decimal precision
        return (totalSize / (1024 * 1024)).toFixed(1);
    } catch (e) {
        return 0;
    }
}
