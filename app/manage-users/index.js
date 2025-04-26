import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Searchbar, Menu, Divider, Button, IconButton } from 'react-native-paper';
import { ServicesProvider } from '../../provider/Provider.jsx';

const UserManagementScreen = () => {
  const { handleGetAllUsers, handleUpdateUserStatus, showMessage, loading } = useContext(ServicesProvider);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAction, setSelectedAction] = useState('');
 const [visibleMenu,setVisibleMenu] = useState(null);
  const fetchUsers = async () => {
    const query = { }; // Only show officers by default
    if (searchQuery) query.search = searchQuery;
    if (selectedArea !== 'All Areas') query.area = selectedArea;
    
    const result = await handleGetAllUsers(query);
    if (result.success) {
      setUsers(result.users);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, selectedArea]);

  const handleStatusChange = async (userId, newStatus) => {
    const result = await handleUpdateUserStatus(userId, newStatus);
    if (result.success) {
      showMessage(`User ${newStatus} successfully`, 'success');
      fetchUsers();
      setConfirmModalVisible(false);
    }
  };

  const openConfirmationModal = (user, action) => {
    setSelectedUser(user);
    setSelectedAction(action);
    setConfirmModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.status, 
            item.status === 'active' && { color: 'green' },
            item.status === 'pending' && { color: 'orange' },
            item.status === 'suspended' && { color: 'red' },
            item.status === 'rejected' && { color: 'red' }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.detailRow}>
        <Text style={styles.area}>{item.role}</Text>
        <Text style={styles.area}>{item.area}</Text>
      </View>
      
      <View style={styles.actionsContainer}>
        {item.status !== 'active' && (
          <IconButton 
            icon="check-circle"
            iconColor="green"
            size={24}
            onPress={() => openConfirmationModal(item, 'active')}
          />
        )}
        
        {item.status !== 'suspended' && (
          <IconButton 
            icon="pause-circle"
            iconColor="orange"
            size={24}
            onPress={() => openConfirmationModal(item, 'suspended')}
          />
        )}
        
        {item.status !== 'rejected' && (
          <IconButton 
            icon="close-circle"
            iconColor="red"
            size={24}
            onPress={() => openConfirmationModal(item, 'rejected')}
          />
        )}
      </View>
    </View>
  );

  const areaOptions = ['All Areas', 'bogura', 'Shibganj', 'amtoly']; // Add more areas as needed

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Officers List</Text>
      <View style={{flexDirection : 'row',justifyContent : 'space-between',gap : 5}}>
            <Searchbar
        placeholder="Search officer..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={{...styles.searchBar,width : '60%'}}
      />
      
      <Menu
        style={{width : '25%'}}
        visible={visibleMenu === 'area'}
        onDismiss={() => setVisibleMenu(null)}
        anchor={
          <TouchableOpacity 
            style={styles.areaFilter} 
            onPress={() => setVisibleMenu('area')}
          >
            <Text style={styles.areaFilterText}>{selectedArea}</Text>
            <IconButton icon="chevron-down" size={16} />
          </TouchableOpacity>
        }
      >
        {areaOptions.map(area => (
          <Menu.Item 
            key={area}
            onPress={() => {
              setSelectedArea(area);
              setVisibleMenu(null);
            }} 
            title={area}
          />
        ))}
      </Menu>
      </View>
      <Divider style={styles.divider} />
      
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No officers found</Text>
          }
        />
      )}
      
      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Action</Text>
            <Text style={styles.modalText}>
              Are you sure you want to {selectedAction} {selectedUser?.name}?
            </Text>
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setConfirmModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={() => handleStatusChange(selectedUser._id, selectedAction)}
                style={styles.modalButton}
              >
                Confirm
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal : 10,
    marginTop : 20
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'start'
  },
  searchBar: {
    marginBottom: 16,
    borderRadius: 8
  },
  areaFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16
  },
  areaFilterText: {
    fontSize: 16
  },
  divider: {
    marginBottom: 16,
    height: 1,
    backgroundColor: '#eee'
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal : 5,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 1
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  status: {
    fontSize: 14,
    fontWeight: '500'
  },
  detailRow: {
    marginBottom: 8
  },
  area: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic'
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8
  },
  listContent: {
    paddingBottom: 16
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666'
  },
  loader: {
    marginTop: 40
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: '80%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8
  }
});

export default UserManagementScreen;