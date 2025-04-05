"use client"

import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/axios"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { DataToolbar } from "@/components/ui/data-toolbar"
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import LearningMaterialAddModal from "@/components/tutors/learning-materials/LearningMaterialAddModal"

export default function ClassMaterialsPage() {
  const [data, setData] = useState([])
  const [classInfo, setClassInfo] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const params = useParams()
  const router = useRouter()
  const classSubjectTutorId = params.id

  const fetchData = async () => {
    try {
      setIsLoading(true)
      // Fetch materials for this specific class-subject-tutor
      const res = await api.get(`/tutor/learning-materials?classSubjectTutorId=${classSubjectTutorId}`)
      setData(res.data.data || [])

      // Fetch class info
      const classRes = await api.get(`/tutor/my-classes/${classSubjectTutorId}`)
      setClassInfo(classRes.data.data)
    } catch (error) {
      console.error("Gagal mengambil data materi:", error)
      toast.error("Gagal memuat data materi")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [classSubjectTutorId])

  const filteredData = useMemo(() => {
    if (!searchQuery) return data
    return data.filter((item) => item.judul.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [data, searchQuery])

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus materi ini?")) return

    try {
      await api.delete(`/tutor/learning-materials/${id}`)
      toast.success("Materi berhasil dihapus")
      fetchData() // refresh list
    } catch (error) {
      toast.error("Gagal menghapus materi")
    }
  }

  const handleDownload = (fileUrl, fileName) => {
    if (!fileUrl) {
      toast.error("Tidak ada file yang tersedia")
      return
    }

    // Create a temporary link element
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName || "materi"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Judul",
      cell: (row) => row.judul,
    },
    {
      header: "Tanggal Dibuat",
      cell: (row) => new Date(row.createdAt).toLocaleDateString("id-ID"),
    },
    {
      header: "File",
      cell: (row) => (row.fileUrl ? "Tersedia" : "Tidak ada"),
    },
    {
      header: "Aksi",
      cell: (row) => (
        <div className="flex gap-2">
          {row.fileUrl && (
            <Button variant="outline" size="sm" onClick={() => handleDownload(row.fileUrl, row.judul)}>
              <Download className="h-4 w-4 mr-1" />
              Unduh
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.id)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Hapus
          </Button>
        </div>
      ),
      className: "w-[200px]",
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader
        title={`Materi Pembelajaran: ${classInfo?.class?.namaKelas || ""} - ${classInfo?.subject?.namaMapel || ""}`}
        description="Kelola materi pembelajaran untuk kelas ini."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Materi
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: "Materi Pembelajaran", href: "/tutor/materials" },
          { label: `${classInfo?.class?.namaKelas || ""} - ${classInfo?.subject?.namaMapel || ""}`, href: "#" },
        ]}
      />

      <Tabs defaultValue="all" className="space-y-6">
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={(value) => setSearchQuery(value)}
          searchPlaceholder="Cari judul materi..."
          filterOptions={[]}
        />

        <TabsContent value="all" className="space-y-4">
          <DataTable
            data={filteredData}
            columns={columns}
            isLoading={isLoading}
            loadingMessage="Memuat materi..."
            emptyMessage="Belum ada materi untuk kelas ini"
            keyExtractor={(item) => item.id}
          />
        </TabsContent>
      </Tabs>

      {classInfo && (
        <LearningMaterialAddModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchData}
          defaultClassSubjectTutorId={classSubjectTutorId}
        />
      )}
    </div>
  )
}

