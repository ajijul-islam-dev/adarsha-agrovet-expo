import { useContext } from 'react'
import { View, StyleSheet, ScrollView, Image } from "react-native";
import { Appbar, Card, Text } from "react-native-paper";
import { Link } from "expo-router";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { ServicesProvider } from '../../provider/Provider.jsx';

const HomeScreen = () => {
  const { user } = useContext(ServicesProvider);
  
  // Common cards that all roles can see
  const commonCards = [
    {
      title: "Product Stock",
      subtitle: "View available stock",
      icon: "box-open",
      color: "#FF5733",
      href: "/product-stock"
    }
  ];

  // Admin specific cards
  const adminCards = [
    {
      title: "Manage Users",
      subtitle: "Add, edit or remove users",
      icon: "users-cog",
      color: "#17A2B8",
      href: "/manage-users"
    },
    {
      title: "Officers List",
      subtitle: "Manage company officers",
      icon: "user-tie",
      color: "#28A745",
      href: "/officers-list"
    },
    {
      title: "All Orders",
      subtitle: "View & track all orders",
      icon: "shopping-cart",
      color: "#F4A600",
      href: "/all-orders-list"
    },
    {
      title: "All Stores",
      subtitle: "Browse all company stores",
      icon: "store-alt",
      color: "#607D8B",
      href: "/all-stores-list"
    }
  ];

  // Officer specific cards
  const officerCards = [
    {
      title: "Add Store",
      subtitle: "Register new store location",
      icon: "store",
      color: "#9C27B0",
      href: "/add-store"
    },
    {
      title: "My Stores",
      subtitle: "Manage your stores",
      icon: "store",
      color: "#9C27B0",
      href: "/my-stores"
    },
    {
      title: "My Orders",
      subtitle: "View your personal orders",
      icon: "clipboard-list",
      color: "#2196F3",
      href: "/my-orders"
    }
  ];

  // Stock-manager specific cards
  const stockManagerCards = [
    {
      title: "Add Product",
      subtitle: "Add new product to inventory",
      icon: "plus-square",
      color: "#4CAF50",
      href: "/add-product"
    },
    {
      title: "All Orders",
      subtitle: "View & track all orders",
      icon: "shopping-cart",
      color: "#F4A600",
      href: "/all-orders-list"
    }
  ];

  // Combine cards based on user role
  const getCardsForRole = () => {
    let cards = [...commonCards];
    
    if (user?.role === 'admin') {
      cards = [...cards, ...adminCards];
    } else if (user?.role === 'officer') {
      cards = [...cards, ...officerCards];
    } else if (user?.role === 'stock-manager') {
      cards = [...cards, ...stockManagerCards];
    }
    
    return cards;
  };

  return (
    <View style={styles.safeContainer}>
      <Appbar.Header style={styles.appbar}>
        <Image 
          source={require('../../assets/images/adarsha.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Appbar.Content 
          title="Adarsha AgroVet Limited" 
          titleStyle={styles.appbarTitle} 
          style={styles.appbarContent}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        {getCardsForRole().map((card, index) => (
          <Link href={card.href} asChild key={index}>
            <Card style={styles.card}>
              <View style={styles.cardContent}>
                <FontAwesome5 name={card.icon} size={24} color={card.color} />
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={18} color="#888" />
              </View>
            </Card>
          </Link>
        ))}
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