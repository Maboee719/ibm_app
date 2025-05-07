import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import "./Sales.css"; 

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [productId, setProductId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const navigate = useNavigate();

    const userId = localStorage.getItem("userId");

    const handleLogout = () => {
        localStorage.clear(); // clears user session
        navigate("/login");   // redirect to login page
    };

    // Fetch all data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [salesRes, productsRes] = await Promise.all([
                axios.get("http://localhost:5000/sales"),
                axios.get("http://localhost:5000/products")
            ]);
            setSales(salesRes.data);
            setProducts(productsRes.data);
        } catch (err) {
            console.error("Error fetching data:", err);
        }
        setLoading(false);
    };

    // Handle product selection
    const handleProductChange = (e) => {
        const selectedId = e.target.value;
        setProductId(selectedId);
        const product = products.find(p => p.id == selectedId);
        setSelectedProduct(product);
    };

    // Add a new sale
    const handleAddSale = async (e) => {
        e.preventDefault();
        if (!productId || !quantity) return;
        
        try {
            setLoading(true);
            // Check if enough stock is available
            if (selectedProduct && quantity > selectedProduct.quantity) {
                alert(`Only ${selectedProduct.quantity} items available in stock!`);
                return;
            }

            await axios.post("http://localhost:5000/sales", { userId, productId, quantity });
            alert("Sale recorded successfully!");
            fetchData(); // Refresh data without page reload
            setProductId("");
            setQuantity(1);
            setSelectedProduct(null);
        } catch (error) {
            console.error("Error adding sale:", error.response?.data || error.message);
            alert(error.response?.data?.message || "Failed to record sale");
        }
        setLoading(false);
    };

    // Prepare data for the sales chart
    const salesData = sales.reduce((acc, sale) => {
        const existingProduct = acc.find(item => item.product_name === sale.product_name);
        if (existingProduct) {
            existingProduct.total_sales += Number(sale.total_price);
        } else {
            acc.push({ 
                product_name: sale.product_name, 
                total_sales: Number(sale.total_price),
                quantity_sold: Number(sale.quantity)
            });
        }
        return acc;
    }, []);

    return (
        <div className="sales-container">
            <button onClick={() => navigate("/products")} className="nav-button">
                Add Products
            </button>
            <button onClick={() => navigate("/customer-queries")} className="nav-button">
    Customer Queries
</button>
            <button onClick={handleLogout} className="logout-button">
            Logout
        </button>
            <h2>Sales Transactions</h2>
            

            {/* Add Sale Form */}
            <form onSubmit={handleAddSale} className="sales-form">
                <div className="form-group">
                    <label>Select Product</label>
                    <select 
                        value={productId} 
                        onChange={handleProductChange} 
                        required
                        className="form-select"
                    >
                        <option value="">Select Product</option>
                        {products.map(product => (
                            <option key={product.id} value={product.id}>
                                {product.name} - ${product.price} (In Stock: {product.quantity})
                            </option>
                        ))}
                    </select>
                    {selectedProduct && (
                        <div className="stock-info">
                            Available: {selectedProduct.quantity} | 
                            Cost Price: ${selectedProduct.cost_price} | 
                            Profit per Unit: ${(selectedProduct.price - selectedProduct.cost_price).toFixed(2)}
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>Quantity</label>
                    <input 
                        type="number" 
                        min="1"
                        value={quantity} 
                        onChange={(e) => setQuantity(Math.max(1, e.target.value))} 
                        required
                        className="form-input"
                    />
                </div>

                <button type="submit" disabled={loading} className="submit-button">
                    {loading ? "Processing..." : "Record Sale"}
                </button>
            </form>

            {/* Display Sales Transactions in Table */}
            <h3>Sales Records</h3>
            {loading ? (
                <p>Loading sales data...</p>
            ) : (
                <>
                    <table className="sales-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total Price</th>
                                <th>Profit</th>
                                <th>Date Sold</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => {
                                const profit = (sale.price - sale.cost_price) * sale.quantity;
                                return (
                                    <tr key={sale.id}>
                                        <td>{sale.product_name}</td>
                                        <td>{sale.quantity}</td>
                                        <td>${sale.price}</td>
                                        <td>${sale.total_price}</td>
                                        <td className={profit >= 0 ? "profit-positive" : "profit-negative"}>
                                            ${profit.toFixed(2)}
                                        </td>
                                        <td>{new Date(sale.sale_date).toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Sales Chart */}
                    <h3>Sales Performance</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="product_name" />
                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                <Tooltip />
                                <Bar yAxisId="left" dataKey="total_sales" fill="#8884d8" name="Total Sales ($)" />
                                <Bar yAxisId="right" dataKey="quantity_sold" fill="#82ca9d" name="Quantity Sold" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
};

export default Sales;