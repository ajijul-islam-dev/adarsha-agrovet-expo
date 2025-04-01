import React, { useState, useRef, useContext, useEffect } from "react";
import { View, FlatList, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Card, Text, Button, Menu, PaperProvider, Divider, useTheme } from "react-native-paper";
import { ServicesProvider } from "../../provider/Provider.jsx";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

const ProductStockScreen = () => {
  const theme = useTheme();
  const { storeId,name } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortVisible, setSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState("price");
  const menuAnchorRef = useRef(null);

  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [bonusQuantity, setBonusQuantity] = useState(0);
  const [editedProduct, setEditedProduct] = useState(null);

  const { products, loading, handleGetAllProducts } = useContext(ServicesProvider);

  useEffect(() => {
    handleGetAllProducts(searchQuery, sortOption);
  }, [searchQuery, sortOption]);

  const openOrderModal = (product) => {
    setSelectedProduct(product);
    setOrderQuantity(1);
    setDiscountPercentage(0);
    setBonusQuantity(0);
    setOrderModalVisible(true);
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

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.emptyText}>Loading products...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon name="package-variant-remove" size={60} color={theme.colors.backdrop} />
        <Text style={styles.emptyText}>No products found</Text>
        <Text style={styles.emptySubText}>
          {searchQuery ? "Try a different search term" : "Add new products to get started"}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <Card style={styles.productCard} mode="elevated">
      <Card.Title
        title={item.productName}
        titleStyle={styles.title}
        titleVariant="titleMedium"
        right={() => (
          <View style={[styles.stockBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
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
            {item.packSize} {item.unit} per pack
          </Text>
        </View>
        <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 8 }}>
          {storeId && (
            <TouchableOpacity
              onPress={() => openOrderModal(item)}
              style={[styles.iconButton, { backgroundColor: theme.colors.primary }]}
            >
              <Icon name="cart-plus" size={20} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => openUpdateModal(item)}
            style={[styles.iconButton, { borderWidth: 1, borderColor: theme.colors.primary }]}
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
        <View style={styles.header}>
          {storeId ? (
            <Text variant="headlineSmall" style={styles.headerText}>
              Order for {name}
            </Text>
          ) : (
            <Text variant="headlineSmall" style={styles.headerText}>
              Product Stock
            </Text>
          )}
        </View>

        <View style={styles.searchSortContainer}>
          <TextInput
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            mode="outlined"
            placeholder="Search product..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            left={<TextInput.Icon icon="magnify" />}
            right={
              searchQuery ? (
                <TextInput.Icon
                  icon="close"
                  onPress={() => setSearchQuery("")}
                />
              ) : null
            }
          />

          <Menu
            visible={sortVisible}
            onDismiss={() => setSortVisible(false)}
            anchor={
              <Button
                ref={menuAnchorRef}
                onPress={() => setSortVisible(true)}
                mode="outlined"
                style={styles.sortButton}
                icon="sort"
                contentStyle={{ flexDirection: "row-reverse" }}
                labelStyle={{ color: theme.colors.primary }}
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
            renderEmptyState()
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
            <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {storeId ? `Order for Store ${storeId}` : 'Order'} - {selectedProduct?.productName}
              </Text>

              <View style={styles.modalSection}>
                <Text variant="bodyMedium" style={styles.label}>
                  Quantity
                </Text>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    onPress={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                    style={[styles.counterButton, { borderColor: theme.colors.outline }]}
                  >
                    <Icon name="minus" size={20} color={theme.colors.onSurface} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.counterInput, { borderColor: theme.colors.outline }]}
                    value={orderQuantity.toString()}
                    inputMode="numeric"
                    onChangeText={(value) =>
                      setOrderQuantity(value === "" ? 1 : Math.max(1, parseInt(value) || 1))
                    }
                    theme={{ roundness: 8 }}
                  />
                  <TouchableOpacity
                    onPress={() => setOrderQuantity(orderQuantity + 1)}
                    style={[styles.counterButton, { borderColor: theme.colors.outline }]}
                  >
                    <Icon name="plus" size={20} color={theme.colors.onSurface} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.rowInputContainer}>
                <View style={[styles.smallInputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text variant="bodyMedium" style={styles.label}>
                    Discount (%)
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={discountPercentage.toString()}
                    onChangeText={(text) => setDiscountPercentage(Math.min(100, Math.max(0, parseInt(text) || 0)))}
                    keyboardType="numeric"
                    style={styles.smallInput}
                    right={<TextInput.Affix text="%" />}
                    theme={{ roundness: 8 }}
                  />
                </View>
                <View style={[styles.smallInputContainer, { flex: 1 }]}>
                  <Text variant="bodyMedium" style={styles.label}>
                    Bonus Qty
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={bonusQuantity.toString()}
                    onChangeText={(text) => setBonusQuantity(Math.max(0, parseInt(text) || 0))}
                    keyboardType="numeric"
                    style={styles.smallInput}
                    theme={{ roundness: 8 }}
                  />
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text variant="bodyMedium" style={styles.label}>
                  Total Price
                </Text>
                <Text variant="bodyLarge" style={[styles.totalPrice, { color: theme.colors.primary }]}>
                  BDT {selectedProduct ? calculateTotal() : "0.00"}
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setOrderModalVisible(false)}
                  style={styles.cancelButton}
                  icon="close"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    if (storeId) {
                      console.log(`Order placed for store ${storeId}`);
                    }
                    setOrderModalVisible(false);
                  }}
                  style={styles.confirmButton}
                  icon="check"
                >
                  {storeId ? "Place Order" : "Confirm"}
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
            <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
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
                >
                  Edit
                </Button>
              </View>
              
              <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                {selectedProduct?.productName}
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
                    style={[styles.counterButton, { borderColor: theme.colors.outline }]}
                  >
                    <Icon name="minus" size={20} color={theme.colors.onSurface} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.counterInput, { borderColor: theme.colors.outline }]}
                    value={orderQuantity.toString()}
                    inputMode="numeric"
                    onChangeText={(value) =>
                      setOrderQuantity(value === "" ? 0 : Math.max(0, parseInt(value) || 0))
                    }
                    theme={{ roundness: 8 }}
                  />
                  <TouchableOpacity
                    onPress={() => setOrderQuantity(orderQuantity + 1)}
                    style={[styles.counterButton, { borderColor: theme.colors.outline }]}
                  >
                    <Icon name="plus" size={20} color={theme.colors.onSurface} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setUpdateModalVisible(false)}
                  style={styles.cancelButton}
                  icon="close"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => setUpdateModalVisible(false)}
                  style={styles.confirmButton}
                  icon="check"
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
            <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Edit Product
              </Text>

              <View style={styles.modalSection}>
                <TextInput
                  label="Product Name"
                  value={editedProduct?.productName || ''}
                  onChangeText={(text) => setEditedProduct({...editedProduct, productName: text})}
                  mode="outlined"
                  style={styles.editInput}
                />
                <TextInput
                  label="Price (BDT)"
                  value={editedProduct?.price?.toString() || ''}
                  onChangeText={(text) => setEditedProduct({...editedProduct, price: parseFloat(text) || 0})}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.editInput}
                />
                <TextInput
                  label="Pack Size"
                  value={editedProduct?.packSize?.toString() || ''}
                  onChangeText={(text) => setEditedProduct({...editedProduct, packSize: text})}
                  mode="outlined"
                  style={styles.editInput}
                />
                <TextInput
                  label="Unit"
                  value={editedProduct?.unit || ''}
                  onChangeText={(text) => setEditedProduct({...editedProduct, unit: text})}
                  mode="outlined"
                  style={styles.editInput}
                />
                <TextInput
                  label="Current Stock"
                  value={editedProduct?.stock?.toString() || ''}
                  onChangeText={(text) => setEditedProduct({...editedProduct, stock: parseInt(text) || 0})}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.editInput}
                />
              </View>

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setEditModalVisible(false)}
                  style={styles.cancelButton}
                  icon="close"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    setEditModalVisible(false);
                  }}
                  style={styles.confirmButton}
                  icon="content-save"
                >
                  Save
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
  header: {
    marginBottom: 16,
  },
  headerText: {
    fontWeight: "bold",
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
    borderRadius: 8,
  },
  sortButton: {
    height: 48,
    justifyContent: "center",
    borderRadius: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  productCard: {
    marginBottom: 12,
    borderRadius: 12,
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
    borderRadius: 12,
    marginRight: 8,
  },
  stockBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
  },
  modalContainer: {
    width: "90%",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: "bold",
  },
  modalSection: {
    marginBottom: 24,
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
    borderRadius: 8,
  },
  counterInput: {
    flex: 1,
    marginHorizontal: 8,
    textAlign: "center",
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  confirmButton: {
    borderRadius: 8,
    minWidth: 120,
  },
  cancelButton: {
    borderRadius: 8,
    minWidth: 120,
  },
  rowInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});

export default ProductStockScreen;