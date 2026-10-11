const fs = require('fs');
let appContent = fs.readFileSync('app.js', 'utf8');

appContent = appContent.replace(
  /const cartEmptyNotice = document.getElementById\('cartEmptyNotice'\);/,
  "const cartEmptyNotice = document.getElementById('cartEmptyState');"
);

appContent = appContent.replace(
  `      if (cartEmptyNotice) cartEmptyNotice.style.display = 'flex';
      if (cartItemsContainer) cartItemsContainer.innerHTML = '';`,
  `      if (cartEmptyNotice) cartEmptyNotice.style.display = 'flex';
      if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        cartItemsContainer.style.display = 'none';
      }`
);

appContent = appContent.replace(
  `    if (cartEmptyNotice) cartEmptyNotice.style.display = 'none';
    if (cartCheckoutBtn) {`,
  `    if (cartEmptyNotice) cartEmptyNotice.style.display = 'none';
    if (cartItemsContainer) cartItemsContainer.style.display = 'block';
    if (cartCheckoutBtn) {`
);

fs.writeFileSync('app.js', appContent, 'utf8');
console.log('done fixing cart state bugs');
