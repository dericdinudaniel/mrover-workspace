/* This file contains the CanvasRover class for drawing the rover on the
   canvas. */

import {
  FieldOfViewOptions,
  Odom,
  Point2D,
  WheelLocs,
  ZedGimbalPosition
} from '../../utils/types';
import {
  compassToCanvasRad,
  degToRad,
  odomToCanvas
} from '../../utils/utils';
import { ROVER } from '../../utils/constants';

/**************************************************************************************************
 * Constants
 **************************************************************************************************/
/* Rover dimensions in meters. Width is the direction of the rover's width
   not the item's width. The same goes for length. */
/* distance between edge of rover body and items like ebox and ZED */
const EDGE_OFFSET = 0.07;
const EBOX_LEN = 0.3;
const WHEEL_DEPTH = 0.15;
const WHEEL_DIAM = 0.25;
const ZED_LEN = 0.05;
const ZED_WIDTH = 0.5;

/* Class for drawing the rover on the field canvas. */
export default class CanvasRover {
  /************************************************************************************************
   * Private Members
   ************************************************************************************************/
  /* Rover dimensions in pixels */
  private scaledEdgeOffset!:number;
  private scaledEboxLen!:number;
  private scaledFovDepth!:number;
  private scaledRoverLen!:number;
  private scaledRoverWdth!:number;
  private scaledWheelDpth!:number;
  private scaledWheelDiam!:number;
  private scaledZedLen!:number;
  private scaledZedWdth!:number;

  /* GPS point of the center of the canvas */
  private canvasCent!:Odom;

  /* Location of the rover */
  private currOdom!:Odom;

  /* Canvas context */
  private ctx!:CanvasRenderingContext2D;

  /* Enable the FOV visualization tool */
  private enableFOVView!:boolean;

  /* Field of view options */
  private fov!:FieldOfViewOptions;

  /* rover's path */
  private path!:Odom[];

  /* fov area */
  private FOVAreaPath!:Path2D;

  /* Whether or not to draw the rover's path */
  private pathVisible!:boolean;

  /* Function to push an area to the rover's FOV converage */
  private pushToFOVAreaPath!:(area:Path2D)=>void;

  /* Function to push a point to the rover's path */
  private pushToPath!:(currLoc:Odom)=>void;

  /* scale of the canvas in pixels/meter */
  private scale!:number;

  /* Current position of the ZED Gimbal */
  private zedGimbalPos!:ZedGimbalPosition;

  /************************************************************************************************
   * Public Methods
   ************************************************************************************************/
  /* Initialize CanvasRover instance by calculating scaled dimensions. */
  constructor(
      canvasCent:Odom,
      currOdom:Odom,
      enableFOVView:boolean,
      FOVAreaPath:Path2D,
      fov:FieldOfViewOptions,
      path:Odom[],
      pathVisible:boolean,
      pushToFOVAreaPath:(area:Path2D)=>void,
      pushToPath:(currLoc:Odom)=>void,
      scale:number, /* pixels/meter */
      zedGimbalPos:ZedGimbalPosition
  ) {
    this.currOdom = currOdom;
    this.canvasCent = canvasCent;
    this.scale = scale;
    this.path = path;
    this.FOVAreaPath = FOVAreaPath;
    this.fov = fov;
    this.pathVisible = pathVisible;
    this.pushToPath = pushToPath;
    this.pushToFOVAreaPath = pushToFOVAreaPath;
    this.zedGimbalPos = zedGimbalPos;
    this.enableFOVView = enableFOVView;

    this.scaledEdgeOffset = EDGE_OFFSET * this.scale;
    this.scaledEboxLen = EBOX_LEN * this.scale;
    this.scaledFovDepth = this.fov.depth * this.scale;
    this.scaledRoverLen = ROVER.length * this.scale;
    this.scaledRoverWdth = ROVER.width * this.scale;
    this.scaledWheelDpth = WHEEL_DEPTH * this.scale;
    this.scaledWheelDiam = WHEEL_DIAM * this.scale;
    this.scaledZedLen = ZED_LEN * this.scale;
    this.scaledZedWdth = ZED_WIDTH * this.scale;
  } /* constructor() */

