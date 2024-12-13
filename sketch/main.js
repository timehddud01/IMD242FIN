const aspectW = 4;
const aspectH = 3;
// html에서 클래스명이 container-canvas인 첫 엘리먼트: 컨테이너 가져오기.
const container = document.body.querySelector('.container-canvas');

const {
  Engine,
  Body,
  Bodies,
  Composite,
  Composites,
  Vector,
  Mouse,
  MouseConstraint,
} = Matter;

let engine, world;
let handPose;
let videoW = 640;
let videoH = 480;
let hands = [];
let video;
let mouse, mouseConstraint;
let canvas;
let handBody;

let force;
let balls = []; //주변 작은 원들 배열
let bigCirlce; //가운데 큰 원
let circleX = width * 0.5;
let circleY = height * 0.5;
let circleColor;
let circleRadius;

function preload() {
  handPose = ml5.handPose({
    maxHands: 2,
    flipped: true,
    runtime: 'tfjs',
    modelType: 'full',
    detectorModelUrl: undefined, //default to use the tf.hub model
    landmarkModelUrl: undefined, //default to use the tf.hub model
  });
}

function gotHands(results) {
  hands = results;
}

function videoScale() {
  return width / height > videoW / videoH ? width / videoW : height / videoH;
}
//삼항 연산자: 앞 조건이 참일시 A : B 에서 A 값이, 거짓일시 B 값이 반환된다.

function setup() {
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();

  if (aspectW === 0 || aspectH === 0) {
    createCanvas(containerW, containerH).parent(container);
  } else if (containerW / containerH > aspectW / aspectH) {
    createCanvas((containerH * aspectW) / aspectH, containerH).parent(
      container
    );
  } else {
    createCanvas(containerW, (containerW * aspectH) / aspectW).parent(
      container
    );
  }
  init();
  circleRadius = height * 0.5;
  circleColor = color(255, 255, 255);

  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, gotHands);

  engine = Engine.create();
  world = engine.world;

  mouse = Mouse.create(canvas.elt); //
  mouse.pixelRatio = pixelDensity(); //
  mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { stiffness: 0.2, render: { visible: false } },
  });
  Composite.add(world, mouseConstraint);
}

// windowResized()에서 setup()에 준하는 구문을 실행해야할 경우를 대비해 init이라는 명칭의 함수를 만들어 둠.
function init() {}

function draw() {
  Engine.update(engine);
  let currentVideoScale = 0;
  const currentVideoZero = { x: 0, y: 0 };

  if (video) {
    currentVideoScale = videoScale();
    currentVideoZero.x = (width - video.width * videoScale()) * 0.5;
    currentVideoZero.y = (height - video.height * videoScale()) * 0.5;
  }

  background('white');
  image(
    video,
    currentVideoZero.x,
    currentVideoZero.y,
    video.width * currentVideoScale,
    video.height * currentVideoScale
  );
  if (hands.length > 0) {
    Body.setPosition(
      handBody,
      Vector.create(
        currentVideoZero.x + hands[0].keypoints[8].x * currentVideoScale,
        currentVideoZero.y + hands[0].keypoints[8].y * currentVideoScale
      )
    );
  }

  // circle(mouseX, mouseY, 50);
  // //좌우 반전시키기
  // push();
  // translate(width, 0);
  // scale(-1, 1); //
  // image(video, 0, 0, width, height);
  // for (let i = 0; i < hands.length; i++) {
  //   let hand = hands[i];
  //   for (let j = 0; j < hand.keypoints.length; j++) {
  //     let keypoint = hand.keypoints[j];
  //     fill(255, 0, 0);
  //     noStroke();
  //     circle(keypoint.x, keypoint.y, 10);
  //   }
  // }

  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      fill(0, 255, 0);
      noStroke();
      circle(
        currentVideoZero.x + keypoint.x * currentVideoScale,
        currentVideoZero.y + keypoint.y * currentVideoScale,
        10
      );
    }
  }

  noFill();
  stroke(255);
}

function windowResized() {
  // 컨테이너의 현재 위치, 크기 등의 정보 가져와서 객체구조분해할당을 통해 너비, 높이 정보를 변수로 추출.
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();
  // 종횡비가 설정되지 않은 경우:
  // 컨테이너의 크기와 일치하도록 캔버스 크기를 조정.
  if (aspectW === 0 || aspectH === 0) {
    resizeCanvas(containerW, containerH);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 클 경우:
  // 컨테이너의 세로길이에 맞춰 종횡비대로 캔버스 크기를 조정.
  else if (containerW / containerH > aspectW / aspectH) {
    resizeCanvas((containerH * aspectW) / aspectH, containerH);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 작거나 같을 경우:
  // 컨테이너의 가로길이에 맞춰 종횡비대로 캔버스 크기를 조정.
  else {
    resizeCanvas(containerW, (containerW * aspectH) / aspectW);
  }
  // 위 과정을 통해 캔버스 크기가 조정된 경우, 다시 처음부터 그려야할 수도 있다.
  // 이런 경우 setup()의 일부 구문을 init()에 작성해서 여기서 실행하는게 편리하다.
  // init();
}
