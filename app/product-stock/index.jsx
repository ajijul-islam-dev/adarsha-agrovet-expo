import React, { useState, useRef, useContext, useEffect } from "react";
import { View, FlatList, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Card, Text, Button, Menu, PaperProvider, Divider, useTheme, Badge } from "react-native-paper";
import { ServicesProvider } from "../../provider/Provider.jsx";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import useAxios from '../../hooks/useAxios.js';

const ProductStockScreen = () => {
  const theme = useTheme();
  const { storeId, name } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortVisible, setSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState("price");
  const menuAnchorRef = useRef(null);

  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [draftModalVisible, setDraftModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [bonusQuantity, setBonusQuantity] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [editedProduct, setEditedProduct] = useState(null);
  const [updatingStock, setUpdatingStock] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [draftOrder, setDraftOrder] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);
  
  const {axiosSecure} = useAxios();
  const { 
    products, 
    loading, 
    handleGetAllProducts, 
    handleUpdateProductStock,
    handleUpdateProduct,
    showMessage,
    handleDeleteOrder,
    user
  } = useContext(ServicesProvider);

  useEffect(() => {
    handleGetAllProducts(searchQuery, sortOption);
    checkForDraftOrder();
  }, [searchQuery, sortOption]);

  const checkForDraftOrder = async () => {
    if (!storeId) return;
    try {
      const response = await axiosSecure.get('/api/orders/draft', {
        params: { storeId }
      });
      if (response.data.success) {
        setDraftOrder(response.data.order);
        setPaymentMethod(response.data.order?.paymentMethod || 'cash');
      } else {
        setDraftOrder(null);
      }
    } catch (error) {
      console.log('No draft order found or error:', error);
      setDraftOrder(null);
    }
  };

  const openOrderModal = async (product) => {
    try {
      setOrderQuantity(1);
      setDiscountPercentage(0);
      setBonusQuantity(0);
      
      if (draftOrder) {
        const existingProduct = draftOrder.products.find(
          p => p.product._id === product._id || p.product === product._id
        );
        
        if (existingProduct) {
          setOrderQuantity(existingProduct.quantity);
          setDiscountPercentage(existingProduct.discountPercentage);
          setBonusQuantity(existingProduct.bonusQuantity);
        }
        if (draftOrder.paymentMethod) {
          setPaymentMethod(draftOrder.paymentMethod);
        }
      }
      
      setSelectedProduct(product);
      setOrderModalVisible(true);
    } catch (error) {
      showMessage('Failed to load order data', 'error');
      console.error('Error loading order:', error);
    }
  };

  const openUpdateModal = (product) => {
    setSelectedProduct(product);
    setOrderQuantity(product.stock);
    setUpdateModalVisible(true);
  };

  const openEditModal = (product) => {
    setEditedProduct({...product});
    setEditModalVisible(true);
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    const discountedPrice = selectedProduct.price * (1 - discountPercentage / 100);
    return (discountedPrice * orderQuantity).toFixed(2);
  };

  const calculateDraftTotal = () => {
    if (!draftOrder?.products) return 0;
    return draftOrder.products.reduce((total, item) => {
      const discountedPrice = item.price * (1 - (item.discountPercentage || 0) / 100);
      return total + (discountedPrice * item.quantity);
    }, 0).toFixed(2);
  };

  const handleStockUpdate = async () => {
    if (!selectedProduct) return;
    
    setUpdatingStock(true);
    try {
      const quantityChange = orderQuantity - selectedProduct.stock;
      const result = await handleUpdateProductStock(
        selectedProduct._id, 
        quantityChange
      );

      if (result.success) {
        showMessage(`Stock updated to ${result.newStock}`, 'success');
        setUpdateModalVisible(false);
        handleGetAllProducts(searchQuery, sortOption);
      }
    } catch (error) {
      showMessage('Failed to update stock', 'error');
      console.error("Stock update error:", error);
    } finally {
      setUpdatingStock(false);
    }
  };

  const handleProductUpdate = async () => {
    if (!editedProduct) return;
    
    setUpdatingProduct(true);
    try {
      const result = await handleUpdateProduct(editedProduct._id, {
        productName: editedProduct.productName,
        price: editedProduct.price,
        packSize: editedProduct.packSize,
        unit: editedProduct.unit,
        stock: editedProduct.stock
      });
      
      if (result.success) {
        showMessage('Product updated successfully', 'success');
        setEditModalVisible(false);
        handleGetAllProducts(searchQuery, sortOption);
      }
    } catch (error) {
      showMessage('Failed to update product', 'error');
      console.error("Product update error:", error);
    } finally {
      setUpdatingProduct(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedProduct || !storeId) return;
    
    setCreatingOrder(true);
    try {
      const orderData = {
        storeId,
        product: {
          id: selectedProduct._id,
          name: selectedProduct.productName,
          price: selectedProduct.price,
          packSize: selectedProduct.packSize,
          unit: selectedProduct.unit
        },
        quantity: orderQuantity,
        bonusQuantity,
        discountPercentage,
        paymentMethod,
        notes: `Order for ${name}`
      };

      const endpoint = draftOrder 
        ? `/api/orders/${draftOrder._id}`
        : '/api/orders/draft';
      const method = draftOrder ? 'patch' : 'post';

      const response = await axiosSecure[method](endpoint, orderData);
      
      if (response.data.success) {
        showMessage(draftOrder ? 'Draft updated' : 'Order saved as draft', 'success');
        setDraftOrder(response.data.order);
        setOrderModalVisible(false);
      }
    } catch (error) {
      console.error('Order error:', error);
      showMessage('Failed to save order', 'error');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleSubmitDraft = async () => {
    if (!draftOrder) return;
    
    setSubmittingOrder(true);
    try {
      const response = await axiosSecure.post(
        `/api/orders/${draftOrder._id}/submit`,
        { paymentMethod }
      );
      
      if (response.data.success) {
        handleGetAllProducts(searchQuery, sortOption);
        showMessage('Order submitted successfully!', 'success');
        setDraftOrder(null);
        setDraftModalVisible(false);
      }
    } catch (error) {
      showMessage('Failed to submit order', 'error');
      console.error('Submit error:', error);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!draftOrder) return;
    
    setDeletingOrder(true);
    try {
      const result = await handleDeleteOrder(draftOrder._id);
      if (result.success) {
        setDraftOrder(null);
        setDraftModalVisible(false);
        showMessage('Draft order cancelled', 'success');
      }
    } catch (error) {
      console.error('Delete draft error:', error);
      showMessage('Failed to cancel draft order', 'error');
    } finally {
      setDeletingOrder(false);
    }
  };

  const renderItem = ({ item }) => (
    <Card style={[styles.productCard, { borderRadius: 8 }]} mode="elevated">
      <Card.Title
        title={item.productName}
        titleStyle={styles.title}
        titleVariant="titleMedium"
        right={() => (
          <View style={[styles.stockBadge, { backgroundColor: theme.colors.surfaceVariant, borderRadius: 8 }]}>
            <Text style={[styles.stockBadgeText, { color: theme.colors.primary }]}>
              {item.stock} pcs
            </Text>
          </View>
        )}
      />
      <Card.Content style={styles.cardContent}>
        <View style={styles.productInfo}>
          <Text style={[styles.price, { color: theme.colors.primary }]}>BDT {item.price}</Text>
          <Text style={styles.packSize} numberOfLines={1} ellipsizeMode="tail">
            {item.packSize} {item.unit}
          </Text>
        </View>
        <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 8 }}>
          {storeId && (
            <TouchableOpacity
              onPress={() => openOrderModal(item)}
              style={[styles.iconButton, { backgroundColor: theme.colors.primary, borderRadius: 8 }]}
            >
              <Icon name="cart-plus" size={20} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => openUpdateModal(item)}
            style={[styles.iconButton, { borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 8 }]}
          >
            <Icon name="pencil" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <PaperProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.headerText}>
              {storeId ? `Order for ${name}` : 'Product Stock'}
            </Text>
            {storeId && draftOrder && (
              <Badge style={[styles.draftBadge, { backgroundColor: theme.colors.primary }]}>
                {draftOrder.products.length}
              </Badge>
            )}
          </View>
          
          {storeId && draftOrder && (
            <Button 
              mode="contained-tonal"
              onPress={() => setDraftModalVisible(true)}
              compact
              icon="file-document-outline"
              style={[styles.draftButton, { borderRadius: 8 }]}
              contentStyle={styles.draftButtonContent}
              textColor={theme.colors.primary}
            >
              View Draft
            </Button>
          )}
        </View>

        <View style={styles.searchSortContainer}>
          <TextInput
            mode="outlined"
            placeholder="Search product..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { borderRadius: 8 }]}
            left={<TextInput.Icon icon="magnify" />}
            right={searchQuery && <TextInput.Icon icon="close" onPress={() => setSearchQuery("")} />}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
          />

          <Menu
            visible={sortVisible}
            onDismiss={() => setSortVisible(false)}
            anchor={
              <Button
                ref={menuAnchorRef}
                onPress={() => setSortVisible(true)}
                mode="outlined"
                style={[styles.sortButton, { borderRadius: 8, borderColor: theme.colors.primary }]}
                icon="sort"
                contentStyle={{ flexDirection: "row-reverse" }}
                textColor={theme.colors.primary}
              >
                Sort by {sortOption === "price" ? "Price" : "Stock"}
              </Button>
            }
          >
            <Menu.Item
              leadingIcon={sortOption === "price" ? "check" : null}
              onPress={() => {
                setSortOption("price");
                setSortVisible(false);
              }}
              title="Price"
            />
            <Menu.Item
              leadingIcon={sortOption === "stock" ? "check" : null}
              onPress={() => {
                setSortOption("stock");
                setSortVisible(false);
              }}
              title="Stock"
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                setSortOption("price");
                setSortVisible(false);
              }}
              title="Reset"
            />
          </Menu>
        </View>

        <View style={{ flex: 1 }}>
          {products?.length > 0 ? (
            <FlatList
              data={products}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              renderItem={renderItem}
            />
          ) : (
            <View style={styles.emptyContainer}>
              {loading ? (
                <>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.emptyText}>Loading products...</Text>
                </>
              ) : (
                <>
                  <Icon name="package-variant-remove" size={60} color={theme.colors.backdrop} />
                  <Text style={styles.emptyText}>No products found</Text>
                  <Text style={styles.emptySubText}>
                    {searchQuery ? "Try a different search term" : "Add new products to get started"}
                  </Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Order Modal */}
        <Modal
          visible={orderModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setOrderModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContainer, { backgroundColor: theme.colors.background, borderRadius: 8 }]}>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {storeId ? `Order ${selectedProduct?.productName} for ${name}` : 'Order'} 
                {draftOrder && <Text style={{ color: theme.colors.primary }}> (Editing Draft)</Text>}
              </Text>

              <View style={styles.modalSection}>
                <Text variant="bodyMedium" style={styles.label}>Quantity</Text>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    onPress={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                    style={[styles.counterButton, { borderColor: theme.colors.primary, borderRadius: 8 }]}
                  >
                    <Icon name="minus" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.counterInput, { borderColor: theme.colors.primary, borderRadius: 8 }]}
                    placeholder={orderQuantity.toString()}
                    onChangeText={(value) => setOrderQuantity(value === "" ? 1 : Math.max(1, parseInt(value) || 1))}
                  />
                  <TouchableOpacity
                    onPress={() => setOrderQuantity(orderQuantity + 1)}
                    style={[styles.counterButton, { borderColor: theme.colors.primary, borderRadius: 8 }]}
                  >
                    <Icon name="plus" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.rowInputContainer}>
                <View style={[styles.smallInputContainer, { marginRight: 8 }]}>
                  <Text variant="bodyMedium" style={styles.label}>Discount (%)</Text>
                  <TextInput
                    mode="outlined"
                    placeholder={discountPercentage.toString()}
                    onChangeText={(text) => setDiscountPercentage(Math.min(100, Math.max(0, parseInt(text) || 0)))}
                    style={[styles.smallInput, { borderRadius: 8 }]}
                    right={<TextInput.Affix text="%" />}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                  />
                </View>
                <View style={styles.smallInputContainer}>
                  <Text variant="bodyMedium" style={styles.label}>Bonus Qty</Text>
                  <TextInput
                    mode="outlined"
                    placeholder={bonusQuantity.toString()}
                    onChangeText={(text) => setBonusQuantity(Math.max(0, parseInt(text) || 0))}
                    style={[styles.smallInput, { borderRadius: 8 }]}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                  />
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text variant="bodyMedium" style={styles.label}>Payment Method</Text>
                <View style={styles.paymentMethodContainer}>
                  <TouchableOpacity
                    style={[
                      styles.paymentMethodButton,
                      paymentMethod === 'cash' && { 
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary 
                      },
                      { borderColor: theme.colors.primary }
                    ]}
                    onPress={() => setPaymentMethod('cash')}
                  >
                    <Text style={paymentMethod === 'cash' ? { color: theme.colors.onPrimary } : { color: theme.colors.primary }}>
                      Cash
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.paymentMethodButton,
                      paymentMethod === 'credit' && { 
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.primary 
                      },
                      { borderColor: theme.colors.primary }
                    ]}
                    onPress={() => setPaymentMethod('credit')}
                  >
                    <Text style={paymentMethod === 'credit' ? { color: theme.colors.onPrimary } : { color: theme.colors.primary }}>
                      Credit
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text variant="bodyMedium" style={styles.label}>Total Price</Text>
                <Text variant="bodyLarge" style={[styles.totalPrice, { color: theme.colors.primary }]}>
                  BDT {selectedProduct ? calculateTotal() : "0.00"}
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setOrderModalVisible(false)}
                  style={[styles.cancelButton, { borderRadius: 8, borderColor: theme.colors.primary }]}
                  textColor={theme.colors.primary}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handlePlaceOrder}
                  loading={creatingOrder}
                  disabled={creatingOrder}
                  style={[styles.confirmButton, { borderRadius: 8 }]}
                  buttonColor={theme.colors.primary}
                >
                  {draftOrder ? "Update Draft" : "Save Order"}
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* Update Stock Modal */}
        <Modal
          visible={updateModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setUpdateModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContainer, { backgroundColor: theme.colors.background, borderRadius: 8 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="titleLarge" style={styles.modalTitle}>
                  Update Stock
                </Text>
                <Button 
                  mode="text" 
                  onPress={() => {
                    setUpdateModalVisible(false);
                    openEditModal(selectedProduct);
                  }}
                  icon="pencil"
                  textColor={theme.colors.primary}
                >
                  Edit
                </Button>
              </View>
              
              <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                {selectedProduct?.productName +' '}
                {selectedProduct?.packSize +' '}
                {selectedProduct?.unit}
              </Text>

              <View style={styles.modalSection}>
                <Text variant="bodyMedium" style={styles.label}>
                  Current Stock: {selectedProduct?.stock} pcs
                </Text>
                <Text variant="bodyMedium" style={styles.label}>
                  New Quantity
                </Text>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    onPress={() => setOrderQuantity(Math.max(0, orderQuantity - 1))}
                    style={[styles.counterButton, { borderColor: theme.colors.primary, borderRadius: 8 }]}
                  >
                    <Icon name="minus" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.counterInput, { borderColor: theme.colors.primary, borderRadius: 8 }]}
                    placeholder={orderQuantity.toString()}
                    onChangeText={(value) =>
                      setOrderQuantity(value === "" ? 0 : Math.max(0, parseInt(value) || 0))
                    }
                  />
                  <TouchableOpacity
                    onPress={() => setOrderQuantity(orderQuantity + 1)}
                    style={[styles.counterButton, { borderColor: theme.colors.primary, borderRadius: 8 }]}
                  >
                    <Icon name="plus" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setUpdateModalVisible(false)}
                  style={[styles.cancelButton, { borderRadius: 8, borderColor: theme.colors.primary }]}
                  textColor={theme.colors.primary}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleStockUpdate}
                  loading={updatingStock}
                  disabled={updatingStock}
                  style={[styles.confirmButton, { borderRadius: 8 }]}
                  buttonColor={theme.colors.primary}
                >
                  Update
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Product Modal */}
        <Modal
          visible={editModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContainer, { backgroundColor: theme.colors.background, borderRadius: 8 }]}>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Edit Product
              </Text>

              <View style={styles.modalSection}>
                <TextInput
                  label="Product Name"
                  placeholder={editedProduct?.productName || ''}
                  onChangeText={(text) => setEditedProduct({...editedProduct, productName: text})}
                  mode="outlined"
                  style={[styles.editInput, { borderRadius: 8 }]}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />
                <TextInput
                  label="Price (BDT)"
                  placeholder={editedProduct?.price?.toString() || ''}
                  onChangeText={(text) => setEditedProduct({...editedProduct, price: parseFloat(text) || 0})}
                  mode="outlined"
                  keyboardType="numeric"
                  style={[styles.editInput, { borderRadius: 8 }]}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />
                <TextInput
                  label="Pack Size"
                  placeholder={editedProduct?.packSize?.toString() || ''}
                  onChangeText={(text) => setEditedProduct({...editedProduct, packSize: text})}
                  mode="outlined"
                  style={[styles.editInput, { borderRadius: 8 }]}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />
                <TextInput
                  label="Unit"
                  placeholder={editedProduct?.unit || ''}
                  onChangeText={(text) => setEditedProduct({...editedProduct, unit: text})}
                  mode="outlined"
                  style={[styles.editInput, { borderRadius: 8 }]}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />
                <TextInput
                  label="Current Stock"
                  placeholder={editedProduct?.stock?.toString() || ''}
                  onChangeText={(text) => setEditedProduct({...editedProduct, stock: parseInt(text) || 0})}
                  mode="outlined"
                  keyboardType="numeric"
                  style={[styles.editInput, { borderRadius: 8 }]}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />
              </View>

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setEditModalVisible(false)}
                  style={[styles.cancelButton, { borderRadius: 8, borderColor: theme.colors.primary }]}
                  textColor={theme.colors.primary}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleProductUpdate}
                  loading={updatingProduct}
                  disabled={updatingProduct}
                  style={[styles.confirmButton, { borderRadius: 8 }]}
                  buttonColor={theme.colors.primary}
                >
                  Save
                </Button>
              </View>
            </View>
          </View>
        </Modal>

       {/* Draft Details Modal */}
