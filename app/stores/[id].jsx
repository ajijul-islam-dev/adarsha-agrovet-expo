import React, { useState, useEffect, useContext } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Button, DataTable, TextInput, IconButton, useTheme } from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useIsFocused } from '@react-navigation/native';
import { ServicesProvider } from '../../provider/Provider.jsx'

const Tab = createMaterialTopTabNavigator();

const StoreDetailsScreen = () => {
  const theme = useTheme();
  const { id } = useLocalSearchParams();
  const { currentStore, loading, handleGetStoreById } = useContext(ServicesProvider);
  const [refreshing, setRefreshing] = useState(false);
  const [orderProducts, setOrderProducts] = useState([]);
  const [newOrder, setNewOrder] = useState({
    productId: '',
    quantity: 1,
    price: 0,
    notes: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date());
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    handleGetStoreById(id);
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await handleGetStoreById(id);
    setRefreshing(false);
  };

  const handleCreateNewOrder = async () => {
    console.log("Creating order:", orderProducts);
    setOrderProducts([]);
  };

  const addProductToOrder = () => {
    if (!newOrder.productId || newOrder.quantity <= 0) return;

    setOrderProducts([...orderProducts, {
      ...newOrder,
      id: Date.now().toString()
    }]);
    setNewOrder({
      productId: '',
      quantity: 1,
      price: 0,
      notes: ''
    });
  };

  const removeProductFromOrder = (productId) => {
    setOrderProducts(orderProducts.filter(p => p.id !== productId));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateFilter(selectedDate);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `৳${amount?.toLocaleString() || '0'}`;
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading store details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentStore && !loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons 
            name="store-remove" 
            size={40} 
            color={theme.colors.error} 
          />
          <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Store not found</Text>
          <Button 
            mode="contained" 
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          >
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Tab Screen Components
  const OverviewTab = () => (
    <View style={styles.tabContent}>
      <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title title="Store Summary" titleVariant="titleMedium" />
        <Card.Content>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
              Total Due:
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
              {formatCurrency(currentStore?.totalDue || 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
              Last Payment:
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
              {currentStore?.payments?.length > 0
                ? `${formatCurrency(currentStore.payments[0].amount)} on ${formatDate(currentStore.payments[0].date)}`
                : 'No payments yet'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
              Last Order:
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
              {currentStore?.orders?.length > 0
                ? `${formatCurrency(currentStore.orders[0].totalAmount)} on ${formatDate(currentStore.orders[0].date)}`
                : 'No orders yet'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.quickActionsCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title title="Quick Actions" titleVariant="titleMedium" />
        <Card.Content style={styles.quickActionsContent}>
          <Button
            mode="contained"
            icon="cash-plus"
            style={styles.quickActionButton}
            onPress={() => router.push(`/stores/${id}/add-payment`)}
          >
            Record Payment
          </Button>
          <Button
            mode="contained"
            icon="cart-plus"
            style={styles.quickActionButton}
            onPress={() => router.push({
                pathname: "/product-stock",
                params: { storeId: "store_123",name : currentStore.storeName }
              })
            }
          >
            Create Order
          </Button>
          <Button
            mode="contained"
            icon="receipt-plus"
            style={styles.quickActionButton}
            onPress={() => router.push(`/stores/${id}/add-due`)}
          >
            Add Due
          </Button>
        </Card.Content>
      </Card>
    </View>
  );

  const PaymentsTab = () => (
    <View style={styles.tabContent}>
      <Card style={[styles.dataCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title={`Payments (${currentStore?.payments?.length || 0})`}
          titleVariant="titleMedium"
          right={() => (
            <Button
              mode="contained-tonal"
              icon="plus"
              onPress={() => router.push(`/stores/${id}/add-payment`)}
              compact
            >
              Add
            </Button>
          )}
        />
        <Card.Content>
          {currentStore?.payments?.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
                <DataTable.Title>Method</DataTable.Title>
              </DataTable.Header>
              {currentStore.payments.map((payment) => (
                <DataTable.Row key={payment._id}>
                  <DataTable.Cell>
                    {formatDate(payment.date)}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {formatCurrency(payment.amount)}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    {payment.paymentMethod}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
              <DataTable.Row style={{ backgroundColor: theme.colors.surfaceVariant }}>
                <DataTable.Cell>
                  <Text style={{ fontWeight: 'bold' }}>Total</Text>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ fontWeight: 'bold' }}>
                    {formatCurrency(currentStore.payments.reduce((sum, p) => sum + p.amount, 0))}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell></DataTable.Cell>
              </DataTable.Row>
            </DataTable>
          ) : (
            <View style={styles.emptyDataContainer}>
              <MaterialCommunityIcons
                name="cash-remove"
                size={40}
                color={theme.colors.backdrop}
              />
              <Text style={[styles.emptyDataText, { color: theme.colors.onSurface }]}>
                No payments recorded
              </Text>
              <Button
                mode="contained"
                icon="cash-plus"
                onPress={() => router.push(`/stores/${id}/add-payment`)}
                style={{ marginTop: 16 }}
              >
                Record Payment
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );

  const OrdersTab = () => (
    <View style={styles.tabContent}>
      <Card style={[styles.dataCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title={`Orders (${currentStore?.orders?.length || 0})`}
          titleVariant="titleMedium"
          right={() => (
            <Button
              mode="contained-tonal"
              icon="plus"
              onPress={() => router.push(`/stores/${id}/add-order`)}
              compact
            >
              Add
            </Button>
          )}
        />
        <Card.Content>
          {orderProducts.length > 0 && (
            <View style={[styles.orderFormContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text variant="titleSmall" style={{ marginBottom: 8 }}>
                New Order Items
              </Text>
              {orderProducts.map((product) => (
                <View key={product.id} style={styles.orderItem}>
                  <Text style={{ flex: 2 }}>Product #{product.productId}</Text>
                  <Text style={{ flex: 1 }}>Qty: {product.quantity}</Text>
                  <Text style={{ flex: 1 }}>৳{(product.price * product.quantity).toLocaleString()}</Text>
                  <IconButton
                    icon="close"
                    size={16}
                    onPress={() => removeProductFromOrder(product.id)}
                  />
                </View>
              ))}
              <View style={styles.addProductContainer}>
                <TextInput
                  label="Product ID"
                  value={newOrder.productId}
                  onChangeText={(text) => setNewOrder({ ...newOrder, productId: text })}
                  style={{ flex: 2 }}
                  dense
                />
                <TextInput
                  label="Qty"
                  value={newOrder.quantity.toString()}
                  onChangeText={(text) => setNewOrder({ ...newOrder, quantity: parseInt(text) || 0 })}
                  keyboardType="numeric"
                  style={{ flex: 1, marginHorizontal: 8 }}
                  dense
                />
                <TextInput
                  label="Price"
                  value={newOrder.price.toString()}
                  onChangeText={(text) => setNewOrder({ ...newOrder, price: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  style={{ flex: 1 }}
                  dense
                />
                <IconButton
                  icon="plus"
                  size={20}
                  onPress={addProductToOrder}
                  style={{ marginLeft: 8 }}
                />
              </View>
              <Button
                mode="contained"
                onPress={handleCreateNewOrder}
                style={{ marginTop: 16 }}
                disabled={orderProducts.length === 0}
              >
                Submit Order
              </Button>
            </View>
          )}

          {currentStore?.orders?.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
              </DataTable.Header>
              {currentStore.orders.map((order) => (
                <TouchableOpacity
                  key={order._id}
                  onPress={() => router.push(`/orders/${order._id}`)}
                >
                  <DataTable.Row>
                    <DataTable.Cell>
                      {formatDate(order.date)}
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                      {formatCurrency(order.totalAmount)}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <View style={[
                        styles.statusBadge,
                        {
                          backgroundColor: order.status === 'delivered'
                            ? theme.colors.secondaryContainer
                            : theme.colors.tertiaryContainer
                        }
                      ]}>
                        <Text style={{
                          color: order.status === 'delivered'
                            ? theme.colors.onSecondaryContainer
                            : theme.colors.onTertiaryContainer,
                          textTransform: 'capitalize'
                        }}>
                          {order.status}
                        </Text>
                      </View>
                    </DataTable.Cell>
                  </DataTable.Row>
                </TouchableOpacity>
              ))}
              <DataTable.Row style={{ backgroundColor: theme.colors.surfaceVariant }}>
                <DataTable.Cell>
                  <Text style={{ fontWeight: 'bold' }}>Total</Text>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ fontWeight: 'bold' }}>
                    {formatCurrency(currentStore.orders.reduce((sum, o) => sum + o.totalAmount, 0))}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell></DataTable.Cell>
              </DataTable.Row>
            </DataTable>
          ) : (
            <View style={styles.emptyDataContainer}>
              <MaterialCommunityIcons
                name="cart-remove"
                size={40}
                color={theme.colors.backdrop}
              />
              <Text style={[styles.emptyDataText, { color: theme.colors.onSurface }]}>
                No orders recorded
              </Text>
              <Button
                mode="contained"
                icon="cart-plus"
                onPress={() => setOrderProducts([])}
                style={{ marginTop: 16 }}
              >
                Create Order
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );

  const DuesTab = () => (
    <View style={styles.tabContent}>
      <Card style={[styles.dataCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title={`Dues (${currentStore?.dues?.length || 0})`}
          titleVariant="titleMedium"
          right={() => (
            <Button
              mode="contained-tonal"
              icon="plus"
              onPress={() => router.push(`/stores/${id}/add-due`)}
              compact
            >
              Add
            </Button>
          )}
        />
        <Card.Content>
          {currentStore?.dues?.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Description</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
              </DataTable.Header>
              {currentStore.dues.map((due) => (
                <DataTable.Row key={due._id}>
                  <DataTable.Cell>
                    {formatDate(due.date)}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    {due.description || 'No description'}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {formatCurrency(due.amount)}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
              <DataTable.Row style={{ backgroundColor: theme.colors.surfaceVariant }}>
                <DataTable.Cell>
                  <Text style={{ fontWeight: 'bold' }}>Total</Text>
                </DataTable.Cell>
                <DataTable.Cell></DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ fontWeight: 'bold' }}>
                    {formatCurrency(currentStore.dues.reduce((sum, d) => sum + d.amount, 0))}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
            </DataTable>
          ) : (
            <View style={styles.emptyDataContainer}>
              <MaterialCommunityIcons
                name="receipt-text-remove"
                size={40}
                color={theme.colors.backdrop}
              />
              <Text style={[styles.emptyDataText, { color: theme.colors.onSurface }]}>
                No dues recorded
              </Text>
              <Button
                mode="contained"
                icon="receipt-plus"
                onPress={() => router.push(`/stores/${id}/add-due`)}
                style={{ marginTop: 16 }}
              >
                Add Due
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Section with ScrollView */}
      <View
        contentContainerStyle={styles.headerScrollContainer}
        stickyHeaderIndices={[0]}
      >
        {/* Store Header Card */}
        <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Title
            title={currentStore?.storeName || 'Store'}
            titleVariant="titleLarge"
            titleStyle={{ fontWeight: 'bold', color: theme.colors.onSurface }}
            subtitle={`Proprietor: ${currentStore?.proprietorName || 'N/A'}`}
            subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
            left={() => (
              <MaterialCommunityIcons
                name="store"
                size={28}
                color={theme.colors.primary}
                style={styles.storeIcon}
              />
            )}
            right={() => (
              <View style={[
                styles.dueBadge,
                {
                  backgroundColor: currentStore?.totalDue > 0
                    ? theme.colors.errorContainer
                    : theme.colors.surfaceVariant
                }
              ]}>
                <Text style={[
                  styles.dueBadgeText,
                  {
                    color: currentStore?.totalDue > 0
                      ? theme.colors.onErrorContainer
                      : theme.colors.onSurfaceVariant
                  }
                ]}>
                  {formatCurrency(currentStore?.totalDue || 0)}
                </Text>
              </View>
            )}
          />
          <Card.Content>
            <View style={styles.storeInfoRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={[styles.storeInfoText, { color: theme.colors.onSurface }]}>
                {currentStore?.address || 'N/A'}, {currentStore?.area || 'N/A'}
              </Text>
            </View>
            <View style={styles.storeInfoRow}>
              <MaterialCommunityIcons
                name="phone"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={[styles.storeInfoText, { color: theme.colors.onSurface }]}>
                {currentStore?.contactNumber || 'N/A'}
              </Text>
            </View>
            <View style={styles.storeInfoRow}>
              <MaterialCommunityIcons
                name="identifier"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={[styles.storeInfoText, { color: theme.colors.onSurface }]}>
                Store Code: {currentStore?.storeCode || 'N/A'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Tab Navigation Section */}
      <View style={styles.tabContainer}>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
            tabBarIndicatorStyle: {
              backgroundColor: theme.colors.primary,
              height: 3,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: 'bold',
              margin: 0,
              padding: 0,
              textTransform: 'none',
            },
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.surfaceVariant,
            },
            tabBarItemStyle: {
              height: 48,
              padding: 0,
            },
            tabBarContentContainerStyle: {
              paddingHorizontal: 16,
            },
          }}
        >
          <Tab.Screen
            name="Overview"
            options={({ navigation }) => ({
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name="view-dashboard"
                  size={24}
                  color={color}
                  style={styles.tabBarIcon}
                />
              ),
              tabBarActiveTintColor: useIsFocused() ? theme.colors.primary : theme.colors.onSurfaceVariant,
            })}
          >
            {() => (
              <ScrollView
                style={styles.tabScrollView}
                contentContainerStyle={styles.tabContentContainer}
              >
                <OverviewTab />
              </ScrollView>
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Payments"
            options={({ navigation }) => ({
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={24}
                  color={color}
                  style={styles.tabBarIcon}
                />
              ),
              tabBarActiveTintColor: useIsFocused() ? theme.colors.primary : theme.colors.onSurfaceVariant,
            })}
          >
            {() => (
              <ScrollView
                style={styles.tabScrollView}
                contentContainerStyle={styles.tabContentContainer}
              >
                <PaymentsTab />
              </ScrollView>
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Orders"
            options={({ navigation }) => ({
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name="cart"
                  size={24}
                  color={color}
                  style={styles.tabBarIcon}
                />
              ),
              tabBarActiveTintColor: useIsFocused() ? theme.colors.primary : theme.colors.onSurfaceVariant,
            })}
          >
            {() => (
              <ScrollView
                style={styles.tabScrollView}
                contentContainerStyle={styles.tabContentContainer}
              >
                <OrdersTab />
              </ScrollView>
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Dues"
            options={({ navigation }) => ({
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name="receipt"
                  size={24}
                  color={color}
                  style={styles.tabBarIcon}
                />
              ),
              tabBarActiveTintColor: useIsFocused() ? theme.colors.primary : theme.colors.onSurfaceVariant,
            })}
          >
            {() => (
              <ScrollView
                style={styles.tabScrollView}
                contentContainerStyle={styles.tabContentContainer}
              >
                <DuesTab />
              </ScrollView>
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={dateFilter}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerScrollContainer: {
    paddingBottom: 8,
  },
  tabContainer: {
    flex: 1,
  },
  tabScrollView: {
    flex: 1,
  },
  tabContentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  storeIcon: {
    marginRight: 10,
  },
  dueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  dueBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  storeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  storeInfoText: {
    marginLeft: 8,
    fontSize: 14,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  dateFilterButton: {
    flex: 1,
  },
  tabContent: {
    gap: 16,
  },
  summaryCard: {
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickActionsCard: {
    borderRadius: 12,
  },
  quickActionsContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '48%',
  },
  dataCard: {
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyDataContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDataText: {
    marginTop: 16,
    textAlign: 'center',
  },
  orderFormContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  addProductContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tabBarIcon: {
    marginBottom: -4,
  },
});

export default StoreDetailsScreen;