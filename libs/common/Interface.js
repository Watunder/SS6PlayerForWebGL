class BasePart {
    /**
     * @type {BasePart}
     */
    parent = null;

    /**
     * @type {BasePart[]}
     */
    children = [];

    /**
     * @type {{x:number, y:number}}
     */
    position = { x: 0, y: 0 };

    /**
     * @type {{x:number, y:number}}
     */
    rotation = { x: 0, y: 0 };

    /**
     * @type {{x:number, y:number}}
     */
    scale = { x: 0, y: 0 };

    /**
     * @type {boolean}
     */
    visible = true;

    /**
     * @type {string}
     */
    name = "";

    /**
     * @param {BasePart} part 
     */
    addChild(part) {
        // if (part.parent)
        //     part.parent.removeChild(part);
        part.parent = this;
        this.children.push(part);
    }
}

class MeshPart extends BasePart {
    /**
     * @type {Float32Array}
     */
    vertices = new Float32Array(10);

    /**
     * @type {Float32Array}
     */
    uvs = new Float32Array();

    /**
     * @type {Uint32Array}
     */
    indices = new Uint32Array();

    /**
     * @type {string}
     */
    textureName = "";

    /**
     * @param {Float32Array} vertices
     * @param {Float32Array} uvs
     * @param {Uint32Array} indices
     * @param {string} textureName
     */
    constructor(vertices, uvs, indices, textureName) {
        super();
    }

    /**
     * @param {Float32Array} vertices
     */
    update(vertices) {
        return false;
    }
}

class FileLoader {
    /**
     * @param {{ [key: string]: string }} sspjMap
     * @param {(error: any) => void} onError
     */
    load(sspjMap, onError) {
        onError(null);
    }

    /**
     * @param {{ [key: string]: string }} sspjMap
     * @param {(error: any) => void} onError
     */
    unload(sspjMap, onError) {
        onError(null);
    }
}

export { BasePart, MeshPart, FileLoader };
