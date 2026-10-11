const fs = require('fs');

let content = fs.readFileSync('app.js', 'utf8');

// 1. Initialize cart from localStorage
content = content.replace(
  `let cart = [];`,
  `let cart = JSON.parse(localStorage.getItem('saldamisCart') || '[]');`
);

// 2. Setup cartItemsContainer overflow
content = content.replace(
  `  const cartItemsContainer = document.getElementById('cartItemsContainer');`,
  `  const cartItemsContainer = document.getElementById('cartItemsContainer');\n  if (cartItemsContainer) {\n    cartItemsContainer.style.overflowY = 'auto';\n    cartItemsContainer.style.maxHeight = 'calc(100vh - 250px)';\n  }`
);

// 3. Add to renderCart: save to localStorage & "Clear Cart" button logic & layout tweaks
const renderCartSearch = `    if (cartItemsContainer) cartItemsContainer.innerHTML = html;
    if (cartTotalAmount) cartTotalAmount.textContent = \`\${totalPrice.toLocaleString('tr-TR')} ₺\`;`;

const renderCartReplace = `    if (cartItemsContainer) cartItemsContainer.innerHTML = html;
    if (cartTotalAmount) cartTotalAmount.innerHTML = \`<div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <span style="font-size: 1.1rem; color: #1e293b;">\${totalPrice.toLocaleString('tr-TR')} ₺</span>
      <button onclick="window.clearCart()" style="background: transparent; color: #ef4444; border: 1px solid #ef4444; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: bold; display: flex; align-items: center; gap: 0.3rem;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> Sepeti Boşalt</button>
    </div>\`;
    localStorage.setItem('saldamisCart', JSON.stringify(cart));`;

content = content.replace(renderCartSearch, renderCartReplace);


// 4. Add trash icon and title click in html template
const oldHtmlTemplate = `        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding: 0.8rem 0; font-family: var(--font-sans);">
          <div style="flex: 2; font-weight: 600; color: #1e293b; font-size: 0.95rem; line-height: 1.3; padding-right: 0.5rem;">\${item.name}</div>
          <div style="display: flex; align-items: center; gap: 0.4rem; flex: 1; justify-content: center;">
            <button onclick="window.changeItemQty(\${index}, -1)" style="width: 26px; height: 26px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 0; color: #475569; transition: background 0.2s;">-</button>
            <span style="font-weight: 700; width: 20px; text-align: center; color: #0f172a;">\${item.qty}</span>
            <button onclick="window.changeItemQty(\${index}, 1)" style="width: 26px; height: 26px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 0; color: #475569; transition: background 0.2s;">+</button>
          </div>
          <div style="flex: 1; text-align: right; font-weight: 800; color: #7c3aed; font-size: 1rem;">
            \${(item.price * item.qty).toLocaleString('tr-TR')} ₺
          </div>
        </div>`;

const newHtmlTemplate = `        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding: 0.8rem 0; font-family: var(--font-sans);">
          <div onclick="window.goToProduct('\${item.name.replace(/'/g, "\\'")}')" style="flex: 2; font-weight: 600; color: #1e293b; font-size: 0.95rem; line-height: 1.3; padding-right: 0.5rem; cursor: pointer; text-decoration: underline; text-decoration-color: #cbd5e1; text-underline-offset: 4px;">\${item.name}</div>
          <div style="display: flex; align-items: center; gap: 0.4rem; flex: 1; justify-content: center;">
            <button onclick="window.changeItemQty(\${index}, -1)" style="width: 26px; height: 26px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 0; color: #475569; transition: background 0.2s;">-</button>
            <span style="font-weight: 700; width: 20px; text-align: center; color: #0f172a;">\${item.qty}</span>
            <button onclick="window.changeItemQty(\${index}, 1)" style="width: 26px; height: 26px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 0; color: #475569; transition: background 0.2s;">+</button>
          </div>
          <div style="flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;">
            <span style="font-weight: 800; color: #7c3aed; font-size: 1rem;">
              \${(item.price * item.qty).toLocaleString('tr-TR')} ₺
            </span>
            <button onclick="window.removeFromCart(\${index})" style="background: none; border: none; cursor: pointer; color: #ef4444; display: flex; align-items: center; justify-content: center; padding: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>`;

content = content.replace(oldHtmlTemplate, newHtmlTemplate);

// 5. Add global methods for clearCart, removeFromCart, goToProduct
const changeItemQtySearch = `  // Global fonksiyon: adet deÄŸiÅŸtir
  window.changeItemQty = (index, delta) => {`;

const changeItemQtyReplace = `  window.clearCart = () => {
    if (confirm('Sepetinizdeki tüm ürünleri silmek istediğinize emin misiniz?')) {
      cart = [];
      renderCart();
    }
  };

  window.removeFromCart = (index) => {
    cart.splice(index, 1);
    renderCart();
    showToast('Ürün sepetten kaldırıldı.');
  };

  window.goToProduct = (name) => {
    if (window.menuGrouped) {
        for (const cat in window.menuGrouped) {
            const item = window.menuGrouped[cat].find(x => x.name === name);
            if (item) {
                // Determine if we are in menu or hediyelik by checking the url or if the item exists
                window.location.hash = 'product-' + cat + '-' + item.id;
                closeCart();
                return;
            }
        }
    }
  };

  // Global fonksiyon: adet deÄŸiÅŸtir
  window.changeItemQty = (index, delta) => {`;

content = content.replace(changeItemQtySearch, changeItemQtyReplace);


// Make sure to also clear localStorage if cart becomes empty inside renderCart (which setItem handles)
const emptyReturnSearch = `      if (cartCheckoutBtn) {
        cartCheckoutBtn.href = '#';
        cartCheckoutBtn.style.opacity = '0.5';
        cartCheckoutBtn.style.pointerEvents = 'none';
      }
      return;
    }`;
const emptyReturnReplace = `      if (cartCheckoutBtn) {
        cartCheckoutBtn.href = '#';
        cartCheckoutBtn.style.opacity = '0.5';
        cartCheckoutBtn.style.pointerEvents = 'none';
      }
      localStorage.setItem('saldamisCart', JSON.stringify([]));
      return;
    }`;
content = content.replace(emptyReturnSearch, emptyReturnReplace);

// Render cart initially when script loads
const endOfScriptSearch = `  // 7. SÄ±kÃ§a Sorulan Sorular (Accordion)`;
const endOfScriptReplace = `  // Ãlk yÃ¼klemede sepeti render et
  renderCart();
  
  // 7. SÄ±kÃ§a Sorulan Sorular (Accordion)`;

content = content.replace(endOfScriptSearch, endOfScriptReplace);


fs.writeFileSync('app.js', content, 'utf8');
console.log('done updating cart UX features');
