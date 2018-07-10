"use strict";

var Ops=Ops || {};
Ops.Gl=Ops.Gl || {};
Ops.Exp=Ops.Exp || {};
Ops.Anim=Ops.Anim || {};
Ops.Array=Ops.Array || {};
Ops.Exp.Gl=Ops.Exp.Gl || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.ShaderEffects=Ops.Gl.ShaderEffects || {};
Ops.Exp.Gl.ShaderEffects=Ops.Exp.Gl.ShaderEffects || {};

//----------------



// **************************************************************
// 
// Ops.Gl.MainLoop
// 
// **************************************************************

Ops.Gl.MainLoop = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
const fpsLimit=op.inValue("FPS Limit",0);
const trigger=op.outFunction("trigger");
const width=op.outValue("width");
const height=op.outValue("height");
const reduceLoadingFPS=op.inValueBool("Reduce FPS loading");
const clear=op.inValueBool("Clear",true);
const fullscreen=op.inValueBool("Fullscreen Button",false);
const active=op.inValueBool("Active",true);
const hdpi=op.inValueBool("Hires Displays",false);

hdpi.onChange=function()
{
    if(hdpi.get()) op.patch.cgl.pixelDensity=window.devicePixelRatio;
        else op.patch.cgl.pixelDensity=1;
        
    op.patch.cgl.updateSize();
    if(CABLES.UI) gui.setLayout();
};


var cgl=op.patch.cgl;
var rframes=0;
var rframeStart=0;

if(!op.patch.cgl) op.uiAttr( { 'error': 'No webgl cgl context' } );

var identTranslate=vec3.create();
vec3.set(identTranslate, 0,0,0);
var identTranslateView=vec3.create();
vec3.set(identTranslateView, 0,0,-2);

fullscreen.onChange=updateFullscreenButton;
setTimeout(updateFullscreenButton,100);
var fsElement=null;

function updateFullscreenButton()
{
    function onMouseEnter()
    {
        if(fsElement)fsElement.style.display="block";
    }

    function onMouseLeave()
    {
        if(fsElement)fsElement.style.display="none";
    }
    
    op.patch.cgl.canvas.addEventListener('mouseleave', onMouseLeave);
    op.patch.cgl.canvas.addEventListener('mouseenter', onMouseEnter);

    if(fullscreen.get())
    {
        if(!fsElement) 
        {
            fsElement = document.createElement('div');

            var container = op.patch.cgl.canvas.parentElement;
            if(container)container.appendChild(fsElement);
    
            fsElement.addEventListener('mouseenter', onMouseEnter);
            fsElement.addEventListener('click', function(e)
            {
                if(CABLES.UI && !e.shiftKey) gui.cycleRendererSize();
                    else
                    {
                        cgl.fullScreen();
                    }
            });

        }
        fsElement.style.padding="10px";
        fsElement.style.position="absolute";
        fsElement.style.right="5px";
        fsElement.style.top="5px";
        fsElement.style.width="20px";
        fsElement.style.height="20px";
        // fsElement.style.opacity="1.0";
        fsElement.style.cursor="pointer";
        fsElement.style['border-radius']="40px";
        fsElement.style.background="#444";
        fsElement.style["z-index"]="9999";
        fsElement.style.display="none";
        fsElement.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 490 490" style="width:20px;height:20px;" xml:space="preserve" width="512px" height="512px"><g><path d="M173.792,301.792L21.333,454.251v-80.917c0-5.891-4.776-10.667-10.667-10.667C4.776,362.667,0,367.442,0,373.333V480     c0,5.891,4.776,10.667,10.667,10.667h106.667c5.891,0,10.667-4.776,10.667-10.667s-4.776-10.667-10.667-10.667H36.416     l152.459-152.459c4.093-4.237,3.975-10.99-0.262-15.083C184.479,297.799,177.926,297.799,173.792,301.792z" fill="#FFFFFF"/><path d="M480,0H373.333c-5.891,0-10.667,4.776-10.667,10.667c0,5.891,4.776,10.667,10.667,10.667h80.917L301.792,173.792     c-4.237,4.093-4.354,10.845-0.262,15.083c4.093,4.237,10.845,4.354,15.083,0.262c0.089-0.086,0.176-0.173,0.262-0.262     L469.333,36.416v80.917c0,5.891,4.776,10.667,10.667,10.667s10.667-4.776,10.667-10.667V10.667C490.667,4.776,485.891,0,480,0z" fill="#FFFFFF"/><path d="M36.416,21.333h80.917c5.891,0,10.667-4.776,10.667-10.667C128,4.776,123.224,0,117.333,0H10.667     C4.776,0,0,4.776,0,10.667v106.667C0,123.224,4.776,128,10.667,128c5.891,0,10.667-4.776,10.667-10.667V36.416l152.459,152.459     c4.237,4.093,10.99,3.975,15.083-0.262c3.992-4.134,3.992-10.687,0-14.82L36.416,21.333z" fill="#FFFFFF"/><path d="M480,362.667c-5.891,0-10.667,4.776-10.667,10.667v80.917L316.875,301.792c-4.237-4.093-10.99-3.976-15.083,0.261     c-3.993,4.134-3.993,10.688,0,14.821l152.459,152.459h-80.917c-5.891,0-10.667,4.776-10.667,10.667s4.776,10.667,10.667,10.667     H480c5.891,0,10.667-4.776,10.667-10.667V373.333C490.667,367.442,485.891,362.667,480,362.667z" fill="#FFFFFF"/></g></svg>';

    }
    else
    {
        if(fsElement)
        {
            fsElement.style.display="none";
            fsElement.remove();
            fsElement=null;
        }
    }
}


fpsLimit.onChange=function()
{
    op.patch.config.fpsLimit=fpsLimit.get()||0;
};

