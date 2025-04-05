'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { DataToolbar } from '@/components/ui/data-toolbar'
import { DataExport } from '@/components/ui/data-export'
import { DataTable } from '@/components/ui/data-table'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AssignmentPage() {
  const [data, setData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/assignments')
      setData(res.data.data || [])
    } catch (err) {
      console.error('Gagal memuat data:', err)
      toast.error('Gagal memuat tugas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = useMemo(() => {
    if (!searchQuery) return data
    return data.filter((item) =>
      item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.classSubjectTutor.class.namaKelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.classSubjectTutor.subject.namaMapel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.classSubjectTutor.tutor.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [data, searchQuery])

  const columns = [
    {
      header: 'No',
      cell: (_, index) => index + 1,
      className: 'w-[50px]',
    },
    {
      header: 'Judul Tugas',
      cell: (row) => row.judul,
    },
    {
      header: 'Jenis',
      cell: (row) => row.jenis,
    },
    {
      header: 'Kelas',
      cell: (row) => row.classSubjectTutor?.class?.namaKelas || '-',
    },
    {
      header: 'Mapel',
      cell: (row) => row.classSubjectTutor?.subject?.namaMapel || '-',
    },
    {
      header: 'Tutor',
      cell: (row) => row.classSubjectTutor?.tutor?.namaLengkap || '-',
    },
    {
      header: 'Aktif',
      cell: (row) =>
        `${new Date(row.waktuMulai).toLocaleDateString('id-ID')} - ${new Date(
          row.waktuSelesai
        ).toLocaleDateString('id-ID')}`,
    },
    {
      header: 'Nilai Maks',
      cell: (row) => row.nilaiMaksimal ?? '-',
    },
    {
      header: 'Aksi',
      cell: (row) => (
        <Link href={`/admin/assignments/${row.id}`}>
          <Button variant="outline" size="sm">Lihat</Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Daftar Tugas"
            description="Semua tugas yang dibuat oleh tutor"
            actions={<DataExport data={data} filename="tugas.csv" label="Export" />}
          />

          <Tabs defaultValue="all" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={(value) => setSearchQuery(value)}
              searchPlaceholder="Cari judul, kelas, mapel, atau tutor..."
              filterOptions={[]}
            />

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredData}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data tugas..."
                emptyMessage="Tidak ada tugas ditemukan"
                keyExtractor={(item) => item.id}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
