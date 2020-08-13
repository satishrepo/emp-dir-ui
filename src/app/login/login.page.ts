import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Platform, AlertController } from '@ionic/angular';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import { LoginService } from 'src/app/shared/services/login.service';
import { Enum } from 'src/app/shared/config/enum.enum';
import { AppConstant } from 'src/app/shared/config/app-constant';
import { AppMessage } from 'src/app/shared/config/app-message.enum';
import { LocalStorageService } from '../shared/services/local-storage.service';
import * as settings from '../../assets/settings.json';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage implements OnInit {
  @ViewChild('errorDiv') errorDiv: ElementRef;
  isMobileWeb: Boolean = false;
  isWeb: Boolean = true;
  notIos: Boolean = true;
  iosAppUrl: String = (<any>settings).iosAppUrl;
  androidAppUrl: String = (<any>settings).androidAppUrl;

  constructor(
    private _loginService: LoginService,
    private platform: Platform,
    private router: Router,
    public googleplus: GooglePlus,
    public alertController: AlertController,
    private localStorageService: LocalStorageService
    ) { }

  ngOnInit() {
    if (this.platform.is('cordova')) {
      this.isWeb = false;
    }
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      this.isMobileWeb = true;
      if ( /iPhone|iPad|iPod/i.test(navigator.userAgent) ) {
        this.notIos = false;
      }
      if ( /Android/i.test(navigator.userAgent) ) {
        this.notIos = true;
      }
    }
    const token = localStorage.getItem('sparksapi-access-token');
    const loggedUser = localStorage.getItem('sparks-logged-user');
    console.log(token, loggedUser);
    setTimeout( () => {
      if (token && loggedUser) {
        this.router.navigateByUrl('/home', { replaceUrl: true });
      }
    }, 1000);
  }

  login() {
    if (this.platform.is('cordova')) {
      this.nativeGoogleLogin();
    } else {
      this.webGoogleLogin();
    }
  }

  nativeGoogleLogin() {
    const that = this;
    // that.errorDiv.nativeElement.innerHTML = "";
    this.googleplus.login({
      'webClientId': AppConstant.webClientId,
      'offline': true
    }).then(res => {
      firebase.auth().signInAndRetrieveDataWithCredential(firebase.auth.GoogleAuthProvider.credential(res.idToken, res.accessToken))
      .then(function(result) {
        that.getAccessToken(result);
      }).catch(function(error) {
        console.log(error.code + ': ' + error.message);
      });
    })
    .catch(function(error) {
      console.log('mobile' + error.code + ': ' + error.message);
    });
  }

  webGoogleLogin() {
    const that = this;
    // that.errorDiv.nativeElement.innerHTML = "";
    firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .then(function(result) {
      // setTimeout( () => {
        that.getAccessToken(result);
      // }, 0);
    }).catch(function(error) {
      console.log(error.code + ': ' + error.message);
    });
    // that.getAccessToken({user:{email:'rosteruser@wearesparks.com'}});
  }

  getAccessToken(result) {
    // const user = result.user;
    const user = result.additionalUserInfo.profile;
    const params = {
      userMailid: user.email
    };
    this._loginService.login(params)
    .subscribe(response => {
      // centralized file and would be fetched from there.
      if (response.responseCode === Enum.successCode) {
        localStorage.setItem('sparksapi-access-token', response.response);
        this.setUserDetails().then( rs => {
          this.router.navigateByUrl('/home', { replaceUrl: true });
        })
        .catch( err => {
          console.log(err);
        });
      } else if (response.responseCode === Enum.deleted) {
        this.localStorageService.clearDb();
        this.googleplus.logout();
        this.presentAlert(AppMessage.ER006);
      } else {
      this.googleplus.logout();
      this.presentAlert(AppMessage.ER006);
      }
    });
  }

  setUserDetails() {
    return new Promise((resolve, reject) => {
      this._loginService.getLoggedInUser()
      .subscribe(resp => {
        if (resp.responseCode === Enum.successCode) {
          localStorage.setItem('sparks-logged-user', JSON.stringify(resp.response));
          resolve(true);
        } else {
          // show error message
          console.log(resp);
          reject(resp);
        }
      });
    });
  }

  async presentAlert(message) {
    const alert = await this.alertController.create({
      header: 'Alert',
      //subHeader: '',
      cssClass: 'app-alert',
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }
}
