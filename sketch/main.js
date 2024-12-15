// 종횡비를 고정하고 싶을 경우: 아래 두 변수를 0이 아닌 원하는 종, 횡 비율값으로 설정.
// 종횡비를 고정하고 싶지 않을 경우: 아래 두 변수 중 어느 하나라도 0으로 설정.
const aspectW = 0; //세로가 꽉 찬 전체화면으로 사용
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

let handPose; //
let hands = [];
let walls = [];
let balls = [];
let ballRadius = 20; // 생성할 원의 반지름

let handCollider; //손에서 충돌을 할 수 있게 함

const videoW = 640;
const videoH = 480;

function gotHands(results) {
  //HandPose를 사용하기 위해 필요한 것
  hands = results;
}

function videoScale() {
  // return width / height > videoW / videoH ? width / videoW : height / videoH;
  return width / height > videoW / videoH ? height / videoH : width / videoW;
  //가로가 아닌 세로 비율에 맞게 출력한다.
}

function preload() {
  handPose = ml5.handPose({ maxHands: 2, flipped: true }); //2개의 손까지만 인식하게 하고 좌우반전을 통해 헷갈리지 않게 한다.
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
  video = createCapture(VIDEO, { flipped: true }); //비디오 출력시 좌우 반전해준다.
  video.size(videoW, videoH);
  video.hide(); //setup에서 비디오를 숨겨준다.
  handPose.detectStart(video, gotHands); //손 인식

  engine = Engine.create();
  world = engine.world;

  walls.push(Bodies.rectangle(width * 0.5, -25, 10000, 50, { isStatic: true })); //벽 생성

  //벽은 비디오 크기에 맞게 생성해주고, 두께는 50으로 한다.
  walls.push(
    Bodies.rectangle((width + videoW) * 0.5 + 25, height * 0.5, 50, 10000, {
      isStatic: true,
    })
  );
  walls.push(
    Bodies.rectangle(width * 0.5, height + 25, 10000, 50, { isStatic: true })
  );
  walls.push(
    Bodies.rectangle(width - 25, height * 0.5, 50, 10000, {
      isStatic: true,
    })
  );

  Composite.add(world, walls);
  handCollider = Bodies.circle(0, 0, 50); //손 생성 시 초기화 할 위치--초기에는 화면 밖에 만들어 보이지 않게 한다.
  Composite.add(world, handCollider);

  // 여러개의 타일 형태의 원을 생성하기 위해 stack 사용
  //전체 크기를 고려하여 타일이 화면 정 중앙에 생성될 수 있도록 위치 조정
  let stack = Matter.Composites.stack(
    width * 0.5 - 200,
    height * 0.5 - 200,
    10, //가로10개, 세로 10개
    10,
    0, //촘촘하게 붙어있도록 한다.
    0,
    function (x, y) {
      //콜백함수 : 생성되는 객체에 특성을 부여한다.
      // Bodies.circle로 원을 생성
      let ball = Matter.Bodies.circle(x, y, ballRadius, {
        //원 생성
        //원이 부드럽게 움직일 수 있도록
        restitution: 0.0005, // 원의 튕김 정도
        friction: 2, // 마찰력 조절
        frictionAir: 0.5, // 공기 저항
        density: 0.02, // 질량
      });

      //ChatGPT 의 도움을 받았습니다.
      //질문내용: 생성되는 원들의 초기값을 배열에 저장하는 방법

      balls.push({ ball: ball, PosOG: { x: x, y: y } });
      // balls 배열에 물리적 속성을 가진 원과 초기 생성위치를 함께 저장한다.
      // ball속성에 ball을, PosOG 속성에 x와 y값을 할당하는 원리
      //balls에 저장되는 형태 예시
      //     //balls = [
      // { ball: ball1, PosOG: { x: x1, y: y1 } },
      // { ball: ball2, PosOG: { x: x2, y: y2 } },
      // { ball: ball3, PosOG: { x: x3, y: y3 } },
      // ,,,
      // ]//

      return ball; //생성한 ball을 stack에 넘겨주기
    }
  );

  // 생성한 스택을 월드에 추가
  Matter.Composite.add(world, stack);
}

// windowResized()에서 setup()에 준하는 구문을 실행해야할 경우를 대비해 init이라는 명칭의 함수를 만들어 둠.
function init() {}

