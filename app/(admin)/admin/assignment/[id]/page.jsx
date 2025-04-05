import { notFound } from 'next/navigation'
import api from '@/lib/axios'
import { Badge } from '@/components/ui/badge'

export default async function AssignmentDetailPage({ params }) {
  const { id } = params

  let assignment = null

  try {
    const res = await api.get(`/assignments/${id}`)
    assignment = res.data.data
  } catch (err) {
    console.error('Gagal fetch detail tugas:', err)
    return notFound()
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">{assignment.judul}</h1>
        <p className="text-sm text-muted-foreground">
          Dibuat: {new Date(assignment.createdAt).toLocaleDateString('id-ID')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Badge>Jenis: {assignment.jenis}</Badge>
        <Badge>Kelas: {assignment.classSubjectTutor?.class?.namaKelas}</Badge>
        <Badge>Mapel: {assignment.classSubjectTutor?.subject?.namaMapel}</Badge>
        <Badge>Tutor: {assignment.classSubjectTutor?.tutor?.namaLengkap}</Badge>
      </div>

      {assignment.deskripsi && (
        <div>
          <h2 className="font-semibold mt-4">Deskripsi:</h2>
          <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: assignment.deskripsi }} />
        </div>
      )}

      <div className="space-y-2">
        <h2 className="font-semibold mt-6">Rentang Tersedia:</h2>
        <p className="text-sm">
          {new Date(assignment.waktuMulai).toLocaleDateString('id-ID')} -{' '}
          {new Date(assignment.waktuSelesai).toLocaleDateString('id-ID')}
        </p>

        {assignment.batasWaktuMenit && (
          <p className="text-sm">⏱️ Batas Waktu: {assignment.batasWaktuMenit} menit</p>
        )}

        {assignment.nilaiMaksimal && (
          <p className="text-sm">📊 Nilai Maksimal: {assignment.nilaiMaksimal}</p>
        )}
      </div>
    </div>
  )
}
