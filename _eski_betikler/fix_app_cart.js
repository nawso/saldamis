const fs = require('fs');
let appContent = fs.readFileSync('app.js', 'utf8');

// Fix the symbol â‚º to ₺ globally
appContent = appContent.replace(/â‚º/g, '₺');

// Update the cart item row layout
const oldHTML = `      html += \`
        <div class="cart-item-row">
          <div class="cart-item-info">
            <div class="cart-item-title">\${item.name}</div>
            <div class="cart-item-price">\${item.price} ₺ / adet</div>
          </div>
          <div class="cart-qty-ctrl">
            <button class="cart-qty-btn" onclick="window.changeItemQty(\${index}, -1)">-</button>
            <span class="cart-qty-display">\${item.qty}</span>
            <button class="cart-qty-btn" onclick="window.changeItemQty(\${index}, 1)">+</button>
          </div>
        </div>
      \`;`;

const newHTML = `      html += \`
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding: 0.8rem 0; font-family: var(--font-sans);">
          <div style="flex: 2; font-weight: 600; color: #1e293b; font-size: 0.95rem; line-height: 1.3; padding-right: 0.5rem;">\${item.name}</div>
          <div style="display: flex; align-items: center; gap: 0.4rem; flex: 1; justify-content: center;">
            <button onclick="window.changeItemQty(\${index}, -1)" style="width: 26px; height: 26px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 0; color: #475569; transition: background 0.2s;">-</button>
            <span style="font-weight: 700; width: 20px; text-align: center; color: #0f172a;">\${item.qty}</span>
            <button onclick="window.changeItemQty(\${index}, 1)" style="width: 26px; height: 26px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 0; color: #475569; transition: background 0.2s;">+</button>
          </div>
          <div style="flex: 1; text-align: right; font-weight: 800; color: #7c3aed; font-size: 1rem;">
            \${(item.price * item.qty).toLocaleString('tr-TR')} ₺
          </div>
        </div>
      \`;`;

appContent = appContent.replace(oldHTML, newHTML);

fs.writeFileSync('app.js', appContent, 'utf8');
console.log('done fixing app.js');