<Modal
  visible={draftModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setDraftModalVisible(false)}
>
  <View style={styles.modalBackdrop}>
    <View style={[styles.modalContainer, { 
      backgroundColor: theme.colors.background, 
      borderRadius: 8,
      maxHeight: '80%'
    }]}>
      {/* Modal Header with Close Button */}
      <View style={styles.modalHeader}>
        <Text variant="titleLarge" style={styles.modalTitle}>
          Draft Order Summary
        </Text>
        <TouchableOpacity
          onPress={() => setDraftModalVisible(false)}
          style={styles.closeButton}
        >
          <Icon name="close" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={{ width: '100%' }}>                
        <View style={styles.paymentMethodDisplay}>
          <Text variant="bodyMedium">
            Payment Method: <Text style={{ fontWeight: 'bold' }}>{paymentMethod}</Text>
          </Text>
        </View>
        
        <View style={styles.draftItemsContainer}>
          {draftOrder?.products?.map((item, index) => (
            <View key={index} style={styles.draftItem}>
              <View style={{ flex: 2 }}>
                <Text variant="bodyMedium">{item.name + ' ' + item.packSize + ' '+ item.unit}</Text>
                {item.bonusQuantity > 0 && (
                  <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                    +{item.bonusQuantity} bonus
                  </Text>
                )}
              </View>
              <Text variant="bodyMedium" style={{ textAlign: 'right' }}>
                {item.quantity} × BDT {item.price.toFixed(2)}
                {item.discountPercentage > 0 && (
                  <Text style={{ color: theme.colors.error }}>
                    {' '}({item.discountPercentage}% off)
                  </Text>
                )}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.modalSection}>
          <Text variant="bodyLarge" style={[styles.totalPrice, { textAlign: 'right' }]}>
            Total: BDT {calculateDraftTotal()}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.modalButtons, { 
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
      }]}>
        <Button
          mode="outlined"
          onPress={handleDeleteDraft}
          loading={deletingOrder}
          disabled={deletingOrder}
          style={[styles.deleteButton, { 
            borderRadius: 8,
            borderColor: theme.colors.error,
            flex: 1,
            marginRight: 8
          }]}
          textColor={theme.colors.error}
        >
          Cancel Order
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmitDraft}
          loading={submittingOrder}
          disabled={submittingOrder}
          style={[styles.confirmButton, { 
            borderRadius: 8,
            flex: 1
          }]}
          buttonColor={theme.colors.primary}
        >
          Submit
        </Button>
      </View>
    </View>
  </View>
