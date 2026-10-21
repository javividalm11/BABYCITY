import {test,expect} from '@playwright/test';

test('product section uses real catalog prices, filters, pagination, favorites and cart',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.setViewportSize({width:1355,height:850});await page.goto('/');
 const section=page.locator('.product-showcase'),cards=section.locator('.showcase-card');await section.scrollIntoViewIfNeeded();
 await expect(cards).toHaveCount(4);await expect(cards.first()).toHaveAttribute('data-showcase-product','2');
 await expect(cards.first().locator('.showcase-price')).toContainText('279.00');await expect(section.locator('.showcase-stock')).toHaveText(['Consultar stock','Consultar stock','Consultar stock','Consultar stock']);
 await expect(section.locator('.showcase-dots button')).toHaveCount(4);await expect(section.getByRole('button',{name:'Ver productos anteriores'})).toBeDisabled();
 await cards.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
 await section.screenshot({path:'test-results/product-showcase-desktop.png'});
 await cards.first().getByRole('button',{name:'Guardar en favoritos',exact:true}).click();await expect(cards.first().locator('.wish')).toHaveAttribute('aria-pressed','true');
 await section.getByRole('button',{name:'Ver productos siguientes'}).click();await expect(cards.first()).toHaveAttribute('data-showcase-product','4');
 await section.getByRole('button',{name:'Ver productos anteriores'}).click();await expect(cards.first().locator('.wish')).toHaveAttribute('aria-pressed','true');
 await section.getByRole('button',{name:'Mecedoras',exact:true}).click();await expect(cards).toHaveCount(4);await expect(cards.locator('.showcase-category')).toHaveText(['Mecedoras','Mecedoras','Mecedoras','Mecedoras']);
 await section.getByRole('button',{name:'Todos',exact:true}).click();await cards.first().getByRole('button',{name:/Agregar .* al carrito/}).click();await expect(page.locator('#cartCount')).toHaveText('1');
 await page.getByRole('button',{name:'Abrir carrito',exact:true}).click();await expect(page.locator('.cart-item')).toHaveCount(1);await expect(page.locator('.cart-item')).toContainText('Coche maleta Rudi');
 expect(errors).toEqual([]);
});

test('confirmed inventory takes priority; sold-out products and empty categories are handled',async({page})=>{
 await page.route('**/api/products',async route=>{const response=await route.fetch();const products=await response.json();for(const p of products){if(p.id===4)p.stock=7;if(p.id===2||p.category==='Accesorios')p.stock=0;}await route.fulfill({json:products});});
 await page.goto('/');const section=page.locator('.product-showcase');await expect(section.locator('.showcase-card').first()).toHaveAttribute('data-showcase-product','4');await expect(section.locator('.showcase-card').first().locator('.showcase-stock')).toHaveText('En stock');
 await expect(section.locator('[data-showcase-product="2"]')).toHaveCount(0);
 await section.getByRole('button',{name:'Accesorios',exact:true}).click();await expect(section.locator('.showcase-empty')).toBeVisible();await expect(section.getByRole('button',{name:'Ver productos siguientes'})).toBeDisabled();await expect(section.locator('.showcase-card')).toHaveCount(0);
});

test('mobile carousel fits screen, supports keyboard navigation and preserves position on resize',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');const section=page.locator('.product-showcase');await section.scrollIntoViewIfNeeded();
 await expect(section.locator('.showcase-card')).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await section.locator('.showcase-viewport').focus();await page.keyboard.press('ArrowRight');await expect(section.locator('.showcase-card')).toHaveAttribute('data-showcase-product','29');
 await page.keyboard.press('ArrowLeft');await expect(section.locator('.showcase-card')).toHaveAttribute('data-showcase-product','2');
 await section.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));await section.screenshot({path:'test-results/product-showcase-mobile.png'});
 await page.setViewportSize({width:1355,height:850});await expect(section.locator('.showcase-card')).toHaveCount(4);await expect(section.locator('.showcase-dots button')).toHaveCount(4);
});