op.onDelete=function()
{
    cgl.gl.clearColor(0,0,0,0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

    op.patch.removeOnAnimFrame(op);
};


op.patch.loading.setOnFinishedLoading(function(cb)
{
    op.patch.config.fpsLimit=fpsLimit.get();
});



op.onAnimFrame=function(time)
{
    if(!active.get())return;
    if(cgl.aborted || cgl.canvas.clientWidth===0 || cgl.canvas.clientHeight===0)return;

    if(op.patch.loading.getProgress()<1.0 && reduceLoadingFPS.get())
    {
        op.patch.config.fpsLimit=5;
    }

    if(cgl.canvasWidth==-1)
    {
        cgl.setCanvas(op.patch.config.glCanvasId);
        return;
    }

    if(cgl.canvasWidth!=width.get() || cgl.canvasHeight!=height.get())
    {
        // cgl.canvasWidth=cgl.canvas.clientWidth;
        width.set(cgl.canvasWidth);
        // cgl.canvasHeight=cgl.canvas.clientHeight;
        height.set(cgl.canvasHeight);
    }

    if(CABLES.now()-rframeStart>1000)
    {
        CGL.fpsReport=CGL.fpsReport||[];
        if(op.patch.loading.getProgress()>=1.0 && rframeStart!==0)CGL.fpsReport.push(rframes);
        rframes=0;
        rframeStart=CABLES.now();
    }
    CGL.MESH.lastShader=null;
    CGL.MESH.lastMesh=null;

    cgl.renderStart(cgl,identTranslate,identTranslateView);

    if(clear.get())
    {
        cgl.gl.clearColor(0,0,0,1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }

    trigger.trigger();


    if(CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();


    if(CGL.Texture.previewTexture)
    {
        if(!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer=new CGL.Texture.texturePreview(cgl);
        CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
    }
    cgl.renderEnd(cgl);
    
    
    // cgl.printError('mainloop end');
    
    

    if(!cgl.frameStore.phong)cgl.frameStore.phong={};
    rframes++;
};


};

Ops.Gl.MainLoop.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Gl.Meshes.Sphere
// 
// **************************************************************

Ops.Gl.Meshes.Sphere = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
var render=op.addInPort(new Port(op,"render",OP_PORT_TYPE_FUNCTION));
var inStacks=op.inValueInt("stacks",32);
var inSlices=op.inValueInt("slices",32);
var inRadius=op.addInPort(new Port(op,"radius",OP_PORT_TYPE_VALUE));
var inRender=op.inValueBool("Render",true);


var trigger=op.addOutPort(new Port(op,"trigger",OP_PORT_TYPE_FUNCTION));
var geomOut=op.addOutPort(new Port(op,"geometry",OP_PORT_TYPE_OBJECT));

inRadius.set(1);
geomOut.ignoreValueSerialize=true;

var cgl=op.patch.cgl;
var mesh=null;
var geom=null;
var geomVertices=[];
var geomVertexNormals=[];
var geomTexCoords=[];
var geomVerticesIndices=[];


inSlices.onChange=function(){ mesh=null; };
inStacks.onChange=function(){ mesh=null; };
inRadius.onChange=function(){ mesh=null; };

op.preRender=
render.onTriggered=function()
{
    if(!mesh) updateMesh();

    if(inRender.get()) mesh.render(cgl.getShader());
    
    trigger.trigger();
};

function updateMesh()
{
    var nslices=Math.round(inSlices.get());
    var nstacks=Math.round(inStacks.get());
    if(nslices<1)nslices=1;
    if(nstacks<1)nstacks=1;
    var r=inRadius.get();
    
    uvSphere(r, nslices, nstacks);
}

// updateMesh();

function circleTable(n,halfCircle)
{
    var i;
    /* Table size, the sign of n flips the circle direction */
    var size = Math.abs(n);

    /* Determine the angle between samples */
    var angle = (halfCircle?1:2)*Math.PI/n;// ( n === 0 ) ? 1 : n ;

    /* Allocate memory for n samples, plus duplicate of first entry at the end */
    var sint=[];
    var cost=[];

    /* Compute cos and sin around the circle */
    sint[0] = 0.0;
    cost[0] = 1.0;

    for (i=0; i<size; i++)
    {
        sint[i] = Math.sin(angle*i);
        cost[i] = Math.cos(angle*i);
    }
    
    if (halfCircle)
    {
        sint[size] =  0.0;  /* sin PI */
        cost[size] = -1.0;  /* cos PI */
    }
    else
    {
        /* Last sample is duplicate of the first (sin or cos of 2 PI) */
        sint[size] = sint[0];
        cost[size] = cost[0];
    }
    return {cost:cost,sint:sint};
}


// from http://math.hws.edu/graphicsbook/source/webgl/basic-object-models-IFS.js
function uvSphere(radius, slices, stacks)
{
    var geom=new CGL.Geometry("sphere");

    radius = radius || 0.5;
    slices = slices || 32;
    stacks = stacks || 16;
    var vertexCount = (slices+1)*(stacks+1);
    var vertices = new Float32Array( 3*vertexCount );
    var normals = new Float32Array( 3* vertexCount );
    var texCoords = new Float32Array( 2*vertexCount );
    var indices = new Uint16Array( 2*slices*stacks*3 );
    var du = 2*Math.PI/slices;
    var dv = Math.PI/stacks;
    var i,j,u,v,x,y,z;
    var indexV = 0;
    var indexT = 0;
    for (i = 0; i <= stacks; i++)
    {
        v = -Math.PI/2 + i*dv;
        for (j = 0; j <= slices; j++)
        {
            u = j*du;
            x = Math.cos(u)*Math.cos(v);
            y = Math.sin(u)*Math.cos(v);
            z = Math.sin(v);

            vertices[indexV] = radius*x;
            normals[indexV++] = x;

            vertices[indexV] = radius*y;
            normals[indexV++] = y;

            vertices[indexV] = radius*z;
            normals[indexV++] = z;

            texCoords[indexT++] = j/slices;
            texCoords[indexT++] = i/stacks;
        } 
    }
    var k = 0;
    for (j = 0; j < stacks; j++)
    {
        var row1 = j*(slices+1);
        var row2 = (j+1)*(slices+1);
        for (i = 0; i < slices; i++)
        {
            indices[k++] = row1 + i;
            indices[k++] = row2 + i;
            indices[k++] = row2 + i + 1;
         
            indices[k++] = row1 + i;
            indices[k++] = row2 + i + 1;
            indices[k++] = row1 + i + 1;

        }
    }

    geom.vertices=vertices;
    geom.vertexNormals=normals;
    geom.texCoords=texCoords;
    geom.verticesIndices=indices;

    geomOut.set(geom);

    if(!mesh)mesh=new CGL.Mesh(cgl,geom,cgl.gl.TRIANGLE_STRIP);
    mesh.setGeom(geom);

}



};

Ops.Gl.Meshes.Sphere.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Array.RandomArray3x
// 
// **************************************************************

Ops.Array.RandomArray3x = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};

var numValues=op.addInPort(new Port(op, "numValues",OP_PORT_TYPE_VALUE));
var seed=op.addInPort(new Port(op,"random seed"));
var min=op.addInPort(new Port(op,"Min"));
var max=op.addInPort(new Port(op,"Max"));
var closed=op.inValueBool("Last == First");

var values=op.addOutPort(new Port(op, "values",OP_PORT_TYPE_ARRAY));
values.ignoreValueSerialize=true;

numValues.set(100);
min.set(-1);
max.set(1);

closed.onChange=max.onChange=init;
min.onChange=init;
numValues.onChange=init;
seed.onChange=init;
values.onLinkChanged=init;

var arr=[];
init();

function init()
{
    Math.randomSeed=seed.get();

    arr.length=Math.floor(numValues.get()*3) || 300;
    for(var i=0;i<arr.length;i+=3)
    {
        arr[i+0]=Math.seededRandom() * ( max.get() - min.get() ) + min.get() ;
        arr[i+1]=Math.seededRandom() * ( max.get() - min.get() ) + min.get() ;
        arr[i+2]=Math.seededRandom() * ( max.get() - min.get() ) + min.get() ;
    }

    if(closed.get())
    {
        arr[arr.length-3+0]=arr[0];
        arr[arr.length-3+1]=arr[1];
        arr[arr.length-3+2]=arr[2];
    }
    
    values.set(null);
    values.set(arr);
}


};

Ops.Array.RandomArray3x.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Gl.Matrix.OrbitControls
// 
// **************************************************************

Ops.Gl.Matrix.OrbitControls = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
const render=op.addInPort(new Port(op,"render",OP_PORT_TYPE_FUNCTION));
const minDist=op.addInPort(new Port(op,"min distance",OP_PORT_TYPE_VALUE));
const maxDist=op.addInPort(new Port(op,"max distance",OP_PORT_TYPE_VALUE));
const initialAxis=op.addInPort(new Port(op,"initial axis y",OP_PORT_TYPE_VALUE,{display:'range'}));
const initialX=op.addInPort(new Port(op,"initial axis x",OP_PORT_TYPE_VALUE,{display:'range'}));
const initialRadius=op.inValue("initial radius",0);

const mul=op.addInPort(new Port(op,"mul",OP_PORT_TYPE_VALUE));

const smoothness=op.inValueSlider("Smoothness",1.0);
const restricted=op.addInPort(new Port(op,"restricted",OP_PORT_TYPE_VALUE,{display:'bool'}));

const active=op.inValueBool("Active",true);

const inReset=op.inFunctionButton("Reset");

const allowPanning=op.inValueBool("Allow Panning",true);
const allowZooming=op.inValueBool("Allow Zooming",true);
const allowRotation=op.inValueBool("Allow Rotation",true);
const pointerLock=op.inValueBool("Pointerlock",false);

const speedX=op.inValue("Speed X",1);
const speedY=op.inValue("Speed Y",1);

const trigger=op.addOutPort(new Port(op,"trigger",OP_PORT_TYPE_FUNCTION));
const outRadius=op.addOutPort(new Port(op,"radius",OP_PORT_TYPE_VALUE));
const outYDeg=op.addOutPort(new Port(op,"Rot Y",OP_PORT_TYPE_VALUE));
const outXDeg=op.addOutPort(new Port(op,"Rot X",OP_PORT_TYPE_VALUE));

