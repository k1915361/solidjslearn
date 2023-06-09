import * as faceapi from 'face-api.js';
import { onMount } from 'solid-js';
// import "https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/css/materialize.css";
import { changeFaceDetector, getElId, getFaceDetectorOptions, isFaceDetectionModelLoaded } from './faceAPIHelper';
import './faceAPI.css'

export default function FaceExpressionRecognitionWebcam() {
  let forwardTimes = []
  let withBoxes = true
  let videoEl: HTMLVideoElement
  let canvas: HTMLCanvasElement

  function onChangeHideBoundingBoxes(e) {
    withBoxes = !getElId(e.target).prop('checked')
  }

  function updateTimeStats(timeInMs) {
    forwardTimes = [timeInMs].concat(forwardTimes).slice(0, 30)
    const avgTimeInMs = forwardTimes.reduce((total, t) => total + t) / forwardTimes.length
    // getElId('time').val(`${Math.round(avgTimeInMs)} ms`)
    // getElId('fps').val(`${faceapi.utils.round(1000 / avgTimeInMs)}`)
  }

  async function onPlay() {

    if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
      return setTimeout(() => onPlay())

    const options = getFaceDetectorOptions()

    const ts = Date.now()
    
    const result = await faceapi.detectSingleFace(videoEl, options).withFaceExpressions()
    
    updateTimeStats(Date.now() - ts)
    
    if (result) {
      const dims = faceapi.matchDimensions(canvas, videoEl, true)

      const resizedResult = faceapi.resizeResults(result, dims)
      const minConfidence = 0.05
      if (withBoxes) {
        faceapi.draw.drawDetections(canvas, resizedResult)
      }
      faceapi.draw.drawFaceExpressions(canvas, resizedResult, minConfidence)
    }

    setTimeout(() => onPlay())
  }

  async function run() {
    await changeFaceDetector()
    await faceapi.loadFaceExpressionModel('/library/model/')
    
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
    videoEl.srcObject = stream
  }

  onMount(() => {
    canvas = getElId('overlayWebcam')
    videoEl = getElId('inputVideoWebcam')
    run()
  })

  return (
    <div>
      <div id="navbar"></div>
      <div class="center-content page-container">

        <div class="progress" id="loader">
          <div class="indeterminate"></div>
        </div>
        <div class="positionRelative ">
          <video onloadedmetadata={() => onPlay()} id="inputVideoWebcam" autoplay muted playsinline></video>
          <canvas id="overlayWebcam" class='overlay' />
        </div>
        
        {false && <>                
        <div class="row side-by-side">

          <div id="face_detector_selection_control" class="row input-field" style="margin-right: 20px;">
            <select id="selectFaceDetector">
              <option value="ssd_mobilenetv1">SSD Mobilenet V1</option>
              <option value="tiny_face_detector">Tiny Face Detector</option>
            </select>
            <label>Select Face Detector</label>
          </div>

          <div class="row" style="width: 220px;">
            <input type="checkbox" id="hideBoundingBoxesCheckbox" onchange={onChangeHideBoundingBoxes} />
            <label for="hideBoundingBoxesCheckbox">Hide Bounding Boxes</label>
          </div>

          <div id="fps_meter" class="row side-by-side">
            <div>
              <label for="time">Time:</label>
              <input disabled value="-" id="time" type="text" class="bold" />
              <label for="fps">Estimated Fps:</label>
              <input disabled value="-" id="fps" type="text" class="bold" />
            </div>
          </div>

        </div>

        <span id="ssd_mobilenetv1_controls">
          <div class="row side-by-side">
            <div class="row">
              <label for="minConfidence">Min Confidence:</label>
              <input disabled value="0.5" id="minConfidence" type="text" class="bold" />
            </div>
            <button
              class="waves-effect waves-light btn"
              onclick="onDecreaseMinConfidence()"
            >
              <i class="material-icons left">-</i>
            </button>
            <button
              class="waves-effect waves-light btn"
              onclick="onIncreaseMinConfidence()"
            >
              <i class="material-icons left">+</i>
            </button>
          </div>
        </span>

        <span id="tiny_face_detector_controls">
          <div class="row side-by-side">
            <div class="row input-field" style="margin-right: 20px;">
              <select id="inputSize">
                <option value="" disabled selected>Input Size:</option>
                <option value="128">128 x 128</option>
                <option value="160">160 x 160</option>
                <option value="224">224 x 224</option>
                <option value="320">320 x 320</option>
                <option value="416">416 x 416</option>
                <option value="512">512 x 512</option>
                <option value="608">608 x 608</option>
              </select>
              <label>Input Size</label>
            </div>
            <div class="row">
              <label for="scoreThreshold">Score Threshold:</label>
              <input disabled value="0.5" id="scoreThreshold" type="text" class="bold" />
            </div>
            <button
              class="waves-effect waves-light btn"
              onclick="onDecreaseScoreThreshold()"
            >
              <i class="material-icons left">-</i>
            </button>
            <button
              class="waves-effect waves-light btn"
              onclick="onIncreaseScoreThreshold()"
            >
              <i class="material-icons left">+</i>
            </button>
          </div>
        </span>
        </>}

      </div>
    </div>
  )
}