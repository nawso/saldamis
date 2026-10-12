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
const activeWaiterBtn = document.getElementById('activeWaiterBtn');
const activeWaiterNameDisplay = document.getElementById('activeWaiterNameDisplay');
const cartWaiterNameDisplay = document.getElementById('cartWaiterNameDisplay');

// Modal Elements
const tableModal = document.getElementById('tableModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTableTitle = document.getElementById('modalTableTitle');

const btnGoAddOrder = document.getElementById('btnGoAddOrder');
const btnGoDetails = document.getElementById('btnGoDetails');
const btnMoveTable = document.getElementById('btnMoveTable');
const btnMoveTableFromDetails = document.getElementById('btnMoveTableFromDetails');
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
let activeWaiterName = localStorage.getItem('saldamis_active_waiter') || '';
let currentMoveContext = {
  mode: 'table', // 'table' | 'item'
  sourceTableId: null,
  orderUid: null,
  orderIndex: -1,
  item: null,
  qtyToMove: 1
};

function resolveDefaultWaiterName(user) {
  if (user?.displayName && user.displayName.trim()) {
    return user.displayName.trim();
  }
  if (user?.email) {
    const emailLower = user.email.toLowerCase().trim();
    if (emailLower.startsWith('admin') || emailLower.includes('admin@')) {
      return 'Admin';
    }
    const localPart = user.email.split('@')[0];
    const formatted = localPart
      .replace(/[._-]+/g, ' ')
      .replace(/([a-zA-Z]+)(\d+)/g, '$1 $2')
      .split(' ')
      .map(w => w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1))
      .join(' ');
    return formatted || 'Garson';
  }
  return 'Garson';
}

function updateActiveWaiterUI() {
  const name = activeWaiterName || 'Garson';
  if (activeWaiterNameDisplay) activeWaiterNameDisplay.textContent = name;
  if (cartWaiterNameDisplay) cartWaiterNameDisplay.textContent = name;
}

function promptChangeWaiter() {
  const current = activeWaiterName || (auth.currentUser ? resolveDefaultWaiterName(auth.currentUser) : 'Garson');
  const input = prompt("Aktif Garson / Yetkili Adı (Siparişlerde bu isim yer alacaktır):", current);
  if (input !== null) {
    const trimmed = input.trim();
    if (trimmed) {
      activeWaiterName = trimmed;
      localStorage.setItem('saldamis_active_waiter', trimmed);
      if (auth.currentUser) {
        localStorage.setItem(`saldamis_waiter_${auth.currentUser.uid}`, trimmed);
      }
      updateActiveWaiterUI();
    }
  }
}

if (activeWaiterBtn) {
  activeWaiterBtn.addEventListener('click', promptChangeWaiter);
}

// Auth State Observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';

    const userSpecificKey = `saldamis_waiter_${user.uid}`;
    let savedForUser = localStorage.getItem(userSpecificKey);
    const isUserAdmin = (user.email || '').toLowerCase().includes('admin');

    // Eğer bu kullanıcı için kayıtlı isim yoksa veya admin olmasına rağmen eski 'Garson' kalıntısıysa:
    if (!savedForUser || (isUserAdmin && savedForUser.toLowerCase() === 'garson')) {
      savedForUser = resolveDefaultWaiterName(user);
      localStorage.setItem(userSpecificKey, savedForUser);
    }

    activeWaiterName = savedForUser;
    localStorage.setItem('saldamis_active_waiter', activeWaiterName);
    updateActiveWaiterUI();

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
async function performLogin() {
  let userIdentifier = (emailInput.value || '').trim();
  const password = passwordInput.value;

  if (!userIdentifier || !password) {
    loginError.textContent = "Lütfen kullanıcı adınızı ve şifrenizi girin!";
    loginError.style.display = 'block';
    return;
  }

  // Kullanıcı adı '@' içermiyorsa otomatik olarak '@saldamis.com' ekle
  if (!userIdentifier.includes('@')) {
    userIdentifier = `${userIdentifier}@saldamis.com`;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Giriş Yapılıyor...';
  loginError.style.display = 'none';

  try {
    await signInWithEmailAndPassword(auth, userIdentifier, password);
  } catch (error) {
    console.error("Giriş hatası:", error);
    loginError.textContent = "Hatalı kullanıcı adı veya şifre!";
    loginError.style.display = 'block';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Giriş Yap →';
  }
}

loginBtn.addEventListener('click', performLogin);

if (emailInput) {
  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') passwordInput.focus();
  });
}

