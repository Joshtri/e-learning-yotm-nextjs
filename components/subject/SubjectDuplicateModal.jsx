"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ModalForm from "@/components/ui/modal-form";
import api from "@/lib/axios";

export default function SubjectDuplicateModal({
  open,
  onClose,
  onSuccess,
  programs,
  sourceSubject,
}) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      programId: "",
    },
  });

  const onSubmit = async (data) => {
    if (!sourceSubject) return;

    try {
      // 1. Siapkan payload: data subject lama + programId baru
      const payload = {
        namaMapel: sourceSubject.namaMapel,
        kodeMapel: sourceSubject.kodeMapel,
        deskripsi: sourceSubject.deskripsi,
        programId: data.programId,
      };

      // 2. Cek apakah mapel dengan nama yang sama SUDAH ada di program tujuan?
      // (Optional: Bisa handle error 409 dari backend saja biar simpel)

      // 3. Create subject baru
      const res = await api.post("/subjects", payload);

      if (res.data.success) {
        toast.success(
          `Berhasil menyalin "${sourceSubject.namaMapel}" ke program baru`,
        );
        onClose();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(res.data.message || "Gagal menyalin mapel");
      }
    } catch (err) {
      console.error("Gagal duplicate mapel:", err);
      // Handle error jika nama mapel unik global (tapi idealnya unik per program,
      // cek schema unique constraint namaMapel mungkin perlu direview, tapi mari kita coba dulu)
      if (err.response?.status === 409) {
        toast.error(
          "Gagal: Mata pelajaran ini sudah ada di sistem (Nama unik).",
        );
      } else {
        toast.error(err.response?.data?.message || err.message);
      }
    }
  };

  return (
    <ModalForm
      isOpen={open}
      onClose={onClose}
      title="Salin Mata Pelajaran"
      description={`Salin "${sourceSubject?.namaMapel}" ke program lain.`}
      onSubmit={handleSubmit(onSubmit)}
      submitText={isSubmitting ? "Menyalin..." : "Salin"}
    >
      <div className="p-3 bg-muted/50 rounded-md mb-4 text-sm">
        <p>
          <strong>Info:</strong> Data mata pelajaran akan diduplikasi sepenuhnya
          (Nama, Kode, Deskripsi).
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Salin ke Program</label>
        <select
          {...register("programId", { required: "Pilih program tujuan" })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">-- Pilih Program Tujuan --</option>
          {programs?.map((program) => (
            // Filter agar program asal tidak muncul? Boleh, tapi validasi di backend juga ada
            <option key={program.id} value={program.id}>
              {program.namaPaket}
            </option>
          ))}
        </select>
      </div>
    </ModalForm>
  );
}
