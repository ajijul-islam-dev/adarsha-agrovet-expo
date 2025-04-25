import { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, RefreshControl } from "react-native";
import { Appbar, Card, Text, useTheme, ActivityIndicator } from "react-native-paper";
import { Link } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { ServicesProvider } from '../../provider/Provider.jsx';
import useAxios from '../../hooks/useAxios.js';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const { axiosSecure } = useAxios();
  const { user } = useContext(ServicesProvider);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const fetchStats = async () => {
    try {
      const response = await axiosSecure.get('/api/home-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // Role-based metrics configuration
  const getMetrics = () => {
    const commonFirstRow = [
      { 
        title: "Total Products", 
        value: loading ? '--' : stats?.metrics?.totalProducts || 0, 
        icon: "box-open", 
        color: "#4CAF50" 
      },
      { 
        title: "Active Stores", 
        value: loading ? '--' : stats?.metrics?.activeStores || 0, 
        icon: "store", 
        color: "#2196F3" 
      }
    ];

    const commonSecondRow = [
      { 
        title: "Total Business", 
        value: loading ? '--' : stats?.financial?.totalBusiness || '৳0', 
        color: "#9C27B0" 
      },
      { 
        title: "Total Paid", 
        value: loading ? '--' : stats?.financial?.totalPaid || '৳0', 
        color: "#009688" 
      },
      { 
        title: "Current Dues", 
        value: loading ? '--' : stats?.financial?.currentDues || '৳0', 
        color: "#F44336" 
      }
    ];

    if (user?.role === 'admin') {
      return {
        firstRow: [
          ...commonFirstRow,
          { 
            title: "Pending Orders", 
            value: loading ? '--' : stats?.metrics?.pendingOrders || 0, 
            icon: "shopping-cart", 
            color: "#FF9800" 
          }
        ],
        secondRow: commonSecondRow
      };
    } else if (user?.role === 'officer') {
      return {
        firstRow: [
          ...commonFirstRow,
          { 
            title: "My Pending Orders", 
            value: loading ? '--' : stats?.metrics?.pendingOrders || 0, 
            icon: "shopping-cart", 
            color: "#FF9800" 
          }
        ],
        secondRow: commonSecondRow
      };
    } else if (user?.role === 'stock-manager') {
      return {
        firstRow: [
          ...commonFirstRow,
          { 
            title: "Approved Orders", 
            value: loading ? '--' : stats?.metrics?.pendingOrders || 0, 
            icon: "shopping-cart", 
            color: "#FF9800" 
          }
        ],
        secondRow: commonSecondRow.map(metric => ({
          ...metric,
          value: '--' // Stock managers don't see financial data
        }))
      };
    }

    return {
      firstRow: commonFirstRow,
      secondRow: commonSecondRow
    };
  };

  const { firstRow, secondRow } = getMetrics();

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

  const MetricCard = ({ metric }) => (
    <View style={[styles.metricCard, { backgroundColor: metric.color }]}>
      {loading ? (
        <ActivityIndicator animating={true} color="#FFF" />
      ) : (
        <>
          {metric.icon && (
            <FontAwesome5 
              name={metric.icon} 
              size={24} 
              color="#FFF" 
              style={styles.metricIcon} 
            />
          )}
          <Text style={[
            styles.metricValue,
            !metric.icon && styles.metricValueNoIcon
          ]}>
            {metric.value}
          </Text>
          <Text style={styles.metricTitle}>{metric.title}</Text>
        </>
      )}
    </View>
  );

  if (loading && !refreshing && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome, {user?.name || "User"}</Text>
          <View style={styles.roleContainer}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || "USER"}</Text>
          </View>
        </View>

        <View style={styles.metricsContainer}>
          {firstRow.map((metric, index) => (
            <MetricCard key={`first-${index}`} metric={metric} />
          ))}
        </View>

        <View style={styles.metricsContainer}>
          {secondRow.map((metric, index) => (
            <MetricCard key={`second-${index}`} metric={metric} />
          ))}
        </View>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    aspectRatio: 1,
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
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
    textAlign: 'center',
    includeFontPadding: false,
  },
  metricValueNoIcon: {
    fontSize: 16,
    marginTop: 8,
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
    width: width > 400 ? '48%' : '100%',
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