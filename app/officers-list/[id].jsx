import React, { useState, useEffect, useContext, useRef } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, Dimensions } from "react-native";
import { Text, Card, Button, DataTable, TextInput, IconButton, useTheme, Appbar, Modal, Portal } from "react-native-paper";
import { useLocalSearchParams, router, Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ServicesProvider} from '../../provider/Provider.jsx';

const Tab = createMaterialTopTabNavigator();

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatCurrency = (amount) => {
  return `৳${amount?.toLocaleString() || '0'}`;
};

// Static data for the officer
const staticOfficerData = {
  officerId: "OF-12345",
  name: "John Doe",
  designation: "Field Officer",
  contactNumber: "+8801712345678",
  email: "john.doe@company.com",
  joiningDate: "2022-05-15",
  area: "Dhaka North",
  totalStoresAssigned: 24,
  activeStores: 18,
  inactiveStores: 6,
  performanceRating: 4.5,
  lastMonthCollections: 1250000,
  thisMonthCollections: 980000,
  lastMonthOrders: 45,
  thisMonthOrders: 32,
  activityHistory: [
    {
      id: 1,
      date: "2023-10-15T09:30:00",
      type: "store_visit",
      storeName: "ABC Traders",
      details: "Regular follow-up visit"
    },
    {
      id: 2,
      date: "2023-10-14T14:15:00",
      type: "payment_collection",
      amount: 45000,
      storeName: "XYZ Store"
    },
    {
      id: 3,
      date: "2023-10-12T11:00:00",
      type: "new_order",
      orderId: "ORD-78945",
      amount: 125000,
      storeName: "Best Buy"
    }
  ],
  upcomingTasks: [
    {
      id: 1,
      dueDate: "2023-10-18",
      storeName: "City Mart",
      taskType: "payment_collection",
      amount: 65000
    },
    {
      id: 2,
      dueDate: "2023-10-20",
      storeName: "Fresh Grocery",
      taskType: "store_visit"
    }
  ]
};

