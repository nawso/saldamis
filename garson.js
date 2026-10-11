import { db, auth, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, signInWithEmailAndPassword, onAuthStateChanged, signOut, onSnapshot } from './firebase-config.js';

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginBtn = document.getElementById('loginBtn');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const tablesGrid = document.getElementById('tablesGrid');
const pendingOrdersGrid = document.getElementById('pendingOrdersGrid');
const addTableBtn = document.getElementById('addTableBtn');

// Modal Elements
const tableModal = document.getElementById('tableModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTableTitle = document.getElementById('modalTableTitle');

const btnGoAddOrder = document.getElementById('btnGoAddOrder');
const btnGoDetails = document.getElementById('btnGoDetails');
const btnMoveTable = document.getElementById('btnMoveTable');
const btnBackFromAdd = document.getElementById('btnBackFromAdd');
const btnBackFromDetails = document.getElementById('btnBackFromDetails');
const btnBackFromMove = document.getElementById('btnBackFromMove');

const modalSelectionScreen = document.getElementById('modalSelectionScreen');
const modalAddOrderScreen = document.getElementById('modalAddOrderScreen');
const modalDetailsScreen = document.getElementById('modalDetailsScreen');
const modalMoveTableScreen = document.getElementById('modalMoveTableScreen');
const moveTableList = document.getElementById('moveTableList');

const menuGrid = document.getElementById('menuGrid');
const categoryFilters = document.getElementById('categoryFilters');
const newOrderList = document.getElementById('newOrderList');
const newOrderTotalDisplay = document.getElementById('newOrderTotalDisplay');
const saveOrderBtn = document.getElementById('saveOrderBtn');

const mobileCartSection = document.getElementById('mobileCartSection');
const cartToggleBtn = document.getElementById('cartToggleBtn');
const mobileCartTotalDisplay = document.getElementById('mobileCartTotalDisplay');

const detailsOrderList = document.getElementById('detailsOrderList');
const detailsTotalDisplay = document.getElementById('detailsTotalDisplay');
const checkoutBtn = document.getElementById('checkoutBtn');
const clearTableBtn = document.getElementById('clearTableBtn');

// State
let menuItems = [];
let currentTableId = null;
let currentTableData = null; 
let newOrdersArray = []; 
let allTablesData = [];

// Auth State Observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    loadMenu();
    listenToTables();
  } else {
    loginSection.style.display = 'block';
    dashboardSection.style.display = 'none';
  }
});

// Login
loginBtn.addEventListener('click', async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    loginError.style.display = 'none';
  } catch (error) {
    loginError.textContent = "Hatalı e-posta veya şifre!";
    loginError.style.display = 'block';
  }
});
logoutBtn.addEventListener('click', () => signOut(auth));


// --- MENÜ YÜKLEME ---
const categoryTitles = {
  'kahvalti': 'Kahvaltı',
  'tostlar': 'Tostlar',
  'yemek': 'Yemek',
  'gozlemeler': 'Gözlemeler',
  'corbalar': 'Çorbalar',
  'salata': 'Salata',
  'tatli': 'Tatlı',
  'sicak-icecek': 'Sıcak İçecek',
  'soguk-icecek': 'Soğuk İçecek'
};
const menuOrder = ['kahvalti', 'tostlar', 'yemek', 'gozlemeler', 'corbalar', 'salata', 'tatli', 'sicak-icecek', 'soguk-icecek'];

