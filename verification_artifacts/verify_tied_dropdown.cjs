const path = require('path');
const fs = require('fs');
const assert = require('assert');

let chromium;
try {
  chromium = require('playwright').chromium;
} catch {
  chromium = require(path.resolve(__dirname, '../frontend/node_modules/playwright')).chromium;
}

const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Ensure deterministic test dataset exists in backend/uploads
const UPLOADS_DIR = path.resolve(__dirname, '../backend/uploads');
const TIED_CSV = path.join(UPLOADS_DIR, 'analyzed_tied_test_dataset.csv');
const RAW_TIED_CSV = path.join(UPLOADS_DIR, 'tied_test_dataset.csv');

if (!fs.existsSync(TIED_CSV)) {
  fs.writeFileSync(TIED_CSV, `Product_Name,Category,Predicted_Sentiment,Detected_Issues,Positive_Features,Confidence,Review_Text
Alpha Acoustic Headphones,Electronics,Positive,,Quality; Sound,0.98,Outstanding sound quality and deep bass.
Alpha Acoustic Headphones,Electronics,Positive,,Quality; Battery,0.99,Long battery life and great build.
Beta Precision Keyboard,Electronics,Positive,,Quality; Design,0.97,Crisp mechanical switches and sturdy aluminum frame.
Beta Precision Keyboard,Electronics,Positive,,Quality; Design,0.99,Ergonomic design and beautiful RGB lighting.
Gamma Smart Watch,Electronics,Positive,,Battery; Quality,0.96,Battery lasts a whole week and display is vibrant.
Gamma Smart Watch,Electronics,Positive,,Battery; Design,0.98,Sleek design and accurate step tracking.
Delta Budget Charger,Electronics,Negative,Delivery; Quality,,0.92,Stopped working after two days and delivery was delayed.
Delta Budget Charger,Electronics,Negative,Pricing; Quality,,0.95,Feels cheap and definitely overpriced.
`, 'utf-8');
}
if (!fs.existsSync(RAW_TIED_CSV)) {
  fs.writeFileSync(RAW_TIED_CSV, `product_title,category,review_text
Alpha Acoustic Headphones,Electronics,Outstanding sound quality and deep bass.
Alpha Acoustic Headphones,Electronics,Long battery life and great build.
Beta Precision Keyboard,Electronics,Crisp mechanical switches and sturdy aluminum frame.
Beta Precision Keyboard,Electronics,Ergonomic design and beautiful RGB lighting.
Gamma Smart Watch,Electronics,Battery lasts a whole week and display is vibrant.
Gamma Smart Watch,Electronics,Sleek design and accurate step tracking.
Delta Budget Charger,Electronics,Stopped working after two days and delivery was delayed.
Delta Budget Charger,Electronics,Feels cheap and definitely overpriced.
`, 'utf-8');
}

async function testTiedDropdown() {
  console.log('--- Testing Tied Products in Real Browser ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/performance', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('.perf-dataset-select', { timeout: 15000 });

    // Select tied_test_dataset.csv from dataset dropdown
    console.log('Selecting tied_test_dataset.csv...');
    const datasetSelect = page.locator('.perf-dataset-select');
    await datasetSelect.selectOption('tied_test_dataset.csv');
    await page.waitForTimeout(1000);

    // Verify 3 tied products badge
    const tiePill = page.locator('.perf-tie-pill');
    await tiePill.waitFor({ state: 'visible', timeout: 10000 });
    const pillText = (await tiePill.textContent()).trim();
    console.log('Tied badge text:', pillText);
    assert.strictEqual(pillText, '3 tied', 'Should display 3 tied badge');

    // Verify dropdown has 3 options
    const dropdown = page.locator('.perf-kpi-dropdown');
    await dropdown.waitFor({ state: 'visible', timeout: 5000 });
    const options = await dropdown.locator('option').allTextContents();
    console.log('Dropdown options:', options);
    assert.strictEqual(options.length, 3, 'Dropdown must have exactly 3 tied options');
    assert.ok(options.some(o => o.includes('Alpha Acoustic Headphones')));
    assert.ok(options.some(o => o.includes('Beta Precision Keyboard')));
    assert.ok(options.some(o => o.includes('Gamma Smart Watch')));

    // Select option 1 (Beta Precision Keyboard)
    console.log('Selecting option 1 in dropdown...');
    await dropdown.selectOption({ index: 1 });
    await page.waitForTimeout(300);

    // Verify selected value
    const selectedVal = await dropdown.inputValue();
    assert.strictEqual(selectedVal, '1', 'Dropdown selected index should be 1');

    // Verify desktop screenshot with tied dropdown
    const desktopTiedPath = path.join(SCREENSHOT_DIR, 'desktop_tied_dropdown_open.png');
    await page.screenshot({ path: desktopTiedPath });
    console.log(`Saved screenshot: ${desktopTiedPath}`);

    // Test mobile layout with tied dropdown
    console.log('Testing mobile layout (390x844) with tied dropdown...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);

    const mobileOverflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      return {
        docScrollWidth: doc.scrollWidth,
        bodyScrollWidth: body.scrollWidth,
        windowInnerWidth: window.innerWidth,
        hasHorizontalScroll: doc.scrollWidth > window.innerWidth || body.scrollWidth > window.innerWidth
      };
    });
    console.log('Mobile overflow metrics:', mobileOverflow);
    assert.strictEqual(mobileOverflow.hasHorizontalScroll, false, 'No horizontal scroll on mobile with tied dropdown');

    const mobileTiedPath = path.join(SCREENSHOT_DIR, 'mobile_tied_dropdown_open.png');
    await page.screenshot({ path: mobileTiedPath });
    console.log(`Saved screenshot: ${mobileTiedPath}`);

    console.log('=== TIED PRODUCTS DROPDOWN VERIFICATION PASSED ===');

  } catch (err) {
    console.error('Tied dropdown test failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

testTiedDropdown();
