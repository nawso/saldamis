const fs = require('fs');

let content = fs.readFileSync('admin.html', 'utf8');

// 1. Dashboard Button
content = content.replace(
  `onclick="alert('Hediyelik eşya modülü yakında aktif edilecek!')">HEDİYELİK</button>`,
  `id="openMarketBtn">HEDİYELİK</button>`
);

// 2. Editor View UI
content = content.replace(
  `      <!-- MENÜ DÜZENLEME (Eski arayüz) -->
      <div id="menuEditorView" style="display: none;">
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
          <h2>Menü Ürünleri</h2>`,
  `      <!-- DÜZENLEME EKRANI -->
      <div id="editorView" style="display: none;">
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 id="editorTitle">Menü Ürünleri</h2>
            <button class="btn btn-secondary" id="backToDashboardBtn">← Ana Menü</button>
          </div>`
);

// 3. Category Checkboxes
content = content.replace(
  /<div id="categoryCheckboxes"[\s\S]*?<\/div>/,
  `<div id="categoryCheckboxes" style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;"></div>`
);

// 4. Update JS variables
content = content.replace(
  /const categoryCheckboxes = document.querySelectorAll\('#categoryCheckboxes input\[type="checkbox"\]'\);/,
  `const categoryCheckboxesContainer = document.getElementById('categoryCheckboxes');`
);

content = content.replace(
  /const menuEditorView = document.getElementById\('menuEditorView'\);/,
  `const editorView = document.getElementById('editorView');
    const openMarketBtn = document.getElementById('openMarketBtn');
    const backToDashboardBtn = document.getElementById('backToDashboardBtn');
    const editorTitle = document.getElementById('editorTitle');
    window.currentCollection = 'menuItems';
    
    const menuCatDefs = [
      {value: 'kahvalti', label: 'Kahvaltı'}, {value: 'tostlar', label: 'Tostlar'},
      {value: 'yemek', label: 'Yemek'}, {value: 'gozlemeler', label: 'Gözlemeler'},
      {value: 'corbalar', label: 'Çorbalar'}, {value: 'salata', label: 'Salata'},
      {value: 'tatli', label: 'Tatlı'}, {value: 'sicak-icecek', label: 'Sıcak İçecek'},
      {value: 'soguk-icecek', label: 'Soğuk İçecek'}
    ];
    
    const marketCatDefs = [
      {value: 'paketler', label: 'Paketler'}, {value: 'sabunlar', label: 'Sabunlar'},
      {value: 'dogal-yaglar', label: 'Doğal Yağlar'}, {value: 'kolonya-kozmetik', label: 'Kolonya & Kozmetik'},
      {value: 'dogal-urunler', label: 'Doğal Ürünler'}, {value: 'magnet-acacak', label: 'Magnet & Açacak'},
      {value: 'oda-susleri', label: 'Oda Süsleri'}
    ];`
);

// 5. Auth Observer
content = content.replace(
  /menuEditorView\.style\.display = 'none';\s+loadMenuItems\(\);/,
  `editorView.style.display = 'none';`
);

// 6. Navigation
content = content.replace(
  `    if (openMenuBtn) {
      openMenuBtn.addEventListener('click', () => {
        mainDashboardView.style.display = 'none';
        menuEditorView.style.display = 'block';
      });
    }

    if (document.getElementById('backToDashboardBtn')) {
      document.getElementById('backToDashboardBtn').addEventListener('click', () => {
        menuEditorView.style.display = 'none';
        mainDashboardView.style.display = 'block';
      });
    }`,
  `    function renderCheckboxes(cats) {
      categoryCheckboxesContainer.innerHTML = '';
      cats.forEach(c => {
        categoryCheckboxesContainer.innerHTML += \`<label style="font-weight: normal; margin: 0; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" value="\${c.value}" style="width: auto; margin: 0;"> \${c.label}</label>\`;
      });
    }

    if (openMenuBtn) {
      openMenuBtn.addEventListener('click', () => {
        window.currentCollection = 'menuItems';
        editorTitle.textContent = "Restoran Menüsü";
        renderCheckboxes(menuCatDefs);
        mainDashboardView.style.display = 'none';
        editorView.style.display = 'block';
        loadMenuItems();
      });
    }
    if (openMarketBtn) {
      openMarketBtn.addEventListener('click', () => {
        window.currentCollection = 'marketItems';
        editorTitle.textContent = "Hediyelik Eşya Dükkanı";
        renderCheckboxes(marketCatDefs);
        mainDashboardView.style.display = 'none';
        editorView.style.display = 'block';
        loadMenuItems();
      });
    }
    if (backToDashboardBtn) {
      backToDashboardBtn.addEventListener('click', () => {
        editorView.style.display = 'none';
        mainDashboardView.style.display = 'block';
      });
    }`
);