async function loadMenu() {
  try {
    const querySnapshot = await getDocs(collection(db, "menuItems"));
    const categoriesSet = new Set();
    menuItems = [];

    querySnapshot.forEach((doc) => {
      const item = doc.data();
      item.id = doc.id;
      menuItems.push(item);
      
      let cats = [];
      if (Array.isArray(item.categories)) cats = item.categories;
      else if (item.category) cats = item.category.split(',').map(c => c.trim());
      else cats = ['diger'];

      cats.forEach(c => categoriesSet.add(c));
    });

    // Menü öğelerini sırala: order'a göre, yoksa isme göre
    menuItems.sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || '').localeCompare(b.name || '');
    });

    categoryFilters.innerHTML = ''; // Temizle
    
    // Doğru kategori sırasını belirle
    const finalCategories = [];
    menuOrder.forEach(cat => {
      if(categoriesSet.has(cat)) finalCategories.push(cat);
    });
    categoriesSet.forEach(cat => {
      if(!menuOrder.includes(cat)) finalCategories.push(cat);
    });
    
    // Butonları oluştur
    let isFirst = true;
    let firstCategory = null;
    
    finalCategories.forEach(cat => {
      if(isFirst) firstCategory = cat;
      const btn = document.createElement('button');
      btn.className = 'category-btn' + (isFirst ? ' active' : '');
      btn.dataset.category = cat;
      
      const displayName = categoryTitles[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1));
      btn.textContent = displayName;
      
      btn.addEventListener('click', (e) => filterMenu(cat, e.target));
      categoryFilters.appendChild(btn);
      isFirst = false;
    });

    if (firstCategory) {
      filterMenu(firstCategory, document.querySelector('.category-btn.active'));
    }
  } catch (error) {
    console.error("Menü yüklenirken hata:", error);
  }
}

function filterMenu(category, clickedBtn) {
  if (clickedBtn) {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    clickedBtn.classList.add('active');
  }
  const filtered = menuItems.filter(item => {
    let cats = [];
    if (Array.isArray(item.categories)) cats = item.categories;
    else if (item.category) cats = item.category.split(',').map(c => c.trim());
    else cats = ['diger'];
    return cats.includes(category);
  });
  renderMenu(filtered);
}

function renderMenu(items) {
  menuGrid.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'menu-item-card';
    div.innerHTML = `
      <div class="menu-item-name">${item.name}</div>
      <div class="menu-item-price">${item.price} ₺</div>
    `;
    div.addEventListener('click', () => addToNewOrder(item));
    menuGrid.appendChild(div);
  });
}


// --- MASALAR ---
function listenToTables() {
  onSnapshot(collection(db, "tables"), (snapshot) => {
    allTablesData = [];
    snapshot.forEach((doc) => {
      allTablesData.push({ id: doc.id, ...doc.data() });
    });

    allTablesData.sort((a, b) => {
      return String(a.number).localeCompare(String(b.number), undefined, { numeric: true, sensitivity: 'base' });
    });
    
    renderTablesGrid();
    renderPendingOrders();
    
    // Eğer o an açık bir masa modalı varsa detayları güncelle
    if (currentTableId) {
      const updatedTable = allTablesData.find(t => t.id === currentTableId);
      if (updatedTable) {
        currentTableData = updatedTable;
        renderDetailsScreen(); // Adisyonu güncelle
      }
    }
  });
}

function renderTablesGrid() {
  tablesGrid.innerHTML = '';

  allTablesData.forEach(table => {
    const div = document.createElement('div');
    const hasWaitingOrder = (table.orders || []).some(o => o.status === 'bekliyor');
    
    let cssClass = table.status === 'empty' ? 'empty' : 'occupied';
    if (hasWaitingOrder) cssClass = 'waiting';

    const statusText = table.status === 'empty' ? 'Boş' : (hasWaitingOrder ? 'Sipariş Bekliyor' : 'Dolu');
    const totalText = table.status === 'occupied' ? `${table.total || 0} ₺` : '-';

    div.className = `table-card ${cssClass}`;
    div.innerHTML = `
      <h3>${table.number}</h3>
      <div class="table-status">${statusText}</div>
      <div class="table-total">${totalText}</div>
    `;
    div.addEventListener('click', () => openTableModal(table));
    tablesGrid.appendChild(div);
  });
}

addTableBtn.addEventListener('click', async () => {
  const tableNumber = prompt("Eklenecek Masa İsmi (Örn: 1 veya Bahçe 1):");
  if (tableNumber && tableNumber.trim() !== '') {
    try {
      await addDoc(collection(db, "tables"), {
        number: tableNumber.trim(),
        status: 'empty',
        orders: [],
        total: 0
      });
    } catch (error) {
      alert("Masa eklenirken bir hata oluştu.");
    }
  }
});


