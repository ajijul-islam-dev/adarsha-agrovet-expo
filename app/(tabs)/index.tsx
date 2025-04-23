import { useContext } from 'react'
import { View, StyleSheet, ScrollView, Image, Dimensions } from "react-native";
import { Appbar, Card, Text, useTheme } from "react-native-paper";
import { Link } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { ServicesProvider } from '../../provider/Provider.jsx';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const { user, products, stores, orders,handleGetOfficerById,currentOfficer} = useContext(ServicesProvider);
  // Calculate pending orders
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  
  // Dynamic metrics data for first row
  const firstRowMetrics = [
    { title: "Total Products", value: products.length, icon: "box-open", color: "#4CAF50" },
    { title: "Active Stores", value: stores.length, icon: "store", color: "#2196F3" },
    { title: "Pending Orders", value: pendingOrders, icon: "shopping-cart", color: "#FF9800" },
  ];

  // Second row metrics (example values - replace with actual calculations)
  const secondRowMetrics = [
    { title: "Total Businesses", value: "25", icon: "building", color: "#9C27B0" },
    { title: "Total Paid", value: "৳12,500", icon: "money-bill-wave", color: "#009688" },
    { title: "Total Dues", value: "৳3,200", icon: "exclamation-triangle", color: "#F44336" },
  ];

  // Role-based quick actions for all roles
  const getQuickActions = () => {
    const commonActions = [
      { title: "Products", icon: "box-open", href: "/product-stock", color: "#4CAF50" },
      { title: "Orders", icon: "shopping-cart", href: "/all-orders-list", color: "#FF9800" },
    ];

    if (user?.role === 'admin') {
      return [
        ...commonActions,
        { title: "Users", icon: "users-cog", href: "/manage-users", color: "#9C27B0" },
        { title: "Officers", icon: "user-tie", href: "/officers-list", color: "#607D8B" },
        { title: "Stores", icon: "store-alt", href: "/all-stores-list", color: "#2196F3" },
      ];
    } else if (user?.role === 'officer') {
      return [
        ...commonActions,
        { title: "My Stores", icon: "store", href: "/my-stores", color: "#2196F3" },
        { title: "Add Store", icon: "store-alt", href: "/add-store", color: "#3F51B5" },
        { title: "My Orders", icon: "clipboard-list", href: "/my-orders", color: "#795548" },
      ];
    } else if (user?.role === 'stock-manager') {
      return [
        ...commonActions,
        { title: "Add Product", icon: "plus-square", href: "/add-product", color: "#009688" },
      ];
    }

    return commonActions;
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
        />
      </Appbar.Header>

      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome, {user?.name || "User"}</Text>
          <View style={styles.roleContainer}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || "USER"}</Text>
          </View>
        </View>

        {/* First Row Metrics */}
        <View style={styles.metricsContainer}>
          {firstRowMetrics.map((metric, index) => (
            <View key={`first-${index}`} style={[styles.metricCard, { backgroundColor: metric.color }]}>
              <FontAwesome5 name={metric.icon} size={24} color="#FFF" style={styles.metricIcon} />
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricTitle}>{metric.title}</Text>
            </View>
          ))}
        </View>

        {/* Second Row Metrics */}
        <View style={styles.metricsContainer}>
          {secondRowMetrics.map((metric, index) => (
            <View key={`second-${index}`} style={[styles.metricCard, { backgroundColor: metric.color }]}>
              <FontAwesome5 name={metric.icon} size={24} color="#FFF" style={styles.metricIcon} />
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricTitle}>{metric.title}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.actionsGrid}>
          {getQuickActions().map((action, index) => (
            <View key={index} style={styles.actionItem}>
              <Link href={action.href} asChild>
                <Card style={[styles.actionCard, { borderLeftColor: action.color }]}>
                  <Card.Content style={styles.actionContent}>
                    <FontAwesome5 
                      name={action.icon} 
                      size={20} 
                      color={action.color} 
                    />
                    <Text style={[styles.actionText, { color: action.color }]}>
                      {action.title}
                    </Text>
                  </Card.Content>
                </Card>
              </Link>
            </View>
          ))}
        </View>
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
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  appbarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: -8,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  container: {
    padding: 16,
    paddingBottom: 24,
  },
  welcomeContainer: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
  },
  roleContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9F5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    aspectRatio: 1, // Makes the cards square
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  metricIcon: {
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
    textAlign: 'center',
    includeFontPadding: false,
  },
  metricTitle: {
    fontSize: 12,
    color: "#FFF",
    textAlign: 'center',
    includeFontPadding: false,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionItem: {
    width: width > 400 ? '48%' : '100%', // Responsive width
  },
  actionCard: {
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderLeftWidth: 4,
    elevation: 1,
  },
  actionContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default HomeScreen;