</Modal>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: "bold",
  },
  draftBadge: {
    marginLeft: 10
  },
  draftButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  draftButtonContent: {
    height: 36,
  },
  searchSortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
  },
  sortButton: {
    height: 48,
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 16,
  },
  productCard: {
    marginBottom: 12,
  },
  title: {
    fontWeight: "bold",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 0,
  },
  productInfo: {
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  packSize: {
    fontSize: 14,
    color: '#666',
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  stockBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    padding: 24,
    maxWidth: 500,
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: "bold",
  },
  modalSection: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: "#666",
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  counterButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  counterInput: {
    flex: 1,
    marginHorizontal: 8,
    textAlign: "center",
    borderWidth: 1,
    height: 40,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    width: '100%',
  },
  confirmButton: {
    minWidth: 100,
  },
  cancelButton: {
    minWidth: 100,
  },
  deleteButton: {
    minWidth: 100,
  },
  rowInputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  smallInputContainer: {
    flex: 1,
  },
  smallInput: {
    height: 50,
  },
  editInput: {
    marginBottom: 16,
  },
  draftItemsContainer: {
    marginBottom: 16,
  },
  draftItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  paymentMethodButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentMethodDisplay: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},
closeButton: {
  padding: 8,
  marginLeft: 8,
},
});

export default ProductStockScreen;