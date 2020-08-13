import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-profile-popover',
  templateUrl: './profile-popover.component.html',
  styleUrls: ['./profile-popover.component.scss']
})
export class ProfilePopoverComponent implements OnInit {
  loggedUser: any;

  constructor(private router: Router, public googleplus: GooglePlus, private popOver: PopoverController) { }

  ngOnInit() {
    this.getLoggedUser();
  }
  signOut() {
    (<any>window).gapi.load('auth2', function () {
      const auth2 = (<any>window).gapi.auth2.getAuthInstance();
      auth2.signOut().then(function () {
        console.log('User signed out.');
      });
    });
    this.goBack();
  }

  public goBack() {
    this.router.navigateByUrl('/login');
  }

  logOut() {
    this.googleplus.logout();
    localStorage.clear();
    this.popOver.dismiss();
    this.router.navigateByUrl('/login');
  }

  getLoggedUser() {
    const user = localStorage.getItem('sparks-logged-user');
    this.loggedUser = JSON.parse(user);
    console.log(this.loggedUser);
  }
}