// --- BEKLEYEN SİPARİŞLER (ANA EKRAN) ---
function renderPendingOrders() {
  pendingOrdersGrid.innerHTML = '';
  let hasPending = false;
  const now = Date.now();

  allTablesData.forEach(table => {
    if (!table.orders) return;
    
    const pendingItems = table.orders.filter(o => o.status === 'bekliyor');
    if (pendingItems.length > 0) {
      hasPending = true;
      
      const groups = {};
      pendingItems.forEach(item => {
        const timeKey = item.timestamp || 0;
        if (!groups[timeKey]) groups[timeKey] = [];
        groups[timeKey].push(item);
      });

      Object.keys(groups).sort((a,b) => a - b).forEach(timeKey => {
        const items = groups[timeKey];
        const orderTime = parseInt(timeKey);
        const diffMinutes = Math.floor((now - orderTime) / 60000);
        const isUrgent = diffMinutes >= 15;
        
        let timeText = diffMinutes === 0 ? "Az önce" : `${diffMinutes} dk önce`;
        if(isNaN(diffMinutes)) timeText = "Bilinmiyor";

        const div = document.createElement('div');
        div.className = 'pending-order-card';
        const itemsHtml = items.map(i => `• ${i.qty}x ${i.name}`).join('<br>');

        div.innerHTML = `
          <div class="pending-order-header">
            <span>${table.number}</span>
            <span class="time-badge ${isUrgent ? 'urgent' : ''}">${timeText}</span>
          </div>
          <div class="pending-order-items">
            ${itemsHtml}
          </div>
          <button class="btn-mark-delivered" onclick="window.markAsDelivered('${table.id}', ${timeKey})">
            Teslim Edildi İşaretle
          </button>
        `;
        pendingOrdersGrid.appendChild(div);
      });
    }
  });

  if (!hasPending) {
    pendingOrdersGrid.innerHTML = '<p style="color: #64748b;">Şu an bekleyen sipariş yok.</p>';
  }
}

window.markAsDelivered = async (tableId, timeKey) => {
  const table = allTablesData.find(t => t.id === tableId);
  if (!table) return;

  const updatedOrders = table.orders.map(o => {
    if (o.status === 'bekliyor' && o.timestamp == timeKey) {
      return { ...o, status: 'teslim_edildi' };
    }
    return o;
  });

  try {
    await updateDoc(doc(db, "tables", tableId), { orders: updatedOrders });
  } catch (error) {
    console.error("Hata:", error);
  }
};

setInterval(renderPendingOrders, 60000); // Her 1 dakikada güncelleyerek süreleri yenile


// --- MODAL & EKRAN YÖNETİMİ ---
function openTableModal(table) {
  currentTableId = table.id;
  currentTableData = table;
  modalTableTitle.textContent = `${table.number}`;
  
  newOrdersArray = []; // Sıfırla
  renderNewOrderList();
  
  showScreen('selection');
  tableModal.classList.add('active');
}

function showScreen(screenType) {
  modalSelectionScreen.style.display = 'none';
  modalAddOrderScreen.style.display = 'none';
  modalDetailsScreen.style.display = 'none';
  modalMoveTableScreen.style.display = 'none';

  if (screenType === 'selection') {
    modalSelectionScreen.style.display = 'flex';
  } else if (screenType === 'add') {
    modalAddOrderScreen.style.display = 'flex';
  } else if (screenType === 'details') {
    modalDetailsScreen.style.display = 'flex';
    renderDetailsScreen();
  } else if (screenType === 'move') {
    modalMoveTableScreen.style.display = 'flex';
    renderMoveTableScreen();
  }
}

btnGoAddOrder.addEventListener('click', () => showScreen('add'));
btnGoDetails.addEventListener('click', () => showScreen('details'));
btnBackFromAdd.addEventListener('click', () => showScreen('selection'));
btnBackFromDetails.addEventListener('click', () => showScreen('selection'));
btnBackFromMove.addEventListener('click', () => showScreen('selection'));

btnMoveTable.addEventListener('click', () => {
  const currentOrders = currentTableData.orders || [];
  if (currentOrders.length === 0) {
    alert("Bu masada taşınacak sipariş yok.");
    return;
  }
  showScreen('move');
});

