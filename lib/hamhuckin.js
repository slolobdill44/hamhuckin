function gameStart() {
  var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Bounds = Matter.Bounds,
    Composite = Matter.Composite,
    Composites = Matter.Composites,
    Vertices = Matter.Vertices,
    Constraint = Matter.Constraint,
    MouseConstraint = Matter.MouseConstraint,
    Events = Matter.Events;

  var engine = Engine.create();

  var render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      width: 1050,
      wireframeBackground: '#888',
      wireFrames: false
    }
  });

  var runner = Runner.create();
    Runner.run(runner, engine);

  var mouseConstraint = Matter.MouseConstraint.create(engine, {
            body: hammo,
            constraint: {
              stiffness: .7
            }
        });

  var startButton = document.getElementById('title-screen');
  startButton.addEventListener('click', function () {
    this.style.display = "none";
  });

  World.add(engine.world, mouseConstraint);


  var ground = Bodies.rectangle(400, 610, 810, 60, {
                              isStatic: true,
                            });

  // var basketVertices = Vertices.fromPath('35 7 19 17 14 38 14 58 25 79 45 85 65 84 65 66 46 67 34 59 30 44 33 29 45 23 66 23 66 7 53 7');
  //
  // var basket = Bodies.fromVertices(520, 230, basketVertices, { isStatic: true });

  var landingPad =  Bodies.rectangle(650, 500, 200, 50, {
                        chamfer: { radius: [25, 25, 25, 25] },
                        isStatic: true,
                        render: {
                          fillStyle: "#90DDF0"
                        }
                    });

  landingPad.render.fillStyle = "#90DDF0";

  var whacker = Bodies.rectangle(200, 380, 190, 40, {render: { fillStyle: '#1919FF'}});

  whacker.render.sprite = "../assets/ham.png";

  var whackerAnchor = { x: 125, y: 385 };
  var whackerPivot = Constraint.create({
    pointA: whackerAnchor,
    bodyB: whacker,
    pointB: { x: -75, y: 5 },
    stiffness: 1
  });
  var whackerSpringAnchor = { x: 325, y: 375 };
  var whackerSpring = Constraint.create({
    pointA: whackerSpringAnchor,
    bodyB: whacker,
    pointB: { x: 75, y: 5 },
    stiffness: .2,
    render: {
      lineWidth: 0.01,
      strokeStyle: '#dfa417'
    }
  });
  var whackerPullbackAnchor = { x: 220, y: 410 };
  var whackerPullback = Constraint.create({
    pointA: whackerPullbackAnchor,
    bodyB: whacker,
    pointB: { x: 70, y: 5 },
    stiffness: .2,
    render: {
      lineWidth: 0.01,
      strokeStyle: '#dfa417'
    }
  });

  // var horseShoe = Vertices.fromPath('100 0 75 50 100 100 25 100 0 50 25 0');
  //
  // var hammo = Bodies.fromVertices(220, 275, horseShoe);

  var hammo = Bodies.rectangle(220, 275, 30, 90, { angle: 40 });

  hammo.render.sprite = '../assets/ham.png';

  //attaches hammo to an anchor
  // var anchor = { x: 270, y: 275 };
  // var elastic = Constraint.create({
  //         pointA: anchor,
  //         bodyB: hammo,
  //         pointB: { x: 15, y: 15 },
  //         stiffness: 0.05,
  //         render: {
  //             lineWidth: 5,
  //             strokeStyle: '#dfa417'
  //         }
  //     });


  World.add(engine.world, [
    whacker,
    whackerPivot,
    whackerSpringAnchor,
    whackerSpring,
    whackerPullback,
    whackerPullbackAnchor,
    hammo,
    landingPad
  ]);


  Engine.run(engine);
  Render.run(render);

  //
  //game functionality
  //

  //pulls back whacker on space bar press
  const pullbackPosition = [whackerPullbackAnchor.x, whackerPullbackAnchor.y];
  document.onkeydown = function (keys) {
    if (keys.keyCode === 32 && whackerPullbackAnchor.x > 120) {
      whackerPullbackAnchor.x -= 8;
      whackerPullbackAnchor.y += 8;
    }
  };
  document.onkeyup = function (keys) {
    if (keys.keyCode === 32) {
      World.remove(engine.world, whackerPullback);
      whackerPullbackAnchor.x = pullbackPosition[0];
      whackerPullbackAnchor.y = pullbackPosition[1];
    }
  };

  var shotCount = 5;
  var shotCountText = document.getElementsByClassName('shots-number');

  var scoreText = document.getElementsByClassName('score-number');

  var highScoreText = document.getElementsByClassName('high-score-number');
  
  // Session high score (persists until window is closed)
  if (typeof window.sessionHighScore === 'undefined') {
    window.sessionHighScore = 0;
  }

  var gameOverScreen = document.getElementById('ending-screen');

  gameOverScreen.addEventListener('click', function () {
    this.style.display = "none";
    World.clear(engine.world, false);
    shotCount = 6;
    scoreText[0].innerText = 0;
    scoreText[1].innerText = 0;

    World.add(engine.world, [
      whacker,
      whackerPivot,
      whackerSpringAnchor,
      whackerSpring,
      whackerPullback,
      whackerPullbackAnchor,
      hammo,
      landingPad
    ]);

  });

  var scoreBounds = Matter.Bounds.create([{ x: 565, y: 0}, { x: 730, y: 470 }]);

  //releases hammo after reaching a specified point
  Events.on(engine, "afterUpdate", function() {
    var hammoX = hammo.position.x;
    var hammoY = hammo.position.y;

    if ((hammoX > 400 || hammoY > 700) && shotCount > 1) {
        hammo = Bodies.rectangle(220, 20, 30, 90, { angle: 40 });
        World.add(engine.world, hammo);

        shotCount -= 1;
        shotCountText[0].innerText = shotCount;
    } else if ((hammoX > 400 || hammoY > 700) && shotCount === 1) {

      shotCount -= 1;
      shotCountText[0].innerText = shotCount;
    }

    if (Composite.allConstraints(engine.world).length === 3 && whacker.position.y < 400) {
      World.add(engine.world, whackerPullback);
    }

    var objects = Composite.allBodies(engine.world);

    var scoreQuery = Matter.Query.region(objects, scoreBounds, false);

    scoreText[0].innerText = scoreQuery.length;
    scoreText[1].innerText = scoreQuery.length;

    if (shotCount === 0 && (hammoX > 250 && ((hammo.speed < 0.29) || hammoY > 640))) {
      // Update high score if current score is higher
      var currentScore = parseInt(scoreText[0].innerText) || 0;
      if (currentScore > window.sessionHighScore) {
        window.sessionHighScore = currentScore;
      }
      highScoreText[0].innerText = window.sessionHighScore;
      
      gameOverScreen.style.display = 'inherit';
    }
  });

  function checkEnd() {
  }

}
