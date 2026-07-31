# MEDAIGENCY — Lot C Operasyon Konsolu (React Native)

**AI-Driven Disaster Resilience, Medical Response, and Multi-Purpose Resource Logistics Management System**
İzmir Katip Çelebi Üniversitesi (İKÇÜ) — Interreg NEXT MED MEDAIGENCY Projesi, RFQ 0001 — Lot C
Venus Robotik Medikal ve Protez A.Ş.

Figma prototipinin, **SRS V1.0 (IEEE Std 29148-2018 uyumlu)** dokümanına göre yeniden düzenlenmiş
React Native / Expo gerçeklemesi.

---

## Hızlı Başlangıç

```bash
cd ~/Desktop/MedaigencyMobile
npm install
npm run web        # tarayıcıda → http://localhost:8081
```

Diğer hedefler:

```bash
npm run ios        # iOS simülatör
npm run android    # Android emülatör
npm start          # Expo Go ile fiziksel cihaz (QR kod)
```

Tip kontrolü: `npx tsc --noEmit`

### Demo girişi

Giriş ekranında **SRS §2.3'teki beş aktörden biri** seçilir; e-posta/şifre otomatik dolar,
"Güvenli Giriş Yap" → çok faktörlü doğrulama onayı yeterlidir. Tam menüyü görmek için
**Sistem Yöneticisi & Karar Verici (Admin)** ile giriş yapın.

---

## SRS'e Göre Yapılan Düzenlemeler

Prototip 13 ekrandan **20 ekrana** çıkarıldı; eklenenler doğrudan SRS'te tanımlı olup
prototipte karşılığı bulunmayan ürün fonksiyonlarını gerçekler.

| Eklenen ekran | Gerçeklediği fonksiyonlar | Gerekçe |
|---|---|---|
| Rol seçimli giriş | PF-SYS01 | SRS §2.3 — beş aktör, SEC-001/009 en az yetki |
| Veri Toplama Durumu | PF-DAT01…06 | Prototipte veri alım katmanı hiç yoktu |
| YZ Model Orkestrasyonu | PF-AI01…06 + PF-GET01…08 | Model tetikleme ve sonuç alma akışı eksikti |
| Saha Veri Girişi | PF-RSK01 | AFAD manuel yol hasarı girişi eksikti |
| Acil Sevk & Yönlendirme | PF-EMG02/03/04 + PF-AI06 | 112 olay/ambulans/güzergah akışı eksikti |
| Bildirimler | PF-SYS02 | Bildirim Servisi görünümü eksikti |
| Vault & Sır Yönetimi | PF-SYS03 | Vault yönetimi eksikti |
| Gereksinim İzlenebilirliği | SRS §5 | RTM'nin arayüzde doğrulanabilmesi için |

**Menü grupları SRS §3.1.1 ile birebir aynıdır:**
Ana · Kapasite & Kaynak · Planlama & YZ · Koordinasyon · Yönetim

### Bağlayıcı kısıtların gerçeklenmesi

| Gereksinim | Nerede görünür |
|---|---|
| **CON-007 / SEC-008** — YZ önerileri insan onayı gerektirir | Her öneri kartında Onayla/Reddet/Yeniden Hesapla; onaysız hiçbir eylem uygulanmaz. Sistem Ayarları'nda "YZ Otomatik Uygulama" kalıcı **KİLİTLİ**. |
| **CON-008 / QLT-006** — YZ çıktıları girdi verisine kadar izlenebilir | Her ekran başlığında ve her öneri kartında **PF rozetleri**; öneri kartlarında "Girdi Fonksiyonları" bölümü. |
| **CON-003 / SEC-001 / SEC-009** — RBAC, en az yetki | Menü role göre filtrelenir; model tetikleme yalnızca ilgili aktöre açıktır; saha girişi yalnızca AFAD'a açıktır. |
| **CON-004 / SEC-006** — denetim kaydı | Giriş, YZ onay/ret, saha girişi, model tetikleme ve Vault rotasyonu **canlı olarak** Denetim Günlüğü'ne yazılır. |
| **SEC-002** — Vault | Sır **değerleri** arayüzde hiçbir koşulda gösterilmez; yalnızca meta veri listelenir. |
| **CON-005 / DSN-002** — geospatial | Altlık, OpenStreetMap verisinden üretilen karolarla Leaflet üzerinde çizilir; görünüm Türkiye ile Akdeniz havzasını kapsar. Üzerine 10 operasyonel katman gerçek WGS84 koordinatlarıyla bindirilir: hastane kapasite yayları, Güvenli Düğüm stok halkaları, koridor risk durumu. |

