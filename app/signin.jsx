import React, { useState,useContext } from "react";
import { View, StyleSheet, Image } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { Formik } from "formik";
import * as Yup from "yup";
import { Link } from "expo-router";
import {SafeAreaView} from 'react-native-safe-area-context';
import {ServicesProvider} from '../provider/Provider.jsx';


const SigninScreen = ({ navigation }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // ফর্ম যাচাই (Validation Schema)
  const SigninSchema = Yup.object().shape({
    email: Yup.string().email("সঠিক ইমেইল দিন").required("ইমেইল আবশ্যক"),
    password: Yup.string()
      .min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে")
      .required("পাসওয়ার্ড আবশ্যক"),
  });

  const {handleLogin,loading} = useContext(ServicesProvider);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* কোম্পানির লোগো */}
      <Image source={require("../assets/images/adarsha.png")} style={styles.logo} />

      {/* কোম্পানির নাম */}
      <Text style={styles.companyName}>আদর্শ এগ্রো ভেট</Text>

      <Text style={styles.title}>লগইন করুন</Text>

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={SigninSchema}
        onSubmit={handleLogin}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <>
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

            <Button loading={loading} disabled={loading} mode="outlined" onPress={handleSubmit} style={styles.button}>
              {!loading && 'লগইন করুন'}
            </Button>

            <Link style={{marginTop : 10}} href="/signup">
              <Text style={styles.link}>
                নতুন অ্যাকাউন্ট নেই? <Text style={styles.linkBold}>নিবন্ধন করুন</Text>
              </Text>
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
    backgroundColor: "#F5F7FA", // হালকা গ্রে ব্যাকগ্রাউন্ড
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
    color: "#007BFF", // নীল রঙের ব্র্যান্ডিং
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    color: "#333", // ডার্ক গ্রে
  },
  input: {
    width: "100%",
    marginBottom: 12,
    backgroundColor: "#fff", // সাদা ইনপুট ফিল্ড
  },
  button: {
    marginTop: 12,
    paddingVertical: 3,
    width : '100%',
    borderRadius : 8
  },
  link: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 14,
    color: "#666", // সফট গ্রে
  },
  linkBold: {
    fontWeight: "bold",
    color: "#007BFF", // হাইলাইটেড লিংক
  },
  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 5,
    alignSelf: "flex-start",
  },
});

export default SigninScreen;
