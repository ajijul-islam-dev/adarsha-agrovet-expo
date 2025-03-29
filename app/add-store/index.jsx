import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, TextInput, Button, Text, Card, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'expo-router';
import { ServicesProvider } from '../../provider/Provider.jsx';

const validationSchema = Yup.object().shape({
  storeName: Yup.string().required('Store name is required'),
  proprietorName: Yup.string().required('Proprietor name is required'),
  address: Yup.string().required('Address is required'),
  contactNumber: Yup.string()
    .required('Contact number is required')
    .matches(/^[0-9]+$/, 'Must be only digits')
    .min(10, 'Must be at least 10 digits')
    .max(15, 'Must be 15 digits or less'),
  area: Yup.string().required('Area is required'),
  storeCode: Yup.string().required('Store code is required')
});

const AddStoreScreen = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const { 
    user,
    showMessage,
    handleCreateStore,
    loading
  } = useContext(ServicesProvider);

  const handleSubmit = async (values) => {
    const result = await handleCreateStore({
      ...values,
      openingDate: new Date(),
      officers: { marketingOfficer: user._id },
      paymentHistory: [],
      dueHistory: [],
      createdBy: user._id
    });
    
    if (result) {
      router.push('/stores');
    }
  };

  return (
    <View style={styles.safeContainer}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Add New Store" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card style={styles.formCard}>
          <Card.Content style={styles.cardContent}>
            <Formik
              initialValues={{
                storeName: '',
                proprietorName: '',
                address: '',
                contactNumber: '',
                area: '',
                storeCode: ''
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <>
                  <TextInput
                    mode="outlined"
                    label="Store Name"
                    value={values.storeName}
                    onChangeText={handleChange('storeName')}
                    onBlur={handleBlur('storeName')}
                    style={styles.input}
                    left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="store" size={18} color={colors.primary} />} />}
                    error={touched.storeName && errors.storeName}
                  />
                  {touched.storeName && errors.storeName && (
                    <Text style={styles.errorText}>{errors.storeName}</Text>
                  )}

                  <TextInput
                    mode="outlined"
                    label="Proprietor Name"
                    value={values.proprietorName}
                    onChangeText={handleChange('proprietorName')}
                    onBlur={handleBlur('proprietorName')}
                    style={styles.input}
                    left={<TextInput.Icon icon={() => <FontAwesome5 name="user-tie" size={16} color={colors.primary} />} />}
                    error={touched.proprietorName && errors.proprietorName}
                  />
                  {touched.proprietorName && errors.proprietorName && (
                    <Text style={styles.errorText}>{errors.proprietorName}</Text>
                  )}

                  <TextInput
                    mode="outlined"
                    label="Address"
                    value={values.address}
                    onChangeText={handleChange('address')}
                    onBlur={handleBlur('address')}
                    style={styles.textArea}
                    multiline
                    numberOfLines={3}
                    left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="map-marker" size={18} color={colors.primary} />} />}
                    error={touched.address && errors.address}
                  />
                  {touched.address && errors.address && (
                    <Text style={styles.errorText}>{errors.address}</Text>
                  )}

                  <TextInput
                    mode="outlined"
                    label="Contact Number"
                    value={values.contactNumber}
                    onChangeText={handleChange('contactNumber')}
                    onBlur={handleBlur('contactNumber')}
                    style={styles.input}
                    keyboardType="phone-pad"
                    left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="phone" size={18} color={colors.primary} />} />}
                    error={touched.contactNumber && errors.contactNumber}
                  />
                  {touched.contactNumber && errors.contactNumber && (
                    <Text style={styles.errorText}>{errors.contactNumber}</Text>
                  )}

                  <TextInput
                    mode="outlined"
                    label="Area"
                    value={values.area}
                    onChangeText={handleChange('area')}
                    onBlur={handleBlur('area')}
                    style={styles.input}
                    left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="map" size={18} color={colors.primary} />} />}
                    error={touched.area && errors.area}
                  />
                  {touched.area && errors.area && (
                    <Text style={styles.errorText}>{errors.area}</Text>
                  )}

                  <TextInput
                    mode="outlined"
                    label="Store Code"
                    value={values.storeCode}
                    onChangeText={handleChange('storeCode')}
                    onBlur={handleBlur('storeCode')}
                    style={styles.input}
                    left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="barcode" size={18} color={colors.primary} />} />}
                    error={touched.storeCode && errors.storeCode}
                  />
                  {touched.storeCode && errors.storeCode && (
                    <Text style={styles.errorText}>{errors.storeCode}</Text>
                  )}

                  <View style={styles.buttonContainer}>
                    <Button
                      mode="contained"
                      onPress={handleSubmit}
                      loading={loading}
                      disabled={loading}
                      style={styles.submitButton}
                      labelStyle={styles.buttonLabel}
                    >
                      Save Store
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
    marginBottom: 4
  },
  textArea: {
    height: 100,
    backgroundColor: colors.surface,
    marginBottom: 4
  },
  buttonContainer: { 
    marginTop: 16 
  },
  submitButton: { 
    borderRadius: 6,
    paddingVertical: 4
  },
  buttonLabel: {
    fontSize: 16,
    color: colors.onPrimary
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginBottom: 12,
    marginLeft: 4
  }
});

export default AddStoreScreen;