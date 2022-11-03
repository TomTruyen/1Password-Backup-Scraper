const Mailjet = require('node-mailjet');

const regenerateRefreshTokenText = 'Your refresh token has expired. Please regenerate it using the following steps: \n\n 1. Go to https://developers.google.com/oauthplayground/ \n 2. Click on Drive API v3 --> https://www.googleapis.com/auth/drive \n 3. Click on Authorize APIs \n 4. Click on Exchange authorization code for tokens \n 5. Copy the refresh token and paste it in the .env file.';
const regenerateRefreshTokenHTML = 'Your refresh token has expired. Please regenerate it using the following steps: <br><br> 1. Go to https://developers.google.com/oauthplayground/ <br> 2. Click on Drive API v3 --> https://www.googleapis.com/auth/drive <br> 3. Click on Authorize APIs <br> 4. Click on Exchange authorization code for tokens <br> 5. Copy the refresh token and paste it in the .env file.';

class MailingService {
  constructor(apiKey, secretKey) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  send(config, error) {
    const mailjet = Mailjet.apiConnect(this.apiKey, this.secretKey);

    let textPart = 'The following error occurred when trying to backup 1Password Private Vault: \n\n' + error.message + '\n\n' + error.stack;
    if (error.message == 'invalid_grant') {
      textPart = regenerateRefreshTokenText;
    }

    let htmlPart = 'The following error occurred when trying to backup 1Password Private Vault: <br><br>' + error.message + '<br><br>' + error.stack;
    if (error.message == 'invalid_grant') {
      htmlPart = regenerateRefreshTokenHTML;
    }

    const request = mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: config.from,
          To: config.to,
          Subject: '1Password Backup Failed',
          TextPart: textPart,
          HTMLPart: htmlPart,
        },
      ],
    });
    request
      .then((result) => {
        console.log(result.body);
      })
      .catch((err) => {
        console.log(err.statusCode);
      });
  }
}

module.exports = MailingService;
