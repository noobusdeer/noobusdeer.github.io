"use strict";

var Ops=Ops || {};
Ops.Gl=Ops.Gl || {};
Ops.Anim=Ops.Anim || {};
Ops.Math=Ops.Math || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.Shader=Ops.Gl.Shader || {};

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
// Ops.Gl.Shader.WireframeMaterial
// 
// **************************************************************

Ops.Gl.Shader.WireframeMaterial = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
var cgl=op.patch.cgl;

var render=op.addInPort(new Port(op,"render",OP_PORT_TYPE_FUNCTION) );
var trigger=op.addOutPort(new Port(op,"trigger",OP_PORT_TYPE_FUNCTION));

var enableDepth=op.addInPort(new Port(op,"enable depth testing",OP_PORT_TYPE_VALUE,{ display:'bool' }));
enableDepth.set(true);

var fill=op.addInPort(new Port(op,"fill",OP_PORT_TYPE_VALUE,{ display:'bool' }));
fill.set(true);

function setDefines()
{
    if(shader)
        if(fill.get()) shader.define('WIREFRAME_FILL');
            else shader.removeDefine('WIREFRAME_FILL');
}
fill.onChange=function()
{
    setDefines();
};

var w=op.addInPort(new Port(op,"width",OP_PORT_TYPE_VALUE,{ display:'range' }));
w.set(0.25);
w.onValueChanged=function(){ uniformWidth.setValue(w.get()); };

var opacity=op.addInPort(new Port(op,"opacity",OP_PORT_TYPE_VALUE,{ display:'range' }));
opacity.set(1.0);
opacity.onValueChanged=function(){ uniformOpacity.setValue(opacity.get()); };

if(cgl.glVersion==1 && !cgl.gl.getExtension('OES_standard_derivatives') )
{
    op.uiAttr( { 'error': 'no oes standart derivatives!' } );
}
else
{
    op.uiAttr( { 'error': null } );
}


if(cgl.glVersion==1)
{
    var srcVert=''
        .endl()+'{{MODULES_HEAD}}'
        .endl()+'IN vec3 vPosition;'
        .endl()+'IN vec3 attrBarycentric;'
        .endl()+'UNI mat4 projMatrix;'
        .endl()+'UNI mat4 modelMatrix;'
        .endl()+'UNI mat4 viewMatrix;'
        .endl()+'OUT vec3 barycentric;'
        .endl()+'IN vec2 attrTexCoord;'
        .endl()+'OUT vec2 texCoord;'
        .endl();
}
else
{
    var srcVert=''
        .endl()+'{{MODULES_HEAD}}'
        .endl()+'IN vec3 vPosition;'
        .endl()+'IN vec3 attrBarycentric;'
        .endl()+'UNI mat4 projMatrix;'
        .endl()+'UNI mat4 modelMatrix;'
        .endl()+'UNI mat4 viewMatrix;'
        .endl()+'OUT vec3 barycentric;'
        .endl()+'IN vec2 attrTexCoord;'
        .endl()+'OUT vec2 texCoord;'
        .endl();
}

srcVert+=''
    .endl()+'void main()'
    .endl()+'{'
    .endl()+'    texCoord=attrTexCoord;'
    .endl()+'    barycentric=attrBarycentric;'
    .endl()+'    vec4 pos = vec4( vPosition, 1. );'
    .endl()+'    {{MODULE_VERTEX_POSITION}}'
    .endl()+'    gl_Position = projMatrix * viewMatrix * modelMatrix * pos;'
    .endl()+'}';



var srcFrag='';

if(cgl.glVersion==1)
{
    srcFrag=''//#extension GL_OES_standard_derivatives : enable'
    // .endl()+'precision highp float;'
    .endl()+'IN vec3 barycentric;'
    .endl();
}
else
{
    srcFrag=''
    // .endl()+'precision highp float;'
    .endl()+'IN vec3 barycentric;'
    // .endl()+'out vec4 fragColor;'

    .endl();
}

srcFrag+=''
.endl()+'UNI float width;'
.endl()+'UNI float opacity;'
.endl()+'UNI float r,g,b;'
.endl()+'UNI float fr,fg,fb;'
.endl()+''
.endl()+'float edgeFactor()'
.endl()+'{'
.endl()+'    vec3 d = fwidth(barycentric);'
.endl()+'    vec3 a3 = smoothstep(vec3(0.0), d*width*4.0, barycentric);'
.endl()+'    return min(min(a3.x, a3.y), a3.z);'
.endl()+'}'
.endl()+'void main()'
.endl()+'{'
.endl()+'   vec4 col;'

.endl()+'   #ifdef WIREFRAME_FILL'
.endl()+'        float v=opacity*(1.0-edgeFactor())*0.95;'
.endl()+'       vec3 wire = vec3(fr, fg, fb);'
.endl()+'       col.rgb = vec3(r, g, b);'
.endl()+'       col.rgb = mix(wire,col.rgb,v);'
.endl()+'       col.a = opacity;'
// .endl()+'    col = wire;'
.endl()+'   #endif'

.endl()+'   #ifndef WIREFRAME_FILL'
.endl()+'       col = vec4(r,g,b, opacity*(1.0-edgeFactor())*0.95);'
.endl()+'   #endif'
// .endl()+'col.xyz=barycentric;'
.endl();

