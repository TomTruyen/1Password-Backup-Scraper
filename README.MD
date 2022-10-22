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

## Google Drive ([Cloud Platform setup](https://developers.google.com/drive/api/quickstart/nodejs#set_up_your_environment))

``CLIENT_ID``=

``CLIENT_SECRET``=

``REFRESH_TOKEN``=(can be obtained using the redirect_uri below)

``REDIRECT_URI``=https://developers.google.com/oauthplayground

## [Mailjet](mailjet.com)

``MAILJET_API_KEY``=

``MAILJET_SECRET_KEY``=

``MAILJET_FROM_EMAIL``=

``MAILJET_FROM_NAME``=

``MAILJET_TO_EMAIL``=

``MAILJET_TO_NAME``=

# usage

`npm install && node index.js`
