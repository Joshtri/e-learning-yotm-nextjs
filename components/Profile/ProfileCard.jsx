"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Edit2, LogOut, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import axios from "axios";

export default function ProfileCard({ user, onEdit, onLogout }) {
  const isStudent = user?.role === "STUDENT" && user?.student;
  const isTutor = user?.role === "TUTOR" && user?.tutor;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state untuk semua role
  const [formData, setFormData] = useState({
    nama: user?.nama || "",
    email: user?.email || "",
    // Student fields
    namaLengkap: isStudent ? user.student.namaLengkap || "" : isTutor ? user.tutor.namaLengkap || "" : "",
    nisn: isStudent ? user.student.nisn || "" : "",
    nis: isStudent ? user.student.nis || "" : "",
    jenisKelamin: isStudent ? user.student.jenisKelamin || "" : "",
    tempatLahir: isStudent ? user.student.tempatLahir || "" : "",
    tanggalLahir: isStudent ? user.student.tanggalLahir ? new Date(user.student.tanggalLahir).toISOString().split('T')[0] : "" : "",
    noTelepon: isStudent ? user.student.noTelepon || "" : "",
    alamat: isStudent ? user.student.alamat || "" : "",
    // Tutor fields
    telepon: isTutor ? user.tutor.telepon || "" : "",
    bio: isTutor ? user.tutor.bio || "" : "",
    pendidikan: isTutor ? user.tutor.pendidikan || "" : "",
    pengalaman: isTutor ? user.tutor.pengalaman || "" : "",
  });

  // Update form data when dialog opens
  const handleOpenEdit = () => {
    setFormData({
      nama: user?.nama || "",
      email: user?.email || "",
      namaLengkap: isStudent ? user.student.namaLengkap || "" : isTutor ? user.tutor.namaLengkap || "" : "",
      nisn: isStudent ? user.student.nisn || "" : "",
      nis: isStudent ? user.student.nis || "" : "",
      jenisKelamin: isStudent ? user.student.jenisKelamin || "" : "",
      tempatLahir: isStudent ? user.student.tempatLahir || "" : "",
      tanggalLahir: isStudent ? user.student.tanggalLahir ? new Date(user.student.tanggalLahir).toISOString().split('T')[0] : "" : "",
      noTelepon: isStudent ? user.student.noTelepon || "" : "",
      alamat: isStudent ? user.student.alamat || "" : "",
      telepon: isTutor ? user.tutor.telepon || "" : "",
      bio: isTutor ? user.tutor.bio || "" : "",
      pendidikan: isTutor ? user.tutor.pendidikan || "" : "",
      pengalaman: isTutor ? user.tutor.pengalaman || "" : "",
    });
    setIsEditDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.patch("/api/profile", formData, {
        withCredentials: true,
      });

      if (response.data.success) {
        toast.success("Profil berhasil diperbarui!");
        setIsEditDialogOpen(false);

        // Reload untuk mendapatkan data terbaru
        if (onEdit) {
          onEdit();
        } else {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Gagal memperbarui profil");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="w-full max-w-md mx-auto shadow-lg rounded-2xl p-6">
        <CardContent className="flex flex-col items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={user?.image || "/default-avatar.png"}
              alt={user?.nama || "Avatar"}
            />
            <AvatarFallback>{user?.nama?.[0] || "?"}</AvatarFallback>
          </Avatar>

          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold">{user?.nama || "Guest User"}</h2>
            <p className="text-sm text-gray-500">{user?.email || "No email"}</p>
          </div>

          <Separator className="my-4 w-full" />

          <div className="w-full text-sm space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">User ID:</span>
              <span className="text-right truncate">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Role:</span>
              <span className="text-right">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className="text-right">{user?.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Token Exp:</span>
              <span className="text-right">
                {user?.exp ? new Date(user.exp * 1000).toLocaleString() : "N/A"}
              </span>
            </div>
          </div>

          {/* Tambahan jika Student */}
          {isStudent && (
            <>
              <Separator className="my-4 w-full" />
              <div className="w-full text-sm space-y-2">
                <div className="text-center font-semibold">Profil Siswa</div>
                <div className="flex justify-between">
                  <span>NISN:</span>
                  <span>{user.student.nisn}</span>
                </div>
                <div className="flex justify-between">
                  <span>NIS:</span>
                  <span>{user.student.nis}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jenis Kelamin:</span>
                  <span>{user.student.jenisKelamin}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tempat Lahir:</span>
                  <span>{user.student.tempatLahir}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal Lahir:</span>
                  <span>
                    {new Date(user.student.tanggalLahir).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Telepon:</span>
                  <span>{user.student.noTelepon}</span>
                </div>
                <div className="flex justify-between">
                  <span>Alamat:</span>
                  <span className="text-right truncate max-w-[150px]">
                    {user.student.alamat}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Tambahan jika Tutor */}
          {isTutor && (
            <>
              <Separator className="my-4 w-full" />
              <div className="w-full text-sm space-y-2">
                <div className="text-center font-semibold">Profil Tutor</div>
                <div className="flex justify-between">
                  <span>Nama:</span>
                  <span>{user.tutor.namaLengkap}</span>
                </div>
                <div className="flex justify-between">
                  <span>Telepon:</span>
                  <span>{user.tutor.telepon}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>{user.tutor.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pendidikan:</span>
                  <span className="text-right truncate max-w-[150px]">
                    {user.tutor.pendidikan || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pengalaman:</span>
                  <span className="text-right truncate max-w-[150px]">
                    {user.tutor.pengalaman || "-"}
                  </span>
                </div>
              </div>
            </>
          )}

          <Separator className="my-4 w-full" />

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleOpenEdit}>
              <Edit2 className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast.success("Logged out");
                onLogout?.();
              }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profil</DialogTitle>
            <DialogDescription>
              Perbarui informasi profil Anda di sini. Klik simpan ketika selesai.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Data User - Semua Role */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Informasi Akun</h3>

              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama</Label>
                  <Input
                    id="nama"
                    name="nama"
                    value={formData.nama}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Masukkan email"
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Data Student */}
            {isStudent && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Informasi Siswa</h3>

                <div className="grid gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="namaLengkap">Nama Lengkap</Label>
                    <Input
                      id="namaLengkap"
                      name="namaLengkap"
                      value={formData.namaLengkap}
                      onChange={handleInputChange}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="nisn">NISN</Label>
                      <Input
                        id="nisn"
                        name="nisn"
                        value={formData.nisn}
                        onChange={handleInputChange}
                        placeholder="NISN"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nis">NIS</Label>
                      <Input
                        id="nis"
                        name="nis"
                        value={formData.nis}
                        onChange={handleInputChange}
                        placeholder="NIS"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
                    <Select
                      name="jenisKelamin"
                      value={formData.jenisKelamin}
                      onValueChange={(value) => handleSelectChange("jenisKelamin", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Laki-laki</SelectItem>
                        <SelectItem value="FEMALE">Perempuan</SelectItem>
                        <SelectItem value="OTHER">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                      <Input
                        id="tempatLahir"
                        name="tempatLahir"
                        value={formData.tempatLahir}
                        onChange={handleInputChange}
                        placeholder="Tempat lahir"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                      <Input
                        id="tanggalLahir"
                        name="tanggalLahir"
                        type="date"
                        value={formData.tanggalLahir}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="noTelepon">No. Telepon</Label>
                    <Input
                      id="noTelepon"
                      name="noTelepon"
                      value={formData.noTelepon}
                      onChange={handleInputChange}
                      placeholder="Nomor telepon"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alamat">Alamat</Label>
                    <Textarea
                      id="alamat"
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleInputChange}
                      placeholder="Alamat lengkap"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Data Tutor */}
            {isTutor && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Informasi Tutor</h3>

                <div className="grid gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="namaLengkap">Nama Lengkap</Label>
                    <Input
                      id="namaLengkap"
                      name="namaLengkap"
                      value={formData.namaLengkap}
                      onChange={handleInputChange}
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telepon">Telepon</Label>
                    <Input
                      id="telepon"
                      name="telepon"
                      value={formData.telepon}
                      onChange={handleInputChange}
                      placeholder="Nomor telepon"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Biografi singkat"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pendidikan">Pendidikan</Label>
                    <Textarea
                      id="pendidikan"
                      name="pendidikan"
                      value={formData.pendidikan}
                      onChange={handleInputChange}
                      placeholder="Riwayat pendidikan"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pengalaman">Pengalaman</Label>
                    <Textarea
                      id="pengalaman"
                      name="pengalaman"
                      value={formData.pengalaman}
                      onChange={handleInputChange}
                      placeholder="Pengalaman mengajar"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Admin atau role lain hanya bisa edit User data */}
            {!isStudent && !isTutor && (
              <div className="text-sm text-gray-500">
                Role ADMIN atau lainnya hanya dapat mengubah informasi akun dasar.
              </div>
            )}

            <Separator />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