restricted.set(true);
mul.set(1);
minDist.set(0.05);
maxDist.set(99999);

inReset.onTriggered=reset;

var cgl=op.patch.cgl;
var eye=vec3.create();
var vUp=vec3.create();
var vCenter=vec3.create();
var viewMatrix=mat4.create();
var vOffset=vec3.create();

initialAxis.set(0.5);


var mouseDown=false;
var radius=5;
outRadius.set(radius);

var lastMouseX=0,lastMouseY=0;
var percX=0,percY=0;


vec3.set(vCenter, 0,0,0);
vec3.set(vUp, 0,1,0);

var tempEye=vec3.create();
var finalEye=vec3.create();
var tempCenter=vec3.create();
var finalCenter=vec3.create();

var px=0;
var py=0;

var divisor=1;
var element=null;
updateSmoothness();

op.onDelete=unbind;

var doLockPointer=false;

pointerLock.onChange=function()
{
    doLockPointer=pointerLock.get();
    console.log("doLockPointer",doLockPointer);
};

function reset()
{
    px=px%(Math.PI*2);
    py=py%(Math.PI*2);

    percX=(initialX.get()*Math.PI*2);
    percY=(initialAxis.get()-0.5);
    radius=initialRadius.get();
    eye=circlePos( percY );
}

function updateSmoothness()
{
    divisor=smoothness.get()*10+1.0;
}

smoothness.onChange=updateSmoothness;

var initializing=true;

function ip(val,goal)
{
    if(initializing)return goal;
    return val+(goal-val)/divisor;
}

render.onTriggered=function()
{
    cgl.pushViewMatrix();

    px=ip(px,percX);
    py=ip(py,percY);
    
    outYDeg.set( (py+0.5)*180 );
    outXDeg.set( (px)*180 );

    eye=circlePos(py);

    vec3.add(tempEye, eye, vOffset);
    vec3.add(tempCenter, vCenter, vOffset);

    finalEye[0]=ip(finalEye[0],tempEye[0]);
    finalEye[1]=ip(finalEye[1],tempEye[1]);
    finalEye[2]=ip(finalEye[2],tempEye[2]);
    
    finalCenter[0]=ip(finalCenter[0],tempCenter[0]);
    finalCenter[1]=ip(finalCenter[1],tempCenter[1]);
    finalCenter[2]=ip(finalCenter[2],tempCenter[2]);
    
    mat4.lookAt(viewMatrix, finalEye, finalCenter, vUp);
    mat4.rotate(viewMatrix, viewMatrix, px, vUp);
    mat4.multiply(cgl.vMatrix,cgl.vMatrix,viewMatrix);

    trigger.trigger();
    cgl.popViewMatrix();
    initializing=false;
};

function circlePos(perc)
{
    if(radius<minDist.get()*mul.get())radius=minDist.get()*mul.get();
    if(radius>maxDist.get()*mul.get())radius=maxDist.get()*mul.get();
    
    outRadius.set(radius*mul.get());
    
    var i=0,degInRad=0;
    var vec=vec3.create();
    degInRad = 360*perc/2*CGL.DEG2RAD;
    vec3.set(vec,
        Math.cos(degInRad)*radius*mul.get(),
        Math.sin(degInRad)*radius*mul.get(),
        0);
    return vec;
}

function onmousemove(event)
{
    if(!mouseDown) return;

    var x = event.clientX;
    var y = event.clientY;
    
    var movementX=(x-lastMouseX)*speedX.get();
    var movementY=(y-lastMouseY)*speedY.get();

    if(doLockPointer)
    {
        movementX=event.movementX*mul.get();
        movementY=event.movementY*mul.get();
    }

    if(event.which==3 && allowPanning.get())
    {
        vOffset[2]+=movementX*0.01*mul.get();
        vOffset[1]+=movementY*0.01*mul.get();
    }
    else
    if(event.which==2 && allowZooming.get())
    {
        radius+=(movementY)*0.05;
        eye=circlePos(percY);
    }
    else
    {
        if(allowRotation.get())
        {
            percX+=(movementX)*0.003;
            percY+=(movementY)*0.002;
            
            if(restricted.get())
            {
                if(percY>0.5)percY=0.5;
                if(percY<-0.5)percY=-0.5;
            }
            
        }
    }

    lastMouseX=x;
    lastMouseY=y;
}

function onMouseDown(event)
{
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    mouseDown=true;
    
    if(doLockPointer)
    {
        var el=op.patch.cgl.canvas;
        el.requestPointerLock = el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock;
        if(el.requestPointerLock) el.requestPointerLock();
        else console.log("no t found");
        // document.addEventListener("mousemove", onmousemove, false);

        document.addEventListener('pointerlockchange', lockChange, false);
        document.addEventListener('mozpointerlockchange', lockChange, false);
        document.addEventListener('webkitpointerlockchange', lockChange, false);
    }
}

function onMouseUp()
{
    mouseDown=false;
    // cgl.canvas.style.cursor='url(/ui/img/rotate.png),pointer';
            
    if(doLockPointer)
    {
        document.removeEventListener('pointerlockchange', lockChange, false);
        document.removeEventListener('mozpointerlockchange', lockChange, false);
        document.removeEventListener('webkitpointerlockchange', lockChange, false);

        if(document.exitPointerLock) document.exitPointerLock();
        document.removeEventListener("mousemove", onmousemove, false);
    }
}

function lockChange()
{
    var el=op.patch.cgl.canvas;

    if (document.pointerLockElement === el || document.mozPointerLockElement === el || document.webkitPointerLockElement === el)
    {
        document.addEventListener("mousemove", onmousemove, false);
        console.log("listening...");
    }
}

function onMouseEnter(e)
{
    // cgl.canvas.style.cursor='url(/ui/img/rotate.png),pointer';
}

initialRadius.onValueChange(function()
{
    // percX=(initialX.get()*Math.PI*2);
    console.log('init radius');
    radius=initialRadius.get();
    reset();
});

initialX.onValueChange(function()
{
    px=percX=(initialX.get()*Math.PI*2);
    
});

initialAxis.onValueChange(function()
{
    py=percY=(initialAxis.get()-0.5);
    eye=circlePos( percY );
});

var onMouseWheel=function(event)
{
    if(allowZooming.get())
    {
        var delta=CGL.getWheelSpeed(event)*0.06;
        radius+=(parseFloat(delta))*1.2;

        eye=circlePos(percY);
        event.preventDefault();
    }
};

var ontouchstart=function(event)
{
    doLockPointer=false;
    if(event.touches && event.touches.length>0) onMouseDown(event.touches[0]);
};

var ontouchend=function(event)
{
    doLockPointer=false;
    onMouseUp();
};

var ontouchmove=function(event)
{
    doLockPointer=false;
    if(event.touches && event.touches.length>0) onmousemove(event.touches[0]);
};

active.onChange=function()
{
    if(active.get())bind();
        else unbind();
}


this.setElement=function(ele)
{
    unbind();
    element=ele;
    bind();
}

function bind()
{
    element.addEventListener('mousemove', onmousemove);
    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('mouseup', onMouseUp);
    element.addEventListener('mouseleave', onMouseUp);
    element.addEventListener('mouseenter', onMouseEnter);
    element.addEventListener('contextmenu', function(e){e.preventDefault();});
    element.addEventListener('wheel', onMouseWheel);

    element.addEventListener('touchmove', ontouchmove);
    element.addEventListener('touchstart', ontouchstart);
    element.addEventListener('touchend', ontouchend);

}

function unbind()
{
    if(!element)return;
    
    element.removeEventListener('mousemove', onmousemove);
    element.removeEventListener('mousedown', onMouseDown);
    element.removeEventListener('mouseup', onMouseUp);
    element.removeEventListener('mouseleave', onMouseUp);
    element.removeEventListener('mouseenter', onMouseUp);
    element.removeEventListener('wheel', onMouseWheel);

    element.removeEventListener('touchmove', ontouchmove);
    element.removeEventListener('touchstart', ontouchstart);
    element.removeEventListener('touchend', ontouchend);
}



