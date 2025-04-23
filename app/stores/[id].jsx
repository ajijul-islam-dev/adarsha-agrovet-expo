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
  return `৳${amount?.toLocaleString() || '0'}`;
};

// Tab Components
const OverviewTab = ({ currentStore, id, theme, onRefresh, refreshing }) => {
  const { handleAddStorePayment, handleAddStoreDue, showMessage } = useContext(ServicesProvider);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDueModal, setShowDueModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: '',
    date: new Date()
  });
  const [dueData, setDueData] = useState({
    amount: '',
    description: '',
    date: new Date()
  });
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [submittingDue, setSubmittingDue] = useState(false);

  const handlePaymentSubmit = async () => {
    if (!paymentData.amount || isNaN(paymentData.amount)) {
      showMessage('Please enter a valid amount', 'error');
      return;
    }

    setSubmittingPayment(true);
    try {
      await handleAddStorePayment(id, {
        ...paymentData,
        amount: parseFloat(paymentData.amount),
        date: paymentData.date.toISOString()
      });
      setShowPaymentModal(false);
      setPaymentData({
        amount: '',
        paymentMethod: 'cash',
        notes: '',
        date: new Date()
      });
      onRefresh();
    } catch (error) {
      showMessage('Failed to add payment', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDueSubmit = async () => {
    if (!dueData.amount || isNaN(dueData.amount)) {
      showMessage('Please enter a valid amount', 'error');
      return;
    }

    setSubmittingDue(true);
    try {
      await handleAddStoreDue(id, {
        ...dueData,
        amount: parseFloat(dueData.amount),
        date: dueData.date.toISOString()
      });
      setShowDueModal(false);
      setDueData({
        amount: '',
        description: '',
        date: new Date()
      });
      onRefresh();
    } catch (error) {
      showMessage('Failed to add due', 'error');
    } finally {
      setSubmittingDue(false);
    }
  };

  return (
    <>
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
                  Last Due
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                 ({formatCurrency(currentStore?.dueHistory[currentStore?.dueHistory.length -1]?.amount || 0)})
                 {' '}
          {new Date(currentStore.dueHistory.at(-1)?.createdAt).toLocaleDateString('en-GB')}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Last Payment
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                 ({formatCurrency(currentStore?.paymentHistory[currentStore.paymentHistory.length -1]?.amount || 0)})
                 {' '}
          {new Date(currentStore.paymentHistory.at(-1)?.createdAt).toLocaleDateString('en-GB')}
                </Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Total Orders Count
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                  {(currentStore?.orderHistory.length || 0)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Total Payments
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                  {formatCurrency(currentStore?.totalPaidAmount || 0)}
                </Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Total Bussiness
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                  {formatCurrency(currentStore?.totalFromDues || 0)}
                </Text>
              </View>
              <View style={[styles.summaryItem, styles.highlightItem]}>
                <Text style={[styles.summaryLabel, { color: theme.colors.onPrimaryContainer }]}>
                  Current Dues
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }]}>
                  {formatCurrency(currentStore.totalFromDues- currentStore.totalPaidAmount || 0)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.quickActionsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Title 
            title="Quick Actions" 
            titleVariant="titleMedium" 
            titleStyle={{ color: theme.colors.primary }}
            left={() => <MaterialCommunityIcons name="lightning-bolt" size={24} color={theme.colors.primary} />}
          />
          <Card.Content style={styles.quickActionsContent}>
            <Button
              mode="contained"
              icon="cash-plus"
              style={styles.quickActionButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              onPress={() => setShowPaymentModal(true)}
            >
              Payment
            </Button>
            <Button
              mode="contained"
              icon="cart-plus"
              style={styles.quickActionButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              onPress={() => router.push({
                  pathname: "/product-stock",
                  params: { storeId: id, name: currentStore.storeName }
                })}
            >
              New Order
            </Button>
            <Button
              mode="contained"
              icon="note-plus"
              style={styles.quickActionButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              onPress={() => setShowDueModal(true)}
            >
              Add Due
            </Button>
          </Card.Content>
        </Card>

        <Card style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Title 
            title="Store Information" 
            titleVariant="titleMedium" 
            titleStyle={{ color: theme.colors.primary }}
            left={() => <MaterialCommunityIcons name="information" size={24} color={theme.colors.primary} />}
          />
          <Card.Content>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="store"
                size={20}
                color={theme.colors.primary}
                style={styles.infoIcon}
              />
              <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
                {currentStore?.storeName || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="account"
                size={20}
                color={theme.colors.primary}
                style={styles.infoIcon}
              />
              <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
                {currentStore?.proprietorName || 'N/A'}
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
                {currentStore?.address || 'N/A'}, {currentStore?.area || 'N/A'}
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
                {currentStore?.contactNumber || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="identifier"
                size={20}
                color={theme.colors.primary}
                style={styles.infoIcon}
              />
              <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
                Store Code: {currentStore?.storeCode || 'N/A'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Payment Modal */}
      <Modal 
        visible={showPaymentModal} 
        onDismiss={() => setShowPaymentModal(false)}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
      >
        <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Add Payment</Text>
        
        <TextInput
          label="Amount"
          value={paymentData.amount}
          onChangeText={(text) => setPaymentData({...paymentData, amount: text.replace(/[^0-9.]/g, '')})}
          inputMode="numeric"
          style={styles.modalInput}
          mode="outlined"
        />

        <TextInput
          label="Payment Method"
          value={paymentData.paymentMethod}
          onChangeText={(text) => setPaymentData({...paymentData, paymentMethod: text})}
          style={styles.modalInput}
          mode="outlined"
        />

        <TextInput
          label="Notes"
          value={paymentData.notes}
          onChangeText={(text) => setPaymentData({...paymentData, notes: text})}
          style={styles.modalInput}
          mode="outlined"
          multiline
        />

        <TouchableOpacity 
          onPress={() => setShowPaymentDatePicker(true)}
          style={[styles.datePickerButton, { borderColor: theme.colors.primary }]}
        >
          <Text style={{ color: theme.colors.onSurface }}>
            {paymentData.date.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {showPaymentDatePicker && (
          <DateTimePicker
            value={paymentData.date}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowPaymentDatePicker(false);
              if (date) {
                setPaymentData({...paymentData, date});
              }
            }}
          />
        )}

        <View style={styles.modalButtonContainer}>
          <Button 
            mode="outlined" 
            onPress={() => setShowPaymentModal(false)}
            style={styles.modalButton}
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={handlePaymentSubmit}
            style={styles.modalButton}
            loading={submittingPayment}
          >
            Submit Payment
          </Button>
        </View>
      </Modal>

      {/* Due Modal */}
      <Modal 
        visible={showDueModal} 
        onDismiss={() => setShowDueModal(false)}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
      >
        <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Add Due</Text>
        
        <TextInput
          label="Amount"
          value={dueData.amount}
          onChangeText={(text) => setDueData({...dueData, amount: text.replace(/[^0-9.]/g, '')})}
          inputMode="numeric"
          style={styles.modalInput}
          mode="outlined"
        />

        <TextInput
          label="Description"
          value={dueData.description}
          onChangeText={(text) => setDueData({...dueData, description: text})}
          style={styles.modalInput}
          mode="outlined"
          multiline
        />

        <TouchableOpacity 
          onPress={() => setShowDueDatePicker(true)}
          style={[styles.datePickerButton, { borderColor: theme.colors.primary }]}
        >
          <Text style={{ color: theme.colors.onSurface }}>
            {dueData.date.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {showDueDatePicker && (
          <DateTimePicker
            value={dueData.date}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDueDatePicker(false);
              if (date) {
                setDueData({...dueData, date});
              }
            }}
          />
        )}

        <View style={styles.modalButtonContainer}>
          <Button 
            mode="outlined" 
            onPress={() => setShowDueModal(false)}
            style={styles.modalButton}
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={handleDueSubmit}
            style={styles.modalButton}
            loading={submittingDue}
          >
            Submit Due
          </Button>
        </View>
      </Modal>
    </>
  );
};

const OrdersTab = ({ currentStore, id, theme, loading, refetchStoreDetails }) => {
  const [orderProducts, setOrderProducts] = useState([]);
  const [newOrder, setNewOrder] = useState({
    productId: '',
    quantity: '',
    price: '',
    notes: ''
  });

  if (loading) {
    return (
      <View style={styles.loadingTabContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading orders...</Text>
      </View>
    );
  }

  const addProductToOrder = () => {
    if (!newOrder.productId || !newOrder.quantity) return;

    setOrderProducts([...orderProducts, {
      ...newOrder,
      id: Date.now().toString(),
      quantity: parseInt(newOrder.quantity) || 0,
      price: parseFloat(newOrder.price) || 0
    }]);
    setNewOrder({
      productId: '',
      quantity: '',
      price: '',
      notes: ''
    });
  };

  const removeProductFromOrder = (productId) => {
    setOrderProducts(orderProducts.filter(p => p.id !== productId));
  };

  const handleCreateNewOrder = async () => {
    // Implement your order creation logic here
    // After successful creation:
    setOrderProducts([]);
    await refetchStoreDetails();
  };

  return (
    <ScrollView contentContainerStyle={styles.tabContentContainer}>
      <Card style={[styles.dataCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title={`Orders (${currentStore?.orderHistory?.length || 0})`}
          titleVariant="titleMedium"
          titleStyle={{ color: theme.colors.primary }}
          left={() => <MaterialCommunityIcons name="cart" size={24} color={theme.colors.primary} />}
          right={() => (
            <Button
              mode="contained-tonal"
              icon="plus"
              onPress={() => router.push({
                pathname: '/product-stock',
                params: { storeId: id, name: currentStore.storeName }
              })}
              compact
              style={styles.addButton}
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
                  value={newOrder.quantity}
                  onChangeText={(text) => setNewOrder({ ...newOrder, quantity: text.replace(/[^0-9]/g, '') })}
                  inputMode="numeric"
                  style={{ flex: 1, marginHorizontal: 8 }}
                  dense
                />
                <TextInput
                  label="Price"
                  value={newOrder.price}
                  onChangeText={(text) => setNewOrder({ ...newOrder, price: text.replace(/[^0-9.]/g, '') })}
                  inputMode="numeric"
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
                contentStyle={styles.buttonContent}
              >
                Submit Order
              </Button>
            </View>
          )}

          {currentStore?.orderHistory?.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
              </DataTable.Header>
              {currentStore.orderHistory.map((order) => (
                <Link href={`/all-orders-list/${order._id}`} asChild key={order._id}>
                  <TouchableOpacity>
                    <DataTable.Row>
                      <DataTable.Cell>
                        {formatDateTime(order.createdAt)}
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
                <DataTable.Cell numeric>
                  <Text style={{ fontWeight: 'bold' }}>
                    {formatCurrency(currentStore.totalFromOrders || 0)}
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
              <Button
                mode="contained"
                icon="cart-plus"
                onPress={() => router.push({
                  pathname: '/product-stock',
                  params: {
                    storeId: id,
                    name: currentStore.storeName
                  }
                })}
                style={{ marginTop: 16 }}
                contentStyle={styles.buttonContent}
              >
                Create Order
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const PaymentsTab = ({ currentStore, id, theme, handleAddStorePayment, loading, refetchStoreDetails }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: '',
    date: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <View style={styles.loadingTabContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading payments...</Text>
      </View>
    );
  }

  const handlePaymentSubmit = async () => {
    if (!paymentData.amount || isNaN(paymentData.amount)) {
      showMessage('Please enter a valid amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await handleAddStorePayment(id, {
        ...paymentData,
        amount: parseFloat(paymentData.amount),
        date: paymentData.date.toISOString()
      });
      setShowPaymentModal(false);
      setPaymentData({
        amount: '',
        paymentMethod: 'cash',
        notes: '',
        date: new Date()
      });
      await refetchStoreDetails();
    } catch (error) {
      showMessage('Failed to add payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.tabContentContainer}>
      <Card style={[styles.dataCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title={`Payments (${currentStore?.paymentHistory?.length || 0})`}
          titleVariant="titleMedium"
          titleStyle={{ color: theme.colors.primary }}
          left={() => <MaterialCommunityIcons name="cash-multiple" size={24} color={theme.colors.primary} />}
          right={() => (
            <Button
              mode="contained-tonal"
              icon="plus"
              onPress={() => setShowPaymentModal(true)}
              compact
              style={styles.addButton}
            >
              Add
            </Button>
          )}
        />
        <Card.Content>
          {currentStore?.paymentHistory?.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Method</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
              </DataTable.Header>
              {currentStore.paymentHistory.map((payment) => (
                <DataTable.Row key={payment._id}>
                  <DataTable.Cell>
                    {formatDateTime(payment.createdAt)}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    {payment.paymentMethod || 'N/A'}
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
                <DataTable.Cell numeric>
                  <Text style={{ fontWeight: 'bold' }}>
                    {formatCurrency(currentStore.totalPaidAmount || 0)}
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
              <Button
                mode="contained"
                icon="cash-plus"
                onPress={() => setShowPaymentModal(true)}
                style={{ marginTop: 16 }}
                contentStyle={styles.buttonContent}
              >
                Record Payment
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      <Portal>
        <Modal 
          visible={showPaymentModal} 
          onDismiss={() => setShowPaymentModal(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Add Payment</Text>
          
          <TextInput
            label="Amount"
            value={paymentData.amount}
            onChangeText={(text) => setPaymentData({...paymentData, amount: text.replace(/[^0-9.]/g, '')})}
            inputMode="numeric"
            style={styles.modalInput}
            mode="outlined"
          />

          <TextInput
            label="Payment Method"
            value={paymentData.paymentMethod}
            onChangeText={(text) => setPaymentData({...paymentData, paymentMethod: text})}
            style={styles.modalInput}
            mode="outlined"
          />

          <TextInput
            label="Notes"
            value={paymentData.notes}
            onChangeText={(text) => setPaymentData({...paymentData, notes: text})}
            style={styles.modalInput}
            mode="outlined"
            multiline
          />

          <TouchableOpacity 
            onPress={() => setShowDatePicker(true)}
            style={[styles.datePickerButton, { borderColor: theme.colors.primary }]}
          >
            <Text style={{ color: theme.colors.onSurface }}>
              {paymentData.date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={paymentData.date}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  setPaymentData({...paymentData, date});
                }
              }}
            />
          )}

          <View style={styles.modalButtonContainer}>
            <Button 
              mode="outlined" 
              onPress={() => setShowPaymentModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handlePaymentSubmit}
              style={styles.modalButton}
              loading={submitting}
            >
              Submit Payment
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const DuesTab = ({ currentStore, id, theme, handleAddStoreDue, loading, refetchStoreDetails }) => {
  const [showDueModal, setShowDueModal] = useState(false);
  const [dueData, setDueData] = useState({
    amount: '',
    description: '',
    date: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <View style={styles.loadingTabContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading dues...</Text>
      </View>
    );
  }

  const handleDueSubmit = async () => {
    if (!dueData.amount || isNaN(dueData.amount)) {
      showMessage('Please enter a valid amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await handleAddStoreDue(id, {
        ...dueData,
        amount: parseFloat(dueData.amount),
        date: dueData.date.toISOString()
      });
      setShowDueModal(false);
      setDueData({
        amount: '',
        description: '',
        date: new Date()
      });
      await refetchStoreDetails();
    } catch (error) {
      showMessage('Failed to add due', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
          title={`Dues (${currentStore?.dueHistory?.length || 0})`}
          titleVariant="titleMedium"
          titleStyle={{ color: theme.colors.primary }}
          left={() => <MaterialCommunityIcons name="receipt" size={24} color={theme.colors.primary} />}
          right={() => (
            <Button
              mode="contained-tonal"
              icon="plus"
              onPress={() => setShowDueModal(true)}
              compact
              style={styles.addButton}
            >
              Add
            </Button>
          )}
        />
        <Card.Content>
          {currentStore?.dueHistory?.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Description</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
              </DataTable.Header>
              {currentStore.dueHistory.map(renderDueItem)}
              <DataTable.Row style={{ backgroundColor: theme.colors.surfaceVariant }}>
                <DataTable.Cell>
                  <Text style={{ fontWeight: 'bold' }}>Total</Text>
                </DataTable.Cell>
                <DataTable.Cell></DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ fontWeight: 'bold' }}>
                    {formatCurrency(currentStore.totalFromDues || 0)}
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
                icon="note-plus"
                onPress={() => setShowDueModal(true)}
                style={{ marginTop: 16 }}
                contentStyle={styles.buttonContent}
              >
                Add Due
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      <Portal>
        <Modal 
          visible={showDueModal} 
          onDismiss={() => setShowDueModal(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Add Due</Text>
          
          <TextInput
            label="Amount"
            value={dueData.amount}
            onChangeText={(text) => setDueData({...dueData, amount: text.replace(/[^0-9.]/g, '')})}
            inputMode="numeric"
            style={styles.modalInput}
            mode="outlined"
          />

          <TextInput
            label="Description"
            value={dueData.description}
            onChangeText={(text) => setDueData({...dueData, description: text})}
            style={styles.modalInput}
            mode="outlined"
            multiline
          />

          <TouchableOpacity 
            onPress={() => setShowDatePicker(true)}
            style={[styles.datePickerButton, { borderColor: theme.colors.primary }]}
          >
            <Text style={{ color: theme.colors.onSurface }}>
              {dueData.date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dueData.date}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  setDueData({...dueData, date});
                }
              }}
            />
          )}

          <View style={styles.modalButtonContainer}>
            <Button 
              mode="outlined" 
              onPress={() => setShowDueModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleDueSubmit}
              style={styles.modalButton}
              loading={submitting}
            >
              Submit Due
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

// Main Component
const StoreDetailsScreen = () => {
  const theme = useTheme();
  const { id } = useLocalSearchParams();
  const { 
    currentStore, 
    loading, 
    handleGetStoreById,
    handleAddStorePayment,
    handleAddStoreDue,
    showMessage
  } = useContext(ServicesProvider);

  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const indicatorPosition = useRef(new Animated.Value(0)).current;

  const refetchStoreDetails = async () => {
    setRefreshing(true);
    await handleGetStoreById(id);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setInitialLoad(true);
      await handleGetStoreById(id);
      setInitialLoad(false);
    };
    loadData();
  }, [id]);

  const onRefresh = async () => {
    await refetchStoreDetails();
  };

  const handleTabChange = (e) => {
    const index = e?.data?.state?.index ?? 0;
    setTabIndex(index);
    Animated.spring(indicatorPosition, {
      toValue: index * (Dimensions.get('window').width / 4),
      useNativeDriver: true,
    }).start();
  };

  if (initialLoad || (loading && !refreshing && !currentStore)) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Loading Store..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading store details...</Text>
        </View>
      </View>
    );
  }

  if (!currentStore && !loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Store Not Found" />
        </Appbar.Header>
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
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content 
          title={currentStore?.storeName || 'Store Details'} 
          subtitle={`Balance: ${formatCurrency(currentStore?.totalFinalDues || 0)}`}
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
                currentStore={currentStore} 
                id={id} 
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
                currentStore={currentStore} 
                id={id} 
                theme={theme}
                loading={loading && !refreshing}
                refetchStoreDetails={refetchStoreDetails}
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
                currentStore={currentStore} 
                id={id} 
                theme={theme}
                handleAddStorePayment={handleAddStorePayment}
                showMessage={showMessage}
                loading={loading && !refreshing}
                refetchStoreDetails={refetchStoreDetails}
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
                currentStore={currentStore} 
                id={id} 
                theme={theme}
                handleAddStoreDue={handleAddStoreDue}
                showMessage={showMessage}
                loading={loading && !refreshing}
                refetchStoreDetails={refetchStoreDetails}
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
    width: Dimensions.get('window').width / 4,
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
  quickActionsCard: {
    borderRadius: 12,
    marginBottom: 16,
  },
  quickActionsContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '30%',
    height: 50,
  },
  buttonContent: {
    height: 44,
  },
  buttonLabel: {
    fontSize: 12,
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
  addButton: {
    marginRight: 8,
  },
  modalContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  datePickerButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: 'center',
  },
});

export default StoreDetailsScreen;