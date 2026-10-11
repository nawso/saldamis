import { db, auth, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, signInWithEmailAndPassword, onAuthStateChanged, signOut } from './firebase-config.js';

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginBtn = document.getElementById('loginBtn');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

const menuItemsList = document.getElementById('menuItemsList');
const saveItemBtn = document.getElementById('saveItemBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const itemNameInput = document.getElementById('itemName');
const itemPriceInput = document.getElementById('itemPrice');
const itemDescInput = document.getElementById('itemDesc');
const itemCategoryInput = document.getElementById('itemCategory');
const editIdInput = document.getElementById('editId');
const formTitle = document.getElementById('formTitle');

// Auth State Observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    loadMenuItems();
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

// Logout
logoutBtn.addEventListener('click', () => {
  signOut(auth);
});

// Load Menu Items
async function loadMenuItems() {
  menuItemsList.innerHTML = '<p>Yükleniyor...</p>';
  try {
    const querySnapshot = await getDocs(collection(db, "menuItems"));
    menuItemsList.innerHTML = '';
    
    querySnapshot.forEach((doc) => {
      const item = doc.data();
      const div = document.createElement('div');
      div.className = 'menu-item-row';
      div.innerHTML = `
        <div class="menu-item-info">
          <strong>${item.name}</strong> - ${item.price} ₺ 
          <br><small style="color: #64748b;">Kategori: ${item.category}</small>
        </div>
        <div class="menu-item-actions">
          <button class="btn-edit" data-id="${doc.id}" data-name="${item.name}" data-price="${item.price}" data-desc="${item.desc || ''}" data-category="${item.category}">Düzenle</button>
          <button class="btn-delete" data-id="${doc.id}">Sil</button>
        </div>
      `;
      menuItemsList.appendChild(div);
    });

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        editIdInput.value = e.target.dataset.id;
        itemNameInput.value = e.target.dataset.name;
        itemPriceInput.value = e.target.dataset.price;
        itemDescInput.value = e.target.dataset.desc;
        itemCategoryInput.value = e.target.dataset.category;
        
        formTitle.textContent = "Ürünü Düzenle";
        saveItemBtn.textContent = "Güncelle";
        cancelEditBtn.style.display = "inline-block";
        window.scrollTo(0,0);
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if(confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
          await deleteDoc(doc(db, "menuItems", e.target.dataset.id));
          loadMenuItems();
        }
      });
    });

  } catch (error) {
    console.error("Veri çekme hatası: ", error);
    menuItemsList.innerHTML = '<p>Menü yüklenirken bir hata oluştu.</p>';
  }
}

// Save/Update Item
saveItemBtn.addEventListener('click', async () => {
  const name = itemNameInput.value.trim();
  const price = Number(itemPriceInput.value);
  const desc = itemDescInput.value.trim();
  const category = itemCategoryInput.value;
  const id = editIdInput.value;

  if(!name || !price) {
    alert("Lütfen ürün adı ve fiyatını giriniz.");
    return;
  }

  saveItemBtn.disabled = true;
  saveItemBtn.textContent = "Kaydediliyor...";

  try {
    if (id) {
      // Update
      await updateDoc(doc(db, "menuItems", id), {
        name, price, desc, category
      });
    } else {
      // Add
      await addDoc(collection(db, "menuItems"), {
        name, price, desc, category
      });
    }
    
    // Reset form
    resetForm();
    loadMenuItems();
  } catch(error) {
    console.error("Hata: ", error);
    alert("Kaydedilirken hata oluştu!");
  } finally {
    saveItemBtn.disabled = false;
  }
});

// Cancel Edit
cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

function resetForm() {
  editIdInput.value = '';
  itemNameInput.value = '';
  itemPriceInput.value = '';
  itemDescInput.value = '';
  itemCategoryInput.value = 'kahvalti';
  formTitle.textContent = "Yeni Ürün Ekle";
  saveItemBtn.textContent = "Kaydet";
  cancelEditBtn.style.display = "none";
}
