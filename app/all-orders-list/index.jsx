import React, { useState, useRef,useContext } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Card, Text, Button, Menu, PaperProvider, Divider, useTheme } from "react-native-paper";
import { Link } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import {ServicesProvider} from '../../provider/Provider.jsx';


const OrdersListScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortVisible, setSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState("amount");
  const menuAnchorRef = useRef(null);
  
  const {handleGetAllOrders,order} = useContext(ServicesProvider);
  
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
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerText}>
            All Orders
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card mode="contained" style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text variant="titleMedium" style={styles.officerName}>
                    {item.officerName}
                  </Text>
                  <Text 
                    variant="labelSmall" 
                    style={[
                      styles.statusBadge,
                      { 
                        backgroundColor: 
                          item.status === "Completed" ? "#e6f7ee" : 
                          item.status === "Pending" ? "#ffebee" : 
                          "#e3f2fd",
                        color: 
                          item.status === "Completed" ? "#28a745" : 
                          item.status === "Pending" ? "#dc3545" : 
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
                      {item.date} • {item.time}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MaterialIcons name="attach-money" size={16} color="#757575" />
                    <Text variant="bodyMedium" style={styles.detailText}>
                      ৳{item.amount.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </Card.Content>
              
              <Card.Actions style={styles.cardActions}>
                <Link href={`/order-details/${item.id}`} asChild>
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
    alignItems: 'center',
    marginBottom: 8,
  },
  officerName: {
    fontWeight: 'bold',
    color: '#333',
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