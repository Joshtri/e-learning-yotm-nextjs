'use client'

import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import ModalForm from '@/components/ui/modal-form'
import FormField from '@/components/ui/form-field'
import api from '@/lib/axios'

export default function ClassSubjectTutorAddModal({
  open,
  onClose,
  onSuccess,
  classes = [],
  subjects = [],
  tutors = [],
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      classId: '',
      subjectId: '',
      tutorId: '',
    },
  })

  const onSubmit = async (data) => {
    try {
      await api.post('/class-subject-tutors', data)
      toast.success('Berhasil menambahkan jadwal mengajar')
      reset()
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Gagal menambahkan jadwal:', err)
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data')
    }
  }

  return (
    <ModalForm
      isOpen={open}
      onClose={onClose}
      title="Tambah Jadwal Mengajar"
      description="Pilih kelas, mata pelajaran, dan tutor"
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField
        label="Kelas"
        name="classId"
        type="select"
        control={control}
        placeholder="Pilih kelas"
        {...register('classId', { required: 'Kelas wajib dipilih' })}
        options={classes.map((c) => ({
          value: c.id,
          label: c.namaKelas,
        }))}
        error={errors.classId?.message}
      />

      <FormField
        label="Mata Pelajaran"
        name="subjectId"
        type="select"
        control={control}
        placeholder="Pilih mata pelajaran"
        {...register('subjectId', { required: 'Mata pelajaran wajib dipilih' })}
        options={subjects.map((s) => ({
          value: s.id,
          label: s.namaMapel,
        }))}
        error={errors.subjectId?.message}
      />

      <FormField
        label="Tutor"
        name="tutorId"
        type="select"
        control={control}
        placeholder="Pilih tutor"
        {...register('tutorId', { required: 'Tutor wajib dipilih' })}
        options={tutors.map((t) => ({
          value: t.id,
          label: t.namaLengkap,
        }))}
        error={errors.tutorId?.message}
      />
    </ModalForm>
  )
}
