import {test,expect} from '@playwright/test';

test('community uses catalog images and links to the real TikTok profile',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1532,height:900});await page.goto('/');
 const section=page.locator('.community');await section.scrollIntoViewIfNeeded();
 await section.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
 for(const link of await section.locator('a').all())await expect(link).toHaveAttribute('href','https://www.tiktok.com/@babycityperu');
 await expect(section.locator('.community-video')).toHaveCount(3);
 expect(await section.locator('.community-art img').evaluateAll(images=>images.every(i=>i.src.includes('/assets/catalogs/')||i.src.includes('logo-transparent.png')))).toBe(true);
 await page.locator('.header,.contact-float,.skip').evaluateAll(nodes=>nodes.forEach(n=>n.style.setProperty('visibility','hidden','important')));
 await section.screenshot({path:'test-results/community-desktop.png'});
 await section.getByRole('button',{name:'Conversemos por WhatsApp'}).click();await expect(page.locator('#contactDialog')).toBeVisible();await expect(page.locator('#contactForm')).toBeVisible();
 expect(errors).toEqual([]);
});

test('community adapts to mobile and tablet with a usable contact action',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,390,768,1024]){
  await page.setViewportSize({width,height:900});await page.goto('/');const section=page.locator('.community');await section.scrollIntoViewIfNeeded();
  await section.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const selector of ['.community-copy-header','.community-follow','.community-contact-copy','.community-whatsapp']){
   const box=await section.locator(selector).boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);
  }
  if(width===390){await page.locator('.header,.contact-float,.skip').evaluateAll(nodes=>nodes.forEach(n=>n.style.setProperty('visibility','hidden','important')));await section.screenshot({path:'test-results/community-mobile.png'});}
  await section.getByRole('button',{name:'Conversemos por WhatsApp'}).click();await expect(page.locator('#contactDialog')).toBeVisible();await page.keyboard.press('Escape');
 }
});
