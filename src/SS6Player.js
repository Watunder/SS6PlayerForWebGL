import { Player, PART_FLAG, SsPartType } from "../libs/ss6player-lib/dist/types/ss6player-lib.js";
import { SS6Project } from "./SS6Project.js";
import { SS6PlayerInstanceKeyParam } from "./SS6PlayerInstanceKeyParam.js";
import { BasePart, MeshPart } from "../libs/common/Interface.js";
import { createInstance } from "../libs/common/Utils.js";

export class SS6Player {
    /**
     * @type {BasePart}
     */
    base;

    /**
     * @type {Player}
     */
    playerLib;

    /**
     * @type {SS6Project}
     */
    ss6project;

    /**
     * @type {any[]}
     */
    liveFrame = [];

    /**
     * @type {number}
     */
    parentAlpha = 1.0;

    /**
     * @type {number[]}
     */
    prevCellID = [];

    /**
     * @type {(BasePart | MeshPart | SS6Player)[]}
     */
    prevPartObject = [];

    /**
     * @type {number[]}
     */
    changeCellID = [];

    /**
     * @type {boolean[]}
     */
    substituteOverWrite = [];

    /**
     * @type {SS6PlayerInstanceKeyParam[]}
     */
    substituteKeyParam = [];

    /**
     * @type {boolean}
     */
    _isPlaying;

    /**
     * @type {boolean}
     */
    _isPausing;

    /**
     * @type {number}
     */
    _startFrame;

    /**
     * @type {number}
     */
    _endFrame;

    /**
     * @type {number}
     */
    _currentFrame;

    /**
     * @type {number}
     */
    nextFrameTime;

    /**
     * @type {number}
     */
    _loops;

    /**
     * @type {number}
     */
    updateInterval;

    /**
     * @type {number}
     */
    playDirection;

    /**
     * @type {boolean}
     */
    skipEnabled;

    /**
     * @type {(data: any) => void}
     */
    onUserDataCallback;

    /**
     * @type {(playerLib: SS6Player) => void}
     */
    playEndCallback;

    get startFrame() {
        return this._startFrame;
    }

    get endFrame() {
        return this._endFrame;
    }

    get totalFrame() {
        return this.playerLib.animationData.totalFrames();
    }

    get fps() {
        return this.playerLib.animationData.fps();
    }

    get frameNo() {
        return Math.floor(this._currentFrame);
    }

    set loop(loop) {
        this._loops = loop;
    }

    get loop() {
        return this._loops;
    }

    get isPlaying() {
        return this._isPlaying;
    }

    get isPausing() {
        return this._isPausing;
    }

    get animePackName() {
        return this.playerLib.animePackName;
    }

    get animeName() {
        return this.playerLib.animeName;
    }

    /**
     * @constructor
     * @param {SS6Project} ss6project - SS6Project that contains animations.
     * @param {string} animePackName - The name of animePack(SSAE).
     * @param {string} animeName - The name of animation.
     */
    constructor(ss6project, animePackName = null, animeName = null) {
        this.base = createInstance(BasePart);

        this.ss6project = ss6project;
        this.playerLib = new Player(ss6project.fbObj, animePackName, animeName);
        this.parentAlpha = 1.0;

        if (animePackName !== null && animeName !== null) {
            this.setup(animePackName, animeName);
        }
    }

    /**
     * @param {string} animePackName - The name of animePack(SSAE).
     * @param {string} animeName - The name of animation.
     */
    setup(animePackName, animeName) {
        this.playerLib.Setup(animePackName, animeName);

        this.clearCaches();

        const animePackData = this.playerLib.animePackData;
        const partsLength = animePackData.partsLength();

        this.prevCellID = new Array(partsLength);
        this.prevPartObject = new Array(partsLength);
        this.changeCellID = new Array(partsLength);
        this.substituteOverWrite = new Array(partsLength);
        this.substituteKeyParam = new Array(partsLength);

        for (let j = 0; j < partsLength; j++) {
            const index = animePackData.parts(j).index();

            this.prevCellID[index] = -1;
            this.prevPartObject[index] = null;
            this.changeCellID[index] = -1;
            this.substituteOverWrite[index] = null;
            this.substituteKeyParam[index] = null;
        }

        this._isPlaying = false;
        this._isPausing = true;
        this._startFrame = this.playerLib.animationData.startFrames();
        this._endFrame = this.playerLib.animationData.endFrames();
        this._currentFrame = this.playerLib.animationData.startFrames();
        this.nextFrameTime = 0;
        this._loops = -1;
        this.skipEnabled = true;
        this.updateInterval = 1000 / this.playerLib.animationData.fps();
        this.playDirection = 1;
        this.onUserDataCallback = null;
        this.playEndCallback = null;
        this.parentAlpha = 1.0;
    }

