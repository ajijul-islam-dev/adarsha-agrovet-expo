import React, { useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { Formik } from "formik";
import * as Yup from "yup";
import { Link } from "expo-router";
import {SafeAreaView} from 'react-native-safe-area-context';

const SignupScreen = ({ navigation }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // ফর্ম যাচাই (Form Validation)
  const SignupSchema = Yup.object().shape({
    name: Yup.string().required("পূর্ণ নাম আবশ্যক"),
    email: Yup.string().email("সঠিক ইমেইল দিন").required("ইমেইল আবশ্যক"),
    password: Yup.string()
      .min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে")
      .required("পাসওয়ার্ড আবশ্যক"),
  });

  // সাইনআপ ফাংশন
  const handleSignup = (values) => {
    console.log("ব্যবহারকারীর তথ্য:", values);
    // Firebase Auth বা ব্যাকেন্ড API কল
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* কোম্পানির লোগো */}
      <Image source={require("../assets/images/adarsha.png")} style={styles.logo} />

      {/* কোম্পানির নাম */}
      <Text style={styles.companyName}>আদর্শ এগ্রো ভেট</Text>

      <Text style={styles.title}>নিবন্ধন করুন</Text>

      <Formik
        initialValues={{ name: "", email: "", password: "" }}
        validationSchema={SignupSchema}
        onSubmit={handleSignup}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <>
            <TextInput
              label="পূর্ণ নাম"
              mode="outlined"
              style={styles.input}
              onChangeText={handleChange("name")}
              onBlur={handleBlur("name")}
              value={values.name}
              error={touched.name && errors.name}
            />
            {touched.name && errors.name && <Text style={styles.error}>{errors.name}</Text>}

            <TextInput
              label="ইমেইল"
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
              label="পাসওয়ার্ড"
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

            <Button mode="contained" onPress={handleSubmit} style={styles.button}>
              নিবন্ধন করুন
            </Button>

            <Link style={{marginTop : 10}} href="/signin">
              <Text style={styles.link}>ইতোমধ্যে একটি অ্যাকাউন্ট আছে? <Text style={styles.linkBold}>লগইন করুন</Text></Text>
            </Link>
          </>
        )}
      </Formik>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#F5F7FA", // Light Gray Background
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
    color: "#007BFF", // Blue Color for Branding
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    color: "#333", // Dark Gray
  },
  input: {
    width: "100%",
    marginBottom: 12,
    backgroundColor: "#fff", // White Input Fields
  },
  button: {
    marginTop: 12,
    paddingVertical: 8,
    width: "80%",
    
  },
  link: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 14,
    color: "#666", // Soft Gray
  },
  linkBold: {
    fontWeight: "bold",
    color: "#007BFF", // Highlighted Link
  },
  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 5,
    alignSelf: "flex-start",
  },
});

export default SignupScreen;
