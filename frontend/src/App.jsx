import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  ClipboardList,
  Plus,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Edit,
  ArrowRight
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://test-2-s7zm.onrender.com';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: []
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Search & Filter
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Modals Open/Close States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // null for Add, object for Edit
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form Field States
  // 1. Product Form
  const [productForm, setProductForm] = useState({ name: '', sku: '', price: '', quantity: '' });
  
  // 2. Customer Form
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', phone: '' });
  
  // 3. Order Form Builder
  const [orderCustomerId, setOrderCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);

  // Notifications timeout auto-close
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Initial Data Fetching
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSummary(),
        fetchProducts(),
        fetchCustomers(),
        fetchOrders()
      ]);
    } catch (err) {
      console.error("Error loading data:", err);
      setErrorMsg("Failed to load dashboard data. Is the backend server running?");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    const res = await fetch(`${API_BASE_URL}/dashboard/summary`);
    if (!res.ok) throw new Error("Summary API failed");
    const data = await res.json();
    setSummary(data);
  };

  const fetchProducts = async () => {
    const res = await fetch(`${API_BASE_URL}/products`);
    if (!res.ok) throw new Error("Products API failed");
    const data = await res.json();
    setProducts(data);
  };

  const fetchCustomers = async () => {
    const res = await fetch(`${API_BASE_URL}/customers`);
    if (!res.ok) throw new Error("Customers API failed");
    const data = await res.json();
    setCustomers(data);
  };

  const fetchOrders = async () => {
    const res = await fetch(`${API_BASE_URL}/orders`);
    if (!res.ok) throw new Error("Orders API failed");
    const data = await res.json();
    setOrders(data);
  };

  // --- CRUD Actions ---

  // Create or Update Product
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku || !productForm.price || productForm.quantity === '') {
      setErrorMsg("Please fill out all product fields.");
      return;
    }
    if (parseFloat(productForm.price) <= 0) {
      setErrorMsg("Product price must be greater than 0.");
      return;
    }
    if (parseInt(productForm.quantity) < 0) {
      setErrorMsg("Product quantity cannot be negative.");
      return;
    }

    try {
      const url = selectedProduct 
        ? `${API_BASE_URL}/products/${selectedProduct.id}` 
        : `${API_BASE_URL}/products`;
      const method = selectedProduct ? 'PUT' : 'POST';
      
      const payload = {
        name: productForm.name,
        sku: productForm.sku,
        price: parseFloat(productForm.price),
        quantity: parseInt(productForm.quantity)
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Product operation failed");
      }

      setSuccessMsg(selectedProduct ? "Product updated successfully!" : "Product created successfully!");
      setIsProductModalOpen(false);
      setSelectedProduct(null);
      setProductForm({ name: '', sku: '', price: '', quantity: '' });
      fetchAllData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Delete Product
  const handleProductDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Delete product failed");
      
      setSuccessMsg("Product deleted successfully!");
      fetchAllData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Create Customer
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!customerForm.name || !customerForm.email || !customerForm.phone) {
      setErrorMsg("Please fill out all customer fields.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Customer creation failed");

      setSuccessMsg("Customer registered successfully!");
      setIsCustomerModalOpen(false);
      setCustomerForm({ name: '', email: '', phone: '' });
      fetchAllData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Delete Customer
  const handleCustomerDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer? This will also remove any orders they placed.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Delete customer failed");

      setSuccessMsg("Customer deleted successfully!");
      fetchAllData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Create Order
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!orderCustomerId) {
      setErrorMsg("Please select a customer.");
      return;
    }

    // Filter out rows with unselected products
    const validItems = orderItems.filter(item => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      setErrorMsg("Please add at least one valid product item to the order.");
      return;
    }

    // Frontend validation: check inventory stock before hitting backend
    for (let item of validItems) {
      const dbProd = products.find(p => p.id === parseInt(item.product_id));
      if (!dbProd) {
        setErrorMsg("Selected product does not exist.");
        return;
      }
      if (dbProd.quantity < item.quantity) {
        setErrorMsg(`Insufficient stock for product '${dbProd.name}'. Requested: ${item.quantity}, Stock: ${dbProd.quantity}`);
        return;
      }
    }

    try {
      const payload = {
        customer_id: parseInt(orderCustomerId),
        items: validItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity)
        }))
      };

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Order creation failed");

      setSuccessMsg("Order created successfully!");
      setIsOrderModalOpen(false);
      setOrderCustomerId('');
      setOrderItems([{ product_id: '', quantity: 1 }]);
      fetchAllData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Cancel/Delete Order
  const handleOrderDelete = async (id) => {
    if (!window.confirm("Are you sure you want to cancel and delete this order? Items will be restocked automatically.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Cancel order failed");

      setSuccessMsg("Order cancelled and items restocked!");
      fetchAllData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Dynamic order items handlers
  const addOrderItemRow = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  const removeOrderItemRow = (index) => {
    const updated = orderItems.filter((_, idx) => idx !== index);
    setOrderItems(updated.length > 0 ? updated : [{ product_id: '', quantity: 1 }]);
  };

  const updateOrderItemRow = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    setOrderItems(updated);
  };

  // Running order total estimator on front-end
  const calculateEstimatedTotal = () => {
    return orderItems.reduce((sum, item) => {
      const prod = products.find(p => p.id === parseInt(item.product_id));
      if (prod && item.quantity > 0) {
        return sum + (parseFloat(prod.price) * parseInt(item.quantity));
      }
      return sum;
    }, 0).toFixed(2);
  };

  // Open Edit Product Modal
  const openEditProduct = (prod) => {
    setSelectedProduct(prod);
    setProductForm({
      name: prod.name,
      sku: prod.sku,
      price: prod.price.toString(),
      quantity: prod.quantity.toString()
    });
    setIsProductModalOpen(true);
  };

  // Search filter implementation
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* Sidebar Section */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">I</div>
          <div className="logo-text">IMS Admin</div>
        </div>
        <ul className="sidebar-menu">
          <li>
            <div 
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </div>
          </li>
          <li>
            <div 
              className={`sidebar-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <ShoppingBag size={20} />
              <span>Products</span>
            </div>
          </li>
          <li>
            <div 
              className={`sidebar-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              <Users size={20} />
              <span>Customers</span>
            </div>
          </li>
          <li>
            <div 
              className={`sidebar-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <ClipboardList size={20} />
              <span>Orders</span>
            </div>
          </li>
        </ul>
        <div style={{ marginTop: 'auto', padding: '8px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          Backend API: {API_BASE_URL}
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {/* Error and Success Banners */}
        {errorMsg && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <div>{errorMsg}</div>
            <X size={18} className="close-btn" style={{ marginLeft: 'auto' }} onClick={() => setErrorMsg(null)} />
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success">
            <CheckCircle size={20} />
            <div>{successMsg}</div>
            <X size={18} className="close-btn" style={{ marginLeft: 'auto' }} onClick={() => setSuccessMsg(null)} />
          </div>
        )}

        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="page-header">
              <div className="page-title">
                <h1>Overview Dashboard</h1>
                <p>Real-time analytics and inventory status</p>
              </div>
              <button className="btn btn-primary" onClick={fetchAllData}>
                Refresh Data
              </button>
            </div>

            {/* Statistics Row */}
            <div className="grid-stats">
              <div className="card-stat">
                <div className="stat-header">
                  <span>Total Products</span>
                  <div className="stat-icon"><ShoppingBag size={20} /></div>
                </div>
                <div className="stat-value">{summary.total_products}</div>
                <div className="stat-label">Active SKUs cataloged</div>
              </div>
              <div className="card-stat success">
                <div className="stat-header">
                  <span>Total Customers</span>
                  <div className="stat-icon"><Users size={20} /></div>
                </div>
                <div className="stat-value">{summary.total_customers}</div>
                <div className="stat-label">Registered client accounts</div>
              </div>
              <div className="card-stat">
                <div className="stat-header">
                  <span>Total Orders</span>
                  <div className="stat-icon"><ClipboardList size={20} /></div>
                </div>
                <div className="stat-value">{summary.total_orders}</div>
                <div className="stat-label">Processed checkout orders</div>
              </div>
              <div className={`card-stat ${summary.low_stock_products.length > 0 ? 'danger' : 'success'}`}>
                <div className="stat-header">
                  <span>Low Stock Warning</span>
                  <div className="stat-icon"><AlertTriangle size={20} /></div>
                </div>
                <div className="stat-value">{summary.low_stock_products.length}</div>
                <div className="stat-label">Products under stock threshold (10)</div>
              </div>
            </div>

            {/* Low Stock Panel & Quick Action Grid */}
            <div className="dashboard-grid">
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Low Stock Alert List</div>
                  <span className="stock-badge low-stock">Threshold &lt; 10</span>
                </div>
                {summary.low_stock_products.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                    All products are sufficiently stocked. Nice job!
                  </p>
                ) : (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>SKU Code</th>
                          <th>In Stock</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.low_stock_products.map(prod => (
                          <tr key={prod.id}>
                            <td style={{ fontWeight: 500 }}>{prod.name}</td>
                            <td><span className="sku-badge">{prod.sku}</span></td>
                            <td style={{ fontWeight: 600, color: prod.quantity === 0 ? 'var(--danger)' : 'var(--warning)' }}>
                              {prod.quantity}
                              <div className="low-stock-bar-container">
                                <div 
                                  className={`low-stock-bar ${prod.quantity > 3 ? 'warning' : ''}`} 
                                  style={{ width: `${Math.min((prod.quantity / 10) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </td>
                            <td>
                              <span className={`stock-badge ${prod.quantity === 0 ? 'out-of-stock' : 'low-stock'}`}>
                                {prod.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="panel-header">
                  <div className="panel-title">Quick Tasks</div>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'space-between' }}
                  onClick={() => { setIsOrderModalOpen(true); setActiveTab('orders'); }}
                >
                  <span>Place New Order</span>
                  <Plus size={18} />
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'space-between' }}
                  onClick={() => { setSelectedProduct(null); setProductForm({ name: '', sku: '', price: '', quantity: '0' }); setIsProductModalOpen(true); }}
                >
                  <span>Catalog New Product</span>
                  <Plus size={18} />
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'space-between' }}
                  onClick={() => { setIsCustomerModalOpen(true); }}
                >
                  <span>Register Customer</span>
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && (
          <div>
            <div className="page-header">
              <div className="page-title">
                <h1>Product Catalog</h1>
                <p>Manage listing inventory, pricing, and unique SKU details</p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setSelectedProduct(null);
                  setProductForm({ name: '', sku: '', price: '', quantity: '' });
                  setIsProductModalOpen(true);
                }}
              >
                <Plus size={18} />
                <span>Add Product</span>
              </button>
            </div>

            <div className="panel">
              <div className="panel-header" style={{ border: 'none', padding: 0 }}>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ maxWidth: '350px' }} 
                  placeholder="Search by product name or SKU..." 
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              {filteredProducts.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
                  No products found. Add a product to get started.
                </p>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>SKU / Code</th>
                        <th>Unit Price</th>
                        <th>Stock Level</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(prod => (
                        <tr key={prod.id}>
                          <td style={{ fontWeight: 600 }}>{prod.name}</td>
                          <td><span className="sku-badge">{prod.sku}</span></td>
                          <td><span className="price-text">${parseFloat(prod.price).toFixed(2)}</span></td>
                          <td style={{ fontWeight: 500 }}>{prod.quantity} units</td>
                          <td>
                            <span className={`stock-badge ${
                              prod.quantity === 0 ? 'out-of-stock' : prod.quantity < 10 ? 'low-stock' : 'in-stock'
                            }`}>
                              {prod.quantity === 0 ? 'Out of Stock' : prod.quantity < 10 ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => openEditProduct(prod)}>
                                <Edit size={14} />
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleProductDelete(prod.id)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- CUSTOMERS TAB --- */}
        {activeTab === 'customers' && (
          <div>
            <div className="page-header">
              <div className="page-title">
                <h1>Customer Directory</h1>
                <p>Register client records and track contacts</p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsCustomerModalOpen(true)}>
                <Plus size={18} />
                <span>Add Customer</span>
              </button>
            </div>

            <div className="panel">
              <div className="panel-header" style={{ border: 'none', padding: 0 }}>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ maxWidth: '350px' }} 
                  placeholder="Search by customer name or email..." 
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>

              {filteredCustomers.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
                  No customer records found. Add a customer to begin.
                </p>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Customer ID</th>
                        <th>Full Name</th>
                        <th>Email Address</th>
                        <th>Phone Number</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map(cust => (
                        <tr key={cust.id}>
                          <td>#{cust.id}</td>
                          <td style={{ fontWeight: 600 }}>{cust.name}</td>
                          <td>{cust.email}</td>
                          <td>{cust.phone}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-danger btn-sm" onClick={() => handleCustomerDelete(cust.id)}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
          <div>
            <div className="page-header">
              <div className="page-title">
                <h1>Sales & Orders</h1>
                <p>Create purchases, review invoices, and manage stock fulfillment</p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (customers.length === 0) {
                    setErrorMsg("You must register at least one Customer before placing an order.");
                    return;
                  }
                  if (products.length === 0) {
                    setErrorMsg("You must add products to inventory before placing an order.");
                    return;
                  }
                  setIsOrderModalOpen(true);
                }}
              >
                <Plus size={18} />
                <span>Create Order</span>
              </button>
            </div>

            <div className="panel">
              {orders.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
                  No orders processed yet. Click "Create Order" to submit a purchase.
                </p>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date &amp; Time</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(ord => (
                        <tr key={ord.id}>
                          <td style={{ fontWeight: 600 }}>#{ord.id}</td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{ord.customer?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{ord.customer?.email}</div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            {new Date(ord.created_at).toLocaleString()}
                          </td>
                          <td><span className="price-text">${parseFloat(ord.total_amount).toFixed(2)}</span></td>
                          <td>
                            <span className="stock-badge in-stock">
                              {ord.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button 
                                className="btn btn-secondary btn-sm" 
                                onClick={() => {
                                  setSelectedOrder(ord);
                                  setIsOrderDetailsOpen(true);
                                }}
                              >
                                <Eye size={14} />
                                <span style={{ marginLeft: '4px' }}>View</span>
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleOrderDelete(ord.id)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL DIALOGS ================= */}

      {/* 1. Product Modal (Add/Edit) */}
      {isProductModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{selectedProduct ? "Edit Product Details" : "Catalog New Product"}</h2>
              <button className="close-btn" onClick={() => setIsProductModalOpen(false)}><X /></button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter product title..."
                    value={productForm.name} 
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Unique Code</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. LAP-MAC-14"
                    value={productForm.sku} 
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    required 
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Price ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control" 
                      placeholder="0.00"
                      value={productForm.price} 
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity in Stock</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="0"
                      value={productForm.quantity} 
                      onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                      required 
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{selectedProduct ? "Save Changes" : "Create Listing"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Customer Modal (Add) */}
      {isCustomerModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Register New Customer</h2>
              <button className="close-btn" onClick={() => setIsCustomerModalOpen(false)}><X /></button>
            </div>
            <form onSubmit={handleCustomerSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter customer name..."
                    value={customerForm.name} 
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="name@domain.com"
                    value={customerForm.email} 
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    placeholder="e.g. +1 555-0199"
                    value={customerForm.phone} 
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    required 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCustomerModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Order Placement Modal with items list builder */}
      {isOrderModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Create Sales Order</h2>
              <button className="close-btn" onClick={() => setIsOrderModalOpen(false)}><X /></button>
            </div>
            <form onSubmit={handleOrderSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Customer Reference</label>
                  <select 
                    className="form-control" 
                    value={orderCustomerId} 
                    onChange={(e) => setOrderCustomerId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Products Ordered</label>
                  <div className="order-items-builder">
                    {orderItems.map((item, index) => {
                      const selectedProd = products.find(p => p.id === parseInt(item.product_id));
                      const stockVal = selectedProd ? selectedProd.quantity : 0;
                      return (
                        <div key={index} className="order-item-row">
                          <div>
                            <select 
                              className="form-control"
                              value={item.product_id}
                              onChange={(e) => updateOrderItemRow(index, 'product_id', e.target.value)}
                              required
                            >
                              <option value="">-- Select Product --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (${parseFloat(p.price).toFixed(2)} - Stock: {p.quantity})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <input 
                              type="number" 
                              className="form-control" 
                              min="1"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => updateOrderItemRow(index, 'quantity', parseInt(e.target.value) || 0)}
                              required
                            />
                          </div>
                          <div>
                            <button 
                              type="button" 
                              className="btn btn-danger btn-sm"
                              style={{ padding: '10px' }}
                              onClick={() => removeOrderItemRow(index)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {selectedProd && stockVal < item.quantity && (
                            <div style={{ gridColumn: 'span 3', color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={12} />
                              <span>Insufficient stock! Available: {stockVal}. Decreasing this order amount is suggested.</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm mt-20" 
                      onClick={addOrderItemRow}
                      style={{ marginTop: '12px' }}
                    >
                      <Plus size={14} /> Add Another Product
                    </button>
                  </div>
                </div>

                <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Estimated Order Total:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>${calculateEstimatedTotal()}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsOrderModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Order Details Modal */}
      {isOrderDetailsOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Order Invoiced # {selectedOrder.id}</h2>
              <button className="close-btn" onClick={() => setIsOrderDetailsOpen(false)}><X /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>Customer Info</h4>
                  <div style={{ fontWeight: 600 }}>{selectedOrder.customer?.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedOrder.customer?.email}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedOrder.customer?.phone}</div>
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>Order Meta</h4>
                  <div>Date: {new Date(selectedOrder.created_at).toLocaleString()}</div>
                  <div>Status: <span className="stock-badge in-stock">{selectedOrder.status.toUpperCase()}</span></div>
                </div>
              </div>

              <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>Line Items</h4>
              <div className="table-container">
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.product?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}><span className="sku-badge">{item.product?.sku}</span></div>
                        </td>
                        <td>{item.quantity}</td>
                        <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <td colSpan="3" style={{ fontWeight: 700, textAlign: 'right' }}>Total Amount Charged:</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
                        ${parseFloat(selectedOrder.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsOrderDetailsOpen(false)}>Close Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