eye=circlePos(0);
this.setElement(cgl.canvas);


bind();

initialX.set(0.25);
initialRadius.set(0.05);


};

Ops.Gl.Matrix.OrbitControls.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Gl.Matrix.Scale
// 
// **************************************************************

Ops.Gl.Matrix.Scale = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
const render=op.addInPort(new Port(op,"render",OP_PORT_TYPE_FUNCTION));
const scale=op.addInPort(new Port(op,"scale"));
const trigger=op.addOutPort(new Port(op,"trigger",OP_PORT_TYPE_FUNCTION));

const cgl=op.patch.cgl;
const vScale=vec3.create();
scale.onChange=scaleChanged;
scale.set(1.0);
scaleChanged();

render.onTriggered=function()
{
    cgl.pushModelMatrix();
    mat4.scale(cgl.mMatrix,cgl.mMatrix, vScale);
    trigger.trigger();
    cgl.popModelMatrix();
};

function scaleChanged()
{
    vec3.set(vScale, scale.get(),scale.get(),scale.get());
};



};

Ops.Gl.Matrix.Scale.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Array.RandomArray
// 
// **************************************************************

Ops.Array.RandomArray = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
const numValues=op.inValueInt("numValues");

const seed=op.addInPort(new Port(op,"random seed"));
const min=op.addInPort(new Port(op,"Min"));
const max=op.addInPort(new Port(op,"Max"));

const values=op.addOutPort(new Port(op, "values",OP_PORT_TYPE_ARRAY));
values.ignoreValueSerialize=true;

numValues.set(100);
min.set(0);
max.set(1);

max.onValueChanged=init;
min.onValueChanged=init;
numValues.onValueChanged=init;
seed.onValueChanged=init;
values.onLinkChanged=init;

var arr=[];
init();

function init()
{
    Math.randomSeed=seed.get();
    
    arr.length=Math.abs(parseInt(numValues.get())) || 100;
    for(var i=0;i<arr.length;i++)
    {
        arr[i]=Math.seededRandom()* ( max.get() - min.get() ) + parseFloat(min.get()) ;
    }
    
    values.set(null);
    values.set(arr);
}


};

Ops.Array.RandomArray.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Exp.Gl.ShaderEffects.AreaScaler
// 
// **************************************************************

Ops.Exp.Gl.ShaderEffects.AreaScaler = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
attachments["areascale_vert"]="\nUNI bool MOD_smooth;\nUNI float MOD_x,MOD_y,MOD_z;\nUNI float MOD_strength;\nUNI float MOD_size;\n\nvec4 MOD_scaler(vec4 pos,vec4 worldPos,vec3 normal)\n{\n    vec3 forcePos=vec3(MOD_x,MOD_y,MOD_z);\n    vec3 vecToOrigin=worldPos.xyz-forcePos;\n    float dist=abs(length(vecToOrigin));\n    float distAlpha = (MOD_size - dist) ;\n\n    if(MOD_smooth) distAlpha=smoothstep(0.0,MOD_size,distAlpha);\n    \n    float m=(distAlpha*MOD_strength);\n    \n    #ifndef MOD_TO_ZERO\n    m+=1.0;\n    #endif\n    \n    pos.xyz*=m;\n\n    return pos;\n}\n";

var cgl=op.patch.cgl;

op.render=op.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
op.trigger=op.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

var inSize=op.inValue("Size",1);
var inStrength=op.inValue("Strength",1);
var inSmooth=op.inValueBool("Smooth",true);
var inToZero=op.inValueBool("Keep Min Size",true);


var x=op.inValue("x");
var y=op.inValue("y");
var z=op.inValue("z");



var shader=null;

var srcHeadVert=attachments.areascale_vert;

var srcBodyVert=''
    .endl()+'pos=MOD_scaler(pos,mMatrix*pos,attrVertNormal);' //modelMatrix*
    .endl();
    
var moduleVert=null;

function removeModule()
{
    if(shader && moduleVert) shader.removeModule(moduleVert);
    shader=null;
}

inToZero.onChange=updateToZero;

function updateToZero()
{
    if(!shader)return;
    if(inToZero.get()) shader.removeDefine(moduleVert.prefix+"TO_ZERO");
        else shader.define(moduleVert.prefix+"TO_ZERO");

}




op.render.onLinkChanged=removeModule;

op.render.onTriggered=function()
{
    if(!cgl.getShader())
    {
         op.trigger.trigger();
         return;
    }
    
    if(CABLES.UI && gui.patch().isCurrentOp(op)) 
        gui.setTransformGizmo(
            {
                posX:x,
                posY:y,
                posZ:z
            });

    if(cgl.getShader()!=shader)
    {
        if(shader) removeModule();
        shader=cgl.getShader();

        moduleVert=shader.addModule(
            {
                title:op.objName,
                name:'MODULE_VERTEX_POSITION',
                srcHeadVert:srcHeadVert,
                srcBodyVert:srcBodyVert
            });

        inSize.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'size',inSize);
        inStrength.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'strength',inStrength);
        inSmooth.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'smooth',inSmooth);

        x.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'x',x);
        y.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'y',y);
        z.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'z',z);
    }
    
    
    if(!shader)return;

    op.trigger.trigger();
};


};

Ops.Exp.Gl.ShaderEffects.AreaScaler.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Gl.MeshInstancer
// 
// **************************************************************

Ops.Gl.MeshInstancer = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
// TODO: remove array3xtransformedinstanced....

var exe=op.addInPort(new Port(op,"exe",OP_PORT_TYPE_FUNCTION));

var inTransformations=op.inArray("positions");
var inScales=op.inArray("Scale Array");
var inScale=op.inValue("Scale",1);
var geom=op.inObject("geom");
geom.ignoreValueSerialize=true;

var mod=null;
var mesh=null;
var shader=null;
var uniDoInstancing=null;
var recalc=true;
var cgl=op.patch.cgl;

exe.onTriggered=doRender;
exe.onLinkChanged=removeModule;

var matrixArray= new Float32Array(1);
var m=mat4.create();
inTransformations.onChange=reset;
inScales.onChange=reset;


var srcHeadVert=''
    .endl()+'UNI float do_instancing;'
    .endl()+'UNI float MOD_scale;'
    
    .endl()+'#ifdef INSTANCING'
    .endl()+'   IN mat4 instMat;'
    .endl()+'   OUT mat4 instModelMat;'
    .endl()+'#endif';

var srcBodyVert=''
    .endl()+'#ifdef INSTANCING'
    .endl()+'   if(do_instancing==1.0)'
    .endl()+'   {'
    .endl()+'       mMatrix*=instMat;'
    .endl()+'       mMatrix[0][0]*=MOD_scale;'
    .endl()+'       mMatrix[1][1]*=MOD_scale;'
    .endl()+'       mMatrix[2][2]*=MOD_scale;'
    .endl()+'   }'
    .endl()+'#endif'
    .endl();



geom.onChange=function()
{
    if(!geom.get())
    {
        mesh=null;
        return;
    }
    mesh=new CGL.Mesh(cgl,geom.get());
    reset();
};

function removeModule()
{
    if(shader && mod)
    {
        shader.removeDefine('INSTANCING');
        shader.removeModule(mod);
        shader=null;
    }
}

function reset()
{
    recalc=true;
}

function setupArray()
{
    if(!mesh)return;
    
    var transforms=inTransformations.get();
    if(!transforms)
    {
        transforms=[0,0,0];
    }
    var num=Math.floor(transforms.length/3);
    
    
    var scales=inScales.get();
    // console.log('scales',scales);
    // console.log('setup array!');

    if(matrixArray.length!=num*16)
    {
        matrixArray=new Float32Array(num*16);
    }

    for(var i=0;i<num;i++)
    {
        mat4.identity(m);
        mat4.translate(m,m,
            [
                transforms[i*3],
                transforms[i*3+1],
                transforms[i*3+2]
            ]);
        
        if(scales && scales.length>i)
        {
            mat4.scale(m,m,[scales[i],scales[i],scales[i]]);
            // console.log('scale',scales[i]);
        }
        else
        {
            mat4.scale(m,m,[1,1,1]);
        }

        for(var a=0;a<16;a++)
        {
            matrixArray[i*16+a]=m[a];
        }
    }

    mesh.numInstances=num;
    mesh.addAttribute('instMat',matrixArray,16);
    recalc=false;
}

