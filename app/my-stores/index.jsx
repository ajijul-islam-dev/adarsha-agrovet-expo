import React, { useState, useRef, useContext, useEffect } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Card, Text, Button, Menu, PaperProvider, useTheme } from "react-native-paper";
import { Link } from "expo-router";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ServicesProvider } from '../../provider/Provider.jsx';

const MyStoresScreen = () => {
  const theme = useTheme();
  const { handleGetMyStores, loading, myStores, showMessage,user } = useContext(ServicesProvider);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterOption, setFilterOption] = useState("all");
  const menuAnchorRef = useRef(null);

  // Get unique areas from the user's myStores data
  const uniqueAreas = ["all", ...new Set(myStores.map(store => store.area))];

  // Fetch user's myStores when search or filter changes
  console.log('1111111111111',myStores)
  useEffect(() => {
    handleGetMyStores(searchQuery, filterOption === "all" ? "" : filterOption);
  }, [searchQuery, filterOption]);

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
            Loading your stores...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name="store-search-outline" 
          size={60} 
          color={theme.colors.backdrop} 
        />
        <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
          No stores found
        </Text>
        <Text style={[styles.emptySubText, { color: theme.colors.onSurface }]}>
          {searchQuery ? "Try a different search term" : "You don't have any stores yet"}
        </Text>
        {!searchQuery && (
          <Link href="/add-store" asChild>
            <Button 
              mode="contained" 
              style={{ marginTop: 16 }}
              icon="plus"
            >
              Add Your First Store
            </Button>
          </Link>
        )}
      </View>
    );
  };

  return (
    <PaperProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={[styles.headerText, { color: theme.colors.onSurface }]}>
            My Stores
          </Text>
        </View>

        {/* Search & Filter Row */}
        <View style={styles.searchSortContainer}>
          <TextInput
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            mode="outlined"
            placeholder="Search your stores..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { backgroundColor: theme.colors.surface }]}
            left={<TextInput.Icon icon="magnify" color={theme.colors.onSurface} />}
            right={
              searchQuery ? (
                <TextInput.Icon
                  icon="close"
                  color={theme.colors.onSurface}
                  onPress={() => setSearchQuery("")}
                />
              ) : null
            }
            theme={{ colors: { text: theme.colors.onSurface } }}
          />

          {myStores.length > 0 && (
            <Menu
              visible={filterVisible}
              onDismiss={() => setFilterVisible(false)}
              anchor={
                <Button
                  ref={menuAnchorRef}
                  onPress={() => setFilterVisible(true)}
                  mode="outlined"
                  style={[styles.sortButton, { borderColor: theme.colors.primary }]}
                  icon="filter"
                  contentStyle={{ flexDirection: "row-reverse" }}
                  labelStyle={{ color: theme.colors.primary }}
                >
                  {filterOption === "all" ? "All Areas" : filterOption}
                </Button>
              }
            >
              {uniqueAreas.map((area) => (
                <Menu.Item 
                  key={area}
                  leadingIcon={filterOption === area ? "check" : null}
                  onPress={() => { 
                    setFilterOption(area); 
                    setFilterVisible(false); 
                  }} 
                  title={area === "all" ? "All Areas" : area} 
                />
              ))}
            </Menu>
          )}
        </View>

        {/* Stores List */}
        <View style={{ flex: 1 }}>
          {myStores.length > 0 ? (
            <FlatList
              data={myStores}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <Card style={[styles.storeCard, { backgroundColor: theme.colors.surface }]} mode="elevated">
                  <Card.Title 
                    title={item.storeName} 
                    titleStyle={[styles.title, { color: theme.colors.onSurface }]} 
                    titleVariant="titleMedium"
                    subtitle={`Proprietor: ${item.proprietorName}`}
                    subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
                    left={() => (
                      <MaterialCommunityIcons 
                        name="store" 
                        size={24} 
                        color={theme.colors.primary} 
                        style={styles.storeIcon}
                      />
                    )}
                    right={() => (
                      <View style={[
                        styles.dueBadge, 
                        { 
                          backgroundColor: item.totalDue > 0 
                            ? theme.colors.errorContainer 
                            : theme.colors.surfaceVariant
                        }
                      ]}>
                        <Text style={[
                          styles.dueBadgeText, 
                          { 
                            color: item.totalDue > 0 
                              ? theme.colors.onErrorContainer 
                              : theme.colors.onSurfaceVariant
                          }
                        ]}>
                          ৳{(item.totalOutstanding - item.totalPaidAmount || 0).toLocaleString()}
                        </Text>
                      </View>
                    )}
                  />
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.storeInfo}>
                      <Text style={[styles.areaText, { color: theme.colors.primary }]}>
                        <MaterialCommunityIcons 
                          name="map-marker" 
                          size={16} 
                          color={theme.colors.primary} 
                        /> {item.area}
                      </Text>
                      <Text style={[styles.storeCode, { color: theme.colors.onSurfaceVariant }]}>
                        Code: {item.storeCode}
                      </Text>
                    </View>
                    <Link href={`/stores/${item._id}`} asChild>
                      <TouchableOpacity style={styles.arrowButton}>
                        <MaterialIcons 
                          name="arrow-forward-ios" 
                          size={20} 
                          color={theme.colors.primary} 
                        />
                      </TouchableOpacity>
                    </Link>
                  </Card.Content>
                </Card>
              )}
            />
          ) : (
            renderEmptyState()
          )}
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerText: {
    fontWeight: "bold",
  },
  searchSortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 8,
  },
  sortButton: {
    height: 48,
    justifyContent: "center",
    borderRadius: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  storeCard: {
    marginVertical: 5,
    marginHorizontal: 3,
    borderRadius: 12,
  },
  storeIcon: {
    marginRight: 10,
  },
  title: {
    fontWeight: "bold",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 0,
  },
  storeInfo: {
    flex: 1,
    marginRight: 8,
  },
  areaText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  storeCode: {
    fontSize: 14,
  },
  dueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  dueBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  arrowButton: {
    padding: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});

export default MyStoresScreen;