  /* Draw rover on the canvas. */
  drawRover(canvas:HTMLCanvasElement):void {
    /* if field component not yet mounted */
    if (this.scale === -1) {
      return;
    }

    /* Add current point to path */
    this.pushToPath(this.currOdom);

    /* get canvas context */
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    /* Draw FOV */
    if (this.fov.visible) {
      this.drawFov(canvas);
    }

    /* Draw path */
    if (this.pathVisible) {
      this.drawPath(canvas);
    }

    /* Translate canvas to rover's position */
    const loc:Point2D = odomToCanvas(this.currOdom, this.canvasCent, canvas.height, this.scale);
    this.ctx.translate(loc.x, loc.y);
    this.ctx.rotate(degToRad(this.currOdom.bearing_deg));

    /* Draw rover */
    this.drawBody();
    this.drawEbox();
    this.drawWheels();
    this.drawZed();

    this.ctx.rotate(-degToRad(this.currOdom.bearing_deg));
    this.ctx.translate(-loc.x, -loc.y);
  } /* drawRover() */

  /************************************************************************************************
   * Private Methods
   ************************************************************************************************/
  /* Draw body of rover on the canvas. */
  private drawBody():void {
    const bodyWdth:number = this.scaledRoverWdth - (2 * this.scaledWheelDpth);
    const bodyLen:number = this.scaledRoverLen;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(-bodyWdth / 2, -bodyLen / 2, bodyWdth, bodyLen);
  } /* drawBody() */

  /* Draw ebox on the rover. */
  private drawEbox():void {
    const scaledEboxWdth:number = this.scaledRoverWdth - (2 * this.scaledWheelDpth) -
                                  (2 * this.scaledEdgeOffset);
    const eboxLoc:Point2D = {
      x: 0,
      y: ((this.scaledRoverLen - this.scaledEboxLen) / 2) - this.scaledEdgeOffset
    };

    const startCorner:Point2D = {
      x: eboxLoc.x - (scaledEboxWdth / 2),
      y: eboxLoc.y - (this.scaledEboxLen / 2)
    };

    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(startCorner.x, startCorner.y, scaledEboxWdth, this.scaledEboxLen);
  } /* drawEbox() */

