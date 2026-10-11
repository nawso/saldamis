const fs = require('fs');

// Patch app.js
let appContent = fs.readFileSync('app.js', 'utf8');

appContent = appContent.replace(
  /cartToggleBtn\?\.addEventListener\('click', openCart\);/,
  `cartToggleBtn?.addEventListener('click', openCart);\n  floatingCartBtn?.addEventListener('click', openCart);`
);

appContent = appContent.replace(
  /if \(cartBadge\) {\s*cartBadge\.textContent = totalCount;\s*cartBadge\.style\.display = totalCount > 0 \? 'flex' : 'none';\s*}/,
  `if (cartBadge) {\n      cartBadge.textContent = totalCount;\n      cartBadge.style.display = totalCount > 0 ? 'flex' : 'none';\n    }\n    if (floatingCartBadge) {\n      floatingCartBadge.textContent = totalCount;\n      floatingCartBadge.style.display = totalCount > 0 ? 'flex' : 'none';\n    }`
);

fs.writeFileSync('app.js', appContent, 'utf8');

// Patch hediyelik.html
let htmlContent = fs.readFileSync('hediyelik.html', 'utf8');

htmlContent = htmlContent.replace(
  `<a href="https://wa.me/905550000000?text=Merhaba,%20Saldamis%20hakkında%20bilgi%20almak%20istiyorum."
      target="_blank" class="float-wa-btn" title="WhatsApp ile İletişim">
      <i data-lucide="message-circle" style="width:28px; height:28px;"></i>
    </a>`,
  `<button class="float-cart-btn" id="floatingCartBtn" title="Sepetim" style="background: linear-gradient(135deg, #fbcfe8, #d8b4fe); color: #4c1d95; width: 60px; height: 60px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer; transition: transform 0.2s; position: relative; margin-top: 10px;">
      <i data-lucide="shopping-bag" style="width:28px; height:28px;"></i>
      <span class="cart-badge" id="floatingCartBadge" style="position: absolute; top: -5px; right: -5px; background: #e11d48; color: white; border-radius: 50%; min-width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; border: 2px solid white; display: none;">0</span>
    </button>
    <a href="https://wa.me/905550000000?text=Merhaba,%20Saldamis%20hakkında%20bilgi%20almak%20istiyorum."
      target="_blank" class="float-wa-btn" title="WhatsApp ile İletişim" style="margin-top: 10px;">
      <i data-lucide="message-circle" style="width:28px; height:28px;"></i>
    </a>`
);

// Diğer kategorisinin listeye eklenmesi
htmlContent = htmlContent.replace(
  `window.menuOrder = ['paketler', 'sabunlar', 'dogal-yaglar', 'kolonya-kozmetik', 'dogal-urunler', 'magnet-acacak', 'oda-susleri'];`,
  `window.menuOrder = ['paketler', 'sabunlar', 'dogal-yaglar', 'kolonya-kozmetik', 'dogal-urunler', 'magnet-acacak', 'oda-susleri', 'diger'];`
);

// addToCart (Sepete Ekle) butonu entegrasyonu (hediyelik.html içinde)
htmlContent = htmlContent.replace(
  `                        <p style="font-size: 1.1rem; font-family: var(--font-sans); color: var(--c-dark-700); line-height: 1.6; padding: 0 1rem;">
                            \${item.desc || 'Bu ürün için henüz bir açıklama eklenmemiştir.'}
                        </p>`,
  `                        <p style="font-size: 1.1rem; font-family: var(--font-sans); color: var(--c-dark-700); line-height: 1.6; padding: 0 1rem;">
                            \${item.desc || 'Bu ürün için henüz bir açıklama eklenmemiştir.'}
                        </p>
                        <button onclick="window.addToCart('\${item.name.replace(/'/g, "\\'")}', '\${item.price}')" style="margin-top: 2rem; background: linear-gradient(135deg, #fbcfe8, #d8b4fe); color: #4c1d95; font-family: var(--font-heading); font-weight: 800; font-size: 1.1rem; padding: 1rem 2rem; border-radius: 50px; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3); transition: transform 0.2s; display: inline-flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            <i data-lucide="shopping-cart" style="width: 20px; height: 20px;"></i>
                            Sepete Ekle
                        </button>`
);


fs.writeFileSync('hediyelik.html', htmlContent, 'utf8');
console.log('done');
