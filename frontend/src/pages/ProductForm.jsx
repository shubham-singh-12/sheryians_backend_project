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
const MAX_ORIGINAL_FILE_BYTES = 15 * 1024 * 1024; // reject absurdly large uploads outright
const MAX_IMAGE_WIDTH = 900; // px - plenty sharp for a product card, far smaller than a raw phone photo
const JPEG_QUALITY = 0.7;

// Reads a File, draws it onto a canvas at a capped width, and re-encodes it
// as a compressed JPEG data URL. A typical multi-megabyte phone photo shrinks
// down to well under 200KB this way. This matters because every product's
// image is stored directly in MongoDB and re-sent in full on every GET
// /api/products call - an uncompressed image would make every page load of
// every product noticeably slower for everyone, not just the uploader.
const compressImageToDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (readerEvent) => {
            const img = new Image();

            img.onload = () => {
                const scale = Math.min(1, MAX_IMAGE_WIDTH / img.width);
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
            };

            img.onerror = () =>
                reject(new Error("Could not load the selected image"));
            img.src = readerEvent.target.result;
        };

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

        if (file.size > MAX_ORIGINAL_FILE_BYTES) {
            setImageError("Image is too large. Please choose one under 15MB.");
            return;
        }

        try {
            const dataUrl = await compressImageToDataUrl(file);
            setForm((prev) => ({ ...prev, image: dataUrl }));
        } catch (err) {
            setImageError(
                "Could not process that image, please try another file",
            );
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
