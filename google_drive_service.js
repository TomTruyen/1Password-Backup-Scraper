const fs = require('fs');
const { google } = require('googleapis');

class GoogleDriveService {
  constructor(clientId, clientSecret, redirectUri, refreshToken, fileIdPath) {
    this.fileIdPath = fileIdPath ?? 'drive_backup_file_id.txt';
    this.driveClient = this.createDriveClient(clientId, clientSecret, redirectUri, refreshToken);
  }

  createDriveClient(clientId, clientSecret, redirectUri, refreshToken) {
    const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    client.setCredentials({ refresh_token: refreshToken });

    return google.drive({
      version: 'v3',
      auth: client,
    });
  }

  async deleteFile(fileId) {
    return this.driveClient.files.delete({
      fileId: fileId,
    });
  }

  async saveFile(fileName, filePath, fileMimeType, folderId = null) {
    // Delete old file first
    try {
      const backupFileId = await this.getFileIdFromFile();

      if (backupFileId) {
        await this.deleteFile(backupFileId);
      }
    } catch (e) {}

    // Create new file
    const res = await this.driveClient.files.create({
      requestBody: {
        name: fileName,
        mimeType: fileMimeType,
        parents: folderId ? [folderId] : [],
      },
      media: {
        mimeType: fileMimeType,
        body: fs.createReadStream(filePath),
      },
    });

    if (res.status === 200) {
      const fileId = res.data.id;
      await this.saveFileIdToFile(fileId);
    }
  }

  async getFileIdFromFile() {
    if (!fs.existsSync(this.fileIdPath)) {
      return null;
    }

    const buffer = fs.readFileSync(this.fileIdPath);

    return buffer.toString();
  }

  async saveFileIdToFile(fileId) {
    fs.writeFileSync(this.fileIdPath, fileId);
  }
}

module.exports = GoogleDriveService;
