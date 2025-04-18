import React, { useState, useEffect, useContext, useRef } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, Dimensions } from "react-native";
import { Text, Card, Button, DataTable, TextInput, IconButton, useTheme, Appbar, Modal, Portal } from "react-native-paper";
import { useLocalSearchParams, router, Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ServicesProvider } from '../../provider/Provider.jsx';

const Tab = createMaterialTopTabNavigator();

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (amount) => {
  return `৳${amount?.toLocaleString('en-IN') || '0'}`;
};

// Tab Components
const OverviewTab = ({ officerData, theme, onRefresh, refreshing }) => {
  return (
    <ScrollView 
      contentContainerStyle={styles.tabContentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title 
          title="Financial Summary" 
          titleVariant="titleMedium" 
          titleStyle={{ color: theme.colors.primary }}
          left={() => <MaterialCommunityIcons name="finance" size={24} color={theme.colors.primary} />}
        />
        <Card.Content>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Stores
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                {officerData?.financials?.storeCount || 0}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Orders
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                {officerData?.financials?.orderCount || 0}
              </Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Payments
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                {formatCurrency(officerData?.financials?.totalPayments || 0)}
              </Text>
            </View>
            <View style={[styles.summaryItem, styles.highlightItem]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.onPrimaryContainer }]}>
                Net Dues
              </Text>
              <Text style={[styles.summaryValue, { 
                color: officerData?.financials?.netDues > 0 ? theme.colors.error : theme.colors.primary,
                fontWeight: 'bold' 
              }]}>
                {formatCurrency(officerData?.financials?.netDues || 0)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title 
          title="Officer Information" 
          titleVariant="titleMedium" 
          titleStyle={{ color: theme.colors.primary }}
          left={() => <MaterialCommunityIcons name="account-details" size={24} color={theme.colors.primary} />}
        />
        <Card.Content>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="account"
              size={20}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              {officerData?.name || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="email"
              size={20}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              {officerData?.email || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="phone"
              size={20}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              {officerData?.phone || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              Area: {officerData?.area || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="badge-account"
              size={20}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              Role: {officerData?.role || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar"
              size={20}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              Joined: {formatDate(officerData?.createdAt)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const OrdersTab = ({ officerData, theme, loading }) => {
  if (loading) {
    return (
      <View style={styles.loadingTabContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContentContainer}>
      <Card style={[styles.dataCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title={`Orders (${officerData?.histories?.orders?.length || 0})`}
          titleVariant="titleMedium"
          titleStyle={{ color: theme.colors.primary }}
          left={() => <MaterialCommunityIcons name="cart" size={24} color={theme.colors.primary} />}
        />
        <Card.Content>
          {officerData?.histories?.orders?.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Store</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
              </DataTable.Header>
              {officerData.histories.orders.map((order) => (
                <Link href={`/all-orders-list/${order._id}`} asChild key={order._id}>
                  <TouchableOpacity>
                    <DataTable.Row>
                      <DataTable.Cell>
                        {formatDateTime(order.createdAt)}
                      </DataTable.Cell>
                      <DataTable.Cell>
                        {order.store?.storeName || 'N/A'}
                      </DataTable.Cell>
                      <DataTable.Cell>
                        <View style={[
                          styles.statusBadge,
                          {
                            backgroundColor: order.status === 'completed'
                              ? theme.colors.secondaryContainer
                              : theme.colors.tertiaryContainer
                          }
                        ]}>
                          <Text style={{
                            color: order.status === 'completed'
                              ? theme.colors.onSecondaryContainer
                              : theme.colors.onTertiaryContainer,
                            textTransform: 'capitalize'
                          }}>
                            {order.status}
                          </Text>
                        </View>
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        {formatCurrency(order.orderTotal)}
                      </DataTable.Cell>
                    </DataTable.Row>
                  </TouchableOpacity>
                </Link>
              ))}
              <DataTable.Row style={{ backgroundColor: theme.colors.surfaceVariant }}>
                <DataTable.Cell>
                  <Text style={{ fontWeight: 'bold' }}>Total</Text>
                </DataTable.Cell>
                <DataTable.Cell></DataTable.Cell>
                <DataTable.Cell></DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ fontWeight: 'bold' }}>
                    {formatCurrency(officerData?.financials?.totalOrdersValue || 0)}
                  </Text>
                </DataTable.Cell>
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
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const PaymentsTab = ({ officerData, theme, loading }) => {
  if (loading) {
    return (
      <View style={styles.loadingTabContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContentContainer}>
      <Card style={[styles.dataCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title={`Payments (${officerData?.histories?.payments?.length || 0})`}
          titleVariant="titleMedium"
          titleStyle={{ color: theme.colors.primary }}
          left={() => <MaterialCommunityIcons name="cash-multiple" size={24} color={theme.colors.primary} />}
        />
        <Card.Content>
          {officerData?.histories?.payments?.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Store</DataTable.Title>
                <DataTable.Title>Method</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
              </DataTable.Header>
              {officerData.histories.payments.map((payment) => (
                <DataTable.Row key={payment._id}>
                  <DataTable.Cell>
                    {formatDateTime(payment.date || payment.createdAt)}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    {payment.store?.storeName || 'N/A'}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    {payment.paymentMethod || 'cash'}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {formatCurrency(payment.amount)}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
              <DataTable.Row style={{ backgroundColor: theme.colors.surfaceVariant }}>
                <DataTable.Cell>
                  <Text style={{ fontWeight: 'bold' }}>Total</Text>
                </DataTable.Cell>
                <DataTable.Cell></DataTable.Cell>
                <DataTable.Cell></DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ fontWeight: 'bold' }}>
                    {formatCurrency(officerData?.financials?.totalPayments || 0)}
                  </Text>
                </DataTable.Cell>
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
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const DuesTab = ({ officerData, theme, loading }) => {
  if (loading) {
    return (
      <View style={styles.loadingTabContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading dues...</Text>
      </View>
    );
  }

  const renderDueItem = (due) => {
    if (due.type === 'by_order') {
      return (
        <Link href={`/all-orders-list/${due.orderId}`} asChild key={`order-due-${due.orderId}`}>
          <TouchableOpacity>
            <DataTable.Row>
              <DataTable.Cell>
                {formatDateTime(due.createdAt)}
              </DataTable.Cell>
              <DataTable.Cell>
                Order #{due.orderId?.slice(-6) || 'N/A'}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {formatCurrency(due.amount)}
              </DataTable.Cell>
            </DataTable.Row>
          </TouchableOpacity>
        </Link>
      );
    }
    
    return (
      <DataTable.Row key={`manual-due-${due._id || due.date}`}>
        <DataTable.Cell>
          {formatDate(due.date)}
        </DataTable.Cell>
        <DataTable.Cell>
          {due.description || 'Manual Due'}
        </DataTable.Cell>
        <DataTable.Cell numeric>
          {formatCurrency(due.amount)}
        </DataTable.Cell>
      </DataTable.Row>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.tabContentContainer}>
      <Card style={[styles.dataCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title={`Dues (${officerData?.histories?.combinedDues?.length || 0})`}
          titleVariant="titleMedium"
          titleStyle={{ color: theme.colors.primary }}
          left={() => <MaterialCommunityIcons name="receipt" size={24} color={theme.colors.primary} />}
        />
        <Card.Content>
          {officerData?.histories?.combinedDues?.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Description</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
              </DataTable.Header>
              {officerData.histories.combinedDues.map(renderDueItem)}
              <DataTable.Row style={{ backgroundColor: theme.colors.surfaceVariant }}>
                <DataTable.Cell>
                  <Text style={{ fontWeight: 'bold' }}>Total</Text>
                </DataTable.Cell>
                <DataTable.Cell></DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ fontWeight: 'bold' }}>
                    {formatCurrency(officerData?.financials?.totalOrdersValue + officerData?.financials?.totalManualDues || 0)}
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
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const StoresTab = ({ officerData, theme, loading }) => {
  if (loading) {
    return (
      <View style={styles.loadingTabContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading stores...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContentContainer}>
      <Card style={[styles.dataCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title={`Stores (${officerData?.stores?.length || 0})`}
          titleVariant="titleMedium"
          titleStyle={{ color: theme.colors.primary }}
          left={() => <MaterialCommunityIcons name="store" size={24} color={theme.colors.primary} />}
        />
        <Card.Content>
          {officerData?.stores?.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Store Name</DataTable.Title>
                <DataTable.Title>Proprietor</DataTable.Title>
                <DataTable.Title numeric>Balance</DataTable.Title>
              </DataTable.Header>
              {officerData.stores.map((store) => (
                <Link href={`/stores/${store._id}`} asChild key={store._id}>
                  <TouchableOpacity>
                    <DataTable.Row>
                      <DataTable.Cell>
                        {store.storeName}
                      </DataTable.Cell>
                      <DataTable.Cell>
                        {store.proprietorName}
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        {formatCurrency(store.totalFinalDues || 0)}
                      </DataTable.Cell>
                    </DataTable.Row>
                  </TouchableOpacity>
                </Link>
              ))}
            </DataTable>
          ) : (
            <View style={styles.emptyDataContainer}>
              <MaterialCommunityIcons
                name="store-remove"
                size={40}
                color={theme.colors.backdrop}
              />
              <Text style={[styles.emptyDataText, { color: theme.colors.onSurface }]}>
                No stores assigned
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

// Main Component
const OfficerDetailsScreen = () => {
  const theme = useTheme();
  const { id } = useLocalSearchParams();
  const { 
    currentOfficer, 
    loading, 
    handleGetOfficerById,
    showMessage
  } = useContext(ServicesProvider);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  
  const indicatorPosition = useRef(new Animated.Value(0)).current;

  const refetchOfficerDetails = async () => {
    setRefreshing(true);
    await handleGetOfficerById(id);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setInitialLoad(true);
      await handleGetOfficerById(id);
      setInitialLoad(false);
    };
    loadData();
  }, [id]);

  const onRefresh = async () => {
    await refetchOfficerDetails();
  };

  const handleTabChange = (e) => {
    const index = e?.data?.state?.index ?? 0;
    setTabIndex(index);
    Animated.spring(indicatorPosition, {
      toValue: index * (Dimensions.get('window').width / 5),
      useNativeDriver: true,
    }).start();
  };

  if (initialLoad || (loading && !refreshing && !currentOfficer)) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Loading Officer..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading officer details...</Text>
        </View>
      </View>
    );
  }

  if (!currentOfficer && !loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Officer Not Found" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons 
            name="account-remove" 
            size={40} 
            color={theme.colors.error} 
          />
          <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Officer not found</Text>
          <Button 
            mode="contained" 
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          >
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content 
          title={currentOfficer?.name || 'Officer Details'} 
          subtitle={`${currentOfficer?.role} | ${currentOfficer?.area}`}
        />
        <Appbar.Action 
          icon="refresh" 
          onPress={onRefresh} 
          animated={true}
        />
      </Appbar.Header>

      <View style={styles.tabContainer}>
        <Tab.Navigator
          initialRouteName="Overview"
          screenListeners={{
            state: handleTabChange,
          }}
          screenOptions={{
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
            tabBarIndicator: () => (
              <Animated.View 
                style={[
                  styles.tabIndicator,
                  { 
                    backgroundColor: theme.colors.primary,
                    transform: [{ translateX: indicatorPosition }] 
                  }
                ]}
              />
            ),
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: 'bold',
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
            },
            tabBarContentContainerStyle: {
              paddingHorizontal: 16,
            },
          }}
        >
          <Tab.Screen
            name="Overview"
            children={() => (
              <OverviewTab 
                officerData={currentOfficer} 
                theme={theme} 
                onRefresh={onRefresh} 
                refreshing={refreshing} 
              />
            )}
            options={{
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons
                  name="view-dashboard"
                  size={24}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Orders"
            children={() => (
              <OrdersTab 
                officerData={currentOfficer} 
                theme={theme}
                loading={loading && !refreshing}
              />
            )}
            options={{
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons
                  name="cart"
                  size={24}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Payments"
            children={() => (
              <PaymentsTab 
                officerData={currentOfficer} 
                theme={theme}
                loading={loading && !refreshing}
              />
            )}
            options={{
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={24}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Dues"
            children={() => (
              <DuesTab 
                officerData={currentOfficer} 
                theme={theme}
                loading={loading && !refreshing}
              />
            )}
            options={{
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons
                  name="receipt"
                  size={24}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Stores"
            children={() => (
              <StoresTab 
                officerData={currentOfficer} 
                theme={theme}
                loading={loading && !refreshing}
              />
            )}
            options={{
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons
                  name="store"
                  size={24}
                  color={color}
                />
              ),
            }}
          />
        </Tab.Navigator>
      </View>
    </View>
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
    padding: 20,
  },
  loadingTabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  tabContainer: {
    flex: 1,
  },
  tabContentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  tabIndicator: {
    position: 'absolute',
    height: 3,
    bottom: 0,
    width: Dimensions.get('window').width / 5,
  },
  summaryCard: {
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  highlightItem: {
    backgroundColor: '#E3F2FD',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoCard: {
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default OfficerDetailsScreen;