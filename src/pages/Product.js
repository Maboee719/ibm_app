import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './Product.css';

const Product = () => {
    const [products, setProducts] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [sellingPrice, setSellingPrice] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [expenses, setExpenses] = useState("0.00");
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const navigate = useNavigate();

    // Fetch all products
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = () => {
        setLoading(true);
        axios.get("http://localhost:5000/products")
            .then(res => {
                setProducts(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    // Add or Update a product
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const productData = {
            name,
            description,
            price: sellingPrice,
            cost_price: costPrice,
            quantity,
            expenses
        };

        try {
            if (editingId) {
                await axios.put(`http://localhost:5000/products/${editingId}`, productData);
                alert("Product updated successfully!");
            } else {
                await axios.post("http://localhost:5000/products", productData);
                alert("Product added successfully!");
            }
            resetForm();
            fetchProducts();
        } catch (error) {
            console.error("Error saving product:", error);
            alert(error.response?.data?.message || "Error saving product");
        }
        setLoading(false);
    };

    const resetForm = () => {
        setName("");
        setDescription("");
        setSellingPrice("");
        setCostPrice("");
        setQuantity("");
        setExpenses("0.00");
        setEditingId(null);
    };

    const handleEdit = (product) => {
        setName(product.name);
        setDescription(product.description);
        setSellingPrice(product.price);
        setCostPrice(product.cost_price);
        setQuantity(product.quantity);
        setExpenses(product.expenses);
        setEditingId(product.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        
        try {
            await axios.delete(`http://localhost:5000/products/${id}`);
            alert("Product deleted successfully!");
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Error deleting product");
        }
    };

    return (
        <div className="product-container">
            <button onClick={() => navigate("/sales")}>Make Sales</button>
            <h2>Product Management</h2>
            
            <form onSubmit={handleSubmit} className="product-form">
                <input 
                    type="text" 
                    placeholder="Product Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                />
                <input 
                    type="text" 
                    placeholder="Description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    required 
                />
                <input 
                    type="number" 
                    step="0.01"
                    placeholder="Cost Price" 
                    value={costPrice} 
                    onChange={(e) => setCostPrice(e.target.value)} 
                    required 
                />
                <input 
                    type="number" 
                    step="0.01"
                    placeholder="Selling Price" 
                    value={sellingPrice} 
                    onChange={(e) => setSellingPrice(e.target.value)} 
                    required 
                />
                <input 
                    type="number" 
                    placeholder="Quantity" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                    required 
                />
                <input 
                    type="number" 
                    step="0.01"
                    placeholder="Additional Expenses" 
                    value={expenses} 
                    onChange={(e) => setExpenses(e.target.value)} 
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Processing..." : editingId ? "Update Product" : "Add Product"}
                </button>
                {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
            </form>

            <h3>Product Inventory</h3>
            {loading ? (
                <p>Loading products...</p>
            ) : (
                <table className="product-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Description</th>
                            <th>Cost Price</th>
                            <th>Selling Price</th>
                            <th>Profit Margin</th>
                            <th>Quantity</th>
                            <th>Expenses</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td>{product.name}</td>
                                <td>{product.description}</td>
                                <td>${parseFloat(product.cost_price).toFixed(2)}</td>
                                <td>${parseFloat(product.price).toFixed(2)}</td>
                                <td>${(product.price - product.cost_price).toFixed(2)}</td>
                                <td>{product.quantity}</td>
                                <td>${parseFloat(product.expenses).toFixed(2)}</td>
                                <td>
                                    <button onClick={() => handleEdit(product)}>Edit</button>
                                    <button onClick={() => handleDelete(product.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Product;