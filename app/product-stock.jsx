import React, { useState, useRef } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Card, Text, Button, IconButton, Menu, PaperProvider, Divider } from "react-native-paper";
import { Link } from "expo-router";

const ProductStockScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortVisible, setSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState("price"); // Default sorting by price
  const menuAnchorRef = useRef(null); // Fix for Menu anchor issue

  const products = [
    { id: "1", name: "Product A", tp: 500, stock: 20 },
    { id: "2", name: "Product B", tp: 300, stock: 50 },
    { id: "3", name: "Product C", tp: 700, stock: 10 },
    { id: "4", name: "Product D", tp: 600, stock: 30 },
  ];

  // Filter products by search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort products based on selection
  const sortedProducts = [...filteredProducts].sort((a, b) =>
    sortOption === "price" ?  b.stock - a.stock : b.tp - a.tp
  );
    
  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        {/* Search & Sort Row */}
        <View style={styles.searchSortContainer}>
          {/* Search Input */}
          <TextInput
            outlineColor='transparent'
            activeOutlineColor='transparent'
            mode="outlined"
            placeholder="Search product..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            left={<TextInput.Icon icon="magnify" />}
          />

          {/* Sort Dropdown */}
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
                labelStyle={styles.sortButtonLabel}
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
              <Card style={styles.productCard}>
                <Card.Title title={item.name} />
                <Card.Content>
                  <Text style={styles.price}>TP Price: ${item.tp}</Text>
                  <Text style={styles.stock}>Stock: {item.stock} pcs</Text>
                </Card.Content>
                <Card.Actions>
                  <Link href="/product/1">
                    <IconButton icon="chevron-right" size={24} />
                  </Link>
                </Card.Actions>
              </Card>
            )}
          />
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  searchSortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: {
    flex: 3, // Larger space for search input
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 4, // Ensures the same border radius for both search and sort
    borderColor: "#ff6347", // Tomato color
    borderWidth: 1,
  },
  sortButton: {
    flex: 1, // Smaller space for the sort button
    borderRadius: 4, // Ensures the same border radius for both search and sort
    borderColor: "#ff6347", // Tomato color
    borderWidth: 1,
    alignItems : 'center',
    justifyContent : 'center'
  },
  sortButtonLabel: {
    color: "#ff6347", // Tomato color for label
  },
  productCard: {
    marginBottom: 10,
    marginTop: 10,
    marginHorizontal: 2,
    backgroundColor: "#fff",
    elevation: 3,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007BFF",
  },
  stock: {
    fontSize: 14,
    color: "#28a745",
  },
});

export default ProductStockScreen;
