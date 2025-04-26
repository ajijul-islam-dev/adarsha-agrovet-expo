import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useContext } from 'react';
import { ServicesProvider } from '../../provider/Provider.jsx';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

const Profile = () => {
  const { user, isAuthenticated, handleLogout } = useContext(ServicesProvider);
  const { colors } = useTheme();

  const renderAvatar = () => {
    if (user?.avatar) {
      return (
        <Image
          source={{ uri: user.avatar }}
          style={[styles.avatarImage, { borderColor: colors.surface }]}
        />
      );
    }
    return (
      <View style={[styles.avatarIconContainer, { backgroundColor: colors.primary }]}>
        <MaterialIcons name="person" size={60} color={colors.surface} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.header, { borderBottomColor: colors.outline }]}>
          <Text style={[styles.headerTitle, { color: colors.onBackground }]}>Profile</Text>
        </View>

        {isAuthenticated() ? (
          <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
              {renderAvatar()}
              <TouchableOpacity style={[styles.avatarEditButton, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={20} color={colors.surface} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.userName, { color: colors.onBackground }]}>{user?.name || 'Anonymous'}</Text>
            <Text style={[styles.userEmail, { color: colors.onSurfaceVariant }]}>{user?.email}</Text>

            {/* User Role and Status */}
            <View style={styles.userMetaContainer}>
              <View style={[styles.metaBadge, { backgroundColor: colors.secondaryContainer }]}>
                <Text style={[styles.metaText, { color: colors.onSecondaryContainer }]}>
                  {user?.role?.toUpperCase() || 'USER'}
                </Text>
              </View>
              {user?.status && (
                <View style={[styles.metaBadge, { backgroundColor: colors.tertiaryContainer }]}>
                  <Text style={[styles.metaText, { color: colors.onTertiaryContainer }]}>
                    {user.status.toUpperCase()}
                  </Text>
                </View>
              )}
              {user?.area && (
                <View style={[styles.metaBadge, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.metaText, { color: colors.onPrimaryContainer }]}>
                    {user.area.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.editButtonText, { color: colors.onPrimary }]}>Edit Profile</Text>
            </TouchableOpacity>

            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="settings-outline" size={24} color={colors.onSurface} />
                <Text style={[styles.menuText, { color: colors.onSurface }]}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="notifications-outline" size={24} color={colors.onSurface} />
                <Text style={[styles.menuText, { color: colors.onSurface }]}>Notifications</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="help-circle-outline" size={24} color={colors.onSurface} />
                <Text style={[styles.menuText, { color: colors.onSurface }]}>Help Center</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color={colors.error} />
                <Text style={[styles.menuText, { color: colors.error }]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.guestContainer}>
            <View style={[styles.guestAvatar, { backgroundColor: colors.surfaceVariant }]}>
              <MaterialIcons name="person" size={60} color={colors.onSurfaceVariant} />
            </View>
            <Text style={[styles.guestText, { color: colors.onSurfaceVariant }]}>You're not logged in</Text>
            <Link href="/signin" asChild>
              <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.primary }]}>
                <Text style={[styles.loginButtonText, { color: colors.onPrimary }]}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}

        {/* Footer with Copyright and Social Media */}
        <View style={[styles.footer, { borderTopColor: colors.outline }]}>
          <Text style={[styles.copyrightText, { color: colors.outline }]}>
            © 2025 Developed by Ajijul Islam
          </Text>
          <View style={styles.socialIconsContainer}>
            <TouchableOpacity onPress={()=>Linking.openURL('https://www.facebook.com/ajijul.islam.dev')} style={styles.socialIcon}>
              <FontAwesome name="facebook" size={24} color={'blue'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>Linking.openURL('https://github.com/ajijul-islam-dev')} style={styles.socialIcon}>
              <FontAwesome name="github" size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>Linking.openURL('https://www.linkedin.com/in/ajijul-islam-dev')} style={styles.socialIcon}>
              <FontAwesome name="linkedin" size={24} color={'blue'} />
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileContainer: {
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
    width: 120,
    height: 120,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 3,
    backgroundColor: '#e1e1e1',
  },
  avatarIconContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 20,
  },
  userMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  metaBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    margin: 4,
  },
  metaText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  editButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginBottom: 30,
  },
  editButtonText: {
    fontWeight: 'bold',
  },
  menuContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  menuText: {
    marginLeft: 15,
    fontSize: 16,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  guestAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  guestText: {
    fontSize: 18,
    marginVertical: 20,
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    marginTop: 'auto',
  },
  copyrightText: {
    fontSize: 12,
    marginBottom: 10,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  socialIcon: {
    marginHorizontal: 10,
  },
});