"use client";

import { useEffect, useState, useRef } from "react";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  BookOpen,
  Library,
  Star,
  Users,
  History,
  FlaskConical,
  Globe,
  X,
  Loader2,
} from "lucide-react";

// Kategori bacaan yang cocok untuk siswa/umum
const CATEGORIES = [
  {
    id: "cerita-rakyat",
    label: "Cerita Rakyat & Dongeng",
    icon: <History className="w-4 h-4" />,
    query: "cerita rakyat indonesia dongeng anak",
  },
  {
    id: "sains",
    label: "Sains & Alam",
    icon: <FlaskConical className="w-4 h-4" />,
    query: "sains untuk anak ensiklopedia alam",
  },
  {
    id: "tokoh",
    label: "Biografi & Pahlawan",
    icon: <Users className="w-4 h-4" />,
    query: "biografi pahlawan indonesia tokoh inspiratif",
  },
  {
    id: "pengetahuan",
    label: "Pengetahuan Umum",
    icon: <Globe className="w-4 h-4" />,
    query: "pengetahuan umum pelajar",
  },
  {
    id: "fiksi-remaja",
    label: "Cerita Remaja",
    icon: <Star className="w-4 h-4" />,
    query: "novel remaja indonesia mendidik",
  },
];

export default function ReadingCornerPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [selectedBook, setSelectedBook] = useState(null); // Buku yang sedang dibaca (untuk modal)

  // Fetch books based on query
  const fetchBooks = async (query) => {
    try {
      setLoading(true);
      // Gunakan 'filter=partial' agar dapat preview, 'printType=books'
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          query
        )}&langRestrict=id&maxResults=20&printType=books&filter=partial`
      );
      const data = await res.json();
      setBooks(data.items || []);
    } catch (error) {
      console.error("Failed to fetch books:", error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBooks(activeCategory.query);
  }, [activeCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveCategory(null); // Clear category selection mostly for UI state
      fetchBooks(searchQuery);
    }
  };

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setSearchQuery("");
    fetchBooks(cat.query);
  };

  const openBook = (book) => {
    setSelectedBook(book);
  };

  const closeBook = () => {
    setSelectedBook(null);
  };

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <PageHeader
        title="Sudut Baca Sekolah"
        description="Perpustakaan digital untuk menambah wawasan dan imajinasi."
        breadcrumbs={[
          { label: "Dashboard", href: "/siswa/dashboard" },
          { label: "Sudut Baca" },
        ]}
      />

      {/* Bagian Filter & Pencarian */}
      <div className="flex flex-col gap-6">
        {/* Search Bar */}
        <div className="flex w-full max-w-lg items-center space-x-2">
          <Input
            type="text"
            placeholder="Cari judul buku, topik, atau penulis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
            className="flex-1 bg-white"
          />
          <Button type="submit" onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Cari
          </Button>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory?.id === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryClick(cat)}
              className="rounded-full"
            >
              {cat.icon}
              <span className="ml-2">{cat.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Grid Buku */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center text-slate-800">
          <Library className="mr-2 h-5 w-5 text-blue-600" />
          {activeCategory
            ? `Rekomendasi: ${activeCategory.label}`
            : `Hasil Pencarian: "${searchQuery}"`}
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-64 bg-slate-200 rounded-md animate-pulse" />
                <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
              </div>
            ))}
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {books.map((book) => {
              const info = book.volumeInfo;
              const thumbnail =
                info.imageLinks?.thumbnail?.replace("http:", "https:") ||
                info.imageLinks?.smallThumbnail?.replace("http:", "https:");

              return (
                <Card
                  key={book.id}
                  className="group flex flex-col h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200 cursor-pointer"
                  onClick={() => openBook(book)}
                >
                  <div className="relative h-64 bg-slate-100 overflow-hidden w-full">
                    {thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnail}
                        alt={info.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <BookOpen className="h-12 w-12" />
                      </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="font-semibold"
                      >
                        Baca Sekarang
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-3 flex-1 flex flex-col space-y-1">
                    <h3
                      className="font-bold text-slate-900 leading-snug line-clamp-2"
                      title={info.title}
                    >
                      {info.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1">
                      {info.authors ? info.authors.join(", ") : "Tanpa Penulis"}
                    </p>
                    {info.categories && (
                      <div className="pt-2 mt-auto">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-5"
                        >
                          {info.categories[0]}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">
              Tidak ditemukan buku untuk kategori ini.
            </p>
            <Button
              variant="link"
              onClick={() => handleCategoryClick(CATEGORIES[0])}
            >
              Kembali ke Cerita Rakyat
            </Button>
          </div>
        )}
      </div>

      {/* Reader Modal (Embed) */}
      <Dialog open={!!selectedBook} onOpenChange={closeBook}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50">
          <DialogHeader className="px-6 py-4 border-b bg-white flex-shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-bold text-slate-800 line-clamp-1 pr-4">
              {selectedBook?.volumeInfo.title}
            </DialogTitle>
            {/* Close button handled by Dialog primitive, but we can add actions if needed */}
          </DialogHeader>

          <div className="flex-1 w-full bg-white relative">
            {selectedBook ? (
              <iframe
                src={`https://books.google.co.id/books?id=${selectedBook.id}&lpg=PP1&pg=PP1&output=embed`}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                allowFullScreen
                className="w-full h-full"
                title="Book Reader"
              ></iframe>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="px-4 py-2 bg-slate-100 border-t text-xs text-center text-slate-500">
            Didukung oleh Google Books. Beberapa halaman mungkin tidak tersedia
            (Preview Mode).
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
