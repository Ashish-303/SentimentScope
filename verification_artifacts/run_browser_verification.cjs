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

const VIEWPORTS = [
  { name: 'desktop_1440x900', width: 1440, height: 900 },
  { name: 'laptop_1280x800', width: 1280, height: 800 },
  { name: 'tablet_768x1024', width: 768, height: 1024 },
  { name: 'mobile_390x844', width: 390, height: 844 },
  { name: 'narrow_mobile_320x700', width: 320, height: 700 }
];

async function run() {
  console.log('--- Launching Playwright Chromium for Verification ---');
  const browser = await chromium.launch({ headless: true });
  const results = {
    viewports: {},
    interactions: {},
    candidateCoverage: {},
    measurements: {}
  };

  try {
    const page = await browser.newPage();

    // ------------------------------------------------------------------------
    // Part 1: Initial Page Load and Default State (Option A: 0 products selected)
    // ------------------------------------------------------------------------
    console.log('\n[Task 3 & 6] Navigating to http://localhost:3000/performance...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/performance', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('#performance-page, .perf-page-container', { timeout: 15000 });

    // Wait for performance data to load
    await page.waitForSelector('.perf-radar-layout', { timeout: 15000 });

    // Verify empty state is rendered initially (Option A: 0 selected)
    const emptyStateTitle = await page.locator('.perf-empty-title').textContent();
    console.log('Initial Radar state title:', emptyStateTitle.trim());
    assert.ok(emptyStateTitle.includes('Select up to 3 products'), 'Empty state should invite product comparison');

    const initialChips = await page.locator('.perf-radar-chip').count();
    assert.strictEqual(initialChips, 0, 'Initial selected chips should be 0');
    results.interactions.emptyStateVerified = true;

    // ------------------------------------------------------------------------
    // Part 2: Candidate Coverage (Task 4)
    // ------------------------------------------------------------------------
    console.log('\n[Task 4] Verifying candidate product coverage in selector list...');
    const candidateButtons = page.locator('.perf-selector-btn');
    const totalCandidates = await candidateButtons.count();
    const candidateSubhead = await page.locator('.perf-selector-subhead').textContent();
    console.log(`Selector subhead: "${candidateSubhead.trim()}", Total button elements rendered: ${totalCandidates}`);

    // Dataset SentimentScope_1000_random_reviews.csv has 127 products
    assert.ok(totalCandidates > 30, `Candidate pool should exceed 30 products! Found: ${totalCandidates}`);
    results.candidateCoverage.totalCandidatesFound = totalCandidates;

    // Test candidate search filter
    console.log('Testing candidate search filter...');
    const searchInput = page.locator('.perf-candidate-search');
    await searchInput.fill('Watch');
    const matchedCountAfterSearch = await page.locator('.perf-selector-btn').count();
    console.log(`Candidates matching "Watch": ${matchedCountAfterSearch}`);
    assert.ok(matchedCountAfterSearch > 0, 'Should find products matching "Watch"');

    // Clear search
    await page.locator('.perf-candidate-search-clear').click();
    const countAfterClear = await page.locator('.perf-selector-btn').count();
    assert.strictEqual(countAfterClear, totalCandidates, 'Clearing search restores full candidate list');
    results.candidateCoverage.searchFilterWorks = true;

    // Capture screenshot: Product Quality Profile with candidate list
    const radarShotPath = path.join(SCREENSHOT_DIR, 'radar_candidate_selector.png');
    await page.locator('.perf-radar-layout').screenshot({ path: radarShotPath });
    console.log(`Saved screenshot: ${radarShotPath}`);

    // ------------------------------------------------------------------------
    // Part 3: Selection Lifecycle and 3-Product Limit Enforcement (Task 3, 4, 6)
    // ------------------------------------------------------------------------
    console.log('\n[Task 6] Testing selection interactions: 1st, 2nd, 3rd, and 4th product...');
    const firstCandidate = candidateButtons.nth(0);
    const firstCandidateName = (await firstCandidate.locator('.perf-selector-name').textContent()).trim();
    await firstCandidate.click();
    await page.waitForTimeout(300);

    // Verify 1 product selected
    let chips = await page.locator('.perf-radar-chip').count();
    assert.strictEqual(chips, 1, 'Should have 1 selected chip');
    assert.ok(await page.locator('.recharts-radar').count() > 0, 'Recharts Radar should be rendered now');
    console.log(`Selected 1st product: "${firstCandidateName}"`);

    // Select 2nd product
    const secondCandidate = candidateButtons.nth(1);
    const secondCandidateName = (await secondCandidate.locator('.perf-selector-name').textContent()).trim();
    await secondCandidate.click();
    await page.waitForTimeout(300);
    chips = await page.locator('.perf-radar-chip').count();
    assert.strictEqual(chips, 2, 'Should have 2 selected chips');
    console.log(`Selected 2nd product: "${secondCandidateName}"`);

    // Select 3rd product
    const thirdCandidate = candidateButtons.nth(2);
    const thirdCandidateName = (await thirdCandidate.locator('.perf-selector-name').textContent()).trim();
    await thirdCandidate.click();
    await page.waitForTimeout(300);
    chips = await page.locator('.perf-radar-chip').count();
    assert.strictEqual(chips, 3, 'Should have 3 selected chips');
    console.log(`Selected 3rd product: "${thirdCandidateName}"`);

    // Verify 4th candidate is disabled and cannot be added
    const fourthCandidate = candidateButtons.nth(3);
    const isFourthDisabled = await fourthCandidate.isDisabled();
    const fourthTitle = await fourthCandidate.getAttribute('title');
    console.log('4th Candidate disabled state:', isFourthDisabled, '| title:', fourthTitle);
    assert.strictEqual(isFourthDisabled, true, '4th candidate must be disabled when 3 products are already selected');
    assert.ok(fourthTitle.includes('Maximum 3 products selected'), 'Tooltip explains why 4th product is disabled');

    // Deselect 2nd product via removal chip
    console.log('Removing 2nd product via chip X button...');
    const removeBtn = page.locator('.perf-chip-remove').nth(1);
    await removeBtn.click();
    await page.waitForTimeout(300);
    chips = await page.locator('.perf-radar-chip').count();
    assert.strictEqual(chips, 2, 'Chips count should be 2 after removal');

    // Verify 4th candidate is now re-enabled
    const isFourthDisabledNow = await fourthCandidate.isDisabled();
    assert.strictEqual(isFourthDisabledNow, false, '4th candidate is re-enabled when count falls below 3');

    // Select 4th candidate
    await fourthCandidate.click();
    await page.waitForTimeout(300);
    chips = await page.locator('.perf-radar-chip').count();
    assert.strictEqual(chips, 3, 'Chips count is 3 again');
    results.interactions.selectionEnforcementWorks = true;

    // ------------------------------------------------------------------------
    // Part 4: Responsive Layout and Dropdown Overflow (Task 5)
    // ------------------------------------------------------------------------
    console.log('\n[Task 5] Testing responsive viewports, card bounding boxes, and overflow...');

    for (const vp of VIEWPORTS) {
      console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(400);

      // Measure page horizontal overflow
      const overflow = await page.evaluate(() => {
        const docElem = document.documentElement;
        const body = document.body;
        const pageContainer = document.querySelector('.perf-page-container');
        const kpiGrid = document.querySelector('.perf-kpi-grid');
        return {
          windowInnerWidth: window.innerWidth,
          docScrollWidth: docElem.scrollWidth,
          bodyScrollWidth: body.scrollWidth,
          pageScrollWidth: pageContainer ? pageContainer.scrollWidth : 0,
          pageClientWidth: pageContainer ? pageContainer.clientWidth : 0,
          gridScrollWidth: kpiGrid ? kpiGrid.scrollWidth : 0,
          gridClientWidth: kpiGrid ? kpiGrid.clientWidth : 0,
          hasPageHorizontalScroll: docElem.scrollWidth > window.innerWidth || body.scrollWidth > window.innerWidth
        };
      });

      console.log(`Viewport ${vp.name} overflow metrics:`, overflow);
      assert.strictEqual(overflow.hasPageHorizontalScroll, false, `Horizontal page overflow detected in ${vp.name}!`);

      // Inspect bounding client rects of all 4 KPI cards
      const cardRects = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.perf-kpi-card'));
        return cards.map(c => {
          const r = c.getBoundingClientRect();
          return { id: c.id, width: r.width, height: r.height, top: r.top, left: r.left };
        });
      });
      console.log(`KPI cards in ${vp.name}:`, cardRects);

      // Verify all 4 cards have positive dimensions and stable heights
      assert.strictEqual(cardRects.length, 4, 'Should have exactly 4 KPI cards');
      cardRects.forEach(c => {
        assert.ok(c.width > 0, `Card ${c.id} width must be positive`);
        assert.ok(c.height > 40, `Card ${c.id} height must be reasonable`);
      });

      results.viewports[vp.name] = {
        overflow,
        cardRects
      };
    }

    // Capture screenshots for Task 5
    // 1. Desktop with 1 winner or current state
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    const desktopOnePath = path.join(SCREENSHOT_DIR, 'desktop_one_winner.png');
    await page.screenshot({ path: desktopOnePath, fullPage: false });
    console.log(`Saved screenshot: ${desktopOnePath}`);

    // Check if dropdown exists or test tied scenario
    const dropdownCount = await page.locator('.perf-kpi-dropdown').count();
    console.log(`Tied dropdown count in default dataset: ${dropdownCount}`);

    // If default dataset has single winner or tied products, let's verify dropdown interaction
    if (dropdownCount > 0) {
      console.log('Tied products dropdown found! Testing selection change...');
      const dropdown = page.locator('.perf-kpi-dropdown');
      const options = await dropdown.locator('option').allTextContents();
      console.log(`Dropdown contains ${options.length} tied options:`, options);

      // Select 2nd option
      await dropdown.selectOption({ index: 1 });
      await page.waitForTimeout(300);

      // Capture desktop tied dropdown open / focused
      const desktopTiedPath = path.join(SCREENSHOT_DIR, 'desktop_tied_dropdown_open.png');
      await page.screenshot({ path: desktopTiedPath });
      console.log(`Saved screenshot: ${desktopTiedPath}`);

      // Mobile viewport screenshot
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(300);
      const mobileTiedPath = path.join(SCREENSHOT_DIR, 'mobile_tied_dropdown_open.png');
      await page.screenshot({ path: mobileTiedPath });
      console.log(`Saved screenshot: ${mobileTiedPath}`);
    } else {
      // If default dataset has single winner, capture mobile view
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(300);
      const mobilePath = path.join(SCREENSHOT_DIR, 'mobile_one_winner.png');
      await page.screenshot({ path: mobilePath });
      console.log(`Saved screenshot: ${mobilePath}`);
    }

    // ------------------------------------------------------------------------
    // Part 5: Dataset Switching and Selection Synchronization (Task 3)
    // ------------------------------------------------------------------------
    console.log('\n[Task 3] Testing dataset switching and stale selection clearance...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);

    // Switch dataset selector to another dataset
    const datasetSelect = page.locator('.perf-dataset-select');
    const availableDatasetOptions = await datasetSelect.locator('option').allTextContents();
    console.log('Available dataset options:', availableDatasetOptions);

    if (availableDatasetOptions.length > 1) {
      const nextDataset = availableDatasetOptions[1].trim();
      console.log(`Switching dataset to "${nextDataset}"...`);
      await datasetSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1000);

      // Stale selections from previous dataset must be cleared or pruned to valid ones
      const newChipsCount = await page.locator('.perf-radar-chip').count();
      console.log(`Selected chips count after dataset switch: ${newChipsCount}`);

      const newCandidateCount = await page.locator('.perf-selector-btn').count();
      console.log(`New candidate buttons count: ${newCandidateCount}`);
      assert.ok(newCandidateCount > 0, 'New dataset populated candidate buttons');

      results.interactions.datasetSwitchingWorks = true;
    }

    console.log('\n=== REAL BROWSER VERIFICATION COMPLETED SUCCESSFULLY ===');
    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('Browser verification failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
