"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
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
// import { useAuth } from "@/lib/useAuth";
import { Upload } from "lucide-react";
import { useRef } from "react";
import * as XLSX from "xlsx";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function UsersPage() {
  const router = useRouter();
  // const { user } = useAuth();
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);

  // Check if user is admin and redirect if not
  // useEffect(() => {
  //   if (user && user.role !== 'ADMIN') {
  //     toast.error("Akses ditolak: Halaman ini hanya untuk admin");
  //     router.push('/dashboard');
  //   }
  // }, [user, router]);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);

      if (selectedRole) {
        params.append("role", selectedRole);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await api.get(`/users?${params.toString()}`);
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Gagal memuat data pengguna");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, selectedRole, searchQuery]);

  // Filter users based on search query (client-side filtering)
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;

    return users.filter((user) => {
      return (
        user.nama.toLowerCase().includes(searchQuery.toLowerCase()) || // Ubah di sini
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [users, searchQuery]);

  // Define columns for the data table
  const columns = [
    {
      header: "No",
      cell: (_, index) => (pagination.page - 1) * pagination.limit + index + 1,
      className: "w-[50px]",
    },
    {
      header: "Username account",
      cell: (user) => (
        <div className="flex items-center gap-2">
          <EntityAvatar name={user.nama} /> {/* Ubah di sini */}
          <div className="font-medium">{user.nama}</div>
        </div>
      ),
    },

    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Role",
      accessorKey: "role",

      cell: (user) => (
        <StatusBadge
          status={user.role}
          variants={{
            ADMIN: { variant: "default", label: "Admin" },
            TUTOR: { variant: "info", label: "Tutor" },
            STUDENT: { variant: "outline", label: "Siswa" },
          }}
        />
      ),
    },
    {
      header: "Status",
      cell: (user) => (
        <StatusBadge
          status={user.status}
          variants={{
            ACTIVE: { variant: "success", label: "Aktif" },
            INACTIVE: { variant: "destructive", label: "Nonaktif" },
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
          // disableDelete={user.id === (currentUser?.id || "")} // Disable delete for current user
        />
      ),
      className: "text-right",
    },
  ];

  // Define form fields for user creation
  const userFormFields = [
    {
      name: "nama",
      label: "Username",
      placeholder: "Masukkan username",
      validation: { required: "username wajib diisi" },
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
      validation: {
        required: "Password wajib diisi",
        minLength: {
          value: 8,
          message: "Password minimal 8 karakter",
        },
      },
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
    {
      name: "userActivated",
      label: "Status",
      type: "select",
      placeholder: "Pilih status pengguna",
      options: [
        { label: "Aktif", value: "ACTIVE" },
        { label: "Nonaktif", value: "INACTIVE" },
      ],
      defaultValue: "ACTIVE",
    },
  ];

  // Define filter options
  const roleFilterOptions = [
    { label: "Semua", value: null },
    { label: "Admin", value: "ADMIN" },
    { label: "Tutor", value: "TUTOR" },
    { label: "Siswa", value: "STUDENT" },
  ];

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      try {
        await api.delete(`/users/${userId}`);
        toast.success("Pengguna berhasil dihapus");
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete user:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Gagal menghapus pengguna";
        toast.error(errorMessage);
      }
    }
  };

  // Handle pagination change
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Create user function that will be used by EntityDialog
  const createUser = async (userData) => {
    // Remove confirmPassword as it's not needed in the API
    const { confirmPassword, ...userDataToSend } = userData;

    try {
      const response = await api.post("/api/users", userDataToSend);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage =
        error.response?.data?.error || "Gagal membuat pengguna";
      throw new Error(errorMessage);
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 0 });

        // Konversi jadi CSV string manual untuk kirim ke backend
        const csvRows = ["nama,email,password,role"];
        jsonData.forEach((row) => {
          const nama = row.nama || "";
          const email = row.email || "";
          const password = row.password || "";
          const role = row.role || "";
          csvRows.push(`${nama},${email},${password},${role}`);
        });

        const csvBlob = new Blob([csvRows.join("\n")], {
          type: "text/csv",
        });

        const formData = new FormData();
        formData.append("file", csvBlob, "import.csv");

        const res = await fetch("/api/users/import", {
          method: "POST",
          body: formData,
        });

        const result = await res.json();
        if (result.success) {
          toast.success(result.message || "Import berhasil");
          fetchUsers();
        } else {
          toast.error(result.message || "Import gagal");
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Terjadi kesalahan saat import");
    } finally {
      setIsImporting(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleDownloadTemplate = () => {
    const worksheetData = [
      ["nama", "email", "password", "role"],
      ["John Doe", "john@example.com", "password123", "ADMIN"],
      ["Jane Smith", "jane@example.com", "securepass456", "TUTOR"],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Pengguna");

    XLSX.writeFile(workbook, "template_pengguna.xlsx");
  };

  // if (!user) {
  //   return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  // }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1">
        <main className="p-6">
          <PageHeader
            title="Manajemen Pengguna"
            actions={
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv ,.xlsx"
                  onChange={handleImportExcel}
                  style={{ display: "none" }}
                />

                {/* Download Template */}
                <Button variant="ghost" onClick={handleDownloadTemplate}>
                  Template Excel
                </Button>

                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? "Mengimpor..." : "Import"}
                </Button>

                <DataExport data={users} filename="users.csv" label="Export" />
                <Button onClick={() => setIsCreateUserOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Tambah Pengguna
                </Button>
              </>
            }
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Pengguna" },
            ]} // Add breadcrumbs here
          />

          <Tabs defaultValue="all" className="space-y-6">
            <DataToolbar
              searchValue={searchQuery}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on search
              }}
              searchPlaceholder="Cari pengguna..."
              filterOptions={roleFilterOptions}
              onFilterSelect={(value) => {
                setSelectedRole(value);
                setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on filter change
              }}
              filterValue={selectedRole}
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
                pagination={{
                  currentPage: pagination.page,
                  totalPages: pagination.pages,
                  onPageChange: handlePageChange,
                  totalItems: pagination.total,
                  itemsPerPage: pagination.limit,
                }}
              />

              {/* Pagination manual */}
              <Pagination className="mt-4">
                <PaginationContent>
                  {pagination.page > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page - 1,
                          }))
                        }
                      />
                    </PaginationItem>
                  )}

                  {Array.from({ length: pagination.pages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={pagination.page === i + 1}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: i + 1 }))
                        }
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  {pagination.page < pagination.pages && (
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page + 1,
                          }))
                        }
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <EntityDialog
        open={isCreateUserOpen}
        onOpenChange={setIsCreateUserOpen}
        successMessage="Pengguna berhasil ditambahkan!"
        apiEndpoint={"/api/users"}
        title="Tambah Pengguna Baru"
        description="Buat akun pengguna baru untuk admin, tutor, atau siswa."
        fields={userFormFields}
        onSuccess={() => {
          fetchUsers();
          setIsCreateUserOpen(false); // Close dialog after success
        }}
        onSubmit={createUser}
        // onSuccess={() => {
        //   fetchUsers();
        //   toast.success("Pengguna berhasil ditambahkan!");
        // }}
        errorMessage="Gagal menambahkan pengguna."
        submitLabel="Tambah Pengguna"
      />
    </div>
  );
}
