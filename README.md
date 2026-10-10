
# BirlikteBul

BirlikteBul, kullanıcıların becerilerini paylaşmasını ve birbirlerinden öğrenmesini sağlayan web platformudur.

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
- Mobil uyumlu kullanıcı paneli
- Supabase Row Level Security politikaları

## Dosyalar

- `index.html`
- `style.css`
- `script.js`
- `supabase.sql`

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

Proje klasörünü bir editörde aç.

Visual Studio Code kullanıyorsan Live Server eklentisiyle `index.html` dosyasını açabilirsin.

`index.html` dosyasını doğrudan `file://` üzerinden açmak yerine HTTP sunucusu kullan.

## 5. GitHub'a yükle

Dört dosyayı depo kök dizinine ekle ve commit/push işlemi yap.

Örnek Git komutları:

    git add index.html style.css script.js supabase.sql README.md
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
- [ ] E-posta ve şifre güncellemeleri test edildi
- [ ] Mobil görünüm kontrol edildi

## Güvenlik

Tarayıcıya yalnızca public/publishable Supabase anahtarı eklenir. Güvenlik, veritabanı RLS politikaları ve Supabase Auth ile sağlanır.

Üretime geçmeden önce mevcut tablo şemalarını, RLS politikalarını, e-posta doğrulamasını ve talep durumlarının yetkilendirmesini test et.
