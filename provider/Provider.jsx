import { useState, createContext, useEffect, useCallback } from 'react';
import { Snackbar } from 'react-native-paper';
import useAxios from '../hooks/useAxios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ServicesProvider = createContext(null);

const AuthProvider = ({ children }) => {
  const { axiosPublic, axiosSecure } = useAxios();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'default' });
  const [user, setUser] = useState(null);
  const [products,setProducts] = useState([]);
  const [officers,setOfficers] = useState([]);
  const [currentOfficer,setCurrentOfficer] = useState({});
  const [stores, setStores] = useState([]);
  const [myStores, setMyStores] = useState([]);
  const [currentStore,setCurrentStore] = useState({})
  const [orders, setOrders] = useState([]);
  const [draftOrder, setDraftOrder] = useState(null);
  
  
  
  const showMessage = (message, type = 'default') => {
    setSnackbar({ visible: true, message, type });
  };
  
  const getErrorMessage = (error) => {
    if (error.response) {
      // Handle specific error messages from server
      if (error.response.data && error.response.data.message) {
        return error.response.data.message;
      }
      // Default messages based on status code
      switch (error.response.status) {
        case 401:
          return 'Invalid credentials';
        case 403:
          return 'Unauthorized access';
        case 404:
          return 'Resource not found';
        case 500:
          return 'Server error';
        default:
          return 'An error occurred';
      }
    } else if (error.request) {
      return 'No response from server';
    } else {
      return error.message || 'An unknown error occurred';
    }
  };

  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setLoadingAuth(false);
        return;
      }

      const response = await axiosSecure.get('/current-user');
      if (response.data.success && response.data.user) {
        // Check if user is active
        if (response.data.user.status !== 'active') {
          showMessage('Your account is not active', 'error');
          await handleLogout();
          return;
        }
        setUser(response.data.user);
      } else {
       // await handleLogout();
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      showMessage(getErrorMessage(error), 'error');
      await handleLogout();
    } finally {
      setLoadingAuth(false);
    }
  }, [axiosSecure]);

  const handleLogin = async (values) => {
  setLoading(true);
  try {
    // Determine if we're using email or phone
    const credentials = values.email 
      ? { email: values.email, password: values.password }
      : { phone: values.phone, password: values.password };

    const res = await axiosPublic.post('/login', credentials);
    
    if (res.data.token) {
      await AsyncStorage.setItem('authToken', res.data.token);
      const userResponse = await axiosSecure.get('/current-user');
      
      // Verify user is active after login
      if (userResponse.data.user.status !== 'active') {
        showMessage('Your account is not active', 'error');
        await handleLogout();
        return;
      }

      setUser(userResponse.data.user);
      showMessage('Login successful!', 'success');
      router.replace('/');
    } else {
      showMessage('Login failed: No token received', 'error');
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
  } finally {
    setLoading(false);
  }
};

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      await axiosPublic.post('/register', values);
      showMessage('Registration successful! Please login', 'success');
      router.replace('/signin');
    } catch (error) {
      showMessage(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      setUser(null);
      router.replace('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      showMessage('Failed to logout', 'error');
    }
  };

  const isAuthenticated = () => {
    return !!user && user.status === 'active';
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const currentRoute = router.pathname || '';
      
      if (!token && !['/signin', '/register'].includes(currentRoute)) {
        router.replace('/signin');
      } else if (token) {
        await fetchCurrentUser();
        
        // If user is not active, redirect to login
        if (user && user.status !== 'active' && !['/signin', '/register'].includes(currentRoute)) {
          router.replace('/signin');
        }
      }
    };

    checkAuth();
  }, [router.pathname]);
  
  
  
  // -----------------&&Users-------------------
  
  const handleGetAllUsers = async (filters = {}) => {
  setLoading(true);
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const res = await axiosSecure.get(`/users?${queryParams.toString()}`);
    if (res.data.success) {
      return {
        success: true,
        users: res.data.users,
        count: res.data.count
      };
    }
    throw new Error('Failed to fetch users');
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return { success: false, users: [] };
  } finally {
    setLoading(false);
  }
};

