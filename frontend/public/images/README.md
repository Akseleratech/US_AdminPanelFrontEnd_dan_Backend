# Logo Assets

## Cara Menambahkan Logo

1. **Siapkan file logo** dalam format PNG dengan nama `logo.png`
2. **Letakkan file** di folder `frontend/public/images/`
3. **Rekomendasi ukuran:**
   - Tinggi: 32-64px (akan di-resize otomatis ke 32px)
   - Format: PNG dengan background transparan
   - Rasio: Sesuaikan dengan brand guideline

## Struktur File

```
frontend/
  public/
    images/
      logo.png       <- Letakkan logo di sini
      README.md      <- File ini
```

## Catatan

- Logo akan otomatis di-resize dengan tinggi 32px
- Jika file logo tidak ditemukan, akan fallback ke teks "NextSpace Admin"
- File logo akan di-cache oleh browser untuk performa optimal 