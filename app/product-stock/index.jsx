import React, { useState, useRef } from "react";
import { View, FlatList, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Card, Text, Button, IconButton, Menu, PaperProvider, Divider, useTheme } from "react-native-paper";

const ProductStockScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortVisible, setSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState("price");
  const menuAnchorRef = useRef(null);

  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);

  const products = [
    { id: "1", name: "Product A", tp: 500, stock: 20, packSize: "1000ml" },
    { id: "2", name: "Product B", tp: 300, stock: 50, packSize: "500ml" },
    { id: "3", name: "Product C", tp: 700, stock: 10, packSize: "1kg" },
    { id: "4", name: "Product D", tp: 600, stock: 30, packSize: "500ml" },
  ];

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) =>
    sortOption === "price" ? b.stock - a.stock : b.tp - a.tp
  );

  const openOrderModal = (product) => {
    setSelectedProduct(product);
    setOrderModalVisible(true);
  };

  const openUpdateModal = (product) => {
    setSelectedProduct(product);
    setUpdateModalVisible(true);
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        {/* Search & Sort Row */}
        <View style={styles.searchSortContainer}>
          <TextInput
            outlineColor="transparent"
            activeOutlineColor='transparent'
            mode="outlined"
            placeholder="Search product..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{...styles.searchInput,borderColor : theme.colors.primary,borderWidth : 1}}
            left={<TextInput.Icon icon="magnify" />}
          />

          <Menu
            visible={sortVisible}
            onDismiss={() => setSortVisible(false)}
            anchor={
              <Button
                ref={menuAnchorRef}
                onPress={() => setSortVisible(true)}
                mode="outlined"
                style={[styles.sortButton, { borderColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }]}
                icon="sort"
                labelStyle={{ color: theme.colors.primary }}
              >
                {sortOption === "price" ? "Price" : "Stock"}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setSortOption("price"); setSortVisible(false); }} title="Price" />
            <Menu.Item onPress={() => { setSortOption("stock"); setSortVisible(false); }} title="Stock" />
            <Divider />
            <Menu.Item onPress={() => { setSortVisible(false); }} title="Reset" />
          </Menu>
        </View>

        {/* Product List */}
        <View style={{ flex: 1 }}>
          <FlatList
            data={sortedProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card style={[styles.productCard, { borderRadius: 8 }]}>
                <Card.Title title={item.name} titleStyle={styles.title} />
                <Card.Content style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={styles.price}>TP Price: ৳{item.tp}</Text>
                    <Text style={[styles.packSize, { color: theme.colors.primary }]}>Pack Size: {item.packSize}</Text>
                    <Text style={styles.stock}>Stock: {item.stock} pcs</Text>
                  </View>
                  <View style={{ gap: 10 }}>
                    <Button style={{
                      borderRadius: 8,
                      backgroundColor: theme.colors.primary
                    }} mode="contained" onPress={() => openOrderModal(item)}>Order</Button>
                    <Button style={{
                      borderRadius: 8
                    }} mode="outlined" onPress={() => openUpdateModal(item)}>Update</Button>
                  </View>
                </Card.Content>
              </Card>
            )}
          />
        </View>

        {/* Order Modal */}
        <Modal visible={orderModalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {selectedProduct ? `Order ${selectedProduct.name}` : "Order Product"}
              </Text>

              {/* Quantity Input */}
              <Text style={styles.label}>Quantity:</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  onPress={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                  style={styles.counterButton}
                >
                  <Text style={styles.counterText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.counterInput}
                  value={orderQuantity.toString()}
                  inputMode="numeric"
                  onChangeText={(value) => setOrderQuantity(value === "" ? "" : Math.max(1, parseInt(value) || 1))}
                />
                <TouchableOpacity
                  onPress={() => setOrderQuantity(orderQuantity + 1)}
                  style={styles.counterButton}
                >
                  <Text style={styles.counterText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <Button mode="contained" onPress={() => setOrderModalVisible(false)}>Confirm Order</Button>
                <Button mode="outlined" onPress={() => setOrderModalVisible(false)}>Cancel</Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* Update Modal */}
        <Modal visible={updateModalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {selectedProduct ? `Update ${selectedProduct.name}` : "Update Product"}
              </Text>

              {/* Quantity Input */}
              <Text style={styles.label}>Stock Quantity:</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  onPress={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                  style={styles.counterButton}
                >
                  <Text style={styles.counterText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.counterInput}
                  value={orderQuantity.toString()}
                  inputMode="numeric"
                  onChangeText={(value) => setOrderQuantity(value === "" ? "" : Math.max(1, parseInt(value) || 1))}
                />
                <TouchableOpacity
                  onPress={() => setOrderQuantity(orderQuantity + 1)}
                  style={styles.counterButton}
                >
                  <Text style={styles.counterText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <Button mode="contained" onPress={() => setUpdateModalVisible(false)}>Confirm Update</Button>
                <Button mode="outlined" onPress={() => setUpdateModalVisible(false)}>Cancel</Button>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  searchSortContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  searchInput: { flex: 3, marginRight: 10, backgroundColor: "transparent", borderRadius: 8 },
  sortButton: { flex: 1, borderRadius: 8, borderWidth: 1 },

  // Card
  productCard: { marginBottom: 10, backgroundColor: "#fff", elevation: 3 },
  title: { fontSize: 18, fontWeight: "bold" },
  price: { fontSize: 16, fontWeight: "bold", color: "#007BFF" },
  stock: { fontSize: 14, color: "#28a745" },
  packSize: { fontSize: 14, fontWeight: "600" },

  // Modal
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: 300, backgroundColor: "#fff", padding: 20, borderRadius: 10, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  label: { fontSize: 16, fontWeight: "600", marginTop: 10 },

  // Counter
  counterContainer: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  counterButton: { backgroundColor: "#ddd", padding: 10, borderRadius: 5, marginHorizontal: 5 },
  counterText: { fontSize: 20, fontWeight: "bold" },
  counterInput: { width: 50, height: 40, textAlign: "center", fontSize: 18, borderBottomWidth: 1, borderBottomColor: "#333" },

  modalButtons: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 10 },
});

export default ProductStockScreen;
