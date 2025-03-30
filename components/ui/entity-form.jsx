"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function EntityForm({ fields, onSubmit, defaultValues = {}, isSubmitting = false, submitLabel = "Simpan" }) {
  const [showPasswords, setShowPasswords] = useState({})

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues,
  })

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>

          {field.type === "select" ? (
            <>
              <Select onValueChange={(value) => setValue(field.name, value)} defaultValue={defaultValues[field.name]}>
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder || `Pilih ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...register(field.name, field.validation)} />
            </>
          ) : field.type === "password" ? (
            <div className="relative">
              <Input
                id={field.name}
                type={showPasswords[field.name] ? "text" : "password"}
                placeholder={field.placeholder || "••••••••"}
                {...register(field.name, field.validation)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                onClick={() => togglePasswordVisibility(field.name)}
              >
                {showPasswords[field.name] ? <EyeOff size={16} /> : <Eye size={16} />}
                <span className="sr-only">{showPasswords[field.name] ? "Sembunyikan" : "Tampilkan"} password</span>
              </Button>
            </div>
          ) : (
            <Input
              id={field.name}
              type={field.type || "text"}
              placeholder={field.placeholder}
              {...register(field.name, field.validation)}
            />
          )}

          {errors[field.name] && <p className="text-red-500 text-sm">{errors[field.name].message}</p>}
        </div>
      ))}

      <div className="pt-4 flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}

