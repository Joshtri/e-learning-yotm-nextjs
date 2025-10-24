# Responsive DataTable Documentation

## 🎯 Overview

DataTable component sekarang sudah fully responsive dengan automatic switching antara tampilan table (desktop) dan card grid (mobile).

## 📱 Fitur Responsive

### Desktop/Tablet View (≥768px)
- Tampilan **table** tradisional dengan rows dan columns
- Horizontal scroll untuk table yang lebar
- Header yang sticky (opsional)
- Cocok untuk layar lebar dengan banyak kolom

### Mobile View (<768px)
- Tampilan **card grid** yang lebih mobile-friendly
- Setiap row menjadi 1 card
- Field ditampilkan secara vertikal (label + value)
- Lebih mudah dibaca di layar kecil
- Tidak perlu horizontal scroll

## 🔧 Cara Kerja

### 1. Detection
```javascript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768); // 768px = md breakpoint
  };

  checkMobile();
  window.addEventListener("resize", checkMobile);
  return () => window.removeEventListener("resize", checkMobile);
}, []);
```

### 2. Conditional Rendering
```javascript
if (isMobile) {
  return <MobileCardView />;
}

return <DesktopTableView />;
```

## 📊 Layout Comparison

### Desktop View
```
┌─────────────────────────────────────────────┐
│  No │ Nama      │ NISN    │ Status │ Aksi  │
├─────┼───────────┼─────────┼────────┼───────┤
│  1  │ Ahmad     │ 1234567 │ Aktif  │ [...]  │
│  2  │ Budi      │ 2345678 │ Aktif  │ [...]  │
│  3  │ Citra     │ 3456789 │ Aktif  │ [...]  │
└─────────────────────────────────────────────┘
```

### Mobile View (Cards)
```
┌─────────────────────────┐
│ No                      │
│ 1                       │
│                         │
│ Nama                    │
│ Ahmad                   │
│                         │
│ NISN                    │
│ 1234567                 │
│                         │
│ Status                  │
│ Aktif                   │
│                         │
│ Aksi                    │
│ [Button Actions]        │
└─────────────────────────┘

┌─────────────────────────┐
│ No                      │
│ 2                       │
│                         │
│ Nama                    │
│ Budi                    │
│ ...                     │
└─────────────────────────┘
```

## 🎨 Styling

### Mobile Card
```jsx
<Card>
  <CardContent className="p-4 space-y-3">
    <div className="flex flex-col space-y-1">
      <span className="text-xs font-medium text-muted-foreground">
        {column.header}
      </span>
      <div className="text-sm">
        {value}
      </div>
    </div>
  </CardContent>
</Card>
```

### Desktop Table
- Menggunakan component `Table`, `TableHeader`, `TableBody`
- Styling sama seperti sebelumnya
- Support horizontal scroll

## 💡 Usage

Tidak ada perubahan dalam cara penggunaan! Component akan otomatis beradaptasi:

```jsx
<DataTable
  data={students}
  columns={[
    { header: "No", accessorKey: "no" },
    { header: "Nama", accessorKey: "nama" },
    { header: "NISN", accessorKey: "nisn" },
    {
      header: "Status",
      cell: (row) => <Badge>{row.status}</Badge>
    },
    {
      header: "Aksi",
      cell: (row) => (
        <Button onClick={() => handleEdit(row)}>
          Edit
        </Button>
      )
    }
  ]}
  isLoading={loading}
  emptyMessage="Tidak ada data"
  keyExtractor={(item) => item.id}
/>
```

## 🎯 Features

### Loading State
**Desktop:** Skeleton rows di table
**Mobile:** Skeleton cards

### Empty State
**Desktop:** Single row dengan colspan
**Mobile:** Single empty card dengan message

### Data Rendering
**Desktop:** Table rows
**Mobile:** Individual cards dengan label-value pairs

## 🔍 Breakpoint

```javascript
const MOBILE_BREAKPOINT = 768; // pixels (md breakpoint di Tailwind)
```

- **< 768px:** Mobile view (cards)
- **≥ 768px:** Desktop view (table)

## 🎬 Animation & Transitions

Component tidak menggunakan animation saat switch karena:
1. Performa lebih baik
2. Instant feedback
3. Switch hanya terjadi saat resize (jarang)

Jika ingin menambahkan animation, bisa menggunakan Framer Motion:

```jsx
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence mode="wait">
  {isMobile ? (
    <motion.div
      key="mobile"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Mobile cards */}
    </motion.div>
  ) : (
    <motion.div
      key="desktop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Desktop table */}
    </motion.div>
  )}
</AnimatePresence>
```

## 📝 Best Practices

### 1. Column Configuration
Pastikan semua columns memiliki `header` yang jelas:
```javascript
columns: [
  { header: "No", accessorKey: "no" },
  { header: "Nama Lengkap", accessorKey: "fullName" }, // ✅ Good
  // { header: "", cell: (row) => <Button>Edit</Button> } // ❌ Bad for mobile
]
```

### 2. Cell Rendering
Untuk aksi buttons, berikan label yang jelas:
```javascript
{
  header: "Aksi",
  cell: (row) => (
    <div className="flex gap-2">
      <Button size="sm">
        <Edit className="h-4 w-4 mr-1" />
        Edit
      </Button>
      <Button size="sm" variant="destructive">
        <Trash className="h-4 w-4 mr-1" />
        Hapus
      </Button>
    </div>
  )
}
```

### 3. Responsive Images
Untuk kolom dengan gambar:
```javascript
{
  header: "Foto",
  cell: (row) => (
    <img
      src={row.photo}
      alt={row.name}
      className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
    />
  )
}
```

### 4. Long Text
Gunakan truncation untuk text panjang:
```javascript
{
  header: "Deskripsi",
  cell: (row) => (
    <p className="line-clamp-2 text-sm">
      {row.description}
    </p>
  )
}
```

## 🧪 Testing

### Desktop
1. Buka di browser dengan lebar ≥768px
2. Verify table tampil dengan benar
3. Test horizontal scroll jika ada banyak kolom

### Mobile
1. Buka di browser dengan lebar <768px (atau gunakan DevTools)
2. Verify cards tampil dengan benar
3. Test scrolling vertikal
4. Verify semua data terlihat dengan jelas

### Resize
1. Resize browser dari lebar ke sempit
2. Verify automatic switch dari table ke cards
3. Verify tidak ada glitch atau flash

## 🚀 Performance

- ✅ Efficient re-render (hanya saat resize)
- ✅ Cleanup event listener saat unmount
- ✅ Debounce tidak diperlukan karena setState sudah batched
- ✅ Conditional rendering dengan early return

## 🎨 Customization

Jika ingin mengubah breakpoint:

```jsx
const CUSTOM_BREAKPOINT = 1024; // untuk lg breakpoint

const checkMobile = () => {
  setIsMobile(window.innerWidth < CUSTOM_BREAKPOINT);
};
```

## 📱 Mobile-First Considerations

1. **Touch Targets:** Pastikan buttons minimal 44x44px
2. **Spacing:** Gunakan padding yang cukup (min 16px)
3. **Font Size:** Minimal 14px untuk readability
4. **Contrast:** Pastikan text readable di layar kecil

## ✅ Compatibility

- ✅ Next.js 15
- ✅ React 19
- ✅ Tailwind CSS 4
- ✅ shadcn/ui components
- ✅ Client-side only (menggunakan useEffect)
- ✅ SSR safe (useState initialized dengan false)

---

**Last Updated:** 2025-01-24
**Component:** `components/ui/data-table.jsx`
**Status:** ✅ Production Ready
