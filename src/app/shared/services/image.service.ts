import { Injectable } from '@angular/core';
import * as AWS from 'aws-sdk';
import * as S3 from 'aws-sdk/clients/s3';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/file/ngx';
// import { Platform } from "@ionic/angular";
import { Device } from '@ionic-native/device/ngx';
import * as settings from '../../../assets/settings.json';
import { reject } from 'q';

// const bucket = new S3(
//   {
//     accessKeyId: "AKIAIH6SHONLZM6QPYNA",
//     secretAccessKey: "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",
//     region: "us-east-1"
//   }
// );

/* 
const bucket = new AWS.S3({
  apiVersion: '2006-03-01',
  params: { Bucket: "inspiredev"},
  credentials : {
        accessKeyId: "AKIA2P2AOBTTEJMGNF52",
        secretAccessKey: "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",
        region: "us-east-1"
      }
});

const config = {
  "baseUrl": "http://localhost:8100/",
  "FOLDER": "sparksrosterdev/",
  "BUCKET": "inspiredev",
  "accessKeyId": "AKIA2P2AOBTTEJMGNF52",
  "secretAccessKey": "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",
  "region": "us-east-1"
};
 */

@Injectable({
  providedIn: 'root'
})

export class ImageService {
  FOLDER = "";
  BUCKET = "";
  imageBaseUrl: string = (<any>settings).imageBaseUrl;
  appPackageName: string = (<any>settings).appPackageName;

  constructor(
    private transfer: FileTransfer,
    private device: Device,
    private file: File
    ) {
    // this.FOLDER = config.FOLDER + 'thumbnail/';
    // this.BUCKET = config.BUCKET;
  }

  /* downloadImage(fileName: String): Promise<any> {
    const t = new FileTransfer();
    const fileTransfer = t.create();
    const writePath = this.file.dataDirectory;


    const url = `${this.imageBaseUrl}${fileName}`;

    return new Promise((resolve, reject) => {
      fileTransfer.download(url, writePath + fileName)
      .then((entry) => {
        console.log('download complete: ' + entry.toURL());
        resolve(true);
      }, (error) => {
        // handle error
        console.log('donwlod error : ', error);
        if (error && error.code && error.code !== 1) {
          return reject(true);
        }
        resolve(true);
      });
    });
  } */

  downloadImage(fileUrl: string): Promise<any> {
    const t = new FileTransfer();
    const fileTransfer = t.create();
    const writePath = this.file.dataDirectory;
    
    let fileName = '';
    if(fileUrl.includes('/thumbnail/dogs/')){
      fileName = fileUrl.split('/thumbnail/dogs/')[1];
    } else {
      fileName = fileUrl.split('/thumbnail/')[1];
    }

    return new Promise((resolve, reject) => {
      fileTransfer.download(fileUrl, writePath + fileName)
      .then((entry) => {
        console.log('download complete: ' + entry.toURL());
        resolve(true);
      }, (error) => {
        // handle error
        console.log('donwlod error : ', error);
        if (error && error.code && error.code !== 1) {
          return reject(true);
        }
        resolve(true);
      });
    });
  }

  writeImage(fileName: string): Promise<any> {
    const t = new FileTransfer();
    const fileTransfer = t.create();
    const writePath = this.file.dataDirectory;
    const url = `${this.imageBaseUrl}${fileName}`;
    
    return new Promise((resolve, reject) => {

      this.file.checkFile(writePath, fileName)
      .then(doesExist => {
          console.log("doesExist : " + doesExist);
          this.file.removeFile(writePath, fileName)
          .then( rm => {
            console.log('removed file: ', rm);
            return this.downloadImage(fileName+'?v='+new Date().getTime());
            // return resolve(true);
          })
          .catch(errRm => {
            console.log('error on delete : ', errRm);
          });

      }).catch(err => {
        console.log('file not exists');
        return this.downloadImage(fileName);
      });
    }); 
  }

  /*
  encrypt(fileName) {
    return btoa(unescape(encodeURIComponent(fileName)));
  }

  decrypt(fileName) {
    return decodeURIComponent(escape(atob(fileName)));
  }

  uploadfile(file) {
    const params = {
      Bucket: this.BUCKET,
      Key: this.FOLDER + this.encrypt(file.name),
      Body: file
    };

    bucket.upload(params, function (err, data) {
      if (err) {
        const errMsg = "Error occurred while uploading your files. Please try again.";
        console.log(errMsg);
        return false;
      }

      return true;
    });
  }

  getFiles() {
    const fileUploads = [];

    const params = {
      Bucket: this.BUCKET,
      Prefix: this.FOLDER
    };

    bucket.listObjects(params, function (err, data) {
      if (err) {
        return;
      }

      const fileDatas = data.Contents;

      fileDatas.forEach(function (file) {
        fileUploads.push({ name: file.Key, url: 'https://dev-ims-web-app.s3.amazonaws.com/' + file.Key, fileName: file.Key.split('/')[1] });
      });
    });

    return fileUploads;
  }

  deleteFile(file) {
    const params = {
      Bucket: this.BUCKET,
      Key: this.FOLDER + this.encrypt(file.fileName)
    };

    bucket.deleteObject(params, function (err, data) {
      if (err) {
        let errMsg = "Error occurred while deleting your file. Please try again."
        console.log(errMsg);
        return;
      }
    });
  }

  getFile(file: any) {
    const params = {
      Bucket: this.BUCKET,
      Key: this.FOLDER + file.fileName
    };
    console.log('getFile params', params);
    bucket.getObject(params, function (err, data) {
      if (err) {
        // param.removeLoader();
        const errMsg = "Error occurred while downloading your file. Please try again.";
        console.log(errMsg, err); // an error occurred
      } else {
        // param.removeLoader();
        const bytes: any = data['Body'];

          // for chrome of ios
          if (navigator.userAgent.match('CriOS')) {
            let fileData = [bytes];
            var reader = new FileReader();
            var blobData = new Blob(fileData, { type: "application/octet-stream" });
            reader.onload = function (e) {
              window.location.href = ''; // reader.result;
            }
            reader.readAsDataURL(blobData);
          } else if (window.navigator.msSaveOrOpenBlob) {
            // for IE and edge browser
            let fileData = [bytes];
            let blobObject = new Blob(fileData);
            window.navigator.msSaveOrOpenBlob(blobObject, file.fileName);
          } else {
            // for all other browser : we have to open file in new browser and also download that file with Document Name
            let fileData = [bytes];
            var blob = new Blob(fileData, { type: "application/octet-stream" });
            let url = window.URL.createObjectURL(blob);
            let a: any = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            a.target = "_blank";
            a.href = url;
            a.download = file.fileName; // gives it a name via an a tag
            a.click();

        }
      }
    });

  }*/

}
