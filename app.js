/**
 * SALDAMIS Cafe & Restoran & Hediyelik Eşya
 * Etkileşimli Web Uygulaması Mantığı (Vanilla JS)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Modüler Header Yükleme
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    try {
      const response = await fetch('header.html');
      const html = await response.text();
      headerPlaceholder.outerHTML = html;
    } catch (e) {
      console.error('Header yüklenemedi:', e);
    }
  }

  // 1. Lucide İkonlarını Başlat
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Header Scroll Efekti
  const header = document.querySelector('.site-header');
  const backToTopBtn = document.getElementById('backToTopBtn');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }

    if (window.scrollY > 400) {
      backToTopBtn?.classList.add('visible');
    } else {
      backToTopBtn?.classList.remove('visible');
    }
  });

  backToTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 3. Mobil Menü Aç/Kapat
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('navLinks');

  mobileToggle?.addEventListener('click', () => {
    navLinks?.classList.toggle('mobile-active');
    const icon = mobileToggle.querySelector('i');
    if (navLinks?.classList.contains('mobile-active')) {
      mobileToggle.innerHTML = '<i data-lucide="x"></i>';
    } else {
      mobileToggle.innerHTML = '<i data-lucide="menu"></i>';
    }
    if (window.lucide) window.lucide.createIcons();
  });

  // Menü linklerine tıklanınca mobilde menüyü kapat
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks?.classList.remove('mobile-active');
      if (mobileToggle) {
        mobileToggle.innerHTML = '<i data-lucide="menu"></i>';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  });

  // 4. Menü Filtreleme Sistemi (Kategori Sekmeleri)
  const tabBtns = document.querySelectorAll('.menu-tab-btn');
  const menuCards = document.querySelectorAll('.menu-card');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetCategory = btn.getAttribute('data-category');

      menuCards.forEach(card => {
        const itemCategory = card.getAttribute('data-category');
        if (targetCategory === 'all' || itemCategory === targetCategory) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 20);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 5. Tur & Grup Hesaplayıcı (B2B Acenta & Rehber)
  const paxRange = document.getElementById('paxRange');
  const paxValueDisplay = document.getElementById('paxValueDisplay');
  const tourMenuType = document.getElementById('tourMenuType');
  const calcTotalDisplay = document.getElementById('calcTotalDisplay');
  const tourWhatsappBtn = document.getElementById('tourWhatsappBtn');

  function updateTourCalculation() {
    if (!paxRange || !tourMenuType) return;

    const count = parseInt(paxRange.value, 10);
    paxValueDisplay.textContent = `${count} Kişi`;

    const selectedOption = tourMenuType.options[tourMenuType.selectedIndex];
    const pricePerPerson = parseInt(selectedOption.getAttribute('data-price') || '250', 10);
    const menuName = selectedOption.text.split('(')[0].trim();

    // Grup İndirimi: 40 kişi üstü %10 avantaj
    let total = count * pricePerPerson;
    if (count >= 50) {
      total = Math.round(total * 0.90);
    }

    calcTotalDisplay.textContent = `${total.toLocaleString('tr-TR')} ₺`;

    // WhatsApp mesaj şablonu oluştur
    const waText = encodeURIComponent(
      `Merhaba Saldamis Restoran! Tur acentamız adına ${count} kişilik grubumuz için "${menuName}" menüsü hakkında özel grup rezervasyonu ve servis planlaması yapmak istiyoruz.`
    );
    tourWhatsappBtn.href = `https://wa.me/905414224892?text=${waText}`;
  }

  paxRange?.addEventListener('input', updateTourCalculation);
  tourMenuType?.addEventListener('change', updateTourCalculation);
  updateTourCalculation(); // İlk yüklemede çalıştır

  // 6. Sepet & E-Ticaret Sistemi (Doğal Lavanta Dükkanı)
  let cart = JSON.parse(localStorage.getItem('saldamisCart') || '[]');
  const cartToggleBtn = document.getElementById('cartToggleBtn');
  const floatingCartBtn = document.getElementById('floatingCartBtn');
  const cartCloseBtn = document.getElementById('cartCloseBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartBackdrop = document.getElementById('cartBackdrop');
  const cartBadge = document.getElementById('cartBadge');
  const floatingCartBadge = document.getElementById('floatingCartBadge');
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  if (cartItemsContainer) {
    cartItemsContainer.style.overflowY = 'auto';
    cartItemsContainer.style.maxHeight = 'calc(100vh - 250px)';
  }
  const cartEmptyNotice = document.getElementById('cartEmptyState');
  const cartTotalAmount = document.getElementById('cartTotalAmount');
  const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');

  function openCart() {
    cartDrawer?.classList.add('open');
    cartBackdrop?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer?.classList.remove('open');
    cartBackdrop?.classList.remove('open');
    document.body.style.overflow = '';
  }

  cartToggleBtn?.addEventListener('click', openCart);
  floatingCartBtn?.addEventListener('click', openCart);
  cartCloseBtn?.addEventListener('click', closeCart);
  cartBackdrop?.addEventListener('click', closeCart);
  document.getElementById('cartCustomerNote')?.addEventListener('input', () => renderCart());

  // Sepeti Güncelle & DOM Render Et
  function renderCart() {
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    if (cartBadge) {
      cartBadge.textContent = totalCount;
      cartBadge.style.display = totalCount > 0 ? 'flex' : 'none';
    }
    if (floatingCartBadge) {
      floatingCartBadge.textContent = totalCount;
      floatingCartBadge.style.display = totalCount > 0 ? 'flex' : 'none';
    }

    if (cart.length === 0) {
      if (cartEmptyNotice) cartEmptyNotice.style.display = 'flex';
      if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        cartItemsContainer.style.display = 'none';
      }
      if (cartTotalAmount) cartTotalAmount.textContent = '0 ₺';
      if (cartCheckoutBtn) {
        cartCheckoutBtn.href = '#';
        cartCheckoutBtn.style.opacity = '0.5';
        cartCheckoutBtn.style.pointerEvents = 'none';
      }
      localStorage.setItem('saldamisCart', JSON.stringify([]));
      return;
    }

    if (cartEmptyNotice) cartEmptyNotice.style.display = 'none';
    if (cartItemsContainer) cartItemsContainer.style.display = 'block';
    if (cartCheckoutBtn) {
      cartCheckoutBtn.style.opacity = '1';
      cartCheckoutBtn.style.pointerEvents = 'auto';
    }

    let totalPrice = 0;
    let html = '';

    cart.forEach((item, index) => {
      const itemSubtotal = item.price * item.qty;
      totalPrice += itemSubtotal;

      html += `
        <div class="cart-item-row">
          <div class="cart-item-name" onclick="window.goToProduct('${item.name.replace(/'/g, "\\'")}')">${item.name}</div>
          <div class="cart-qty-ctrl">
            <button class="cart-qty-btn" onclick="window.changeItemQty(${index}, -1)">-</button>
            <span class="cart-qty-val">${item.qty}</span>
            <button class="cart-qty-btn" onclick="window.changeItemQty(${index}, 1)">+</button>
          </div>
          <div class="cart-item-price-box">
            <span class="cart-item-price">
              ${(item.price * item.qty).toLocaleString('tr-TR')} ₺
            </span>
            <button class="cart-item-del-btn" onclick="window.removeFromCart(${index})" title="Ürünü Sil">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    });

    if (cart.length > 0) {
      html += `
        <div style="margin-top: 1rem; display: flex; justify-content: flex-end; margin-bottom: 0.5rem;">
          <button class="cart-clear-btn" onclick="window.clearCart()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg> 
            Sepeti Boşalt
          </button>
        </div>
      `;
    }

    if (cartItemsContainer) cartItemsContainer.innerHTML = html;
    if (cartTotalAmount) cartTotalAmount.textContent = `${totalPrice.toLocaleString('tr-TR')} ₺`;
    localStorage.setItem('saldamisCart', JSON.stringify(cart));

    // WhatsApp Mesajı Oluştur
    const noteEl = document.getElementById('cartCustomerNote');
    const customerNote = noteEl ? noteEl.value.trim() : '';
    let itemsText = cart.map(i => `• ${i.name} (${i.qty} adet - ${i.price * i.qty} ₺)`).join('\n');
    let messageBody = `Merhaba Saldamis Doğal Dükkan! Aşağıdaki ürünleri sipariş vermek istiyorum:\n\n${itemsText}\n\nToplam Tutar: ${totalPrice.toLocaleString('tr-TR')} ₺`;
    if (customerNote) {
      messageBody += `\n\nSipariş Açıklaması / Notu:\n${customerNote}`;
    }
    messageBody += `\n\nTeslimat adresi ve ödeme detaylarını alabilir miyim?`;

    const orderMessage = encodeURIComponent(messageBody);
    if (cartCheckoutBtn) {
      cartCheckoutBtn.href = `https://wa.me/905414224892?text=${orderMessage}`;
    }
  }

  window.clearCart = () => {
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
    if (!name) return;
    const cleanName = String(name).trim().toLowerCase();

    // Close drawer if open
    if (typeof closeCart === 'function') closeCart();

    // 1. Check window.menuGrouped
    if (window.menuGrouped) {
      for (const cat in window.menuGrouped) {
        const item = window.menuGrouped[cat].find(x => (x.name || '').trim().toLowerCase() === cleanName);
        if (item) {
          window.location.hash = 'product-' + cat + '-' + item.id;
          return;
        }
      }
    }

    // 2. Check DOM elements
    const cards = Array.from(document.querySelectorAll('.menu-card, .product-card, .popular-card, [data-product-name]'));
    const matched = cards.find(c => {
      const title = c.querySelector('h3, h4, .menu-item-name, .product-title, .popular-card-name');
      return (title && title.textContent.trim().toLowerCase().includes(cleanName)) ||
             (c.getAttribute('data-product-name') && c.getAttribute('data-product-name').toLowerCase().includes(cleanName));
    });

    if (matched) {
      matched.scrollIntoView({ behavior: 'smooth', block: 'center' });
      matched.classList.add('highlight-pulse');
      setTimeout(() => matched.classList.remove('highlight-pulse'), 2000);
      return;
    }

    // 3. Fallback: scroll to menu container
    const menuContainer = document.getElementById('menuContainer');
    if (menuContainer) {
      menuContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Global fonksiyon: adet değiştir
  window.changeItemQty = (index, delta) => {
    if (cart[index]) {
      cart[index].qty += delta;
      if (cart[index].qty <= 0) {
        cart.splice(index, 1);
        showToast('Ürün sepetten kaldırıldı.');
      }
      renderCart();
    }
  };

  // Global Sepete Ekle Fonksiyonu (Dinamik butonlar için)
  window.addToCart = (name, price) => {
    price = parseInt(price, 10);
    const existingIndex = cart.findIndex(i => i.name === name);
    if (existingIndex > -1) {
      cart[existingIndex].qty += 1;
    } else {
      cart.push({ name, price, qty: 1 });
    }
    renderCart();
    showToast(`"${name}" sepete eklendi!`);
  };

  // Statik butonlar için olay dinleyicisi
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.product-add-btn');
    if (btn) {
      const name = btn.getAttribute('data-name');
      const price = btn.getAttribute('data-price');
      window.addToCart(name, price);
    }
  });

  // İlk yüklemede sepeti render et
  renderCart();
  
  // 7. Sıkça Sorulan Sorular (Accordion)
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn?.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      // Diğerlerini kapat
      faqItems.forEach(i => i.classList.remove('active'));
      // Tıklananı aç/kapat
      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });

  // 8. Toast Bildirim Fonksiyonu
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-lucide="check-circle" style="color:#10b981; width:18px; height:18px;"></i> <span>${message}</span>`;
    container.appendChild(toast);

    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2800);
  }

  window.showToast = showToast;

  // 9. Bento Box Carousel & Lightbox
  const bentoCarousels = document.querySelectorAll('.bento-carousel');
  const lightbox = document.getElementById('bentoLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.querySelector('.lightbox-close');

  // Carousel Döngüsü
  bentoCarousels.forEach((carousel, index) => {
    const images = carousel.querySelectorAll('img');
    if (images.length > 1) {
      let currentIndex = 0;
      // Her carousel için farklı başlangıç süresi vererek aynı anda değişmelerini engelliyoruz
      setTimeout(() => {
        setInterval(() => {
          images[currentIndex].classList.remove('active');
          currentIndex = (currentIndex + 1) % images.length;
          images[currentIndex].classList.add('active');
        }, 4000); // 4 saniyede bir değişir
      }, index * 1000);
    }

    // Lightbox Tıklama
    carousel.addEventListener('click', () => {
      if (!lightbox || !lightboxImg) return;
      // Aktif fotoğrafı bul
      const activeImg = carousel.querySelector('img.active') || images[0];
      if (activeImg) {
        lightboxImg.src = activeImg.src;
        lightbox.classList.add('show');
        document.body.style.overflow = 'hidden'; // Arka plan kaymasını engelle
      }
    });
  });

  // Lightbox Kapatma
  if (lightbox && lightboxClose) {
    lightboxClose.addEventListener('click', () => {
      lightbox.classList.remove('show');
      document.body.style.overflow = '';
    });
    
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  }

  // Tema Değiştirme (Dark Mode)
  const themeToggleBtns = document.querySelectorAll('#themeToggleBtn, .theme-toggle-btn');
  const currentTheme = localStorage.getItem('saldamisTheme') || 'light';
  
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }

  function updateThemeIcons() {
    const isDark = document.body.classList.contains('dark-theme');
    themeToggleBtns.forEach(btn => {
      const moon = btn.querySelector('.theme-icon-moon');
      const sun = btn.querySelector('.theme-icon-sun');
      if (moon && sun) {
        moon.style.display = isDark ? 'none' : 'block';
        sun.style.display = isDark ? 'block' : 'none';
      }
    });
  }
  
  updateThemeIcons();

  window.toggleTheme = function() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('saldamisTheme', isDark ? 'dark' : 'light');
    updateThemeIcons();
  };

  themeToggleBtns.forEach(btn => {
    if (btn.dataset.themeBound) return;
    btn.dataset.themeBound = 'true';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.toggleTheme();
    });
  });

});



// Carousel Otomatik Kaydırma + Tam Kullanıcı Kontrolü (Drag, Swipe, Oklar)
document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.carousel-track');
  if (!track) return;

  const prevBtn = document.getElementById('carouselPrevBtn');
  const nextBtn = document.getElementById('carouselNextBtn');

  // Lucide ikonlarını yeniden tara
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Sonsuz döngü için elemanları klonla
  const originalChildren = Array.from(track.children);
  if (originalChildren.length === 0) return;

  originalChildren.forEach(child => {
    track.appendChild(child.cloneNode(true));
  });

  let isInteracting = false;
  let resumeTimer = null;
  let autoScrollId = null;
  const scrollSpeed = 0.75; // px/frame (ideal akıcılıkta hız)
  let floatPos = track.scrollLeft;

  let halfWidth = track.scrollWidth / 2;
  const updateMetrics = () => {
    halfWidth = track.scrollWidth / 2;
  };

  track.querySelectorAll('img').forEach(img => {
    if (!img.complete) {
      img.addEventListener('load', updateMetrics);
    }
  });
  window.addEventListener('resize', updateMetrics);

  // Otomatik kaydırmayı başlat
  const startAutoScroll = () => {
    if (!isInteracting && halfWidth > 0) {
      floatPos += scrollSpeed;
      if (floatPos >= halfWidth) {
        floatPos -= halfWidth;
      } else if (floatPos <= 0) {
        floatPos += halfWidth;
      }
      track.scrollLeft = floatPos;
      autoScrollId = requestAnimationFrame(startAutoScroll);
    }
  };

  // Kullanıcı etkileşimi durdurduğunda otomatik kaydırmayı yeniden devreye al
  const pauseAndResume = (delay = 2400) => {
    isInteracting = true;
    if (autoScrollId) {
      cancelAnimationFrame(autoScrollId);
      autoScrollId = null;
    }
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      floatPos = track.scrollLeft;
      isInteracting = false;
      autoScrollId = requestAnimationFrame(startAutoScroll);
    }, delay);
  };

  // 1. Ok Butonları ile Kontrol
  const getScrollStep = () => {
    const firstSlice = track.querySelector('.carousel-slice');
    return firstSlice ? (firstSlice.offsetWidth + 24) : 340;
  };

  prevBtn?.addEventListener('click', () => {
    pauseAndResume(2800);
    track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
    setTimeout(() => { floatPos = track.scrollLeft; }, 400);
  });

  nextBtn?.addEventListener('click', () => {
    pauseAndResume(2800);
    track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
    setTimeout(() => { floatPos = track.scrollLeft; }, 400);
  });

  // 2. Masaüstü Mouse ile Tutup Sürükleme (Drag-to-Scroll)
  let isMouseDown = false;
  let startX = 0;
  let initialScrollLeft = 0;
  let hasDragged = false;

  track.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isMouseDown = true;
    hasDragged = false;
    pauseAndResume(3000);
    track.classList.add('grabbing');
    startX = e.pageX - track.offsetLeft;
    initialScrollLeft = track.scrollLeft;
  });

  const stopMouseDrag = () => {
    if (isMouseDown) {
      isMouseDown = false;
      track.classList.remove('grabbing');
      floatPos = track.scrollLeft;
      pauseAndResume(2400);
    }
  };

  window.addEventListener('mouseup', stopMouseDrag);
  track.addEventListener('mouseleave', () => {
    if (isMouseDown) stopMouseDrag();
  });

  track.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    e.preventDefault();
    const currentX = e.pageX - track.offsetLeft;
    const walk = (currentX - startX) * 1.3;
    if (Math.abs(walk) > 4) hasDragged = true;
    track.scrollLeft = initialScrollLeft - walk;
    floatPos = track.scrollLeft;
  });

  track.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged = false;
    }
  }, true);

  // 3. Mobil Dokunmatik (Touch Swipe)
  track.addEventListener('touchstart', () => {
    pauseAndResume(3500);
    floatPos = track.scrollLeft;
  }, { passive: true });

  track.addEventListener('touchmove', () => {
    pauseAndResume(3500);
    floatPos = track.scrollLeft;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    floatPos = track.scrollLeft;
    pauseAndResume(2200);
  }, { passive: true });

  // 4. Otomatik döngüyü ilk kez başlat
  autoScrollId = requestAnimationFrame(startAutoScroll);
});

// ==========================================================================
// DİL SEÇİMİ & GOOGLE TRANSLATE ENTEGRASYONU (SALDAMIS)
// ==========================================================================
const SALDAMIS_LANGS = {
  'tr': { name: 'Türkçe', flag: 'tr' },
  'en': { name: 'English', flag: 'gb' },
  'ru': { name: 'Русский', flag: 'ru' },
  'de': { name: 'Deutsch', flag: 'de' },
  'it': { name: 'Italiano', flag: 'it' },
  'es': { name: 'Español', flag: 'es' }
};

function getActiveLanguage() {
  // 1. googtrans çerezine bak (/tr/en veya /tr/ru gibi)
  const cookieMatch = document.cookie.match(/(?:^|;\s*)googtrans=\/tr\/([a-z]{2})/i);
  if (cookieMatch && cookieMatch[1] && SALDAMIS_LANGS[cookieMatch[1].toLowerCase()]) {
    return cookieMatch[1].toLowerCase();
  }
  // 2. localStorage kontrolü
  const saved = localStorage.getItem('saldamis_selected_lang');
  if (saved && SALDAMIS_LANGS[saved]) {
    return saved;
  }
  return 'tr';
}

function updateLangButtonUI(langCode) {
  const info = SALDAMIS_LANGS[langCode] || SALDAMIS_LANGS['tr'];
  const langBtn = document.getElementById('langBtn');
  if (!langBtn) return;

  const flagImg = langBtn.querySelector('img');
  if (flagImg) flagImg.src = `https://flagcdn.com/w20/${info.flag}.png`;

  const textSpan = langBtn.querySelector('.lang-text-desktop');
  if (textSpan) textSpan.textContent = info.name;

  document.querySelectorAll('.lang-item').forEach(item => {
    if (item.getAttribute('data-lang') === langCode) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function clearGoogleTranslateCookies() {
  const host = window.location.hostname;
  const hostParts = host.split('.');
  const domains = ['', host, '.' + host];
  if (hostParts.length > 2) {
    domains.push('.' + hostParts.slice(-2).join('.'));
  }
  const paths = ['/', ''];

  domains.forEach(d => {
    paths.forEach(p => {
      const dStr = d ? `; domain=${d}` : '';
      const pStr = p ? `; path=${p}` : '; path=/';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC${pStr}${dStr};`;
    });
  });
  localStorage.removeItem('saldamis_selected_lang');
}

function setLanguage(langCode) {
  if (langCode === 'tr') {
    clearGoogleTranslateCookies();
    localStorage.setItem('saldamis_selected_lang', 'tr');
    updateLangButtonUI('tr');

    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = '';
      select.dispatchEvent(new Event('change'));
    }
    // Orijinal Türkçe halini temiz yüklemek için sayfayı yenile
    window.location.reload();
    return;
  }

  const info = SALDAMIS_LANGS[langCode];
  if (!info) return;

  localStorage.setItem('saldamis_selected_lang', langCode);
  updateLangButtonUI(langCode);

  const host = window.location.hostname;
  document.cookie = `googtrans=/tr/${langCode}; path=/;`;
  document.cookie = `googtrans=/tr/${langCode}; path=/; domain=${host};`;

  const select = document.querySelector('.goog-te-combo');
  if (select) {
    select.value = langCode;
    select.dispatchEvent(new Event('change'));
  } else {
    window.location.reload();
  }
}

function initLanguageSwitcher() {
  const langBtn = document.getElementById('langBtn');
  const langMenu = document.getElementById('langMenu');
  const langItems = document.querySelectorAll('.lang-item');

  if (!langBtn || !langMenu) return;

  // Sayfa açıldığında veya yenilendiğinde aktif dili hemen butona yansıt
  const activeLang = getActiveLanguage();
  updateLangButtonUI(activeLang);

  // Butona tıklandığında menüyü aç/kapat
  langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isShowing = langMenu.style.display === 'block';
    langMenu.style.display = isShowing ? 'none' : 'block';
  });

  // Dışarı tıklanınca kapat
  document.addEventListener('click', () => {
    langMenu.style.display = 'none';
  });

  // Dil öğelerine tıklandığında
  langItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      langMenu.style.display = 'none';
      const langCode = item.getAttribute('data-lang');
      setLanguage(langCode);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLanguageSwitcher();
});



