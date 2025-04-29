import React, { useState, useContext, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, Animated } from 'react-native';
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
  Paragraph,
  IconButton
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
  const [confirmDialog, setConfirmDialog] = useState({ 
    visible: false, 
    type: null,
    loading: false 
  });
  const [initialLoad, setInitialLoad] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    handleGetOrderById,
    handleApproveOrder,
    handleRejectOrder,
    handleUpdateOrderStatus,
    handleCancelOrder,
    handleSubmitDraftOrder,
    user,
    showMessage
  } = useContext(ServicesProvider);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const result = await handleGetOrderById(id);
        if (result.success) {
          setOrder(result.order);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
        showMessage('Failed to load order details', 'error');
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

  const handleAction = async (action) => {
    try {
      setConfirmDialog(prev => ({ ...prev, loading: true }));
      
      let result;
      switch (action) {
        case 'approve':
          result = await handleApproveOrder(id);
          break;
        case 'fulfill':
          result = await handleUpdateOrderStatus(id, 'fulfilled');
          break;
        case 'reject':
          result = await handleUpdateOrderStatus(id, 'rejected');
          break;
        case 'cancel':
          result = await handleCancelOrder(id);
          break;
        case 'submit':
          result = await handleSubmitDraftOrder();
          if (result.success) {
            showMessage('Draft submitted successfully!', 'success');
          }
          break;
        default:
          break;
      }

      if (result?.success) {
        setOrder(prev => ({ 
          ...prev, 
          status: action === 'cancel' ? 'cancelled' : 
                 action === 'submit' ? 'pending' : 
                 action 
        }));
        if (action !== 'submit') {
          router.back();
        }
      }
    } catch (error) {
      console.error(`${action} failed:`, error);
      showMessage(`Failed to ${action} order`, 'error');
    } finally {
      setConfirmDialog({ visible: false, type: null, loading: false });
      setModalVisible(false);
    }
  };

  if (initialLoad || (loading && !order)) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Loading Order..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading order details...</Text>
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

  const isOrderOwner = false; // order.createdBy?._id === user?._id;
  //alert(isOrderOwner)
  const canManageOrder = (
    (order.status === 'pending' && user?.role === 'admin') ||
    (order.status === 'approved' && user?.role === 'stock-manager') ||
    (user?.role === 'officer' && isOrderOwner && 
      (order.status === 'draft' || order.status === 'pending' || order.status === 'approved'))
  );

  const getStatusColor = () => {
    switch (order.status) {
      case 'approved': return theme.colors.primary;
      case 'rejected': return theme.colors.error;
      case 'fulfilled': return theme.colors.secondary;
      case 'draft': return theme.colors.onSurfaceVariant;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusBackgroundColor = () => {
    switch (order.status) {
      case 'approved': return theme.colors.primaryContainer;
      case 'rejected': return theme.colors.errorContainer;
      case 'fulfilled': return theme.colors.secondaryContainer;
      case 'draft': return theme.colors.surfaceVariant;
      default: return theme.colors.surfaceVariant;
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Order Details" />
        {canManageOrder && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
          >
            <Menu.Item 
              onPress={() => setModalVisible(true)} 
              title="Order Actions" 
              leadingIcon="cog" 
            />
          </Menu>
        )}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusContainer}>
          <ProgressBar
            progress={
              order.status === 'draft' ? 0.1 :
              order.status === 'pending' ? 0.3 :
              order.status === 'approved' ? 0.6 :
              order.status === 'fulfilled' ? 1 : 0
            }
            color={getStatusColor()}
            style={styles.progressBar}
          />
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: getStatusBackgroundColor() }
            ]}
            textStyle={{ color: getStatusColor() }}
          >
            {order.status.toUpperCase()}
          </Chip>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <Text variant="titleMedium">{order.createdBy?.name || 'N/A'}</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                {order.status === 'draft' ? 'Draft' : formatDate(order.submittedAt)} • {order.status !== 'draft' && formatTime(order.submittedAt)}
              </Text>
            </View>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            <View style={styles.row}>
              <Text>Total Amount:</Text>
              <Text>৳{order.orderTotal?.toLocaleString()}</Text>
            </View>
            {order.status !== 'draft' && (
              <>
                <View style={styles.row}>
                  <Text>Discount:</Text>
                  <Text style={{ color: theme.colors.error }}>-৳{order?.totalDiscount?.toLocaleString()} </Text>
                </View>
                <View style={[styles.row, { marginTop: 8 }]}>
                  <Text variant="titleSmall">Subtotal:</Text>
                  <Text variant="titleSmall">৳{(Number(order.orderTotal) - Number(order?.totalDiscount || 0)).toLocaleString()}</Text>
                </View>
              </>
            )}
            <View style={[styles.row, { marginTop: 8 }]}>
              <MaterialIcons name="payment" size={20} color={theme.colors.primary} />
              <Text style={{ marginLeft: 8 }}>Paid via {order.paymentMethod || 'cash'}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Products ({order.products?.length || 0})</Text>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            {order.products?.map((product, index) => (
              <View key={product._id || index}>
                <View style={styles.productRow}>
                  <View style={styles.productInfo}>
                    <Text variant="bodyLarge" style={styles.productName}>
                      {product.productName || product.name} {product.packSize + ' '}    
                      {product.unit}
                    </Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                      {product.quantity} × ৳{product.price?.toLocaleString()}
                      {product.bonusQuantity > 0 && (
                        <Text style={{ color: theme.colors.primary }}> (+{product.bonusQuantity} bonus)</Text>
                      )}
                      {product.discountPercentage > 0 && (
                        <Text style={{ color: theme.colors.primary }}> (-{product.discountPercentage}% disc)</Text>
                      )}
                    </Text>
                  </View>
                  <Text variant="bodyLarge" style={styles.productTotal}>
                    ৳{(product.price * product.quantity).toLocaleString()}
                  </Text>
                </View>
                {index < order.products.length - 1 && (
                  <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
                )}
              </View>
            ))}
          </Card.Content>
        </Card>

        {order.status !== 'draft' && (
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
        )}

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

      <Portal>
        {canManageOrder && (
          <FAB
            icon="cog"
            label="Order Actions"
            onPress={() => setModalVisible(true)}
            style={{...styles.fab, backgroundColor: theme.colors.primary}}
            color="white"
          />
        )}

        <Modal 
          visible={modalVisible} 
          onDismiss={() => setModalVisible(false)} 
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.background }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleMedium" style={styles.modalTitle}>Order Actions</Text>
            <IconButton 
              icon="close" 
              size={20} 
              onPress={() => setModalVisible(false)} 
            />
          </View>
          
          <View style={styles.modalContent}>
            {user?.role === 'admin' && order.status === 'pending' && (
              <>
                <Button
                  icon="check"
                  mode="contained"
                  onPress={() => setConfirmDialog({ visible: true, type: 'approve', loading: false })}
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                >
                  Approve Order
                </Button>
                <Button
                  icon="close"
                  mode="outlined"
                  textColor={theme.colors.error}
                  onPress={() => setConfirmDialog({ visible: true, type: 'reject', loading: false })}
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                >
                  Reject Order
                </Button>
              </>
            )}

            {user?.role === 'stock-manager' && order.status === 'approved' && (
              <>
                <Button
                  icon="check"
                  mode="contained"
                  onPress={() => setConfirmDialog({ visible: true, type: 'fulfill', loading: false })}
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                >
                  Fulfill Order
                </Button>
                <Button
                  icon="close"
                  mode="outlined"
                  textColor={theme.colors.error}
                  onPress={() => setConfirmDialog({ visible: true, type: 'reject', loading: false })}
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                >
                  Reject Order
                </Button>
              </>
            )}

            {user?.role === 'officer' && isOrderOwner && (
              <>
                {order.status === 'draft' && (
                  <Button
                    icon="send"
                    mode="contained"
                    onPress={() => setConfirmDialog({ visible: true, type: 'submit', loading: false })}
                    style={styles.actionButton}
                    contentStyle={styles.buttonContent}
                  >
                    Submit Draft
                  </Button>
                )}

                {(order.status === 'pending' || order.status === 'approved') && (
                  <Button
                    icon="cancel"
                    mode="outlined"
                    textColor={theme.colors.error}
                    onPress={() => setConfirmDialog({ visible: true, type: 'cancel', loading: false })}
                    style={styles.actionButton}
                    contentStyle={styles.buttonContent}
                  >
                    Cancel Order
                  </Button>
                )}
              </>
            )}
          </View>
        </Modal>

        <Dialog 
          visible={confirmDialog.visible} 
          onDismiss={() => !confirmDialog.loading && setConfirmDialog({ visible: false, type: null, loading: false })}
        >
          <Dialog.Title>Confirm Action</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {confirmDialog.type === 'approve' && 'Are you sure you want to approve this order?'}
              {confirmDialog.type === 'fulfill' && 'Are you sure you want to fulfill this order?'}
              {confirmDialog.type === 'reject' && 'Are you sure you want to reject this order?'}
              {confirmDialog.type === 'cancel' && 'Are you sure you want to cancel this order?'}
              {confirmDialog.type === 'submit' && 'Are you sure you want to submit this draft order?'}
            </Paragraph>
            {confirmDialog.type === 'submit' && (
              <Paragraph style={{ marginTop: 8, fontStyle: 'italic' }}>
                Once submitted, the order will need to be approved by an admin.
              </Paragraph>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => !confirmDialog.loading && setConfirmDialog({ visible: false, type: null, loading: false })}
              disabled={confirmDialog.loading}
            >
              Cancel
            </Button>
            <Button
              onPress={() => handleAction(confirmDialog.type)}
              loading={confirmDialog.loading}
              disabled={confirmDialog.loading}
            >
              {confirmDialog.loading ? 'Processing...' : 'Confirm'}
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
    padding: 0,
    marginHorizontal: 24,
    borderRadius: 12,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  buttonContent: {
    height: 48,
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