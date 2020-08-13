import { Component, OnInit, Input, Renderer2, ViewChild, NgZone } from '@angular/core';
import { ModalController, Events, AlertController } from '@ionic/angular';
import { HomeService } from '../../shared/services/home.service';
import { Enum } from '../../shared/config/enum.enum';
import { Platform } from "@ionic/angular";
import { SafePipe } from '../../shared/pipe/safe.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { LoadingService } from '../../shared/services/loading.service';
import { Util } from '../../shared/services/util';
import { AppMessage } from '../../shared/config/app-message.enum';

@Component({
  selector: 'app-dog-detail',
  templateUrl: './dog-detail.component.html',
  styleUrls: ['./dog-detail.component.scss'],
  providers: [SafePipe]
})
export class DogDetailComponent implements OnInit {
  @ViewChild('detailBox') detailBox;
  @ViewChild('actionBox') actionBox;
  @ViewChild('openDetails') openDetailsid;
  @ViewChild('location') location;
  @ViewChild('department') department;
  @ViewChild('fileInput') myFile;
  @Input() value: any;

  openDetails2: Boolean = false;
  profilePic: String;
  isWeb: Boolean = true;
  workPh: any;
  mobilePh: any;
  actionPhone: any;
  fileErrorMsg: String = '';
  loggedUser: any;
  dogName: string; 
  dogBreed: string;
  dogDob: string;
  fileName: string;
  editMode: boolean = false;
  dogImage: string = '';
  dogSaved: boolean = false;
  dobError: boolean = false;
  

  constructor(
    private modalController: ModalController,
    private homeService: HomeService,
    public platform: Platform,
    public zone: NgZone,
    public events2: Events,
    private renderer2: Renderer2,
    public alertController: AlertController,
    private sanitizer2: DomSanitizer,
    private loadingService: LoadingService,
    public util: Util,
    public safe: SafePipe) {

    this.events2.subscribe('openDetail', () => {
      this.zone.run(() => {
        this.renderer2.setStyle(this.actionBox.nativeElement, 'height', '0rem');
        this.renderer2.setStyle(this.openDetailsid.nativeElement, 'height', '18.9rem');
        this.renderer2.setStyle(this.location.nativeElement, 'width', '100%');
        this.renderer2.setStyle(this.location.nativeElement, 'text-align', 'left');
        this.renderer2.setStyle(this.department.nativeElement, 'width', '100%');
        this.openDetails2 = true;
        console.log('Open Detail');
      });
    });
    this.events2.subscribe('closeDetail', () => {
      this.zone.run(() => {
        this.renderer2.setStyle(this.actionBox.nativeElement, 'height', '6rem');
        this.renderer2.setStyle(this.openDetailsid.nativeElement, 'height', '0rem');
        this.renderer2.setStyle(this.location.nativeElement, 'width', '50%');
        this.renderer2.setStyle(this.location.nativeElement, 'text-align', 'right');
        this.renderer2.setStyle(this.department.nativeElement, 'width', '50%');
        this.openDetails2 = false;
      });
    });
  }

  ngOnInit() {
    if (this.platform.is('cordova')) {
      this.isWeb = false;
    }
    // console.log('mobile',this.value);
    this.editMode = this.value.isDog ? false : true;
    this.dogName = this.value.isDog ? this.value.fullName : '';
    this.dogBreed = this.value.isDog ? this.value.title : '';
    this.dogDob = this.value.isDog ? this.value.email : '';
    this.dogImage = this.value.isDog ? this.value.actualImage : '';

    this.loggedUser = JSON.parse(localStorage.getItem('sparks-logged-user'));
    if(this.value.isDog) {
      this.value['phones'] = this.value.ownerInfo.phones && this.value.ownerInfo.phones.length 
                            ? this.value.ownerInfo.phones 
                            : [{type: 'mobile', value: this.value.ownerInfo.mobilePhone}, {type: 'work', value: this.value.ownerInfo.workPhone}];
      this.mobilePh = this.value.ownerInfo.phones.filter( ph => ph.type === 'mobile').map( i => i.value);
      this.workPh = this.value.ownerInfo.phones.filter( ph => ph.type === 'work').map( i => i.value);
    } else {
      this.value['phones'] = this.value.phones && this.value.phones.length 
                          ? this.value.phones 
                          : [{type: 'mobile', value: this.value.mobilePhone}, {type: 'work', value: this.value.workPhone}];
      this.mobilePh = this.value.phones.filter( ph => ph.type === 'mobile').map( i => i.value);
      this.workPh = this.value.phones.filter( ph => ph.type === 'work').map( i => i.value);
    }
    
    if (this.workPh.length) {
      this.actionPhone = this.workPh[0];
    } else if (this.mobilePh.length) {
      this.actionPhone = this.mobilePh[0];
    }
    this.mobilePh = this.mobilePh.length ? this.mobilePh[0] : '--';
    this.workPh = this.workPh.length ? this.workPh[0] : '--';
  }


  closeModalPopup() {
    this.modalController.dismiss();
  }

  openDogDetail() {
    if (!this.openDetails2) {
      this.events2.publish('openDetail');
    } else {
      this.events2.publish('closeDetail');
    }
  }

