
# BirlikteBul

BirlikteBul, kullanıcıların becerilerini paylaşmasını ve birbirlerinden öğrenmesini sağlayan web platformudur.

Mevcut `gjjiomuxwkzgkvjxencd` Supabase bağlantısı korunmuştur. Tarayıcı yalnızca public `anon` anahtarını kullanır. HTML/CSS/JavaScript uygulaması derleme gerektirmez.

## Mevcut kurulum için güncelleme

1. Bu sürümün uygulama dosyalarını yayınla.
2. Aynı Supabase projesinde SQL Editor'ı açıp **`harden_requests.sql`** dosyasını çalıştır. Mevcut verileri silmez ve tekrar çalıştırılabilir. Bu güncelleme, taleplerin kimlik/mesaj alanlarının değiştirilmesini ve sonuçlanmış taleplerin yeniden açılmasını engeller.
3. Authentication > URL Configuration bölümünde Site URL ve Redirect URLs değerlerinin yayın adresinle eşleştiğini kontrol et. Şifre kurtarma bağlantısı kullanıcıyı doğrudan yeni şifre ekranına götürür.

Yeni bir veritabanı kurarken bunun yerine `supabase.sql` çalıştır; güvenlik güncellemesi bu dosyaya da dahildir. Mevcut tablolar farklı bir şemadaysa önce karşılaştır.

## Özellikler

- E-posta ve şifreyle kayıt ve giriş
- Oturumun tarayıcıda korunması
- Kişisel profil: görünen ad, şehir, biyografi
- Supabase Storage üzerinden profil fotoğrafı yükleme
- E-posta değiştirme ve şifre güncelleme
- Şifre sıfırlama e-postası gönderme
- Beceri ilanı oluşturma, düzenleme ve silme
- Kategoriye ve metne göre arama
- Öğrenme talebi gönderme
- Gelen talepleri kabul etme veya reddetme
- Gönderilen bekleyen talepleri iptal etme
- Mobil uyumlu, 1000 karakter sınırı olan öğrenme talebi formu
- Klavye odağını koruyan pencereler ve hata sonrası ilanları yenileme
- Mobil uyumlu kullanıcı paneli
- Supabase Row Level Security politikaları

## Dosyalar

- `index.html`
- `style.css`
- `script.js`
- `supabase.sql`
- `harden_requests.sql` — mevcut kurulumun güvenlik güncellemesi
- `scripts/serve.cjs` — yerel statik sunucu
- `tests/` — tarayıcı ve Postgres güvenlik testleri

## 1. Supabase projesi oluştur

https://supabase.com üzerinden bir proje oluştur.

Project Settings > API bölümünden şu değerleri al:

- Project URL
- Publishable key veya projende kullanılabiliyorsa anon public key

`script.js` dosyasının başındaki iki sabit değişkene bu değerleri gir.

ÖNEMLİ: `service_role` veya secret key'i asla tarayıcıda kullanılan JavaScript dosyasına ekleme.

## 2. Veritabanını kur

Supabase Dashboard > SQL Editor > New query bölümüne git.

`supabase.sql` dosyasının içeriğini yapıştır ve çalıştır.

Mevcut veritabanını kullanıyorsan önce yedek al. Mevcut tabloların farklı kolonları veya yabancı anahtarları varsa SQL'i uygulamadan önce şemayı karşılaştır.

## 3. Kimlik doğrulama ayarları

Supabase Dashboard > Authentication bölümüne git.

- Kullanıcı kaydını etkinleştir.
- E-posta doğrulamasını ihtiyacına göre ayarla.
- Site URL değerini yayınlayacağın web sitesinin adresi olarak ayarla.
- Redirect URLs listesine yerel test adresini ve yayın adresini ekle.

Örnek yerel test adresi:
http://localhost:5500

Yayın adresi örneği:
https://projen.vercel.app

Kendi gerçek adreslerini kullanmalısın.

## 4. Yerel ortamda çalıştır

Node.js 22 veya üzeri ile:

```sh
node scripts/serve.cjs
```

Tarayıcıda `http://localhost:5500` aç. Sunucu yalnızca uygulamanın üç statik dosyasını sunar. Portu değiştirmek için `PORT` ortam değişkenini kullanabilirsin.

Proje klasörünü bir editörde aç.

Visual Studio Code kullanıyorsan Live Server eklentisiyle `index.html` dosyasını açabilirsin.

`index.html` dosyasını doğrudan `file://` üzerinden açmak yerine HTTP sunucusu kullan.

## 5. GitHub'a yükle

Uygulama, SQL, test ve yapılandırma dosyalarını depo kök dizinine ekle ve commit/push işlemi yap.

Örnek Git komutları:

    git add .
    git commit -m "BirlikteBul kullanıcı paneli"
    git push

## 6. Vercel ile yayınla

Vercel'de GitHub deposunu içe aktar.

Statik HTML projesi için:

- Framework preset: Other
- Build command: boş
- Output directory: .
- Root directory: proje dosyalarının bulunduğu dizin

Deploy işleminden sonra oluşan adresi Supabase Authentication URL ayarlarına ekle.

## 7. Kontrol listesi

- [ ] Supabase bağlantısı doğru
- [ ] SQL kurulumu hatasız tamamlandı
- [ ] Yeni kullanıcı kaydı çalışıyor
- [ ] E-posta doğrulaması gerekiyorsa bağlantı açılıyor
- [ ] Profil bilgileri kaydediliyor
- [ ] Profil fotoğrafı yükleniyor
- [ ] Beceri ilanı ekleniyor ve siliniyor
- [ ] Öğrenme talebi gönderiliyor
- [ ] Talep kabul/ret işlemi çalışıyor
- [ ] Gönderilen bekleyen talep iptal ediliyor
- [ ] Şifre kurtarma bağlantısı yeni şifre ekranını açıyor
- [ ] E-posta ve şifre güncellemeleri test edildi
- [ ] Mobil görünüm kontrol edildi

## Güvenlik

Tarayıcıya yalnızca public/publishable Supabase anahtarı eklenir. Güvenlik, veritabanı RLS politikaları ve Supabase Auth ile sağlanır.

Üretime geçmeden önce mevcut tablo şemalarını, RLS politikalarını, e-posta doğrulamasını ve talep durumlarının yetkilendirmesini test et.

## Otomatik testler

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm run check
pnpm test
```

GitHub Actions aynı kontrolleri her push ve pull request'te çalıştırır. Tarayıcı testleri kontrollü bir Supabase taklidi kullanır; gerçek kullanıcı hesabı oluşturmaz veya e-posta göndermez. Veritabanı testleri PGlite üzerinde gerçek Postgres SQL, trigger, RLS ve sütun izinlerini çalıştırır; Supabase'in Auth/Storage şemaları test ortamında asgari biçimde oluşturulur.

Canlı ortama geçerken iki gerçek hesapla kayıt, e-posta doğrulama, fotoğraf yükleme, şifre kurtarma ve talep işlemleri ayrıca kontrol edilmelidir. Otomatik testler canlı Supabase yönetim ayarlarını doğrulamaz. Her kullanıcı aynı ilana bir kez talep gönderebilir; sonuçlanmış veya iptal edilmiş talep tekrar gönderilemez.
