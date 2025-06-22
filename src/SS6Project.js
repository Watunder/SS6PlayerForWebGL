import { ProjectData, Utils } from "../libs/ss6player-lib/dist/types/ss6player-lib.js";
import { FileLoader } from "../libs/common/Interface.js";
import { createInstance } from "../libs/common/Utils.js";

/**
 * @typedef {(ss6project: SS6Project, error: any) => void} onCompleteCallback
 */

const RESOURCE_PROGRESS = {
    NOT_READY: 0,
    READY: 1
};

export class SS6Project {
    /**
     * @type {string}
     */
    ssfbPath;

    /**
     * @type {string}
     */
    rootPath;

    /**
     * @type {string}
     */
    ssfbFile;

    /**
     * @type {ProjectData}
     */
    fbObj;

    /**
     * @type {number}
     */
    status;

    /**
     * @type {onCompleteCallback}
     */
    onComplete;

    /**
     * @type {{ [key: string]: string }}
     */
    sspjMap = {};

    /**
     * @type {FileLoader}
     */
    loader;

    /**
     * @type {{ [animePackName: string]: string[] }}
     */
    animations = {};

    /**
     * SS6Project (used for several SS6Player(s))
     * @param {string} ssfbPath - ssfb file path
     * @param {onCompleteCallback=} onComplete - result callback
     */
    constructor(ssfbPath, onComplete) {
        this.ssfbPath = ssfbPath;
        const index = ssfbPath.lastIndexOf('/');
        this.rootPath = ssfbPath.substring(0, index) + '/';
        this.ssfbFile = ssfbPath.substring(index + 1);

        this.onComplete = (onComplete === undefined) ? null : onComplete;

        this.status = RESOURCE_PROGRESS.NOT_READY;
        this.loader = createInstance(FileLoader);
        this.loadFlatBuffersProject();
    }

    /**
     * Load json and parse (then, load textures)
     */
    loadFlatBuffersProject() {
        const self = this;

        fetch(this.ssfbPath, { method: 'get' }).then((response) => {
            if (response.ok) {
                return Promise.resolve(response.arrayBuffer());
            } else {
                return Promise.reject(new Error(response.statusText));
            }
        }).then((a) => {
            self.fbObj = Utils.getProjectData(new Uint8Array(a));
            self.loadCellResources();
        }).catch((error) => {
            console.error(error);
            if (this.onComplete !== null) {
                this.onComplete(null, error);
            }
        });
    }

    /**
     * Load textures
     */
    loadCellResources() {
        // Load textures for all cell at once.
        let ids = [];

        this.sspjMap = {};
        for (let i = 0; i < this.fbObj.cellsLength(); i++) {
            const cellMap = this.fbObj.cells(i).cellMap();
            const cellMapIndex = cellMap.index();
            if (!ids.some(function (id) {
                return (id === cellMapIndex);
            })) {
                ids.push(cellMapIndex);
                const name = cellMap.name();
                this.sspjMap[name] = this.rootPath + cellMap.imagePath();
            }
        }

        this.loader.load(this.sspjMap, (error) => {
            if (error === null) {
                this.status = RESOURCE_PROGRESS.READY;
                if (this.onComplete !== null) {
                    this.getAllAnimations();
                    this.onComplete(this, null);
                }
            } else {
                if (this.onComplete !== null) {
                    this.onComplete(null, error);
                }
            }
        });
    }

    getAllAnimations() {
        if (this.status === RESOURCE_PROGRESS.READY) {
            const animePacksLength = this.fbObj.animePacksLength();
            for (let i = 0; i < animePacksLength; ++i) {
                const animePackName = this.fbObj.animePacks(i).name();
                const animationsLength = this.fbObj.animePacks(i).animationsLength() - 1;
                this.animations[animePackName] = [];
                for (let j = 0; j < animationsLength; ++j) {
                    this.animations[animePackName].push(this.fbObj.animePacks(i).animations(j).name());
                }
            }
        }
    }
}