import { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, FAB } from 'react-native-paper';

const ProductDetailsScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [product, setProduct] = useState({
    id,
    name: 'Organic Fertilizer',
    price: '$19.99',
    description: 'High-quality organic fertilizer for better crop yield.',
    stock: 50,
    image: 'https://via.placeholder.com/300',
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [stockChange, setStockChange] = useState(1);
  const [orderQuantity, setOrderQuantity] = useState(1);

  // Ensure valid input
  const handleStockInput = (value) => {
    setStockChange(value === '' ? '' : Math.max(1, parseInt(value) || 1));
  };

  const handleOrderInput = (value) => {
    setOrderQuantity(value === '' ? '' : Math.max(1, parseInt(value) || 1));
  };

  const updateStock = (type) => {
    setProduct((prev) => ({
      ...prev,
      stock: type === 'increase' ? prev.stock + stockChange : Math.max(0, prev.stock - stockChange),
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={product.name} />
        <Appbar.Action icon="pencil" onPress={() => alert('Edit product')} />
        <Appbar.Action icon="delete" onPress={() => alert('Delete product')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={{ uri: product.image }} style={styles.image} />

        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>{product.price}</Text>
          <Text style={styles.description}>{product.description}</Text>
          <Text style={styles.stock}>Stock: {product.stock}</Text>

          {/* Order Counter */}
          <View style={styles.counterContainer}>
            <TouchableOpacity onPress={() => setOrderQuantity(Math.max(1, orderQuantity - 1))} style={styles.counterButton}>
              <Text style={styles.counterText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.counterInput}
              value={orderQuantity.toString()}
              keyboardType="numeric"
              onChangeText={handleOrderInput}
            />
            <TouchableOpacity onPress={() => setOrderQuantity(orderQuantity + 1)} style={styles.counterButton}>
              <Text style={styles.counterText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Order Buttons */}
          <View style={styles.orderButtons}>
            <TouchableOpacity style={styles.orderButtonPrimary}>
              <Text style={styles.buttonText}>Order Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.orderButtonSecondary}>
              <Text style={styles.buttonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <FAB style={styles.fab} icon="plus" onPress={() => setModalVisible(true)} />

      {/* Stock Update Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Stock</Text>

            {/* Stock Counter */}
            <View style={styles.counterContainer}>
              <TouchableOpacity onPress={() => setStockChange(Math.max(1, stockChange - 1))} style={styles.counterButton}>
                <Text style={styles.counterText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.counterInput}
                value={stockChange.toString()}
                keyboardType="numeric"
                onChangeText={handleStockInput}
              />
              <TouchableOpacity onPress={() => setStockChange(stockChange + 1)} style={styles.counterButton}>
                <Text style={styles.counterText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.increaseButton} onPress={() => updateStock('increase')}>
                <Text style={styles.buttonText}>Increase</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.decreaseButton} onPress={() => updateStock('decrease')}>
                <Text style={styles.buttonText}>Decrease</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProductDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContainer: { paddingBottom: 20 },
  image: { width: '100%', height: 200, resizeMode: 'cover' },
  detailsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    elevation: 2,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  price: { fontSize: 18, color: '#27AE60', fontWeight: '600', marginBottom: 10 },
  description: { fontSize: 16, color: '#555', lineHeight: 22 },
  stock: { fontSize: 16, fontWeight: 'bold', color: '#555', marginTop: 10 },

  // Counter
  counterContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  counterButton: { backgroundColor: '#ddd', padding: 10, borderRadius: 5, marginHorizontal: 5 },
  counterText: { fontSize: 20, fontWeight: 'bold' },
  counterInput: {
    width: 50,
    height: 40,
    textAlign: 'center',
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },

  // Order Buttons
  orderButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  orderButtonPrimary: { flex: 1, backgroundColor: '#27AE60', padding: 12, alignItems: 'center', borderRadius: 5, marginRight: 5 },
  orderButtonSecondary: { flex: 1, backgroundColor: '#3498DB', padding: 12, alignItems: 'center', borderRadius: 5, marginLeft: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold' },

  // Floating Button
  fab: { position: 'absolute', right: 20, bottom: 30, backgroundColor: '#FF5733' },

  // Modal
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: 300, backgroundColor: '#fff', padding: 20, borderRadius: 10, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  increaseButton: { backgroundColor: '#27AE60', padding: 10, borderRadius: 5, flex: 1, marginRight: 5, alignItems: 'center' },
  decreaseButton: { backgroundColor: '#E74C3C', padding: 10, borderRadius: 5, flex: 1, marginLeft: 5, alignItems: 'center' },
  closeButton: { marginTop: 15, color: 'red' },
});
