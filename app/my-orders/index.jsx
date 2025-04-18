import React, { useState, useRef, useContext, useEffect } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Card, Text, Button, Menu, PaperProvider, Divider, useTheme } from "react-native-paper";
import { Link } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { ServicesProvider } from '../../provider/Provider.jsx';

import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

const OrdersListScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortVisible, setSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState("amount");
  const menuAnchorRef = useRef(null);
  
  const { handleGetAllOrders, orders } = useContext(ServicesProvider);
 
  useEffect(() => {
    handleGetAllOrders();
  }, []);
  const filteredOrders = orders.filter((order) =>
    order?.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order?.store?.storeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedOrders = [...filteredOrders].sort((a, b) =>
    sortOption === "amount" ? b.orderFinalTotal - a.orderFinalTotal : new Date(b.submittedAt) - new Date(a.submittedAt)
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerText}>
            My Orders
          </Text>
        </View>

        {/* Search & Filter Row */}
        <View style={styles.filterContainer}>
          <TextInput
            mode="outlined"
            placeholder="Search orders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            left={<TextInput.Icon icon="magnify" />}
            outlineColor="#e0e0e0"
            activeOutlineColor={theme.colors.primary}
          />
          
          <View style={styles.filterButtons}>
            <Menu
              visible={sortVisible}
              onDismiss={() => setSortVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setSortVisible(true)}
                  style={styles.filterButton}
                  icon="sort"
                  contentStyle={{ flexDirection: 'row-reverse' }}
                >
                  Sort
                </Button>
              }
            >
              <Menu.Item 
                onPress={() => { setSortOption("amount"); setSortVisible(false); }} 
                title="By Amount" 
              />
              <Menu.Item 
                onPress={() => { setSortOption("date"); setSortVisible(false); }} 
                title="By Date" 
              />
              <Divider />
              <Menu.Item 
                onPress={() => { setSortVisible(false); }} 
                title="Clear" 
              />
            </Menu>
          </View>
        </View>

        {/* Orders List */}
        <FlatList
          data={sortedOrders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card mode="contained" style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text variant="titleMedium" style={styles.officerName}>
                      {item.store.storeName || 'Unknown Officer'}
                    </Text>
                    <Text variant="bodySmall" style={styles.storeName}>
                      {item.store?.proprietorName || 'Unknown Store'}
                    </Text>
                  </View>
                  <Text 
                    variant="labelSmall" 
                    style={[
                      styles.statusBadge,
                      { 
                        backgroundColor: 
                          item.status === "completed" ? "#e6f7ee" : 
                          item.status === "pending" ? "#ffebee" : 
                          "#e3f2fd",
                        color: 
                          item.status === "completed" ? "#28a745" : 
                          item.status === "pending" ? "#dc3545" : 
                          "#17a2b8"
                      }
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
                
                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="calendar-today" size={16} color="#757575" />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      {formatDate(item.submittedAt)} • {formatTime(item.submittedAt)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                       <FontAwesome6 name="bangladeshi-taka-sign" size={16} color="#757575" />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      {item.orderFinalTotal?.toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <MaterialIcons name="discount" size={16} color="#757575" />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      Discount: ৳{item.totalDiscount?.toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <MaterialIcons name="payment" size={16} color="#757575" />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      Payment: {item.paymentMethod}
                    </Text>
                  </View>
                </View>
              </Card.Content>
              
              <Card.Actions style={styles.cardActions}>
                <Link href={`/all-orders-list/${item._id}`} asChild>
                  <Button 
                    mode="text" 
                    textColor={theme.colors.primary}
                    icon="arrow-right"
                    contentStyle={{ flexDirection: 'row-reverse' }}
                  >
                    View Details
                  </Button>
                </Link>
              </Card.Actions>
            </Card>
          )}
        />
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  headerText: {
    fontWeight: 'bold',
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    height: 40,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    borderColor: '#e0e0e0',
  },
  listContent: {
    paddingBottom: 16,
    gap: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 1,
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  officerName: {
    fontWeight: 'bold',
    color: '#333',
  },
  storeName: {
    color: '#666',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  cardDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#616161',
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
  },
});

export default OrdersListScreen;