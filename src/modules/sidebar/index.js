import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/Feather';
import { Item, Thumbnail } from 'native-base';
import { Actions } from 'react-native-router-flux';
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Text,
  ToastAndroid,
  Alert,
} from 'react-native';
import { default as MenuIconButton } from './components/MenuIconButton';
import { labelStyles, Colors, dimensions } from '../../themes';
import { sidebarMenus } from '../../constants';
import { LoginManager, FirebaseManager } from '../../firebase/index';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.sidebarBGColor,
    height: dimensions.getViewportHeight(),
  },
  headerContainer: {
    minHeight: 160,
    backgroundColor: Colors.defaultBgColor,
    justifyContent: 'flex-end',
    padding: 10,
    alignItems: 'flex-start',
  },
  bodyStyle: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: Colors.sidebarBGColor,
    paddingBottom: 10,
  },
  largeLabel: {
    fontSize: 15,
    color: Colors.primaryBgColor,
  },
  smallLabel: {
    fontSize: 14,
    color: Colors.placeholderTxtColor,
  },
});


export default class Sidebar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      menus: sidebarMenus.menusList,
    };
  }

  handleLogout = () => {
    LoginManager.logout()
    .then(() => {
      ToastAndroid.show('Successfully logged out!', ToastAndroid.SHORT);
      Actions.loginScreen({ type: 'reset' });
    }).catch((error) => {
      Alert.alert('Error', `${error}`);
    });
  }

  handleSubmit = (key, index) => {
    if(index === 3) {
      Alert.alert('Logout', 'Are you sure you want to logout',[
        {
          text: 'NO',
          style: 'cancel',
        },{
          text: `I'M Sure`,
          onPress: () => this.handleLogout(),
        }
      ]);
      this.props.toggleDrawer();
      return;
    }
    // TODO: Set selected menu
    // let menusList = this.state.menus.map((item, itemIndex) => {
    //   if (itemIndex === index) {
    //     item.active = true;
    //   } else {
    //     item.active = false;
    //   }
    //   return item;
    // });
    // this.setState({
    //   menus: menusList,
    // });
    
    if(index === 0) {
      Actions.homeScreen();
      return;
    }
    if(index === 1) {
      Actions.myProfile();
      return;
    }
    if(index === 2) {
      Actions.settings();
      return;
    }
  }

  renderUnauthenticatedView() {
    return (
      <View>
        <Text style={styles.largeLabel}>Not logged in?</Text>
        <Item>
          <Text onPress={() => Actions.loginScreen()} style={styles.smallLabel}>Login</Text>
          <Text style={styles.smallLabel}>/</Text>
          <Text onPress={() => Actions.signupScreen()} style={styles.smallLabel}>Register</Text>
        </Item>
      </View>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Thumbnail large source={{ uri: 'http://bionicinterface.com/web/googida/art4ever/a0128/a03.png' }} />
          <Text style={styles.smallLabel}>{`You're logged in as`}</Text>
          <Text style={styles.largeLabel}>{FirebaseManager.profile.name}</Text>
          <Text style={styles.largeLabel}>{FirebaseManager.profile.email}</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.bodyStyle}>
            {
              this.state.menus.map((menuItem, index) => {
                return (
                  <MenuIconButton
                    key={index}
                    label={menuItem.label}
                    active={menuItem.active}
                    icon={menuItem.icon}
                    onMenuIconPress={() => this.handleSubmit(menuItem.key, index)}
                  />
                );
              })
            }
          </View>
        </ScrollView>
      </View>
    );
  }
}

Sidebar.propTypes = {
  hasHeader: PropTypes.bool,
};

Sidebar.defaultProps = {
  hasHeader: false,
};
