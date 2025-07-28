import axios from '@/lib/axios'

export const getProgramById = async (id) => {
  const res = await axios.get(`/programs/${id}`)
  return res.data.data
}

export const updateProgram = async (id, payload) => {
  const res = await axios.patch(`/programs/${id}`, payload)
  return res.data.data
}

export const deleteProgram = async (id) => {
  const res = await axios.delete(`/programs/${id}`)
  return res.data
}