// Tab Components
const OverviewTab = ({ officerData, theme, onRefresh, refreshing }) => {
  return (
    <ScrollView 
      contentContainerStyle={styles.tabContentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title 
          title="Performance Summary" 
          titleVariant="titleMedium" 
          titleStyle={{ color: theme.colors.primary }}
          left={() => <MaterialCommunityIcons name="chart-line" size={24} color={theme.colors.primary} />}
        />
        <Card.Content>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Stores Assigned
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                {officerData.totalStoresAssigned}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Active Stores
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                {officerData.activeStores}
              </Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Performance Rating
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                {officerData.performanceRating}/5
              </Text>
            </View>
            <View style={[styles.summaryItem, styles.highlightItem]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.onPrimaryContainer }]}>
                This Month Collection
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }]}>
                {formatCurrency(officerData.thisMonthCollections)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.quickActionsCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title 
          title="Quick Actions" 
          titleVariant="titleMedium" 
          titleStyle={{ color: theme.colors.primary }}
          left={() => <MaterialCommunityIcons name="lightning-bolt" size={24} color={theme.colors.primary} />}
        />
        <Card.Content style={styles.quickActionsContent}>
          <Button
            mode="contained"
            icon="cash-plus"
            style={styles.quickActionButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            onPress={() => console.log("Record Collection")}
          >
            Record Collection
          </Button>
          <Button
            mode="contained"
            icon="store-plus"
            style={styles.quickActionButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            onPress={() => console.log("Assign Store")}
          >
            Assign Store
          </Button>
          <Button
            mode="contained"
            icon="calendar-clock"
            style={styles.quickActionButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            onPress={() => console.log("Schedule Visit")}
          >
            Schedule Visit
          </Button>
        </Card.Content>
      </Card>

      <Card style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title 
          title="Officer Information" 
          titleVariant="titleMedium" 
          titleStyle={{ color: theme.colors.primary }}
          left={() => <MaterialCommunityIcons name="account-details" size={24} color={theme.colors.primary} />}
        />
        <Card.Content>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="identifier"
              size={20}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              ID: {officerData.officerId}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="account"
              size={20}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              {officerData.name}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="badge-account"
              size={20}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              {officerData.designation}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="phone"
              size={20}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              {officerData.contactNumber}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="email"
              size={20}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              {officerData.email}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar"
              size={20}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              Joined: {formatDate(officerData.joiningDate)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={20}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              Area: {officerData.area}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const ActivityTab = ({ officerData, theme }) => {
  return (
    <ScrollView contentContainerStyle={styles.tabContentContainer}>
      <Card style={[styles.dataCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title={`Recent Activities (${officerData.activityHistory.length})`}
          titleVariant="titleMedium"
          titleStyle={{ color: theme.colors.primary }}
          left={() => <MaterialCommunityIcons name="history" size={24} color={theme.colors.primary} />}
        />
        <Card.Content>
          {officerData.activityHistory.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Activity</DataTable.Title>
                <DataTable.Title numeric>Details</DataTable.Title>
              </DataTable.Header>
              {officerData.activityHistory.map((activity) => (
                <DataTable.Row key={activity.id}>
                  <DataTable.Cell>
                    {formatDate(activity.date)}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={{ textTransform: 'capitalize' }}>
                      {activity.type.replace('_', ' ')}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {activity.type === 'payment_collection' ? (
                      formatCurrency(activity.amount)
                    ) : activity.type === 'new_order' ? (
                      `Order #${activity.orderId.slice(-5)}`
                    ) : (
                      activity.storeName
                    )}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <View style={styles.emptyDataContainer}>
              <MaterialCommunityIcons
                name="history-off"
                size={40}
                color={theme.colors.backdrop}
              />
              <Text style={[styles.emptyDataText, { color: theme.colors.onSurface }]}>
                No recent activities
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const TasksTab = ({ officerData, theme }) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskData, setTaskData] = useState({
    storeName: '',
    taskType: 'store_visit',
    dueDate: new Date(),
    amount: '',
    notes: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.tabContentContainer}>
      <Card style={[styles.dataCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title={`Upcoming Tasks (${officerData.upcomingTasks.length})`}
          titleVariant="titleMedium"
          titleStyle={{ color: theme.colors.primary }}
          left={() => <MaterialCommunityIcons name="clipboard-list" size={24} color={theme.colors.primary} />}
          right={() => (
            <Button
              mode="contained-tonal"
              icon="plus"
              onPress={() => setShowTaskModal(true)}
              compact
              style={styles.addButton}
            >
              Add
            </Button>
          )}
        />
        <Card.Content>
          {officerData.upcomingTasks.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Due Date</DataTable.Title>
                <DataTable.Title>Store</DataTable.Title>
                <DataTable.Title>Task</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
              </DataTable.Header>
              {officerData.upcomingTasks.map((task) => (
                <DataTable.Row key={task.id}>
                  <DataTable.Cell>
                    {formatDate(task.dueDate)}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    {task.storeName}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={{ textTransform: 'capitalize' }}>
                      {task.taskType.replace('_', ' ')}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {task.amount ? formatCurrency(task.amount) : 'N/A'}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <View style={styles.emptyDataContainer}>
              <MaterialCommunityIcons
                name="clipboard-list-outline"
                size={40}
                color={theme.colors.backdrop}
              />
              <Text style={[styles.emptyDataText, { color: theme.colors.onSurface }]}>
                No upcoming tasks
              </Text>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => setShowTaskModal(true)}
                style={{ marginTop: 16 }}
                contentStyle={styles.buttonContent}
              >
                Add Task
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Task Modal */}
      <Portal>
        <Modal 
          visible={showTaskModal} 
          onDismiss={() => setShowTaskModal(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Add New Task</Text>
          
          <TextInput
            label="Store Name"
            value={taskData.storeName}
            onChangeText={(text) => setTaskData({...taskData, storeName: text})}
            style={styles.modalInput}
            mode="outlined"
          />

          <TextInput
            label="Task Type"
            value={taskData.taskType}
            onChangeText={(text) => setTaskData({...taskData, taskType: text})}
            style={styles.modalInput}
            mode="outlined"
          />

          {taskData.taskType === 'payment_collection' && (
            <TextInput
              label="Amount"
              value={taskData.amount}
              onChangeText={(text) => setTaskData({...taskData, amount: text.replace(/[^0-9.]/g, '')})}
              inputMode="numeric"
              style={styles.modalInput}
              mode="outlined"
            />
          )}

          <TextInput
            label="Notes"
            value={taskData.notes}
            onChangeText={(text) => setTaskData({...taskData, notes: text})}
            style={styles.modalInput}
            mode="outlined"
            multiline
          />

          <TouchableOpacity 
            onPress={() => setShowDatePicker(true)}
            style={[styles.datePickerButton, { borderColor: theme.colors.primary }]}
          >
            <Text style={{ color: theme.colors.onSurface }}>
              Due Date: {taskData.dueDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={taskData.dueDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  setTaskData({...taskData, dueDate: date});
                }
              }}
            />
          )}

          <View style={styles.modalButtonContainer}>
            <Button 
              mode="outlined" 
              onPress={() => setShowTaskModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={() => {
                console.log("Task submitted:", taskData);
                setShowTaskModal(false);
              }}
              style={styles.modalButton}
            >
              Add Task
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

// Main Component
const OfficerDetailsScreen = () => {
  const theme = useTheme();
  const { id } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const tabNavRef = useRef(null);
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const [officerData, setOfficerData] = useState(staticOfficerData);
  const {} = useContext(ServicesProvider)
  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleTabChange = (e) => {
    const index = e?.data?.state?.index ?? 0;
    setTabIndex(index);
    Animated.spring(indicatorPosition, {
      toValue: index * (Dimensions.get('window').width / 3),
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content 
          title={officerData.name} 
          subtitle={`${officerData.designation} | ${officerData.area}`}
        />
        <Appbar.Action 
          icon="refresh" 
          onPress={onRefresh} 
          animated={true}
        />
      </Appbar.Header>

      <View style={styles.tabContainer}>
        <Tab.Navigator
          ref={tabNavRef}
          initialRouteName="Overview"
          screenListeners={{
            state: handleTabChange,
          }}
          screenOptions={{
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
            tabBarIndicator: () => (
              <Animated.View 
                style={[
                  styles.tabIndicator,
                  { 
                    backgroundColor: theme.colors.primary,
                    transform: [{ translateX: indicatorPosition }] 
                  }
                ]}
              />
            ),
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: 'bold',
              textTransform: 'none',
            },
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.surfaceVariant,
            },
            tabBarItemStyle: {
              height: 48,
            },
            tabBarContentContainerStyle: {
              paddingHorizontal: 16,
            },
          }}
        >
          <Tab.Screen
            name="Overview"
            children={() => (
              <OverviewTab 
                officerData={officerData} 
                theme={theme} 
                onRefresh={onRefresh} 
                refreshing={refreshing} 
              />
            )}
            options={{
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons
                  name="view-dashboard"
                  size={24}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Activity"
            children={() => (
              <ActivityTab 
                officerData={officerData} 
                theme={theme}
              />
            )}
            options={{
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons
                  name="history"
                  size={24}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Tasks"
            children={() => (
              <TasksTab 
                officerData={officerData} 
                theme={theme}
              />
            )}
            options={{
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons
                  name="clipboard-list"
                  size={24}
                  color={color}
                />
              ),
            }}
          />
        </Tab.Navigator>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tabContainer: {
    flex: 1,
  },
  tabContentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  tabIndicator: {
    position: 'absolute',
    height: 3,
    bottom: 0,
    width: Dimensions.get('window').width / 3,
  },
  summaryCard: {
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  highlightItem: {
    backgroundColor: '#E3F2FD',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  quickActionsCard: {
    borderRadius: 12,
    marginBottom: 16,
  },
  quickActionsContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '30%',
    height: 50,
  },
  buttonContent: {
    height: 44,
  },
  buttonLabel: {
    fontSize: 12,
  },
  infoCard: {
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  dataCard: {
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyDataContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDataText: {
    marginTop: 16,
    textAlign: 'center',
  },
  addButton: {
    marginRight: 8,
  },
  modalContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  datePickerButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: 'center',
  },
});

export default OfficerDetailsScreen;