if (passwordInput) {
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performLogin();
  });
}
logoutBtn.addEventListener('click', () => {
  if (unsubscribeTables) {
    unsubscribeTables();
    unsubscribeTables = null;
  }
  localStorage.removeItem('saldamis_active_waiter');
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
    
    let timeText = diffMinutes === 0 ? "Az önce" : `${diffMinutes} dk`;
    if (isNaN(diffMinutes) || timestamp === 0) timeText = "Az önce";

    let waiterName = item.waiter;
    if ((!waiterName || waiterName.toLowerCase() === 'garson') && item.waiterEmail && item.waiterEmail.toLowerCase().includes('admin')) {
      waiterName = 'Admin';
    }
    if (!waiterName) {
      waiterName = item.waiterEmail ? item.waiterEmail.split('@')[0] : 'Belirtilmedi';
    }
    let exactTime = item.timeStr;
    if (!exactTime && timestamp) {
      exactTime = new Date(timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }

    const div = document.createElement('div');
    div.className = 'pending-order-card';

    const safeUid = orderUid ? `'${orderUid}'` : 'null';
    const itemTotal = (item.price && item.qty) ? `${item.price * item.qty} ₺` : '';
    const numStr = String(tableNumber || '');
    const tableDisplay = isNaN(Number(numStr)) ? numStr : `Masa ${numStr}`;

    div.innerHTML = `
      <div class="pending-order-header">
        <div class="pending-table-tag">
          <span class="pending-table-tag-dot"></span>
          <span>${tableDisplay}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px; min-width: 0;">
          ${exactTime ? `<span class="pending-clock-badge">🕒 ${exactTime}</span>` : ''}
          <span class="time-badge ${isUrgent ? 'urgent' : ''}">${timeText}</span>
        </div>
      </div>
      <div class="pending-item-body">
        <div class="pending-item-name">
          <span class="pending-item-qty">${item.qty}x</span>
          <span>${item.name}</span>
        </div>
        ${itemTotal ? `<span class="pending-item-price">${itemTotal}</span>` : ''}
      </div>
      <div class="pending-order-meta">
        <span class="pending-waiter-badge">
          👤 Garson: <strong>${waiterName}</strong>
        </span>
      </div>
      <div class="pending-order-actions">
        <button class="btn-mark-delivered" onclick="window.markItemDelivered('${tableId}', ${safeUid}, ${orderIndex})" title="Teslim Edildi">
          ✓ Teslim
        </button>
        <button class="btn-cancel-pending" onclick="window.cancelPendingItem('${tableId}', ${safeUid}, ${orderIndex})" title="Siparişi İptal Et">
          ✕ İptal
        </button>
      </div>
    `;
    pendingOrdersGrid.appendChild(div);
  });
}

const activeDeliveryOps = new Set();
const activeCancelOps = new Set();

window.markItemDelivered = async (tableId, orderUid, orderIndex) => {
  const opKey = `${tableId}_${orderUid || orderIndex}`;
  if (activeDeliveryOps.has(opKey)) return;

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
    activeDeliveryOps.add(opKey);
    updatedOrders[targetIndex] = {
      ...updatedOrders[targetIndex],
      status: 'teslim_edildi'
    };

    try {
      await updateDoc(doc(db, "tables", tableId), { orders: updatedOrders });
    } catch (error) {
      console.error("Hata:", error);
      alert("Sipariş güncellenirken hata oluştu.");
    } finally {
      setTimeout(() => activeDeliveryOps.delete(opKey), 800);
    }
  }
};

