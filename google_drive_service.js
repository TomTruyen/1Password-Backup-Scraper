const fs = require('fs');
const { google } = require('googleapis');

class GoogleDriveService {
  constructor(fileIdPath) {
    this.fileIdPath = fileIdPath ?? 'drive_backup_file_id.txt';
    this.driveClient = this.createDriveClient();
  }

  createDriveClient() {
    const auth = new google.auth.GoogleAuth({
      keyFile: __dirname + '/credentials.json',
      scopes: 'https://www.googleapis.com/auth/drive',
    });

    return google.drive({
      version: 'v3',
      auth: auth,
    });
  }

  async deleteFile(fileId) {
    return this.driveClient.files.delete({
      fileId: fileId,
    });
  }

  async saveFile(fileName, filePath, fileMimeType, folderId = null) {
    const backupFileId = await this.getFileIdFromFile();

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

      // Delete old file after succesfully uploading new file
      try {
        if (backupFileId) {
          await this.deleteFile(backupFileId);
        }
      } catch (e) {}
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