    clearCaches() {
        this.liveFrame = [];
    }

    /**
     * @param {number} timeMs - The current time (ms)
     */
    update(timeMs, rewindAfterReachingEndFrame = true) {
        // delta time
        if (this.lastTime == null)
            this.lastTime = timeMs;

        const elapsedTime = timeMs - this.lastTime;
        this.lastTime = timeMs;

        const toNextFrame = this._isPlaying && !this._isPausing;
        if (toNextFrame && this.updateInterval !== 0) {
            this.nextFrameTime += elapsedTime;
            if (this.nextFrameTime >= this.updateInterval) {
                let playEndFlag = false;

                const step = this.nextFrameTime / this.updateInterval;
                this.nextFrameTime -= this.updateInterval * step;
                let s = (this.skipEnabled ? step * this.playDirection : this.playDirection);
                let next = this._currentFrame + s;
                let nextFrameNo = Math.floor(next);
                let nextFrameDecimal = next - nextFrameNo;
                let currentFrameNo = Math.floor(this._currentFrame);

                if (this.playDirection >= 1) {
                    // speed +
                    for (let c = nextFrameNo - currentFrameNo; c; c--) {
                        let incFrameNo = currentFrameNo + 1;
                        if (incFrameNo > this._endFrame) {
                            if (this._loops === -1) {
                                // infinite loop
                                incFrameNo = this._startFrame;
                            } else {
                                this._loops--;
                                playEndFlag = true;
                                if (this._loops === 0) {
                                    this._isPlaying = false;
                                    // stop playing the animation
                                    incFrameNo = (rewindAfterReachingEndFrame) ? this._startFrame : this._endFrame;
                                    break;
                                } else {
                                    // continue to play the animation
                                    incFrameNo = this._startFrame;
                                }
                            }
                        }
                        currentFrameNo = incFrameNo;
                        // check User Data
                        if (this._isPlaying) {
                            if (this.playerLib.HaveUserData(currentFrameNo)) {
                                if (this.onUserDataCallback !== null) {
                                    this.onUserDataCallback(this.playerLib.GetUserData(currentFrameNo));
                                }
                            }
                        }
                    }
                }
                if (this.playDirection <= -1) {
                    // speed -
                    for (let c = currentFrameNo - nextFrameNo; c; c--) {
                        let decFrameNo = currentFrameNo - 1;
                        if (decFrameNo < this._startFrame) {
                            if (this._loops === -1) {
                                // infinite loop
                                decFrameNo = this._endFrame;
                            } else {
                                this._loops--;
                                playEndFlag = true;
                                if (this._loops === 0) {
                                    this._isPlaying = false;
                                    decFrameNo = (rewindAfterReachingEndFrame) ? this._endFrame : this._startFrame;
                                    break;
                                } else {
                                    decFrameNo = this._endFrame;
                                }
                            }
                        }
                        currentFrameNo = decFrameNo;
                        // check User Data
                        if (this._isPlaying) {
                            if (this.playerLib.HaveUserData(currentFrameNo)) {
                                if (this.onUserDataCallback !== null) {
                                    this.onUserDataCallback(this.playerLib.GetUserData(currentFrameNo));
                                }
                            }
                        }
                    }
                }
                this._currentFrame = currentFrameNo + nextFrameDecimal;

                if (playEndFlag) {
                    if (this.playEndCallback !== null) {
                        this.playEndCallback(this);
                    }
                }
                this.setFrameAnimation(Math.floor(this._currentFrame), step);
            }
        } else {
            this.setFrameAnimation(Math.floor(this._currentFrame));
        }
    }

    _instancePos = new Float32Array(5);
    _CoordinateGetDiagonalIntersectionVec2 = new Float32Array(2);

