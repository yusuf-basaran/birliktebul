
# BirlikteBul

İnsanların becerilerini paylaşmasını, yeni beceriler öğrenmesini ve birbirleriyle bağlantı kurmasını sağlayan bir platform.

## Teknolojiler
- HTML5
- CSS3
- JavaScript
- Supabase Auth
- Supabase PostgreSQL ve Row Level Security
- Vercel

## Dosyalar
- `index.html` — sayfa yapısı
- `style.css` — responsive tasarım
- `script.js` — arayüz, kimlik doğrulama ve veritabanı işlemleri
- `supabase.sql` — veritabanı tabloları ve güvenlik politikaları

## Supabase yapılandırması
1. `supabase.sql` dosyasını Supabase SQL Editor'da çalıştır.
2. Supabase Project Settings > API bölümünden Project URL ve publishable key değerlerini al.
3. Bu değerleri `script.js` dosyasındaki `SUPABASE_URL` ve `SUPABASE_KEY` alanlarına ekle.
4. Supabase Authentication URL Configuration alanına Vercel site adresini ekle.

## Vercel
GitHub deposunu Vercel'e bağla. Proje statik HTML/CSS/JS kullandığı için derleme komutu gerekmez. Dosyalar depo kökünde bulunmalı.

## Güvenlik
- Tarayıcıda yalnızca publishable key veya eski anon key kullanılmalı.
- `service_role` ve secret key tarayıcıya kesinlikle eklenmemeli.
- Veritabanı tablolarında RLS etkinleştirilmiştir.

## MVP sınırları
Bu sürümde hesap açma, giriş, beceri yayınlama ve öğrenme isteği oluşturma bulunur. İstekleri yönetmek için bir gelen kutusu, e-posta bildirimi, profil düzenleme ekranı ve özel mesajlaşma henüz eklenmemiştir.
