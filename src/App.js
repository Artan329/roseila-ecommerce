import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Heart, Menu, X, ChevronLeft, ChevronRight, Star, Search, 
  CreditCard, MapPin, Phone, Mail, ChevronDown, Minus, Plus, XCircle, 
  CheckCircle, Facebook, Instagram, Pinterest, Tiktok, Package // <-- Add Package icon
} from 'lucide-react';
import { 
  auth, 
  db,
  onAuthStateChange,
  signOut,
  createUserDocument
} from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

const App = () => {
  // State management
  const [currentPage, setCurrentPage] = useState('home');
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    zip: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [orderPlaced, setOrderPlaced] = useState(false);

  //Auth
  // Add right after other useState declarations
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChange(async (userAuth) => {
    if (userAuth) {
      // User is signed in
      const userRef = await createUserDocument(userAuth);
      const userSnap = await getDoc(userRef);
      
      setUser({
        id: userAuth.uid,
        ...userSnap.data()
      });
    } else {
      // User is signed out
      setUser(null);
    }
    setLoading(false);
  });
  
  return unsubscribe;
}, []);


  // Mock product data
  const products = [
    { 
      id: 1, 
      name: 'Velvet Rose Lipstick', 
      price: 24.99, 
      category: 'lipstick', 
      image: 'https://placehold.co/400x400/png?text=Velvet+Rose&bg=ffebee&text_color=e87a90',
      description: 'Richly pigmented lipstick with 12-hour wear. Infused with rosehip oil for hydration.',
      rating: 4.7,
      ingredients: 'Beeswax, Shea Butter, Rosehip Oil, Vitamin E',
      shades: ['Rosewood', 'Crimson', 'Blush']
    },
    { 
      id: 2, 
      name: 'Blossom Glow Serum', 
      price: 39.99, 
      category: 'serum', 
      image: 'https://placehold.co/400x400/png?text=Blossom+Glow&bg=fce4ec&text_color=d4a7b0',
      description: 'Illuminating serum with rose extract and vitamin C for radiant skin.',
      rating: 4.5,
      ingredients: 'Rose Extract, Vitamin C, Hyaluronic Acid, Licorice Root'
    },
    { 
      id: 3, 
      name: 'Petals Eyeshadow Palette', 
      price: 45.00, 
      category: 'eyeshadow', 
      image: 'https://placehold.co/400x400/png?text=Petals+Palette&bg=f3e5f5&text_color=b39ddb',
      description: '12 versatile shades inspired by blooming roses. Long-wearing and blendable formula.',
      rating: 4.8,
      shades: ['Bud Pink', 'Bloom', 'Thorn', 'Stem']
    },
    { 
      id: 4, 
      name: 'Rose Quartz Cleanser', 
      price: 28.50, 
      category: 'cleanser', 
      image: 'https://placehold.co/400x400/png?text=Rose+Quartz&bg=ffecb3&text_color=e65100',
      description: 'Gentle cleansing gel with rose quartz crystals and floral extracts.',
      rating: 4.3,
      ingredients: 'Rose Quartz Powder, Chamomile Extract, Aloe Vera, Green Tea'
    },
    { 
      id: 5, 
      name: 'Bloom Blush Duo', 
      price: 22.00, 
      category: 'blush', 
      image: 'https://placehold.co/400x400/png?text=Bloom+Blush&bg=ffebee&text_color=e87a90',
      description: 'Dual-tone blush for a natural flushed look. Buildable formula for day-to-night wear.',
      rating: 4.6
    },
    { 
      id: 6, 
      name: 'Dewy Rose Toner', 
      price: 32.99, 
      category: 'toner', 
      image: 'https://placehold.co/400x400/png?text=Dewy+Rose&bg=fafafa&text_color=757575',
      description: 'Hydrating toner with rose water and botanical extracts to refresh and balance skin.',
      rating: 4.4
    }
  ];

  const categories = [
    { id: 'all', name: 'All Products', image: 'https://placehold.co/100x100/png?text=All&bg=e87a90&text_color=ffffff' },
    { id: 'lipstick', name: 'Lipsticks', image: 'https://placehold.co/100x100/png?text=Lips&bg=f8bbd0&text_color=424242' },
    { id: 'serum', name: 'Serums', image: 'https://placehold.co/100x100/png?text=Serum&bg=e1bee7&text_color=424242' },
    { id: 'eyeshadow', name: 'Eyeshadows', image: 'https://placehold.co/100x100/png?text=Eyes&bg=d1c4e9&text_color=424242' },
    { id: 'cleanser', name: 'Cleansers', image: 'https://placehold.co/100x100/png?text=Clean&bg=c5cae9&text_color=424242' },
    { id: 'blush', name: 'Blushes', image: 'https://placehold.co/100x100/png?text=Blush&bg=b39ddb&text_color=ffffff' },
    { id: 'toner', name: 'Toners', image: 'https://placehold.co/100x100/png?text=Toner&bg=9fa8da&text_color=ffffff' }
  ];

  // Filter products based on category and search
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle adding to cart
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity }]);
    }
    
    setQuantity(1);
    setCurrentPage('cart');
  };

  // Handle adding to wishlist
  const addToWishlist = (product) => {
    if (!wishlist.some(item => item.id === product.id)) {
      setWishlist([...wishlist, product]);
    }
  };

  // Handle quantity changes
  const updateQuantity = (id, change) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
    ));
  };

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle checkout submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send data to backend
    setOrderPlaced(true);
    setTimeout(() => {
      setCart([]);
      setCurrentPage('home');
      setOrderPlaced(false);
    }, 3000);
  };

  // Handle login Register signin and logout
