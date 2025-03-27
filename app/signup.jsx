import React, { useState,useContext } from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { Formik } from "formik";
import * as Yup from "yup";
import { Link } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import {ServicesProvider} from '../provider/Provider.jsx';


const SignupScreen = () => {
  const {handleRegister,loading} = useContext(ServicesProvider);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const SignupSchema = Yup.object().shape({
    name: Yup.string().required("পূর্ণ নাম আবশ্যক"),
    email: Yup.string().email("সঠিক ইমেইল দিন").required("ইমেইল আবশ্যক"),
    phone: Yup.string()
      .matches(/^\+?\d{10,14}$/, "সঠিক ফোন নম্বর দিন")
      .required("ফোন নম্বর আবশ্যক"),
    area: Yup.string().required("এলাকা নির্বাচন করুন"),
    password: Yup.string()
      .min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে")
      .required("পাসওয়ার্ড আবশ্যক"),
  });

  

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={require("../assets/images/adarsha.png")} style={styles.logo} />
        <Text style={styles.companyName}>আদর্শ এগ্রো ভেট</Text>
        <Text style={styles.title}>নিবন্ধন করুন</Text>

        <Formik
          initialValues={{ 
            name: "", 
            email: "", 
            phone: "", 
            area: "", 
            password: "" 
          }}
          validationSchema={SignupSchema}
          onSubmit={handleRegister}
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
                label="ফোন নম্বর"
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
                label="এলাকা"
                mode="outlined"
                style={styles.input}
                onChangeText={handleChange("area")}
                onBlur={handleBlur("area")}
                value={values.area}
                error={touched.area && errors.area}
              />
              {touched.area && errors.area && <Text style={styles.error}>{errors.area}</Text>}

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

              <Button 
                mode="outlined" 
                onPress={handleSubmit} 
                style={styles.button}
                loading={loading}
                disabled={loading}
              >
                {!loading && 'নিবন্ধন করুন'}
              </Button>

              <Link style={{marginTop: 10}} href="/signin">
                <Text style={styles.link}>
                  ইতোমধ্যে একটি অ্যাকাউন্ট আছে? <Text style={styles.linkBold}>লগইন করুন</Text>
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
});

export default SignupScreen;