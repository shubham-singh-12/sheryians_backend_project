import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchProducts, deleteProduct } from "../api/productService";
import { getGeneralErrorMessage } from "../utils/parseFieldErrors";

const Products = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    const { isAuthenticated } = useAuth();

    const loadProducts = async () => {
        setIsLoading(true);
        setError("");
        try {
            const data = await fetchProducts();
            setProducts(data);
        } catch (err) {
            setError(getGeneralErrorMessage(err, "Failed to load products"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this product?")) return;

        setDeletingId(id);
        try {
            await deleteProduct(id);
            setProducts((prev) => prev.filter((p) => p._id !== id));
        } catch (err) {
            setError(getGeneralErrorMessage(err, "Failed to delete product"));
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) return <p className="page-loading">Loading products...</p>;

    return (
        <div className="products-page">
            <div className="products-header">
                <h2>Products</h2>
                {isAuthenticated && (
                    <Link to="/products/new" className="btn-primary">
                        + Add Product
                    </Link>
                )}
            </div>

            {error && <p className="form-error">{error}</p>}

            {products.length === 0 ? (
                <p>No products yet.</p>
            ) : (
                <div className="product-grid">
                    {products.map((product) => (
                        <div className="product-card" key={product._id}>
                            <div className="product-image-wrap">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="product-image"
                                    />
                                ) : (
                                    <div
                                        className="product-image-placeholder"
                                        aria-hidden="true"
                                    >
                                        No image
                                    </div>
                                )}
                            </div>

                            <div className="product-card-body">
                                <h3>{product.name}</h3>
                                <p className="product-description">
                                    {product.description}
                                </p>
                                <p className="product-price">
                                    ${product.price}
                                </p>
                                <p className="product-stock">
                                    Stock: {product.stock}
                                </p>

                                {isAuthenticated && (
                                    <div className="product-actions">
                                        <Link
                                            to={`/products/edit/${product._id}`}
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() =>
                                                handleDelete(product._id)
                                            }
                                            disabled={
                                                deletingId === product._id
                                            }
                                            className="btn-danger"
                                        >
                                            {deletingId === product._id
                                                ? "Deleting..."
                                                : "Delete"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Products;
