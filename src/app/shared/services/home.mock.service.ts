import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomeMockService {

  constructor() { }

  getContactData(): Observable<any> {
      return of({
        "responseCode": "S0001",
        "responseDescription": "Success",
        "response": {
          "metaInfo": {
            "groupBy": "string"
          },
          "results": [
            {
              "value": "Human Resources",
              "users": [
                {
                  "email": "rosteradmin@wearesparks.com",
                  "title": "HR Manager",
                  "firstName": "Roster",
                  "lastName": "Admin",
                  "location": "Los Angeles",
                  "department": "Human Resources",
                  "phones": [
                    {
                      "value": "215-671-1663",
                      "type": "work"
                    },
                    {
                      "value": "215-215-1307",
                      "type": "mobile"
                    }
                  ]
                }
              ]
            }
          ],
          "paginationInfo": {
            "pageSize": 8,
            "totalPages": 0,
            "totalRecords": 0,
            "curPage": 0
          }
        }
      });
  }

  getContactImages(): Observable<any> {
    return of({
      "responseCode": "S0001",
      "responseDescription": "Success",
      "response": {
        "groupBy": "department",
        "results": [{
            "users": {
                "rosteruser@wearesparks.com" : "https://via.placeholder.com/200x299.png/1d8ca3/FFFFFF/?text=Roster&color=red",
                "ccrowley@wearesparks.com" : "https://via.placeholder.com/200x299.png?text=Ccrowley",
                "npyzdrowska@wearesparks.com" : "https://via.placeholder.com/200x299.png?text=Npyzdrowska",
                "ocaccoma@wearesparks.com" : "https://via.placeholder.com/200x299.png?text=Ocaccoma",
                "athompson@wearesparks.com" : "https://via.placeholder.com/200x299.png?text=Athompson",
                "bwalton@wearesparks.com" : "https://via.placeholder.com/200x299.png?text=Bwalton",
            }
        }]
      }
    });
  }


}
