import React, { useState, useContext, useEffect,useRef } from 'react';
import { ScrollView, StyleSheet, View, Animated, Dimensions } from 'react-native';
import {
  Appbar,
  Card,
  Text,
  Divider,
  Chip,
  Button,
  useTheme,
  ProgressBar,
  Menu,
  ActivityIndicator,
  FAB,
  Portal,
  Modal,
  Dialog,
  Paragraph
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { ServicesProvider } from '../../provider/Provider.jsx';

const OrderDetailsScreen = () => {
  const theme = useTheme();
  const { id } = useLocalSearchParams();
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, type: null });
  const [initialLoad, setInitialLoad] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    handleGetOrderById,
    handleApproveOrder,
    handleRejectOrder,
    handleUpdateOrderStatus
  } = useContext(ServicesProvider);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const result = await handleGetOrderById(id);
        if (result.success) {
          setOrder(result.order);
          // Fade in animation when data loads
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchOrder();

    return () => {
      fadeAnim.setValue(0);
    };
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      const result = await handleApproveOrder(id);
      if (result.success) {
        setOrder(prev => ({ ...prev, status: 'approved' }));
      }
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      const result = await handleRejectOrder(id, 'Rejected by admin');
      if (result.success) {
        setOrder(prev => ({ ...prev, status: 'rejected' }));
      }
    } catch (error) {
      console.error('Rejection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad || (loading && !order)) {
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

  if (!order && !loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Order Not Found" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <MaterialIcons 
            name="error-outline" 
            size={40} 
            color={theme.colors.error} 
          />
          <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Order not found</Text>
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
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Order Details" />
        {order.status === 'pending' && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
          >
            <Menu.Item onPress={() => setModalVisible(true)} title="Manage Order" leadingIcon="cog" />
          </Menu>
        )}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusContainer}>
          <ProgressBar
            progress={order.status === 'pending' ? 0.5 : 1}
            color={
              order.status === 'approved' ? theme.colors.primary :
              order.status === 'rejected' ? theme.colors.error :
              theme.colors.onSurfaceVariant
            }
            style={styles.progressBar}
          />
          <Chip
            style={[
              styles.statusChip,
              {
                backgroundColor:
                  order.status === 'approved' ? theme.colors.primaryContainer :
                  order.status === 'rejected' ? theme.colors.errorContainer :
                  theme.colors.surfaceVariant
              }
            ]}
            textStyle={{
              color:
                order.status === 'approved' ? theme.colors.primary :
                order.status === 'rejected' ? theme.colors.error :
                theme.colors.onSurfaceVariant
            }}
          >
            {order.status.toUpperCase()}
          </Chip>
        </View>

        {/* Order Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <Text variant="titleMedium">Ordered by {order.createdBy.name}</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                {formatDate(order.submittedAt)} • {formatTime(order.submittedAt)}
              </Text>
            </View>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            <View style={styles.row}>
              <Text>Subtotal:</Text>
              <Text>৳{order.orderTotal?.toLocaleString()}</Text>
            </View>
            <View style={styles.row}>
              <Text>Discount:</Text>
              <Text style={{ color: theme.colors.error }}>-৳{order.totalDiscount?.toLocaleString()} ({order.orderFinalTotal.discountPercentage.toLocaleString()}℅)</Text>
            </View>
            <View style={[styles.row, { marginTop: 8 }]}>
              <Text variant="titleSmall">Total:</Text>
              <Text variant="titleSmall">৳{order.orderFinalTotal?.finalAmount?.toLocaleString()}</Text>
            </View>
            <View style={[styles.row, { marginTop: 8 }]}>
              <MaterialIcons name="payment" size={20} color={theme.colors.primary} />
              <Text style={{ marginLeft: 8 }}>Paid via {order.paymentMethod || 'cash'}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Products */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Products ({order.products?.length || 0})</Text>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            {order.products?.map((product, index) => (
              <View key={product._id || index}>
                <View style={styles.productRow}>
                  <View style={styles.productInfo}>
                    <Text variant="bodyLarge" style={styles.productName}>
                      {product.productName || product.name}
                    </Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                      {product.quantity} {product.unit} × ৳{product.price?.toLocaleString()}
                      {product.bonusQuantity > 0 && (
                        <Text style={{ color: theme.colors.primary }}> (+{product.bonusQuantity} bonus)</Text>
                      )}
                      {product.discountPercentage > 0 && (
                        <Text style={{ color: theme.colors.primary }}> (-{product.discountPercentage}% disc)</Text>
                      )}
                    </Text>
                  </View>
                  <Text variant="bodyLarge" style={styles.productTotal}>
                    ৳{(product.quantity * product.price)?.toLocaleString()}
                  </Text>
                </View>
                {index < order.products.length - 1 && (
                  <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
                )}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Store Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Store Information</Text>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            <View style={styles.infoRow}>
              <MaterialIcons name="store" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Store Name</Text>
                <Text>{order.store?.storeName || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Proprietor</Text>
                <Text>{order.store?.proprietorName || 'N/A'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Additional Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Additional Information</Text>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Created By</Text>
                <Text>{order.createdBy?.name || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="notes" size={20} color={theme.colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Notes</Text>
                <Text>{order.notes || 'No notes provided'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB & Modals */}
      <Portal>
        {order.status === 'pending' && (
          <FAB
            icon="cog"
            label="Manage Order"
            onPress={() => setModalVisible(true)}
            style={{...styles.fab,backgroundColor : theme.colors.primary}}
            color="white"
          />
        )}

        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>Order Actions</Text>
          <Button
            icon="check"
            mode="contained"
            onPress={() => setConfirmDialog({ visible: true, type: 'approve' })}
            style={{ marginBottom: 12 }}
          >
            Approve Order
          </Button>
          <Button
            icon="close"
            mode="outlined"
            textColor={theme.colors.error}
            onPress={() => setConfirmDialog({ visible: true, type: 'reject' })}
          >
            Reject Order
          </Button>
        </Modal>

        <Dialog visible={confirmDialog.visible} onDismiss={() => setConfirmDialog({ visible: false, type: null })}>
          <Dialog.Title>Confirm Action</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to {confirmDialog.type === 'approve' ? 'approve' : 'reject'} this order?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialog({ visible: false, type: null })}>Cancel</Button>
            <Button
              onPress={async () => {
                setConfirmDialog({ visible: false, type: null });
                if (confirmDialog.type === 'approve') await handleApprove();
                else await handleReject();
                setModalVisible(false);
              }}
            >
              Yes
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  divider: {
    marginVertical: 12,
    height: 1,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: 'bold',
  },
  productTotal: {
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  infoTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    zIndex: 10,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  statusContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    width: '100%',
    marginBottom: 8,
    borderRadius: 2,
  },
  statusChip: {
    alignSelf: 'center',
  },
});

export default OrderDetailsScreen;