  /* Draw the field of view on the canvas. */
  private drawFov(canvas):void {
    if (this.path.length === 0) {
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const roverEyeLoc:Point2D = {
      x: this.scaledRoverLen / 2,
      y: this.scaledRoverLen / 2
    };
    const currPos:Point2D = odomToCanvas(this.currOdom, this.canvasCent,
                                         canvas.height, this.scale);
    const currRelPos:Point2D = {
      x: currPos.x + (roverEyeLoc.x * Math.sin(degToRad(this.currOdom.bearing_deg))),
      y: currPos.y - (roverEyeLoc.y * Math.cos(degToRad(this.currOdom.bearing_deg)))
    };

    this.ctx.strokeStyle = 'black';
    this.ctx.fillStyle = 'rgba(105, 82, 56, 0.6)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();

    const region = new Path2D();
    region.moveTo(currRelPos.x, currRelPos.y);
    region.arc(currRelPos.x, currRelPos.y, this.scaledFovDepth,
               compassToCanvasRad(degToRad((-this.fov.angle / 2) +
               this.zedGimbalPos.angle + this.currOdom.bearing_deg)),
               compassToCanvasRad(degToRad((this.fov.angle / 2) +
               this.zedGimbalPos.angle + this.currOdom.bearing_deg)), false);
    region.lineTo(currRelPos.x, currRelPos.y);
    region.closePath();
    this.ctx.stroke(region);
    this.pushToFOVAreaPath(region);

    if (this.enableFOVView) {
      this.ctx.fill(this.FOVAreaPath);
    }
  } /* drawFov() */

  /* Draw the rover's path. */
  private drawPath(canvas:HTMLCanvasElement):void {
    if (this.path.length === 0) {
      return;
    }

    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    const centerStart:Point2D = odomToCanvas(this.path[0], this.canvasCent,
                                             canvas.height, this.scale);
    this.ctx.moveTo(centerStart.x, centerStart.y);
    this.path.forEach((loc) => {
      const pt:Point2D = odomToCanvas(loc, this.canvasCent, canvas.height, this.scale);
      this.ctx.lineTo(pt.x, pt.y);
    });

    this.ctx.stroke();

    this.ctx.strokeStyle = '#d19b62';
    this.ctx.lineWidth = this.scaledWheelDpth;
    this.ctx.beginPath();

    const wheelLocs:WheelLocs = this.getRelWheelLocs();
    for (let i = 0; i < wheelLocs.length; i += 1) {
      this.ctx.translate(centerStart.x, centerStart.y);
      this.ctx.rotate(degToRad(this.path[0].bearing_deg));
      this.ctx.moveTo(wheelLocs[i].x, wheelLocs[i].y);
      this.ctx.rotate(-degToRad(this.path[0].bearing_deg));
      this.ctx.translate(-centerStart.x, -centerStart.y);

      this.path.forEach((loc) => {
        const pt:Point2D = odomToCanvas(loc, this.canvasCent, canvas.height, this.scale);
        this.ctx.translate(pt.x, pt.y);
        this.ctx.rotate(degToRad(loc.bearing_deg));
        this.ctx.lineTo(wheelLocs[i].x, wheelLocs[i].y);
        this.ctx.rotate(-degToRad(loc.bearing_deg));
        this.ctx.translate(-pt.x, -pt.y);
      });
    }

    this.ctx.stroke();
  } /* drawPath() */

  /* Draw the wheels on the rover. */
  private drawWheels():void {
    const wheelLocs:WheelLocs = this.getRelWheelLocs();

    this.ctx.fillStyle = '#404040';
    wheelLocs.forEach((wheelLoc:Point2D) => {
      const startCorner:Point2D = {
        x: wheelLoc.x - (this.scaledWheelDpth / 2),
        y: wheelLoc.y - (this.scaledWheelDiam / 2)
      };
      this.ctx.fillRect(startCorner.x, startCorner.y,
                        this.scaledWheelDpth, this.scaledWheelDiam);
    });
  } /* drawWheels() */

  /* Draw the ZED on the rover. */
  private drawZed():void {
    const zedLoc:Point2D = {
      x: 0,
      y: this.scaledEdgeOffset + ((this.scaledZedLen - this.scaledRoverLen) / 2)
    };
    const startCorner:Point2D = {
      x: zedLoc.x - (this.scaledZedWdth / 2),
      y: zedLoc.y - (this.scaledZedLen / 2)
    };
    this.ctx.fillStyle = 'silver';
    this.ctx.fillRect(startCorner.x, startCorner.y, this.scaledZedWdth, this.scaledZedLen);
  } /* drawZed() */


  /* Get the wheel locations in pixels relative to the center of the rover. */
  private getRelWheelLocs():WheelLocs {
    const distToWheel:Point2D = {
      x: (this.scaledRoverWdth - this.scaledWheelDpth) / 2,
      y: (this.scaledRoverLen - this.scaledWheelDiam) / 2
    };
    return [
      { x: -distToWheel.x, y: -distToWheel.y },
      { x: -distToWheel.x, y:  distToWheel.y },
      { x:  distToWheel.x, y: -distToWheel.y },
      { x:  distToWheel.x, y:  distToWheel.y }
    ];
  }
} /* CanvasRover */
