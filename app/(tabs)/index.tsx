import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Card, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>আদর্শ এগ্রোভেট লিমিটেড </Text>

        {/* Product Stock */}
        <Link href="/product-stock" asChild>
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <FontAwesome5 name="box-open" size={24} color="#FF5733" />
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Product Stock</Text>
                <Text style={styles.cardSubtitle}>View available stock</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={18} color="#888" />
            </View>
          </Card>
        </Link>

        {/* Officers List */}
        <Link href="/officers-list" asChild>
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <FontAwesome5 name="user-tie" size={24} color="#28A745" />
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Officers List</Text>
                <Text style={styles.cardSubtitle}>Manage company officers</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={18} color="#888" />
            </View>
          </Card>
        </Link>

        {/* Orders */}
        <Link href="/orders" asChild>
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <FontAwesome5 name="shopping-cart" size={24} color="#F4A600" />
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Orders</Text>
                <Text style={styles.cardSubtitle}>View & track orders</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={18} color="#888" />
            </View>
          </Card>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
  },
});

export default HomeScreen;
