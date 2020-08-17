import { Component, OnInit, Input, Renderer2, ViewChild, NgZone } from '@angular/core';
import { ModalController, Events, AlertController } from '@ionic/angular';
import { HomeService } from '../../shared/services/home.service';
import { Enum } from '../../shared/config/enum.enum';
import { Platform } from "@ionic/angular";
import { SafePipe } from '../../shared/pipe/safe.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { LoadingService } from '../../shared/services/loading.service';
import { DogDetailComponent } from '../dog-detail/dog-detail.component';
import { CallNumber } from '@ionic-native/call-number/ngx';

@Component({
  selector: 'app-people-detail',
  templateUrl: './people-detail.component.html',
  styleUrls: ['./people-detail.component.scss'],
  providers: [SafePipe]
})
export class PeopleDetailComponent implements OnInit {
  @ViewChild('detailBox') detailBox;
  @ViewChild('actionBox') actionBox;
  @ViewChild('openDetails') openDetailsid;
  @ViewChild('location') location;
  @ViewChild('department') department;
  @ViewChild('fileInput') myFile;
  @Input() value: any;

  openDetails: Boolean = false;
  profilePic: String;
  isWeb: Boolean = true;
  workPhone: any;
  mobilePhone: any;
  actionPhone: any;
  fileErrorMsg: String = '';
  loggedUser: any;
  dogDetailsMobile: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private homeService: HomeService,
    public platform: Platform,
    public zone: NgZone,
    public events: Events,
    private renderer: Renderer2,
    public alertController: AlertController,
    private sanitizer: DomSanitizer,
    private loadingService: LoadingService,
    private callNumber: CallNumber,
    public safe: SafePipe) {
    this.events.subscribe('openDetail', () => {
      this.zone.run(() => {
        this.renderer.setStyle(this.actionBox.nativeElement, 'height', '0rem');
        this.renderer.setStyle(this.openDetailsid.nativeElement, 'height', '18.9rem');
        this.renderer.setStyle(this.location.nativeElement, 'width', '100%');
        this.renderer.setStyle(this.location.nativeElement, 'text-align', 'left');
        this.renderer.setStyle(this.department.nativeElement, 'width', '100%');
        this.openDetails = true;
        this.dogDetailsMobile = true;
        console.log('Open Detail');
      });
    });
    this.events.subscribe('closeDetail', () => {
      this.zone.run(() => {
        this.renderer.setStyle(this.actionBox.nativeElement, 'height', '6rem');
        this.renderer.setStyle(this.openDetailsid.nativeElement, 'height', '0rem');
        this.renderer.setStyle(this.location.nativeElement, 'width', '50%');
        this.renderer.setStyle(this.location.nativeElement, 'text-align', 'right');
        this.renderer.setStyle(this.department.nativeElement, 'width', '50%');
        this.openDetails = false;
        this.dogDetailsMobile = false;
        console.log('force update the screen');
      });
    });
  }

  ngOnInit() {
    
    if (this.platform.is('cordova')) {
      this.isWeb = false;
    }
    this.loggedUser = JSON.parse(localStorage.getItem('sparks-logged-user'));
    this.loggedUser = this.loggedUser ? this.loggedUser : { role: 'ADMIN', email: 'satish.purohit.3@gmail.com', name: 'satish purohit'};
    
    this.mobilePhone = this.value.phones.mobile || '--';
    this.workPhone = this.value.phones.work || '--';
    
  }

 
  closeModal() {
    this.modalCtrl.dismiss();
  }

  openDetail() {
    if (!this.openDetails) {
      this.events.publish('openDetail');
    } else {
      this.events.publish('closeDetail');
    }
  }

  swipeEvent(event) {
    console.log(event.direction);
    if (event.direction === 8) {
      this.events.publish('openDetail');
    } else {
      this.events.publish('closeDetail');
    }
  }

  async presentAlert(aHeader: string, message: string, aClass: string) {
    const alert = await this.alertController.create({
      header: aHeader,
      cssClass: aClass,
      // subHeader: '',
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  fileChange(event) {
    const fileList: FileList = event.target.files;
    let isDog = false;
    if (fileList.length > 0) {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(event.target.files[0]);
      fileReader.onloadend = e => {
        const base64Image = fileReader.result;
        const mime = base64Image.toString().split(";")[0];
        const params = {
          imageData : {
            mime: mime.replace('data:', ''),
            image: base64Image.toString().split(";")[1]
          }
        };
        this.homeService.uploadImage(this.value.id, params)
        .subscribe( rs => {
            this.loadingService.dismiss();
            this.myFile.nativeElement.value = null;
            if (rs.responseCode !== Enum.successCode) {
              this.presentAlert('Error', rs.responseDescription, 'app-alert');
            } else {
              this.value.actualImage = rs.response.results.imageUrl;
              // this.value.actualImage = this.value.actualImage + '?v=' + Math.random().toFixed(4);
              this.value.thumbnailImage = this.value.actualImage.replace('images/', 'resized/300X300/');
              this.presentAlert('Success', rs.responseDescription, 'app-alert');
            }
          }, error => {
            console.log(error);
          });
      };
      // console.log('fileReader', fileReader);
      
      /* const file: File = fileList[0];
      const formData: FormData = new FormData();
      formData.append('file', file, file.name);
      formData.append('email', this.value.email);
      formData.append('isDog', '0');
      this.loadingService.present();
      this.homeService.uploadFile(formData)
      .subscribe( rs => {
          this.loadingService.dismiss();
          this.myFile.nativeElement.value = null;
          if (rs.responseCode !== Enum.successCode) {
            this.presentAlert('Error', rs.responseDescription, 'app-alert');
          } else {
            this.value.actualImage = this.value.actualImage + '?v=' + Math.random().toFixed(4);
            this.value.thumbnailImage = this.value.thumbnailImage + '?v=' + Math.random().toFixed(4);
            this.presentAlert('Success', rs.responseDescription, 'app-alert');
          }
        }, error => {
          console.log(error);
        }); */
    }
  }

  sanitize(url: string) {
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : '--';
  }

  async presentModal(user) {
    this.modalCtrl.dismiss();
    const modal = await this.modalCtrl.create({
      cssClass : 'dog-detail-component',
      component: DogDetailComponent,
      componentProps: { value: user }
    });
    // const { data } = await modal.onDidDismiss();
    return await modal.present();
  }

  call(phone) { 
    this.callNumber.callNumber(phone, true)
      .then(res => console.log('Launched dialer!', res))
      .catch(err => console.log('Error launching dialer', err));
  } 
}
