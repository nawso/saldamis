const fs = require('fs');
let content = fs.readFileSync('admin.html', 'utf8');

content = content.replace(
  `      const dummyItems = [
        { name: 'Serpme Kahvaltı', price: 1400, category: 'kahvalti', order: 1, desc: 'Taze köy yumurtası, organik reçeller, çeşitli peynirler, zeytinler ve sınırsız çay ile hazırlanan zengin kahvaltı sofrası.' },`,
  `      const isMenu = window.currentCollection === 'menuItems';
      const dummyItems = isMenu ? [
        { name: 'Serpme Kahvaltı', price: 1400, category: 'kahvalti', order: 1, desc: 'Taze köy yumurtası, organik reçeller, çeşitli peynirler, zeytinler ve sınırsız çay ile hazırlanan zengin kahvaltı sofrası.' },`
);

content = content.replace(
  `{ name: 'Ice Tea', price: 45, category: 'soguk-icecek', desc: 'Şeftali veya limon aromalı soğuk çay.' }
      ];`,
  `{ name: 'Ice Tea', price: 45, category: 'soguk-icecek', desc: 'Şeftali veya limon aromalı soğuk çay.' }
      ] : [
        { name: 'Lavanta Hediye Paketi', price: 450, category: 'paketler', order: 1, desc: 'İçerisinde lavanta sabunu, lavanta kesesi ve doğal lavanta yağı bulunan özel tasarım hediye kutusu.' },
        { name: 'Doğal Lavanta Sabunu', price: 75, category: 'sabunlar', order: 1, desc: 'Cildi nemlendiren, tamamen doğal yöntemlerle üretilmiş el yapımı lavanta sabunu.' },
        { name: 'Saf Lavanta Yağı', price: 120, category: 'dogal-yaglar', order: 1, desc: 'Rahatlatıcı etkisiyle bilinen soğuk sıkım %100 saf lavanta yağı (20ml).' },
        { name: 'Lavanta Kolonyası', price: 90, category: 'kolonya-kozmetik', order: 1, desc: 'Ferahlatıcı ve kalıcı kokusuyla Salda hatırası özel üretim lavanta kolonyası.' },
        { name: 'Lavanta Çiçeği Balı', price: 250, category: 'dogal-urunler', order: 1, desc: 'Sadece lavanta çiçeklerinden elde edilen, yoğun aromalı organik süzme bal.' },
        { name: 'Salda Gölü Magneti', price: 35, category: 'magnet-acacak', order: 1, desc: 'Buzdolabınızı süsleyecek ahşap tasarımlı özel Salda Gölü magneti.' },
        { name: 'Kurutulmuş Lavanta Buketi', price: 85, category: 'oda-susleri', order: 1, desc: 'Evinizin havasını değiştirecek, aylarca kokusunu koruyan doğal lavanta buketi.' }
      ];`
);

content = content.replace(
  `        const snapshot = await getDocs(collection(db, "menuItems"));`,
  `        const snapshot = await getDocs(collection(db, window.currentCollection));`
);

content = content.replace(
  `            await addDoc(collection(db, "menuItems"), item);`,
  `            await addDoc(collection(db, window.currentCollection), item);`
);

content = content.replace(
  `            await updateDoc(doc(db, "menuItems", existingDoc.id), {`,
  `            await updateDoc(doc(db, window.currentCollection, existingDoc.id), {`
);

fs.writeFileSync('admin.html', content, 'utf8');
console.log('done seed fix');
