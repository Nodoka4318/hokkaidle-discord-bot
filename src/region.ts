export class Region {
    name: string
    subprefecture: string // 振興局
    code: number
    latitude: number
    longitude: number

    constructor(name: string, subprefecture: string, code: number, latitude: number, longitude: number) {
        this.name = name;
        this.subprefecture = subprefecture;
        this.code = code;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    calcDistance(region: Region): number {
        const R = 6371; // 地球半径
        const dLat = Region.degToRad(region.latitude - this.latitude);
        const dLon = Region.degToRad(region.longitude - this.longitude);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(Region.degToRad(this.latitude)) * Math.cos(Region.degToRad(region.latitude)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
        const distance = R * c;
        
        return distance;
    }

    calcBearing(region: Region): number {
        const dLon = Region.degToRad(region.longitude - this.longitude);
        const y = Math.sin(dLon) * Math.cos(Region.degToRad(region.latitude));
        const x = Math.cos(Region.degToRad(this.latitude)) * Math.sin(Region.degToRad(region.latitude)) -
                  Math.sin(Region.degToRad(this.latitude)) * Math.cos(Region.degToRad(region.latitude)) * Math.cos(dLon);
        
        let brng = Math.atan2(y, x);

        brng = Region.radToDeg(brng);
        brng = (brng + 360) % 360;

        return brng;
    }

    private static degToRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    private static radToDeg(rad: number): number {
        return rad * (180 / Math.PI);
    }
}