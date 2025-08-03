import api from "@/lib/axios";

/**
 * Hapus assignment berdasarkan ID
 * @param {string} id - ID dari assignment yang ingin dihapus
 * @returns {Promise}
 */

export const deleteAssignmentById = async (id) => {
  const response = await api.delete(`/tutor/assignments/${id}`);
  return response.data;
};
