import api from "@/lib/axios";

// Ambil detail kelas berdasarkan ID
export const getClassById = async (id) => {
  const res = await api.get(`/classes/${id}`);
  return res.data;
};

// Update kelas berdasarkan ID
export const updateClass = async (id, payload) => {
  const res = await api.patch(`/classes/${id}`, payload);
  return res.data;
};

// Hapus kelas berdasarkan ID
export const deleteClass = async (id) => {
  const res = await api.delete(`/classes/${id}`);
  return res.data;
};

// Ambil semua data kelas (jika kamu butuh list)
export const getAllClasses = async () => {
  const res = await api.get(`/classes`);
  return res.data;
};
