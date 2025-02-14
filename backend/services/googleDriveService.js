// services/googleDriveService.js
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

class GoogleDriveService {
  constructor() {
    // Initialize with your Google Drive API credentials
    this.auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '../config/google-drive-key.json'),
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    this.driveService = google.drive({ version: 'v3', auth: this.auth });
  }

  async uploadFile(filePath, fileName) {
    try {
      // Create file metadata
      const fileMetadata = {
        name: fileName,
        parents: ['YOUR_GOOGLE_DRIVE_FOLDER_ID'] // Replace with your folder ID
      };

      // Create media object
      const media = {
        mimeType: 'image/*',
        body: fs.createReadStream(filePath)
      };

      // Upload file to Google Drive
      const response = await this.driveService.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink'
      });

      return {
        fileId: response.data.id,
        webViewLink: response.data.webViewLink
      };
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      await this.driveService.files.delete({
        fileId: fileId
      });
      return true;
    } catch (error) {
      console.error('Error deleting from Google Drive:', error);
      throw error;
    }
  }
}

module.exports = new GoogleDriveService();