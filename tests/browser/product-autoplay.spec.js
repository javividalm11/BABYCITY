import {test,expect} from '@playwright/test';

async function visible(section){await section.evaluate(el=>new Promise(resolve=>{const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){observer.disconnect();resolve();}});observer.observe(el);}));}

async function prepare(page,width=1355){
 await page.clock.install({time:new Date('2026-10-20T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-20T12:00:01Z'));await page.setViewportSize({width,height:850});await page.goto('/');
 const section=page.locator('.product-showcase');await section.scrollIntoViewIfNeeded();await page.mouse.move(0,0);
 await section.evaluate(el=>new Promise(resolve=>{const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){observer.disconnect();resolve();}});observer.observe(el);}));
 return section;
}

test('products advance every five seconds and loop from the last group to the first',async({page})=>{
 const section=await prepare(page),active=section.locator('.showcase-dots [aria-current=page]');
 await expect(active).toHaveAttribute('data-showcase-page','0');await page.clock.runFor(4999);await expect(active).toHaveAttribute('data-showcase-page','0');
 await page.clock.runFor(1);await expect(active).toHaveAttribute('data-showcase-page','1');
 for(const next of ['2','3','0']){await page.clock.runFor(5000);await expect(active).toHaveAttribute('data-showcase-page',next);}
 await section.getByRole('button',{name:'Coches',exact:true}).click();await page.locator('h1').click();await page.mouse.move(0,0);await section.scrollIntoViewIfNeeded();await visible(section);
 await page.clock.runFor(5000);await expect(active).toHaveAttribute('data-showcase-page','1');expect((await section.locator('.showcase-category').allTextContents()).every(c=>['Coches','Coches 2 y 3 en 1','Melliceros'].includes(c))).toBe(true);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.locator('.desktop-nav a[href="/tienda"]').click();await page.clock.runFor(20000);await expect(page.locator('.product-showcase')).toHaveCount(0);expect(errors).toEqual([]);
});

test('hover and keyboard focus hold the products in place',async({page})=>{
 const section=await prepare(page),active=section.locator('.showcase-dots [aria-current=page]');
 await section.locator('.showcase-card').first().hover();await page.clock.runFor(20000);await expect(active).toHaveAttribute('data-showcase-page','0');
 await page.mouse.move(0,0);await page.clock.runFor(5000);await expect(active).toHaveAttribute('data-showcase-page','1');
 await section.locator('.showcase-viewport').focus();await page.clock.runFor(20000);await expect(active).toHaveAttribute('data-showcase-page','1');
 await page.locator('h1').click();await page.mouse.move(0,0);await section.scrollIntoViewIfNeeded();await visible(section);await page.clock.runFor(5000);await expect(active).toHaveAttribute('data-showcase-page','2');
});

test('mobile advances one product and reduced motion starts with autoplay paused',async({page})=>{
 const section=await prepare(page,390);await expect(section.locator('.showcase-card')).toHaveCount(1);await page.clock.runFor(5000);await expect(section.locator('.showcase-card')).toHaveAttribute('data-showcase-product','29');
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await section.scrollIntoViewIfNeeded();await expect(section.locator('.showcase-autoplay')).toHaveCount(0);await page.clock.runFor(20000);await expect(section.locator('.showcase-card')).toHaveAttribute('data-showcase-product','2');
});
