# PDF Export Fix Documentation

## Masalah yang Diperbaiki
API export PDF mengalami error karena encoding karakter Indonesia tidak tertangani dengan baik oleh jsPDF.

## Solusi yang Diterapkan

### 1. Helper Library (`lib/pdf-helper.js`)
Dibuat utility helper yang menyediakan:
- **`createPDF(orientation)`**: Membuat instance jsPDF dengan konfigurasi yang benar
- **`addText(doc, text, x, y, options)`**: Menambahkan text dengan encoding aman menggunakan `String.normalize("NFC")`
- **`createAutoTable(doc, config)`**: Membuat tabel dengan data yang sudah dinormalisasi
- **`pdfToBuffer(doc)`**: Convert PDF ke Buffer untuk response
- **`createPDFResponse(pdfBuffer, filename)`**: Membuat response dengan headers yang benar
- **Helper functions**: `getMonthName()`, `getNilaiHuruf()`, `getPredikat()`, dll

### 2. API Routes yang Diperbaiki

#### Homeroom Reports
1. **`app/api/homeroom/reports/class-scores/route.js`**
   - Laporan rekap nilai siswa per kelas
   - Export format: PDF & Excel

2. **`app/api/homeroom/reports/attendance/route.js`**
   - Laporan presensi siswa bulanan
   - Export format: PDF & Excel

3. **`app/api/homeroom/reports/student-score/route.js`**
   - Rapor siswa individual
   - Export format: PDF & Excel

#### Tutor Reports
4. **`app/api/tutor/reports/subject-scores/route.js`**
   - Laporan nilai mata pelajaran
   - Export format: PDF & Excel

## Keuntungan Solusi Ini

### ✅ Production-Ready
- Tidak memerlukan instalasi package tambahan
- Tidak ada dependency pada external services
- Bekerja di environment serverless (Vercel, AWS Lambda, dll)

### ✅ Encoding yang Aman
- Menggunakan `String.normalize("NFC")` untuk normalisasi Unicode
- Menangani karakter Indonesia dengan baik
- Fallback untuk nilai null/undefined

### ✅ Maintainability
- Code terpusat di satu helper file
- Mudah diupdate jika ada perubahan
- Konsisten di semua API routes

### ✅ Performance
- Tidak ada overhead dari external font files
- Fast processing karena built-in jsPDF
- Compression enabled untuk file size lebih kecil

## Cara Menggunakan Helper untuk API Baru

```javascript
import {
  createPDF,
  addText,
  createAutoTable,
  pdfToBuffer,
  createPDFResponse,
} from "@/lib/pdf-helper";

function generatePDF(data) {
  const doc = createPDF("portrait"); // or "landscape"

  // Add header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  addText(doc, "JUDUL LAPORAN", 105, 20, { align: "center" });

  // Add content
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  addText(doc, `Nama: ${data.nama}`, 14, 30);

  // Add table
  createAutoTable(doc, {
    startY: 40,
    head: [["No", "Nama", "Nilai"]],
    body: data.rows,
    theme: "grid",
  });

  // Convert to buffer and create response
  const pdfBuffer = pdfToBuffer(doc);
  return createPDFResponse(pdfBuffer, "laporan.pdf");
}
```

## Testing

### Local Development
```bash
npm run dev
```
Akses API reports dan test download PDF

### Production
- Deploy ke Vercel/platform pilihan
- Test semua endpoint export PDF
- Verifikasi encoding karakter Indonesia

## Notes

- Font default: Helvetica (mendukung basic Latin characters)
- Semua text dinormalisasi menggunakan NFC (Canonical Decomposition, followed by Canonical Composition)
- Cache control diset untuk mencegah caching file yang di-generate
- Filename di-encode menggunakan `encodeURIComponent()` untuk compatibility

## Error Handling

Helper sudah menangani:
- Null/undefined values → converted ke "-"
- Long text → automatic truncation di table
- Special characters → normalized dengan NFC

---

**Last Updated:** 2025-01-24
**Status:** ✅ Production Ready
