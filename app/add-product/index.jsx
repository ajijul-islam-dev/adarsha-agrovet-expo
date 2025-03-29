import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, TextInput, Button, Text, Card, RadioButton, useTheme } from 'react-native-paper';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import {useContext} from 'react'
import {ServicesProvider} from '../../provider/Provider.jsx';



const validationSchema = Yup.object().shape({
  productName: Yup.string().required('Product Name is required'),
  productCode: Yup.string().required('Product Code is required'),
  category: Yup.string().required('Category is required'),
  price: Yup.number().required('Price is required').positive('Price must be positive'),
  stock: Yup.number().required('Stock is required').min(0, 'Stock cannot be negative'),
  packSize: Yup.number().required('Pack Size is required').positive('Must be positive'),
  unit: Yup.string().required('Unit is required'),
  description: Yup.string().required('Description is required')
});

const AddProduct = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const {handleCreateProduct,loading} = useContext(ServicesProvider);
  
  return (
    <View style={styles.safeContainer}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => {}} />
        <Appbar.Content title="Add New Product" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card style={styles.formCard}>
          <Card.Content style={styles.cardContent}>
            <Formik
              initialValues={{
                productName: '',
                productCode: '',
                category: '',
                price: '',
                stock: '',
                packSize: '',
                unit: 'kg',
                description: ''
              }}
              validationSchema={validationSchema}
              onSubmit={handleCreateProduct}
            >
              {({ handleChange, handleSubmit, values, errors, touched, setFieldValue }) => (
                <>
                  <TextInput
                    mode="outlined"
                    label="Product Name"
                    value={values.productName}
                    onChangeText={handleChange('productName')}
                    style={styles.input}
                    left={<TextInput.Icon icon={() => <FontAwesome5 name="box" size={18} color={colors.primary} />} />}
                    error={touched.productName && errors.productName}
                  />
                  <TextInput
                    mode="outlined"
                    label="Product Code"
                    value={values.productCode}
                    onChangeText={handleChange('productCode')}
                    style={styles.input}
                    left={<TextInput.Icon icon={() => <FontAwesome5 name="barcode" size={18} color={colors.primary} />} />}
                    error={touched.productCode && errors.productCode}
                  />
                  <TextInput
                    mode="outlined"
                    label="Category"
                    value={values.category}
                    onChangeText={handleChange('category')}
                    style={styles.input}
                    left={<TextInput.Icon icon={() => <FontAwesome5 name="tags" size={18} color={colors.primary} />} />}
                    error={touched.category && errors.category}
                  />
                  <View style={styles.row}>
                    <TextInput
                      mode="outlined"
                      label="Price"
                      value={values.price}
                      onChangeText={handleChange('price')}
                      style={styles.halfInput}
                      keyboardType="numeric"
                      left={<TextInput.Icon icon={() => <FontAwesome5 name="money-bill-wave" size={16} color={colors.primary} />} />}
                      error={touched.price && errors.price}
                    />
                    <TextInput
                      mode="outlined"
                      label="Stock Qty"
                      value={values.stock}
                      onChangeText={handleChange('stock')}
                      style={styles.halfInput}
                      keyboardType="numeric"
                      left={<TextInput.Icon icon={() => <FontAwesome5 name="boxes" size={16} color={colors.primary} />} />}
                      error={touched.stock && errors.stock}
                    />
                  </View>
                  <TextInput
                    mode="outlined"
                    label="Pack Size"
                    value={values.packSize}
                    onChangeText={handleChange('packSize')}
                    style={styles.input}
                    keyboardType="numeric"
                    left={<TextInput.Icon icon={() => <FontAwesome5 name="weight" size={16} color={colors.primary} />} />}
                    error={touched.packSize && errors.packSize}
                  />
                  <Text style={styles.sectionTitle}>Unit of Measurement</Text>
                  <RadioButton.Group onValueChange={(value) => setFieldValue('unit', value)} value={values.unit}>
                    <View style={styles.radioContainer}>
                      <View style={styles.radioRow}>
                        <View style={styles.radioItem}>
                          <RadioButton value="kg" color={colors.primary} />
                          <Text style={styles.radioText}>kg</Text>
                        </View>
                        <View style={styles.radioItem}>
                          <RadioButton value="gm" color={colors.primary} />
                          <Text style={styles.radioText}>gm</Text>
                        </View>
                        <View style={styles.radioItem}>
                          <RadioButton value="piece" color={colors.primary} />
                          <Text style={styles.radioText}>Piece</Text>
                        </View>
                      </View>
                      <View style={[styles.radioRow, styles.lastRadioRow]}>
                        <View style={styles.radioItem}>
                          <RadioButton value="pack" color={colors.primary} />
                          <Text style={styles.radioText}>Pack</Text>
                        </View>
                        <View style={styles.radioItem}>
                          <RadioButton value="liter" color={colors.primary} />
                          <Text style={styles.radioText}>Liter</Text>
                        </View>
                        <View style={styles.emptyRadioItem}></View>
                      </View>
                    </View>
                  </RadioButton.Group>
                  <TextInput
                    mode="outlined"
                    label="Description"
                    value={values.description}
                    onChangeText={handleChange('description')}
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    left={<TextInput.Icon icon={() => <MaterialIcons name="description" size={18} color={colors.primary} />} />}
                    error={touched.description && errors.description}
                  />
                  <View style={styles.buttonContainer}>
                    <Button 
                      mode="outlined" 
                      disabled={loading}
                      loading={loading}
                      onPress={handleSubmit} 
                      style={styles.submitButton}
                    >
                      {!loading && 'Save Product'}
                    </Button>
                  </View>
                </>
              )}
            </Formik>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  safeContainer: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  appbar: { 
    backgroundColor: colors.surface,
    elevation: 2
  },
  appbarTitle: { 
    fontSize: 18, 
    fontWeight: "bold",
    color: colors.onSurface
  },
  container: { 
    padding: 16,
    paddingBottom: 24
  },
  formCard: { 
    backgroundColor: colors.surface, 
    borderRadius: 12,
    overflow: 'hidden'
  },
  cardContent: {
    paddingBottom: 8
  },
  input: { 
    backgroundColor: colors.surface,
    marginBottom: 12
  },
  halfInput: { 
    flex: 1, 
    backgroundColor: colors.surface,
    marginBottom: 12
  },
  row: { 
    flexDirection: 'row', 
    gap: 12,
    marginBottom: 4
  },
  textArea: { 
    height: 100, 
    marginBottom: 16,
    backgroundColor: colors.surface
  },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: '500', 
    marginBottom: 8,
    marginTop: 4,
    color: colors.onSurfaceVariant
  },
  radioContainer: { 
    marginBottom: 12 
  },
  radioRow: { 
    flexDirection: 'row',
    marginBottom: 8
  },
  lastRadioRow: {
    justifyContent: 'flex-start'
  },
  radioItem: { 
    flexDirection: 'row', 
    alignItems: 'center',
    minWidth: '30%'
  },
  emptyRadioItem: {
    minWidth: '30%'
  },
  radioText: { 
    marginLeft: 8,
    color: colors.onSurface
  },
  buttonContainer: { 
    alignItems: 'center', 
    marginTop: 16 
  },
  submitButton: { 
    borderRadius: 6, 
    width: '100%'
  },
  buttonLabel: {
    fontSize: 16,
    color: colors.onPrimary,
    paddingVertical: 6
  }
});

export default AddProduct;