  swipeEvent(event) {
    // console.log(event.direction);
    if (event.direction === 8) {
      this.events2.publish('openDetail');
    } else {
      this.events2.publish('closeDetail');
    }
  }

  async openAlert(aHeader: string, message: string, aClass: string) {
    const alert = await this.alertController.create({
      header: aHeader,
      cssClass: aClass,
      // subHeader: '',
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  fileChangeEvent(event) {
    const fileLists: FileList = event.target.files;
    if (fileLists.length > 0) {
      const file: File = fileLists[0];
      const formData1: FormData = new FormData();
      formData1.append('file', file, file.name);
      formData1.append('email', this.value.isDog ? this.value.ownerInfo.email : this.value.email);
      formData1.append('isDog', '1');
      this.loadingService.present();
      this.homeService.uploadFile(formData1)
      .subscribe( rs => {
          this.loadingService.dismiss();
          this.myFile.nativeElement.value = null;
          if (rs.responseCode !== Enum.successCode) {
            this.openAlert('Error', rs.responseDescription, 'app-alert');
          } else {
            this.fileName = rs.response.fileName;
            let actualImage = this.value.isDog ? this.value.ownerInfo.thumbnailImage.split('/thumbnail/') : this.value.thumbnailImage.split('/thumbnail/');
            
            this.dogImage = actualImage[0]+'/dogs/'+this.fileName + '?v=' + Math.random().toFixed(4);
            
            if(this.value.isDog) {
              this.value.actualImage = actualImage[0]+'/dogs/'+this.fileName + '?v=' + Math.random().toFixed(4);
              this.value.thumbnailImage = actualImage[0]+'/thumbnail/dogs/'+this.fileName + '?v=' + Math.random().toFixed(4);
            }
            this.openAlert('Success', rs.responseDescription, 'app-alert');

            if(this.value.isDog || this.dogSaved) {
              let param = {
                "dateOfBirth": this.util.formatDate(this.dogDob, '-', false, false),
                "fileName": this.fileName,
                "fullName": this.dogName,
                "title": this.dogBreed,
                "userId": this.value.isDog ? this.value.ownerInfo.id : this.value.id,
                "id":  this.value.isDog && this.value.id ? this.value.id : 0
              };

              this.homeService.updateDogInfo(param).subscribe( rs => {
                console.log('rs', rs);
                if (rs.responseCode !== Enum.successCode) {
                  this.openAlert('Error', rs.responseDescription, 'app-alert');
                } 
              }, error => {
                console.log(error);
              })
            }
          }
        }, error => {
          console.log(error);
        });
    }
  }

  sanitizeUrl(url: string) {
    return url ? this.sanitizer2.bypassSecurityTrustUrl(url) : '--';
  }

  checkValidDate(){
    // check date 
    if(this.dogDob) {
      let dob = this.dogDob.split('-');
      this.dobError = Number(dob[0]) > 12 || Number(dob[1]) > 31 || new Date(this.dogDob) > new Date() ? true : false;
    } else {
      this.dobError = false;
    }
  }

  saveDog() {
    if(!this.value.isDog && !this.fileName) {
      this.openAlert('Alert','Please choose picture','app-alert');
      return false;
    }
    if(this.dobError) {
      return false;
    }
    
    this.dogDob = this.util.formatDate(this.dogDob, '-', false, false);

    let param = {
      "dateOfBirth": this.dogDob,
      "fileName": this.fileName,
      "fullName": this.dogName,
      "title": this.dogBreed,
      "userId": this.value.isDog ? this.value.ownerInfo.id : this.value.id,
      "id":  this.value.isDog && this.value.id ? this.value.id : 0
    };
    let subs = this.homeService.saveDogInfo(param);
    if(param.id) {      
      subs = this.homeService.updateDogInfo(param);
    }
   
    subs.subscribe( rs => {
      // console.log('rs', rs);
      if (rs.responseCode !== Enum.successCode) {
        this.openAlert('Error', rs.responseDescription, 'app-alert');
      } else {
        this.editMode = false;
        this.dogSaved = true;

        this.homeService.sendMessage({dogAdded: this.value});

        if(!param.id){
          this.openAlert('Success', AppMessage.U0027 , 'app-alert');
        } else {
          this.openAlert('Success', AppMessage.U0030 , 'app-alert');
        }

        this.modalController.dismiss();
      }
    }, error => {
      console.log(error);
    })
  }

  async deleteDog(id: number) {

      const alert = await this.alertController.create({
        header: 'Confirm!',
        message: AppMessage.U0028,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary',
            handler: (blah) => {
              console.log('Confirm Cancel: blah');
            }
          }, {
            text: 'Ok',
            handler: () => {
              console.log('Confirm Ok');
              this.homeService.deleteDog(id)
              .subscribe( rs => {
                console.log('rs', rs);
                if (rs.responseCode !== Enum.successCode) {
                  this.openAlert('Error', rs.responseDescription, 'app-alert');
                } else {
                  this.homeService.sendMessage({dogDeleted: this.value});
                  this.openAlert('Success', AppMessage.U0029, 'app-alert');
                  this.modalController.dismiss();
                }
              }, error => {
                console.log(error);
              })
            }
          }
        ]
      });
  
      await alert.present();
  }

  editEdit(){
    this.editMode = !this.editMode;
  }

  closeAlert(){
    this.modalController.dismiss();
  }
}
