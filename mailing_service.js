const Mailjet = require('node-mailjet');

class MailingService {
  constructor(apiKey, secretKey) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  send(config, error) {
    const mailjet = Mailjet.apiConnect(this.apiKey, this.secretKey);

    const request = mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: config.from,
          To: config.to,
          Subject: '1Password Backup Failed',
          TextPart: 'The following error occurred when trying to backup 1Password Private Vault: \n\n' + error.message + '\n\n' + error.stack,
          HTMLPart: 'The following error occurred when trying to backup 1Password Private Vault: <br /><br />' + error.message + '<br /><br /><code>' + error.stack + '</code>',
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