const handleLogin = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    setCurrentPage('home');
  } catch (error) {
    alert(`Login failed: ${error.message}`);
  }
};

const handleRegister = async (email, password, name) => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await createUserDocument(user, { displayName: name });
    setCurrentPage('home');
  } catch (error) {
    alert(`Registration failed: ${error.message}`);
  }
};

const handleGoogleSignIn = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
    setCurrentPage('home');
  } catch (error) {
    alert(`Google sign-in failed: ${error.message}`);
  }
};

const handleLogout = async () => {
  try {
    await signOut(auth);
    setCurrentPage('home');
  } catch (error) {
    alert(`Logout failed: ${error.message}`);
  }
};


  // Page transitions
  const pageVariants = {
    initial: { opacity: 0, x: 300 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -300 }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  };

  // Header component
  const Header = () => (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden mr-4 text-gray-700 hover:text-rose-500"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 
            onClick={() => setCurrentPage('home')}
            className="text-2xl md:text-3xl font-serif font-bold text-rose-500 cursor-pointer"
          >
            Roseila
          </h1>
        </div>
        
        <nav className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block absolute md:relative top-16 md:top-auto left-0 w-full md:w-auto bg-white md:bg-transparent shadow-md md:shadow-none p-4 md:p-0`}>
          <ul className="md:flex md:space-x-6 text-center">
            <li><button onClick={() => { setCurrentPage('home'); setMobileMenuOpen(false); }} className="block py-2 md:py-0 text-gray-700 hover:text-rose-500 font-medium">Home</button></li>
            <li><button onClick={() => { setCurrentPage('products'); setMobileMenuOpen(false); }} className="block py-2 md:py-0 text-gray-700 hover:text-rose-500 font-medium">Shop</button></li>
            <li><button onClick={() => { setCurrentPage('products'); setSelectedCategory('serum'); setMobileMenuOpen(false); }} className="block py-2 md:py-0 text-gray-700 hover:text-rose-500 font-medium">Best Sellers</button></li>
            <li><button onClick={() => { setCurrentPage('products'); setSelectedCategory('lipstick'); setMobileMenuOpen(false); }} className="block py-2 md:py-0 text-gray-700 hover:text-rose-500 font-medium">New Arrivals</button></li>
            <li><button onClick={() => { setCurrentPage('about'); setMobileMenuOpen(false); }} className="block py-2 md:py-0 text-gray-700 hover:text-rose-500 font-medium">About</button></li>
            <li><button onClick={() => { setCurrentPage('contact'); setMobileMenuOpen(false); }} className="block py-2 md:py-0 text-gray-700 hover:text-rose-500 font-medium">Contact</button></li>
          </ul>
        </nav>
        
        {/* Replace the entire user section in Header component */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="hidden md:block px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <Search className="md:hidden text-gray-500" size={20} />
          </div>
          <button onClick={() => setCurrentPage('wishlist')} className="relative text-gray-700 hover:text-rose-500">
            <Heart size={20} />
            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>
          <button onClick={() => setCurrentPage('cart')} className="relative text-gray-700 hover:text-rose-500">
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
          
          {/* Add this user section */}
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : user ? (
            <UserMenu />
          ) : (
            <button 
              onClick={() => setCurrentPage('login')}
              className="text-gray-700 hover:text-rose-500 font-medium"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );

  // Footer component
  const Footer = () => (
    <footer className="bg-gray-50 pt-12 pb-6 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-serif font-bold text-rose-500 mb-4">Roseila Cosmetics</h3>
            <p className="text-gray-600 mb-4">Luxury cosmetics crafted with natural ingredients and sustainable practices.</p>
            <div className="flex space-x-4">

              {/* <a href="#" className="text-gray-400 hover:text-rose-500"><Facebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-rose-500"><Instagram size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-rose-500"><Pinterest size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-rose-500"><Tiktok size={20} /></a>
              */}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><button onClick={() => setCurrentPage('home')} className="text-gray-600 hover:text-rose-500">Home</button></li>
              <li><button onClick={() => setCurrentPage('products')} className="text-gray-600 hover:text-rose-500">Shop All</button></li>
              <li><button onClick={() => { setCurrentPage('products'); setSelectedCategory('serum'); }} className="text-gray-600 hover:text-rose-500">Best Sellers</button></li>
              <li><button onClick={() => setCurrentPage('about')} className="text-gray-600 hover:text-rose-500">About Us</button></li>
              <li><button onClick={() => setCurrentPage('contact')} className="text-gray-600 hover:text-rose-500">Contact</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <MapPin size={16} className="mt-1 mr-2 text-rose-500" />
                <span>123 Rose Lane, Beauty City, BC 12345</span>
              </li>
              <li className="flex items-start">
                <Phone size={16} className="mt-1 mr-2 text-rose-500" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start">
                <Mail size={16} className="mt-1 mr-2 text-rose-500" />
                <span>hello@roseila.com</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Newsletter</h4>
            <p className="text-gray-600 mb-4">Subscribe for exclusive offers and beauty tips.</p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Your email" 
                className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button className="bg-rose-500 text-white px-4 py-2 rounded-r-md hover:bg-rose-600 transition">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Roseila Cosmetics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );

  // Home Page
  const HomePage = () => (
    <div>
      {/* Hero Section */}
      <section className="relative h-[70vh] md:h-[80vh] overflow-hidden">
        <div className="absolute inset-0">
          <div className="h-full bg-gradient-to-r from-rose-50 to-pink-50" />
          <div className="absolute inset-0 bg-[url('https://placehold.co/1920x1080/png?text=Rose+Petals&bg=ffebee')] bg-cover bg-center opacity-10" />
        </div>
        <div className="relative container mx-auto h-full flex flex-col md:flex-row items-center px-4">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="md:w-1/2 pt-16 md:pt-0"
          >
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-800 mb-4">Pure Beauty, Naturally</h2>
            <p className="text-xl text-gray-600 mb-8">Discover our collection of luxury cosmetics crafted with natural ingredients and sustainable practices.</p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => setCurrentPage('products')}
                className="bg-rose-500 text-white px-8 py-3 rounded-full font-medium hover:bg-rose-600 transition"
              >
                Shop Now
              </button>
              <button 
                onClick={() => setCurrentPage('about')}
                className="border border-rose-500 text-rose-500 px-8 py-3 rounded-full font-medium hover:bg-rose-50 transition"
              >
                Our Story
              </button>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="md:w-1/2 mt-12 md:mt-0 flex justify-center"
          >
            <div className="relative w-full max-w-md">
              <div className="bg-rose-100 p-4 rounded-2xl shadow-xl">
                <img 
                  src="https://placehold.co/500x500/png?text=Rose+Collection&bg=ffebee&text_color=e87a90" 
                  alt="Roseila Collection" 
                  className="w-full rounded-xl"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-md w-48">
                <p className="font-semibold text-gray-800">Rose Lipstick Set</p>
                <p className="text-rose-500 font-bold">$59.99</p>
                <button 
                  onClick={() => { setCurrentPage('products'); setSelectedCategory('lipstick'); }}
                  className="mt-2 w-full bg-gray-100 text-gray-700 text-sm py-1 rounded hover:bg-gray-200"
                >
                  View Collection
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-gray-800 mb-4">Shop by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Discover our carefully curated collections for every beauty need</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {categories.map((category) => (
              <motion.div
                key={category.id}
                whileHover={{ y: -5 }}
                className="bg-gray-50 rounded-xl overflow-hidden cursor-pointer"
                onClick={() => { setSelectedCategory(category.id); setCurrentPage('products'); }}
              >
                <div className="p-4 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-3">
                    <img 
                      src={category.image} 
                      alt={category.name} 
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <h3 className="font-medium text-gray-800 text-center">{category.name}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-serif font-bold text-gray-800">Featured Products</h2>
            <button 
              onClick={() => setCurrentPage('products')}
              className="text-rose-500 font-medium hover:text-rose-600"
            >
              View all →
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-gray-800 mb-4">What Our Customers Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Join thousands of satisfied customers who have transformed their beauty routine</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Sarah M.", text: "The Rose Lipstick is my holy grail! The color payoff is incredible and it lasts all day without drying my lips.", rating: 5 },
              { name: "Jessica T.", text: "I've never used a serum that made such a visible difference. My skin looks radiant after just two weeks!", rating: 5 },
              { name: "Amanda L.", text: "The eyeshadow palette is so pigmented and blendable. The rose-themed packaging is absolutely stunning too!", rating: 4 }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl">
                <div className="flex text-rose-400 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => <Star key={i} fill="currentColor" size={20} />)}
                </div>
                <p className="text-gray-600 italic mb-4">"{testimonial.text}"</p>
                <p className="font-medium text-gray-800">- {testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  // Products Page
  const ProductsPage = () => (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Hidden on mobile */}
          <div className="lg:w-1/4 hidden lg:block">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Filters</h3>
              
              <div className="mb-8">
                <h4 className="font-semibold text-gray-700 mb-3">Price Range</h4>
                <div className="flex space-x-2">
                  <input type="number" placeholder="$0" className="w-1/2 px-3 py-2 border border-gray-300 rounded" />
                  <input type="number" placeholder="$100" className="w-1/2 px-3 py-2 border border-gray-300 rounded" />
                </div>
              </div>
              
              <div className="mb-8">
                <h4 className="font-semibold text-gray-700 mb-3">Categories</h4>
                <ul className="space-y-2">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <button
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedCategory === category.id 
                            ? 'bg-rose-100 text-rose-700 font-medium' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {category.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Skin Type</h4>
                <ul className="space-y-2">
                  {['All', 'Oily', 'Dry', 'Combination', 'Sensitive'].map((type) => (
                    <li key={type}>
                      <button className="w-full text-left px-3 py-2 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-800">
                        {type}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">All Products</h1>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                    <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
                  </div>
                  <div className="flex space-x-2">
                    <select className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200">
                      <option>Featured</option>
                      <option>Price: Low to High</option>
                      <option>Price: High to Low</option>
                      <option>Best Selling</option>
                      <option>Customer Rating</option>
                    </select>
                    <button className="lg:hidden bg-gray-100 p-2 rounded-full">
                      <Menu size={20} />
                    </button>
                  </div>
                </div>
              </div>
              
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">No products found matching your search.</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-rose-500 hover:text-rose-600"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Product Card component
  const ProductCard = ({ product }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-64 object-cover"
        />
        <button 
          onClick={() => addToWishlist(product)}
          className={`absolute top-4 right-4 p-2 rounded-full ${
            wishlist.some(item => item.id === product.id) 
              ? 'bg-rose-100 text-rose-500' 
              : 'bg-white text-gray-400'
          }`}
        >
          <Heart size={18} fill={wishlist.some(item => item.id === product.id) ? "currentColor" : "none"} />
        </button>
        <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-full text-sm font-medium text-rose-500">
          ${product.price.toFixed(2)}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={16} 
              className={i < Math.floor(product.rating) ? 'text-rose-400 fill-current' : 'text-gray-300'} 
            />
          ))}
          <span className="text-gray-500 text-sm ml-2">({product.rating})</span>
        </div>
        <h3 
          onClick={() => { setSelectedProduct(product); setCurrentPage('product-detail'); }}
          className="font-semibold text-gray-800 mb-2 cursor-pointer hover:text-rose-500 transition"
        >
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
        <button 
          onClick={() => { setSelectedProduct(product); setCurrentPage('product-detail'); }}
          className="w-full bg-rose-500 text-white py-2 rounded-lg hover:bg-rose-600 transition"
        >
          View Details
        </button>
      </div>
    </motion.div>
  );

  // Product Detail Page
  const ProductDetailPage = () => {
    if (!selectedProduct) return null;

    return (
      <div className="bg-gray-50 py-12">
        
      </div>
    );
  };

  // Cart Page
  const CartPage = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + shipping;
    
    return (
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">Shopping Cart</h1>
          
          {cart.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Looks like you haven't added any products to your cart yet.</p>
              <button 
                onClick={() => setCurrentPage('products')}
                className="bg-rose-500 text-white px-6 py-3 rounded-full font-medium hover:bg-rose-600 transition"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {cart.map(item => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm p-6 mb-4 flex">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-24 h-24 object-cover rounded-lg mr-6"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-semibold text-gray-800">{item.name}</h3>
                        <button 
                          onClick={() => setCart(cart.filter(i => i.id !== item.id))}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                      
                      <p className="text-rose-500 font-bold mt-1">${item.price.toFixed(2)}</p>
                      
                      <div className="flex items-center mt-3">
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
                        <p className="ml-6 font-semibold text-gray-800">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="mt-8 flex flex-col sm:flex-row justify-between">
                  <button 
                    onClick={() => setCurrentPage('products')}
                    className="flex items-center text-gray-600 hover:text-gray-800 mb-4 sm:mb-0"
                  >
                    <ChevronLeft size={18} className="mr-2" /> Continue Shopping
                  </button>
                  <button 
                    onClick={() => setCurrentPage('checkout')}
                    className="bg-rose-500 text-white px-8 py-3 rounded-full font-medium hover:bg-rose-600 transition"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
              
              <div>
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>Calculated at checkout</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between font-bold text-gray-800">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setCurrentPage('checkout')}
                    className="w-full bg-rose-500 text-white py-3 rounded-lg font-medium hover:bg-rose-600 transition mb-4"
                  >
                    Proceed to Checkout
                  </button>
                  
                  <div className="text-center text-gray-500 text-sm">
                    <p>30-day satisfaction guarantee</p>
                    <p>Free shipping on orders over $50</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Checkout Page
  const CheckoutPage = () => {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [clientSecret, setClientSecret] = useState("");

    useEffect(() => {
      if (cart.length > 0) {
        // Create PaymentIntent as soon as the page loads
        fetch("/.netlify/functions/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            cart: cart,
            email: user ? user.email : formData.email
          }),
        })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Network response was not ok");
        })
        .then((data) => setClientSecret(data.clientSecret))
        .catch((err) => {
          console.error("Error:", err);
          setError("Failed to initialize payment. Please try again.");
        });
      }
    }, [cart, user]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setProcessing(true);
      setError(null);

      try {
        // In a real implementation, you'd use the Stripe client here
        // For now, we'll simulate a successful payment
        setTimeout(() => {
          // Save order to Firebase
          saveOrder();
        }, 1000);
      } catch (err) {
        setError(err.message);
        setProcessing(false);
      }
    };

    const saveOrder = async () => {
      if (!user) {
        alert("Please sign in to complete your order");
        setCurrentPage('login');
        return;
      }

      try {
        const orderData = {
          userId: user.id,
          items: cart,
          total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          shipping: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) > 50 ? 0 : 5.99,
          status: 'Processing',
          createdAt: new Date(),
          ...formData
        };

        await addDoc(collection(db, 'orders'), orderData);
        setCart([]);
        setOrderPlaced(true);

        // Show success message
        setTimeout(() => {
          setCurrentPage('home');
          setOrderPlaced(false);
        }, 3000);
      } catch (error) {
        console.error('Error saving order:', error);
        alert('Failed to process order. Please try again.');
      }
    };

    if (cart.length === 0) {
      return (
        <div className="bg-gray-50 py-16 min-h-screen flex items-center">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Please add some products to your cart before checking out.</p>
            <button 
              onClick={() => setCurrentPage('products')}
              className="bg-rose-500 text-white px-8 py-3 rounded-full font-medium hover:bg-rose-600 transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3">
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Shipping Information</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <label className="block text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                  </div>
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
                </form>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Payment Information</h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}
                
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mr-3">
                      <CreditCard size={16} className="text-rose-500" />
                    </div>
                    <span className="font-medium">Card information</span>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-4 py-2 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                      <CreditCard className="absolute left-4 top-2.5 text-gray-400" size={20} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Expiration Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/3">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-gray-600">
                      <span>{item.name} x{item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) > 50 ? 'FREE' : '$5.99'}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>Total</span>
                      <span>${(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + (cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) > 50 ? 0 : 5.99)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                {orderPlaced ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-green-50 p-4 rounded-lg text-center"
                  >
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Order Placed!</h3>
                    <p className="text-gray-600 mb-4">Thank you for your purchase. Your order has been confirmed.</p>
                    <button 
                      onClick={() => setCurrentPage('home')}
                      className="w-full bg-rose-500 text-white py-2 rounded-lg font-medium hover:bg-rose-600 transition"
                    >
                      Continue Shopping
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <button 
                      onClick={handleSubmit}
                      disabled={processing}
                      className={`w-full bg-rose-500 text-white py-3 rounded-lg font-medium hover:bg-rose-600 transition mb-4 ${
                        processing ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      {processing ? 'Processing...' : 'Place Order'}
                    </button>
                    <div className="text-center text-gray-500 text-sm">
                      <p>30-day satisfaction guarantee</p>
                      <p>Free shipping on orders over $50</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // About Page
  const AboutPage = () => (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-800 mb-6">Our Story</h1>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              Roseila was born from a simple belief: that beauty should be as natural as a blooming rose. 
              Founded in 2015 by botanical chemist Dr. Evelyn Rose, our brand combines the ancient wisdom 
              of floral remedies with modern cosmetic science.
            </p>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Every product is meticulously crafted using ethically sourced ingredients, with a focus on 
              sustainability and cruelty-free practices. Our signature rose extracts are harvested at dawn 
              from our own organic gardens, ensuring peak potency and purity.
            </p>
            <button 
              onClick={() => setCurrentPage('products')}
              className="bg-rose-500 text-white px-8 py-3 rounded-full font-medium hover:bg-rose-600 transition"
            >
              Discover Our Products
            </button>
          </div>
          <div className="relative">
            <div className="bg-rose-100 p-4 rounded-2xl shadow-xl">
              <img 
                src="https://placehold.co/600x600/png?text=Our+Garden&bg=ffebee&text_color=e87a90" 
                alt="Roseila Garden" 
                className="w-full rounded-xl"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-md max-w-xs">
              <p className="font-serif italic text-gray-700 mb-3">"True beauty blossoms from within, nurtured by nature's wisdom."</p>
              <p className="font-medium text-gray-800">- Dr. Evelyn Rose, Founder</p>
            </div>
          </div>
        </div>
        
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Heart size={32} className="text-rose-500" />, title: "Cruelty-Free", desc: "We never test on animals and are Leaping Bunny certified" }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-xl shadow-sm text-center"
              >
                <div className="flex justify-center mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Contact Page
  const ContactPage = () => (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-800 mb-4">Get in Touch</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Have questions about our products? Need help with an order? Our beauty advisors are here to help.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a message</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">First Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Last Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Message</label>
                  <textarea 
                    rows="5" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-rose-500 text-white py-3 rounded-lg font-medium hover:bg-rose-600 transition"
                >
                  Send Message
                </button>
              </form>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {[
                  { q: "Do you offer international shipping?", a: "Yes, we ship to over 50 countries worldwide. Shipping rates vary by location." },
                  { q: "Are your products vegan?", a: "All Roseila products are 100% vegan and cruelty-free." },
                  { q: "What is your return policy?", a: "We offer a 30-day satisfaction guarantee on all unopened products." }
                ].map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <ChevronDown size={16} className="mr-2 text-rose-500" />
                      {faq.q}
                    </h3>
                    <p className="text-gray-600">{faq.a}</p>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-rose-500 font-medium hover:text-rose-600">
                View all FAQs →
              </button>
            </div>
          </div>
          
          <div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="h-64 bg-gray-200 flex items-center justify-center">
                <MapPin size={48} className="text-gray-400" />
                <p className="ml-4 text-gray-600">Map would appear here</p>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Visit Our Flagship Store</h2>
                <p className="text-gray-600 mb-2">123 Rose Lane, Beauty City, BC 12345</p>
                <p className="text-gray-600 mb-4">Open Monday-Saturday: 9am-8pm</p>
                <button className="text-rose-500 font-medium hover:text-rose-600">
                  Get Directions →
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Customer Support</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Phone size={20} className="mt-1 mr-3 text-rose-500" />
                  <div>
                    <h3 className="font-medium text-gray-800">Phone Support</h3>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                    <p className="text-gray-500 text-sm">Mon-Fri 9am-6pm EST</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail size={20} className="mt-1 mr-3 text-rose-500" />
                  <div>
                    <h3 className="font-medium text-gray-800">Email Support</h3>
                    <p className="text-gray-600">support@roseila.com</p>
                    <p className="text-gray-500 text-sm">Response within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Order History Page
const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('userId', '==', user.id));
        const querySnapshot = await getDocs(q);

        const ordersList = [];
        querySnapshot.forEach(doc => {
          ordersList.push({ id: doc.id, ...doc.data() });
        });

        setOrders(ordersList.sort((a, b) => b.createdAt - a.createdAt));
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="bg-gray-50 py-16 min-h-screen flex items-center">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-8">You need to be signed in to view your order history.</p>
          <button 
            onClick={() => setCurrentPage('login')}
            className="bg-rose-500 text-white px-8 py-3 rounded-full font-medium hover:bg-rose-600 transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Order History</h1>

        {ordersLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">When you place orders, they'll appear here.</p>
            <button 
              onClick={() => setCurrentPage('products')}
              className="bg-rose-500 text-white px-6 py-3 rounded-full font-medium hover:bg-rose-600 transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.total.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.items.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  };
  


  // Login Modal Component
const LoginModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-8 max-w-md w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sign In</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        handleLogin(email, password);
      }}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Password</label>
          <input
            type="password"
            name="password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>
        
        <button 
          type="submit"
          className="w-full bg-rose-500 text-white py-3 rounded-lg font-medium hover:bg-rose-600 transition"
        >
          Sign In
        </button>
      </form>
      
      <div className="mt-6">
        <button 
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center border border-gray-300 rounded-lg py-2 hover:bg-gray-50"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google logo" 
            className="w-5 h-5 mr-3" 
          />
          Sign in with Google
        </button>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button 
            onClick={() => setCurrentPage('register')}
            className="text-rose-500 hover:text-rose-600 font-medium"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  </div>
);

// Register Modal Component
const RegisterModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-8 max-w-md w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Create Account</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const email = e.target.email.value;
        const password = e.target.password.value;
        handleRegister(email, password, name);
      }}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Password</label>
          <input
            type="password"
            name="password"
            required
            minLength="6"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>
        
        <button 
          type="submit"
          className="w-full bg-rose-500 text-white py-3 rounded-lg font-medium hover:bg-rose-600 transition"
        >
          Create Account
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button 
            onClick={() => setCurrentPage('login')}
            className="text-rose-500 hover:text-rose-600 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  </div>
);

