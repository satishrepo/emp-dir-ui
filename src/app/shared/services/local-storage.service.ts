import { Injectable } from '@angular/core';
import { Sql } from './sql';
import { HomeService } from './home.service';
import { ImageService } from './image.service';
import { Enum } from '../config/enum.enum';
// import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { Util } from './util';
import * as settings from '../../../assets/settings.json';
import { Device } from '@ionic-native/device/ngx';
import { File } from '@ionic-native/file/ngx';
// import { resolve } from 'url';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  pageSize = 100;
  totalRecords: any;
  totalSaved = 0;
  appPackageName: String = (<any>settings).appPackageName;

  constructor(
    private sql: Sql,
    private homeService: HomeService,
    private imageService: ImageService,
    private webview: WebView,
    private util: Util,
    private device: Device,
    private file: File
    // private sqlite: SQLite
    ) { }

  getPhone(array: any, type: string): string {
    // console.log(array, typeof array)
    if (typeof array === "undefined" || !array.length) {
      return '';
    }
    const phone = array.filter( obj => obj.type === type ).map( i => i.value );
    return phone.length ? phone[0] : '';
  }

  /**
   * create db and table on device
   */
  createDb(): Promise<any> {
    console.log('create db is in progress');
    return this.sql.query(`CREATE TABLE IF NOT EXISTS contacts(
                        firstName VARCHAR(255),
                        lastName VARCHAR(255),
                        fullName VARCHAR(255),
                        title VARCHAR(255),
                        email VARCHAR(255) PRIMARY KEY,
                        location VARCHAR(255),
                        department VARCHAR(255),
                        workPhone VARCHAR(50),
                        mobilePhone VARCHAR(50),
                        thumbnailImage VARCHAR(150),
                        isDeleted INT,
                        isDog INT,
                        ownerInfo TEXT,
                        dogCount INT
                      )`);
  }

  /**
   * save contacts in local db
   * @param contact object of employee contact
   */
  save(contact: any): Promise<any> {

    const writePath = this.file.dataDirectory;

    // get fileName from file path
    let fileName = '';
    if(contact.thumbnailImage.includes('/thumbnail/dogs/')){
      fileName = contact.thumbnailImage.split('/thumbnail/dogs/')[1];
    } else {
      fileName = contact.thumbnailImage.split('/thumbnail/')[1];
    }

    return this.sql.query(`INSERT OR REPLACE INTO contacts
                          (firstName, lastName, fullName, title, email, location, department, workPhone, mobilePhone, thumbnailImage, isDeleted, isDog, ownerInfo, dogCount)
                          VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contact.firstName || '',
        contact.lastName || '',
        contact.fullName || '',
        contact.title || '',
        contact.email || '',
        contact.location ? contact.location : '',
        contact.department ? contact.department : '',
        this.getPhone(contact.phones, 'work'),
        this.getPhone(contact.phones, 'mobile'),
        // (contact.email ? writePath + contact.email.split('@')[0] + '.jpg' : ''),
        (fileName ? writePath + fileName : ''),
        contact.isDeleted ? 1 : 0,
        contact.isDog || 0,
        typeof contact.ownerInfo !== 'undefined' ? JSON.stringify(contact.ownerInfo) : '',
        contact.dogCount
      ]);
  }

  /**
   * return contacts
   * @param filters filters object
   */
  getUsers(filters?: any): Promise<any> {

    const loggedUser = JSON.parse(localStorage.getItem('sparks-logged-user'));

    return new Promise( (resolve, reject) => {
      const responseFromat = {
        "responseCode": "S0001",
        "responseDescription": "Success",
        "response": {
          "metaInfo": {
            "groupBy": null
          },
          "results": [],
          "paginationInfo": {
            "pageSize": filters.pageSize,
            "totalPages": 0,
            "totalRecords": 0,
            "curPage": 0
          }
        }
      };

      let where = '';
      const groupBy = filters.groupBy && (filters.groupBy === 'department' || filters.groupBy === 'location') ? ` GROUP BY ${filters.groupBy} ` : '';
      const limit = filters.groupBy === 'all' ? `LIMIT ${filters.pageSize}` : '';
      const offset = filters.groupBy === 'all' && filters.pageNumber > 1 ? ' OFFSET ' + ((filters.pageNumber - 1) * filters.pageSize) : '';

      if (filters.filterDetail.locations.length) {
        where += ` AND location IN ('${filters.filterDetail.locations.map(r => r.replace(/'/g,"''")).join("','")}') `;
        // where += " AND (location = '" + filters.filterDetail.locations.join("' OR location = '") + "')";
      }
      if (filters.filterDetail.departments.length) {
        where += ` AND department IN ('${filters.filterDetail.departments.map(r => r.replace(/'/g,"''")).join("','")}')`;
        // where += " AND (department = '" + filters.filterDetail.departments.join("' OR department = '") + "')";
      }
      if (filters.filterDetail.alphabets.length) {
        where += " AND firstName LIKE '" + filters.filterDetail.alphabets.join("','") + "%' ";
      }
      if (filters.searchText) {
        filters.searchText = filters.searchText.trim();
        where += `AND (
          firstName LIKE '%${filters.searchText}%'
          OR lastName LIKE '%${filters.searchText}%'
          OR title LIKE '%${filters.searchText}%'
          OR workPhone LIKE '%${filters.searchText}%'
          OR mobilePhone LIKE '%${filters.searchText}%'
       )`;
      }

      const query = `SELECT * FROM contacts WHERE isDeleted = 0 ${where}  order by firstName, lastName ${limit} ${offset} `;
      console.log(query);
      this.sql.query(query, [])
      .then( rs => {
        if (rs.res.rows.length) {
          const data = [];

          for (let i = 0; i <= rs.res.rows.length; i++) {
            if (rs.res.rows.item(i)) {
              rs.res.rows.item(i).thumbnailImage = this.pathForImage(rs.res.rows.item(i).thumbnailImage);
              rs.res.rows.item(i)['actualImage'] = this.pathForImage(rs.res.rows.item(i).thumbnailImage);
              rs.res.rows.item(i)['ownerInfo'] = rs.res.rows.item(i).ownerInfo ? JSON.parse(rs.res.rows.item(i).ownerInfo) : '';
              data.push(rs.res.rows.item(i));
            }
          }
          let result = data;
          if (filters.groupBy !== 'all') {
            const groupData = {};
            const outData = [];

            data.forEach( item => {
              const key = item[filters.groupBy];
              // item['ownerInfo'] = JSON.parse(item['ownerInfo']);
              if (groupData[key]) {
                groupData[key]['users'].push(item);
              } else {
                groupData[key] = {};
                groupData[key]['value'] = key;
                groupData[key]['users'] = [];
                groupData[key]['users'].push(item);
              }
            });

            // bring leadship on top
            const location = loggedUser['location'] ? loggedUser['location'] : '';
            const topRow = filters.groupBy === 'department' ? 'Leadership' : location;
            const topRowData = groupData[topRow];
            delete groupData[topRow];

            // sorting keys;
            const sortedObject = {};
            Object.keys(groupData).sort().forEach( i => {
              sortedObject[i] = groupData[i];
            });

            // pushing data in array
            for ( let i in sortedObject) {
              if (i) {
                sortedObject[i].users = sortedObject[i].users.splice(0, filters.pageSize);
                outData.push(sortedObject[i]);
              }
            }
            if (topRowData && topRowData['users'] && topRowData['users'].length) {
              outData.unshift({ value: topRow, users: topRowData['users'].splice(0, filters.pageSize) });
            }
            result = outData;
          }




          // if group by department then push Dogs of Sparks department at last position
          // if group by all then remove item with category Dogs of Sparks 
          if(filters.groupBy === Enum.group_department) {
            let resp = result.some( (item: any) => {
              if(item.value === Enum.dog_category){
                result.splice(result.indexOf(item), 1)
                result.push(item);
                return false;
              }
            });
            console.log(resp);
          } 
          else if (filters.groupBy === Enum.group_all) {
            let allEmployee = result.filter( (item: any) => {
              return filters.filterDetail.departments.indexOf(Enum.dog_category) < 0 ? !item.isDog : true;
            });
            result = allEmployee;
          }

          // console.log(result);

          this.getTotalCount()
          .then( count => {
            responseFromat.response.results = result;
            responseFromat.response.paginationInfo.totalRecords = count;
            responseFromat.response.paginationInfo.totalPages = Math.ceil(count/filters.pageSize);
            return resolve(responseFromat);
          })
          .catch(err => {
            console.log(' ------ count error ---', err);
            reject({error : 'User count error'});
          });
        } else {
          console.log(' No User Found, Error :', rs);
          resolve(responseFromat);
        }
      })
      .catch( error => {
        console.log(' Error on Reading User Found Offline, Error :', error);
        reject({error : error});
      });
    });
  }

  getTotalCount(): Promise<any> {
    let totalRecords = 0;
    const query = `SELECT count(*) as totalRecords FROM contacts WHERE isDeleted = 0 `;
    return new Promise( (resolve, reject) => {
      this.sql.query(query, [])
      .then( rs => {
        if (rs) {
          // resolve(rs.res.rows[0].totalRecords);
          console.log('---------- count ---------');
          for ( let i = 0; i < rs.res.rows.length; i++) {
            console.log(rs.res.rows.item(i));
            totalRecords = rs.res.rows.item(i).totalRecords;
          }
          resolve(totalRecords);
        } else {
          reject({err: 'Could not get total count '});
        }
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
    });
  }

  getFilters(): Promise<any> {
      const query = `SELECT GROUP_CONCAT(DISTINCT(location)) as locations, GROUP_CONCAT(DISTINCT(department)) as departments FROM contacts WHERE isDeleted = 0 `;
      return new Promise( (resolve, reject) => {
      this.sql.query(query, [])
      .then( rs => {
        if (rs.res.rows.length) {
          for ( let i = 0; i <= rs.res.rows.length; i++) {
            console.log('---------- filter---------');
            console.log(rs.res.rows.item(i));
            if (rs.res.rows.item(i).locations && rs.res.rows.item(i).departments) {
              const locations = rs.res.rows.item(i).locations.split(',').sort().filter(i => i).map( item => ({val: item, isChecked: false}));
              const departments = rs.res.rows.item(i).departments.split(',').sort().filter(i => i).map( item => ({val: item, isChecked: false}));
              return resolve({
                  "responseCode": "S0001",
                  "responseDescription": "Success",
                  "response": {
                    "locations": locations,
                    "departments": departments,
                  }
              });
            } else {
              reject({err: 'no offline data'});
            }
          }
        } else {
          reject({err: 'no offline data'});
        }
      })
      .catch(err => {
        console.log('Database Read Error Filter From LocaDb : ', err);
        reject({err: 'no offline data'});
      });
    });
  }

  syncData(): Promise<any> {
    return new Promise ( (resolve, reject)  => {
      ( async() => {

        const [kvErr, date] = await this.do(this.sql.get('lastSync'));

        let lastSyncDate = '';

        if (!kvErr && date) {
          lastSyncDate = date;
        }

        // fist time sync case, wait download all image
        // const [imgErr, imgData] = await this.do(this.downloadAllImage());
        const [imgErr, imgData] = await this.do(this.downloadAllImage_sequence());
        // const [imgErr, imgData] = await this.do(this.downloadAllImage_batches());

        console.log('imgData', imgErr, imgData);
        if (!imgData) {
          console.log(' ---- error on image download process ----- ');
          this.homeService.sendMessage({intrupted: true});
          return reject({message: 'error on image download process'});
        }

        // this.sql.set('offlineMode', 'on');

        const [dbErr, db] = await this.do(this.createDb());

        if (!dbErr) {

          const [dataErr, allData] = await this.do(this.getContacts(lastSyncDate));
          
          if (dataErr) {
            this.homeService.sendMessage({intrupted: true});
            return resolve({message: 'intrupted'});
          }

          if (!allData.data.length) {
            // this.sql.set('offlineMode', 'on');
            // this.sql.set('lastSync', new Date().toString());
            this.setOfflineMode('on');
            this.setLastSync(new Date().toString());
            this.homeService.sendMessage({progress : 100});
            return resolve(true);
          }

          const data = allData.data;

          this.totalRecords = allData.paging;

          const imagePromise = [];

          for (let  j = 0 ; j < data.length; j++) {
            const i = data[j];
            const contact = {
              firstName: i.firstName,
              lastName: i.lastName,
              fullName: i.fullName,
              title: i.title,
              email: i.email,
              profilePic: '',
              location: i.location,
              department: i.department,
              phones: i.phones,
              thumbnailImage: i.thumbnailImage,
              isDeleted: i.isDeleted,
              isDog: i.isDog,
              ownerInfo: i.ownerInfo,
              dogCount: i.dogCount
            };
            // console.log(contact);
            const [qErr, qry] = await this.do(this.save(contact));
            console.log('save record : ', qErr, qry);
            if (qErr) {
              this.homeService.sendMessage({intrupted : true});
              return resolve({message: 'intrupted'});
            }

            if (i.email && lastSyncDate) {
              const fileName = i.email.split('@')[0] + '.jpg';
              imagePromise.push(this.imageService.writeImage(fileName));
            }

            this.totalSaved += 1;
            console.log('------------------', this.totalRecords.totalPages, this.totalSaved, this.totalRecords.totalRecords);
            if (this.totalRecords.totalPages < 2 && this.totalSaved >= this.totalRecords.totalRecords) {
              const curDate = new Date().toString();
              this.setOfflineMode('on');
              this.setLastSync(curDate);
              this.homeService.sendMessage({syncDate : curDate});
              this.homeService.sendMessage({progress : 100});
              this.totalSaved = 0;
              return resolve(true);
            }
          

            this.homeService.sendMessage({progress : 90});

          }


          for (let k = 2; k <= this.totalRecords.totalPages; k++) {
            const p = {
              groupBy: 'all',
              pageSize: this.pageSize,
              location: '',
              department: '',
              filterDetail: {},
              pageNumber: k,
              searchText: ''
            };
            this.getRecords(p)
            .then ( r => {

              this.totalSaved += this.pageSize;
              console.log(this.totalSaved, this.totalRecords.totalRecords, this.totalRecords.totalPages);
              const total = Math.ceil( this.totalRecords.totalRecords / 100 ) * 100;
              const percent = (this.totalSaved * 10) / total;
              this.homeService.sendMessage({progress : (90 + Math.round(percent))});
              if (this.totalSaved >= this.totalRecords.totalRecords) {
                const curDate = new Date().toString();
                this.setOfflineMode('on');
                this.setLastSync(curDate);
                this.homeService.sendMessage({syncDate : curDate});
                console.log('done writing');
                // this.totalSaved = 0; // 
                return resolve(true);
              }
            });
          }

        } else {
          console.log('db Error', dbErr);
        }
      })();

    });
  }


  do( promise ): Promise<any> {
    return promise
    .then(rs => {
        return [null, rs];
    })
    .catch(err => [err]);
  }


  getImage(email: string): Promise<any> {
    return new Promise( (resolve, reject) => {
      const imageParam = {
        emailIds: [email],
        imageType: "THUMBNAIL"
      };
      this.homeService.getContactImage(imageParam)
      .subscribe( resp => {
        resolve ({ image : resp.response[email] ? 'data:image/jpg;base64,' + resp.response[email] : '' });
      }, error => {
        console.log('Error on fetching image in local db', error);
        reject({error: error});
      });
    });
  }

  getContacts(lastSyncDate ?: String): Promise<any> {
    return new Promise( (resolve, reject) => {
      const param = {
        // tab: 'department',
        groupBy: 'all',
        pageSize: this.pageSize,
        location: '',
        department: '',
        filterDetail: {},
        pageNumber: 1,
        searchText: ''
      };

      if (lastSyncDate) {
        param['afterDate'] = this.util.formatDate(lastSyncDate, '-');
      }

      this.homeService.getContactData(param)
      .subscribe( response => {
        // if (response.responseCode === Enum.successCode && response.response.results.length) {
        if (response.responseCode === Enum.successCode) {
          resolve ({ data : response.response.results, paging: response.response.paginationInfo });
        } else {
          // console.log('No data feched', response);
          reject({error: response});
        }
      }, error => {
        console.log('Error on reading data, no internet', error);
        reject({error: error});
      });

    });
  }


  getRecords(param: any) {
    return new Promise( resolve => {
      ( async() => {

        const [kvErr, date] = await this.do(this.sql.get('lastSync'));

        let lastSyncDate = '';

        if (!kvErr && date) {
          lastSyncDate = date;
        }

        this.homeService.getContactData(param)
        .subscribe((response) => {
          const data = response.response.results;
          for (let  j = 0 ; j < data.length; j++) {
            const i = data[j];
            // const img = await this.do(this.getImage(i.email));
            const contact = {
              firstName: i.firstName,
              lastName: i.lastName,
              fullName: i.fullName,
              title: i.title,
              email: i.email,
              profilePic: '',
              location: i.location,
              department: i.department,
              phones: i.phones,
              thumbnailImage: i.thumbnailImage,
              isDeleted: i.isDeleted,
              isDog: i.isDog,
              ownerInfo: i.ownerInfo,
              dogCount: i.dogCount
            };
            resolve(this.save(contact));

            if (i.email && lastSyncDate) {
              const fileName = i.email.split('@')[0] + '.jpg';
              this.imageService.writeImage(fileName);
            }
          }
        });
      })();
    });
  }

  pathForImage(img) {
    if (img === null) {
      return '';
    } else {
      const converted = this.webview.convertFileSrc(img);
      return converted;
    }
  }

  clearDb() {
    this.setOfflineMode('off');
    this.setLastSync('');
    return this.sql.query(`DELETE FROM contacts`, []);
  }

  getLastSync() {
    return this.sql.get('lastSync');
  }

  checkOfflineMode() {
    return this.sql.get('offlineMode');
  }

  /**
   * save user choice to offline mode
   * @param choice on/off
   */
  setOfflineMode(choice: string) {
    return this.sql.set('offlineMode', choice);
  }

  setLastSync(dateString: string) {
    return this.sql.set('lastSync', dateString);
  }

  downloadAllImage_old(): Promise<any> {
    return new Promise((resolve, reject) => {
      const promises = [];
      this.sql.get('lastSync')
      .then( date => {
        if (date) {
          return resolve(true);
        } else {
          this.homeService.getEmailList()
          .subscribe( list => {
            if (list.response.length) {
              const data = list.response;
              data.forEach( rs => {
                promises.push(this.imageService.downloadImage(rs.split('@')[0] + '.jpg'));
              });
              return resolve(true);
              /* return Promise.all(promises)
              .then(result => {console.log('result', result)
                resolve(true);
              })
              .catch(error => {
                console.log('promise all error : ', error)
              }); */
            } else {
              console.log('no active user list found.');
              resolve(false);
            }
          }, error => {
            console.log('error fetching email list : ', error);
            resolve(false);
          });
        }
      })
      .catch(err => {
        this.homeService.getEmailList()
        .subscribe( list => {
          const Promises = [];
          if (list.response.length) {
            const data = list.response;
            data.forEach( rs => {
              Promises.push(this.imageService.downloadImage(rs.split('@')[0] + '.jpg'));
            });
            return resolve(true);
          } else {
            console.log('no active user list found.');
            resolve(false);
          }
        }, error => {
          console.log('error fetching email list : ', error);
          resolve(false);
        });
      });

    });
  }


  downloadBatch(data, batchSize, batchNo, totalBaches): Promise<any> {
    return new Promise ( (resolve, reject) => {
      if (data.length > 0 && batchSize > 0 && batchNo > 0 && totalBaches > 0) {
        const promises = [];
        const startIndex = (batchNo - 1) * batchSize;
        let endIndex = (batchNo * batchSize) - 1;

        if (batchNo === totalBaches) {
          endIndex = data.length - 1;
        }

        for (let i = startIndex; i <= endIndex; i++) {
          promises.push(this.imageService.downloadImage(data[i].split('@')[0] + '.jpg'));
        }

        Promise.all(promises)
        .then (result => {
          batchNo++;
          console.log(batchNo, totalBaches, result);
          if (batchNo <= totalBaches) {
            this.downloadBatch(data, batchSize, batchNo, totalBaches);
          } else {
            // main promise resolve
            console.log('return');
            return resolve(true);
          }
        });
      }
    });
  }

  downloadAllImage_batches(): Promise<any> {
    return new Promise((resolve, reject) => {
    ( async() => {
        // let promises = [];
        const [dateErr, date] = await this.do(this.getlastSyncDate());
          if (date) {
            return resolve(true);
          } else {
            const [emailErr, list]  = await this.do(this.getEmailList());

            if (list.length) {
              const data = list;
              const batchSize = 100;
              const totalCount  = list.length;
              let totalBaches = Math.floor(totalCount / batchSize);
              if ((totalCount % batchSize) !== 0 ) {
                totalBaches++;
              }
              const [err, res] = await this.do(this.downloadBatch(list, batchSize, 1, totalBaches));
              console.log('res1', err, res);
              return resolve(true);

            } else {
              console.log('no active user list found.');
              resolve(false);
            }
          }
      })();
    });
  }



  downloadAllImage(): Promise<any> {
    return new Promise((resolve, reject) => {
      const promises = [];
      this.sql.get('lastSync')
      .then( date => {
        if (date) {
          return resolve(true);
        } else {
          this.homeService.getEmailList()
          .subscribe( list => {
            if (list.response.length) {

              const batchSize = 100;
              const totalCount  = list.response.length;
              let totalBaches = Math.floor(totalCount / batchSize);
              if ((totalCount % batchSize) !== 0 ) {
                totalBaches++;
              }
              const res = this.downloadBatch(list.response, batchSize, 1, totalBaches);
              console.log('res1', res);
              return resolve(res);

            } else {
              console.log('no active user list found.');
              resolve(false);
            }
          }, error => {
            console.log('error fetching email list : ', error);
            resolve(false);
          });
        }
      })
      .catch(err => {
        this.homeService.getEmailList()
        .subscribe( list => {
          const Promises = [];
          if (list.response.length) {

            const batchSize = 100;
            const totalCount  = list.response.length;
            let totalBaches = Math.floor(totalCount / batchSize);
            if ((totalCount % batchSize) !== 0 ) {
              totalBaches++;
            }
            const res = this.downloadBatch(list.response, batchSize, 1, totalBaches);
            console.log('res', res);
            return resolve(res);

          } else {
            console.log('no active user list found.');
            resolve(false);
          }
        }, error => {
          console.log('error fetching email list : ', error);
          resolve(false);
        });
      });

    });
  }

  getEmailList(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.homeService.getEmailList()
      .subscribe( list => {
        resolve(list.response);
      });
    });
  }

  getlastSyncDate() {
    return new Promise((resolve, reject) => {
    this.sql.get('lastSync')
      .then( date => {
        resolve(date);
      });
    });
  }

  downloadAllImage_sequence(): Promise<any> {
    return new Promise((resolve, reject) => {
    ( async() => {
        let promises = 0;
        const [dateErr, date] = await this.do(this.getlastSyncDate());
          if (date) {
            return resolve(true);
          } else {
            const [emailErr, list]  = await this.do(this.getEmailList());

            if (!emailErr && list && list.length) {
              for (let i = 0; i < list.length; i++) {
                try {
                  await this.imageService.downloadImage(list[i]);
                  // this.imageService.downloadImage(list[i]); // async download test purpose
                  ++promises;
                  this.homeService.sendMessage({progress: Math.ceil((promises * 80) / list.length)});
                } catch(e) {
                  return reject(true);
                }
              }
              return resolve(true);
            } else {
              console.log('no active user list found.');
              resolve(false);
            }
          }
      })();
    });
  }

}