function renderMoveTableScreen() {
  moveTableList.innerHTML = '';
  
  allTablesData.forEach(table => {
    if(table.id === currentTableId) return; // Kendi masasını gösterme
    
    const hasWaitingOrder = (table.orders || []).some(o => o.status === 'bekliyor');
    let cssClass = table.status === 'empty' ? 'empty' : 'occupied';
    if (hasWaitingOrder) cssClass = 'waiting';

    const statusText = table.status === 'empty' ? 'Boş' : (hasWaitingOrder ? 'Sipariş Bekliyor' : 'Dolu');

    const div = document.createElement('div');
    div.className = `table-card ${cssClass}`;
    div.innerHTML = `
      <h3 style="font-size: 1.2rem;">${table.number}</h3>
      <div class="table-status" style="font-size: 0.8rem;">${statusText}</div>
    `;
    div.addEventListener('click', () => executeMoveTable(table));
    moveTableList.appendChild(div);
  });
}

async function executeMoveTable(targetTable) {
  const targetName = String(targetTable.number);
  const currentOrders = currentTableData.orders || [];

  if (targetTable.status !== 'empty') {
    if (!confirm(`Hedef masa (${targetName}) şu an DOLU. Mevcut siparişler o masadaki siparişlere eklenecektir. Onaylıyor musunuz?`)) {
      return;
    }
  } else {
    if (!confirm(`'${currentTableData.number}' nolu masa, '${targetName}' nolu masaya taşınacaktır. Onaylıyor musunuz?`)) {
      return;
    }
  }

  try {
    const targetOrders = targetTable.orders || [];
    const newTargetOrders = [...targetOrders, ...currentOrders];
    const newTargetTotal = newTargetOrders.reduce((sum, item) => sum + (item.price * item.qty), 0);

    await updateDoc(doc(db, "tables", targetTable.id), {
      status: 'occupied',
      orders: newTargetOrders,
      total: newTargetTotal
    });

    await updateDoc(doc(db, "tables", currentTableId), {
      status: 'empty',
      orders: [],
      total: 0
    });

    tableModal.classList.remove('active');
    currentTableId = null;
    alert("Masa başarıyla taşındı.");

  } catch (error) {
    console.error(error);
    alert("Taşıma işlemi sırasında bir hata oluştu.");
  }
}

closeModalBtn.addEventListener('click', () => {
  tableModal.classList.remove('active');
  currentTableId = null;
  if(mobileCartSection) mobileCartSection.classList.remove('expanded');
});

if(cartToggleBtn && mobileCartSection) {
  cartToggleBtn.addEventListener('click', () => {
    mobileCartSection.classList.toggle('expanded');
  });
}

// --- SİPARİŞ EKLE EKRANI ---
function addToNewOrder(item) {
  const existing = newOrdersArray.find(o => o.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    newOrdersArray.push({
      tempId: Date.now() + Math.random(),
      id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      qty: 1
    });
  }
  renderNewOrderList();
}

window.updateQtyNew = (tempId, delta) => {
  const index = newOrdersArray.findIndex(o => o.tempId === tempId);
  if (index === -1) return;
  
  newOrdersArray[index].qty += delta;
  if (newOrdersArray[index].qty <= 0) {
    newOrdersArray.splice(index, 1);
  }
  renderNewOrderList();
};

function renderNewOrderList() {
  newOrderList.innerHTML = '';
  let total = 0;

  if (newOrdersArray.length === 0) {
    newOrderList.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">Sepet boş. Menüden ürün ekleyin.</div>';
  }

  newOrdersArray.forEach(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    const div = document.createElement('div');
    div.className = 'order-item new-item';
    div.innerHTML = `
      <div class="order-item-main">
        <div class="order-item-info">
          <div style="font-weight: 600; color: #1e293b;">${item.name}</div>
          <div style="color: #64748b; font-size: 0.9rem;">${item.price} ₺</div>
        </div>
        <div class="order-item-qty">
          <button class="qty-btn" onclick="window.updateQtyNew(${item.tempId}, -1)">-</button>
          <span style="font-weight: 600; width: 20px; text-align: center;">${item.qty}</span>
          <button class="qty-btn" onclick="window.updateQtyNew(${item.tempId}, 1)">+</button>
        </div>
        <div style="font-weight: bold; margin-left: 20px;">${itemTotal} ₺</div>
      </div>
    `;
    newOrderList.appendChild(div);
  });

  newOrderTotalDisplay.textContent = `${total} ₺`;
  if(mobileCartTotalDisplay) mobileCartTotalDisplay.textContent = `${total} ₺`;
}