// User Menu Component
const UserMenu = () => (
  <div className="relative">
    <button className="flex items-center space-x-2 text-gray-700 hover:text-rose-500">
      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
        <span className="font-medium text-rose-500">
          {user.displayName ? user.displayName[0] : 'U'}
        </span>
      </div>
      <ChevronDown size={16} />
    </button>
    
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100">
      <button 
        onClick={() => setCurrentPage('order-history')}
        className="w-full text-left px-4 py-2 hover:bg-gray-50"
      >
        Order History
      </button>
      <button 
        onClick={handleLogout}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-500"
      >
        Sign Out
      </button>
    </div>
  </div>
);


  // Render the appropriate page
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <AnimatePresence mode="wait">
        <motion.main
          key={currentPage}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="flex-grow"
        >
          {currentPage === 'home' && <HomePage />}
          {currentPage === 'products' && <ProductsPage />}
          {currentPage === 'product-detail' && <ProductDetailPage />}
          {currentPage === 'cart' && <CartPage />}
          {currentPage === 'checkout' && <CheckoutPage />}
          {currentPage === 'about' && <AboutPage />}
          {currentPage === 'contact' && <ContactPage />}
          {currentPage === 'order-history' && <OrderHistoryPage />}
          {currentPage === 'login' && <LoginModal onClose={() => setCurrentPage('home')} />}
          {currentPage === 'register' && <RegisterModal onClose={() => setCurrentPage('home')} />}
        </motion.main>
      </AnimatePresence>
      
      <Footer />
    </div>
  );
};

export default App;