import { db, auth, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, signInWithEmailAndPassword, onAuthStateChanged, signOut, onSnapshot } from './firebase-config.js';

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginBtn = document.getElementById('loginBtn');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const refreshMenuBtn = document.getElementById('refreshMenuBtn');
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
let unsubscribeTables = null;

// Auth State Observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';

    const backToAdminBtn = document.getElementById('backToAdminBtn');
    if (backToAdminBtn) {
      const email = (user.email || '').toLowerCase().trim();
      if (!email.includes('garson')) {
        backToAdminBtn.style.display = 'inline-flex';
      } else {
        backToAdminBtn.style.display = 'none';
      }
    }

    loadMenu();
    listenToTables();
  } else {
    if (unsubscribeTables) {
      unsubscribeTables();
      unsubscribeTables = null;
    }
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
logoutBtn.addEventListener('click', () => {
  if (unsubscribeTables) {
    unsubscribeTables();
    unsubscribeTables = null;
  }
  signOut(auth);
});

if (refreshMenuBtn) {
  refreshMenuBtn.addEventListener('click', async () => {
    refreshMenuBtn.disabled = true;
    const oldText = refreshMenuBtn.textContent;
    refreshMenuBtn.textContent = 'Yenileniyor...';
    await loadMenu(true);
    refreshMenuBtn.textContent = 'Güncellendi ✓';
    setTimeout(() => {
      refreshMenuBtn.textContent = oldText;
      refreshMenuBtn.disabled = false;
    }, 1500);
  });
}


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

const GARSON_CACHE_KEY = 'saldamis_garson_menu_v2';
const GARSON_CACHE_TIME = 'saldamis_garson_menu_time_v2';
const GARSON_CACHE_TTL = 30 * 60 * 1000; // 30 dakika önbellek

async function loadMenu(forceRefresh = false) {
  try {
    let items = null;
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(GARSON_CACHE_KEY);
        const cachedTime = localStorage.getItem(GARSON_CACHE_TIME);
        if (cached && cachedTime && (Date.now() - Number(cachedTime) < GARSON_CACHE_TTL)) {
          items = JSON.parse(cached);
        }
      } catch (e) {}
    }

    if (!items) {
      // 1. Önce optimize edilmiş tek dokümanı oku (1 okuma)
      try {
        const singleSnap = await getDoc(doc(db, "publicData", "menu"));
        if (singleSnap.exists()) {
          const sData = singleSnap.data();
          if (sData.categories && Array.isArray(sData.categories)) {
            sData.categories.forEach(c => {
              if (c.value) {
                categoryTitles[c.value] = c.label || c.value;
                if (!menuOrder.includes(c.value)) menuOrder.push(c.value);
              }
            });
          }
          if (sData.items && sData.items.length > 0) {
            items = sData.items;
          }
        }
      } catch (e) {}

      // 2. Yoksa koleksiyondan oku
      if (!items) {
        const querySnapshot = await getDocs(collection(db, "menuItems"));
        items = [];
        querySnapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
      }

      try {
        localStorage.setItem(GARSON_CACHE_KEY, JSON.stringify(items));
        localStorage.setItem(GARSON_CACHE_TIME, String(Date.now()));
      } catch (e) {}
    }

    const categoriesSet = new Set();
    menuItems = items || [];

    menuItems.forEach((item) => {
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
  if (unsubscribeTables) {
    unsubscribeTables();
    unsubscribeTables = null;
  }
  unsubscribeTables = onSnapshot(collection(db, "tables"), (snapshot) => {
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
  const now = Date.now();
  const allPendingItems = [];

  allTablesData.forEach(table => {
    if (!table.orders || !Array.isArray(table.orders)) return;
    
    table.orders.forEach((orderItem, index) => {
      if (orderItem.status === 'bekliyor') {
        allPendingItems.push({
          tableId: table.id,
          tableNumber: table.number,
          orderIndex: index,
          orderUid: orderItem.uid || null,
          item: orderItem,
          timestamp: orderItem.timestamp || 0
        });
      }
    });
  });

  if (allPendingItems.length === 0) {
    pendingOrdersGrid.innerHTML = '<p style="color: #94a3b8; padding: 10px;">Şu an bekleyen sipariş yok.</p>';
    return;
  }

  // Siparişleri kronolojik (en eskiden en yeniye) sırala: İlk sipariş edilen en üstte
  allPendingItems.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  allPendingItems.forEach(entry => {
    const { tableId, tableNumber, orderIndex, orderUid, item, timestamp } = entry;
    const diffMinutes = Math.floor((now - timestamp) / 60000);
    const isUrgent = diffMinutes >= 15;
    
    let timeText = diffMinutes === 0 ? "Az önce" : `${diffMinutes} dk önce`;
    if (isNaN(diffMinutes) || timestamp === 0) timeText = "Az önce";

    const div = document.createElement('div');
    div.className = 'pending-order-card';

    const safeUid = orderUid ? `'${orderUid}'` : 'null';
    const itemTotal = (item.price && item.qty) ? `${item.price * item.qty} ₺` : '';

    div.innerHTML = `
      <div class="pending-order-header">
        <div class="pending-table-tag">
          <span class="pending-table-tag-dot"></span>
          <span>${tableNumber}</span>
        </div>
        <span class="time-badge ${isUrgent ? 'urgent' : ''}">${timeText}</span>
      </div>
      <div class="pending-item-body">
        <div class="pending-item-name">
          <span class="pending-item-qty">${item.qty}x</span>
          <span>${item.name}</span>
        </div>
        ${itemTotal ? `<span class="pending-item-price">${itemTotal}</span>` : ''}
      </div>
      <div class="pending-order-actions">
        <button class="btn-mark-delivered" onclick="window.markItemDelivered('${tableId}', ${safeUid}, ${orderIndex})">
          ✓ Teslim Edildi
        </button>
        <button class="btn-cancel-pending" onclick="window.cancelPendingItem('${tableId}', ${safeUid}, ${orderIndex})">
          ✕ İptal
        </button>
      </div>
    `;
    pendingOrdersGrid.appendChild(div);
  });
}

window.markItemDelivered = async (tableId, orderUid, orderIndex) => {
  const table = allTablesData.find(t => t.id === tableId);
  if (!table || !table.orders) return;

  const updatedOrders = [...table.orders];
  let targetIndex = -1;

  if (orderUid) {
    targetIndex = updatedOrders.findIndex(o => o.uid === orderUid && o.status === 'bekliyor');
  }
  if (targetIndex === -1 && typeof orderIndex === 'number' && updatedOrders[orderIndex] && updatedOrders[orderIndex].status === 'bekliyor') {
    targetIndex = orderIndex;
  }

  if (targetIndex !== -1) {
    updatedOrders[targetIndex] = {
      ...updatedOrders[targetIndex],
      status: 'teslim_edildi'
    };

    try {
      await updateDoc(doc(db, "tables", tableId), { orders: updatedOrders });
    } catch (error) {
      console.error("Hata:", error);
      alert("Sipariş güncellenirken hata oluştu.");
    }
  }
};

window.cancelPendingItem = async (tableId, orderUid, orderIndex) => {
  const table = allTablesData.find(t => t.id === tableId);
  if (!table || !table.orders) return;

  const updatedOrders = [...table.orders];
  let targetIndex = -1;

  if (orderUid) {
    targetIndex = updatedOrders.findIndex(o => o.uid === orderUid);
  }
  if (targetIndex === -1 && typeof orderIndex === 'number' && updatedOrders[orderIndex]) {
    targetIndex = orderIndex;
  }

  if (targetIndex === -1) return;
  const item = updatedOrders[targetIndex];

  if (!confirm(`'${table.number}' masasındaki '${item.qty}x ${item.name}' siparişini iptal etmek istediğinize emin misiniz?`)) {
    return;
  }

  updatedOrders.splice(targetIndex, 1);
  const newTotal = updatedOrders.reduce((sum, it) => sum + (it.price * it.qty), 0);
  const newStatus = updatedOrders.length === 0 ? 'empty' : table.status;

  try {
    await updateDoc(doc(db, "tables", tableId), {
      orders: updatedOrders,
      total: newTotal,
      status: newStatus
    });
  } catch (error) {
    console.error("Hata:", error);
    alert("Sipariş iptal edilirken hata oluştu.");
  }
};

// Eski fonksiyon çağrıları için geriye dönük uyumluluk
window.markAsDelivered = async (tableId, timeKey) => {
  const table = allTablesData.find(t => t.id === tableId);
  if (!table || !table.orders) return;

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
          <div style="font-weight: 600; color: #f8fafc;">${item.name}</div>
          <div style="color: #94a3b8; font-size: 0.85rem;">${item.price} ₺</div>
        </div>
        <div class="order-item-qty">
          <button class="qty-btn" onclick="window.updateQtyNew(${item.tempId}, -1)">-</button>
          <span style="font-weight: 600; width: 20px; text-align: center; color: #ffffff;">${item.qty}</span>
          <button class="qty-btn" onclick="window.updateQtyNew(${item.tempId}, 1)">+</button>
        </div>
        <div style="font-weight: 700; margin-left: 15px; color: #34d399;">${itemTotal} ₺</div>
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
  const newItemsFormatted = newOrdersArray.map((o, idx) => ({
    uid: `${now}_${idx}_${Math.random().toString(36).substr(2, 6)}`,
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

  orders.forEach((item, index) => {
    let statusClass = item.status === 'bekliyor' ? 'bekliyor' : 'teslim_edildi';
    let statusText = item.status === 'bekliyor' ? 'Hazırlanıyor' : 'Teslim Edildi';

    const div = document.createElement('div');
    div.className = `detail-list-item ${statusClass}`;
    div.innerHTML = `
      <div class="detail-info">
        <h4>${item.qty}x ${item.name}</h4>
        <p>${item.price} ₺ / Adet</p>
        <div style="margin-top: 8px; display: flex; align-items: center; gap: 10px;">
           <span class="status-badge ${statusClass}">${statusText}</span>
           ${item.status === 'bekliyor' ? `
             <button class="btn-cancel-pending" style="padding: 4px 10px; font-size: 0.75rem; flex: none;" onclick="window.cancelPendingItem('${currentTableId}', ${item.uid ? `'${item.uid}'` : 'null'}, ${index})">İptal Et ✕</button>
           ` : ''}
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
