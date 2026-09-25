import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createProduct,
  updateProduct,
  fetchProductById,
} from '../api/productService';
import { parseFieldErrors, getGeneralErrorMessage } from '../utils/parseFieldErrors';

const initialForm = { name: '', description: '', price: '', stock: '' };

const ProductForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  useEffect(() => {
    if (!isEditMode) return;

    const loadProduct = async () => {
      try {
        const product = await fetchProductById(id);
        setForm({
          name: product.name,
          description: product.description || '',
          price: product.price,
          stock: product.stock,
        });
      } catch (err) {
        setGeneralError(getGeneralErrorMessage(err, 'Failed to load product'));
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSubmitting(true);

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
    };

    try {
      if (isEditMode) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      navigate('/');
    } catch (err) {
      setFieldErrors(parseFieldErrors(err));
      setGeneralError(getGeneralErrorMessage(err, 'Failed to save product'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p className="page-loading">Loading product...</p>;

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h2>{isEditMode ? 'Edit Product' : 'Add Product'}</h2>

        {generalError && <p className="form-error">{generalError}</p>}

        <label htmlFor="name">Name</label>
        <input id="name" name="name" type="text" value={form.name} onChange={handleChange} />
        {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows="3"
          value={form.description}
          onChange={handleChange}
        />
        {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}

        <label htmlFor="price">Price</label>
        <input id="price" name="price" type="number" step="0.01" value={form.price} onChange={handleChange} />
        {fieldErrors.price && <span className="field-error">{fieldErrors.price}</span>}

        <label htmlFor="stock">Stock</label>
        <input id="stock" name="stock" type="number" value={form.stock} onChange={handleChange} />
        {fieldErrors.stock && <span className="field-error">{fieldErrors.stock}</span>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
        </button>
      </form>
    </div>
  );
};

export default ProductForm;
