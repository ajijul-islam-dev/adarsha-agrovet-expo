import React, { useState, useContext } from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { TextInput, Button, Text, RadioButton } from "react-native-paper";
import { Formik } from "formik";
import * as Yup from "yup";
import { Link } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import { ServicesProvider } from '../provider/Provider.jsx';

const SignupScreen = () => {
  const { handleRegister, loading } = useContext(ServicesProvider);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const SignupSchema = Yup.object().shape({
    name: Yup.string().required("Full name is required"),
    email: Yup.string().email("Enter a valid email").required("Email is required"),
    phone: Yup.string()
      .matches(/^\+?\d{10,14}$/, "Enter a valid phone number")
      .required("Phone number is required"),
    area: Yup.string().required("Select an area"),
    role: Yup.string().required("Select a role"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm your password')
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={require("../assets/images/adarsha.png")} style={styles.logo} />
        <Text style={styles.companyName}>Adarsha Agro Vet</Text>
        <Text style={styles.title}>Sign Up</Text>

        <Formik
          initialValues={{
            name: "",
            email: "",
            phone: "",
            area: "",
            role: "officer",
            password: "",
            confirmPassword: ""
          }}
          validationSchema={SignupSchema}
          onSubmit={handleRegister}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
            <>
              <TextInput
                label="Full Name"
                mode="outlined"
                style={styles.input}
                onChangeText={handleChange("name")}
                onBlur={handleBlur("name")}
                value={values.name}
                error={touched.name && errors.name}
              />
              {touched.name && errors.name && <Text style={styles.error}>{errors.name}</Text>}

              <TextInput
                label="Email"
                mode="outlined"
                keyboardType="email-address"
                style={styles.input}
                onChangeText={handleChange("email")}
                onBlur={handleBlur("email")}
                value={values.email}
                error={touched.email && errors.email}
              />
              {touched.email && errors.email && <Text style={styles.error}>{errors.email}</Text>}

              <TextInput
                label="Phone Number"
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
                onChangeText={handleChange("phone")}
                onBlur={handleBlur("phone")}
                value={values.phone}
                error={touched.phone && errors.phone}
              />
              {touched.phone && errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

              <TextInput
                label="Area"
                mode="outlined"
                style={styles.input}
                onChangeText={handleChange("area")}
                onBlur={handleBlur("area")}
                value={values.area}
                error={touched.area && errors.area}
              />
              {touched.area && errors.area && <Text style={styles.error}>{errors.area}</Text>}

              <Text style={styles.sectionTitle}>Select a Role</Text>
              <View style={styles.radioGroup}>
                <View style={styles.radioItem}>
                  <RadioButton
                    value="officer"
                    status={values.role === 'officer' ? 'checked' : 'unchecked'}
                    onPress={() => setFieldValue('role', 'officer')}
                  />
                  <Text style={styles.radioLabel}>Officer</Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton
                    value="stock-manager"
                    status={values.role === 'stock-manager' ? 'checked' : 'unchecked'}
                    onPress={() => setFieldValue('role', 'stock-manager')}
                  />
                  <Text style={styles.radioLabel}>Stock Manager</Text>
                </View>
              </View>
              {touched.role && errors.role && <Text style={styles.error}>{errors.role}</Text>}

              <TextInput
                label="Password"
                mode="outlined"
                style={styles.input}
                secureTextEntry={!isPasswordVisible}
                right={
                  <TextInput.Icon
                    icon={isPasswordVisible ? "eye-off" : "eye"}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  />
                }
                onChangeText={handleChange("password")}
                onBlur={handleBlur("password")}
                value={values.password}
                error={touched.password && errors.password}
              />
              {touched.password && errors.password && <Text style={styles.error}>{errors.password}</Text>}

              <TextInput
                label="Confirm Password"
                mode="outlined"
                style={styles.input}
                secureTextEntry={!isConfirmPasswordVisible}
                right={
                  <TextInput.Icon
                    icon={isConfirmPasswordVisible ? "eye-off" : "eye"}
                    onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  />
                }
                onChangeText={handleChange("confirmPassword")}
                onBlur={handleBlur("confirmPassword")}
                value={values.confirmPassword}
                error={touched.confirmPassword && errors.confirmPassword}
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <Text style={styles.error}>{errors.confirmPassword}</Text>
              )}

              <Button
                mode="outlined"
                onPress={handleSubmit}
                style={styles.button}
                loading={loading}
                disabled={loading}
              >
                {!loading && 'Sign Up'}
              </Button>

              <Link style={{marginTop: 10}} href="/signin">
                <Text style={styles.link}>
                  Already have an account? <Text style={styles.linkBold}>Log In</Text>
                </Text>
              </Link>
            </>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#007BFF",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: "100%",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 12,
    paddingVertical: 3,
    width: "100%",
    borderRadius: 8,
  },
  link: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 14,
    color: "#666",
  },
  linkBold: {
    fontWeight: "bold",
    color: "#007BFF",
  },
  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 5,
    alignSelf: "flex-start",
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
    alignSelf: "flex-start",
    color: "#333",
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioLabel: {
    marginLeft: 8,
    color: "#333",
  },
});

export default SignupScreen;