    /**
     * @param {number} frameNumber - The specific frame
     * @param {number} ds - The delta step
     */
    setFrameAnimation(frameNumber, ds = 0.0) {
        const fd = this.playerLib.GetFrameData(frameNumber);
        this.base.children = [];

        // the parts loop
        const l = fd.length;
        for (let ii = 0; ii < l; ii = (ii + 1) | 0) {
            // the priority order
            const i = this.playerLib.prio2index[ii];

            const data = fd[i];
            const origCellID = data.cellIndex;
            const cellID = (this.changeCellID[i] !== -1) ? this.changeCellID[i] : origCellID;

            // reuse the previous one
            let partObject = this.prevPartObject[i];
            const part = this.playerLib.animePackData.parts(i);
            const partType = part.type();
            let overWrite = (this.substituteOverWrite[i] !== null) ? this.substituteOverWrite[i] : false;
            let overWritekeyParam = this.substituteKeyParam[i];

            // handle the initialization
            switch (partType) {
                case SsPartType.Instance:
                    if (partObject == null) {
                        partObject = this.makeCellPlayer(part.refname());
                        partObject.base.name = part.name();
                    }
                    break;
                case SsPartType.Normal:
                case SsPartType.Mask:
                    if (cellID >= 0 && this.prevCellID[i] !== cellID) {
                        if (partObject != null) partObject = null;
                        partObject = this.makeCellMesh(cellID); // (cellID, i)?
                        partObject.name = part.name();
                    }
                    break;
                case SsPartType.Mesh:
                    if (cellID >= 0 && this.prevCellID[i] !== cellID) {
                        if (partObject != null) partObject = null;
                        partObject = this.makeMeshCellMesh(i, cellID, origCellID);
                        partObject.name = part.name();
                    }
                    break;
                case SsPartType.Nulltype:
                case SsPartType.Joint:
                    if (this.prevCellID[i] !== cellID) {
                        if (partObject != null) partObject = null;
                        partObject = createInstance(BasePart);
                        partObject.name = part.name();
                    }
                    break;
                default:
                    if (cellID >= 0 && this.prevCellID[i] !== cellID) {
                        // destory the previous one
                        if (partObject != null) partObject = null;
                        partObject = this.makeCellMesh(cellID); // (cellID, i)?
                        partObject.name = part.name();
                    }
                    break;
            }

            // not initialized?
            if (partObject == null) continue;

            this.prevCellID[i] = cellID;
            this.prevPartObject[i] = partObject;

            // handle the updating
            switch (partType) {
                case SsPartType.Instance: {
                    const instance = partObject instanceof SS6Player ? partObject : null;

                    // update the instance
                    // let pos = new Float32Array(5);
                    this._instancePos[0] = 0; // pos x
                    this._instancePos[1] = 0; // pos x
                    this._instancePos[2] = 1; // scale x
                    this._instancePos[3] = 1; // scale x
                    this._instancePos[4] = 0; // rot

                    // @ts-ignore
                    // FIXME: ts(2322) Type 'Float32Array<ArrayBufferLike>' is not assignable to type 'Float32Array<ArrayBuffer>'.
                    this._instancePos = this.playerLib.TransformPositionLocal(this._instancePos, data.index, frameNumber);

                    instance.base.rotation.y = (this._instancePos[4] * Math.PI) / 180;
                    instance.base.position.x = this._instancePos[0];
                    instance.base.position.y = this._instancePos[1];
                    instance.base.scale.x = this._instancePos[2];
                    instance.base.scale.y = this._instancePos[3];

                    /* TODO: SS6Player.alpha
                    // the inherited opacity from the frame data
                    let opacity = data.opacity / 255.0;
                    if (data.localopacity < 255) {
                        // overwrite with the local opacity
                        opacity = data.localopacity / 255.0;
                    }
                    instance.alpha = opacity * this.parentAlpha;
                    */

                    instance.base.visible = !data.f_hide;

                    // the instance attribute
                    let refKeyframe = data.instanceValue_curKeyframe;
                    let refStartframe = data.instanceValue_startFrame;
                    let refEndframe = data.instanceValue_endFrame;
                    let refSpeed = data.instanceValue_speed;
                    let refloopNum = data.instanceValue_loopNum;
                    let infinity = false;
                    let reverse = false;
                    let pingpong = false;
                    let independent = false;

                    const INSTANCE_LOOP_FLAG_INFINITY = 0b0000000000000001;
                    const INSTANCE_LOOP_FLAG_REVERSE = 0b0000000000000010;
                    const INSTANCE_LOOP_FLAG_PINGPONG = 0b0000000000000100;
                    const INSTANCE_LOOP_FLAG_INDEPENDENT = 0b0000000000001000;
                    const lflags = data.instanceValue_loopflag;
                    if (lflags & INSTANCE_LOOP_FLAG_INFINITY) {
                        infinity = true;
                    }
                    if (lflags & INSTANCE_LOOP_FLAG_REVERSE) {
                        reverse = true;
                    }
                    if (lflags & INSTANCE_LOOP_FLAG_PINGPONG) {
                        pingpong = true;
                    }
                    if (lflags & INSTANCE_LOOP_FLAG_INDEPENDENT) {
                        independent = true;
                    }

                    // overwrite the instance attribute
                    if (overWrite) {
                        refStartframe = overWritekeyParam.refStartframe;
                        refEndframe = overWritekeyParam.refEndframe;
                        refSpeed = overWritekeyParam.refSpeed;
                        refloopNum = overWritekeyParam.refloopNum;
                        infinity = overWritekeyParam.infinity;
                        reverse = overWritekeyParam.reverse;
                        pingpong = overWritekeyParam.pingpong;
                        independent = overWritekeyParam.independent;
                    }

                    if (instance._startFrame !== refStartframe || instance._endFrame !== refEndframe) {
                        instance.setAnimationSection(refStartframe, refEndframe);
                    }

                    // the current frame (absolute)
                    let time = frameNumber;

                    if (independent === true) {
                        this.liveFrame[ii] += ds;
                        time = Math.floor(this.liveFrame[ii]);
                    }

                    // the keyframe (absolute)
                    const selfTopKeyframe = refKeyframe;

                    // the elapsed time
                    let reftime = Math.floor((time - selfTopKeyframe) * refSpeed);
                    if (reftime < 0) continue;
                    if (selfTopKeyframe > time) continue;

                    // the duration 
                    const inst_scale = refEndframe - refStartframe + 1;
                    if (inst_scale <= 0) continue;

                    // the loop counts
                    let nowloop = Math.floor(reftime / inst_scale);

                    let checkloopnum = refloopNum;

                    if (pingpong) checkloopnum = checkloopnum * 2;

                    if (!infinity) {
                        if (nowloop >= checkloopnum) {
                            reftime = inst_scale - 1;
                            nowloop = checkloopnum - 1;
                        }
                    }

                    // the exclude frame
                    const temp_frame = Math.floor(reftime % inst_scale);

                    if (pingpong && nowloop % 2 === 1) {
                        if (reverse) {
                            reverse = false;
                        } else {
                            reverse = true;
                        }
                    }

                    if (this.playDirection <= -1) {
                        reverse = !reverse;
                    }

                    // calculate the current frame
                    let _time = 0;
                    if (reverse) {
                        _time = refEndframe - temp_frame;
                    } else {
                        _time = temp_frame + refStartframe;
                    }

                    // set the current frame
                    instance.setFrame(Math.floor(_time));

                    this.base.addChild(instance.base);
                    break;
                }
                case SsPartType.Normal:
                case SsPartType.Mesh:
                case SsPartType.Joint:
                case SsPartType.Mask: {
                    const mesh = partObject instanceof MeshPart ? partObject : null;
                    const cell = this.playerLib.fbObj.cells(cellID);
                    let verts;
                    if (partType === SsPartType.Mesh) {
                        if (data.meshIsBind === 0) {
                            // inherit the parent's TRS(Translation/Rotation/Scale)
                            verts = this.playerLib.TransformMeshVertsLocal(Player.GetMeshVerts(cell, data, mesh.vertices), data.index, frameNumber);
                        } else {
                            verts = Player.GetMeshVerts(cell, data, mesh.vertices);
                        }
                    } else {
                        verts = (partType === SsPartType.Joint) ? new Float32Array(10) /* dummy */ : mesh.vertices;
                        verts = this.playerLib.TransformVertsLocal(Player.GetVerts(cell, data, verts), data.index, frameNumber);
                    }
                    if (data.flag1 & PART_FLAG.VERTEX_TRANSFORM) {
                        // 524288 verts [4]	//
                        const vertexCoordinateLUx = verts[3 * 2 + 0];
                        const vertexCoordinateLUy = verts[3 * 2 + 1];
                        const vertexCoordinateLDx = verts[1 * 2 + 0];
                        const vertexCoordinateLDy = verts[1 * 2 + 1];
                        const vertexCoordinateRUx = verts[4 * 2 + 0];
                        const vertexCoordinateRUy = verts[4 * 2 + 1];
                        const vertexCoordinateRDx = verts[2 * 2 + 0];
                        const vertexCoordinateRDy = verts[2 * 2 + 1];

                        const CoordinateLURUx = (vertexCoordinateLUx + vertexCoordinateRUx) * 0.5;
                        const CoordinateLURUy = (vertexCoordinateLUy + vertexCoordinateRUy) * 0.5;
                        const CoordinateLULDx = (vertexCoordinateLUx + vertexCoordinateLDx) * 0.5;
                        const CoordinateLULDy = (vertexCoordinateLUy + vertexCoordinateLDy) * 0.5;
                        const CoordinateLDRDx = (vertexCoordinateLDx + vertexCoordinateRDx) * 0.5;
                        const CoordinateLDRDy = (vertexCoordinateLDy + vertexCoordinateRDy) * 0.5;
                        const CoordinateRURDx = (vertexCoordinateRUx + vertexCoordinateRDx) * 0.5;
                        const CoordinateRURDy = (vertexCoordinateRUy + vertexCoordinateRDy) * 0.5;

                        const vec2 = Player.CoordinateGetDiagonalIntersection(verts[0], verts[1], CoordinateLURUx, CoordinateLURUy, CoordinateRURDx, CoordinateRURDy, CoordinateLULDx, CoordinateLULDy, CoordinateLDRDx, CoordinateLDRDy, this._CoordinateGetDiagonalIntersectionVec2);
                        verts[0] = vec2[0];
                        verts[1] = vec2[1];
                    }

                    const px = verts[0];
                    const py = verts[1];
                    for (let j = 0; j < verts.length / 2; j++) {
                        verts[j * 2] -= px;
                        verts[j * 2 + 1] -= py;
                    }

                    if (data.flag1 & PART_FLAG.U_MOVE || data.flag1 & PART_FLAG.V_MOVE || data.flag1 & PART_FLAG.U_SCALE || data.flag1 & PART_FLAG.V_SCALE || data.flag1 & PART_FLAG.UV_ROTATION) {
                        // move uvs
                        const u1 = cell.u1() + data.uv_move_X;
                        const u2 = cell.u2() + data.uv_move_X;
                        const v1 = cell.v1() + data.uv_move_Y;
                        const v2 = cell.v2() + data.uv_move_Y;

                        // scale uvs
                        const cx = (u2 + u1) / 2;
                        const cy = (v2 + v1) / 2;
                        const uvw = ((u2 - u1) / 2) * data.uv_scale_X;
                        const uvh = ((v2 - v1) / 2) * data.uv_scale_Y;

                        // assign uvs
                        mesh.uvs[0] = cx;
                        mesh.uvs[1] = cy;
                        mesh.uvs[2] = cx - uvw;
                        mesh.uvs[3] = cy - uvh;
                        mesh.uvs[4] = cx + uvw;
                        mesh.uvs[5] = cy - uvh;
                        mesh.uvs[6] = cx - uvw;
                        mesh.uvs[7] = cy + uvh;
                        mesh.uvs[8] = cx + uvw;
                        mesh.uvs[9] = cy + uvh;

                        if (data.flag1 & PART_FLAG.UV_ROTATION) {
                            const rot = (data.uv_rotation * Math.PI) / 180;
                            for (let idx = 0; idx < 5; idx++) {
                                // the distance from central coordinate
                                const dx = mesh.uvs[idx * 2 + 0] - cx;
                                const dy = mesh.uvs[idx * 2 + 1] - cy;

                                const cos = Math.cos(rot);
                                const sin = Math.sin(rot);

                                const tmpX = cos * dx - sin * dy;
                                const tmpY = sin * dx + cos * dy;

                                // assign the coordinate (origin offset)
                                mesh.uvs[idx * 2 + 0] = cx + tmpX;
                                mesh.uvs[idx * 2 + 1] = cy + tmpY;
                            }
                        }
                    }

                    mesh.position.x = px;
                    mesh.position.y = py;

                    mesh.visible = !data.f_hide;

                    /* TODO: MeshPart.alpha
                    // the inherited opacity from the frame data
                    let opacity = data.opacity / 255.0;
                    if (data.localopacity < 255) {
                        // overwrite with the local opacity
                        opacity = data.localopacity / 255.0;
                    }
                    mesh.alpha = opacity * this.parentAlpha; // 255*255
                    */

                    /* TODO: MeshPart.tint
                    if (data.tint) {
                        mesh.tint = data.tint;
                        // multiply the alpha channel
                        const ca = ((data.partsColorARGB & 0xff000000) >>> 24) / 255;
                        mesh.alpha = mesh.alpha * ca;
                    }
                    */

                    if (partType !== SsPartType.Mask) {
                        this.base.addChild(mesh);
                    };

                    mesh.update(verts);
                    break;
                }
                case SsPartType.Nulltype: {
                    const dummy = partObject instanceof BasePart ? partObject : null;

                    /* TODO: BasePart.alpha
                    const opacity = this.playerLib.InheritOpacity(1.0, data.index, frameNumber);
                    dummy.alpha = (opacity * data.localopacity) / 255.0;
                    */

                    const verts = this.playerLib.TransformVerts(Player.GetDummyVerts(), data.index, frameNumber);
                    const px = verts[0];
                    const py = verts[1];
                    dummy.position.x = px;
                    dummy.position.y = py;

                    /* TODO: BasePart.skew
                    const ax = Math.atan2(verts[5] - verts[3], verts[4] - verts[2]);
                    const ay = Math.atan2(verts[7] - verts[3], verts[6] - verts[2]);
                    dummy.rotation.x = ax;
                    dummy.skew.x = ay - ax - Math.PI / 2;
                    */
                    break;
                }
            }
        }
    }