const handleUpdateUserStatus = async (userId, status) => {
  setLoading(true);
  try {
    const res = await axiosSecure.patch(`/users/${userId}/status`, { status });
    if (res.data.success) {
      showMessage(`User status updated to ${status}`, 'success');
      return { success: true, user: res.data.user };
    }
    throw new Error(res.data.message || 'Status update failed');
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return { success: false };
  } finally {
    setLoading(false);
  }
};
  
//__________________________Products cruds_________________________________
  // Product CRUD Handlers

const handleCreateProduct = async (values) => {
  setLoading(true);
  try {
    const res = await axiosSecure.post('/products', values);
    if (res.data.success) {
      showMessage('Product created successfully!', 'success');
      router.push('/product-stock');
    } else {
      showMessage('Failed to create product', 'error');
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
  } finally {
    setLoading(false);
  }
};

const handleUpdateProduct = async (productId, values) => {
  setLoading(true);
  try {
    const res = await axiosSecure.patch(`/products/${productId}`, values);
    
    if (res.data.success) {
      showMessage('Product updated successfully!', 'success');
      return {
        success: true,
        product: res.data.product,
        message: 'Product updated successfully'
      };
    } else {
      showMessage(res.data.message || 'Failed to update product', 'error');
      return {
        success: false,
        message: res.data.message || 'Failed to update product'
      };
    }
  } catch (error) {
    const errorMsg = getErrorMessage(error);
    showMessage(errorMsg, 'error');
    return {
      success: false,
      message: errorMsg
    };
  } finally {
    setLoading(false);
  }
};

// Product Stock Update Handler
const handleUpdateProductStock = async (productId, quantity) => {
  setLoading(true);
  try {
    const res = await axiosSecure.patch(`/products/${productId}/stock`, { quantity });
    
    if (res.data.success) {
      showMessage(res.data.message, 'success');
      
      // Update local products state to reflect the change
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === productId 
            ? { ...product, stock: res.data.product.newStock } 
            : product
        )
      );
      
      return {
        success: true,
        newStock: res.data.product.newStock,
        previousStock: res.data.product.previousStock
      };
    } else {
      showMessage(res.data.message || 'Failed to update stock', 'error');
      return { success: false };
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return { success: false };
  } finally {
    setLoading(false);
  }
};

