'use client'

import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import api from '@/lib/axios'
import ModalForm from '@/components/ui/modal-form'
import FormField from '@/components/ui/form-field'

export default function ProgramAddModal({ open, onClose, onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      namaPaket: '',
    },
  })

  const onSubmit = async (data) => {
    try {
      await api.post('/programs', data)
      toast.success('Program berhasil ditambahkan')
      reset()
      onClose()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Gagal menambahkan program:', error)
      toast.error(
        error.response?.data?.message || 'Terjadi kesalahan saat menyimpan'
      )
    }
  }

  return (
    <ModalForm
      isOpen={open}
      onClose={onClose}
      size='sm'
      title="Tambah Program"
      description="Masukkan nama program/paket pembelajaran"
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField
        label="Nama Program"
        type="text"
        control={control}
        autoComplete="off"
        name="namaPaket"
        placeholder="Contoh: Paket A"
        {...register('namaPaket', { required: 'Nama program wajib diisi' })}
        error={errors.namaPaket?.message}
      />
    </ModalForm>
  )
}
