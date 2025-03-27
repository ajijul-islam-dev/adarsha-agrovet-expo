import React, { useState, useRef } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Card, Text, Button, Menu, PaperProvider, Divider, useTheme } from "react-native-paper";
import { Link } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

const OfficersListScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterOption, setFilterOption] = useState("all");
  const menuAnchorRef = useRef(null);

  const officers = [
    { id: "1", name: "John Doe", totalDue: 15000, area: "Dhaka", areaCode: "DH-101" },
    { id: "2", name: "Jane Smith", totalDue: 8500, area: "Chittagong", areaCode: "CTG-202" },
    { id: "3", name: "Mike Johnson", totalDue: 22000, area: "Dhaka", areaCode: "DH-102" },
    { id: "4", name: "Sarah Williams", totalDue: 12000, area: "Sylhet", areaCode: "SYL-301" },
    { id: "5", name: "David Brown", totalDue: 18000, area: "Chittagong", areaCode: "CTG-203" },
  ];

  const filteredOfficers = officers.filter((officer) => {
    const matchesSearch = officer.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterOption === "all" || officer.area === filterOption;
    return matchesSearch && matchesFilter;
  });

  const uniqueAreas = ["all", ...new Set(officers.map(officer => officer.area))];

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        {/* Search & Filter Row */}
        <View style={styles.searchSortContainer}>
          <TextInput
            outlineColor="transparent"
            activeOutlineColor='transparent'
            mode="outlined"
            placeholder="Search officer..."
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
                style={[styles.sortButton, { borderColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }]}
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

        {/* Officers List */}
        <View style={{ flex: 1 }}>
          <FlatList
            data={filteredOfficers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card style={[styles.productCard, { borderRadius: 8 }]}>
                <Card.Title 
                  title={item.name} 
                  titleStyle={styles.title} 
                  subtitle={`Area: ${item.area} (${item.areaCode})`}
                  subtitleStyle={{color: theme.colors.primary}}
                />
                <Card.Content style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={styles.price}>Total Due: ৳{item.totalDue.toLocaleString()}</Text>
                    <Text style={styles.packSize}>Area Code: {item.areaCode}</Text>
                  </View>
                  <Link href={`/officer-details/${item.id}`} asChild>
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
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  searchSortContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  searchInput: { flex: 3, marginRight: 10, backgroundColor: "transparent", borderRadius: 8 },
  sortButton: { flex: 1, borderRadius: 8, borderWidth: 1 },

  // Card
  productCard: { marginBottom: 10, backgroundColor: "#fff", elevation: 3 },
  title: { fontSize: 18, fontWeight: "bold" },
  price: { fontSize: 16, fontWeight: "bold", color: "#007BFF" },
  packSize: { fontSize: 14, fontWeight: "600" },
  arrowIcon: {
    padding: 8,
  },
});

export default OfficersListScreen;