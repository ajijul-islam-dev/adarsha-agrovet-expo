import {useContext} from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
import { Appbar, Card, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import {ServicesProvider} from '../../provider/Provider.jsx';
const HomeScreen = () => {
  return (
    <View style={styles.safeContainer}>
      <Appbar.Header style={styles.appbar}>
        <Image 
          source={require('../../assets/images/adarsha.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Appbar.Content 
          title="আদর্শ এগ্রোভেট লিমিটেড" 
          titleStyle={styles.appbarTitle} 
          style={styles.appbarContent}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
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
        <Link href="/all-orders-list" asChild>
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <FontAwesome5 name="shopping-cart" size={24} color="#F4A600" />
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>All Orders</Text>
                <Text style={styles.cardSubtitle}>View & track orders</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={18} color="#888" />
            </View>
          </Card>
        </Link>

        {/* Stores */}
        <Link href="/stores" asChild>
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <FontAwesome5 name="store" size={24} color="#9C27B0" />
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>My Stores</Text>
                <Text style={styles.cardSubtitle}>Manage your stores</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={18} color="#888" />
            </View>
          </Card>
        </Link>

        {/* My Orders */}
        <Link href="/my-orders" asChild>
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <FontAwesome5 name="clipboard-list" size={24} color="#2196F3" />
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>My Orders</Text>
                <Text style={styles.cardSubtitle}>View your personal orders</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={18} color="#888" />
            </View>
          </Card>
        </Link>

        {/* All Stores */}
        <Link href="/all-stores-list" asChild>
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <FontAwesome5 name="store-alt" size={24} color="#607D8B" />
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>All Stores</Text>
                <Text style={styles.cardSubtitle}>Browse all company stores</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={18} color="#888" />
            </View>
          </Card>
        </Link>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  appbar: {
    backgroundColor: "#FFF",
    elevation: 3,
    justifyContent: 'flex-start',
    paddingLeft: 10,
  },
  appbarContent: {
    alignItems: 'flex-start',
    marginLeft: 4,
  },
  appbarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "left",
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  container: {
    padding: 16,
    paddingTop: 8,
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