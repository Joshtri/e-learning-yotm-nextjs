'use client'

import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/axios'

import { Button } from '@/components/ui/button'
import FormField from '@/components/ui/form-field'

export default function QuizCreatePage() {
  const router = useRouter()
  const [classSubjects, setClassSubjects] = useState([])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      judul: '',
      deskripsi: '',
      classSubjectTutorId: '',
      waktuMulai: '',
      waktuSelesai: '',
      durasiMenit: 60,
      nilaiMaksimal: 100,
      acakSoal: false,
      acakJawaban: false,
    },
  })

  useEffect(() => {
    const fetchClassSubjects = async () => {
      try {
        const res = await api.get('/tutor/my-class-subjects')
        setClassSubjects(res.data.data)
      } catch (error) {
        toast.error('Gagal memuat kelas & mapel')
      }
    }
    fetchClassSubjects()
  }, [])

  const onSubmit = async (data) => {
    console.log('Data Step 1:', data)

    // Simpan di local/session storage (sementara)
    sessionStorage.setItem('quizInfo', JSON.stringify(data))

    // Redirect ke halaman step 2 (soal)
    router.push('/tutor/quizzes/create/questions')
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Buat Kuis - Info Umum</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Judul Kuis"
          name="judul"
          type="text"
          control={control}
          {...register('judul', { required: 'Judul wajib diisi' })}
          error={errors.judul?.message}
        />

        <FormField
          label="Deskripsi"
          control={control}
          name="deskripsi"
          type="textarea"
            placeholder="Tuliskan deskripsi kuis"
          {...register('deskripsi')}
        />

        <FormField
          label="Kelas & Mapel"
          name="classSubjectTutorId"
          type="select"
          control={control}
          placeholder="Pilih Kelas dan Mapel"
          options={classSubjects.map((item) => ({
            value: item.id,
            label: `${item.class.namaKelas} - ${item.subject.namaMapel}`,
          }))}
          {...register('classSubjectTutorId', { required: 'Kelas dan Mapel wajib dipilih' })}
          error={errors.classSubjectTutorId?.message}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            label="Waktu Mulai"
            name="waktuMulai"
            type="datetime-local"
            control={control}

            {...register('waktuMulai', { required: 'Wajib diisi' })}
            error={errors.waktuMulai?.message}
          />
          <FormField
            label="Waktu Selesai"
            name="waktuSelesai"
            control={control}
            placeholder="Waktu selesai"
            type="datetime-local"
            {...register('waktuSelesai', { required: 'Wajib diisi' })}
            error={errors.waktuSelesai?.message}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            label="Durasi (menit)"
            name="durasiMenit"
            control={control}
            placeholder="Durasi dalam menit"
            type="number"
            {...register('durasiMenit', { valueAsNumber: true })}
          />
          <FormField
            label="Nilai Maksimal"
            name="nilaiMaksimal"
            control={control}
            placeholder="Nilai maksimal kuis"
            type="number"
            {...register('nilaiMaksimal', { valueAsNumber: true })}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            label="Acak Soal"
            name="acakSoal"
            control={control}
            placeholder="Acak soal dalam kuis"
            type="checkbox"
            {...register('acakSoal')}
          />
          <FormField
            label="Acak Jawaban"
            name="acakJawaban"
            control={control}
            placeholder="Acak jawaban dalam kuis"
            type="checkbox"
            {...register('acakJawaban')}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit">Lanjut ke Soal</Button>
        </div>
      </form>
    </div>
  )
}