function doRender()
{
    if(recalc)setupArray();
    if(matrixArray.length<=1)return;
    if(!mesh) return;

    if(cgl.getShader() && cgl.getShader()!=shader)
    {
        if(shader && mod)
        {
            shader.removeModule(mod);
            shader=null;
        }

        shader=cgl.getShader();
        if(!shader.hasDefine('INSTANCING'))
        {
            mod=shader.addModule(
                {
                    name: 'MODULE_VERTEX_POSITION',
                    priority:-2,
                    srcHeadVert: srcHeadVert,
                    srcBodyVert: srcBodyVert
                });

            shader.define('INSTANCING');
            uniDoInstancing=new CGL.Uniform(shader,'f','do_instancing',0);
            inScale.uniform=new CGL.Uniform(shader,'f',mod.prefix+'scale',inScale);
        }
        else
        {
            uniDoInstancing=shader.getUniform('do_instancing');
        }
    }

    uniDoInstancing.setValue(1);
    mesh.render(shader);
    uniDoInstancing.setValue(0);


}


};

Ops.Gl.MeshInstancer.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Gl.ShaderEffects.MeshPixelNoise
// 
// **************************************************************

Ops.Gl.ShaderEffects.MeshPixelNoise = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
attachments["pixelnoise_frag"]="IN vec4 MOD_pos;\n\nfloat MOD_mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}\nvec4 MOD_mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}\nvec4 MOD_perm(vec4 x){return MOD_mod289(((x * 34.0) + 1.0) * x);}\n\nfloat MOD_meshPixelNoise(vec3 p){\n    vec3 a = floor(p);\n    vec3 d = p - a;\n    d = d * d * (3.0 - 2.0 * d);\n\n    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);\n    vec4 k1 = MOD_perm(b.xyxy);\n    vec4 k2 = MOD_perm(k1.xyxy + b.zzww);\n\n    vec4 c = k2 + a.zzzz;\n    vec4 k3 = MOD_perm(c);\n    vec4 k4 = MOD_perm(c + 1.0);\n\n    vec4 o1 = fract(k3 * (1.0 / 41.0));\n    vec4 o2 = fract(k4 * (1.0 / 41.0));\n\n    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);\n    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);\n\n    return o4.y * d.y + o4.x * (1.0 - d.y);\n}\n";

var cgl=op.patch.cgl;
var id='mod'+Math.floor(Math.random()*10000);

op.render=op.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
op.trigger=op.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

var inScale=op.inValue("Scale",10);
var inAmount=op.inValueSlider("Amount",0.3);
var inWorldSpace=op.inValueBool("WorldSpace");


var shader=null;

var srcHeadVert=''
    .endl()+'OUT vec4 MOD_pos;'
    .endl();

var srcBodyVert=''
    .endl()+'#ifndef WORLDSPACE'
    .endl()+'   MOD_pos=pos;'
    .endl()+'#endif'
    .endl()+'#ifdef WORLDSPACE'
    .endl()+'   MOD_pos=pos*mMatrix;'
    .endl()+'#endif'
    .endl();

var srcHeadFrag=attachments.pixelnoise_frag
    .endl()+'UNI float MOD_scale;'
    .endl()+'UNI float MOD_amount;'
    .endl();

var srcBodyFrag=''
    .endl()+'   col.rgb -= MOD_meshPixelNoise(MOD_pos.xyz*MOD_scale)*MOD_amount/4.0;'

    .endl();


var moduleFrag=null;
var moduleVert=null;

inWorldSpace.onChange=updateWorldspace;
function updateWorldspace()
{
    if(!shader)return;
    if(inWorldSpace.get()) shader.define("WORLDSPACE");
        else shader.removeDefine("WORLDSPACE");
}


function removeModule()
{
    if(shader && moduleFrag) shader.removeModule(moduleFrag);
    if(shader && moduleVert) shader.removeModule(moduleVert);
    shader=null;
}

op.render.onLinkChanged=removeModule;

op.render.onTriggered=function()
{
    if(!cgl.getShader())
    {
         op.trigger.trigger();
         return;
    }

    if(cgl.getShader()!=shader)
    {
        if(shader) removeModule();
        shader=cgl.getShader();

        moduleVert=shader.addModule(
            {
                title:op.objName,
                name:'MODULE_VERTEX_POSITION',
                srcHeadVert:srcHeadVert,
                srcBodyVert:srcBodyVert
            });

        moduleFrag=shader.addModule(
            {
                title:op.objName,
                name:'MODULE_COLOR',
                srcHeadFrag:srcHeadFrag,
                srcBodyFrag:srcBodyFrag
            },moduleVert);

        inScale.scale=new CGL.Uniform(shader,'f',moduleFrag.prefix+'scale',inScale);
        inAmount.amount=new CGL.Uniform(shader,'f',moduleFrag.prefix+'amount',inAmount);
        updateWorldspace();
    }

    if(!shader)return;

    op.trigger.trigger();
};


};

Ops.Gl.ShaderEffects.MeshPixelNoise.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Gl.Matrix.Transform
// 
// **************************************************************

Ops.Gl.Matrix.Transform = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
const render=op.addInPort(new Port(op,"render",OP_PORT_TYPE_FUNCTION));
const trigger=op.addOutPort(new Port(op,"trigger",OP_PORT_TYPE_FUNCTION));


const posX=op.addInPort(new Port(op,"posX"),0);
const posY=op.addInPort(new Port(op,"posY"),0);
const posZ=op.addInPort(new Port(op,"posZ"),0);

const scale=op.addInPort(new Port(op,"scale"));

const rotX=op.addInPort(new Port(op,"rotX"));
const rotY=op.addInPort(new Port(op,"rotY"));
const rotZ=op.addInPort(new Port(op,"rotZ"));

op.setPortGroup([rotX,rotY,rotZ]);
op.setPortGroup([posX,posY,posZ]);


var cgl=op.patch.cgl;
var vPos=vec3.create();
var vScale=vec3.create();
var transMatrix = mat4.create();
mat4.identity(transMatrix);

var doScale=false;
var doTranslate=false;

var translationChanged=true;
var scaleChanged=true;
var rotChanged=true;

scale.setUiAttribs({"divider":true});

render.onTriggered=function()
{
    var updateMatrix=false;
    if(translationChanged)
    {
        updateTranslation();
        updateMatrix=true;
    }
    if(scaleChanged)
    {
        updateScale();
        updateMatrix=true;
    }
    if(rotChanged)
    {
        updateMatrix=true;
    }
    if(updateMatrix)doUpdateMatrix();

    cgl.pushModelMatrix();
    mat4.multiply(cgl.mMatrix,cgl.mMatrix,transMatrix);

    trigger.trigger();
    cgl.popModelMatrix();
    
    if(CABLES.UI && gui.patch().isCurrentOp(op)) 
        gui.setTransformGizmo(
            {
                posX:posX,
                posY:posY,
                posZ:posZ,
            });

    
};

op.transform3d=function()
{
    return {
            pos:[posX,posY,posZ]
        };
    
};

var doUpdateMatrix=function()
{
    mat4.identity(transMatrix);
    if(doTranslate)mat4.translate(transMatrix,transMatrix, vPos);

    if(rotX.get()!==0)mat4.rotateX(transMatrix,transMatrix, rotX.get()*CGL.DEG2RAD);
    if(rotY.get()!==0)mat4.rotateY(transMatrix,transMatrix, rotY.get()*CGL.DEG2RAD);
    if(rotZ.get()!==0)mat4.rotateZ(transMatrix,transMatrix, rotZ.get()*CGL.DEG2RAD);

    if(doScale)mat4.scale(transMatrix,transMatrix, vScale);
    rotChanged=false;
};

