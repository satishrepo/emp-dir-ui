import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network/ngx';
import { Events } from '@ionic/angular';

export enum ConnectionStatusEnum {
    Online,
    Offline
}

@Injectable({
    providedIn: 'root'
})

export class NetworkService {

  previousStatus;

  constructor(public network: Network, public eventCtrl: Events) {

    console.log('Hello NetworkProvider Provider');

    this.previousStatus = ConnectionStatusEnum.Online;

    // this.initializeNetworkEvents();
    
  }

    public initializeNetworkEvents(): void {
        this.network.onDisconnect().subscribe(() => {
            if (this.previousStatus === ConnectionStatusEnum.Online) {
                console.log('Network offline');
                // this.homeService.sendMessage({ network: 'offline' });
                this.eventCtrl.publish('network:offline');
            }
            this.previousStatus = ConnectionStatusEnum.Offline;
        });
        this.network.onConnect().subscribe(() => {
            if (this.previousStatus === ConnectionStatusEnum.Offline) {
                console.log('Network online');
                // this.homeService.sendMessage({ network: 'online' });
                this.eventCtrl.publish('network:online');
            }
            this.previousStatus = ConnectionStatusEnum.Online;
        });
    }

}

