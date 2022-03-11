import { Injectable } from '@angular/core';

interface Callbacks {
  begin: Function,
  end: Function
}

@Injectable({
  providedIn: 'root'
})
export class DragService {

  private zoneIDs: string[] = [];
  private availableZones: { [key:string]: Callbacks[]} = {};

  /**
   * @desc responsible for storing the draggable elements
   * zone target.
   * @param {Array<string>} zoneIDs - the zoneIDs
   */
  public startDrag(zoneIDs: string[]) {
    this.zoneIDs = zoneIDs;
    this.highLightAvailableZones();
  }

  /**
   * @desc responsible for matching the droppable element
   * with a draggable element
   * @param {string} zoneID - the zone ID to search for
   */
  public accepts(zoneID: string): boolean {
    return (this.zoneIDs.indexOf(zoneID) > -1);
  }

  /**
   * @desc responsible for removing highlighted available zones
   * that a draggable element can be added too.
   */
  public removeHighLightedAvailableZones(): void {
    this.zoneIDs.forEach((zone: string) => {
      this.availableZones[zone]?.forEach(cb => cb.end());
    });
  }

  /**
   * @desc responsible for adding an available zone
   * @param {{ begin: Function, end: Function }} zoneID - zone key from DroppableOptions
   * @param {string} obj - reference to a start and stop object
   */
  public addAvailableZone(zoneID: string, obj: { begin: Function, end: Function }): void {
    if (this.availableZones[zoneID]) {
      this.availableZones[zoneID].push(obj);
    } else {
      this.availableZones[zoneID] = [obj];
    }
  }

  /**
   * @desc responsible for removing an available zone
   * @param {string} zoneID - the zone ID to search for
   */
  public removeAvailableZone(zoneID: string): void {
    delete this.availableZones[zoneID];
  }

  /**
   * @desc responsible for highlighting available zones
   * that a draggable element can be added too.
   */
  private highLightAvailableZones(): void {
    this.zoneIDs.forEach((zone: string) => {
      this.availableZones[zone]?.forEach(cb => cb.begin());
    });

  }

}