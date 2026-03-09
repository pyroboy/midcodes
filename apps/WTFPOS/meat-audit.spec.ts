import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test('meat report audit', async ({ page }) => {
  test.setTimeout(60000);
  
  // LOGIN as owner
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  const ownerBtn = page.locator('button:has-text("Christopher")').first();
  await ownerBtn.click();
  await page.waitForURL('**/pos', { timeout: 10000 });
  console.log('Logged in as owner');
  
  // Navigate to meat report
  await page.goto('http://localhost:5173/reports/meat-report');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log('At meat report:', page.url());
  
  // Screenshot consumption tab
  await page.screenshot({ path: '/tmp/meat-consumption.png', fullPage: true });
  
  // Get all text
  const bodyText = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync('/tmp/meat-report-text.txt', bodyText);
  
  // Find tabs
  const tabs = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('button, [role="tab"]'));
    return els.map(e => e.textContent?.trim()).filter(t => t && t.length < 60);
  });
  console.log('TABS:', JSON.stringify(tabs));
  
  // Table headers
  const headers = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('th, thead td')).map(h => h.textContent?.trim()).filter(Boolean);
  });
  console.log('TABLE HEADERS:', JSON.stringify(headers));
  
  // Weight formats
  const weights = await page.evaluate(() => {
    const text = document.body.innerText;
    return (text.match(/[\d.]+\s*(?:g|kg)\b/g) || []).slice(0, 15);
  });
  console.log('WEIGHT FORMATS:', JSON.stringify(weights));
  
  // Row content (meat items)
  const rows = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('tbody tr')).slice(0, 20).map(r => r.textContent?.replace(/\s+/g, ' ').trim());
  });
  console.log('TABLE ROWS:', JSON.stringify(rows));
  
  // Check for specific meat types
  const hasBoneIn = bodyText.toLowerCase().includes('bone-in') || bodyText.toLowerCase().includes('bone in');
  const hasBoneOut = bodyText.toLowerCase().includes('bone-out') || bodyText.toLowerCase().includes('bone out');
  const hasTrimming = bodyText.toLowerCase().includes('trimming');
  const hasConversion = bodyText.toLowerCase().includes('conversion') || bodyText.toLowerCase().includes('converted');
  console.log('HAS BONE-IN:', hasBoneIn, 'HAS BONE-OUT:', hasBoneOut, 'HAS TRIMMING:', hasTrimming, 'HAS CONVERSION:', hasConversion);
  
  // Try clicking Transfers tab
  const transfersTab = page.locator('button:has-text("Transfer"), [role="tab"]:has-text("Transfer")').first();
  const transfersVisible = await transfersTab.isVisible().catch(() => false);
  if (transfersVisible) {
    await transfersTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/meat-transfers.png', fullPage: true });
    const transferText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('/tmp/meat-transfers-text.txt', transferText);
    console.log('TRANSFERS TAB TEXT (first 2000):', transferText.substring(0, 2000));
  } else {
    console.log('No Transfers tab found');
  }
  
  // Try clicking Conversion tab
  await page.goto('http://localhost:5173/reports/meat-report');
  await page.waitForTimeout(1500);
  const conversionTab = page.locator('button:has-text("Conversion"), [role="tab"]:has-text("Conversion")').first();
  const convVisible = await conversionTab.isVisible().catch(() => false);
  if (convVisible) {
    await conversionTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/meat-conversion.png', fullPage: true });
    const convText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('/tmp/meat-conversion-text.txt', convText);
    console.log('CONVERSION TAB TEXT (first 2000):', convText.substring(0, 2000));
    
    // Try clicking on a node
    const svgCircles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('svg circle, svg ellipse, svg rect')).length;
    });
    console.log('SVG SHAPES COUNT:', svgCircles);
  } else {
    console.log('No Conversion tab found');
  }
  
  // Branch comparison
  await page.goto('http://localhost:5173/reports/branch-comparison');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/branch-comparison.png', fullPage: true });
  const branchText = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync('/tmp/branch-comparison-text.txt', branchText);
  console.log('BRANCH COMPARISON TEXT (first 2000):', branchText.substring(0, 2000));
  
  expect(true).toBe(true);
});
