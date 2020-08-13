import { Injectable } from "@angular/core";
import { HammerGestureConfig } from "@angular/platform-browser";
//declare var Hammer;
/**
 * @hidden
 * This class overrides the default Angular gesture config.
 */
@Injectable()
export class IonicGestureConfig extends HammerGestureConfig {


    buildHammer(element: HTMLElement) {
        const mc = new (<any>window).Hammer !(element, this.options);
        //debugger;
        mc.get('pinch').set({enable: true});
        mc.get('rotate').set({enable: true});
        mc.get('swipe').set({ direction: (<any>window).Hammer.DIRECTION_VERTICAL, threshold: 10 });
    
        for (const eventName in this.overrides) {
          mc.get(eventName).set(this.overrides[eventName]);
        }
    
        return mc;
      }

}
