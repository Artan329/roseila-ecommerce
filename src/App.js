import React, { useState, useEffect, useRef, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  db, 
  auth,  
  googleProvider, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  onAuthStateChange,
  createUserDocument,
} from './firebase';

import { 
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { BiLogoPinterestAlt, BiLogoTiktok } from 'react-icons/bi';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  ChevronLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  Truck, 
  CheckCircle, 
  Image as ImageIcon, 
  Minus, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error: error.message
    };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6">We're sorry for the inconvenience. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-rose-500 text-white px-6 py-2 rounded-lg hover:bg-rose-600 transition"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 text-left text-gray-600 text-sm bg-gray-50 p-4 rounded-lg">
                <strong>Error:</strong> {this.state.error}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    address: '',
    city: '',
    zip: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const cartRef = useRef(null);
  const wishlistRef = useRef(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Initialize admin status check
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          setIsAdmin(userData?.role === 'admin');
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  // Load user and products
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        setUser(user);
        // Load user's cart and wishlist
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setCart(userData?.cart || []);
        setWishlist(userData?.wishlist || []);
      } else {
        setUser(null);
        setCart([]);
        setWishlist([]);
      }
      setLoading(false);
    });

    // Load products
    const fetchProducts = async () => {
      try {
        const productsRef = collection(db, 'products');
        const productsSnap = await getDocs(productsRef);
        const productsList = productsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsList);
        
        // Get unique categories
        const uniqueCategories = [...new Set(productsList.map(p => p.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
    return unsubscribe;
  }, []);

  // Handle authentication form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  // Handle authentication
  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        setSuccess('Successfully logged in!');
        setTimeout(() => setShowAuthModal(false), 1500);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        // Create user document with role
        await createUserDocument(auth.currentUser, {
          displayName: formData.name,
          role: 'customer' // Default role for new users
        });
        setSuccess('Account created successfully!');
        setTimeout(() => setShowAuthModal(false), 1500);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
    } catch (error) {
      setError(error.message);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentPage('home');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Add to cart
  const addToCart = async (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      const updatedCart = cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    // Update Firestore
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          cart: [...cart, { ...product, quantity: 1 }]
        });
      } catch (error) {
        console.error('Error updating cart:', error);
      }
    }
  };

  // Add to wishlist
  const addToWishlist = async (product) => {
    if (!wishlist.some(item => item.id === product.id)) {
      const updatedWishlist = [...wishlist, product];
      setWishlist(updatedWishlist);
      
      // Update Firestore
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            wishlist: updatedWishlist
          });
        } catch (error) {
          console.error('Error updating wishlist:', error);
        }
      }
    }
  };

  // Remove from wishlist
  const removeFromWishlist = async (productId) => {
    const updatedWishlist = wishlist.filter(item => item.id !== productId);
    setWishlist(updatedWishlist);
    
    // Update Firestore
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          wishlist: updatedWishlist
        });
      } catch (error) {
        console.error('Error updating wishlist:', error);
      }
    }
  };

  // Update cart quantity
  const updateQuantity = (productId, change) => {
    const updatedCart = cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(item => item !== null);
    
    setCart(updatedCart);
    
    // Update Firestore
    if (user) {
      try {
        updateDoc(doc(db, 'users', user.uid), {
          cart: updatedCart
        });
      } catch (error) {
        console.error('Error updating cart:', error);
      }
    }
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    
    // Update Firestore
    if (user) {
      try {
        updateDoc(doc(db, 'users', user.uid), {
          cart: []
        });
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
  };

  // Filtered products based on search
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Admin Panel Component
  const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [localProducts, setLocalProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState('');
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [stats, setStats] = useState({
      totalSales: 0,
      orders: 0,
      customers: 0,
      conversionRate: 0
    });

    useEffect(() => {
      const fetchData = async () => {
        try {
          // Fetch products
          const productsRef = collection(db, 'products');
          const productsSnap = await getDocs(productsRef);
          const productsList = productsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setLocalProducts(productsList);
          
          // Fetch orders
          const ordersRef = collection(db, 'orders');
          const ordersSnap = await getDocs(ordersRef);
          const ordersList = ordersSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
          })).sort((a, b) => b.createdAt - a.createdAt);
          setOrders(ordersList);
          
          // Fetch stats
          let totalSales = 0;
          ordersSnap.forEach(doc => {
            totalSales += doc.data().total;
          });
          
          const usersSnapshot = await getDocs(collection(db, 'users'));
          
          setStats({
            totalSales: totalSales,
            orders: ordersSnap.size,
            customers: usersSnapshot.size,
            conversionRate: ordersSnap.size > 0 ? (ordersSnap.size / usersSnapshot.size * 100) : 0
          });
        } catch (error) {
          console.error("Error fetching admin data", error);
          setError('Failed to load admin data. Please try again.');
        } finally {
          setLoadingData(false);
        }
      };
      
      fetchData();
    }, []);
    
    const handleAddProduct = async (e) => {
      e.preventDefault();
      const form = e.target;
      
      if (!form.productName.value.trim() || 
          isNaN(form.productPrice.value) || 
          form.productPrice.value <= 0) {
        setError('Please enter valid product information');
        return;
      }
      
      const newProduct = {
        name: form.productName.value,
        price: parseFloat(form.productPrice.value),
        description: form.productDescription.value,
        category: form.productCategory.value,
        image: form.productImage.value || 'https://placehold.co/600x400/roseila-ecommerce/FFFFFF?text=Roseila',
        stock: parseInt(form.productStock.value) || 0,
        featured: form.productFeatured.checked,
        createdAt: new Date()
      };
      
      try {
        await addDoc(collection(db, 'products'), newProduct);
        // Refresh products list
        const productsRef = collection(db, 'products');
        const productsSnap = await getDocs(productsRef);
        const productsList = productsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLocalProducts(productsList);
        form.reset();
        setEditingProduct(null);
        setError('');
      } catch (error) {
        console.error("Error adding product:", error);
        setError('Failed to add product. Please try again.');
      }
    };
    
    const handleEditProduct = async (product) => {
      setEditingProduct(product);
      document.getElementById('addProductModal').classList.remove('hidden');
    };
    
    const handleUpdateProduct = async (e) => {
      e.preventDefault();
      if (!editingProduct) return;
      
      const form = e.target;
      const updatedProduct = {
        name: form.productName.value,
        price: parseFloat(form.productPrice.value),
        description: form.productDescription.value,
        category: form.productCategory.value,
        image: form.productImage.value,
        stock: parseInt(form.productStock.value) || 0,
        featured: form.productFeatured.checked
      };
      
      try {
        await updateDoc(doc(db, 'products', editingProduct.id), updatedProduct);
        // Refresh products list
        const productsRef = collection(db, 'products');
        const productsSnap = await getDocs(productsRef);
        const productsList = productsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLocalProducts(productsList);
        document.getElementById('addProductModal').classList.add('hidden');
        setEditingProduct(null);
        setError('');
      } catch (error) {
        console.error("Error updating product:", error);
        setError('Failed to update product. Please try again.');
      }
    };
    
    const handleDeleteProduct = async (productId) => {
      if (window.confirm("Are you sure you want to delete this product?")) {
        try {
          await deleteDoc(doc(db, 'products', productId));
          // Refresh products list
          const productsRef = collection(db, 'products');
          const productsSnap = await getDocs(productsRef);
          const productsList = productsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setLocalProducts(productsList);
        } catch (error) {
          console.error("Error deleting product:", error);
          setError('Failed to delete product. Please try again.');
        }
      }
    };
    
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
      try {
        await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
        // Refresh orders list
        const ordersRef = collection(db, 'orders');
        const ordersSnap = await getDocs(ordersRef);
        const ordersList = ordersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
        })).sort((a, b) => b.createdAt - a.createdAt);
        setOrders(ordersList);
      } catch (error) {
        console.error("Error updating order status:", error);
        setError('Failed to update order status.');
      }
    };
    
    const getStatusColor = (status) => {
      switch (status.toLowerCase()) {
        case 'processing': return 'bg-yellow-100 text-yellow-800';
        case 'shipped': return 'bg-blue-100 text-blue-800';
        case 'delivered': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
    
    const getStatusIcon = (status) => {
      switch (status.toLowerCase()) {
        case 'processing': return <Clock className="mr-1" size={16} />;
        case 'shipped': return <Truck className="mr-1" size={16} />;
        case 'delivered': return <CheckCircle className="mr-1" size={16} />;
        case 'cancelled': return <AlertCircle className="mr-1" size={16} />;
        default: return <Package className="mr-1" size={16} />;
      }
    };
    
    const renderDashboard = () => (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
            <div className="flex items-center">
              <DollarSign className="text-rose-500 mr-4" size={32} />
              <div>
                <p className="text-gray-500">Total Sales</p>
                <p className="text-2xl font-bold">${stats.totalSales.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
            <div className="flex items-center">
              <ShoppingCart className="text-rose-500 mr-4" size={32} />
              <div>
                <p className="text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold">{stats.orders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
            <div className="flex items-center">
              <Users className="text-rose-500 mr-4" size={32} />
              <div>
                <p className="text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold">{stats.customers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
            <div className="flex items-center">
              <TrendingUp className="text-rose-500 mr-4" size={32} />
              <div>
                <p className="text-gray-500">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Recent Orders</h3>
              <a href="/admin/orders" className="text-rose-500 hover:text-rose-600">View all →</a>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4">Order ID</th>
                    <th className="text-left p-4">Customer</th>
                    <th className="text-left p-4">Total</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(order => (
                    <tr 
                      key={order.id} 
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="p-4">#{order.id.substring(0, 8)}</td>
                      <td className="p-4">{order.customerName}</td>
                      <td className="p-4">${order.total.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4">{order.createdAt.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Top Products</h3>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4">Product</th>
                    <th className="text-left p-4">Sales</th>
                    <th className="text-left p-4">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {localProducts
                    .sort((a, b) => (b.sales || 0) - (a.sales || 0))
                    .slice(0, 5)
                    .map(product => (
                      <tr key={product.id} className="border-t">
                        <td className="p-4">
                          <div className="flex items-center">
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-10 h-10 object-cover rounded mr-3"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/600x400/roseila-ecommerce/FFFFFF?text=Roseila';
                              }}
                            />
                            <span>{product.name.substring(0, 20)}{product.name.length > 20 ? '...' : ''}</span>
                          </div>
                        </td>
                        <td className="p-4">${(product.sales || 0).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded ${
                            product.stock > 10 ? 'bg-green-100 text-green-800' : 
                            product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
    
    const renderProducts = () => (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Products Management</h2>
          <button 
            onClick={() => {
              setEditingProduct(null);
              document.getElementById('addProductModal').classList.remove('hidden');
            }}
            className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 flex items-center"
          >
            <Plus size={18} className="mr-2" /> Add Product
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Image</th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Price</th>
                <th className="text-left p-4">Stock</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Featured</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {localProducts.map(product => (
                <tr key={product.id} className="border-t">
                  <td className="p-4">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-16 h-16 object-cover rounded" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/600x400/roseila-ecommerce/FFFFFF?text=Roseila';
                      }}
                    />
                  </td>
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4">${product.price.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded ${
                      product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4 capitalize">{product.category}</td>
                  <td className="p-4">
                    {product.featured ? (
                      <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded">Yes</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">No</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit product"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete product"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {localProducts.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No products found. Click "Add Product" to create your first product.
            </div>
          )}
        </div>
        
        {/* Add/Edit Product Modal */}
        <div id="addProductModal" className="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button 
                  onClick={() => {
                    document.getElementById('addProductModal').classList.add('hidden');
                    setEditingProduct(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Product Name *</label>
                      <input 
                        type="text" 
                        name="productName" 
                        defaultValue={editingProduct?.name || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Price ($) *</label>
                      <input 
                        type="number" 
                        name="productPrice" 
                        defaultValue={editingProduct?.price || ''}
                        step="0.01" 
                        min="0" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Stock *</label>
                      <input 
                        type="number" 
                        name="productStock" 
                        defaultValue={editingProduct?.stock || 10}
                        min="0" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Category</label>
                      <select 
                        name="productCategory" 
                        defaultValue={editingProduct?.category || 'flowers'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                      >
                        <option value="flowers">Flowers</option>
                        <option value="bouquets">Bouquets</option>
                        <option value="gifts">Gifts</option>
                        <option value="occasions">Occasions</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Image URL</label>
                      <div className="flex">
                        <input 
                          type="text" 
                          name="productImage" 
                          defaultValue={editingProduct?.image || 'https://placehold.co/600x400/roseila-ecommerce/FFFFFF?text=Roseila'}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                        <button
                          type="button"
                          onClick={() => window.open('https://placehold.co/', '_blank')}
                          className="bg-gray-100 px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200"
                        >
                          <ImageIcon size={18} />
                        </button>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">Use https://placehold.co/ for placeholder images</p>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Description</label>
                      <textarea 
                        name="productDescription" 
                        defaultValue={editingProduct?.description || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                        rows="3"
                      ></textarea>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        name="productFeatured" 
                        defaultChecked={editingProduct?.featured || false}
                        className="h-4 w-4 text-rose-500 focus:ring-rose-200 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-gray-700">Featured Product</label>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                  <button 
                    type="button"
                    onClick={() => {
                      document.getElementById('addProductModal').classList.add('hidden');
                      setEditingProduct(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 flex items-center"
                  >
                    <Save size={18} className="mr-2" /> {editingProduct ? 'Update' : 'Add'} Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
    
    const renderOrders = () => (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Orders Management</h2>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Order ID</th>
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Total</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-t">
                  <td className="p-4">#{order.id.substring(0, 8)}</td>
                  <td className="p-4">{order.customerName}</td>
                  <td className="p-4">${order.total.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4">{order.createdAt.toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-500 hover:text-blue-700"
                        title="View order details"
                      >
                        <Eye size={18} />
                      </button>
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                          className="text-blue-500 hover:text-blue-700"
                          title="Mark as shipped"
                        >
                          <Truck size={18} />
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                          className="text-green-500 hover:text-green-700"
                          title="Mark as delivered"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {order.status !== 'cancelled' && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                          className="text-red-500 hover:text-red-700"
                          title="Cancel order"
                        >
                          <AlertCircle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {orders.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No orders found.
            </div>
          )}
        </div>
        
        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold">Order #{selectedOrder.id.substring(0, 8)}</h3>
                    <p className="text-gray-500">Placed on {selectedOrder.createdAt.toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Customer Information</h4>
                    <p className="text-gray-700">{selectedOrder.customerName}</p>
                    <p className="text-gray-700">{selectedOrder.email}</p>
                    <p className="text-gray-700">{selectedOrder.address}</p>
                    <p className="text-gray-700">{selectedOrder.city}, {selectedOrder.zip}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Order Status</h4>
                    <div className="flex items-center">
                      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                        selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                        selectedOrder.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        selectedOrder.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                      {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'shipped')}
                          className="ml-4 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          Mark as Shipped
                        </button>
                      )}
                      {selectedOrder.status === 'shipped' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'delivered')}
                          className="ml-4 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Mark as Delivered
                        </button>
                      )}
                      {selectedOrder.status !== 'cancelled' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'cancelled')}
                          className="ml-4 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center border-b pb-3">
                        <div className="flex items-center">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="h-12 w-12 object-cover rounded mr-3"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://placehold.co/600x400/roseila-ecommerce/FFFFFF?text=Roseila';
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <p className="text-gray-500 text-sm">x{item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium">$5.00</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>Total:</span>
                    <span>${(selectedOrder.total + 5).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
    
    if (loadingData) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <LayoutDashboard className="text-rose-500 mr-2" size={24} />
                <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
              </div>
              <button 
                onClick={() => setCurrentPage('home')}
                className="text-gray-600 hover:text-gray-800 flex items-center"
              >
                <ChevronLeft size={18} className="mr-1" /> Back to Store
              </button>
            </div>
            
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`${activeTab === 'dashboard' 
                    ? 'border-rose-500 text-rose-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <TrendingUp size={18} className="mr-1" /> Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`${activeTab === 'products' 
                    ? 'border-rose-500 text-rose-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Package size={18} className="mr-1" /> Products
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`${activeTab === 'orders' 
                    ? 'border-rose-500 text-rose-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <ShoppingCart size={18} className="mr-1" /> Orders
                </button>
              </nav>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'orders' && renderOrders()}
        </main>
      </div>
    );
  };

  // Home Page Component
  const HomePage = () => (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[600px]">
        <div className="absolute inset-0">
          <img 
            src="https://placehold.co/1920x1080/roseila-ecommerce/FFFFFF?text=Roseila+Flowers" 
            alt="Hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-rose-50/90 to-white/90" />
        </div>
        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-6xl font-bold text-gray-800 mb-6"
            >
              Beautiful Blooms for Every Occasion
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              Handcrafted floral arrangements delivered fresh to your door. Celebrate life's special moments with our exquisite selection of flowers.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <button 
                onClick={() => setCurrentPage('shop')}
                className="bg-rose-500 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-rose-600 transition"
              >
                Shop Now
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition"
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src={`https://placehold.co/600x400/roseila-ecommerce/FFFFFF?text=${category}`} 
                    alt={category} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 capitalize">{category}</h3>
                  <p className="text-gray-600 mb-4">Discover our finest selection of {category}</p>
                  <button 
                    onClick={() => setCurrentPage('shop')}
                    className="text-rose-500 hover:text-rose-600 font-medium flex items-center"
                  >
                    View Collection <ChevronLeft className="ml-1 transform rotate-180" size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Featured Products</h2>
            <button 
              onClick={() => setCurrentPage('shop')}
              className="text-rose-500 hover:text-rose-600 font-medium"
            >
              View All <ChevronLeft className="inline transform rotate-180" size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.slice(0, 4).map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition"
              >
                <div className="relative">
                  {product.featured && (
                    <span className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                      Featured
                    </span>
                  )}
                  <div className="h-64 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/600x400/roseila-ecommerce/FFFFFF?text=Roseila';
                      }}
                    />
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col space-y-2">
                    <button 
                      onClick={() => addToWishlist(product)}
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-gray-50 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-rose-500 font-bold text-lg">${product.price.toFixed(2)}</span>
                    <button 
                      onClick={() => addToCart(product)}
                      className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-md"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 italic mb-4">"The flowers were absolutely stunning and arrived fresh. Will definitely order again!"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Sarah Johnson</h4>
                    <p className="text-gray-500 text-sm">New York, NY</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  // Shop Page Component
  const ShopPage = () => (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Categories</h3>
              <ul className="space-y-2">
                {categories.map(category => (
                  <li key={category}>
                    <button 
                      type="button" 
                      className="text-gray-600 hover:text-rose-500 transition capitalize"
                    >
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Price Range</h3>
                <div className="space-y-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>$0</span>
                    <span>$100+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Our Collection</h1>
              <div className="flex items-center space-x-4">
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200">
                  <option>Sort by: Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Alphabetical</option>
                </select>
              </div>
            </div>
            
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No products found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition"
                  >
                    <div className="relative">
                      {product.featured && (
                        <span className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                          Featured
                        </span>
                      )}
                      <div className="h-64 overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover hover:scale-105 transition duration-500"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/600x400/roseila-ecommerce/FFFFFF?text=Roseila';
                          }}
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex flex-col space-y-2">
                        <button 
                          onClick={() => addToWishlist(product)}
                          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-gray-50 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-rose-500 font-bold text-lg">${product.price.toFixed(2)}</span>
                        <button 
                          onClick={() => addToCart(product)}
                          className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Cart Component
  const CartPage = () => (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>
        
        {cart.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-800 mt-4">Your cart is empty</h2>
            <p className="text-gray-600 mt-2">Looks like you haven't added anything to your cart yet.</p>
            <button 
              onClick={() => setCurrentPage('shop')}
              className="mt-6 bg-rose-500 text-white px-6 py-3 rounded-lg hover:bg-rose-600 transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center bg-white p-4 rounded-lg shadow-sm mb-4">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-24 h-24 object-cover rounded" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/600x400/roseila-ecommerce/FFFFFF?text=Roseila';
                    }}
                  />
                  <div className="ml-6 flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-gray-600">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="px-3 py-1 hover:bg-gray-100"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-4 py-1 border-x border-gray-300">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="px-3 py-1 hover:bg-gray-100"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="ml-6 font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">$5.00</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>
                      ${(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 5).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row justify-between">
                <button
                  onClick={clearCart}
                  className="text-gray-600 hover:text-gray-800 mb-4 sm:mb-0"
                >
                  Clear Cart
                </button>
                <button
                  onClick={() => setCurrentPage('checkout')}
                  className="bg-rose-500 text-white px-6 py-3 rounded-lg hover:bg-rose-600 transition w-full sm:w-auto"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Checkout Page Component
  const CheckoutPage = () => {
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    
    const handleSubmit = async (e) => {
      e.preventDefault();
  
      // 1. Validate form
      // 2. Process payment FIRST
      try {
        setProcessing(true);
        setError(null);
    
        // Create payment intent via Netlify function
        const { clientSecret } = await createPaymentIntent(cart, formData.email);
    
        if (!clientSecret) {
          throw new Error("Failed to create payment intent");
        }
    
        // Confirm payment
        const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
        const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: formData.name,
              email: formData.email,
              address: {
              line1: formData.address,
                city: formData.city,
                postal_code: formData.zip
              }
            }
          }
        });
    
        if (paymentError) {
          throw new Error(paymentError.message);
        }
    
        // 3. ONLY AFTER SUCCESSFUL PAYMENT, save order
        const orderData = {
          items: cart,
          total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          shipping: 5.00,
          status: 'Processing',
          createdAt: new Date(),
          ...formData
        };
    
        await addDoc(collection(db, 'orders'), orderData);
        setCart([]);
        setOrderPlaced(true);
    
        // 4. Clear cart in Firestore
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), { cart: [] });
        }
    
        // Show success message
        setTimeout(() => {
          setCurrentPage('home');
          setOrderPlaced(false);
        }, 3000);
      } catch (error) {
        console.error('Error processing order:', error);
        setError(`Payment failed: ${error.message || 'Please try again'}`);
      } finally {
        setProcessing(false);
      }
    };
    
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>
          
          {orderPlaced ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-800 mt-4">Order Placed Successfully!</h2>
              <p className="text-gray-600 mt-2">Thank you for your purchase. Your order has been confirmed and will be processed shortly.</p>
              <button 
                onClick={() => setCurrentPage('home')}
                className="mt-6 bg-rose-500 text-white px-6 py-3 rounded-lg hover:bg-rose-600 transition"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Shipping Information</h2>
                
                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                      placeholder="123 Main St"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">ZIP Code</label>
                      <input
                        type="text"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">Payment Method</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="card"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-rose-500 focus:ring-rose-200 border-gray-300"
                      />
                      <label htmlFor="card" className="ml-2 block text-gray-700">
                        Credit Card
                      </label>
                    </div>
                    
                    {paymentMethod === 'card' && (
                      <div className="pl-6 space-y-4">
                        <div>
                          <label className="block text-gray-700 mb-2">Card Number</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder="1234 5678 9012 3456"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-700 mb-2">Expiry Date</label>
                            <input
                              type="text"
                              value={expiry}
                              onChange={(e) => setExpiry(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                              placeholder="MM/YY"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 mb-2">CVV</label>
                            <input
                              type="text"
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                              placeholder="123"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-rose-500 text-white py-3 rounded-lg hover:bg-rose-600 transition mt-6 disabled:opacity-50"
                  >
                    {processing ? (
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      </div>
                    ) : `Pay $${(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 5).toFixed(2)}`}
                  </button>
                </form>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>
                
                {cart.map(item => (
                  <div key={item.id} className="flex items-center py-4 border-b">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/600x400/roseila-ecommerce/FFFFFF?text=Roseila';
                      }}
                    />
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      <p className="text-gray-600">x{item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">$5.00</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>
                        ${(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 5).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Wishlist Component
  const WishlistPage = () => (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Wishlist</h1>
        
        {wishlist.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-800 mt-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mt-2">Add items to your wishlist to save them for later.</p>
            <button 
              onClick={() => setCurrentPage('shop')}
              className="mt-6 bg-rose-500 text-white px-6 py-3 rounded-lg hover:bg-rose-600 transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {wishlist.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition"
              >
                <div className="relative">
                  <div className="h-64 overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/600x400/roseila-ecommerce/FFFFFF?text=Roseila';
                      }}
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <button 
                      onClick={() => removeFromWishlist(item.id)}
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-gray-50 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.name}</h3>
                  <p className="text-gray-600 mb-4">${item.price.toFixed(2)}</p>
                  <button 
                    onClick={() => addToCart(item)}
                    className="w-full bg-rose-500 text-white py-2 rounded-lg hover:bg-rose-600 transition"
                  >
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Authentication Modal
  const AuthModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <button 
              onClick={() => setShowAuthModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
              {success}
            </div>
          )}
          
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div>
              <label className="block text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                placeholder="••••••••"
              />
            </div>
            
            {authMode === 'register' && (
              <div>
                <label className="block text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                  placeholder="••••••••"
                />
              </div>
            )}
            
            <button
              type="submit"
              disabled={processing}
              className="w-full bg-rose-500 text-white py-3 rounded-lg hover:bg-rose-600 transition disabled:opacity-50"
            >
              {processing ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
            
            <div className="mt-4 text-center text-gray-600">
              {authMode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => setAuthMode('register')}
                    className="text-rose-500 hover:text-rose-600 font-medium"
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => setAuthMode('login')}
                    className="text-rose-500 hover:text-rose-600 font-medium"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.73-.02-1.47-.06-2.2H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.02z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09v-2.84H2.18C1.75 8.81 1.44 9.88 1.29 11c0 3.28 1.2 6.1 3.28 8.02l3.57-2.77z" fill="#FBBC05"/>
                  <path d="M12 5.43c1.45 0 2.72.48 3.71 1.36l2.84-2.84C17.15 2.91 14.97 2 12 2 7.7 2 3.99 4.47 2.18 8.02l3.57 2.77c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="ml-2 text-xl font-bold text-gray-800">Roseila</span>
                </div>
                
                <nav className="hidden md:flex items-center space-x-8">
                  <button 
                    type="button"
                    className="text-gray-600 hover:text-gray-800 font-medium"
                    onClick={() => setCurrentPage('home')}
                  >
                    Home
                  </button>
                  <button 
                    type="button"
                    className="text-gray-600 hover:text-gray-800 font-medium"
                    onClick={() => setCurrentPage('shop')}
                  >
                    Shop
                  </button>
                  <button 
                    type="button"
                    className="text-gray-600 hover:text-gray-800 font-medium"
                    onClick={() => setCurrentPage('about')}
                  >
                    About
                  </button>
                  <button 
                    type="button"
                    className="text-gray-600 hover:text-gray-800 font-medium"
                    onClick={() => setCurrentPage('contact')}
                  >
                    Contact
                  </button>
                </nav>
                
                <div className="flex items-center space-x-4">
                  {user ? (
                    <>
                      {isAdmin && (
                        <button
                          onClick={() => setCurrentPage('admin')}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <LayoutDashboard size={20} />
                        </button>
                      )}
                      <div className="relative">
                        <button 
                          onClick={() => setShowWishlist(!showWishlist)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        {wishlist.length > 0 && (
                          <span className="absolute top-0 right-0 bg-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {wishlist.length}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <button 
                          onClick={() => setShowCart(!showCart)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </button>
                        {cart.length > 0 && (
                          <span className="absolute top-0 right-0 bg-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {cart.length}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <button 
                          onClick={handleLogout}
                          className="text-gray-600 hover:text-gray-800 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="ml-2 hidden md:block">{user.email.split('@')[0]}</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <button 
                      onClick={() => {
                        setAuthMode('login');
                        setShowAuthModal(true);
                      }}
                      className="text-gray-600 hover:text-gray-800 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="ml-2 hidden md:block">Sign In</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Cart Sidebar */}
          {showCart && (
            <div 
              ref={cartRef}
              className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
                  <button 
                    onClick={() => setShowCart(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-800 mt-4">Your cart is empty</h3>
                    <p className="text-gray-600 mt-2">Add items to your cart to continue.</p>
                    <button 
                      onClick={() => {
                        setShowCart(false);
                        setCurrentPage('shop');
                      }}
                      className="mt-6 bg-rose-500 text-white px-6 py-3 rounded-lg hover:bg-rose-600 transition"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center bg-gray-50 p-4 rounded-lg mb-4">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-16 h-16 object-cover rounded" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/600x400/roseila-ecommerce/FFFFFF?text=Roseila';
                          }}
                        />
                        <div className="ml-4 flex-1">
                          <h3 className="font-semibold text-gray-800">{item.name}</h3>
                          <p className="text-gray-600">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="px-3 py-1 hover:bg-gray-100"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-4 py-1 border-x border-gray-300">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="px-3 py-1 hover:bg-gray-100"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="ml-6 font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                    
                    <div className="mt-8">
                      <div className="flex justify-between mb-4">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">
                          ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between mb-4">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">$5.00</span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>
                            ${(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 5).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setShowCart(false);
                          setCurrentPage('cart');
                        }}
                        className="mt-6 w-full bg-rose-500 text-white py-3 rounded-lg hover:bg-rose-600 transition"
                      >
                        View Cart
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Wishlist Sidebar */}
          {showWishlist && (
            <div 
              ref={wishlistRef}
              className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Wishlist</h2>
                  <button 
                    onClick={() => setShowWishlist(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {wishlist.length === 0 ? (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-800 mt-4">Your wishlist is empty</h3>
                    <p className="text-gray-600 mt-2">Add items to your wishlist to save them for later.</p>
                    <button 
                      onClick={() => {
                        setShowWishlist(false);
                        setCurrentPage('shop');
                      }}
                      className="mt-6 bg-rose-500 text-white px-6 py-3 rounded-lg hover:bg-rose-600 transition"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    {wishlist.map(item => (
                      <div key={item.id} className="flex items-center bg-gray-50 p-4 rounded-lg mb-4">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-16 h-16 object-cover rounded" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/600x400/roseila-ecommerce/FFFFFF?text=Roseila';
                          }}
                        />
                        <div className="ml-4 flex-1">
                          <h3 className="font-semibold text-gray-800">{item.name}</h3>
                          <p className="text-gray-600">${item.price.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => {
                        setShowWishlist(false);
                        setCurrentPage('wishlist');
                      }}
                      className="mt-6 w-full bg-rose-500 text-white py-3 rounded-lg hover:bg-rose-600 transition"
                    >
                      View Wishlist
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1">
            {currentPage === 'home' && <HomePage />}
            {currentPage === 'shop' && <ShopPage />}
            {currentPage === 'cart' && <CartPage />}
            {currentPage === 'checkout' && <CheckoutPage />}
            {currentPage === 'wishlist' && <WishlistPage />}
            {currentPage === 'admin' && isAdmin && <AdminPanel />}
          </main>

          {/* Footer */}
          <footer className="bg-gray-50 border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Roseila</h3>
                  <p className="text-gray-600 mb-4">
                    Handcrafted floral arrangements delivered fresh to your door. Celebrating life's special moments with exquisite flowers.
                  </p>
                  <div className="flex space-x-4">
                    <button type="button" className="text-gray-400 hover:text-gray-600">
                      <BiLogoPinterestAlt size={24} />
                    </button>
                    <button type="button" className="text-gray-400 hover:text-gray-600">
                      <BiLogoTiktok size={24} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Shop</h3>
                  <ul className="space-y-2">
                    <li><button type="button" className="text-gray-600 hover:text-gray-800">Flowers</button></li>
                    <li><button type="button" className="text-gray-600 hover:text-gray-800">Bouquets</button></li>
                    <li><button type="button" className="text-gray-600 hover:text-gray-800">Gifts</button></li>
                    <li><button type="button" className="text-gray-600 hover:text-gray-800">Occasions</button></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Help</h3>
                  <ul className="space-y-2">
                    <li><button type="button" className="text-gray-600 hover:text-gray-800">Shipping</button></li>
                    <li><button type="button" className="text-gray-600 hover:text-gray-800">Returns</button></li>
                    <li><button type="button" className="text-gray-600 hover:text-gray-800">FAQs</button></li>
                    <li><button type="button" className="text-gray-600 hover:text-gray-800">Contact</button></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Newsletter</h3>
                  <p className="text-gray-600 mb-4">Subscribe to get special offers and updates.</p>
                  <div className="flex">
                    <input 
                      type="email" 
                      placeholder="Your email" 
                      className="px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-rose-200 w-full"
                    />
                    <button className="bg-rose-500 text-white px-4 py-2 rounded-r-lg hover:bg-rose-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500">
                <p>&copy; {new Date().getFullYear()} Roseila. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
        
        {/* Authentication Modal */}
        {showAuthModal && <AuthModal />}
    </ErrorBoundary>
  );
}

export default App;