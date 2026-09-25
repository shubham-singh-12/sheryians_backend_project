import api from './axios';

export const fetchProducts = async () => {
  const { data } = await api.get('/products');
  return data.products;
};

export const fetchProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data.product;
};

export const createProduct = async (productData) => {
  const { data } = await api.post('/products', productData);
  return data.product;
};

export const updateProduct = async (id, productData) => {
  const { data } = await api.put(`/products/${id}`, productData);
  return data.product;
};

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};
