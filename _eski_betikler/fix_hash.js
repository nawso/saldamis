const fs = require('fs');

function fixHashHandling(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    
    const oldHashLogic = `            } else if (hash.startsWith('product-')) {
                const parts = hash.replace('product-', '').split('-');
                const catId = parts[0];
                const itemId = parts.slice(1).join('-');
                showProductDetail(catId, itemId);
            }`;

    const newHashLogic = `            } else if (hash.startsWith('product-')) {
                const rest = hash.replace('product-', '');
                let matchedCat = null;
                for (const c of window.menuOrder) {
                    if (rest.startsWith(c + '-')) {
                        // In case of prefix overlapping, we could be careful, 
                        // but category names are unique enough.
                        // Let's pick the longest match if there are multiple.
                        if (!matchedCat || c.length > matchedCat.length) {
                            matchedCat = c;
                        }
                    }
                }
                if (matchedCat) {
                    const itemId = rest.substring(matchedCat.length + 1); // +1 for the dash
                    showProductDetail(matchedCat, itemId);
                } else {
                    // Fallback to old behavior if no category matches
                    const parts = rest.split('-');
                    const catId = parts[0];
                    const itemId = parts.slice(1).join('-');
                    showProductDetail(catId, itemId);
                }
            }`;

    if (content.includes(oldHashLogic)) {
        content = content.replace(oldHashLogic, newHashLogic);
        fs.writeFileSync(filename, content, 'utf8');
        console.log('Fixed hash logic in', filename);
    } else {
        console.log('Could not find hash logic in', filename);
    }
}

fixHashHandling('menu.html');
fixHashHandling('hediyelik.html');