---

## Mimari

```
App.tsx                       Kök — oturum kontrolü ve ekran yönlendirmesi
src/
  theme/tokens.ts             Renk paleti (Figma prototipinden birebir), tipografi, yardımcılar
  data/srs.ts                 SRS kataloğu: 30 ürün fonksiyonu, CON/SEC/PER/QLT, RTM
  data/mock.ts                Demo operasyonel veri (gerçekte dış arayüzlerden gelir)
  auth/roles.ts               SRS §2.3 aktörleri ve fonksiyon yetki matrisi
  state/AppState.tsx          Oturum, YZ kararları, denetim kaydı, model çalıştırmaları
  navigation/
    registry.ts               Ekran kayıt defteri (grup + gerçeklenen PF'ler)
    Shell.tsx                 Uyarlanabilir kenar çubuğu / çekmece + durum çubuğu
  components/
    ui.tsx                    Tasarım sistemi (kart, KPI, tablo, rozet, slider…)
    charts.tsx                react-native-svg tabanlı alan/çubuk grafikleri
    OperationalMap.tsx        Operasyonel GIS haritası (çerçeve + gösterge)
    leaflet/
      mapHtml.ts              OSM/Leaflet harita belgesini üreten katman
      MapFrame.tsx            iOS/Android köprüsü (react-native-webview)
      MapFrame.web.tsx        Web köprüsü (sandbox'lı <iframe srcDoc>)
    AIRecCard.tsx             YZ karar destek kartı (CON-007/CON-008)
    Screen.tsx                Ortak ekran gövdesi ve esnek sütun yerleşimi
  screens/                    20 ekran
```

### Web prototipinden taşınırken yapılan teknik dönüşümler

React Native, web prototipinin bazı bağımlılıklarını çalıştıramaz; şu karşılıklar kullanıldı:

| Web prototipi | React Native karşılığı |
|---|---|
| Tailwind CSS sınıfları | `StyleSheet` + tasarım token'ları |
| `recharts` (yalnızca DOM) | `react-native-svg` ile yazılmış `AreaChart` / `BarChart` |
| `lucide-react` | `@expo/vector-icons` (Feather) |
| Şematik SVG Türkiye haritası | Leaflet + OSM karoları; ortak HTML belgesi web'de `<iframe srcDoc>`, native'de `WebView` içinde koşar |
| HTML `<table>` | Yatay kaydırılabilir `Table` bileşeni |
| `<input type="range">` | `PanResponder` tabanlı `Slider` |

### Uyarlanabilir yerleşim

Tek kod tabanı hem masaüstü web konsolu (SRS §3.1.2 — "standart masaüstü tarayıcılar")
hem de mobil cihaz için çalışır:

- **≥ 1000 px** — kalıcı kenar çubuğu, üç sütunlu GIS ekranı, çok sütunlu paneller
- **< 1000 px** — hamburger menü + çekmece, tek sütuna inen paneller, katlanabilir harita kontrolleri

---

## Bilinen Sınırlar

- Veriler statiktir; gerçek dağıtımda AFAD, Kızılay, Sağlık Bakanlığı, 112 ve Kandilli
  arayüzlerinden Redis akış çekirdeği üzerinden gelir (SRS §3.1.3).
- Harita altlığı OpenStreetMap'tir (ODbL); karolar CARTO'nun açık *Dark Matter* setinden
  çevrimiçi çekilir, dolayısıyla harita internet bağlantısı ister ve çevrimdışı çalışmaz.
  Üretimde DSN-002 uyarınca kurum içi OSM Servisi + PostGIS karo/veri kaynağı kullanılacaktır.
- Harita üzerindeki konumlar gerçek WGS84 koordinatlarıdır; ancak hastane/depo/koridor
  kayıtlarının kendisi hâlâ `src/data/mock.ts` içindeki temsilî veridir.
- Hazard/Risk hesaplamaları simüle edilir; üretimde OpenQuake motoru çalıştırılır (DSN-003).
- Kimlik doğrulama demo amaçlıdır; üretimde Auth Servisi + JWT (SEC-003) kullanılır.
