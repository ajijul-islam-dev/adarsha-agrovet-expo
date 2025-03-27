import React, { useState, useRef } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Card, Text, Button, Menu, Divider, useTheme } from "react-native-paper";
import { Link } from "expo-router";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const AllStoresScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterOption, setFilterOption] = useState("all");
  const menuAnchorRef = useRef(null);

  const stores = [
    { 
      id: "1", 
      name: "Al Muhib Pharmacy", 
      proprietor: "Mohammad Ali", 
      location: "Dhaka", 
      area: "Mirpur", 
      totalDue: 25000 
    },
    { 
      id: "2", 
      name: "City Medicine Corner", 
      proprietor: "Abdul Karim", 
      location: "Chittagong", 
      area: "Agrabad", 
      totalDue: 18000 
    },
    { 
      id: "3", 
      name: "Greenland Pharmacy", 
      proprietor: "Fatima Begum", 
      location: "Dhaka", 
      area: "Dhanmondi", 
      totalDue: 32000 
    },
  ];

  const filteredStores = stores.filter((store) => {
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterOption === "all" || store.area === filterOption;
    return matchesSearch && matchesFilter;
  });

  const uniqueAreas = ["all", ...new Set(stores.map(store => store.area))];

  return (
    <SafeAreaView style={styles.container}>
      {/* Search & Filter Row */}
      <View style={styles.searchSortContainer}>
        <TextInput
          outlineColor="transparent"
          activeOutlineColor='transparent'
          mode="outlined"
          placeholder="Search stores..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{...styles.searchInput, borderColor: theme.colors.primary, borderWidth: 1}}
          left={<TextInput.Icon icon="magnify" />}
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
              labelStyle={{ color: theme.colors.primary }}
            >
              {filterOption === "all" ? "All Areas" : filterOption}
            </Button>
          }
        >
          {uniqueAreas.map((area) => (
            <Menu.Item 
              key={area}
              onPress={() => { 
                setFilterOption(area); 
                setFilterVisible(false); 
              }} 
              title={area === "all" ? "All Areas" : area} 
            />
          ))}
        </Menu>
      </View>

      {/* Stores List */}
      <FlatList
        data={filteredStores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={[styles.card, { borderRadius: 8 }]}>
            <Card.Title 
              title={item.name} 
              titleStyle={styles.title}
              subtitle={`Proprietor: ${item.proprietor}`}
              subtitleStyle={{color: theme.colors.primary}}
              left={() => <FontAwesome5 name="store-alt" size={24} color={theme.colors.primary} style={styles.storeIcon} />}
            />
            <Card.Content style={styles.cardContent}>
              <View>
                <Text style={styles.location}>Location: {item.location}</Text>
                <Text style={styles.area}>Area: {item.area}</Text>
                <Text style={styles.due}>Total Due: ৳{item.totalDue.toLocaleString()}</Text>
              </View>
              <Link href={`/store-details/${item.id}`} asChild>
                <MaterialIcons 
                  name="arrow-forward-ios" 
                  size={20} 
                  color={theme.colors.primary} 
                  style={styles.arrowIcon}
                />
              </Link>
            </Card.Content>
          </Card>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: "#f8f9fa" 
  },
  searchSortContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 10 
  },
  searchInput: { 
    flex: 3, 
    marginRight: 10, 
    backgroundColor: "transparent", 
    borderRadius: 8 
  },
  sortButton: { 
    flex: 1, 
    borderRadius: 8, 
    borderWidth: 1 
  },
  card: { 
    marginBottom: 10, 
    backgroundColor: "#fff", 
    elevation: 3 
  },
  title: { 
    fontSize: 18, 
    fontWeight: "bold" 
  },
  storeIcon: {
    marginRight: 10,
    marginLeft: 5
  },
  cardContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 5
  },
  location: {
    fontSize: 14,
    color: "#555"
  },
  area: {
    fontSize: 14,
    color: "#555",
    marginVertical: 3
  },
  due: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#dc3545"
  },
  arrowIcon: {
    padding: 8,
  },
});

export default AllStoresScreen;