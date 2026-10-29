# MEDAIGENCY — Lot C Operasyon Konsolu (React Native)

**AI-Driven Disaster Resilience, Medical Response, and Multi-Purpose Resource Logistics Management System**
İzmir Katip Çelebi Üniversitesi (İKÇÜ) — Interreg NEXT MED MEDAIGENCY Projesi, Lot C
Venus Robotik Medikal ve Protez A.Ş.

Afet hazırlığı, acil müdahale ve kaynak lojistiği için YZ destekli operasyon konsolunun
React Native / Expo gerçeklemesi. Tek kod tabanı web, iOS ve Android'de çalışır.

---

## Hızlı Başlangıç

```bash
cd ~/code/MedaigencyMobile
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

Giriş ekranında kurum seçilir; e-posta ve şifre otomatik dolar. "Güvenli Giriş Yap" sonrasında
doğrulama adımına **herhangi bir 6 haneli kod** girilir (yalnızca demo sunucuda). Tüm menüyü görmek
ve YZ önerilerini onaylamak için **Sistem Yöneticisi & Karar Verici** ile giriş yapın.

---

## API Katmanı

Uygulama hiçbir veriyi doğrudan dosyadan okumaz; tüm okuma ve yazma işlemleri `src/api`
üzerinden geçer.

| Ortam değişkeni | Davranış |
|---|---|
| `EXPO_PUBLIC_API_URL` tanımlı | İstemci gerçek gateway'lere HTTPS/JSON üzerinden bağlanır |
| Tanımlı değil (varsayılan) | Cihaz içi **demo sunucu** (`src/api/mockServer.ts`) aynı sözleşmeyle yanıt verir; durum çubuğunda "DEMO SUNUCU" görünür |

Gerçek arka uca geçmek için proje kökünde `.env.local` oluşturmak yeterlidir:

```bash
echo "EXPO_PUBLIC_API_URL=https://api.ornek-kurum.gov.tr" > .env.local
```

### Uç noktalar

| Gateway | Uç nokta | İşlev |
|---|---|---|
| — | `POST /auth/login` · `/auth/refresh` · `/auth/logout` | Çok faktörlü giriş, token yenileme ve iptal |
| — | `GET /notifications` · `POST /notifications/{id}/read` · `/read-all` | Bildirimler |
| — | `GET /jobs/{jobId}` | Model işinin durumu ve ilerlemesi |
| Koordinasyon | `POST /coordination/models/{model}/jobs` | Tehlike, risk, yol riski, yerel optimizasyon modellerini tetikleme |
| Koordinasyon | `GET /coordination/models/{model}/results` | Model sonuçlarını alma |
| Koordinasyon | `GET /coordination/datasets/{observatory\|exposure\|fragility}` | Dağıtım Sistemi veri kümeleri |
| Koordinasyon | `GET`, `POST /coordination/road-damage` | Saha yol hasarı kayıtları |
| Acil Durum | `POST /emergency/models/emergency/jobs` | Acil gerçek zamanlı YZ |
| Backoffice | `POST /backoffice/models/globalOptimization/jobs` | Uluslararası optimizasyon |
| Backoffice | `GET /backoffice/recommendations` · `POST …/{id}/decision` · `POST …/{id}/recompute` | YZ önerisi onay / ret / yeniden hesaplama |
| Backoffice | `POST /backoffice/osm/updates` · `GET …/{jobId}` | Harita / yol ağı güncellemesi |
| Backoffice | `GET /backoffice/audit` · `GET /backoffice/audit/export` | Denetim kaydı ve CSV dışa aktarma |
| Backoffice | `GET /backoffice/vault` · `POST …/rotate` · `PUT …/value` | Vault meta verisi, rotasyon, değer güncelleme |

Hata yanıtları `{ "code": "...", "message": "..." }` biçimindedir; `message` doğrudan kullanıcıya
gösterilir. Erişim token'ı dolmak üzereyken istemci kendiliğinden yeniler; sunucu `token_expired`
döndürürse isteği bir kez tekrarlar.

---

## Temel Davranışlar

| Konu | Nasıl gerçeklendi |
|---|---|
| YZ önerileri insan onayı gerektirir | Öneri kartında **Onayla / Reddet / Yeniden Hesapla**; ret için gerekçe zorunlu. Karar yetkisi yalnızca karar vericidedir. Ayarlar'daki "YZ Otomatik Uygulama" kalıcı olarak kilitlidir. |
| YZ çıktıları girdisine kadar izlenebilir | Her öneri ve model sonucu, onu üreten veri kümelerini düz Türkçe etiketlerle listeler. |
| Rol tabanlı erişim, en az yetki | Her rolün izin listesi `src/auth/roles.ts` içindedir; menü, düğmeler ve sunucu aynı listeye göre karar verir. |
| Denetim kaydı | Giriş/çıkış, öneri kararları, model tetikleme ve tamamlanma, sonuç alma, saha girişi, harita güncellemesi, Vault işlemleri ve log dışa aktarma **sunucu tarafında** kaydedilir. |
| Vault | Sır değerleri arayüzde hiçbir koşulda gösterilmez; yeni değer yalnızca sunucuya gönderilir. |
| Geospatial | Leaflet + OpenStreetMap verisi; Türkiye ve Akdeniz havzası, gerçek WGS84 koordinatlarıyla 12 operasyonel katman. |

Menü grupları: Ana · Kapasite & Kaynak · Planlama & YZ · Koordinasyon · Yönetim

---

## Mimari

```
App.tsx                       Kök — oturum kontrolü ve ekran yönlendirmesi
src/
  api/
    config.ts                 API adresi ve demo/canlı mod seçimi
    http.ts                   HTTPS taşıyıcısı ve ApiError
    client.ts                 Uç noktalar, token yenileme
    mockServer.ts             Cihaz içi demo sunucu (aynı sözleşme)
    types.ts                  İstek/yanıt tipleri
    useQuery.ts               Veri okuma hook'u
  auth/roles.ts               Roller, izinler, model/veri erişim kuralları
  state/AppState.tsx          Oturum, bildirimler, öneri kararları, model işleri
  data/mock.ts                Demo sunucunun başlangıç verisi
  theme/tokens.ts             Renk paleti, tipografi, yardımcılar
  utils/download.ts           CSV/metin dosyası indirme veya paylaşma
  navigation/
    registry.ts               Ekran kayıt defteri (grup + gerekli izinler)
    Shell.tsx                 Uyarlanabilir kenar çubuğu / çekmece + durum çubuğu
  components/
    ui.tsx                    Tasarım sistemi (kart, KPI, tablo, rozet, slider…)
    charts.tsx                react-native-svg tabanlı alan/çubuk grafikleri
    OperationalMap.tsx        Operasyonel GIS haritası (çerçeve + gösterge)
    leaflet/                  OSM/Leaflet harita belgesi ve web/native köprüleri
    AIRecCard.tsx             YZ karar destek kartı (onay / ret / yeniden hesaplama)
    Screen.tsx                Ortak ekran gövdesi ve esnek sütun yerleşimi
  screens/                    18 ekran
```

### Uyarlanabilir yerleşim

- **≥ 1000 px** — kalıcı kenar çubuğu, üç sütunlu GIS ekranı, çok sütunlu paneller
- **< 1000 px** — hamburger menü + çekmece, tek sütuna inen paneller, katlanabilir harita kontrolleri

---

## Bilinen Sınırlar

- Demo sunucu verileri temsilîdir; model çalıştırmaları gerçek hesap yapmaz, süreyi ve sonucu
  taklit eder. Gerçek tehlike/risk hesapları arka uçta OpenQuake motoruyla yapılır.
- Panolardaki bazı göstergeler (KPI'lar, grafikler, hastane ve envanter tabloları) henüz
  `src/data/mock.ts` içindeki statik veriden okunur; bunlar için uç nokta tanımlanınca API'ye taşınmalıdır.
- Harita altlığı Esri World Dark Gray Canvas karolarından çevrimiçi çekilir (OpenStreetMap verisi
  içerir); internet bağlantısı gerektirir. Üretimde kurum içi OSM Servisi + PostGIS kullanılacaktır.
- Demo sunucunun durumu bellekte tutulur; sayfa yenilendiğinde başlangıç verisine döner.
