import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const url = 'https://parris-tech-services.github.io/Repository-town-playtest/qa/mobile-dialogue-20261024/';
const pref = 'repository-town.yarn-captions.v1';
const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],
});
const page = await browser.newPage({
  viewport:{ width:390,height:844 },
  screen:{ width:390,height:844 },
  isMobile:true,
  hasTouch:true,
  deviceScaleFactor:1,
  reducedMotion:'reduce'
});
page.setDefaultTimeout(30000);
const logs=[];
page.on('pageerror',e=>logs.push('JS: '+e.message));
try {
  const response = await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  assert.equal(response?.status(),200,'preview URL must load, not 404');
  await page.waitForFunction(()=>document.querySelector('#loading')?.hidden===true,null,{timeout:90000});
  assert.equal(await page.title(),'Repository Town 3D','not the archived handover page');
  assert.equal(await page.locator('#btn-hud-toggle').isVisible(),true);
  const expand = page.locator('#btn-hud-toggle');
  const expanded = await expand.getAttribute('aria-expanded');
  if(expanded==='false') await expand.click();
  await page.locator('#btn-town-dialogue-settings').waitFor({state:'visible'});
  await page.locator('#btn-town-dialogue-settings').click();
  const settings = page.locator('#town-dialogue-settings');
  await settings.waitFor({state:'visible'});
  const choice = page.locator('#town-auto-yarn-toggle');
  assert.equal(await choice.isChecked(),false,'new touch visitor should default to no unsolicited yarn');
  await page.screenshot({path:'mobile-dialogue-default.png',fullPage:false});
  await choice.check();
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),pref),'on');
  await choice.uncheck();
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),pref),'off');
  const button = settings.getByRole('button',{name:'Close dialogue settings'});
  await button.click();
  assert.equal(await settings.isVisible(),false,'dialogue settings X should dismiss');
  await page.locator('#btn-town-dialogue-settings').click();
  assert.equal(await choice.isChecked(),false,'saved preference should remain off after reopening');
  await page.screenshot({path:'mobile-dialogue-settings.png',fullPage:false});
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.querySelector('#loading')?.hidden===true,null,{timeout:90000});
  if(await page.locator('#btn-hud-toggle').getAttribute('aria-expanded')==='false') await page.locator('#btn-hud-toggle').click();
  await page.locator('#btn-town-dialogue-settings').click();
  assert.equal(await page.locator('#town-auto-yarn-toggle').isChecked(),false,'off preference must persist through reload');
  assert.equal(await page.locator('#btn-town-yarns').count(),1,'manual yarns still available');
  assert.equal(await page.locator('#btn-npcs').count(),1,'manual NPCs still available');
  assert.equal(await page.locator('#t-use').count(),1,'touch action remains mounted');
  const dimensions=await page.evaluate(()=>{
    const settings=document.querySelector('#town-dialogue-settings').getBoundingClientRect();
    return {width:innerWidth,height:innerHeight,settings:{left:settings.left,right:settings.right,top:settings.top,bottom:settings.bottom}};
  });
  assert.equal(dimensions.width,390);
  assert.ok(dimensions.settings.left>=-1&&dimensions.settings.right<=391,'settings should fit the phone width');
  assert.ok(dimensions.settings.top>=-1&&dimensions.settings.bottom<=845,'settings should fit phone height');
  assert.deepEqual(logs,[],'no browser JavaScript errors');
  await fs.writeFile('mobile-dialogue-qa.json',JSON.stringify({result:'PASS',url,viewport:dimensions,release:'2743a8f',checks:['HUD expanded','settings shown','mobile default off','toggle persistence','close X','reload persistence','manual NPCs and Yarns remain'],errors:logs},null,2)+'\n');
  console.log('PASS: published GitHub Pages mobile dialogue QA; 390x844; release 2743a8f');
} catch(e) {
  await page.screenshot({path:'mobile-dialogue-failure.png',fullPage:false}).catch(()=>{});
  await fs.writeFile('mobile-dialogue-qa.json',JSON.stringify({result:'FAIL',message:e.message,errors:logs},null,2));
  console.error(e);
  process.exitCode=1;
} finally {
  await browser.close();
}