let WaveMax = 70; //물결 모양의 파동 생성을 위한 변수 초기화
let WaveRad = 30;
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

  for (let i = 0; i < hands.length; i++) {
    Body.setPosition(
      handCollider,
      Vector.create(
        //i번째 손의 손바닥 위치(9번 점)에 handCollider 만들기
        currentVideoZero.x + hands[i].keypoints[9].x * currentVideoScale,
        currentVideoZero.y + hands[i].keypoints[9].y * currentVideoScale
      )
    );
    //9번 점에만 원 그리기
    let hand = hands[i];
    let keypointNo9 = hand.keypoints[9];
    fill(245, 0, 80);
    noStroke();

    circle(
      currentVideoZero.x + keypointNo9.x * currentVideoScale,
      currentVideoZero.y + keypointNo9.y * currentVideoScale,
      30
    );

    noFill();
    stroke(245, 0, 80, transparency);
    strokeWeight(2);

    WaveRad += 0.4; // 원이 조금씩 커지게 한다.
    transparency -= 3; //점점 투명하게 변하도록 조절
    if (WaveRad >= WaveMax) {
      WaveRad = 30;
      transparency = 255;
    }
    //9번
    circle(
      //파동을 치는 원 계속 그리기
      currentVideoZero.x + keypointNo9.x * currentVideoScale,
      currentVideoZero.y + keypointNo9.y * currentVideoScale,
      WaveRad
    );
  }
  //handcollider점을 그려주기 때문에 주석처리
  // stroke(255, 0, 0);
  // beginShape();
  // handCollider.vertices.forEach((aVertex) => {
  //   vertex(aVertex.x, aVertex.y);
  // });

  // fill(255, 0, 0);

  for (let i = 0; i < balls.length; i++) {
    let ball = balls[i].ball;

    //ChatGpt의 도움을 받았습니다. Matter.Body.applyForce(body, position, force) 함수 사용
    //물체(body)에 정해진 위치(position)로 힘 적용

    // 각 공에 대해 처음 위치로 돌아가려는 힘 구하기
    let PosOG = balls[i].PosOG;
    let force = {
      x: (PosOG.x - ball.position.x) * 0.02, // 원래 위치와 거리를 구하고 0.02를 곱해 힘조절 - x 좌표부분
      y: (PosOG.y - ball.position.y) * 0.02, // y좌표 부분
    };

    Matter.Body.applyForce(ball, ball.position, force); //원의 중심점인 ball.position 기준으로 힘을 적용한다.

    //손 점의 위치(collider위치) 와 원들 사이의 거리 구하기
    let ballDistance = dist(
      handCollider.position.x,
      handCollider.position.y,
      ball.position.x,
      ball.position.y
    );
    // console.log('거리 =>' + ballDistance);

    //원들 사이 거리를 색으로 변환하기 위해 map 사용- 원하는 색을 내기 위해 최대치 값을 임의로 조정
    colorGradientBlue = map(ballDistance, 0, 200, 0, 255); //B
    colorGradientRed = map(ballDistance, 800, 0, 0, 255); //R
    colorGradientGreen = map(ballDistance, 0, 500, 0, 255); //G

    fill(colorGradientRed, colorGradientGreen, colorGradientBlue); //거리에 따라 색 적용
    noStroke();
    // strokeWeight(2);
    // stroke(255, 0, 0);

    //원 그리기
    //거리에 따라 크기를 다르게 그린다.
    if (ballDistance < ball.circleRadius * 5) {
      ellipse(ball.position.x, ball.position.y, ball.circleRadius * 1);
    } else {
      ellipse(ball.position.x, ball.position.y, ball.circleRadius * 2);
    }

    //원 사이 연결을 위해 선 그리기
    //거리에 따라 선 투명도 다르게 하기
    strokeWeight(3);
    if (ballDistance < ball.circleRadius * 4) {
      stroke(255, 255, 255, 5);
    } else {
      stroke(255, 255, 255, 60);
    }

    //선 그리기
    //각자 바로 위에 있는 원과 잇는다.
    if (i >= 10 && i / 10 != 0) {
      let UpperBall = balls[i - 10].ball;
      line(
        ball.position.x,
        ball.position.y,
        UpperBall.position.x,
        UpperBall.position.y
      );
    }
    //왼쪽에 있는 선과 잇는다.
    if (i >= 1 && i % 10 != 0) {
      let LeftBall = balls[i - 1].ball;
      line(
        ball.position.x,
        ball.position.y,
        LeftBall.position.x,
        LeftBall.position.y
      );
    }
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
