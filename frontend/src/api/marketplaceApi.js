import apiClient from "./axios";

export const listListings = async (filters = {}) => {
  const response = await apiClient.get("/marketplace", { params: filters });
  return Array.isArray(response.data) ? response.data : [];
};

export const getListing = async (listingId) => {
  const response = await apiClient.get(`/marketplace/${listingId}`);
  return response.data ?? null;
};

export const createListing = async (payload) => {
  const response = await apiClient.post("/marketplace", payload);
  return response.data ?? null;
};

export const buyListing = async (listingId) => {
  const response = await apiClient.post(`/marketplace/${listingId}/buy`);
  return response.data ?? null;
};

export const getMyListings = async () => {
  const response = await apiClient.get("/marketplace/my-listings");
  return Array.isArray(response.data) ? response.data : [];
};

export const getMyPurchases = async () => {
  const response = await apiClient.get("/marketplace/my-purchases");
  return Array.isArray(response.data) ? response.data : [];
};
