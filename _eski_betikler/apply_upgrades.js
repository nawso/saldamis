const fs = require('fs');

const ogTags = `  <!-- SEO & Open Graph Meta Tags -->
  <meta name="description" content="Salda Gölü'nün eşsiz manzarasında, doğal ürünlerle hazırlanan serpme kahvaltı, yöresel lezzetler ve özel hediyelik eşyalar.">
  <meta property="og:title" content="Saldamis | Doğal Kahvaltı & Hediyelik">
  <meta property="og:description" content="Salda Gölü'nün eşsiz manzarasında, doğal ürünlerle hazırlanan serpme kahvaltı, yöresel lezzetler ve özel hediyelik eşyalar.">
  <meta property="og:image" content="https://raw.githubusercontent.com/username/saldamis/main/images/header-bg.jpg">
  <meta property="og:url" content="https://saldamis.com">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">`;

const preloaderHTML = `  <!-- PRELOADER -->
  <div id="preloader" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #ffffff; z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.6s ease, visibility 0.6s ease;">
    <div style="width: 60px; height: 60px; border: 5px solid #e2e8f0; border-top: 5px solid #7c3aed; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
    <h2 style="font-family: 'Playfair Display', serif; color: #4c1d95; margin: 0; font-size: 1.5rem; letter-spacing: 1px;">Saldamis</h2>
    <style>
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  </div>
  <script>
    window.addEventListener('load', () => {
      const preloader = document.getElementById('preloader');
      if(preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => preloader.style.visibility = 'hidden', 600);
      }
    });
  </script>`;

function applyUpgrades(filename) {
    if (!fs.existsSync(filename)) return;
    let content = fs.readFileSync(filename, 'utf8');

    // Add OG tags before </head> if not exists
    if (!content.includes('og:title')) {
        content = content.replace('</head>', ogTags + '\n</head>');
    }

    // Add Preloader after <body> if not exists
    if (!content.includes('id="preloader"')) {
        content = content.replace(/<body[^>]*>/, match => match + '\n' + preloaderHTML);
    }

    // Replace map link in index.html
    if (filename === 'index.html') {
        content = content.replace(
            `<a href="#iletisim" class="btn" style="padding: 1rem 3rem; font-size: 1.15rem; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4); background: linear-gradient(135deg, var(--c-amber) 0%, #d97706 100%); color: white; border: none; font-weight: 700; transition: transform 0.3s ease, box-shadow 0.3s ease;">`,
            `<a href="https://maps.google.com/?q=Saldamis+Kafe+Restoran+Salda" target="_blank" class="btn" style="padding: 1rem 3rem; font-size: 1.15rem; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4); background: linear-gradient(135deg, var(--c-amber) 0%, #d97706 100%); color: white; border: none; font-weight: 700; transition: transform 0.3s ease, box-shadow 0.3s ease;">`
        );
        content = content.replace(
            `<li class="nav-item"><a href="index.html#iletisim" class="nav-link">İletişim & Konum</a></li>`,
            `<li class="nav-item"><a href="https://maps.google.com/?q=Saldamis+Kafe+Restoran+Salda" target="_blank" class="nav-link">İletişim & Konum</a></li>`
        );
        content = content.replace(
            `<li><a href="index.html#iletisim" class="nav-link">İletişim & Konum</a></li>`,
            `<li><a href="https://maps.google.com/?q=Saldamis+Kafe+Restoran+Salda" target="_blank" class="nav-link">İletişim & Konum</a></li>`
        );
    }

    fs.writeFileSync(filename, content, 'utf8');
    console.log('Upgraded', filename);
}

['index.html', 'menu.html', 'hediyelik.html'].forEach(applyUpgrades);