saveOrderBtn.addEventListener('click', async () => {
  if (!currentTableId || newOrdersArray.length === 0) return;

  saveOrderBtn.textContent = "Gönderiliyor...";
  saveOrderBtn.disabled = true;

  const now = Date.now();
  const newItemsFormatted = newOrdersArray.map(o => ({
    id: o.id,
    name: o.name,
    price: o.price,
    qty: o.qty,
    status: 'bekliyor',
    timestamp: now
  }));

  const existingOrders = currentTableData.orders || [];
  const finalOrders = [...existingOrders, ...newItemsFormatted];
  
  // Yeni toplam tutarı hesapla
  const newTotal = finalOrders.reduce((sum, item) => sum + (item.price * item.qty), 0);

  try {
    await updateDoc(doc(db, "tables", currentTableId), {
      status: 'occupied',
      orders: finalOrders,
      total: newTotal
    });
    
    newOrdersArray = []; // Temizle
    renderNewOrderList();
    if(mobileCartSection) mobileCartSection.classList.remove('expanded');
    showScreen('selection'); // Eklendikten sonra ana modal menüye dön
  } catch (error) {
    alert("Hata oluştu.");
  } finally {
    saveOrderBtn.textContent = "Mutfak/Bar'a Gönder";
    saveOrderBtn.disabled = false;
  }
});


// --- ADİSYON / DETAY EKRANI ---
function renderDetailsScreen() {
  detailsOrderList.innerHTML = '';
  
  const orders = currentTableData.orders || [];
  const total = currentTableData.total || 0;
  
  if (orders.length === 0) {
    detailsOrderList.innerHTML = '<p style="color: #64748b; text-align: center;">Bu masada henüz sipariş yok.</p>';
  }

  orders.forEach(item => {
    let statusClass = item.status === 'bekliyor' ? 'bekliyor' : 'teslim_edildi';
    let statusText = item.status === 'bekliyor' ? 'Hazırlanıyor' : 'Teslim Edildi';

    const div = document.createElement('div');
    div.className = `detail-list-item ${statusClass}`;
    div.innerHTML = `
      <div class="detail-info">
        <h4>${item.qty}x ${item.name}</h4>
        <p>${item.price} ₺ / Adet</p>
        <div style="margin-top: 8px;">
           <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
      </div>
      <div class="detail-price">
        ${item.price * item.qty} ₺
      </div>
    `;
    detailsOrderList.appendChild(div);
  });

  detailsTotalDisplay.textContent = `${total} ₺`;
}

checkoutBtn.addEventListener('click', async () => {
  if (!currentTableId || (currentTableData.orders || []).length === 0) {
    alert("Hesap yok."); return;
  }
  const pending = (currentTableData.orders || []).filter(o => o.status === 'bekliyor');
  if (pending.length > 0) {
    if(!confirm("Teslim edilmemiş ürünler var! Yinede hesabı kapat?")) return;
  }
  if (confirm(`Toplam ${currentTableData.total} ₺ ödendi olarak işaretlenecek.`)) {
    try {
      await updateDoc(doc(db, "tables", currentTableId), { status: 'empty', orders: [], total: 0 });
      tableModal.classList.remove('active');
    } catch(e) {}
  }
});

clearTableBtn.addEventListener('click', async () => {
  if (!currentTableId) return;
  if (confirm("Bu masanın tüm siparişleri İPTAL edilecek!")) {
    try {
      await updateDoc(doc(db, "tables", currentTableId), { status: 'empty', orders: [], total: 0 });
      tableModal.classList.remove('active');
    } catch(e) {}
  }
});
