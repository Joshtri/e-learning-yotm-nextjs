"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

import api from "@/lib/axios"
import FormField from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"

export default function ClassCreatePage() {
  const router = useRouter()
  const [programs, setPrograms] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    defaultValues: {
      namaKelas: "",
      programId: "",
      academicYearId: "",
    },
  })

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true)
        const [programRes, yearRes] = await Promise.all([
          api.get("/programs"),
          api.get("/academic-years"),
        ])
        setPrograms(programRes.data?.data?.programs || [])
        setAcademicYears(yearRes.data?.data?.academicYears || [])
      } catch (err) {
        console.error("Gagal memuat data:", err)
        toast.error("Gagal memuat data program/tahun ajaran")
      } finally {
        setLoading(false)
      }
    }

    fetchOptions()
  }, [])

  const onSubmit = async (data) => {
    try {
      setSubmitting(true)

      const payload = {
        namaKelas: data.namaKelas.trim(),
        programId: data.programId,
        academicYearId: data.academicYearId,
      }

      const res = await api.post("/classes", payload)

      if (res.data.success) {
        toast.success("Kelas berhasil ditambahkan")
        router.push("/admin/classes")
      } else {
        throw new Error(res.data.message || "Gagal menambahkan kelas")
      }
    } catch (err) {
      console.error("Submit error:", err)
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p>Memuat data program dan tahun ajaran...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Tambah Kelas Baru"
        description="Isi informasi kelas yang ingin ditambahkan"
        backButton={{ href: "/admin/classes", label: "Kembali ke daftar kelas" }}
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Kelas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="namaKelas"
              label="Nama Kelas"
              placeholder="Contoh: Kelas 10 IPA A"
              required
              rules={{ required: "Nama kelas wajib diisi" }}
            />

            <FormField
              control={form.control}
              name="programId"
              label="Program / Paket"
              type="select"
              placeholder="Pilih program"
              required
              rules={{ required: "Program wajib dipilih" }}
              options={programs.map((p) => ({
                value: p.id,
                label: p.namaPaket,
              }))}
            />

            <FormField
              control={form.control}
              name="academicYearId"
              label="Tahun Ajaran"
              type="select"
              placeholder="Pilih tahun ajaran"
              required
              rules={{ required: "Tahun ajaran wajib dipilih" }}
              options={academicYears.map((y) => ({
                value: y.id,
                label: `${y.tahunMulai}/${y.tahunSelesai}`,
              }))}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/classes")}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Kelas
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
