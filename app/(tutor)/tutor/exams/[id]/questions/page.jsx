"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const JENIS_SOAL_MAP = {
  MULTIPLE_CHOICE: "Pilihan Ganda",
  ESSAY: "Essay",
  TRUE_FALSE: "Benar/Salah",
  SHORT_ANSWER: "Jawaban Singkat",
};

export default function ExamQuestionsPage() {
  const { id } = useParams(); // examId
  const router = useRouter();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    teks: "",
    jenis: "MULTIPLE_CHOICE",
    poin: 10,
    pembahasan: "",
    jawabanBenar: "",
  });
  const [options, setOptions] = useState([{ teks: "", benar: false }]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examRes, questionsRes] = await Promise.all([
        api.get(`/tutor/exams/${id}`),
        api.get(`/tutor/exams/${id}/questions`),
      ]);
      setExam(examRes.data.data);
      setQuestions(questionsRes.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (question = null) => {
    if (question) {
      // Edit mode
      setEditingQuestion(question);
      setFormData({
        teks: question.teks,
        jenis: question.jenis,
        poin: question.poin,
        pembahasan: question.pembahasan || "",
        jawabanBenar: question.jawabanBenar || "",
      });
      if (question.options && question.options.length > 0) {
        setOptions(question.options.map(opt => ({ teks: opt.teks, benar: opt.adalahBenar })));
      } else {
        setOptions([{ teks: "", benar: false }]);
      }
    } else {
      // Create mode
      setEditingQuestion(null);
      setFormData({
        teks: "",
        jenis: "MULTIPLE_CHOICE",
        poin: 10,
        pembahasan: "",
        jawabanBenar: "",
      });
      setOptions([{ teks: "", benar: false }]);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleSaveQuestion = async () => {
    if (!formData.teks) {
      toast.error("Soal wajib diisi");
      return;
    }

    const payload = {
      teks: formData.teks,
      jenis: formData.jenis,
      poin: Number(formData.poin),
      pembahasan: formData.pembahasan,
      jawabanBenar: formData.jawabanBenar,
    };

    // Add options for multiple choice
    if (formData.jenis === "MULTIPLE_CHOICE" && options.length > 0) {
      const validOptions = options.filter(opt => opt.teks.trim() !== "");
      if (validOptions.length < 2) {
        toast.error("Minimal 2 pilihan untuk soal pilihan ganda");
        return;
      }
      payload.options = validOptions;
    }

    try {
      if (editingQuestion) {
        // Update existing question
        await api.put(`/tutor/questions/${editingQuestion.id}`, payload);
        toast.success("Soal berhasil diperbarui");
      } else {
        // Create new question
        await api.post(`/tutor/exams/${id}/questions`, payload);
        toast.success("Soal berhasil ditambahkan");
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan soal");
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus soal ini?")) return;

    try {
      await api.delete(`/tutor/questions/${questionId}`);
      toast.success("Soal berhasil dihapus");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus soal");
    }
  };

  const addOption = () => {
    setOptions([...options, { teks: "", benar: false }]);
  };

  const removeOption = (index) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index][field] = value;

    // If setting benar to true, set all others to false
    if (field === "benar" && value === true) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.benar = false;
      });
    }

    setOptions(newOptions);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Memuat data...</div>
      </div>
    );
  }

  if (!exam) {
    return null;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={`Kelola Soal: ${exam.judul}`}
        description={`${exam.classSubjectTutor?.class?.namaKelas} - ${exam.classSubjectTutor?.subject?.namaMapel}`}
        breadcrumbs={[
          { label: "Ujian", href: "/tutor/exams" },
          { label: exam.judul, href: `/tutor/exams/${id}` },
          { label: "Kelola Soal" },
        ]}
      />

      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href={`/tutor/exams/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Link>
        </Button>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Soal
        </Button>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Belum ada soal. Klik "Tambah Soal" untuk memulai.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">Soal {index + 1}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {JENIS_SOAL_MAP[question.jenis] || question.jenis}
                      </Badge>
                      <Badge variant="secondary">{question.poin} poin</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{question.teks}</p>
                {question.options && question.options.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="font-medium text-sm">Pilihan Jawaban:</p>
                    {question.options.map((option, optIndex) => (
                      <div
                        key={option.id}
                        className={`p-2 rounded border ${
                          option.adalahBenar
                            ? "bg-green-50 border-green-300"
                            : "bg-gray-50"
                        }`}
                      >
                        {String.fromCharCode(65 + optIndex)}. {option.teks}
                        {option.adalahBenar && (
                          <Badge className="ml-2" variant="default">
                            Benar
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {question.pembahasan && (
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <p className="font-medium text-sm text-blue-900">
                      Pembahasan:
                    </p>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">
                      {question.pembahasan}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for Add/Edit Question */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Soal" : "Tambah Soal Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? "Perbarui informasi soal di bawah ini"
                : "Lengkapi informasi soal di bawah ini"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Jenis Soal</Label>
              <Select
                value={formData.jenis}
                onValueChange={(val) =>
                  setFormData({ ...formData, jenis: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">Pilihan Ganda</SelectItem>
                  <SelectItem value="ESSAY">Essay</SelectItem>
                  <SelectItem value="TRUE_FALSE">Benar/Salah</SelectItem>
                  <SelectItem value="SHORT_ANSWER">Jawaban Singkat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Soal *</Label>
              <Textarea
                value={formData.teks}
                onChange={(e) =>
                  setFormData({ ...formData, teks: e.target.value })
                }
                placeholder="Masukkan soal..."
                rows={4}
              />
            </div>

            <div>
              <Label>Poin *</Label>
              <Input
                type="number"
                value={formData.poin}
                onChange={(e) =>
                  setFormData({ ...formData, poin: e.target.value })
                }
                min={1}
              />
            </div>

            {formData.jenis === "MULTIPLE_CHOICE" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Pilihan Jawaban</Label>
                  <Button type="button" size="sm" onClick={addOption}>
                    <Plus className="h-3 w-3 mr-1" />
                    Tambah Pilihan
                  </Button>
                </div>
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                      value={option.teks}
                      onChange={(e) =>
                        updateOption(index, "teks", e.target.value)
                      }
                    />
                    <label className="flex items-center gap-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={option.benar}
                        onChange={(e) =>
                          updateOption(index, "benar", e.target.checked)
                        }
                      />
                      <span className="text-sm">Benar</span>
                    </label>
                    {options.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(formData.jenis === "TRUE_FALSE" || formData.jenis === "SHORT_ANSWER") && (
              <div>
                <Label>Jawaban Benar</Label>
                {formData.jenis === "TRUE_FALSE" ? (
                  <Select
                    value={formData.jawabanBenar}
                    onValueChange={(val) =>
                      setFormData({ ...formData, jawabanBenar: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jawaban benar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Benar</SelectItem>
                      <SelectItem value="false">Salah</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={formData.jawabanBenar}
                    onChange={(e) =>
                      setFormData({ ...formData, jawabanBenar: e.target.value })
                    }
                    placeholder="Masukkan jawaban yang benar..."
                  />
                )}
              </div>
            )}

            <div>
              <Label>Pembahasan (Opsional)</Label>
              <Textarea
                value={formData.pembahasan}
                onChange={(e) =>
                  setFormData({ ...formData, pembahasan: e.target.value })
                }
                placeholder="Masukkan pembahasan..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Batal
            </Button>
            <Button onClick={handleSaveQuestion}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
