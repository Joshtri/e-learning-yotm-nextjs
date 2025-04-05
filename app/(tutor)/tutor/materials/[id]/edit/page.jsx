'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import FormField from '@/components/ui/form-field'

export default function EditMaterialPage() {
  const { id } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [material, setMaterial] = useState(null)
  const [classSubjectOptions, setClassSubjectOptions] = useState([])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, relasi] = await Promise.all([
          api.get(`/tutor/learning-materials/${id}`),
          api.get(`/tutor/my-class-subjects`),
        ])
        setMaterial(res.data.data)
        setClassSubjectOptions(relasi.data.data)
        reset({
          judul: res.data.data.judul,
          konten: res.data.data.konten,
          classSubjectTutorId: res.data.data.classSubjectTutorId,
        })
      } catch (error) {
        console.error(error)
        toast.error('Gagal memuat data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, reset])

  const onSubmit = async (data) => {
    try {
      const formData = new FormData()
      formData.append('judul', data.judul)
      formData.append('konten', data.konten || '')
      formData.append('classSubjectTutorId', data.classSubjectTutorId)
      if (data.file?.[0]) {
        formData.append('file', data.file[0])
      }

      await api.put(`/tutor/learning-materials/${id}`, formData)
      toast.success('Materi berhasil diperbarui')
      router.push('/tutor/materials')
    } catch (err) {
      console.error(err)
      toast.error('Gagal update materi')
    }
  }

  if (loading) return <p className="p-6">Loading...</p>

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-xl font-bold mb-4">Edit Materi Pembelajaran</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Judul"
          name="judul"
          type="text"
          control={control}
          {...register('judul', { required: 'Judul wajib diisi' })}
          error={errors.judul?.message}
        />

        <FormField
          label="Konten"
          name="konten"
          type="textarea"
          control={control}
          {...register('konten')}
        />

        <FormField
          label="Kelas & Mapel"
          name="classSubjectTutorId"
          type="select"
          control={control}
          {...register('classSubjectTutorId', { required: 'Pilih kelas & mapel' })}
          options={classSubjectOptions.map((cst) => ({
            value: cst.id,
            label: `${cst.class.namaKelas} - ${cst.subject.namaMapel}`,
          }))}
          error={errors.classSubjectTutorId?.message}
        />

        <FormField
          label="Ganti File (opsional)"
          name="file"
          type="file"
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          {...register('file')}
        />

        {material?.fileUrl && (
          <div className="text-sm text-muted-foreground">
            File sekarang:{' '}
            <a href={material.fileUrl} className="text-blue-600 underline" target="_blank">
              {material.fileUrl.split('/').pop().split('?')[0]}
            </a>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit">Simpan Perubahan</Button>
        </div>
      </form>
    </div>
  )
}
