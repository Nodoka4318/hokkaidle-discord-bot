export class Region {
    name: string
    subprefecture: string // 振興局
    code: number
    latitude: number
    longitude: number

    private static MAX_DISTANCE = 450_000;

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
        const dLon = Region.degToRad(this.longitude - region.longitude);
        const y = Math.sin(dLon) * Math.cos(Region.degToRad(this.latitude));
        const x = Math.cos(Region.degToRad(region.latitude)) * Math.sin(Region.degToRad(this.latitude)) -
            Math.sin(Region.degToRad(region.latitude)) * Math.cos(Region.degToRad(this.latitude)) * Math.cos(dLon);

        let brng = Math.atan2(y, x);

        brng = Region.radToDeg(brng);
        brng = (brng + 360) % 360;

        return brng;
    }

    getDirectionArrow(region: Region): string {
        const bearing = this.calcBearing(region);

        // 計算して出せばよかった
        if (bearing >= 337.5 || bearing < 22.5) {
            return '⬆️';
        } else if (bearing >= 22.5 && bearing < 67.5) {
            return '↗️';
        } else if (bearing >= 67.5 && bearing < 112.5) {
            return '➡️';
        } else if (bearing >= 112.5 && bearing < 157.5) {
            return '↘️';
        } else if (bearing >= 157.5 && bearing < 202.5) {
            return '⬇️';
        } else if (bearing >= 202.5 && bearing < 247.5) {
            return '↙️';
        } else if (bearing >= 247.5 && bearing < 292.5) {
            return '⬅️';
        } else if (bearing >= 292.5 && bearing < 337.5) {
            return '↖️';
        }
        return '';
    }

    calcPercent(region: Region): number {
        let distance = this.calcDistance(region) * 1000; // km -> m
        let proximity = Math.max(Region.MAX_DISTANCE - distance, 0);

        return Math.round((proximity / Region.MAX_DISTANCE) * 100);
    }

    static getSquareCharacters(proximity: number): string[] {
        const characters = new Array<string>(5);
        const greenSquareCount = Math.floor(proximity / 20);
        const yellowSquareCount = proximity - greenSquareCount * 20 >= 10 ? 1 : 0;

        characters.fill("🟩", 0, greenSquareCount);
        characters.fill("🟨", greenSquareCount, greenSquareCount + yellowSquareCount);
        characters.fill("⬜", greenSquareCount + yellowSquareCount);

        return characters;
    }

    private static degToRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    private static radToDeg(rad: number): number {
        return rad * (180 / Math.PI);
    }
}