    /**
     * Set the current frame
     * @param {number} frame - The current frame
     */
    setFrame(frame) {
        this._currentFrame = frame;
    }

    /**
     * Set the animation
     * @param {number} _startframe - The start frame
     * @param {number} _endframe - The end frame
     * @param {number} _loops - The loop counts
     */
    setAnimationSection(_startframe = -1, _endframe = -1, _loops = -1) {
        if (_startframe >= 0 && _startframe < this.playerLib.animationData.totalFrames()) {
            this._startFrame = _startframe;
        }
        if (_endframe >= 0 && _endframe < this.playerLib.animationData.totalFrames()) {
            this._endFrame = _endframe;
        }
        if (_loops > 0) {
            this._loops = _loops;
        } else {
            this._loops = -1;
        }
        this._currentFrame = this.playDirection > 0 ? this._startFrame : this._endFrame;
    }

    /**
     * Create the instance of {@link SS6Player}
     * @param {String} refname - {@link animePackName} + "/" + {@link animeName}
     * @param {number=} refStart - The current frame
     * @return {SS6Player}
     */
    makeCellPlayer(refname, refStart) {
        const split = refname.split('/');
        const ssp = new SS6Player(this.ss6project);
        ssp.setup(split[0], split[1]);
        ssp.play(refStart);

        return ssp;
    }

