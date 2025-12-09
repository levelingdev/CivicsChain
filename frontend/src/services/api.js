import axios from 'axios'; // npm install axios
const API_BASE = 'http://localhost:5000/api'; 

export const apiService = {
  getProposals: async () => {
    try {
      const res = await axios.get(`${API_BASE}/projects`);
      return res.data;
    } catch (error) { return []; }
  },

  // ✅ OPTIMIZATION: Upload with Progress
  createProposal: async (formData, onProgress) => {
    const token = sessionStorage.getItem('civic_token');
    if (!token) throw new Error("Please login");

    try {
        const res = await axios.post(`${API_BASE}/projects`, formData, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    if(onProgress) onProgress(percent);
                }
            }
        });
        return res.data;
    } catch (err) {
        throw new Error(err.response?.data?.error || "Upload Failed");
    }
  },

  getFileUrl: (ipfsHash) => {
    return `${API_BASE}/projects/${ipfsHash}/view`;
  }
};