import { Component, ViewChildren, QueryList } from '@angular/core';

import { Platform, Events, IonRouterOutlet, ActionSheetController, PopoverController, ModalController, ToastController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { NetworkService } from './shared/services/network.service';
import { Network } from '@ionic-native/network/ngx';
import { HomeService } from './shared/services/home.service';
import { Router } from '@angular/router';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  @ViewChildren(IonRouterOutlet) routerOutlets: QueryList<IonRouterOutlet>;
  lastTimeBackPress = 0;
  timePeriodToExit = 2000;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private networkService: NetworkService,
    public events: Events,
    public network: Network,
    private homeService: HomeService,
    private actionSheetCtrl: ActionSheetController,
    private popoverCtrl: PopoverController,
    public modalCtrl: ModalController,
    private router: Router,
    private toast: ToastController,
    private screenOrientation: ScreenOrientation
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {

      this.statusBar.styleDefault();
      this.splashScreen.hide();

      this.networkService.initializeNetworkEvents();

      // Offline event
      this.events.subscribe('network:offline', () => {
        // alert('network:offline ==> '+this.network.type);
        this.homeService.sendMessage({ network: 'offline' });
      });

      // Online event
      this.events.subscribe('network:online', () => {
        // alert('network:online ==> '+this.network.type);
        this.homeService.sendMessage({ network: 'online' });
      });

     

      // Back button Code
      this.platform.backButton.subscribe(() => {

        // console.log('backbutton');
        if (new Date().getTime() - this.lastTimeBackPress < this.timePeriodToExit) {
          // console.log('exit event', new Date().getTime() , this.lastTimeBackPress , this.timePeriodToExit);
          navigator['app'].exitApp(); // work in ionic 4

        } else {
          // console.log('toast');
          this.presentToast();
          this.lastTimeBackPress = new Date().getTime();
        }
      });


      // Orientation/roation Code
      if (this.platform.is('cordova')) {
        this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
      }
   

    });
  }

  async presentToast() {
    const toast = await this.toast.create({
      message: 'Press again to exit app',
      duration: 2000
    });
    toast.present();
  }

}
