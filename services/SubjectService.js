import api from "@/lib/axios";

// GET mata pelajaran by ID
export const getSubjectById = async (id) => {
  const res = await api.get(`/subjects/${id}`);
  return res.data;
};

// PATCH (update) mata pelajaran
export const updateSubject = async (id, payload) => {
  const res = await api.patch(`/subjects/${id}`, payload);
  return res.data;
};