import {test,expect} from '@playwright/test';

test('community uses the three supplied TikTok captures without cropping and links to the real profile',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1532,height:900});await page.goto('/');
 const section=page.locator('.community');await section.scrollIntoViewIfNeeded();
 await section.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
 for(const link of await section.locator('a').all())await expect(link).toHaveAttribute('href','https://www.tiktok.com/@babycityperu');
 await expect(section.locator('.community-video')).toHaveCount(3);
 expect(await section.locator('.community-art img').evaluateAll(images=>images.every(i=>i.src.includes('/assets/community/tiktok-')||i.src.includes('logo-transparent.png')))).toBe(true);
 const captures=['tiktok-live','tiktok-pedidos','tiktok-tienda'];
 for(const [index,name] of captures.entries()){const card=section.locator('.community-video').nth(index);await expect(card.locator('img')).toHaveAttribute('src',`/assets/community/${name}.webp`);await expect(card.locator('span,small')).toHaveCount(0);expect(await card.locator('img').evaluate(i=>getComputedStyle(i).objectFit)).toBe('contain');}
 await expect(section.locator('.phone-grid img')).toHaveCount(3);
 for(const [index,name] of captures.entries())await expect(section.locator('.phone-grid img').nth(index)).toHaveAttribute('src',`/assets/community/${name}.webp`);
 await page.locator('.header,.contact-float,.skip').evaluateAll(nodes=>nodes.forEach(n=>n.style.setProperty('visibility','hidden','important')));
 await section.screenshot({path:'test-results/community-desktop.png'});
 await section.getByRole('button',{name:'Conversemos por WhatsApp'}).click();await expect(page.locator('#contactDialog')).toBeVisible();await expect(page.locator('#contactForm')).toBeVisible();
 expect(errors).toEqual([]);
});

test('community adapts to mobile and tablet with a usable contact action',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,390,560,768,1024,1199,1366,1532,1920]){
  await page.setViewportSize({width,height:900});await page.goto('/');const section=page.locator('.community');await section.scrollIntoViewIfNeeded();
  await section.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const card of await section.locator('.community-video').all()){
   const assertInside=async()=>{const parent=await section.locator('.community-art').boundingBox(),box=await card.boundingBox();expect(box.x).toBeGreaterThanOrEqual(parent.x);expect(box.x+box.width).toBeLessThanOrEqual(parent.x+parent.width);expect(box.y).toBeGreaterThanOrEqual(parent.y);expect(box.y+box.height).toBeLessThanOrEqual(parent.y+parent.height);};
   await assertInside();await card.focus();await assertInside();await card.evaluate(n=>n.blur());
  }
  for(const selector of ['.community-copy-header','.community-follow','.community-contact-copy','.community-whatsapp']){
   const box=await section.locator(selector).boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);
  }
  if(width===390){await page.locator('.header,.contact-float,.skip').evaluateAll(nodes=>nodes.forEach(n=>n.style.setProperty('visibility','hidden','important')));await section.screenshot({path:'test-results/community-mobile.png'});}
  await section.getByRole('button',{name:'Conversemos por WhatsApp'}).click();await expect(page.locator('#contactDialog')).toBeVisible();await page.keyboard.press('Escape');
 }
});