// 7. Update all collection calls
content = content.replace(/collection\(db, "menuItems"\)/g, 'collection(db, window.currentCollection)');
content = content.replace(/doc\(db, "menuItems"/g, 'doc(db, window.currentCollection');

// 8. Edit Btn Fix (categoryCheckboxes is dynamic now)
content = content.replace(
  `            categoryCheckboxes.forEach(cb => {
              cb.checked = itemCats.includes(cb.value);
            });`,
  `            const currentCheckboxes = document.querySelectorAll('#categoryCheckboxes input[type="checkbox"]');
            currentCheckboxes.forEach(cb => {
              cb.checked = itemCats.includes(cb.value);
            });`
);

content = content.replace(
  `      const selectedCats = [];
      categoryCheckboxes.forEach(cb => {`,
  `      const selectedCats = [];
      const currentCheckboxes = document.querySelectorAll('#categoryCheckboxes input[type="checkbox"]');
      currentCheckboxes.forEach(cb => {`
);

content = content.replace(
  `categoryCheckboxes.forEach(cb => cb.checked = false);`,
  `const currentCheckboxes = document.querySelectorAll('#categoryCheckboxes input[type="checkbox"]');
      if (currentCheckboxes) currentCheckboxes.forEach(cb => cb.checked = false);`
);

content = content.replace(
  `const storageRef = ref(storage, 'menuItems/' + Date.now() + '_' + file.name);`,
  `const storageRef = ref(storage, window.currentCollection + '/' + Date.now() + '_' + file.name);`
);

// Render Categories Fix
content = content.replace(
  `      const menuTitles = {
        'kahvalti': 'KAHVALTI', 'tostlar': 'TOSTLAR', 'yemek': 'YEMEK',
        'gozlemeler': 'GÖZLEMELER', 'corbalar': 'ÇORBALAR', 'salata': 'SALATA',
        'tatli': 'TATLI', 'sicak-icecek': 'SICAK İÇECEK', 'soguk-icecek': 'SOĞUK İÇECEK'
      };
      const order = ['kahvalti', 'tostlar', 'yemek', 'gozlemeler', 'corbalar', 'salata', 'tatli', 'sicak-icecek', 'soguk-icecek'];`,
  `      const isMenu = window.currentCollection === 'menuItems';
      const menuTitles = isMenu ? {
        'kahvalti': 'KAHVALTI', 'tostlar': 'TOSTLAR', 'yemek': 'YEMEK',
        'gozlemeler': 'GÖZLEMELER', 'corbalar': 'ÇORBALAR', 'salata': 'SALATA',
        'tatli': 'TATLI', 'sicak-icecek': 'SICAK İÇECEK', 'soguk-icecek': 'SOĞUK İÇECEK'
      } : {
        'paketler': 'Paketler', 'sabunlar': 'Sabunlar', 'dogal-yaglar': 'Doğal Yağlar',
        'kolonya-kozmetik': 'Kolonya & Kozmetik', 'dogal-urunler': 'Doğal Ürünler',
        'magnet-acacak': 'Magnet & Açacak', 'oda-susleri': 'Oda Süsleri'
      };
      const order = isMenu ? ['kahvalti', 'tostlar', 'yemek', 'gozlemeler', 'corbalar', 'salata', 'tatli', 'sicak-icecek', 'soguk-icecek'] 
                           : ['paketler', 'sabunlar', 'dogal-yaglar', 'kolonya-kozmetik', 'dogal-urunler', 'magnet-acacak', 'oda-susleri'];`
);

content = content.replace(
  `          <img src="\${menuImages[cat]}" alt="\${menuTitles[cat]}" style="width: 100%; height: 100px; object-fit: cover; display: block;">`,
  `          <img src="\${menuImages[cat] || 'images/header-bg.jpg'}" alt="\${menuTitles[cat]}" style="width: 100%; height: 100px; object-fit: cover; display: block;">`
);


fs.writeFileSync('admin.html', content, 'utf8');
console.log('done');
