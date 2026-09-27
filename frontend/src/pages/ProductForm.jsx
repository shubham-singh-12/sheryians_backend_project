import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    createProduct,
    updateProduct,
    fetchProductById,
} from "../api/productService";
import {
    parseFieldErrors,
    getGeneralErrorMessage,
} from "../utils/parseFieldErrors";

const initialForm = {
    name: "",
    description: "",
    price: "",
    stock: "",
    image: "",
};
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB, comfortably under the backend's ~5MB cap

// Reads a File object and resolves with a base64 data URL
// (e.g. "data:image/png;base64,...") that can be sent straight to the API
// and stored directly in MongoDB, with no separate file server required.
const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () =>
            reject(new Error("Could not read the selected file"));
        reader.readAsDataURL(file);
    });

const ProductForm = () => {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();

    const [form, setForm] = useState(initialForm);
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [imageError, setImageError] = useState("");

    useEffect(() => {
        if (!isEditMode) return;

        const loadProduct = async () => {
            try {
                const product = await fetchProductById(id);
                setForm({
                    name: product.name,
                    description: product.description || "",
                    price: product.price,
                    stock: product.stock,
                    image: product.image || "",
                });
            } catch (err) {
                setGeneralError(
                    getGeneralErrorMessage(err, "Failed to load product"),
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadProduct();
    }, [id, isEditMode]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        setImageError("");
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setImageError("Please choose an image file");
            return;
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setImageError("Image is too large. Please choose one under 4MB.");
            return;
        }

        try {
            const dataUrl = await readFileAsDataUrl(file);
            setForm((prev) => ({ ...prev, image: dataUrl }));
        } catch (err) {
            setImageError("Could not read that image, please try another file");
        }
    };

    const handleRemoveImage = () => {
        setForm((prev) => ({ ...prev, image: "" }));
        setImageError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});
        setGeneralError("");
        setIsSubmitting(true);

        const payload = {
            name: form.name,
            description: form.description,
            price: Number(form.price),
            stock: Number(form.stock),
            image: form.image,
        };

        try {
            if (isEditMode) {
                await updateProduct(id, payload);
            } else {
                await createProduct(payload);
            }
            navigate("/");
        } catch (err) {
            setFieldErrors(parseFieldErrors(err));
            setGeneralError(
                getGeneralErrorMessage(err, "Failed to save product"),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <p className="page-loading">Loading product...</p>;

    return (
        <div className="auth-page">
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <h2>{isEditMode ? "Edit Product" : "Add Product"}</h2>

                {generalError && <p className="form-error">{generalError}</p>}

                <label htmlFor="name">Name</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                />
                {fieldErrors.name && (
                    <span className="field-error">{fieldErrors.name}</span>
                )}

                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    name="description"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                />
                {fieldErrors.description && (
                    <span className="field-error">
                        {fieldErrors.description}
                    </span>
                )}

                <label htmlFor="price">Price</label>
                <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                />
                {fieldErrors.price && (
                    <span className="field-error">{fieldErrors.price}</span>
                )}

                <label htmlFor="stock">Stock</label>
                <input
                    id="stock"
                    name="stock"
                    type="number"
                    value={form.stock}
                    onChange={handleChange}
                />
                {fieldErrors.stock && (
                    <span className="field-error">{fieldErrors.stock}</span>
                )}

                <label htmlFor="image">Product Image</label>
                <input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                />
                {imageError && (
                    <span className="field-error">{imageError}</span>
                )}
                {fieldErrors.image && (
                    <span className="field-error">{fieldErrors.image}</span>
                )}

                {form.image && (
                    <div className="image-preview">
                        <img src={form.image} alt="Product preview" />
                        <button
                            type="button"
                            className="btn-remove-image"
                            onClick={handleRemoveImage}
                        >
                            Remove image
                        </button>
                    </div>
                )}

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? "Saving..."
                        : isEditMode
                          ? "Update Product"
                          : "Create Product"}
                </button>
            </form>
        </div>
    );
};

export default ProductForm;
