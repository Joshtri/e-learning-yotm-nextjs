"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  getProgramById,
  updateProgram,
  deleteProgram,
} from "@/services/ProgramsService";

const formSchema = z.object({
  namaPaket: z.string().min(1, "Nama program tidak boleh kosong"),
});

export default function ProgramsEditPage() {
  const { id } = useParams();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      namaPaket: "",
    },
  });

  const [loading, setLoading] = useState(true);
  const [programName, setProgramName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProgramById(id);
        form.reset({ namaPaket: data.namaPaket });
        setProgramName(data.namaPaket);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Gagal memuat data");
        // router.push('/admin/programs')
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const onSubmit = async (values) => {
    try {
      await updateProgram(id, values);
      toast.success("Program berhasil diperbarui");
      router.push("/admin/programs");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal memperbarui data");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProgram(id);
      toast.success("Program berhasil dihapus");
      router.push("/admin/programs");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal menghapus program");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6 space-y-6">
          <PageHeader
            title={`Edit Program ${programName ? `- ${programName}` : ""}`}
            description="Ubah detail program yang ada. Pastikan semua informasi sudah benar sebelum menyimpan."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin" },
              { label: "Program", href: "/admin/programs" },
              { label: "Edit Program" },
            ]}
          />

          {!loading && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 max-w-xl"
              >
                <FormField
                  control={form.control}
                  name="namaPaket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Program</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nama program" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="submit">Simpan</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/admin/programs")}
                  >
                    Batal
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive">
                        Hapus
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Yakin ingin menghapus program ini?
                        </AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          Ya, hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </form>
            </Form>
          )}
        </main>
      </div>
    </div>
  );
}
