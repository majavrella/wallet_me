import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  ListView,
  Keyboard,
  RefreshControl,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  NetInfo,
  ToastAndroid,
} from 'react-native';
import { Container, Item, Input, Button } from 'native-base';
import Icon from 'react-native-vector-icons/FontAwesome';
import Autocomplete from 'react-native-autocomplete-input';
import { Actions } from 'react-native-router-flux';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { containerStyles, dimensions, Colors, labelStyles } from '../../themes';
import { Header, StatusBar } from '../../components';
import { AccountListItem, CustomDialog } from './components';
import { local } from '../../constants';
import withDrawer from '../../utils/withDrawer';
import { networkConnectivity, linkState } from '../../utils';
import { FirebaseManager } from '../../firebase/index';

const styles = StyleSheet.create({
  popContainer: {
    backgroundColor: Colors.defaultGreyColor,
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.95,
  },
  popupOuterContainer: {
    width: dimensions.getViewportWidth(),
    height: 250,
    justifyContent: 'center',
  },
  closePopupButton: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.defaultBgColor,
    borderRadius: 22,
    marginBottom: -20,
    marginRight: 15,
    zIndex: 10,
  },
  popupInnerContainer: {
    width: 300,
    padding: 10,
    minHeight: 200,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: Colors.primaryBgColor,
    borderRadius: 5,
  },
  listHeader: {
    marginTop: 5,
    padding: 10,
    backgroundColor: Colors.primaryBgColor,
    color: 'white',
    fontSize: dimensions.primayFontSize,
  },
  content: {
    alignSelf: 'stretch',
    flex: 1,
  },
  iconStyle: {
    color: Colors.themeIconColor,
    marginRight: 5,
  },
  filterIconStyle: {
    color: Colors.placeholderTxtColor,
    marginRight: 5,
  },
  filterIconStyle2: {
    color: Colors.primaryBgColor,
  },
  filterIconStyle2Container: {
    marginTop: 10,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedTextContainer: {
    padding: 10,
  },
  listContainerStyle: {
    height: dimensions.getViewportHeight() / 3,
    width: dimensions.getViewportWidth() - 30,
  },
  searchBar: {
    margin: 10,
    paddingLeft: 10,
    borderWidth: 1,
    borderColor: Colors.placeholderTxtColor,
    borderRadius: 5,
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
  },
  trueSearchBar: {
    borderWidth: 1,
    borderColor: Colors.blackIconColor,
    marginLeft: 10,
    marginTop: 10,
  },
});

class Home extends Component {
  constructor() {
    super();
    const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    this.state = {
      dataSource: ds.cloneWithRows([]),
      filter: local.getFilterList()[0],
      showFilter: false,
      refreshing: false,
      searchingItems: [],
      accounts: [],
      account: {},
      searchedText: 'Search',
      isSearching: false,
      isLoading: false,
      // Unlocker state
      showPermissionUnlocker: false,
      password: '',
      actionIndex: -1,
    };
  }