const handleDeleteProduct = async (productId) => {
  setLoading(true);
  try {
    const res = await axiosSecure.delete(`/products/${productId}`);
    if (res.data.success) {
      showMessage('Product deleted successfully!', 'success');
      router.push('/products');
    } else {
      showMessage('Failed to delete product', 'error');
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
  } finally {
    setLoading(false);
  }
};

const handleGetProductById = async (productId) => {
  setLoading(true);
  try {
    const res = await axiosSecure.get(`/products/${productId}`);
    if (res.data.success) {
      return res.data.product;
    } else {
      showMessage('Failed to fetch product details', 'error');
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
  } finally {
    setLoading(false);
  }
};

const handleGetAllProducts = async (searchQuery = "", sortOption = "") => {
  setLoading(true);
  try {
    const queryParams = new URLSearchParams();
    
    if (searchQuery) {
      queryParams.append("search", searchQuery);
    }
    if (sortOption) {
      queryParams.append("sort", sortOption);
    }

    const res = await axiosSecure.get(`/products?${queryParams.toString()}`);
    
    if (res.data.success) {
      setProducts(res.data.products);
    } else {
      showMessage("Failed to fetch products", "error");
    }
  } catch (error) {
    showMessage(getErrorMessage(error), "error");
  } finally {
    setLoading(false);
  }
};


// __________________________Officers CRUD Handlers_________________________________

const handleGetAllOfficers = async (searchQuery = "", areaFilter = "all") => {
  setLoading(true);
  try {
    const queryParams = new URLSearchParams();
    
    if (searchQuery) {
      queryParams.append("search", searchQuery);
    }
    if (areaFilter && areaFilter !== "all") {
      queryParams.append("area", areaFilter);
    }

    const res = await axiosSecure.get(`/officers?${queryParams.toString()}`);
    
    if (res.data.success) {
      setOfficers(res.data.officers);
    } else {
      showMessage("Failed to fetch officers", "error");
      return [];
    }
  } catch (error) {
    showMessage(getErrorMessage(error), "error");
    return [];
  } finally {
    setLoading(false);
  }
};

const handleGetOfficerById = async (officerId) => {
 
  setLoading(true);
  try {
    const res = await axiosSecure.get(`/officers/${officerId}`);
    if (res.data.success) {
      setCurrentOfficer(res.data.officer)
      
    } else {
      showMessage('Failed to fetch officer details', 'error');
      return { success: false };
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return { success: false };
  } finally {
    setLoading(false);
  }
};

const handleCreateOfficer = async (values) => {
  setLoading(true);
  try {
    const res = await axiosSecure.post('/register', {
      ...values,
      role: 'officer'
    });
    if (res.data.success) {
      showMessage('Officer created successfully!', 'success');
      return true;
    } else {
      showMessage('Failed to create officer', 'error');
      return false;
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return false;
  } finally {
    setLoading(false);
  }
};

const handleUpdateOfficer = async (officerId, values) => {
  setLoading(true);
  try {
    const res = await axiosSecure.patch(`/officers/${officerId}`, values);
    if (res.data.success) {
      showMessage('Officer updated successfully!', 'success');
      return true;
    } else {
      showMessage('Failed to update officer', 'error');
      return false;
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return false;
  } finally {
    setLoading(false);
  }
};

const handleDeleteOfficer = async (officerId) => {
  setLoading(true);
  try {
    const res = await axiosSecure.delete(`/officers/${officerId}`);
    if (res.data.success) {
      showMessage('Officer deleted successfully!', 'success');
      return true;
    } else {
      showMessage('Failed to delete officer', 'error');
      return false;
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return false;
  } finally {
    setLoading(false);
  }
};

const handleGetOfficersByArea = async () => {
  setLoading(true);
  try {
    const res = await axiosSecure.get('/officers-by-area');
    if (res.data.success) {
      return res.data.officersByArea;
    } else {
      showMessage('Failed to fetch officers by area', 'error');
      return [];
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return [];
  } finally {
    setLoading(false);
  }
};


// __________________________Stores CRUD Handlers_________________________________

const handleCreateStore = async (values) => {
  setLoading(true);
  try {
    const storeData = {
      storeName: values.storeName,
      proprietorName: values.proprietorName,
      address: values.address,
      contactNumber: values.contactNumber,
      area: values.area,
      storeCode: values.storeCode,
      officers: {
        marketingOfficer: values.marketingOfficerId
      },
      createdBy: values.createdById
    };
    
    const storeRes = await axiosSecure.post('/stores', storeData);
    if (storeRes.data.success) {
      showMessage('Store created successfully with Marketing Officer!', 'success');
      return storeRes.data.store;
    } else {
      showMessage('Failed to create store', 'error');
      return null;
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return null;
  } finally {
    setLoading(false);
  }
};

const handleGetAllStores = async (searchQuery = "", areaFilter = "") => {
  setLoading(true);
  try {
    const queryParams = new URLSearchParams();

    if (searchQuery) {
      queryParams.append("search", searchQuery);
    }
    if (areaFilter && areaFilter !== "all") {
      queryParams.append("area", areaFilter);
    }

    // Only admin can access all stores
    const res = await axiosSecure.get(`/stores?${queryParams.toString()}`);

    if (res.data.success) {
      setStores(res.data.stores);
      return res.data.stores;
    } else {
      showMessage("Failed to fetch stores", "error");
      return [];
    }
  } catch (error) {
    showMessage(getErrorMessage(error), "error");
    return [];
  } finally {
    setLoading(false);
  }
};


const handleGetStoreById = async (storeId) => {
  setLoading(true);
  try {
    const res = await axiosSecure.get(`/get-stores/${storeId}`);
    if (res.data.success) {
      setCurrentStore(res.data.store)
      return res.data.store;
    } else {
      showMessage('Failed to fetch store details', 'error');
      return null;
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return null;
  } finally {
    setLoading(false);
  }
};


const handleUpdateStore = async (storeId, values) => {
  setLoading(true);
  try {
    const res = await axiosSecure.patch(`/stores/${storeId}`, values);
    if (res.data.success) {
      showMessage('Store updated successfully!', 'success');
      return res.data.store;
    } else {
      showMessage('Failed to update store', 'error');
      return null;
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return null;
  } finally {
    setLoading(false);
  }
};

const handleDeleteStore = async (storeId) => {
  setLoading(true);
  try {
    const res = await axiosSecure.delete(`/stores/${storeId}`);
    if (res.data.success) {
      showMessage('Store deleted successfully!', 'success');
      return true;
    } else {
      showMessage('Failed to delete store', 'error');
      return false;
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return false;
  } finally {
    setLoading(false);
  }
};



const handleAddStorePayment = async (storeId, paymentData) => {
  setLoading(true);
  try {
    const res = await axiosSecure.post(`/stores/${storeId}/payments`, paymentData);
    if (res.data.success) {
      showMessage('Payment added successfully!', 'success');
      return res.data.payment;
    } else {
      showMessage('Failed to add payment', 'error');
      return null;
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return null;
  } finally {
    setLoading(false);
  }
};

const handleAddStoreDue = async (storeId, dueData) => {
  setLoading(true);
  try {
    const res = await axiosSecure.post(`/stores/${storeId}/dues`, dueData);
    if (res.data.success) {
      showMessage('Due added successfully!', 'success');
      return res.data.due;
    } else {
      showMessage('Failed to add due', 'error');
      return null;
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return null;
  } finally {
    setLoading(false);
  }
};



const handleGetMyStores = async (searchQuery = "", areaFilter = "") => {
  
  setLoading(true);
  try {
    const queryParams = new URLSearchParams();
    if (searchQuery) {
      queryParams.append("search", searchQuery);
    }
    if (areaFilter && areaFilter !== "all") {
      queryParams.append("area", areaFilter);
    }

    const res = await axiosSecure.get(`/stores/my-stores?${queryParams.toString()}`);

    if (res.data.success) {
      setMyStores(res.data.stores);
      return res.data.stores;
    } else {
      showMessage("Failed to fetch your stores", "error");
      return [];
    }
  } catch (error) {
    showMessage(getErrorMessage(error), "error");
    return [];
  } finally {
    setLoading(false);
  }
};



  // Order Handlers (updated)
  const calculateOrderAmounts = (order) => {
    if (!order?.products) return order;

    const productsWithTotals = order.products.map(product => {
      const discountedPrice = product.price * (1 - (product.discountPercentage || 0) / 100);
      return {
        ...product,
        totalAmount: product.price * product.quantity,
        finalAmount: discountedPrice * product.quantity,
        discountAmount: (product.price - discountedPrice) * product.quantity
      };
    });

    const subtotal = productsWithTotals.reduce((sum, p) => sum + p.totalAmount, 0);
    const total = productsWithTotals.reduce((sum, p) => sum + p.finalAmount, 0);
    const totalDiscount = subtotal - total;

    return {
      ...order,
      products: productsWithTotals,
      subtotal,
      total,
      totalDiscount,
      paymentMethod: order.paymentMethod || 'cash'
    };
  };

  const handleGetOrCreateDraftOrder = async (storeId) => {
    if (!storeId) {
      showMessage('Store ID is required', 'error');
      return { success: false };
    }

    setLoading(true);
    try {
      const res = await axiosSecure.get(`/api/orders/draft?storeId=${storeId}`);
      
      let order = res.data.success ? res.data.order : null;
      
      if (!order) {
        const createRes = await axiosSecure.post('/api/orders/draft', {
          storeId,
          status: 'draft',
          paymentMethod: 'cash',
          products: []
        });
        
        if (createRes.data.success) {
          order = createRes.data.order;
        }
      }

      if (order) {
        const enhancedOrder = calculateOrderAmounts(order);
        setDraftOrder(enhancedOrder);
        return { success: true, order: enhancedOrder };
      }
      
      throw new Error('Failed to get or create draft order');
    } catch (error) {
      showMessage(getErrorMessage(error), 'error');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleAddToDraftOrder = async (product, quantity, discount = 0, bonus = 0) => {
    if (!draftOrder) {
      showMessage('No draft order exists', 'error');
      return { success: false };
    }

    setLoading(true);
    try {
      const res = await axiosSecure.patch(`/api/orders/${draftOrder._id}`, {
        product: {
          id: product._id,
          name: product.productName,
          price: product.price,
          packSize: product.packSize,
          unit: product.unit
        },
        quantity,
        discountPercentage: discount,
        bonusQuantity: bonus
      });

      if (res.data.success) {
        const updatedOrder = calculateOrderAmounts(res.data.order);
        setDraftOrder(updatedOrder);
        return { success: true, order: updatedOrder };
      }
      
      throw new Error('Failed to update order');
    } catch (error) {
      showMessage(getErrorMessage(error), 'error');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDraftPaymentMethod = async (method) => {
    if (!draftOrder) {
      showMessage('No draft order exists', 'error');
      return { success: false };
    }

    setLoading(true);
    try {
      const res = await axiosSecure.patch(`/api/orders/${draftOrder._id}/payment`, {
        paymentMethod: method
      });

      if (res.data.success) {
        const updatedOrder = {
          ...draftOrder,
          paymentMethod: method
        };
        setDraftOrder(updatedOrder);
        return { success: true, order: updatedOrder };
      }
      
      throw new Error('Failed to update payment method');
    } catch (error) {
      showMessage(getErrorMessage(error), 'error');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDraftOrder = async () => {
    if (!draftOrder) {
      showMessage('No draft order to submit', 'error');
      return { success: false };
    }

    setLoading(true);
    try {
      const res = await axiosSecure.post(`/api/orders/${draftOrder._id}/submit`);

      if (res.data.success) {
        showMessage('Order submitted successfully!', 'success');
        setDraftOrder(null);
        await handleGetAllOrders();
        return { success: true, order: res.data.order };
      }
      
      throw new Error('Failed to submit order');
    } catch (error) {
      showMessage(getErrorMessage(error), 'error');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleGetAllOrders = async (filters = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const res = await axiosSecure.get(`/api/orders?${queryParams.toString()}`);
      if (res.data.success) {
        
        const ordersWithTotals = res.data.orders.map(calculateOrderAmounts);
        setOrders(ordersWithTotals);
      
        return { 
          success: true, 
          orders: ordersWithTotals,
          pagination: res.data.pagination
        };
      }
      
      throw new Error('Failed to fetch orders');
    } catch (error) {
      showMessage(getErrorMessage(error), 'error');
      return { success: false, orders: [] };
    } finally {
      setLoading(false);
    }
  };

  
  
  // Order Handlers
const handleGetOrderById = async (orderId) => {
  setLoading(true);
  try {
    const res = await axiosSecure.get(`/api/orders/${orderId}`);
    if (res.data.success) {
      // Calculate amounts including discounts and bonuses
      const order = res.data.order;
      const enhancedOrder = {
        ...order,
        products: order.products.map(product => ({
          ...product,
          totalAmount: product.price * product.quantity,
          finalAmount: (product.price * (1 - (product.discountPercentage || 0) / 100)) * product.quantity,
          bonusQuantity: product.bonusQuantity || 0
        })),
        orderTotal: order.products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
        orderFinalTotal: order.products.reduce(
          (sum, p) => sum + ((p.price * (1 - (p.discountPercentage || 0) / 100)) * p.quantity, 0
        ))
      };
      return { success: true, order: enhancedOrder };
    } else {
      showMessage('Failed to fetch order', 'error');
      return { success: false };
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return { success: false };
  } finally {
    setLoading(false);
  }
};

const handleApproveOrder = async (orderId) => {
  setLoading(true);
  try {
    const res = await axiosSecure.patch(`/api/orders/${orderId}/approve`);
    if (res.data.success) {
      showMessage('Order approved successfully!', 'success');
      // Update local orders state
      setOrders(prev => prev.map(o => 
        o._id === orderId ? { ...o, status: 'approved' } : o
      ));
      return { success: true };
    }
    throw new Error(res.data.message || 'Approval failed');
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return { success: false };
  } finally {
    setLoading(false);
  }
};

const handleRejectOrder = async (orderId, reason) => {
  setLoading(true);
  try {
    const res = await axiosSecure.patch(`/api/orders/${orderId}/reject`, { reason });
    if (res.data.success) {
      showMessage('Order rejected', 'success');
      // Update local orders state
      setOrders(prev => prev.map(o => 
        o._id === orderId ? { ...o, status: 'rejected' } : o
      ));
      return { success: true };
    }
    throw new Error(res.data.message || 'Rejection failed');
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return { success: false };
  } finally {
    setLoading(false);
  }
};

const handleUpdateOrderStatus = async (orderId, status) => {
  setLoading(true);
  try {
    const res = await axiosSecure.patch(`/api/orders/${orderId}/status`, { status });
    if (res.data.success) {
      showMessage(`Order status updated to ${status}`, 'success');
      // Update local orders state
      setOrders(prev => prev.map(o => 
        o._id === orderId ? { ...o, status } : o
      ));
      return { success: true };
    }
    throw new Error(res.data.message || 'Status update failed');
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return { success: false };
  } finally {
    setLoading(false);
  }
};

const handleGetOrderHistory = async (orderId) => {
  setLoading(true);
  try {
    const res = await axiosSecure.get(`/api/orders/${orderId}/history`);
    if (res.data.success) {
      return { 
        success: true, 
        history: res.data.history 
      };
    }
    throw new Error('Failed to fetch history');
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
    return { success: false };
  } finally {
    setLoading(false);
  }
};

useEffect(()=>{
  handleGetAllProducts();
  handleGetAllOfficers();
  handleGetAllStores();
  handleGetMyStores();
  handleGetAllOrders();
  handleGetOfficerById(user?._id);
},[]);



  const value = {
    loading, 
    loadingAuth,
    user, 
    isAuthenticated, 
    handleLogin, 
    handleRegister, 
    handleLogout,
    showMessage,
    fetchCurrentUser,
    handleCreateProduct,
    handleGetAllProducts,
    products,
    handleGetAllOfficers,
    officers,
     // Store handlers
    handleCreateStore,
    handleGetAllStores,
    handleGetStoreById,
    handleUpdateStore,
    handleDeleteStore,
    handleAddStorePayment,
    handleAddStoreDue,
    stores,
    handleGetMyStores,
    myStores,
    currentStore,
    handleUpdateProductStock,
    handleUpdateProduct,
        // Order Handlers
    handleGetOrCreateDraftOrder,
    handleAddToDraftOrder,
    handleUpdateDraftPaymentMethod,
    handleSubmitDraftOrder,
    handleGetAllOrders,
    orders,
    handleGetOrderById,
    handleApproveOrder,
    handleRejectOrder,
    handleUpdateOrderStatus,
    handleGetOrderHistory,
    handleGetOfficerById,
    currentOfficer,
    
    handleGetAllUsers,
    handleUpdateUserStatus
  };

  return (
    <ServicesProvider.Provider value={value}>
      {children}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={{
          backgroundColor: snackbar.type === 'error' ? '#f44336' :
            snackbar.type === 'success' ? '#4caf50' : '#2196f3'
        }}
      >
        {snackbar.message}
      </Snackbar>
    </ServicesProvider.Provider>
  );
};

export default AuthProvider;