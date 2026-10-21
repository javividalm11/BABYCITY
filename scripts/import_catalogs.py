"""Importación reproducible: precios y modelos verificados contra páginas del PDF."""
from pathlib import Path
import json, re, io
import pymupdf as fitz
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'assets' / 'catalogs'
OUT.mkdir(parents=True, exist_ok=True)
groups = [
 ('COCHES','Coches',[(2,'Coche Donna 3 en 1'),(4,'Coche maleta Rudi'),(7,'Coche moisés Comfort'),(8,'Coche moisés Madison'),(12,'Coche moisés Sundece'),(15,'Coche moisés Saturno'),(20,'Coche cama cuna Beverly')]),
 ('COCHE 3','Coches 2 y 3 en 1',[(2,'Coche Taurus 2 en 1'),(5,'Coche Taurus con portabebé'),(10,'Coche Galaxy 3 en 1')]),
 ('MELLICERO','Melliceros',[(2,'Coche mellicero Dual Kripto'),(4,'Coche mellicero Prant Duo'),(5,'Coche mellicero Lisboa')]),
 ('BAÑERAS','Baño y cuidado',[(2,'Bañera Blur 58 L'),(4,'Bañera Maui 40 L'),(6,'Bañera Splash 42 L'),(10,'Bañera Aquabu 48 L'),(14,'Bañera Aquabu con accesorios'),(19,'Bañera Atlantic 58 L'),(25,'Bañera Oasis'),(26,'Bañera Hawai 40 L')]),
 ('CUNAS','Cunas y colechos',[(2,'Cuna mecedora eléctrica Serem'),(4,'Cuna corral Árabe'),(8,'Cuna corral Happy Dream'),(11,'Cuna colecho Nala'),(13,'Cuna corral Iris'),(16,'Cuna mecedora Sally'),(22,'Cuna Dácora 4 en 1'),(26,'Cuna colecho Marion')]),
 ('MECEDORA','Mecedoras',[(2,'Mecedora Stokker Luxe'),(6,'Mecedora Milan Baby Cam'),(9,'Mecedora Melody'),(16,'Mecedora Orbit Infini')]),
 ('SILLA COMEDOR','Sillas de comer',[(2,'Silla Silvestre 3 en 1'),(7,'Silla comedor Gravy'),(8,'Silla comedor Voyage'),(12,'Silla de comer Lulu')]),
 ('SILLA DE AUTO','Sillas de auto',[(2,'Silla de auto Rupal 360°'),(3,'Silla de auto Lexa 360°')]),
 ('CORRAL','Cercos de juego',[(2,'Cerco Velly Khali'),(4,'Cerco Velly Vera')]),
 ('ACCESORIOS','Accesorios',[(2,'Set de alimentación de silicona'),(10,'Almohada de lactancia'),(11,'Peluche arrullador')]),
 ('ANDADOR','Andadores',[(2,'Andador 3 en 1 con tapasol'),(6,'Andador guiador Lana'),(10,'Andador caminador compacto')]),
 ('COMBOS','Combos',[(2,'Combo mecedora Melody y peluche arrullador'),(3,'Combo mecedora Milan y peluche arrullador'),(7,'Combo Melody, peluche y canguro Ballena')]),
]
products=[]; catalogs=[]
for ci,(match,category,entries) in enumerate(groups):
    source=next(p for p in (ROOT/'catalogo').glob('*.pdf') if match in p.name)
    doc=fitz.open(source); slug=f'catalog-{ci+1:02}'
    dest=OUT/slug; dest.mkdir(exist_ok=True)
    pages=[]
    for pi,page in enumerate(doc):
        filename=f'{pi+1:03}.webp'; path=dest/filename
        if not path.exists():
            pix=page.get_pixmap(matrix=fitz.Matrix(1.15,1.15),alpha=False)
            Image.frombytes('RGB',[pix.width,pix.height],pix.samples).save(path,'WEBP',quality=83)
        pages.append(f'/assets/catalogs/{slug}/{filename}')
    catalogs.append(dict(id=slug,title=category,pages=pages,pdf='/catalogo/'+source.name,count=len(doc)))
    for page_num,name in entries:
        page=doc[page_num-1]; text=page.get_text()
        prices=re.findall(r'[Ss]\s*/\s*(\d+(?:\.\d{1,2})?)',text)
        if not prices: raise ValueError(f'Precio no encontrado: {name}')
        pid=len(products)+1; image=f'/assets/catalogs/{slug}/product-{pid}.webp'
        # Exclude tiny decorative elements; the largest raster is the main product.
        candidates=[x for x in page.get_images(full=True) if x[2]>300 and x[3]>300]
        if candidates:
            best=max(candidates,key=lambda x:max((r.width*r.height for r in page.get_image_rects(x[0])),default=0)); pix=fitz.Pixmap(doc,best[0])
            if best[1]: pix=fitz.Pixmap(pix,fitz.Pixmap(doc,best[1]))
            if pix.colorspace and pix.colorspace.n>3: pix=fitz.Pixmap(fitz.csRGB,pix)
            im=Image.open(io.BytesIO(pix.tobytes('png'))); im.thumbnail((850,850)); im.save(ROOT/'public'/image.lstrip('/'),'WEBP',quality=90)
        else: image=pages[page_num-1]
        if category=='Combos': image=pages[page_num-1]
        # Keep literal catalog copy for provenance; no invented certifications/ages.
        clean=' '.join(line.strip() for line in text.splitlines() if not any(k in line for k in ['www.','+51','S/','s/']))
        products.append(dict(id=pid,sku=f'BC-{pid:04}',name=name,category=category,price=float(prices[0]),stock=None,active=True,image=image,description=clean[:1800],catalogId=slug,sourcePage=page_num))
(ROOT/'data'/'products.json').write_text(json.dumps(products,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'public'/'catalogs.json').write_text(json.dumps(catalogs,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(products)} productos; {len(catalogs)} catálogos; {sum(c["count"] for c in catalogs)} páginas')