// if(cgl.glVersion==1)srcFrag+='gl_FragColor=col;';
// else
srcFrag+='outColor=col;';

srcFrag+=''.endl()+'}';

var doRender=function()
{
    // if(true!==enableDepth.get()) cgl.gl.disable(cgl.gl.DEPTH_TEST);
        // else cgl.gl.enable(cgl.gl.DEPTH_TEST);
    cgl.pushDepthTest(enableDepth.get());

    cgl.setShader(shader);
    trigger.trigger();
    cgl.setPreviousShader();

    // if(true!==enableDepth.get()) cgl.gl.enable(cgl.gl.DEPTH_TEST);
    cgl.popDepthTest();

};

var shader=new CGL.Shader(cgl,'Wireframe Material');

if(cgl.glVersion>1)shader.glslVersion=300;
var uniformWidth=new CGL.Uniform(shader,'f','width',w.get());
var uniformOpacity=new CGL.Uniform(shader,'f','opacity',opacity.get());

if(cgl.glVersion==1)shader.enableExtension('OES_standard_derivatives');

shader.setSource(srcVert,srcFrag);
shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
shader.wireframe=true;
setDefines();

{
    // diffuse color

    var r=op.addInPort(new Port(op,"diffuse r",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true' }));
    r.onValueChanged=function()
    {
        if(!r.uniform) r.uniform=new CGL.Uniform(shader,'f','r',r.get());
        else r.uniform.setValue(r.get());
    };

    var g=op.addInPort(new Port(op,"diffuse g",OP_PORT_TYPE_VALUE,{ display:'range' }));
    g.onValueChanged=function()
    {
        if(!g.uniform) g.uniform=new CGL.Uniform(shader,'f','g',g.get());
        else g.uniform.setValue(g.get());
    };

    var b=op.addInPort(new Port(op,"diffuse b",OP_PORT_TYPE_VALUE,{ display:'range' }));
    b.onValueChanged=function()
    {
        if(!b.uniform) b.uniform=new CGL.Uniform(shader,'f','b',b.get());
        else b.uniform.setValue(b.get());
    };

    r.set(Math.random());
    g.set(Math.random());
    b.set(Math.random());
}

{
    // diffuse color

    var fr=op.addInPort(new Port(op,"Fill R",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true' }));
    fr.uniform=new CGL.Uniform(shader,'f','fr',fr);

    var fg=op.addInPort(new Port(op,"Fill G",OP_PORT_TYPE_VALUE,{ display:'range' }));
    fg.uniform=new CGL.Uniform(shader,'f','fg',fg);

    var fb=op.addInPort(new Port(op,"Fill B",OP_PORT_TYPE_VALUE,{ display:'range' }));
    fb.uniform=new CGL.Uniform(shader,'f','fb',fb);

    fr.set(0);
    fg.set(0);
    fb.set(0);
}


// op.onLoaded=shader.compile;

render.onTriggered=doRender;

doRender();


};

Ops.Gl.Shader.WireframeMaterial.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Gl.ClearColor
// 
// **************************************************************

Ops.Gl.ClearColor = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
const render=op.addInPort(new Port(op,"render",OP_PORT_TYPE_FUNCTION));
const trigger=op.addOutPort(new Port(op,"trigger",OP_PORT_TYPE_FUNCTION));
const r=op.addInPort(new Port(op,"r",OP_PORT_TYPE_VALUE,{ display:'range', colorPick:'true' }));
const g=op.inValueSlider("g",0.1);
const b=op.inValueSlider("b",0.1);
const a=op.inValueSlider("a",1);

r.set(0.1);
const cgl=op.patch.cgl;

render.onTriggered=function()
{
    cgl.gl.clearColor(r.get(),g.get(),b.get(),a.get());
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    trigger.trigger();
};


};

Ops.Gl.ClearColor.prototype = new CABLES.Op();

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
// Ops.Anim.RelativeTime
// 
// **************************************************************

Ops.Anim.RelativeTime = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
op.name='RelativeTime';

var exe=op.inFunction("exe");
var mul=op.inValue("Multiply",1);
var result=op.outValue("result");

exe.onTriggered=update;
update();

function update()
{
    result.set( op.patch.freeTimer.get()*mul.get() );
}



};

Ops.Anim.RelativeTime.prototype = new CABLES.Op();

//----------------



// **************************************************************
// 
// Ops.Math.Multiply
// 
// **************************************************************

Ops.Math.Multiply = function()
{
Op.apply(this, arguments);
var op=this;
var attachments={};
const number1=op.addInPort(new Port(op,"number1"));
const number2=op.addInPort(new Port(op,"number2"));
const result=op.addOutPort(new Port(op,"result"));

function update()
{
    const n1=number1.get();
    const n2=number2.get();

    if(isNaN(n1))n1=0;
    if(isNaN(n2))n2=0;

    result.set( n1*n2 );
}

number1.onValueChanged=update;
number2.onValueChanged=update;

number1.set(1);
number2.set(2);


};

Ops.Math.Multiply.prototype = new CABLES.Op();

//----------------