  componentWillMount() {
    NetInfo.isConnected.fetch().then((isConnected) => {
      isConnected ? this.setState({ netStatus: true }) : this.setState({ netStatus: false });
    });
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);
  }

  componentDidMount() {
    this.loadAccounts();
  }

  componentWillUnmount() {
    this.keyboardDidHideListener.remove();
    Keyboard.dismiss();
  }

  componentWillReceiveProps(newProps) {
    console.log('newProps ==', newProps)
  }

  loadAccounts = () => {
    this.setState({ isLoading: true });
    networkConnectivity().then(() => {
      FirebaseManager.loadAccounts()
      .then((accounts) => {
        const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
        this.setState({
          isLoading: false,
          refreshing: false,
          accounts: accounts,
          dataSource: ds.cloneWithRows(accounts),
        });
      }).catch((error) => {
        this.setState({ isLoading: false, refreshing: false });
        Alert.alert('Load account error', `${error}`);
      });
    }).catch((error) => {
      const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
      this.setState({
        isLoading: false,
        refreshing: false,
        accounts: FirebaseManager.accounts,
        dataSource: ds.cloneWithRows(FirebaseManager.accounts),
      });
      Alert.alert('Network Error', `${error}`);
    });
  }

  keyboardDidHide = () => {
    this.setState({ 
      isSearching: false,
    });
  }

  onPopupEvent = (eventName, index, account) => {
    // TODO:
    if (eventName !== 'itemSelected') return
    if (index === 0) {
      this.setState({
        showPermissionUnlocker: true,
        account: account,
        actionIndex: 0,
      });
    } else if(index === 1) {
      Alert.alert('Delete Account', 'Are you sure you want to delete the account',[
        {
          text: 'NO',
          style: 'cancel',
        },{
          text: `I'M Sure`,
          onPress: () => this.setState({
            showPermissionUnlocker: true,
            account: account,
            actionIndex: 1,
          }),
        }
      ]);
    }
  }

  handleDeleteAccount = (account) => {
    // Delete the account.
    FirebaseManager.deleteAccount(account)
    .then(() => {
      ToastAndroid.show('Successfully deleted!', ToastAndroid.LONG);
      this.loadAccounts();
    }).catch((error) => {
      Alert.alert('Error', `${error}`);
    });
  }

  handleRefresh = () => {
    TODO:
    this.setState({refreshing: true});
    this.loadAccounts();
  }

  handleSearch(text) {
    const data = this.state.accounts.filter(account =>
      account[this.state.filter.key].toLowerCase().startsWith(text.toLowerCase()));

    this.setState({
      searchingItems: data,
      searchedText: text,
    });
  }

  handleSearchSelection(searchText) {
    const data = this.state.accounts.filter(account =>
      account[this.state.filter.key].toLowerCase().startsWith(searchText.toLowerCase()));
    const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    this.setState({
      dataSource: searchText ? ds.cloneWithRows(data) : ds.cloneWithRows(this.state.accounts),
      searchingItems: [],
      searchedText: searchText,
      isSearching: false,
    });
  }

  handleFilterSelection = (value) => {
    this.setState({
      filter: value,
      showFilter: false,
    });
  }

  handleStartSearch = () => {
    this.setState({ isSearching: true })
  }

  handleStopSearch = () => {
    const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    this.setState({
      searchedText: 'Search',
      dataSource: ds.cloneWithRows(this.state.accounts),
    })
  }

  renderFilterContainer = () => {
    return (
      <CustomDialog
        options={local.getFilterList()}
        onPressClose={() => this.setState({ showFilter: false })}
        onSelectItem={this.handleFilterSelection}
      />
    );
  }

  handlePermissionUnlocker() {
    const { password, actionIndex, account } = this.state;
    if (password !== FirebaseManager.profile.password) {
      Alert.alert('User vaildation', 'You are not allowed.');
      return;
    }
    if (actionIndex === 0) {
      this.setState({ 
        showPermissionUnlocker: false,
        password: '',
        actionIndex: -1,
      });
      // Redirect to account form to edit the account.
      Actions.accountForm({ create: false, account: account});
    } else if(actionIndex === 1) {
      this.setState({ 
        showPermissionUnlocker: false,
        password: '',
        actionIndex: -1,
      });
      this.handleDeleteAccount(account)
    }
  }

  renderPermissionUnlocker() {
    return (
      <View style={styles.popContainer}>
        <View style={styles.popupOuterContainer}>
          <TouchableOpacity
            style={styles.closePopupButton}
            onPress={() => this.setState({ showPermissionUnlocker: false })}
          >
            <Icon name="close" color="black" size={30} style={{ padding: 5 }} />
          </TouchableOpacity>
          <View style={styles.popupInnerContainer}>
            <Text style={labelStyles.whiteXtraLargeLabel}>Enter Password</Text>
            <Item style={{ marginVertical: dimensions.smallDimension }}>
              <Input
                style={labelStyles.whiteSmallLabel}
                placeholderTextColor={Colors.placeholderTxtColor}
                placeholder={'Password'}
                returnKeyType="done"
                secureTextEntry
                onSubmitEditing={() => this.handlePermissionUnlocker()}
                {...linkState(this, 'password')}
              />
            </Item>
            {this.state.isLoading ?
              <ActivityIndicator
                animating={Boolean(true)}
                color={'#bc2b78'}
                size={'large'}
                style={containerStyles.activityIndicator}
              /> :
              <Button
                onPress={() => this.handlePermissionUnlocker()}
                full
                transparent
                style={{ marginVertical: 15 }}
              >
                <Text style={labelStyles.primaryButtonLabel}>Unlock</Text>
              </Button>}
          </View>
        </View>
      </View>
    );
  }

  render() {
    const {
      refreshing,
      filter,
      showFilter,
      searchingItems,
      isSearching,
      searchedText,
      showPermissionUnlocker,
    } = this.state;
    return (
      <Container style={containerStyles.defaultContainer}>
        <StatusBar />
        <Header
          title="Home"
          showFilterIcon={!isSearching}
          onPressleftIcon={() => this.props.toggleDrawer()}
          onPressRightIcon={() =>
            Actions.accountForm({ create: true, account: local.newAccountObject })}
          onPressFilterIcon={() => this.setState({ showFilter: true })}
        />
        {isSearching ?
          <View style={{ flexDirection: 'row' }}>
            <Autocomplete
              inputContainerStyle={styles.trueSearchBar}
              listContainerStyle={styles.listContainerStyle}
              data={searchingItems}
              autoFocus
              selectTextOnFocus
              underlineColorAndroid='transparent'
              defaultValue={searchedText}
              onChangeText={text => this.handleSearch(text)}
              renderItem={data => (
                <TouchableOpacity
                  style={styles.suggestedTextContainer}
                  onPress={() => this.handleSearchSelection(data[filter.key])}
                >
                  <Text style={labelStyles.blackMediumLabel}>{data[filter.key]}</Text>
                </TouchableOpacity>
              )}
            />
            <View style={styles.filterIconStyle2Container}>
              <Icon style={styles.filterIconStyle2} size={15} name={filter.icon} />
            </View>
          </View> :
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.searchBar}
              onPress={this.handleStartSearch}
            >
              <Icon style={styles.iconStyle} size={20} name='search' />
              <Text style={{ flex: 1 }}>{searchedText}</Text>
              <Icon style={styles.filterIconStyle} size={14} name={filter.icon} />
              <TouchableOpacity
                style={{ paddingHorizontal: 20, paddingVertical: 15 }}
                onPress={() => this.handleStopSearch()}
              >
                <Icon style={styles.filterIconStyle} size={14} name="close" />
              </TouchableOpacity>
            </TouchableOpacity>
            {this.state.isLoading ?
              <ActivityIndicator
                animating={Boolean(true)}
                color={'#bc2b78'}
                size={'large'}
                style={containerStyles.activityIndicator}
              /> :
              <ListView
                style={{ marginVertical: 5 }}
                enableEmptySections
                dataSource={this.state.dataSource}
                renderRow={account => (
                  <AccountListItem
                    key={`${account.app_name}`}
                    onPressItem={acc => this.handleAccountSelection(acc)}
                    onPopupEvent={this.onPopupEvent}
                    account={account}
                  />)}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={this.handleRefresh}
                  />
                }
              />}
            {showFilter && this.renderFilterContainer()}
            {showPermissionUnlocker && this.renderPermissionUnlocker()}
          </View>
          }
      </Container>
    );
  }
}

Home.propTypes = {
  toggleDrawer: PropTypes.func,
};

Home.defaultProps = {
  toggleDrawer: undefined,
};

const mapStateToProps = state => ({});

const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(withDrawer(Home));
