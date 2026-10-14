# BirlikteBul

BirlikteBul, beceri paylaşmak ve yeni bir konu öğrenmek isteyen kişileri buluşturan bir web uygulamasıdır. Kullanıcılar ilan oluşturabilir, ilan sahibine öğrenme talebi gönderebilir ve taleplerini hesaplarından takip edebilir.

## Özellikler

- E-posta ile kayıt, giriş ve şifre sıfırlama
- Profil bilgileri ve fotoğrafı
- Beceri ilanı oluşturma, düzenleme ve silme
- Konu, şehir ve kategoriye göre arama
- Öğrenme talebi gönderme, kabul etme, reddetme ve iptal etme
- E-posta ve şifre değiştirme
- Telefon ve bilgisayarda kullanım

Her kullanıcı aynı ilana bir kez talep gönderebilir. İptal edilen veya sonuçlanan talep yeniden gönderilemez.

## Yerel kullanım

Node.js 22 veya üzeri gerekir. Uygulamanın çalışması için derleme veya paket kurulumu gerekmez.

```sh
node scripts/serve.cjs
```

Tarayıcıda [localhost:5500](http://localhost:5500) adresini açın. Başka bir port için `PORT` ortam değişkenini kullanın.

## Supabase kurulumu

Bağlantı ayarları `script.js` içindeki `SUPABASE_URL` ve `SUPABASE_KEY` değişkenlerindedir. Tarayıcıda public/publishable anahtar kullanılır; secret veya `service_role` anahtarı kullanılmaz.

- Yeni veritabanında `supabase.sql` dosyasını SQL Editor'da çalıştırın.
- Önceden kurulmuş BirlikteBul veritabanında `harden_requests.sql` dosyasını çalıştırın. Bu dosya taleplerin güncelleme izinlerini düzenler ve verileri silmez.
- Authentication ayarlarında e-posta ile kaydı etkinleştirin. E-posta doğrulamasını ihtiyacınıza göre ayarlayın.
- Site URL alanına yayın adresini, Redirect URLs listesine yayın adresini ve `http://localhost:5500` adresini ekleyin.

Veritabanı erişimi kullanıcıya göre RLS politikalarıyla sınırlandırılır. Talep mesajlarını yalnızca gönderen kişi ve ilan sahibi görebilir. Profil fotoğrafları `avatars` alanında saklanır; JPG, PNG ve WebP dosyaları için sınır 3 MB'tır.

## Yayınlama

`index.html`, `style.css` ve `script.js` dosyalarını bir statik web sunucusunda yayınlayın. Vercel kullanılıyorsa framework seçimi `Other`, build command boş ve output directory `.` olmalıdır.

Yayın adresini Supabase Authentication URL ayarlarına ekleyin. Kayıt, e-posta doğrulama, şifre sıfırlama ve fotoğraf yükleme işlemlerini yayınlanan adreste kontrol edin.

## Geliştirme

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm run check
pnpm test
```

Tarayıcı testleri Playwright, veritabanı testleri PGlite kullanır. Test verileri canlı Supabase projesinden ayrıdır. GitHub Actions her push ve pull request'te bu kontrolleri çalıştırır.

## Dosyalar

| Dosya | İşlev |
| --- | --- |
| `index.html` | Sayfalar ve formlar |
| `style.css` | Görünüm ve mobil düzen |
| `script.js` | Oturum, profil, ilan ve talep işlemleri |
| `supabase.sql` | Veritabanı, erişim politikaları ve depolama kurulumu |
| `harden_requests.sql` | Mevcut kurulum için talep izinleri güncellemesi |
| `scripts/serve.cjs` | Yerel sunucu |
| `tests/` | Uygulama ve veritabanı testleri |
