A simple NodeJS application which will login to your 1Password account and export all passwords in a CSV format (NOTE: It uses Puppeteer to webscrape, because 1Password does not have an export feature on web)

The CSV format is the same as the export format of Lastpass, which means that it can be used to import your passwors to 1Password, Lastpass, Google Passwords and most other password managers

For people with full access to 1Password it is advised to use the 1Password CLI for a feature like this, but if you are not the owner of your 1Password organization this application will backup your Private vault passwords aswell :) 

# .env

## 1Password

``AUTH_EMAIL``=<1Password email>

``AUTH_SECRET_KEY``=<1Password secret key (1Password Emergency Kit)>

``AUTH_PASSWORD``=<1Password password>

``LOGIN_URL``=<1Password login url (1Password Emergency Kit)>

## Export File

``EXPORT_FILE_PATH``=

``EXPORT_FILE_NAME``=1password_exports.csv

``EXPORT_GOOGLE_DRIVE_FILE_ID_PATH``=google_drive_exported_file_id

## Google Drive

This works using a Service Accounts which creates the backup in a shared folder that can be accessed from your Google Drive

1. Create a Service Account
2. Click on the created Service Account and go to "Keys"
3. Add key --> Create new key --> JSON
4. Save the downloaded file as `credentials.json` in the root of this project
5. Create a folder on your Google Drive and share it with the e-mail of your created Service Account
6. Get the Folder ID of the created folder
7. In `.env` set the `DRIVE_FOLDER_ID` value to the folderId

## [Mailjet](mailjet.com)

``MAILJET_API_KEY``=

``MAILJET_SECRET_KEY``=

``MAILJET_FROM_EMAIL``=

``MAILJET_FROM_NAME``=

``MAILJET_TO_EMAIL``=

``MAILJET_TO_NAME``=

# usage

`npm install && node index.js`