function updateTranslation()
{
    doTranslate=false;
    if(posX.get()!==0.0 || posY.get()!==0.0 || posZ.get()!==0.0) doTranslate=true;
    vec3.set(vPos, posX.get(),posY.get(),posZ.get());
    translationChanged=false;
}

function updateScale()
{
    doScale=false;
    if(scale.get()!==0.0)doScale=true;
    vec3.set(vScale, scale.get(),scale.get(),scale.get());
    scaleChanged=false;
}

var translateChanged=function()
{
    translationChanged=true;
};

var scaleChanged=function()
{
    scaleChanged=true;
};

var rotChanged=function()
{
    rotChanged=true;
};


rotX.onChange=rotChanged;
rotY.onChange=rotChanged;
rotZ.onChange=rotChanged;

scale.onChange=scaleChanged;

posX.onChange=translateChanged;
posY.onChange=translateChanged;
posZ.onChange=translateChanged;

rotX.set(0.0);
rotY.set(0.0);
rotZ.set(0.0);

scale.set(1.0);

posX.set(0.0);
posY.set(0.0);
posZ.set(0.0);

doUpdateMatrix();



};

Ops.Gl.Matrix.Transform.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Anim.Timer
// 
// **************************************************************

Ops.Anim.Timer = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
var playPause=op.inValueBool("Play",true);
var reset=op.inFunctionButton("Reset");
var outTime=op.outValue("Time");
var inSpeed=op.inValue("Speed",1);

var timer=new CABLES.Timer();

playPause.onChange=setState;
setState();

function setState()
{
    if(playPause.get())
    {
        timer.play();
        op.patch.addOnAnimFrame(op);
    }
    else
    {
        timer.pause();
        op.patch.removeOnAnimFrame(op);
    }
}

reset.onTriggered=function()
{
    timer.setTime(0);
    outTime.set(0);
};

op.onAnimFrame=function()
{
    timer.update();
    outTime.set(timer.get()*inSpeed.get());

};


};

Ops.Anim.Timer.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Anim.SineAnim
// 
// **************************************************************

Ops.Anim.SineAnim = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
var exe=op.addInPort(new Port(op,"exe",OP_PORT_TYPE_FUNCTION));
var result=op.addOutPort(new Port(op,"result"));

var phase=op.addInPort(new Port(op,"phase",OP_PORT_TYPE_VALUE));
var mul=op.addInPort(new Port(op,"frequency",OP_PORT_TYPE_VALUE));
var amplitude=op.addInPort(new Port(op,"amplitude",OP_PORT_TYPE_VALUE));

mul.set(1.0);
amplitude.set(1.0);
phase.set(1);
exe.onTriggered=exec;
exec();

function exec()
{
    result.set( amplitude.get() * Math.sin( (op.patch.freeTimer.get()*mul.get()) + phase.get() ));
}



};

Ops.Anim.SineAnim.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Exp.Gl.MatCapMaterialNew
// 
// **************************************************************

Ops.Exp.Gl.MatCapMaterialNew = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
attachments["matcap_frag"]="\n{{MODULES_HEAD}}\n\nIN vec3 norm;\nIN vec2 texCoord;\nUNI sampler2D tex;\nIN vec2 vNorm;\nUNI mat4 viewMatrix;\n\nUNI float repeatX;\nUNI float repeatY;\nUNI float opacity;\n\nUNI float r;\nUNI float g;\nUNI float b;\n\nIN vec3 e;\n\n#ifdef HAS_DIFFUSE_TEXTURE\n   UNI sampler2D texDiffuse;\n#endif\n\n#ifdef USE_SPECULAR_TEXTURE\n   UNI sampler2D texSpec;\n   UNI sampler2D texSpecMatCap;\n#endif\n\n#ifdef HAS_AO_TEXTURE\n    UNI sampler2D texAo;\n    UNI float aoIntensity;\n#endif\n\n#ifdef HAS_NORMAL_TEXTURE\n   IN vec3 vBiTangent;\n   IN vec3 vTangent;\n\n   UNI sampler2D texNormal;\n   UNI mat4 normalMatrix;\n   \n   vec2 vNormt;\n#endif\n\n#ifdef CALC_SSNORMALS\n    // from https://www.enkisoftware.com/devlogpost-20150131-1-Normal_generation_in_the_pixel_shader\n    IN vec3 eye_relative_pos;\n#endif\n\n\nconst float normalScale=0.4;\n\nvoid main()\n{\n    vec2 vnOrig=vNorm;\n    vec2 vn=vNorm;\n\n\n\n    #ifdef HAS_TEXTURES\n        vec2 texCoords=texCoord;\n        {{MODULE_BEGIN_FRAG}}\n    #endif\n\n    #ifdef CALC_SSNORMALS\n    \tvec3 dFdxPos = dFdx( eye_relative_pos );\n    \tvec3 dFdyPos = dFdy( eye_relative_pos );\n    \tvec3 ssn = normalize( cross(dFdxPos,dFdyPos ));\n    \t\n        vec3 rr = reflect( e, ssn );\n        float ssm = 2. * sqrt( \n            pow(rr.x, 2.0)+\n            pow(rr.y, 2.0)+\n            pow(rr.z + 1.0, 2.0)\n        );\n        \n        \n\n        \n        vn = (rr.xy / ssm + 0.5);\n        \n        vn.t=clamp(vn.t, 0.0, 1.0);\n        vn.s=clamp(vn.s, 0.0, 1.0);\n        \n        // float dst = dot(abs(coord-center), vec2(1.0));\n        // float aaf = fwidth(dst);\n        // float alpha = smoothstep(radius - aaf, radius, dst);\n\n    #endif\n\n   #ifdef HAS_NORMAL_TEXTURE\n        vec3 tnorm=texture2D( texNormal, vec2(texCoord.x*repeatX,texCoord.y*repeatY) ).xyz * 2.0 - 1.0;\n        \n        tnorm = normalize(tnorm*normalScale);\n        \n        vec3 tangent;\n        vec3 binormal;\n        \n        #ifdef CALC_TANGENT\n            vec3 c1 = cross(norm, vec3(0.0, 0.0, 1.0));\n//            vec3 c2 = cross(norm, vec3(0.0, 1.0, 0.0));\n//            if(length(c1)>length(c2)) tangent = c2;\n//                else tangent = c1;\n            tangent = c1;\n            tangent = normalize(tangent);\n            binormal = cross(norm, tangent);\n            binormal = normalize(binormal);\n        #endif\n\n        #ifndef CALC_TANGENT\n            tangent=normalize(vTangent);\n//            tangent.y*=-13.0;\n//            binormal=vBiTangent*norm;\n//            binormal.z*=-1.0;\n//            binormal=normalize(binormal);\n            binormal=normalize( cross( normalize(norm), normalize(vBiTangent) ));\n        // vBinormal = normalize( cross( vNormal, vTangent ) * tangent.w );\n\n        #endif\n\n        tnorm=normalize(tangent*tnorm.x + binormal*tnorm.y + norm*tnorm.z);\n\n        vec3 n = normalize( mat3(normalMatrix) * (norm+tnorm*normalScale) );\n\n        vec3 re = reflect( e, n );\n        float m = 2. * sqrt( \n            pow(re.x, 2.0)+\n            pow(re.y, 2.0)+\n            pow(re.z + 1.0, 2.0)\n        );\n        \n        vn = (re.xy / m + 0.5);\n        \n    #endif\n\n    vn.t=clamp(vn.t, 0.0, 1.0);\n    vn.s=clamp(vn.s, 0.0, 1.0);\n    vec4 col = texture2D( tex, vn );\n\n    #ifdef HAS_DIFFUSE_TEXTURE\n        col = col*texture2D( texDiffuse, vec2(texCoords.x*repeatX,texCoords.y*repeatY));\n    #endif\n\n    col.r*=r;\n    col.g*=g;\n    col.b*=b;\n\n\n    #ifdef HAS_AO_TEXTURE\n        col = col*\n            mix(\n                vec4(1.0,1.0,1.0,1.0),\n                texture2D( texAo, vec2(texCoords.x*repeatX,texCoords.y*repeatY)),\n                aoIntensity\n                );\n    #endif\n\n    #ifdef USE_SPECULAR_TEXTURE\n        vec4 spec = texture2D( texSpecMatCap, vn );\n        spec*= texture2D( texSpec, vec2(texCoords.x*repeatX,texCoords.y*repeatY) );\n        col+=spec;\n    #endif\n\n    col.a*=opacity;\n\n    {{MODULE_COLOR}}\n\n    outColor = col;\n\n}";
attachments["matcap_vert"]="\nIN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\nIN float attrVertIndex;\n\n#ifdef HAS_NORMAL_TEXTURE\n   IN vec3 attrTangent;\n   IN vec3 attrBiTangent;\n\n   OUT vec3 vBiTangent;\n   OUT vec3 vTangent;\n#endif\n\nOUT vec2 texCoord;\nOUT vec3 norm;\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\n#ifndef INSTANCING\n    UNI mat4 normalMatrix;\n#endif\nOUT vec2 vNorm;\n\nOUT vec3 e;\n\n{{MODULES_HEAD}}\n\n#ifdef CALC_SSNORMALS\n    // from https://www.enkisoftware.com/devlogpost-20150131-1-Normal_generation_in_the_pixel_shader\n    OUT vec3 eye_relative_pos;\n    UNI vec3 camPos;\n#endif\n\n\n\nvoid main()\n{\n    texCoord=attrTexCoord;\n    norm=attrVertNormal;\n    mat4 mMatrix=modelMatrix;\n    mat4 mvMatrix;\n    \n    #ifdef HAS_NORMAL_TEXTURE\n        vTangent=attrTangent;\n        vBiTangent=attrBiTangent;\n    #endif\n\n    vec4 pos = vec4( vPosition, 1. );\n\n    {{MODULE_VERTEX_POSITION}}\n\n\n    mvMatrix= viewMatrix * mMatrix;\n\n    #ifdef INSTANCING\n        mat4 normalMatrix=inverse(transpose(mvMatrix));\n    #endif\n    \n    e = normalize( vec3( mvMatrix * pos ) );\n    vec3 n = normalize( mat3(normalMatrix) * norm );\n\n    // mat3 nMatrix = transpose(inverse(mat3(mMatrix)));\n    // vec3 n = normalize( mat3(nMatrix) * norm );\n    // norm=n;\n\n    vec3 r = reflect( e, n );\n    float m = 2. * sqrt(\n        pow(r.x, 2.0)+\n        pow(r.y, 2.0)+\n        pow(r.z + 1.0, 2.0)\n    );\n    vNorm = r.xy / m + 0.5;\n\n    #ifdef DO_PROJECT_COORDS_XY\n       texCoord=(projMatrix * mvMatrix*pos).xy*0.1;\n    #endif\n\n    #ifdef DO_PROJECT_COORDS_YZ\n       texCoord=(projMatrix * mvMatrix*pos).yz*0.1;\n    #endif\n\n    #ifdef DO_PROJECT_COORDS_XZ\n        texCoord=(projMatrix * mvMatrix*pos).xz*0.1;\n    #endif\n\n    #ifdef CALC_SSNORMALS\n        eye_relative_pos = (mvMatrix * pos ).xyz - camPos;\n    #endif\n\n\n\n   gl_Position = projMatrix * mvMatrix * pos;\n\n}";


