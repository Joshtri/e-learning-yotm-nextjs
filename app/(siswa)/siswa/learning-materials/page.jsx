import { PageHeader } from "@/components/ui/page-header";
import React from "react";

export default function LearningMaterialsPage() {
  return (
    <>
      <PageHeader
        title="Materi Pembelajaran"
        description="Daftar materi pembelajaran yang tersedia untuk siswa."
        breadcrumbs={[
          { label: "Dashboard", href: "/siswa/dashboard" },
          { label: "Materi Pembelajaran" },
        ]}
      />
    </>
  );
}
