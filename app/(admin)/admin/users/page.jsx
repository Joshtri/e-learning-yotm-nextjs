"use client";

import { useState, useMemo } from "react";
import { UserPlus } from "lucide-react";
import useSWR from "swr";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { DataTable } from "@/components/ui/data-table";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntityActions } from "@/components/ui/entity-actions";
import { DataExport } from "@/components/ui/data-export";
import { EntityDialog } from "@/components/ui/entity-dialog";

export default function UsersPage() {
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);

  const fetchUsers = () =>
    axios.get("/api/users/list").then((res) => res.data.users);

  const {
    data: users = [],
    isLoading,
    mutate,
  } = useSWR("/api/users/list", fetchUsers);

  // Filter users based on search query and selected role
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = selectedRole ? user.role === selectedRole : true;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRole]);

  // Define columns for the data table
  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Nama",
      cell: (user) => (
        <div className="flex items-center gap-2">
          <EntityAvatar name={user.name} />
          <div className="font-medium">{user.name}</div>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Role",
      cell: (user) => (
        <StatusBadge
          status={user.role}
          variants={{
            ADMIN: { variant: "default", label: "Admin" },
            TUTOR: { variant: "secondary", label: "Tutor" },
            STUDENT: { variant: "outline", label: "Siswa" },
          }}
        />
      ),
    },
    {
      header: "Tanggal Dibuat",
      cell: (user) => new Date(user.createdAt).toLocaleDateString("id-ID"),
    },
    {
      header: "Aksi",
      cell: (user) => (
        <EntityActions
          entityId={user.id}
          viewPath={`/admin/users/${user.id}`}
          editPath={`/admin/users/${user.id}/edit`}
          onDelete={() => handleDeleteUser(user.id)}
        />
      ),
      className: "text-right",
    },
  ];

  // Define form fields for user creation
  const userFormFields = [
    {
      name: "name",
      label: "Nama Lengkap",
      placeholder: "Masukkan nama lengkap",
      validation: { required: "Nama wajib diisi" },
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "nama@email.com",
      validation: {
        required: "Email wajib diisi",
        pattern: {
          value: /\S+@\S+\.\S+/,
          message: "Format email tidak valid",
        },
      },
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "••••••••",
      validation: { required: "Password wajib diisi" },
    },
    {
      name: "confirmPassword",
      label: "Konfirmasi Password",
      type: "password",
      placeholder: "Ulangi password",
      validation: {
        required: "Konfirmasi password wajib diisi",
        validate: (value, formValues) =>
          value === formValues.password || "Password tidak cocok",
      },
    },
    {
      name: "role",
      label: "Role",
      type: "select",
      placeholder: "Pilih role pengguna",
      options: [
        { label: "Admin", value: "ADMIN" },
        { label: "Tutor", value: "TUTOR" },
        { label: "Siswa", value: "STUDENT" },
      ],
      validation: { required: "Role wajib dipilih" },
    },
  ];

  // Define filter options
  const roleFilterOptions = [
    { label: "Admin", value: "ADMIN" },
    { label: "Tutor", value: "TUTOR" },
    { label: "Siswa", value: "STUDENT" },
  ];

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    // Implementation would go here
    console.log("Delete user:", userId);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Manajemen Pengguna"
            actions={
              <>
                <DataExport
                  data={filteredUsers}
                  filename="users.csv"
                  label="Export"
                />
                <Button onClick={() => setIsCreateUserOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Tambah Pengguna
                </Button>
              </>
            }
          />

          <Tabs defaultValue="all" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Cari pengguna..."
              filterOptions={roleFilterOptions}
              onFilterSelect={setSelectedRole}
              filterLabel="Filter Berdasarkan"
            />

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredUsers}
                columns={columns}
                isLoading={isLoading}
                loadingMessage="Memuat data pengguna..."
                emptyMessage="Tidak ada data pengguna yang ditemukan"
                keyExtractor={(user) => user.id}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <EntityDialog
        open={isCreateUserOpen}
        onOpenChange={setIsCreateUserOpen}
        title="Tambah Pengguna Baru"
        description="Buat akun pengguna baru untuk admin, tutor, atau siswa."
        fields={userFormFields}
        apiEndpoint="/api/users/create"
        onSuccess={mutate}
        successMessage="Pengguna berhasil ditambahkan!"
        errorMessage="Gagal menambahkan pengguna."
      />
    </div>
  );
}
