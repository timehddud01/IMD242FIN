// 종횡비를 고정하고 싶을 경우: 아래 두 변수를 0이 아닌 원하는 종, 횡 비율값으로 설정.
// 종횡비를 고정하고 싶지 않을 경우: 아래 두 변수 중 어느 하나라도 0으로 설정.
const aspectW = 0;
const aspectH = 0;
// html에서 클래스명이 container-canvas인 첫 엘리먼트: 컨테이너 가져오기.
const container = document.body.querySelector('.container-canvas');
// 필요에 따라 이하에 변수 생성.

//ml5
const { Engine, Body, Bodies, Composite, Composites, Constraint, Vector } =
  Matter;

//matter.js
let engine, world;
let video;
let handPose;
let hands = [];
let walls = [];
let balls = [];
let ballRadius = 10; // 공의 반지름
let colNum = 40; // 한 줄에 배치할 공 개수
let rowNum = 9; // 줄의 개수
let padding = 20; // 공 사이 간격

let startPosX = 10;
let startPosY = 200; //시작위치 생성

let handCollider;

let bigCircle;
let OGposX;
let OGposY;

const videoW = 640;
const videoH = 480;

function gotHands(results) {
  hands = results;
}

function videoScale() {
  return width / height > videoW / videoH ? width / videoW : height / videoH;
  //return width / height > videoW / videoH ? height / videoH : width / videoW; //세로 비율에 맞게 조절
}

function preload() {
  handPose = ml5.handPose({ maxHands: 6, flipped: true });
}

function setup() {
  // 컨테이너의 현재 위치, 크기 등의 정보 가져와서 객체구조분해할당을 통해 너비, 높이 정보를 변수로 추출.
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();
  // 종횡비가 설정되지 않은 경우:
  // 컨테이너의 크기와 일치하도록 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  if (aspectW === 0 || aspectH === 0) {
    createCanvas(containerW, containerH).parent(container);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 클 경우:
  // 컨테이너의 세로길이에 맞춰 종횡비대로 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  else if (containerW / containerH > aspectW / aspectH) {
    createCanvas((containerH * aspectW) / aspectH, containerH).parent(
      container
    );
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 작거나 같을 경우:
  // 컨테이너의 가로길이에 맞춰 종횡비대로 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  else {
    createCanvas(containerW, (containerW * aspectH) / aspectW).parent(
      container
    );
  }
  init();
  // createCanvas를 제외한 나머지 구문을 여기 혹은 init()에 작성.
  video = createCapture(VIDEO, { flipped: true });
  video.size(videoW, videoH);
  video.hide();
  handPose.detectStart(video, gotHands);

  engine = Engine.create();
  world = engine.world;

  walls.push(Bodies.rectangle(width * 0.5, 0, 10000, 100, { isStatic: true }));
  walls.push(
    Bodies.rectangle(width, height * 0.5, 100, 10000, { isStatic: true })
  );
  walls.push(
    Bodies.rectangle(width * 0.5, height, 10000, 100, { isStatic: true })
  );
  walls.push(Bodies.rectangle(0, height * 0.5, 100, 10000, { isStatic: true }));

  Composite.add(world, walls);
  handCollider = Bodies.circle(-10000, -10000, 50); //생성 시 초기화 할 위치--초기에는 화면 밖에 만들어 보이지 않게 한다.
  Composite.add(world, handCollider);

  let stack = Matter.Composites.stack(60, 350, 75, 15, 0, 0, function (x, y) {
    // Bodies.circle로 원을 생성
    let ball = Matter.Bodies.circle(x, y, ballRadius, {
      restitution: 0.0005, // 원의 튕김 정도
      friction: 2, // 표면 마찰 증가
      frictionAir: 0.5, // 공기 저항 증가
      density: 0.02, // 질량 증가
    });
    balls.push({ ball: ball, initialPos: { x: x, y: y } });

    return ball;
  });

  // 생성된 스택을 월드에 추가
  Matter.Composite.add(world, stack);
}

// windowResized()에서 setup()에 준하는 구문을 실행해야할 경우를 대비해 init이라는 명칭의 함수를 만들어 둠.
function init() {}

let FingerMaxRad = 70;
let FingerRad = 30;
let transparency = 255;

function draw() {
  Engine.update(engine);
  let currentVideoScale = 0;
  const currentVideoZero = { x: 0, y: 0 };
  if (video) {
    currentVideoScale = videoScale();
    currentVideoZero.x = (width - video.width * videoScale()) * 0.5;
    currentVideoZero.y = (height - video.height * videoScale()) * 0.5;
  }
  background(0);
  // image(
  //   video,
  //   currentVideoZero.x,
  //   currentVideoZero.y,
  //   video.width * currentVideoScale,
  //   video.height * currentVideoScale
  // );
  //
  if (hands.length > 0) {
    Body.setPosition(
      handCollider,
      Vector.create(
        //엄지 위치에 handCollider 만들기
        currentVideoZero.x + hands[0].keypoints[8].x * currentVideoScale,
        currentVideoZero.y + hands[0].keypoints[8].y * currentVideoScale
      )
    );
  }

  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    //엄지만 그리기
    let keypointNo8 = hand.keypoints[8];
    fill(66, 209, 245);
    noStroke();
    //8번
    circle(
      currentVideoZero.x + keypointNo8.x * currentVideoScale,
      currentVideoZero.y + keypointNo8.y * currentVideoScale,
      30
    );

    noFill();
    stroke(66, 209, 245, transparency);
    strokeWeight(1);

    FingerRad += 0.4;
    transparency -= 3;
    if (FingerRad >= FingerMaxRad) {
      FingerRad = 30;
      transparency = 255;
    }
    //8번
    circle(
      currentVideoZero.x + keypointNo8.x * currentVideoScale,
      currentVideoZero.y + keypointNo8.y * currentVideoScale,
      FingerRad
    );
  }
  stroke(255, 0, 0);
  beginShape();
  handCollider.vertices.forEach((aVertex) => {
    vertex(aVertex.x, aVertex.y);
  });

  fill(255, 0, 0);
  for (let i = 0; i < balls.length; i++) {
    let ball = balls[i].ball;

    // 각 공에 대해 초기 위치로 돌아가려는 힘을 적용
    let initialPos = balls[i].initialPos;
    let force = {
      x: (initialPos.x - ball.position.x) * 0.01, // 초기 위치로 돌아가려는 힘
      y: (initialPos.y - ball.position.y) * 0.01, // 초기 위치로 돌아가려는 힘
    };

    // 힘 적용
    Matter.Body.applyForce(ball, ball.position, force);

    // 공 그리기
    ellipse(ball.position.x, ball.position.y, ball.circleRadius * 2);
  }
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
  init();
  Body.setPosition(walls[1], Vector.create(width, height * 0.5));
  Body.setPosition(walls[2], Vector.create(width * 0.5, height));
}
