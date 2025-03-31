"use client"

import { useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { EntityForm } from "@/components/ui/entity-form"

export function EntityDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  apiEndpoint,
  onSuccess,
  defaultValues = {},
  successMessage = "Data berhasil disimpan!",
  errorMessage = "Gagal menyimpan data.",
  submitLabel = "Simpan",
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      await axios.post(apiEndpoint, data)
      toast.success(successMessage)
      if (onSuccess) onSuccess()
      onOpenChange(false)
    } catch (error) {
      let msg = errorMessage
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || msg
      }
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <EntityForm
          fields={fields}
          onSubmit={handleSubmit}
          defaultValues={defaultValues}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
        />

        <div className="flex justify-start">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

