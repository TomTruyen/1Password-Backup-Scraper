const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const puppeteer = require('puppeteer-core');
const { launch } = require('puppeteer');
const isPi = require('detect-rpi');
const { getText, getTextByParts, getFavorited, tryOpenSectionByXPath, sleep } = require('./helpers');
const GoogleDriveService = require('./google_drive_service');
const converter = require('json-2-csv');
const MailingService = require('./mailing_service');

dotenv.config();

let browser;

// Export locations
const EXPORT_GOOGLE_DRIVE_FILE_ID_PATH = process.env.EXPORT_GOOGLE_DRIVE_FILE_ID_PATH;
const EXPORT_FILE_PATH = process.env.EXPORT_FILE_PATH;
const EXPORT_FILE_NAME = process.env.EXPORT_FILE_NAME;
const filePath = __dirname + path.join(EXPORT_FILE_PATH ?? '', EXPORT_FILE_NAME);

// Login credentials + URL
const AUTH_EMAIL = process.env.AUTH_EMAIL;
const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const ONE_PASSWORD_URL = process.env.LOGIN_URL;

// SELECTORS (1Password) for puppeteer
const EMAIL_FIELD_SELECTOR = '#email';
const SECRET_KEY_FIELD_SELECTOR = '#account-key';
const PASSWORD_FIELD_SELECTOR = '#master-password';

const PRIVATE_VAULT_X_PATH = '//*[@class="card"]//h2[contains(., "Private")]';
const LOGIN_CATEGORY_X_PATH = '//*[@id="sidebar"]//ul//li//span[contains(., "Logins")]';

const PASSWORD_LIST_ITEMS_SELECTOR = '#item-list > ul > li';
const PASSWORD_ITEM_DETAILS_SELECTOR = '#item-details';
const PASSWORD_ITEM_DETAILS_NAME_SELECTOR = '#item-details > header > h1';
const PASSWORD_ITEM_DETAILS_USERNAME_SELECTOR = '#item-details > table.section-username-password > tbody > tr > td > div.value-container > span';
const PASSWORD_ITEM_DETAILS_PASSWORD_SELECTOR = '#item-details > table.section-username-password > tbody > tr.field.concealed > td > div.value-container > span > span';
const PASSWORD_ITEM_DETAILS_WEBSITE_SELECTOR = '#item-details > table.section-websites > tbody > tr > td > div > a.link.url > span > span';
const PASSWORD_ITEM_DETAILS_TAGS_SELECTOR = '#item-details > table.section-tags > tbody > tr > td.tags > a';
const PASSWORD_ITEM_DETAILS_NOTES_SELECTOR = '#item-details > table.section-notes > tbody > tr > td.notes';
const PASSWORD_ITEM_DETAIL_FAVORITED_SELECTOR = '#item-details > header > div > button.favorite-button.filled';

(async () => {
  // Launch browser
  if (isPi()) {
    browser = await puppeteer.launch({ headless: true, executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  } else {
    browser = await launch({ headless: true, product: 'chrome' });
  }

  // Navigate to 1Password
  const [page] = await browser.pages();
  await page.goto(ONE_PASSWORD_URL);

  // Sign in
  await trySignIn(page);

  // Open private vault
  await tryOpenSectionByXPath(page, PRIVATE_VAULT_X_PATH);

  // Wait for navigatino to complete
  await page.waitForNavigation();

  // Open logins (so we don't export things like cards or other things)
  await tryOpenSectionByXPath(page, LOGIN_CATEGORY_X_PATH);

  // Get items (passwords)
  await tryExportPasswords(page);
})()
  .catch((err) => {
    const mailingService = new MailingService(process.env.MAILJET_API_KEY, process.env.MAILJET_SECRET_KEY);
    mailingService.send(
      {
        from: {
          Email: process.env.MAILJET_FROM_EMAIL,
          Name: process.env.MAILJET_FROM_NAME,
        },
        to: [
          {
            Email: process.env.MAILJET_TO_EMAIL,
            Name: process.env.MAILJET_TO_NAME,
          },
        ],
      },
      err
    );
  })
  .finally(async () => await browser?.close());

async function trySignIn(page) {
  await page.waitForSelector(EMAIL_FIELD_SELECTOR, { visible: true });
  await page.type(EMAIL_FIELD_SELECTOR, AUTH_EMAIL);

  await page.waitForSelector(SECRET_KEY_FIELD_SELECTOR, { visible: true });
  await page.type(SECRET_KEY_FIELD_SELECTOR, AUTH_SECRET_KEY);

  await page.waitForSelector(PASSWORD_FIELD_SELECTOR, { visible: true });
  await page.type(PASSWORD_FIELD_SELECTOR, AUTH_PASSWORD);

  await page.keyboard.press('Enter');

  await page.waitForNavigation();
}

async function tryExportPasswords(page) {
  await page.waitForSelector(PASSWORD_LIST_ITEMS_SELECTOR);
  const items = await page.$$(PASSWORD_LIST_ITEMS_SELECTOR);

  const csvData = [];

  for (const item of items) {
    await item.click();
    await sleep(500);

    csvData.push(await tryReadItemDetails(page));
  }

  await converter.json2csvAsync(csvData, async function (err, csv) {
    if (err) throw Error();

    await tryWriteToFile(csv);
  });

  await tryUploadToDrive();
}

async function tryReadItemDetails(page) {
  await page.waitForSelector(PASSWORD_ITEM_DETAILS_SELECTOR);

  // We use Lastpass their export headers because it is supported by other managers like 1Password to import
  return {
    name: await getText(page, PASSWORD_ITEM_DETAILS_NAME_SELECTOR),
    username: await getText(page, PASSWORD_ITEM_DETAILS_USERNAME_SELECTOR),
    password: await getTextByParts(page, PASSWORD_ITEM_DETAILS_PASSWORD_SELECTOR),
    url: await getText(page, PASSWORD_ITEM_DETAILS_WEBSITE_SELECTOR),
    grouping: await getTextByParts(page, PASSWORD_ITEM_DETAILS_TAGS_SELECTOR),
    extra: await getText(page, PASSWORD_ITEM_DETAILS_NOTES_SELECTOR),
    fav: await getFavorited(page, PASSWORD_ITEM_DETAIL_FAVORITED_SELECTOR),
  };
}

async function tryWriteToFile(csv) {
  fs.writeFile(filePath, csv);

  return filePath;
}

async function tryUploadToDrive() {
  // This is an optional feature so we don't want to fail the script if it fails
  try {
    const googleDriveService = new GoogleDriveService(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI, process.env.REFRESH_TOKEN, EXPORT_GOOGLE_DRIVE_FILE_ID_PATH);
    await googleDriveService.saveFile(EXPORT_FILE_NAME, filePath, 'text/csv');
  } catch (err) {}
}
