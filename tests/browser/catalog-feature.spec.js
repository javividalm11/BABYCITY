import {test,expect} from '@playwright/test';

test('three original PDF covers match their catalogs and open the correct reader',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.setViewportSize({width:1158,height:760});await page.goto('/');
 const section=page.locator('.catalog-feature-section');await section.scrollIntoViewIfNeeded();
 const catalogs=await page.request.get('/catalogs.json').then(r=>r.json()),ids=['catalog-01','catalog-05','catalog-07'];
 await expect(section.locator('.catalog-book')).toHaveCount(3);expect(await section.locator('.catalog-book').evaluateAll(books=>books.every(book=>{const b=book.getBoundingClientRect(),p=book.closest('.catalog-promo').getBoundingClientRect();return b.left>=p.left-1&&b.right<=p.right+1;}))).toBe(true);await section.locator('.catalog-book img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
 for(let i=0;i<ids.length;i++){
  const catalog=catalogs.find(c=>c.id===ids[i]);
  await expect(section.locator('.catalog-book img').nth(i)).toHaveAttribute('src',catalog.pages[0]);
  await expect(section.locator('.catalog-book').nth(i)).toHaveAttribute('href',`/catalogos?libro=${catalog.id}`);
 }
 await expect(section.locator('.fine')).toContainText('12 colecciones');
 await section.screenshot({path:'test-results/catalog-feature-desktop.png'});
 for(const id of ids){
  await page.goto('/');const catalog=catalogs.find(c=>c.id===id);
  await page.locator(`.catalog-book[href="/catalogos?libro=${id}"]`).click();
  await expect(page.locator('#bookDialog')).toBeVisible();await expect(page.locator('#readerTitle')).toHaveText(catalog.title);
  await expect(page.locator('.reader-stage')).toHaveAttribute('aria-busy','false');
  await expect(page.locator('.reader-sheet[aria-hidden=false] img').first()).toHaveAttribute('src',catalog.pages[0]);
  const pdf=await page.request.head(encodeURI(catalog.pdf));expect(pdf.status()).toBe(200);expect(pdf.headers()['content-type']).toBe('application/pdf');
  await page.keyboard.press('Escape');
 }
 expect(errors).toEqual([]);
});

test('catalog feature remains usable on mobile and its main button opens the full collection',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const section=page.locator('.catalog-feature-section');await section.scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(section.locator('.catalog-book')).toHaveCount(3);expect(await section.locator('.catalog-book').evaluateAll(books=>books.every(book=>{const b=book.getBoundingClientRect(),p=book.closest('.catalog-promo').getBoundingClientRect();return b.left>=p.left-1&&b.right<=p.right+1;}))).toBe(true);
 await section.locator('.catalog-book img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
 await section.screenshot({path:'test-results/catalog-feature-mobile.png',style:'.header,.contact-float{visibility:hidden!important}'});
 await section.getByRole('link',{name:'Ver nuestros catálogos',exact:true}).click();await expect(page).toHaveURL(/\/catalogos$/);await expect(page.locator('.catalog-card')).toHaveCount(12);
});
