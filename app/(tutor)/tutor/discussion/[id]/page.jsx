"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { ArrowLeft, MessageSquare, Plus } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
// import DiscussionRoomModal from "@/components/tutors/discussions/DiscussionRoomModal";

export default function ClassDiscussionsPage() {
  const [data, setData] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const params = useParams();
  const router = useRouter();
  const classSubjectTutorId = params.id;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch discussion rooms for this specific class-subject-tutor
      const res = await api.get(
        `/tutor/discussion-rooms?classSubjectTutorId=${classSubjectTutorId}`
      );
      setData(res.data.data || []);

      // Fetch class info
      const classRes = await api.get(
        `/tutor/my-classes/${classSubjectTutorId}`
      );
      setClassInfo(classRes.data.data);
    } catch (error) {
      console.error("Gagal mengambil data ruang diskusi:", error);
      toast.error("Gagal memuat data ruang diskusi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classSubjectTutorId]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    return data.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: id,
      });
    } catch (error) {
      return "-";
    }
  };    

  const columns = [
    {
      header: "No",
      cell: (_, index) => index + 1,
      className: "w-[50px]",
    },
    {
      header: "Judul",
      cell: (row) => row.title,
    },
    {
      header: "Deskripsi",
      cell: (row) => row.description || "-",
    },
    {
      header: "Pesan",
      cell: (row) => row._count?.messages || 0,
    },
    {
      header: "Dibuat",
      cell: (row) => formatDate(row.createdAt),
    },
    {
      header: "Aksi",
      cell: (row) => (
        <Button
          variant="default"
          size="sm"
          onClick={() => router.push(`/tutor/discussions/${row.id}`)}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Masuk Diskusi
        </Button>
      ),
      className: "w-[150px]",
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader
        title={`Ruang Diskusi: ${classInfo?.class?.namaKelas || ""} - ${
          classInfo?.subject?.namaMapel || ""
        }`}
        description="Kelola ruang diskusi untuk kelas ini."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Ruang Diskusi
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: "Ruang Diskusi", href: "/tutor/discussions" },
          {
            label: `${classInfo?.class?.namaKelas || ""} - ${
              classInfo?.subject?.namaMapel || ""
            }`,
          },
        ]}
        loading={isLoading}
      />

      <Tabs defaultValue="all" className="space-y-6">
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={(value) => setSearchQuery(value)}
          searchPlaceholder="Cari judul diskusi..."
          filterOptions={[]}
        />

        <TabsContent value="all" className="space-y-4">
          <DataTable
            data={filteredData}
            columns={columns}
            isLoading={isLoading}
            loadingMessage="Memuat ruang diskusi..."
            emptyMessage="Belum ada ruang diskusi untuk kelas ini"
            keyExtractor={(item) => item.id}
          />
        </TabsContent>
      </Tabs>

      {/* {classInfo && (
        <DiscussionRoomModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchData}
          classSubjectTutorId={classSubjectTutorId}
          className={classInfo?.class?.namaKelas}
          subject={classInfo?.subject?.namaMapel}
        />
      )} */}
    </div>
  );
}
