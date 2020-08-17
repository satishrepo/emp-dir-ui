import { Component, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { PopoverController, ModalController, AlertController, LoadingController, IonInfiniteScroll, MenuController, ToastController } from '@ionic/angular';
import { ProfilePopoverComponent } from './../component/profile-popover/profile-popover.component';
import { PeopleDetailComponent } from '../modal/people-detail/people-detail.component';
import { DogDetailComponent } from '../modal/dog-detail/dog-detail.component';
import { HomeService } from '../shared/services/home.service';
import { LocalStorageService } from '../shared/services/local-storage.service';
import { LoginService } from '../shared/services/login.service';
import { LoadingService } from '../shared/services/loading.service';
import { Util } from '../shared/services/util';
import { Enum } from '../shared/config/enum.enum';
import { Platform, Events } from "@ionic/angular";
import { AppMessage } from '../shared/config/app-message.enum';
import { Subscription } from 'rxjs';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { Device } from '@ionic-native/device/ngx';
import { AppVersion } from '@ionic-native/app-version/ngx';

import { NetworkService } from '../shared/services/network.service';
import { Network } from '@ionic-native/network/ngx';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage implements OnInit {

  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;
  @ViewChild('filterBox') filterBox;
  @ViewChild('backdropOverlay') backdropOverlay;
  @ViewChild('footerButtons') footerButtons;
  @ViewChild('departmentList') departmentList;
  @ViewChild('locationList') locationList;
  @ViewChild('filterLists') filterLists;
  @ViewChild('logo') logo;
  @ViewChild('searchbar') searchInput;


  slideOpts = {
    zoom: false,
    slidesPerView: 'auto',
    spaceBetween: 0,
    freeMode: true
  };
  filters: any = {
    tab: 'department',
    groupBy: 'department',
    pageSize: 8,
    location: '',
    department: '',
    filterDetail: {
      locations: [],
      departments: [],
      alphabets: []
    },
    pageNumber: 1,
    searchText: ''
  };
  contactList: any = [];
  pagingInfo: any = {};
  // imageList: any = [];
  noResult: Boolean = false;
  isOffline: Boolean = false;
  isWeb: Boolean = true;
  loggedUser: any;
  appSearchOpened: Boolean = false;
  loading;
  loadingData: Boolean = false;
  openFilterBox: Boolean = false;
  filtersArr: any = {locations: [], departments: []};
  alphabets: String[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  prevPage: String = '';
  subscription: Subscription;
  selectAll: any = {
    departments: false, locations: false
  };
  appPrevTab = '';
  networkStatus: String = 'online';
  syncProgress: Number = 0;
  lastSyncDate: String = '';
  offlineMode: String = 'off';
  // syncComplete: Boolean = false;
  offlineSetting: Boolean = false;
  addSpaceonIphone: Boolean = false;
  appVersionNum: any;
  isDownloadIntrupted: Boolean = false;
  refreshDone: string;

  lastTimeBackPress = 0;
  timePeriodToExit = 2000;

  constructor(
    private router: Router,
    public popoverController: PopoverController,
    public modalController: ModalController,
    private homeService: HomeService,
    private localStorageService: LocalStorageService,
    public loadingController: LoadingController,
    public platform: Platform,
    public alertController: AlertController,
    private renderer: Renderer2,
    public menu: MenuController,
    public googleplus: GooglePlus,
    private loadingService: LoadingService,
    private util: Util,
    private loginService: LoginService,
    private device: Device,
    private appVersion: AppVersion,

    private networkService: NetworkService,
    public events: Events,
    public network: Network,
    
    ) {
      
    }

    ionViewDidEnter() {

      if (this.platform.is('cordova')) {
        this.isWeb = false;
      }

      this.subscription = this.homeService.getMessage()
      .subscribe(message => {

        console.log('ionview network detected fired from service : ', message);

        // check if dog Added 
        if(message.hasOwnProperty('dogAdded') && this.pagingInfo.totalRecords < this.filters.pageSize) {
          console.log('DOG ADDED', message);
          // this.contactList.push(message.dogAdded);
          this.contactList = [];
          setTimeout(() => {
            this.loadContacts(this.isOffline);
          }, 0);
        }

        // check if dog deleted 
        if(message.hasOwnProperty('dogDeleted')) {
          console.log('DOG DELETED', message);
          // this.contactList.push(message.dogAdded);
          this.contactList = [];
          this.loadContacts(this.isOffline);
        }

        if (message.hasOwnProperty("network")) {
          this.networkStatus = message.network;
          if (message.network === 'online') {
            this.isOffline = false;
          } else if (message.network === 'offline') {

          }
        }

        if (message.hasOwnProperty("progress")) {
          this.syncProgress = message.progress;
        }

        if (message.hasOwnProperty("syncDate")) {
          this.lastSyncDate = this.util.formatDate(message.syncDate, '-', false);
        }

        if (message.hasOwnProperty("intrupted")) {
          this.isDownloadIntrupted = true;
          this.offlineSetting = false;
        }

      }, error => {
        console.log('ERROR ON SUBSCRIBING NETWORK SERVICE');
      });

      console.log('INSIDE IONVIEWDIDLOAD');
      this.platform.ready().then(() => {
        
        console.log('PLATEFORM READY');

        this.networkService.initializeNetworkEvents();
        
        console.log('AFTER NETWORK INITIALIZED');
        
        console.log('network:offline ==> ' + this.network.type);
        
        this.networkStatus = this.network.type === 'none' ? 'offline' : 'online';

        // Offline event
        this.events.subscribe('network:offline', () => {
          
          this.networkStatus = 'offline';

          this.localStorageService.checkOfflineMode()
          .then( rs => {

            console.log('------------ offline mode in ionview URSE CHOICE ----', rs);
            
            if (rs === 'on') {

              this.isOffline = true;
              this.init();

            } else {

              this.presentAlert(AppMessage.OF001, 'no-internet-alert', 'WHOOPS');
            }

          })
          .catch( err => {
            console.log('------------ error reading check offline in ionview----');
            this.presentAlert(AppMessage.OF001, 'no-internet-alert', 'WHOOPS');
          });
        });
  
        // Online event
        this.events.subscribe('network:online', () => {
          console.log('-----ONLINE SUBSCRIBED -------');
          this.networkStatus = 'online';
          this.isOffline = false;
          this.init();
          /* setTimeout( () => {
            this.localStorageService.checkOfflineMode()
            .then( rs => {
              if (rs && rs === 'on') {
                this.syncData(true);
              }
            });
          }, 1000); */
        });

      });

      if (!this.platform.is('cordova')) {
        this.init();
      }
    }

  ngOnInit() {
    console.log('----NG ON INIT FIRED-----');
    
    // -- ionViewDidEnteris not working so called in here
    // this.ionViewDidEnter();

    // this.checkRemovedUser();
    setTimeout( () => {
      this.getLoggedUser();
      this.init();
    }, 1000);

    setTimeout( () => {
      this.localStorageService.checkOfflineMode()
      .then( rs => {
        if (rs && rs === 'on') {
          this.syncData(true);
        }
      });
    }, 1000);

    this.appVersionNum = this.appVersion.getVersionNumber();
    if (this.device.platform === 'iOS') {
      const iphoneList = ['iPhone10,3', 'iPhone10,6', 'iPhone11,8', 'iPhone11,2', 'iPhone11,6', 'iPhone11,4'];
      const iphoneModel = this.device.model;
      if ( iphoneList.indexOf(iphoneModel) > -1) {
        this.addSpaceonIphone = true;
      }
    }
  }

  init() {
    console.log('---- INIT FIRED-----');
    
    if (this.platform.is('cordova')) {
      
      this.isWeb = false;
      
      this.filters.pageSize = 8;
      
      this.localStorageService.getLastSync()
      .then( rs => {
        this.lastSyncDate = this.util.formatDate(rs, '-', false);
        // this.syncComplete = true;
      });
      this.localStorageService.checkOfflineMode()
      .then( rs => {
        console.log('user choice : ', rs);
        this.offlineMode = rs;
        if ( !rs ) {
          this.presentAlertUpdated('on', AppMessage.CF01H, AppMessage.CF01M, 'enableoffline-alert', () => {
            this.offlineSetting = true;
            this.isOffline = true;
            this.syncData();
            this.localStorageService.getLastSync()
            .then(date => {
              this.lastSyncDate = this.util.formatDate(date, '-', false);
            });
          }, () => {
            this.localStorageService.setOfflineMode('off');
            setTimeout( () => {
              this.isOffline = false;
              this.offlineSetting = false;
            }, 1000);
            return false;
          });

        } else {
          this.isOffline = this.offlineMode === 'on' ? true : false;
          this.offlineSetting = this.offlineMode === 'on' ? true : false;
        }
        
        this.getFilters(this.isOffline);
        setTimeout( () => {
          this.loadContacts(this.isOffline);
        }, 2000);
      
      });

    } else {

      this.filters.pageSize = 8;

      if (this.loggedUser.email) {
        this.getFilters(this.isOffline);
        this.loadContacts(this.isOffline);
      } else {
        this.presentAlert(AppMessage.ER001);
      }
    }
  }


  /**
   * get logged user information from location storage
   */
  getLoggedUser() {
    const user = localStorage.getItem('sparks-logged-user');
    this.loggedUser = {email: 'satish.purohit.3@gmail', name: 'satish'}//JSON.parse(user);
  }

  /**
   * load users
   * @param isOffline check if user access offline mode boolean value
   */
  loadContacts(isOffline: Boolean = false) {
    this.networkStatus = this.network.type === 'none' ? 'offline' : 'online';
    console.log('loading contacts: ', this.networkStatus, isOffline);
    this.loadingData = true;
    if (this.networkStatus === 'online') {
      this.loadingService.present();
      setTimeout( () => {

        this.homeService.getContactData(this.filters)
        .subscribe( response => {
          this.loadingService.dismiss();
          if (response.responseCode === Enum.successCode && response.response.results.length) {
            
            let dogCount = 0;

            // if group by department then push Dogs of Sparks department at last position
            // if group by all then remove item with category Dogs of Sparks 

            if(this.filters.groupBy === Enum.group_department) {
              let result = false;
              result = response.response.results.some( item => {
                if(item.value === Enum.dog_category){
                  response.response.results.splice(response.response.results.indexOf(item), 1)
                  response.response.results.push(item);
                  this.contactList = response.response.results;
                  return true;
                } 
              });
              if(!result) {
                Array.prototype.push.apply(this.contactList, response.response.results);
              }
            } else if (this.filters.groupBy === Enum.group_all) {

              // count dogs form list to reduce from total count (since dogs are included in api)
              // remove dogs from all employee list
              
              let allEmployee = response.response.results.filter( item => {
                dogCount += item.isDog ? 1 : 0;
                return this.filters.filterDetail.departments.indexOf(Enum.dog_category) < 0 ? !item.isDog : true;
              });
              Array.prototype.push.apply(this.contactList, allEmployee);
            } else {
              this.contactList = response.response.results;
            }
            
            this.loadingData = false;
            // Array.prototype.push.apply(this.contactList, response.response.results);
            if(this.filters.filterDetail.departments.indexOf(Enum.dog_category) < 0) {
              response.response.paginationInfo.totalRecords = response.response.paginationInfo.totalRecords - dogCount; // reduce dogCount from total records
            }
            this.pagingInfo = response.response.paginationInfo;
            this.noResult =  this.contactList.length ? false : true;;
          } else if (response.responseCode === Enum.unauthorized) {
            // this.presentAlert(AppMessage.ER005);
            setTimeout( () => {
              this.logOut();
            }, 1000);
          } else {
            //this.pagingInfo = response.response.paginationInfo;
            this.noResult = this.contactList.length ? false : true;
            console.log(response);
          }
        }, error => {
          this.loadingService.dismiss();
          this.loadingData = false;
          console.log(error);
          this.presentAlert(AppMessage.OF001, 'no-internet-alert', 'WHOOPS');
          // this.isOffline = true;
        });

      }, 500);

    } else if (this.networkStatus === 'offline' && isOffline) {
      // fetch from local db
      console.log('Offline data fetching');
      this.getOfflineContact();
    } else {
      this.presentAlert(AppMessage.OF001, 'no-internet-alert', 'WHOOPS');
    }
  }

  /**
   * reutrn filters array
   */
  getFilters(isOffline: Boolean) {
    if (isOffline) {
      this.localStorageService.getFilters()
      .then( response => {
        console.log('offline filters', response);
        if (response.responseCode === Enum.successCode) {
          this.filtersArr['locations'] = response.response.locations;
          this.filtersArr['departments'] = response.response.departments;
        } else {
          console.log('error in loading filters from local db');
          if (!this.isOffline) {
            // this.logOut();
            this.presentAlert(AppMessage.OF001, 'no-internet-alert', 'WHOOPS');
          }
        }
      }).catch( error => {
        console.log('sql error from home page exiting application ', error);
        // this.logOut();
        this.presentAlert('No offline data');
      });
    } else {
      this.homeService.getFilters()
      .subscribe( response => {
        if (response.responseCode === Enum.successCode) {
          this.filtersArr['locations'] = response.response.locations.sort().map( i => ({val: i, isChecked: false}));
          this.filtersArr['departments'] = response.response.departments.sort().map( i => ({val: i, isChecked: false}));
        } else if (response.responseCode === Enum.unauthorized) {
          this.presentAlert(AppMessage.ER005);
          setTimeout( () => {
            if (!this.isOffline) {
              this.logOut();
            }
          }, 1000);
        } else {
          console.log('No Filter valued received');
          if (!this.isOffline) {
            this.logOut();
          }
        }
      }, error => {
        console.log('error getting filters from online :', error);
        // this.presentAlert(AppMessage.OF001);
        // if (!this.isOffline) {
        //   this.logOut();
        // }
    });
    }
  }

  /**
   * return image url
   * @param imageParam object
   */
  getImageUrl(email: any): Promise<any> {
    const imageParam = {
      emailIds: [email],
      imageType: "THUMBNAIL"
    };
    return new Promise((resolve, reject) => {
      this.homeService.getContactImage(imageParam)
      .subscribe( response => {
        if (response.responseCode === Enum.successCode) {
          const img = response.response[email] ? 'data:image/jpg;base64,' + response.response[email] : '';
          resolve({url :  img, err : null });
        }
      }, error => {
        console.log('Image Error', error);
        reject({err : error});
      });
    });
  }

  /**
   * load users by location
   * @param groupBy department/location
   */
  getUsers(groupBy: string) {
    this.filters.searchText = '';
    this.prevPage = '';
    this.filters.pageNumber = 1;
    this.contactList = [];
    this.filters.tab = groupBy;
    this.filters.groupBy = groupBy;
    this.filters.pageSize = groupBy === 'all' ? 24 : 8;
    this.filters.location = this.loggedUser.location;
    if (!this.filtersArr.departments.length) {
      this.getFilters(this.isOffline);
      this.filters.filterDetail.departments = this.filtersArr.departments.length ? this.filtersArr.departments.filter( item => item.isChecked = false ) : [];
      this.filters.filterDetail.locations = this.filtersArr.locations.length ? this.filtersArr.locations.filter( item => item.isChecked = false ) : [];
      this.loadContacts(this.isOffline);
    } else {
      this.filters.filterDetail.departments = this.filtersArr.departments.length ? this.filtersArr.departments.filter( item => item.isChecked = false ) : [];
      this.filters.filterDetail.locations = this.filtersArr.locations.length ? this.filtersArr.locations.filter( item => item.isChecked = false ) : [];
      this.loadContacts(this.isOffline);
    }
  }

  /**
   * called when search is performed
   * @param event search event object
   */
  searchUser(event: any) {
    if (event.type === 'ionCancel') {
      this.filters.searchText = '';
      this.contactList = [];
      this.loadContacts(this.isOffline);
      if (!this.isWeb) {
        this.filters.groupBy = this.appPrevTab ? this.appPrevTab : 'all';
        this.filters.pageSize = this.filters.groupBy !== 'all' ? 8 : 24;
        this.appSearchOpened = false;
        this.footerButtons.value = "";
      }
    } else if (event.detail && event.detail.value.trim() !== '') {
      this.filters.pageNumber = 1;
      this.contactList = [];
      if (!this.isWeb) {
        this.filters.groupBy = 'all';
        this.filters.pageSize = this.filters.groupBy !== 'all' ? 8 : 24;
      }
      this.filters.searchText = event.detail.value.trim();
      this.loadContacts(this.isOffline);
      setTimeout( () => { 
        this.searchInput.setFocus(); 
      }, 1500);
    }
  }


  /**
   * called when search icon is clicked on app
   */
  appSearch() {
    this.menu.close('mobile-profile');
    this.filters.pageNumber = 1;
    this.appSearchOpened = true;
    this.filters.searchText = '';
    if (this.filters.tab !== 'all') {
      this.filters.filterDetail.departments = this.filtersArr.departments.filter( item => item.isChecked = false );
      this.filters.filterDetail.locations = this.filtersArr.locations.filter( item => item.isChecked = false );
    }
    this.appPrevTab = this.filters.tab;
    this.filters.groupBy = this.prevPage ? this.prevPage : 'all';
    this.contactList = [];
    this.closeFilter();
  }

  /**
   * called when searchbox is cleared
   */
  clearSearch() {
    if (!this.isWeb) {
      this.appSearchOpened = false;
      this.footerButtons.value = "";
    }
  }

  /**
   * infinite scroll method
   * @param event scroll event : object
   */
  loadMore(event: any) {
    console.log(this.pagingInfo.totalRecords, this.contactList.length);
    setTimeout(() => {
      event.target.complete();
      if (this.pagingInfo.totalRecords >= this.contactList.length) {
        // this.filters.pageNumber = this.filters.pageNumber += 1;
        // this.loadContacts(this.isOffline);

        if(this.pagingInfo.totalPages > this.filters.pageNumber) {
          this.filters.pageNumber = this.filters.pageNumber += 1;
          this.loadContacts(this.isOffline);
        }
      }
    }, 500);
    /* if (this.pagingInfo.totalRecords === this.contactList.length) {
      event.target.disabled = true;
    } */
  }

  /**
   * return initial of logged user's name
   */
  getInitials() {
    if (this.loggedUser && this.loggedUser['firstName']) {
      return this.loggedUser.firstName.charAt(0).toUpperCase() + this.loggedUser.lastName.charAt(0).toUpperCase();
    } else {
      return '';
    }
  }

  public goBack() {
    this.router.navigateByUrl('/login');
  }

  async presentPopover(ev: any) {
    const popover = await this.popoverController.create({
      component: ProfilePopoverComponent,
      event: ev,
      cssClass: 'login-dropdown',
      showBackdrop: false,
      translucent: true
    });

    return await popover.present();
  }

  openFilter() {
    this.appPrevTab = this.filters.tab;
    // this.filters.tab = 'all';
    // this.filters.groupBy = 'all';
    this.renderer.setStyle(this.filterBox.nativeElement, 'transform', 'translateX(0%)');
    if (this.isWeb) {
        this.renderer.setStyle(this.backdropOverlay.nativeElement, 'display', 'block');
    }
    this.openFilterBox = !this.openFilterBox;

    if (!this.isWeb) {
      this.appSearchOpened = false;
      this.menu.close('mobile-profile');
    }

  }

  closeFilter(cancelClick ?: boolean) {
    this.renderer.setStyle(this.filterBox.nativeElement, 'transform', 'translateX(100%)');
    if (this.isWeb) {
      this.renderer.setStyle(this.backdropOverlay.nativeElement, 'display', 'none');
    } else {
      /* 
      // ON CLOSE FILTER IN APP SET VIEW TO ALL [TAKEN CARE]
      if (cancelClick) {
        this.filters.groupBy = this.appPrevTab ? this.appPrevTab : 'all';
        this.filters.tab = this.appPrevTab ? this.appPrevTab : 'all';
      } */
      this.footerButtons.value = "";
    }
    this.openFilterBox = !this.openFilterBox;
  }

  showFilterList(listID: any) {
    if (listID === 'departmentList') {
      this.renderer.removeClass(this.departmentList.nativeElement, 'unactive');
      this.renderer.addClass(this.locationList.nativeElement, 'unactive');
    } else if (listID === 'locationList') {
      this.renderer.removeClass(this.locationList.nativeElement, 'unactive');
      this.renderer.addClass(this.departmentList.nativeElement, 'unactive');
    }

  }



  async presentModal(user) {
    
    if(user.isDog) {
      const modal = await this.modalController.create({
        cssClass : 'dog-detail-component',
        component: DogDetailComponent,
        componentProps: { value: user }
      });
      return await modal.present();
    } else {
      const modal = await this.modalController.create({
        cssClass : 'people-detail-component',
        component: PeopleDetailComponent,
        componentProps: { value: user }
      });
      return await modal.present();
    }
    // const { data } = await modal.onDidDismiss();
  }

  end() {
    console.log('end');
  }

  saveOfflineSetting() {
    console.log(this.offlineSetting);
    const choice = this.offlineSetting ? 'on' : 'off';
    this.isDownloadIntrupted = false;
    this.networkStatus = this.network.type === 'none' ? 'offline' : 'online';
    if (choice === 'on') {
      if (this.networkStatus === 'offline' && this.offlineMode !== 'on') {
        setTimeout( () => {
          this.presentAlert(AppMessage.OF001);
          this.offlineSetting = !this.offlineSetting;
          this.syncProgress = 0;
        }, 1000);
        return false;
      }
      this.presentAlertUpdated(choice, AppMessage.CF01H, AppMessage.CF01M, 'enableoffline-alert', () => {
        // this.localStorageService.setOfflineMode(choice);
        this.isOffline = true;
        this.syncData();
        this.localStorageService.getLastSync()
        .then(date => {
          this.lastSyncDate = this.util.formatDate(date, '-', false);
        });
      }, () => {
        this.offlineSetting = !this.offlineSetting;
        return false;
      });
    } else {
      this.presentAlertUpdated(choice, AppMessage.CF02H, AppMessage.CF02M, 'disableoffline-alert', () => {
        this.localStorageService.setOfflineMode(choice);
        this.isOffline = false;
      }, () => {
        this.offlineSetting = !this.offlineSetting;
        return false;
      });
    }


    /* this.localStorageService.setOfflineMode(choice)
    .then( rs => {
      console.log(rs);
    })
    .catch(err => {
      console.log('error on save choice', err);
    });
    if (this.offlineSetting) {
      this.isOffline = true;
      this.syncData();
      this.localStorageService.getLastSync()
      .then(date => {
        this.lastSyncDate = this.util.formatDate(date, '-', false);
      });
    } */
  }


  syncData(updateDb: boolean = false) {
    this.networkStatus = this.network.type === 'none' ? 'offline' : 'online';
    // check if user seleted offline mode
    if (this.isOffline) {
      // check if user already has offline data stored
      this.localStorageService.getTotalCount()
      .then(rs => {
        if (rs && this.networkStatus === 'offline') {
          this.getOfflineContact();
        } else if (this.networkStatus === 'online') {
          if (!updateDb) {
            this.loadingService.present('Storing data offline, this will take few minutes.');
          }
          this.localStorageService.syncData()
          .then ( rs1 => {
            this.localStorageService.setOfflineMode('on');
            this.localStorageService.setLastSync(new Date().toString());
            if (!updateDb && !rs) {
              this.presentAlert('Syncing process compelete');
            }
          }).catch( error => {
            console.log(error);
          });
        } else {
          this.loadingService.present('No internet');
        }
      })
      .catch( err => {
        console.log('Error on check offline db :', err);
        if (this.networkStatus === 'online') {
          if (!updateDb) {
            this.loadingService.present('Storing data offline, this will take few minutes.');
          }
          this.localStorageService.syncData()
          .then ( rs => {
            // this.syncComplete = true;
            if (!updateDb) {
              this.presentAlert('Syncing process compelete');
            }
          }).catch( error => {
            console.log(error);
          });
        } else {
          this.presentAlert(AppMessage.OF001);
        }
      });
    } else {
      this.localStorageService.setOfflineMode('off')
      .then( rs => {
        console.log(rs);
      });
    }
  }

  /* getOfflineContact_new() {

    this.localStorageService._readDb();
  } */



  /* async presentLoading() {
      this.loading = await this.loadingController.create({
      message: 'Please wait...',
      // backdropDismiss: true,
      // duration: 1000
    });
    await this.loading.present();
    // const { role, data } = await this.loading.onDidDismiss();
  } */

  /**
   * called to show alert message
   * @param message message to show : string
   */
  async presentAlert(message: string, cssClass: string = 'app-alert', aheader: string = 'Alert') {
    const alert = await this.alertController.create({
      header: aheader,
     // subHeader: '',
      cssClass: cssClass,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  async presentAlertUpdated(choice: string, header: string, message: string, cssClass: string, agreeCb, disagreeCb) {
    const alert = await this.alertController.create({
      header: header,
      // subHeader: '',
      cssClass: cssClass, // 'disableoffline-alert',
      message: message,
      backdropDismiss: false,
      buttons: [
        {
          text: choice === 'on' ? 'IGNORE' : 'CANCEL',
          cssClass: 'secondary',
          handler: (blah) => {
            console.log('Confirm IGNORE: blah');
            disagreeCb();
          }
        }, {
          text: choice === 'on' ? 'DOWNLOAD' : 'CONFIRM',
          cssClass: 'primary',
          handler: () => {
            console.log('Confirm Okay');
            agreeCb();
          }
        }
      ]
    });

    await alert.present();
  }




  /**
   * clear all filters
   * @param clearFilter flag to clear all filters
   */
  setFilters(clearFilter?: Boolean, isApp: Boolean = false) {
    if (clearFilter) {
      if (this.selectAll['departments']) {
        this.selectAll['departments'] = false;
      }
      if (this.selectAll['locations']) {
        this.selectAll['locations'] = false;
      }
      
      if (this.prevPage && ((this.filters.filterDetail.departments.length + this.filters.filterDetail.locations.length) < 2)) {
        this.filters.tab = this.prevPage;
        this.filters.groupBy = this.prevPage;
      } else {
        this.filters.tab = 'all';
        this.filters.groupBy = 'all';
      }
      this.filters.filterDetail.departments = this.filtersArr.departments.filter( item => item.isChecked = false );
      this.filters.filterDetail.locations = this.filtersArr.locations.filter( item => item.isChecked = false );
      this.prevPage = '';

    } else {
      this.filters.filterDetail.alphabets = [];
      this.filters.filterDetail.departments = this.filtersArr.departments.filter( item => item.isChecked ).map( i => i.val);
      this.filters.filterDetail.locations = this.filtersArr.locations.filter( item => item.isChecked ).map( i => i.val);

      if (!this.prevPage || (this.prevPage && ((this.filters.filterDetail.departments.length + this.filters.filterDetail.locations.length) > 1) )) {
        this.filters.tab = 'all';
        this.filters.groupBy = 'all';
      }
    }
    if (this.isWeb || isApp) {
      // if (isApp) {
      
      
      this.contactList = [];
      this.filters.pageNumber = 1;
      this.filters.pageSize = this.filters.groupBy === 'all' ? 24 : 8;
      this.loadContacts(this.isOffline);
    }
    if (isApp) {
      this.closeFilter();
    }
  }


  removeFilter(type: string, index ?: number) {
    switch (type) {
      case 'departments':
        if (this.prevPage && (this.filters.filterDetail.departments.length + this.filters.filterDetail.locations.length) < 2 ) {
          this.getUsers('department');
        } else {
          this.filtersArr.departments[index].isChecked = false;
          this.setFilters(false, !this.isWeb);
          this.prevPage = '';
        }
        break;
      case 'locations':
      if (this.prevPage && (this.filters.filterDetail.departments.length + this.filters.filterDetail.locations.length) < 2) {
        this.getUsers('location');
      } else {
        this.filtersArr.locations[index].isChecked = false;
        this.setFilters(false, !this.isWeb);
        this.prevPage = '';
      }
      break;
    }

  }

  setAllFilters(type: string) {
    this.filtersArr[type] = this.filtersArr[type].map( item => { item.isChecked = this.selectAll[type]; return item; } );
    this.setFilters();
  }

  clearAllFilters() {
    this.selectAll['departments'] = false;
    this.selectAll['locations'] = false;
    this.filtersArr['departments'] = this.filtersArr['departments'].map( item => { item.isChecked = false; return item; } );
    this.filtersArr['locations'] = this.filtersArr['locations'].map( item => { item.isChecked = false; return item; } );
  }


  setAphabet(char: string, clearAlphabets?: boolean) {
    this.filters.filterDetail.alphabets = clearAlphabets ? [] : [char];
    this.setFilters(true, false);
  }

  viewAll(type: string, value: string) {
    this.contactList = [];
    this.filters.tab = type; // 'all';
    const deps = type + 's';
    this.filters.groupBy = 'all';
    this.filters.pageSize = 24;
    // this.prevPage = type === 'departments' ? 'department' : 'location';
    this.prevPage = type.replace('s', ''); // === 'departments' ? 'department' : 'location';
    const i = this.filtersArr[deps].findIndex( i => i.val === value);
    this.filtersArr[deps][i].isChecked = true;
    this.setFilters(false, !this.isWeb);
  }

  getOfflineContact() {
    // console.log(this.localStorageService.get(this.filters));
    this.localStorageService.getUsers(this.filters)
    .then( response => {
      if (response.response.results.length > 0) {
        // this.contactList = response.response.results;
        Array.prototype.push.apply(this.contactList, response.response.results);
        this.pagingInfo = response.response.paginationInfo;
        this.noResult = false;
        this.isOffline = true;
      } else {
        this.noResult = this.contactList.length ? false : true;
      }
    }).catch( error => {
      console.log('sql error from home page ', error);
      // this.logOut();
      this.presentAlert('Error reading offline data.');
    });
  }

  openProfile() {
    this.menu.open('mobile-profile');
  }

  logOut() {
    console.log('Log out...');
    this.googleplus.logout();
    localStorage.clear();
    this.menu.close('mobile-profile');
    this.router.navigateByUrl('/login');
  }

  logScrolling(event: any) {
    if (!this.isWeb) {
      
       const logoMaxHeight = 48;
       const scrollableArea = event.target.getElementsByClassName('content-box')[0].clientHeight - event.target.clientHeight;
       const scrollAmount = event.detail.currentY;
      //  console.log(scrollableArea);
      //  console.log(logoMaxHeight * 2);
      
       if (scrollAmount > logoMaxHeight &&  scrollableArea > logoMaxHeight * 4) {
        this.renderer.setStyle(this.logo.nativeElement, 'height', 0);
       } else {
        this.renderer.setStyle(this.logo.nativeElement, 'height', '4.8rem');
       }
    }
  }

  mobileProfileClose() {
    this.footerButtons.value = "";
  }

  doRefresh(event: any) {
    console.log('refresh event');
    this.networkStatus = this.network.type === 'none' ? 'offline' : 'online';
    this.refreshDone = this.network.type === 'none' ? '' : '?vn=' + new Date().getTime().toString();
    this.contactList = [];
    this.filters.pageNumber = 1;
    this.loadContacts(this.isOffline);
    if (this.networkStatus === 'online' && this.offlineMode === 'on' && this.lastSyncDate) {
      this.localStorageService.syncData()
      .then( rs => {
        // if (rs && rs.message === 'no-data') {
          setTimeout(() => {
            console.log('Async operation has ended');
            event.target.complete();
          }, 2000);
        // }
      })
      .catch( error => {
        setTimeout(() => {
          console.log('Async operation has ended');
          event.target.complete();
        }, 2000);
      });
    } else {
      setTimeout(() => {
        console.log('Async operation has ended');
        event.target.complete();
      }, 1000);
    }
  }

  retrySync() {
    this.localStorageService.setLastSync('')
    .then( rs => {
      console.log(rs);
      this.localStorageService.syncData();
    });
  }

  checkRemovedUser() {
    console.log('CHECKIN USER VALID');
    this.loginService.getLoggedInUser()
    .subscribe(response => {
      // if (response.responseCode === Enum.successCode) {
      // } else
      if (response.responseCode === Enum.deleted) {
        this.localStorageService.clearDb();
        this.logOut();
        this.presentAlert(AppMessage.ER006);
        
      }
    });
  }

  /* async presentToast() {
    const toast = await this.toast.create({
      message: 'Press again to exit app...',
      duration: 2000
    });
    toast.present();
  } */


}

