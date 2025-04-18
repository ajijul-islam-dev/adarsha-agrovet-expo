import React, { useState, useRef, useContext, useEffect } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Card, Text, Button, Menu, PaperProvider, Divider, useTheme } from "react-native-paper";
import { Link } from "expo-router";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ServicesProvider } from '../../provider/Provider.jsx';

const OfficersListScreen = () => {
  const theme = useTheme();
  const { handleGetAllOfficers, loading, officers, showMessage } = useContext(ServicesProvider);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterOption, setFilterOption] = useState("all");
  const menuAnchorRef = useRef(null);
  // Get unique areas from the officers data
  const uniqueAreas = ["all", ...new Set(officers.map(officer => officer.area))];



  // Filter officers based on search and filter
  const filteredOfficers = officers.filter((officer) => {
    const matchesSearch = officer.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterOption === "all" || officer.area === filterOption;
    return matchesSearch && matchesFilter;
  });

  // Fetch officers when search or filter changes
  useEffect(() => {
    handleGetAllOfficers(searchQuery, filterOption);
  }, [searchQuery, filterOption]);

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
            Loading officers...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name="account-search" 
          size={60} 
          color={theme.colors.backdrop} 
        />
        <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
          No officers found
        </Text>
        <Text style={[styles.emptySubText, { color: theme.colors.onSurface }]}>
          {searchQuery ? "Try a different search term" : "Add officers to get started"}
        </Text>
      </View>
    );
  };

  return (
    <PaperProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={[styles.headerText, { color: theme.colors.onSurface }]}>
            Officers List
          </Text>
        </View>

        {/* Search & Filter Row */}
        <View style={styles.searchSortContainer}>
          <TextInput
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            mode="outlined"
            placeholder="Search officer..."
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
        </View>

        {/* Officers List */}
        <View style={{ flex: 1 }}>
          {filteredOfficers.length > 0 ? (
            <FlatList
              data={filteredOfficers}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <Card style={[styles.productCard, { backgroundColor: theme.colors.surface }]} mode="elevated">
                  <Card.Title 
                    title={item.name} 
                    titleStyle={[styles.title, { color: theme.colors.onSurface }]} 
                    titleVariant="titleMedium"
                    right={() => (
                      <View style={[styles.dueBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <Text style={[styles.dueBadgeText, { color: theme.colors.primary }]}>
                          ৳{item.financials?.netDues?.toLocaleString() || '0'}
                        </Text>
                      </View>
                    )}
                  />
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.officerInfo}>
                      <Text style={[styles.areaText, { color: theme.colors.primary }]}>
                        <MaterialCommunityIcons 
                          name="map-marker" 
                          size={16} 
                          color={theme.colors.primary} 
                        /> {item.area}
                      </Text>
                      <Text style={[styles.areaCode, { color: theme.colors.onSurface }]}>
                        Code: {item.areaCode}
                      </Text>
                    </View>
                    <Link href={`/officers-list/${item._id}`} asChild>
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
    padding: 10,
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
  productCard: {
    marginVertical: 12,
    borderRadius: 12,
    marginHorizontal: 8
  },
  title: {
    fontWeight: "bold",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 0,
  },
  officerInfo: {
    flex: 1,
    marginRight: 8,
  },
  areaText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  areaCode: {
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

export default OfficersListScreen;