var render=op.addInPort(new Port(op,"render",OP_PORT_TYPE_FUNCTION));
var textureMatcap=op.inTexture('MatCap');
var textureDiffuse=op.inTexture('Diffuse');
var textureNormal=op.inTexture('Normal');
var textureSpec=op.inTexture('Specular');
var textureSpecMatCap=op.inTexture('Specular MatCap');
var textureAo=op.inTexture('AO Texture');

var cgl=op.patch.cgl;

{
    // rgba colors
    var r=op.addInPort(new Port(op,"r",OP_PORT_TYPE_VALUE,{ display:'range',colorPick:'true' })); r.set(1);
    var g=op.inValueSlider('g',1);
    var b=op.inValueSlider('b',1);
}

var aoIntensity=op.inValueSlider("AO Intensity",1.0);
var repeatX=op.inValue("Repeat X",1);
var repeatY=op.inValue("Repeat Y",1);
var pOpacity=op.inValueSlider("Opacity",1);
var calcTangents = op.inValueBool("calc normal tangents",true);
var projectCoords=op.inValueSelect('projectCoords',['no','xy','yz','xz'],'no');
var ssNormals=op.inValueBool("Screen Space Normals");

var next=op.addOutPort(new Port(op,"trigger",OP_PORT_TYPE_FUNCTION));
var shaderOut=op.outObject("Shader");



var shader=new CGL.Shader(cgl,'MatCapMaterialNew');

var uniOpacity=new CGL.Uniform(shader,'f','opacity',pOpacity);

shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
shader.bindTextures=bindTextures;
shader.setSource(attachments.matcap_vert,attachments.matcap_frag);
shaderOut.set(shader);

var textureMatcapUniform=null;
var textureDiffuseUniform=null;
var textureNormalUniform=null;
var textureSpecUniform=null;
var textureSpecMatCapUniform=null;
var textureAoUniform=null;
var repeatXUniform=new CGL.Uniform(shader,'f','repeatX',repeatX);
var repeatYUniform=new CGL.Uniform(shader,'f','repeatY',repeatY);
var aoIntensityUniform=new CGL.Uniform(shader,'f','aoIntensity',aoIntensity);
b.uniform=new CGL.Uniform(shader,'f','b',b);
g.uniform=new CGL.Uniform(shader,'f','g',g);
r.uniform=new CGL.Uniform(shader,'f','r',r);



calcTangents.onChange=updateCalcTangent;
updateCalcTangent();
updateMatcap();

function updateCalcTangent()
{
    if(calcTangents.get()) shader.define('CALC_TANGENT');
        else shader.removeDefine('CALC_TANGENT');
}

ssNormals.onChange=function()
{
    if(ssNormals.get())
    {
        if(cgl.glVersion<2)
        {
            cgl.gl.getExtension('OES_standard_derivatives');
            shader.enableExtension('GL_OES_standard_derivatives');
        }

        shader.define('CALC_SSNORMALS');
    }
    else shader.removeDefine('CALC_SSNORMALS');
};

projectCoords.onChange=function()
{
    shader.removeDefine('DO_PROJECT_COORDS_XY');
    shader.removeDefine('DO_PROJECT_COORDS_YZ');
    shader.removeDefine('DO_PROJECT_COORDS_XZ');

    if(projectCoords.get()=='xy') shader.define('DO_PROJECT_COORDS_XY');
    else if(projectCoords.get()=='yz') shader.define('DO_PROJECT_COORDS_YZ');
    else if(projectCoords.get()=='xz') shader.define('DO_PROJECT_COORDS_XZ');
};

textureMatcap.onChange=updateMatcap;

function updateMatcap()
{
    if(textureMatcap.get())
    {
        if(textureMatcapUniform!==null)return;
        shader.removeUniform('tex');
        textureMatcapUniform=new CGL.Uniform(shader,'t','tex',0);
    }
    else
    {
        if(!CGL.defaultTextureMap)
        {
            var pixels=new Uint8Array(256*4);
            for(var x=0;x<16;x++)
            {
                for(var y=0;y<16;y++)
                {
                    var c=y*16;
                    c*=Math.min(1,(x+y/3)/8);
                    pixels[(x+y*16)*4+0]=pixels[(x+y*16)*4+1]=pixels[(x+y*16)*4+2]=c;
                    pixels[(x+y*16)*4+3]=255;
                }
            }

            CGL.defaultTextureMap=new CGL.Texture(cgl);
            CGL.defaultTextureMap.initFromData(pixels,16,16);
        }
        textureMatcap.set(CGL.defaultTextureMap);

        shader.removeUniform('tex');
        textureMatcapUniform=new CGL.Uniform(shader,'t','tex',0);
    }
}

