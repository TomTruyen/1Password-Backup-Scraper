const getTextByParts = async function (page, selector, delimiter = null) {
  const parts = await page.$$(selector);

  let text = '';

  if (parts) {
    for (let i = 0; i < parts.length; i++) {
      const partSelector = `${selector}:nth-child(${i + 1})`;

      text += await getText(page, partSelector);

      if (i != parts.length - 1 && delimiter) {
        text += delimiter;
      }
    }
  }

  return text;
};

const getText = async function (page, selector) {
  let text = '';

  if ((await page.$(selector)) != null) {
    const element = await page.$(selector);
    text = (await element.getProperty('textContent')).jsonValue();
  }

  return text;
};

const getFavorited = async function (page, selector) {
  if ((await page.$(selector)) != null) {
    return 1;
  }

  return 0;
};

const tryOpenSectionByXPath = async function (page, XPath) {
  await page.waitForXPath(XPath);
  const [section] = await page.$x(XPath);
  await section.click();
};

const sleep = function (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
};

module.exports = {
  getTextByParts: getTextByParts,
  getText: getText,
  getFavorited: getFavorited,
  tryOpenSectionByXPath: tryOpenSectionByXPath,
  sleep: sleep,
};
