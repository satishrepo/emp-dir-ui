import { NgModule } from '@angular/core';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';


import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ProfilePopoverComponent } from './component/profile-popover/profile-popover.component';
import { PeopleDetailComponent } from './modal/people-detail/people-detail.component';
import { DogDetailComponent } from './modal/dog-detail/dog-detail.component';
import { HttpClientModule } from '@angular/common/http';


import * as firebase from 'firebase/app';
import 'firebase/auth';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HeaderInterceptor } from './shared/services/header.interceptor';
import { IonicGestureConfig } from './gestures/ionic-gesture-config';
import { SafePipe } from './shared/pipe/safe.pipe';
// import { SQLite } from '@ionic-native/sqlite/ngx';
// import { HomeService } from './shared/services/home.service';
// import { LocalStorageService } from './shared/services/local-storage.service';
import { Util } from './shared/services/util';

/* Native Ionic Plugin */
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { Device } from '@ionic-native/device/ngx';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { File } from '@ionic-native/file/ngx';
import { Network } from '@ionic-native/network/ngx';
import { FileTransfer} from '@ionic-native/file-transfer/ngx';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { FormsModule } from '@angular/forms';
// import { Mask } from './shared/directive/mask';

import {NgxMaskModule} from 'ngx-mask'
import { CallNumber } from '@ionic-native/call-number/ngx';

const firebaseConfig = {
  apiKey: "AIzaSyBA9Z4dd8PumqvJWVbuaVmM1xHUegKC4rU",
  authDomain: "sparksroster.firebaseapp.com",
  databaseURL: "https://sparksroster.firebaseio.com",
  projectId: "sparksroster",
  storageBucket: "sparksroster.appspot.com",
  messagingSenderId: "650731737770"
};

firebase.initializeApp(firebaseConfig);

@NgModule({
  declarations: [AppComponent, ProfilePopoverComponent, PeopleDetailComponent, SafePipe, DogDetailComponent],
  entryComponents: [
    ProfilePopoverComponent,
    PeopleDetailComponent,
    DogDetailComponent
  ],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule, FormsModule, NgxMaskModule.forRoot()],
  providers: [
    StatusBar,
    SplashScreen,
    GooglePlus,
    Device,
    AppVersion,
    WebView,
    File,
    Network,
    FileTransfer,
    ScreenOrientation,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HeaderInterceptor,
      multi: true,
    },
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: IonicGestureConfig
    },
    Util,
    CallNumber
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
