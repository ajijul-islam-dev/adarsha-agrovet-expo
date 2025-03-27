import React, { useState, useRef } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Card, Text, Button, Menu, PaperProvider, Divider, useTheme } from "react-native-paper";
import { Link } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

const OrdersListScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortVisible, setSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState("amount");
  const menuAnchorRef = useRef(null);

  const orders = [
    { 
      id: "1", 
      officerName: "John Doe", 
      amount: 15000, 
      date: "2023-06-15", 
      time: "10:30 AM",
      status: "Completed"
    },
    { 
      id: "2", 
      officerName: "Jane Smith", 
      amount: 8500, 
      date: "2023-06-16", 
      time: "02:15 PM",
      status: "Pending"
    },
    { 
      id: "3", 
      officerName: "Mike Johnson", 
      amount: 22000, 
      date: "2023-06-14", 
      time: "09:45 AM",
      status: "Completed"
    },
    { 
      id: "4", 
      officerName: "Sarah Williams", 
      amount: 12000, 
      date: "2023-06-17", 
      time: "11:20 AM",
      status: "Shipped"
    },
  ];

  const filteredOrders = orders.filter((order) =>
    order.officerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedOrders = [...filteredOrders].sort((a, b) =>
    sortOption === "amount" ? b.amount - a.amount : new Date(b.date) - new Date(a.date)
  );

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        {/* Search & Sort Row */}
        <View style={styles.searchSortContainer}>
          <TextInput
            outlineColor="transparent"
            activeOutlineColor='transparent'
            mode="outlined"
            placeholder="Search by officer..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{...styles.searchInput, borderColor: theme.colors.primary, borderWidth: 1}}
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
                {sortOption === "amount" ? "Amount" : "Date"}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setSortOption("amount"); setSortVisible(false); }} title="Amount" />
            <Menu.Item onPress={() => { setSortOption("date"); setSortVisible(false); }} title="Date" />
            <Divider />
            <Menu.Item onPress={() => { setSortVisible(false); }} title="Reset" />
          </Menu>
        </View>

        {/* Orders List */}
        <View style={{ flex: 1 }}>
          <FlatList
            data={sortedOrders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card style={[styles.productCard, { borderRadius: 8 }]}>
                <Card.Title 
                  title={item.officerName} 
                  titleStyle={styles.title} 
                  subtitle={`${item.date} • ${item.time}`}
                  subtitleStyle={{color: theme.colors.primary}}
                />
                <Card.Content style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={styles.price}>Amount: ৳{item.amount.toLocaleString()}</Text>
                    <Text style={[styles.packSize, { 
                      color: item.status === "Completed" ? "#28a745" : 
                            item.status === "Pending" ? "#dc3545" : 
                            "#17a2b8"
                    }]}>
                      Status: {item.status}
                    </Text>
                  </View>
                  <Link href={`/order-details/${item.id}`} asChild>
                    <MaterialIcons 
                      name="arrow-forward-ios" 
                      size={20} 
                      color={theme.colors.primary} 
                      style={styles.arrowIcon}
                    />
                  </Link>
                </Card.Content>
              </Card>
            )}
          />
        </View>
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
  packSize: { fontSize: 14, fontWeight: "600" },
  arrowIcon: {
    padding: 8,
  },
});

export default OrdersListScreen;