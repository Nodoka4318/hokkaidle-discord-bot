import { Region } from "./region";

export class SubprefectureMap {
    _name!: string;
    _regions: Region[] = [];
    
    set name(name: string) {
        this._name = name;
    }

    get name(): string {
        return this._name;
    }

    set regions(regions: Region[]) {
        this._regions = regions;
    }

    get regions(): Region[] {
        return this._regions;
    }
}