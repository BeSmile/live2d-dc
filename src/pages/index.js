/*
 * @Description: 
 * @Version: 
 * @Author: linjinzhi
 * @Date: 2020-08-05 17:13:14
 * @LastEditors: linjinzhi
 * @LastEditTime: 2020-08-06 12:18:30
 */
 /*global PATH */
import React, { createRef, useEffect, useRef } from 'react'
import styles from './index.css';

function loadBytes(path, mime, callback) {
  var request = new XMLHttpRequest()
  request.open('GET', path, true)
  request.responseType = mime
  request.onload = function() {
    if(request.status == 200) {
      callback(request.response)
    }
    else {
      console.error('Failed to load (' + request.status + ') : ' + path)
    }
  }
  request.send(null)
}


// WebGL helpers
function getWebGLContext(canvas) {
  // try different WebGl kits
  var kits = ['webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl']
  var param = { alpha: true, premultipliedAlpha: true }

  for(var i = 0; i < kits.length; i++) {
    try {
      var ctx = canvas.getContext(kits[i], param)
      if(ctx) return ctx
    }
    catch(e) {}
  }
  return null
}

function getWebGLTexture(live2DModel, gl, img) {
  // create empty texture
  var texture = gl.createTexture()

  // a lot of WebGL things i dont understand
  if(live2DModel.isPremultipliedAlpha() === false) {
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1)
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
  gl.activeTexture(gl.TEXTURE0 )
  gl.bindTexture(gl.TEXTURE_2D, texture )
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.bindTexture(gl.TEXTURE_2D, null)

  return texture;
}


export default function({
  match: {
    params: {
      model,
    }
  }
}) {
  const live2dRef = createRef(null);
  const live2DModel = useRef(null);
  const requestID = useRef(null);
  const loadLive2DCompleted = useRef(null);
  const initLive2DCompleted = useRef(null);
  const loadedImages = useRef([]);
  const motionMgr = useRef(null);
  const modelJson = useRef(null);
  const motionIdle = useRef(null);
  const motionClick = useRef(null);

  const modelName = model;
  var 
  modelScale = 1.1,
  modelX = 0,
  modelY = 0.1;

  const getPath = React.useCallback((pathDir, file) => {
    return PATH + pathDir + modelName + '/' + file
  }, [modelName]);
  // ./live2d/c000_01/MOC.c000_01.json
  
  const draw = React.useCallback((gl) => {
    // clear canvas
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT);
    // check if model and textures are loaded
    if(!live2DModel.current || !loadLive2DCompleted.current) return
    // check if first time drawign
    if(!initLive2DCompleted.current) {
      initLive2DCompleted.current = true
  
      // apply textures to the model
      for(var i = 0; i < loadedImages.current.length; i++) {
        var texture = getWebGLTexture(live2DModel.current, gl, loadedImages.current[i])
        live2DModel.current.setTexture(i, texture)
      }
  
      // reduce resources usage
      loadedImages.current = null
  
      // pass WebGl to model
      live2DModel.current.setGL(gl)
    }
  
    // something about model matrix
    var height = live2DModel.current.getCanvasHeight()
    var width = live2DModel.current.getCanvasWidth()
    var modelMatrix = new window.L2DModelMatrix(width, height);
  
    modelMatrix.setWidth(modelScale)
    modelMatrix.setCenterPosition(modelX, modelY)
  
    live2DModel.current.setMatrix(modelMatrix.getArray())
  
    // start idle animation
    if(motionMgr.current.isFinished()) {
      motionMgr.current.startMotion(motionIdle.current)
    }
    motionMgr.current.updateParam(live2DModel.current)
  
    // update and draw model
    live2DModel.current.update()
    live2DModel.current.draw()
  }, [modelScale, modelX, modelY])
  

  const init = React.useCallback((dir, canvas) => {
    var gl = getWebGLContext(canvas)
    if(!gl) {
      console.error('Failed to create WebGl context!')
      return
    }
    // pass WebGl context to Live2D lib
    window.Live2D.setGL(gl);

    // ------------------------
    // start of model rendering
    // ------------------------
    loadBytes(getPath(dir, modelJson.current.model), 'arraybuffer', function(buf) {
      live2DModel.current = window.Live2DModelWebGL.loadModel(buf)
    });

    // ------------------------
    // start loading textures
    // ------------------------
    var loadedCount = 0;
    for(var i = 0; i < modelJson.current.textures.length; i++) {
      // create new image
      loadedImages.current[i] = new Image()
      loadedImages.current[i].src = getPath(dir, modelJson.current.textures[i])
      // eslint-disable-next-line no-loop-func
      loadedImages.current[i].onload = function() {
        // check if all textures are loaded
        loadedCount++
        if(loadedCount === modelJson.current.textures.length) {
          loadLive2DCompleted.current = true;
        }
      }
      // eslint-disable-next-line no-loop-func
      loadedImages.current[i].onerror = function() {
        console.error('Failed to load texture: ' + modelJson.current.textures[i]);
      }
    }

    // ------------------------
    // start loading motions
    // ------------------------
    motionMgr.current = new window.L2DMotionManager();
    loadBytes(getPath(dir, modelJson.current.motions.idle[0].file), 'arraybuffer', function(buf) {
      motionIdle.current = new window.Live2DMotion.loadMotion(buf)
      // remove fade in/out delay to make it smooth
      motionIdle.current._$eo = 0
      motionIdle.current._$dP = 0
    })
    if(modelJson.current.motions.attack) {
      loadBytes(getPath(dir, modelJson.current.motions.attack[0].file), 'arraybuffer', function(buf) {
        motionClick.current = new window.Live2DMotion.loadMotion(buf)
        // remove fade in/out delay to make it smooth
        motionClick.current._$eo = 0;
        motionClick.current._$dP = 0;
    })} else if ( modelJson.current.motions.maxtouch) {
        loadBytes(getPath(dir, modelJson.current.motions.maxtouch[0].file), 'arraybuffer', function(buf) {
        motionClick.current = new window.Live2DMotion.loadMotion(buf)
        // remove fade in/out delay to make it smooth
        motionClick.current._$eo = 0;
        motionClick.current._$dP = 0;
      })
    }
    
    // ------------------------
    // ?loop every frame
    // ------------------------
    (function tick() {
      draw(gl);
      var requestAnimationFrame =
              window.requestAnimationFrame ||
              window.mozRequestAnimationFrame ||
              window.webkitRequestAnimationFrame ||
              window.msRequestAnimationFrame
      requestID.current = requestAnimationFrame(tick, canvas)
    })()
  }, [draw, getPath])

  const initLive2d = React.useCallback((dir, model) => {
    window.Live2D.init();
    init(dir, live2dRef.current);
    // init(dir, canvas)
  }, [init, live2dRef]);

  useEffect(() => {
    if(!live2dRef.current) {
      return;
    }
    loadBytes(getPath('/live2d/', `MOC.${modelName}.json`), 'text', function(buf) {
      modelJson.current = JSON.parse(buf);
      initLive2d('/live2d/', modelJson.current);
    });

    window.Live2D.init()

  }, [getPath, initLive2d, live2dRef, modelName]);

  return (
    <canvas ref={live2dRef} width="650" height="650" className={styles.canvas}/>
  );
}