    /**
     * Start playing
     * @param {number} frameNo - The current frame
     */
    play(frameNo) {
        this._isPlaying = true;
        this._isPausing = false;

        let currentFrame = this.playDirection > 0 ? this._startFrame : this._endFrame;
        if (frameNo && typeof frameNo === 'number') {
            currentFrame = frameNo;
        }
        this._currentFrame = currentFrame;

        this.resetLiveFrame();

        const currentFrameNo = Math.floor(this._currentFrame);
        this.setFrameAnimation(currentFrameNo);
        if (this.playerLib.HaveUserData(currentFrameNo)) {
            if (this.onUserDataCallback !== null) {
                this.onUserDataCallback(this.playerLib.GetUserData(currentFrameNo));
            }
        }
    }

    resetLiveFrame() {
        const layers = this.playerLib.animationData.defaultDataLength();
        for (let i = 0; i < layers; i++) {
            this.liveFrame[i] = 0;
        }
    }

    /**
     * Change the animation of instance {@link SS6Player}
     * @param {string} partName - The name of instance
     * @param {string} animePackName - The name of animePack(SSAE)
     * @param {string} animeName - The name of animation
     * @param {boolean} overWrite - If overwrite the instance attribute
     * @param {SS6PlayerInstanceKeyParam} keyParam
     */
    changeInstanceAnime(partName, animePackName, animeName, overWrite, keyParam) {
        let rc = false;

        if (this.animePackName !== null && this.animeName !== null) {
            let packData = this.playerLib.animePackData;
            let partsLength = packData.partsLength();
            for (let index = 0; index < partsLength; index++) {

                let partData = packData.parts(index);
                if (partData.name() === partName) {
                    let instance = this.prevPartObject[index];
                    if (instance === null || instance instanceof SS6Player) {
                        this.substituteOverWrite[index] = overWrite;

                        let keyParamAsSubstitute = keyParam ? keyParam : null;
                        if (keyParamAsSubstitute === null) {
                            keyParamAsSubstitute = keyParam;
                            instance = this.makeCellPlayer(animePackName + '/' + animeName, keyParam.refStartframe);
                        } else {
                            instance = this.makeCellPlayer(animePackName + '/' + animeName);
                            keyParamAsSubstitute = new SS6PlayerInstanceKeyParam();
                            keyParamAsSubstitute.refStartframe = instance.startFrame;
                            keyParamAsSubstitute.refEndframe = instance.endFrame;
                        }
                        instance.base.name = partData.name();
                        this.prevPartObject[index] = instance;
                        this.substituteKeyParam[index] = keyParamAsSubstitute;

                        rc = true;
                        break;
                    }
                }
            }
        }
        return rc;
    }