window.cancelPendingItem = async (tableId, orderUid, orderIndex) => {
  const opKey = `${tableId}_${orderUid || orderIndex}`;
  if (activeCancelOps.has(opKey)) return;

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

  activeCancelOps.add(opKey);
  updatedOrders.splice(targetIndex, 1);
  const newTotal = updatedOrders.reduce((sum, it) => sum + (it.price * it.qty), 0);
  const newStatus = updatedOrders.length === 0 ? 'empty' : table.status;

  const now = Date.now();
  const timeFormatted = new Date(now).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = new Date(now).toLocaleDateString('tr-TR');

  try {
    await updateDoc(doc(db, "tables", tableId), {
      orders: updatedOrders,
      total: newTotal,
      status: newStatus
    });

    // Garson hareketini kaydet
    await addDoc(collection(db, "waiterActivities"), {
      type: 'item_cancelled',
      actionText: 'Ürün İptal Edildi',
      waiter: activeWaiterName || 'Garson',
      waiterEmail: auth.currentUser?.email || '',
      originalWaiter: item.waiter || (item.waiterEmail ? item.waiterEmail.split('@')[0] : 'Belirtilmedi'),
      tableNumber: String(table.number || ''),
      tableId: tableId,
      items: [{ name: item.name, qty: item.qty, price: item.price }],
      total: (item.price || 0) * (item.qty || 1),
      timestamp: now,
      timeStr: timeFormatted,
      dateStr: dateFormatted
    });
  } catch (error) {
    console.error("Hata:", error);
    alert("Sipariş iptal edilirken hata oluştu.");
  } finally {
    setTimeout(() => activeCancelOps.delete(opKey), 800);
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
  const numStr = String(table.number || '');
  modalTableTitle.textContent = isNaN(Number(numStr)) ? numStr : `Masa ${numStr}`;
  
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
btnBackFromMove.addEventListener('click', () => {
  if (currentMoveContext.mode === 'item') {
    showScreen('details');
  } else {
    showScreen('selection');
  }
});

btnMoveTable.addEventListener('click', () => {
  const currentOrders = currentTableData.orders || [];
  if (currentOrders.length === 0) {
    alert("Bu masada taşınacak sipariş yok.");
    return;
  }
  currentMoveContext = {
    mode: 'table',
    sourceTableId: currentTableId,
    orderUid: null,
    orderIndex: -1,
    item: null,
    qtyToMove: 0
  };
  showScreen('move');
});

if (btnMoveTableFromDetails) {
  btnMoveTableFromDetails.addEventListener('click', () => {
    const currentOrders = currentTableData.orders || [];
    if (currentOrders.length === 0) {
      alert("Bu masada taşınacak sipariş yok.");
      return;
    }
    currentMoveContext = {
      mode: 'table',
      sourceTableId: currentTableId,
      orderUid: null,
      orderIndex: -1,
      item: null,
      qtyToMove: 0
    };
    showScreen('move');
  });
}

// Tekil Sipariş Taşıma Başlatıcı (Hazırlanıyor veya Teslim Edildi fark etmeksizin)
window.startMoveOrderItem = (sourceTableId, orderUid, orderIndex) => {
  const table = allTablesData.find(t => t.id === sourceTableId) || currentTableData;
  if (!table || !table.orders) return;

  let targetIndex = -1;
  if (orderUid) {
    targetIndex = table.orders.findIndex(o => o.uid === orderUid);
  }
  if (targetIndex === -1 && typeof orderIndex === 'number' && table.orders[orderIndex]) {
    targetIndex = orderIndex;
  }
  if (targetIndex === -1) {
    alert("Sipariş bulunamadı.");
    return;
  }

  const item = table.orders[targetIndex];
  let qtyToMove = item.qty || 1;

  if (item.qty > 1) {
    const inputQty = prompt(`"${item.name}" siparişinden ${item.qty} adet bulunuyor.\nKaç adedini başka masaya aktarmak istiyorsunuz? (1 - ${item.qty}):`, item.qty);
    if (inputQty === null) return;
    const parsed = parseInt(inputQty, 10);
    if (isNaN(parsed) || parsed <= 0 || parsed > item.qty) {
      alert(`Lütfen 1 ile ${item.qty} arasında geçerli bir adet girin.`);
      return;
    }
    qtyToMove = parsed;
  }

  currentMoveContext = {
    mode: 'item',
    sourceTableId: sourceTableId,
    orderUid: orderUid,
    orderIndex: targetIndex,
    item: item,
    qtyToMove: qtyToMove
  };

  showScreen('move');
};

function renderMoveTableScreen() {
  moveTableList.innerHTML = '';
  const moveTitle = document.getElementById('moveTableTitle');
  const moveSubtitle = document.getElementById('moveTableSubtitle');

  if (currentMoveContext.mode === 'item' && currentMoveContext.item) {
    const it = currentMoveContext.item;
    const statusNote = it.status === 'teslim_edildi' ? 'Teslim Edildi' : 'Hazırlanıyor';
    if (moveTitle) moveTitle.textContent = `Siparişi Taşı: ${currentMoveContext.qtyToMove}x ${it.name}`;
    if (moveSubtitle) moveSubtitle.textContent = `[${statusNote}] durumundaki siparişi aktaracağınız hedef masaya tıklayın:`;
  } else {
    if (moveTitle) moveTitle.textContent = "Tüm Masayı Taşı";
    if (moveSubtitle) moveSubtitle.textContent = "Masanın tüm siparişlerini aktaracağınız hedef masaya tıklayın:";
  }
  
  allTablesData.forEach(table => {
    if (table.id === currentTableId) return; // Kendi masasını gösterme
    
    const hasWaitingOrder = (table.orders || []).some(o => o.status === 'bekliyor');
    let cssClass = table.status === 'empty' ? 'empty' : 'occupied';
    if (hasWaitingOrder) cssClass = 'waiting';

    const statusText = table.status === 'empty' ? 'Boş' : (hasWaitingOrder ? 'Sipariş Bekliyor' : 'Dolu');
    const tableTotal = table.total ? ` • ${table.total} ₺` : '';
    const tableNum = String(table.number || '');
    const tableLabel = isNaN(Number(tableNum)) ? tableNum : `Masa ${tableNum}`;

    const div = document.createElement('div');
    div.className = `table-card ${cssClass}`;
    div.innerHTML = `
      <h3 style="font-size: 1.2rem;">${tableLabel}</h3>
      <div class="table-status" style="font-size: 0.8rem;">${statusText}${tableTotal}</div>
    `;
    div.addEventListener('click', () => {
      if (currentMoveContext.mode === 'item') {
        executeMoveOrderItem(table);
      } else {
        executeMoveTable(table);
      }
    });
    moveTableList.appendChild(div);
  });
}

// Tek Bir Siparişi Hedef Masaya Taşı
async function executeMoveOrderItem(targetTable) {
  const { sourceTableId, orderUid, orderIndex, item, qtyToMove } = currentMoveContext;
  const sourceTable = allTablesData.find(t => t.id === sourceTableId) || currentTableData;
  if (!sourceTable || !sourceTable.orders) return;

  const targetName = isNaN(Number(targetTable.number)) ? targetTable.number : `Masa ${targetTable.number}`;
  const sourceName = isNaN(Number(sourceTable.number)) ? sourceTable.number : `Masa ${sourceTable.number}`;

  if (!confirm(`"${qtyToMove}x ${item.name}" siparişi ${sourceName} masasından ${targetName} masasına taşınacaktır. Onaylıyor musunuz?`)) {
    return;
  }

  try {
    const updatedSourceOrders = [...sourceTable.orders];
    let srcIdx = -1;
    if (orderUid) {
      srcIdx = updatedSourceOrders.findIndex(o => o.uid === orderUid);
    }
    if (srcIdx === -1 && typeof orderIndex === 'number' && updatedSourceOrders[orderIndex]) {
      srcIdx = orderIndex;
    }
    if (srcIdx === -1) {
      alert("Sipariş bulunamadı.");
      return;
    }

    const currentItem = updatedSourceOrders[srcIdx];
    
    // Eğer tüm adet taşınıyorsa kaynak listeden çıkar, değilse adedini düşür
    if (currentItem.qty <= qtyToMove) {
      updatedSourceOrders.splice(srcIdx, 1);
    } else {
      updatedSourceOrders[srcIdx] = {
        ...currentItem,
        qty: currentItem.qty - qtyToMove
      };
    }

    // Hedef masaya aktarılacak kopya (durum, garson, saat bilgisi aynen korunur)
    const transferredItem = {
      ...currentItem,
      uid: `${Date.now()}_transferred_${Math.random().toString(36).substr(2, 6)}`,
      qty: qtyToMove,
      status: currentItem.status || 'bekliyor',
      waiter: currentItem.waiter || activeWaiterName || 'Garson',
      waiterEmail: currentItem.waiterEmail || auth.currentUser?.email || '',
      timestamp: currentItem.timestamp || Date.now(),
      timeStr: currentItem.timeStr || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      dateStr: currentItem.dateStr || new Date().toLocaleDateString('tr-TR')
    };

    const targetOrders = targetTable.orders || [];
    const newTargetOrders = [...targetOrders, transferredItem];

    const newSourceTotal = updatedSourceOrders.reduce((sum, it) => sum + (it.price * it.qty), 0);
    const newSourceStatus = updatedSourceOrders.length === 0 ? 'empty' : sourceTable.status;
    const newTargetTotal = newTargetOrders.reduce((sum, it) => sum + (it.price * it.qty), 0);

    // 1. Kaynak masayı güncelle
    await updateDoc(doc(db, "tables", sourceTableId), {
      orders: updatedSourceOrders,
      total: newSourceTotal,
      status: newSourceStatus
    });

    // 2. Hedef masayı güncelle
    await updateDoc(doc(db, "tables", targetTable.id), {
      orders: newTargetOrders,
      total: newTargetTotal,
      status: 'occupied'
    });

    // 3. Garson hareket günlüğüne kaydet
    try {
      const now = Date.now();
      await addDoc(collection(db, "waiterActivities"), {
        type: 'order_moved',
        actionText: 'Sipariş Masaya Taşındı',
        waiter: activeWaiterName || 'Garson',
        waiterEmail: auth.currentUser?.email || '',
        sourceTableNumber: String(sourceTable.number),
        targetTableNumber: String(targetTable.number),
        tableNumber: `${sourceTable.number} ➔ ${targetTable.number}`,
        items: [{ name: item.name, qty: qtyToMove, price: item.price, status: item.status }],
        total: (item.price || 0) * qtyToMove,
        timestamp: now,
        timeStr: new Date(now).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        dateStr: new Date(now).toLocaleDateString('tr-TR')
      });
    } catch (logErr) {
      console.warn("Taşıma logu yazılamadı:", logErr);
    }

    // Yerel objeyi güncelle ve adisyona dön
    if (currentTableData && currentTableData.id === sourceTableId) {
      currentTableData.orders = updatedSourceOrders;
      currentTableData.total = newSourceTotal;
      currentTableData.status = newSourceStatus;
    }

    alert(`"${qtyToMove}x ${item.name}" siparişi başarıyla ${targetName} masasına taşındı.`);
    showScreen('details');

  } catch (error) {
    console.error("Sipariş taşıma hatası:", error);
    alert("Sipariş taşınırken hata oluştu.");
  }
}

// Tüm Masayı Başka Masaya Taşı
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

    // Aktivite kaydı
    try {
      const now = Date.now();
      await addDoc(collection(db, "waiterActivities"), {
        type: 'table_moved',
        actionText: 'Tüm Masa Taşındı',
        waiter: activeWaiterName || 'Garson',
        waiterEmail: auth.currentUser?.email || '',
        sourceTableNumber: String(currentTableData.number),
        targetTableNumber: String(targetTable.number),
        tableNumber: `${currentTableData.number} ➔ ${targetTable.number}`,
        items: currentOrders.map(o => ({ name: o.name, qty: o.qty, price: o.price })),
        total: currentTableData.total || 0,
        timestamp: now,
        timeStr: new Date(now).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        dateStr: new Date(now).toLocaleDateString('tr-TR')
      });
    } catch (logErr) {
      console.warn("Log hatası:", logErr);
    }

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
  const timeFormatted = new Date(now).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  let waiter = activeWaiterName;
  const currentUserEmail = (auth.currentUser?.email || '').toLowerCase();
  const isCurrentUserAdmin = currentUserEmail.includes('admin');
  if (!waiter || (isCurrentUserAdmin && waiter.toLowerCase() === 'garson')) {
    waiter = resolveDefaultWaiterName(auth.currentUser);
    activeWaiterName = waiter;
    updateActiveWaiterUI();
  }

  const newItemsFormatted = newOrdersArray.map((o, idx) => ({
    uid: `${now}_${idx}_${Math.random().toString(36).substr(2, 6)}`,
    id: o.id,
    name: o.name,
    price: o.price,
    qty: o.qty,
    status: 'bekliyor',
    timestamp: now,
    timeStr: timeFormatted,
    dateStr: dateFormatted,
    waiter: waiter,
    waiterEmail: auth.currentUser?.email || ''
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
    
    // Garson sipariş hareketini kaydet
    try {
      await addDoc(collection(db, "waiterActivities"), {
        type: 'order_added',
        actionText: 'Sipariş Girildi',
        waiter: waiter,
        waiterEmail: auth.currentUser?.email || '',
        tableNumber: String(currentTableData.number || ''),
        tableId: currentTableId,
        items: newOrdersArray.map(o => ({ name: o.name, qty: o.qty, price: o.price })),
        total: newOrdersArray.reduce((sum, it) => sum + (it.price * it.qty), 0),
        timestamp: now,
        timeStr: timeFormatted,
        dateStr: dateFormatted
      });
    } catch (logErr) {
      console.warn("Aktivite loglanamadı:", logErr);
    }

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
  
  const countBadge = document.getElementById('detailsCountPill');
  if (countBadge) {
    countBadge.textContent = `${orders.length} Kalem Sipariş`;
  }

  if (orders.length === 0) {
    detailsOrderList.innerHTML = '<p style="color: #64748b; text-align: center; padding: 25px 10px;">Bu masada henüz sipariş yok.</p>';
  }

  orders.forEach((item, index) => {
    let statusClass = item.status === 'bekliyor' ? 'bekliyor' : 'teslim_edildi';
    let statusText = item.status === 'bekliyor' ? 'Hazırlanıyor' : 'Teslim Edildi';
    let waiterName = item.waiter;
    if ((!waiterName || waiterName.toLowerCase() === 'garson') && item.waiterEmail && item.waiterEmail.toLowerCase().includes('admin')) {
      waiterName = 'Admin';
    }
    if (!waiterName) {
      waiterName = item.waiterEmail ? item.waiterEmail.split('@')[0] : 'Belirtilmedi';
    }
    let timeStr = item.timeStr;
    if (!timeStr && item.timestamp) {
      timeStr = new Date(item.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    const displayTime = timeStr || '-';

    const div = document.createElement('div');
    div.className = `detail-list-item ${statusClass}`;
    div.innerHTML = `
      <div class="detail-info" style="flex: 1; padding-right: 10px; min-width: 0;">
        <div style="display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap;">
          <h4 style="margin: 0; font-size: 0.94rem; color: #ffffff; font-weight: 700;">${item.qty}x ${item.name}</h4>
          <span style="color: #94a3b8; font-size: 0.76rem;">(${item.price} ₺ / Adet)</span>
        </div>
        <div class="order-meta-badges">
          <span class="meta-pill meta-waiter" title="Siparişi Giren Garson">
            <span>👤</span> <strong>${waiterName}</strong>
          </span>
          <span class="meta-pill meta-time" title="Sipariş Giriş Saati">
            <span>🕒</span> <strong>${displayTime}</strong>
          </span>
          <span class="status-badge ${statusClass}">${statusText}</span>
          
          <button type="button" class="btn-move-item" title="Bu siparişi başka masaya taşı" onclick="window.startMoveOrderItem('${currentTableId}', ${item.uid ? `'${item.uid}'` : 'null'}, ${index})">
            🔄 Taşı
          </button>

          ${item.status === 'bekliyor' ? `
            <button class="btn-cancel-pending" style="padding: 2px 7px; font-size: 0.68rem; flex: none; border-radius: 5px;" onclick="window.cancelPendingItem('${currentTableId}', ${item.uid ? `'${item.uid}'` : 'null'}, ${index})">İptal ✕</button>
          ` : ''}
        </div>
      </div>
      <div class="detail-price" style="flex: none;">
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
  const closedOrders = currentTableData.orders || [];
  const closedTotal = currentTableData.total || 0;
  if (confirm(`Toplam ${closedTotal} ₺ ödendi olarak işaretlenecek.`)) {
    checkoutBtn.disabled = true;
    try {
      const now = Date.now();
      await updateDoc(doc(db, "tables", currentTableId), { status: 'empty', orders: [], total: 0 });
      tableModal.classList.remove('active');

      try {
        await addDoc(collection(db, "waiterActivities"), {
          type: 'table_checkout',
          actionText: 'Hesap Kapatıldı (Ödendi)',
          waiter: activeWaiterName || 'Garson',
          waiterEmail: auth.currentUser?.email || '',
          tableNumber: String(currentTableData.number || ''),
          tableId: currentTableId,
          items: closedOrders.map(o => ({ name: o.name, qty: o.qty, price: o.price })),
          total: closedTotal,
          timestamp: now,
          timeStr: new Date(now).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          dateStr: new Date(now).toLocaleDateString('tr-TR')
        });
      } catch (logErr) {
        console.warn("Aktivite loglanamadı:", logErr);
      }
    } catch(e) {
      console.error(e);
    } finally {
      checkoutBtn.disabled = false;
    }
  }
});

clearTableBtn.addEventListener('click', async () => {
  if (!currentTableId) return;
  const ordersToCancel = currentTableData.orders || [];
  const canceledTotal = currentTableData.total || 0;
  if (confirm("Bu masanın tüm siparişleri İPTAL edilecek!")) {
    clearTableBtn.disabled = true;
    try {
      const now = Date.now();
      await updateDoc(doc(db, "tables", currentTableId), { status: 'empty', orders: [], total: 0 });
      tableModal.classList.remove('active');

      if (ordersToCancel.length > 0) {
        try {
          await addDoc(collection(db, "waiterActivities"), {
            type: 'table_cancelled',
            actionText: 'Masa Siparişleri İptal Edildi (Boşaltıldı)',
            waiter: activeWaiterName || 'Garson',
            waiterEmail: auth.currentUser?.email || '',
            tableNumber: String(currentTableData.number || ''),
            tableId: currentTableId,
            items: ordersToCancel.map(o => ({ name: o.name, qty: o.qty, price: o.price })),
            total: canceledTotal,
            timestamp: now,
            timeStr: new Date(now).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            dateStr: new Date(now).toLocaleDateString('tr-TR')
          });
        } catch (logErr) {
          console.warn("Aktivite loglanamadı:", logErr);
        }
      }
    } catch(e) {
      console.error(e);
    } finally {
      clearTableBtn.disabled = false;
    }
  }
});

window.addEventListener('beforeunload', () => {
  if (unsubscribeTables) {
    unsubscribeTables();
    unsubscribeTables = null;
  }
});