textureDiffuse.onChange=function()
{
    if(textureDiffuse.get())
    {
        if(textureDiffuseUniform!==null)return;
        shader.define('HAS_DIFFUSE_TEXTURE');
        shader.removeUniform('texDiffuse');
        textureDiffuseUniform=new CGL.Uniform(shader,'t','texDiffuse',1);
    }
    else
    {
        shader.removeDefine('HAS_DIFFUSE_TEXTURE');
        shader.removeUniform('texDiffuse');
        textureDiffuseUniform=null;
    }
};

textureNormal.onChange=function()
{
    if(textureNormal.get())
    {
        if(textureNormalUniform!==null)return;
        shader.define('HAS_NORMAL_TEXTURE');
        shader.removeUniform('texNormal');
        textureNormalUniform=new CGL.Uniform(shader,'t','texNormal',2);
    }
    else
    {
        shader.removeDefine('HAS_NORMAL_TEXTURE');
        shader.removeUniform('texNormal');
        textureNormalUniform=null;
    }
};

textureAo.onChange=function()
{
    if(textureAo.get())
    {
        if(textureAoUniform!==null)return;
        shader.define('HAS_AO_TEXTURE');
        shader.removeUniform('texAo');
        textureAoUniform=new CGL.Uniform(shader,'t','texAo',5);
    }
    else
    {
        shader.removeDefine('HAS_AO_TEXTURE');
        shader.removeUniform('texAo');
        textureAoUniform=null;
    }
};

textureSpec.onChange=textureSpecMatCap.onChange=function()
{
    if(textureSpec.get() && textureSpecMatCap.get())
    {
        if(textureSpecUniform!==null)return;
        shader.define('USE_SPECULAR_TEXTURE');
        shader.removeUniform('texSpec');
        shader.removeUniform('texSpecMatCap');
        textureSpecUniform=new CGL.Uniform(shader,'t','texSpec',3);
        textureSpecMatCapUniform=new CGL.Uniform(shader,'t','texSpecMatCap',4);
    }
    else
    {
        shader.removeDefine('USE_SPECULAR_TEXTURE');
        shader.removeUniform('texSpec');
        shader.removeUniform('texSpecMatCap');
        textureSpecUniform=null;
        textureSpecMatCapUniform=null;
    }
};

function bindTextures()
{
    if(textureMatcap.get())     cgl.setTexture(0,textureMatcap.get().tex);
    if(textureDiffuse.get())    cgl.setTexture(1,textureDiffuse.get().tex);
    if(textureNormal.get())     cgl.setTexture(2,textureNormal.get().tex);
    if(textureSpec.get())       cgl.setTexture(3,textureSpec.get().tex);
    if(textureSpecMatCap.get()) cgl.setTexture(4,textureSpecMatCap.get().tex);
    if(textureAo.get())         cgl.setTexture(5,textureAo.get().tex);
};


op.onDelete=function()
{
    if(CGL.defaultTextureMap)
    {
        CGL.defaultTextureMap.delete();
        CGL.defaultTextureMap=null;
    }
};

op.preRender=function()
{
    shader.bind();
};

render.onTriggered=function()
{
    shader.bindTextures=bindTextures;
    cgl.setShader(shader);
    next.trigger();
    cgl.setPreviousShader();
};



};

Ops.Exp.Gl.MatCapMaterialNew.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Gl.Texture
// 
// **************************************************************

Ops.Gl.Texture = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
var filename=op.addInPort(new Port(op,"file",OP_PORT_TYPE_VALUE,{ display:'file',type:'string',filter:'image' } ));
var tfilter=op.inValueSelect("filter",['nearest','linear','mipmap']);
var wrap=op.inValueSelect("wrap",['repeat','mirrored repeat','clamp to edge'],"clamp to edge");
var flip=op.addInPort(new Port(op,"flip",OP_PORT_TYPE_VALUE,{display:'bool'}));
var unpackAlpha=op.addInPort(new Port(op,"unpackPreMultipliedAlpha",OP_PORT_TYPE_VALUE,{display:'bool'}));


var textureOut=op.outTexture("texture");
var width=op.addOutPort(new Port(op,"width",OP_PORT_TYPE_VALUE));
var height=op.addOutPort(new Port(op,"height",OP_PORT_TYPE_VALUE));
var loading=op.addOutPort(new Port(op,"loading",OP_PORT_TYPE_VALUE));
var ratio=op.outValue("Aspect Ratio");

flip.set(false);
unpackAlpha.set(false);
unpackAlpha.hidePort();

var cgl=op.patch.cgl;
var cgl_filter=0;
var cgl_wrap=0;

flip.onChange=function(){reload();};
filename.onChange=reload;

tfilter.onChange=onFilterChange;
wrap.onChange=onWrapChange;
unpackAlpha.onChange=function(){ reload(); };

var timedLoader=0;

var setTempTexture=function()
{
    var t=CGL.Texture.getTempTexture(cgl);
    textureOut.set(t);
};

var loadingId=null;

function reload(nocache)
{
    if(!loadingId)loadingId=cgl.patch.loading.start('texture',filename.get());
    clearTimeout(timedLoader);
    timedLoader=setTimeout(function()
    {
        realReload(nocache);
    },30);
}

function realReload(nocache)
{
    if(!loadingId)loadingId=cgl.patch.loading.start('texture',filename.get());
    
    var url=op.patch.getFilePath(String(filename.get()));
    if(nocache)url+='?rnd='+CABLES.generateUUID();

    if((filename.get() && filename.get().length>1))
    {
        loading.set(true);

        var tex=CGL.Texture.load(cgl,url,
            function(err)
            {
                // console.log('tex loaded!!');

                if(err)
                {
                    setTempTexture();
                    op.uiAttr({'error':'could not load texture "'+filename.get()+'"'});
                    cgl.patch.loading.finished(loadingId);
                    return;
                }
                else op.uiAttr({'error':null});
                textureOut.set(tex);
                width.set(tex.width);
                height.set(tex.height);
                ratio.set(tex.width/tex.height);

                if(!tex.isPowerOfTwo()) op.uiAttr(
                    {
                        hint:'texture dimensions not power of two! - texture filtering will not work.',
                        warning:null
                    });
                    else op.uiAttr(
                        {
                            hint:null,
                            warning:null
                        });

                textureOut.set(null);
                textureOut.set(tex);
                cgl.patch.loading.finished(loadingId);
                
                // tex.printInfo();

            },{
                wrap:cgl_wrap,
                flip:flip.get(),
                unpackAlpha:unpackAlpha.get(),
                filter:cgl_filter
            });

        textureOut.set(null);
        textureOut.set(tex);

        if(!textureOut.get() && nocache)
        {
        }
        loading.set(false);
        cgl.patch.loading.finished(loadingId);
    }
    else
    {
        cgl.patch.loading.finished(loadingId);
        setTempTexture();
    }
}


function onFilterChange()
{
    if(tfilter.get()=='nearest') cgl_filter=CGL.Texture.FILTER_NEAREST;
    if(tfilter.get()=='linear') cgl_filter=CGL.Texture.FILTER_LINEAR;
    if(tfilter.get()=='mipmap') cgl_filter=CGL.Texture.FILTER_MIPMAP;

    reload();
}

function onWrapChange()
{
    if(wrap.get()=='repeat') cgl_wrap=CGL.Texture.WRAP_REPEAT;
    if(wrap.get()=='mirrored repeat') cgl_wrap=CGL.Texture.WRAP_MIRRORED_REPEAT;
    if(wrap.get()=='clamp to edge') cgl_wrap=CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reload();
}

op.onFileUploaded=function(fn)
{
    if(filename.get() && filename.get().indexOf(fn)>-1)
    {
        textureOut.set(null);
        textureOut.set(CGL.Texture.getTempTexture(cgl));

        realReload(true);
    }
};




tfilter.set('linear');
wrap.set('repeat');


textureOut.set(CGL.Texture.getEmptyTexture(cgl));



};

Ops.Gl.Texture.prototype = new CABLES.Op();

//----------------