    /**
     * Create the instance of {@link MeshPart} (5verts4Tri)
     * @param {number} id
     * @returns {MeshPart}
     */
    makeCellMesh(id) {
        const cell = this.playerLib.fbObj.cells(id);
        const u1 = cell.u1();
        const u2 = cell.u2();
        const v1 = cell.v1();
        const v2 = cell.v2();
        const w = cell.width() / 2;
        const h = cell.height() / 2;

        const verts = new Float32Array([0, 0, -w, -h, w, -h, -w, h, w, h]);
        const uvs = new Float32Array([(u1 + u2) / 2, (v1 + v2) / 2, u1, v1, u2, v1, u1, v2, u2, v2]);
        const indices = new Uint32Array([0, 1, 2, 0, 2, 4, 0, 4, 3, 0, 1, 3]); // ??? why ???

        return createInstance(MeshPart, verts, uvs, indices, cell.cellMap().name());
    }

    /**
     * Create the instance of {@link MeshPart} from the other
     * @param {number} partID
     * @param {number} cellID 
     * @param {number} origCellID
     * @returns {MeshPart}
     */
    makeMeshCellMesh(partID, cellID, origCellID) {
        const meshsDataUV = this.playerLib.animationData.meshsDataUv(partID);
        const uvLength = meshsDataUV.uvLength();

        if (uvLength > 0) {
            const cell = this.playerLib.fbObj.cells(cellID);
            const origCell = this.playerLib.fbObj.cells(origCellID);

            const diff_u = (cellID === origCellID) ? 0.0 : ((cell.u1() + cell.u2()) / 2) - ((origCell.u1() + origCell.u2()) / 2);
            const diff_v = (cellID === origCellID) ? 0.0 : ((cell.v1() + cell.v2()) / 2) - ((origCell.v1() + origCell.v2()) / 2);

            // the header data length is 2
            const uvs = new Float32Array(uvLength - 2);
            const meshNum = meshsDataUV.uv(1);

            for (let idx = 2; idx < uvLength; idx++) {
                uvs[idx - 2] = meshsDataUV.uv(idx) + (idx % 2 === 0 ? diff_u : diff_v);
            }

            const meshsDataIndices = this.playerLib.animationData.meshsDataIndices(partID);
            const indicesLength = meshsDataIndices.indicesLength();

            // the header data length is 1
            const indices = new Uint32Array(indicesLength - 1);
            for (let idx = 1; idx < indicesLength; idx++) {
                indices[idx - 1] = meshsDataIndices.indices(idx);
            }

            const verts = new Float32Array(meshNum * 2);

            return createInstance(MeshPart, verts, uvs, indices, cell.cellMap().name());
        }

        return null;
    }
}
