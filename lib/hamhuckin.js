function gameStart() {
  // Lock to landscape orientation on mobile
  if (window.screen && window.screen.orientation) {
    window.screen.orientation.lock('landscape').catch(function() {});
  }

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
    element: document.getElementById('canvas-wrapper'),
    engine: engine,
    options: {
      width: 1050,
      height: 602,
      wireframes: false,
      background: '#69A2B0'
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
  var titleDismissed = false;
  function dismissTitle() {
    if (titleDismissed) return;
    titleDismissed = true;
    startButton.style.display = "none";
    World.add(engine.world, hammo);
  }
  startButton.addEventListener('click', dismissTitle);
  startButton.addEventListener('touchstart', function (e) {
    e.preventDefault();
    e.stopPropagation();
    dismissTitle();
  }, { passive: false });
  // Swallow the trailing touchend so the document-level listener doesn't
  // immediately fire releasePullback() on a pullback that never started.
  startButton.addEventListener('touchend', function (e) {
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false });

  World.add(engine.world, mouseConstraint);


  var ground = Bodies.rectangle(400, 610, 810, 60, {
                              isStatic: true,
                            });

  // var basketVertices = Vertices.fromPath('35 7 19 17 14 38 14 58 25 79 45 85 65 84 65 66 46 67 34 59 30 44 33 29 45 23 66 23 66 7 53 7');
  //
  // var basket = Bodies.fromVertices(520, 230, basketVertices, { isStatic: true });

  var landingPad =  Matter.Bodies.rectangle(750, 500, 315, 50, {
                        chamfer: { radius: [25, 25, 25, 25] },
                        isStatic: true,
                        render: {
                          fillStyle: "#593837",
                        }
                    });

  landingPad.render.fillStyle = "#593837";

  var whacker = Matter.Bodies.rectangle(200, 380, 190, 40, {
                              render: {
                                fillStyle: '#593837',
                                strokeStyle: '#593837'
                              }
                            });

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
  var whackerLevelAnchor = { x: 295, y: 380 };
  var whackerLevel = Constraint.create({
    pointA: whackerLevelAnchor,
    bodyB: whacker,
    pointB: { x: 95, y: 0 },
    stiffness: .1,
    render: { visible: false }
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

  var hammo = Bodies.rectangle(220, 20, 30, 90, { angle: 40, render: { sprite: { texture: 'assets/ham.png' } } });
  var hammos = [hammo];

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
    whackerLevel,
    whackerPullback,
    whackerPullbackAnchor,
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
      World.remove(engine.world, whackerLevel);
      whackerPullbackAnchor.x -= 8;
      whackerPullbackAnchor.y += 8;
    }
  };
  document.onkeyup = function (keys) {
    if (keys.keyCode === 32) {
      World.remove(engine.world, whackerPullback);
      whackerPullbackAnchor.x = pullbackPosition[0];
      whackerPullbackAnchor.y = pullbackPosition[1];
      World.add(engine.world, whackerLevel);
    }
  };

  var shotCount = 5;
  var gameOver = false;
  var shotCountText = document.getElementsByClassName('shots-number');

  var scoreText = document.getElementsByClassName('score-number');

  var highScoreText = document.getElementsByClassName('high-score-number');
  
  // Session high score (persists until window is closed)
  if (typeof window.sessionHighScore === 'undefined') {
    window.sessionHighScore = 0;
  }

  var gameOverScreen = document.getElementById('ending-screen');
  var restartLock = false;
  function restartGame() {
    if (restartLock) return;
    restartLock = true;
    gameOverScreen.style.display = "none";
    World.clear(engine.world, false);
    shotCount = 5;
    shotCountText[0].innerText = shotCount;
    gameOver = false;
    scoreText[0].innerText = 0;
    scoreText[1].innerText = 0;

    hammo = Bodies.rectangle(220, 20, 30, 90, { angle: 40, render: { sprite: { texture: 'assets/ham.png' } } });
    hammos = [hammo];
    lastShotTime = null;

    World.add(engine.world, [
      whacker,
      whackerPivot,
      whackerSpringAnchor,
      whackerSpring,
      whackerLevel,
      whackerPullback,
      whackerPullbackAnchor,
      hammo,
      landingPad
    ]);
    setTimeout(function() { restartLock = false; }, 300);
  }
  gameOverScreen.addEventListener('click', restartGame);
  gameOverScreen.addEventListener('touchstart', function (e) {
    e.preventDefault();
    e.stopPropagation();
    restartGame();
  }, { passive: false });
  gameOverScreen.addEventListener('touchend', function (e) {
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false });

  var scoreBounds = Matter.Bounds.create([{ x: 592, y: 0}, { x: 908, y: 480 }]);

  function isHammoDone(h) {
    var offScreen = h.position.x > 400 || h.position.y > 700;
    var settled = h.speed < 0.25 && h.angularSpeed < 0.05;
    return offScreen || settled;
  }

  function areAllHammosDone() {
    return hammos.every(function(h) {
      var offScreen = h.position.x > 400 || h.position.y > 700;
      var settled = h.speed < 0.01 && h.angularSpeed < 0.01;
      return offScreen || settled;
    });
  }

  function calcScore() {
    var inBounds = Matter.Query.region(hammos, scoreBounds, false);
    return inBounds.filter(function(h) {
      return h.position.y <= 700 && h.speed < 2;
    }).length;
  }

  var lastShotTime = null;

  //releases hammo after reaching a specified point
  Events.on(engine, "afterUpdate", function() {
    if (gameOver) return;

    var hammoX = hammo.position.x;
    var hammoY = hammo.position.y;

    // spawn next hammo when current one leaves play area
    if ((hammoX > 400 || hammoY > 500) && shotCount > 1) {
      hammo = Bodies.rectangle(220, 20, 30, 90, { angle: 40, render: { sprite: { texture: 'assets/ham.png' } } });
      hammos.push(hammo);
      World.add(engine.world, hammo);
      shotCount -= 1;
      shotCountText[0].innerText = shotCount;
    } else if ((hammoX > 400 || hammoY > 700) && shotCount === 1) {
      shotCount -= 1;
      shotCountText[0].innerText = shotCount;
      lastShotTime = Date.now();
    }

    if (Composite.allConstraints(engine.world).length === 3 && whacker.position.y < 400) {
      World.add(engine.world, whackerPullback);
    }

    var score = calcScore();
    scoreText[0].innerText = score;
    scoreText[1].innerText = score;

    // game over: last shot is done, but wait at least 1.5s after last shot leaves and all hammos are settled
    if (shotCount === 0 && lastShotTime && (Date.now() - lastShotTime > 1500) && areAllHammosDone()) {
      gameOver = true;
      var finalScore = calcScore();
      scoreText[0].innerText = finalScore;
      scoreText[1].innerText = finalScore;
      if (finalScore > window.sessionHighScore) {
        window.sessionHighScore = finalScore;
      }
      highScoreText[0].innerText = window.sessionHighScore;
      gameOverScreen.style.display = 'flex';
    }
  });

  function checkEnd() {
  }

  (function applyMobileScale() {
    var wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;
    function scale() {
      var isMobile = window.matchMedia('(pointer: coarse)').matches;
      if (!isMobile) {
        wrapper.style.transform = '';
        wrapper.style.transformOrigin = '';
        wrapper.style.position = '';
        wrapper.style.left = '';
        wrapper.style.top = '';
        return;
      }
      var PADDING = 8;
      var navHeight = document.getElementById('info-nav').offsetHeight;
      var vw = document.documentElement.clientWidth;
      var vh = document.documentElement.clientHeight;
      var availableWidth = vw - PADDING * 2;
      var availableHeight = vh - navHeight - PADDING * 2;
      var s = Math.min(availableWidth / 1050, availableHeight / 602);
      var left = (vw - 1050 * s) / 2;
      var top = navHeight + PADDING + (availableHeight - 602 * s) / 2;

      wrapper.style.transformOrigin = 'top left';
      wrapper.style.transform = 'scale(' + s + ')';
      wrapper.style.position = 'absolute';
      wrapper.style.left = left + 'px';
      wrapper.style.top = top + 'px';
    }
    scale();
    // iOS Chrome viewport dimensions can be wrong on initial load; rescale
    // after first paint and once after the URL bar settles
    requestAnimationFrame(scale);
    setTimeout(scale, 300);
    window.addEventListener('resize', scale);
    window.addEventListener('orientationchange', function() {
      setTimeout(scale, 200);
    });

    // Add touch handlers for mobile — attach to document so any tap anywhere
    // on the page acts as the pullback gesture (independent of the scaled canvas).
    if (window.matchMedia('(pointer: coarse)').matches) {
      var touchPullInterval = null;

      function startPullback() {
        if (touchPullInterval) return;
        touchPullInterval = setInterval(function() {
          if (whackerPullbackAnchor.x > 120) {
            World.remove(engine.world, whackerLevel);
            whackerPullbackAnchor.x -= 4;
            whackerPullbackAnchor.y += 4;
          }
        }, 16);
      }

      function releasePullback() {
        if (touchPullInterval) {
          clearInterval(touchPullInterval);
          touchPullInterval = null;
        }
        World.remove(engine.world, whackerPullback);
        whackerPullbackAnchor.x = pullbackPosition[0];
        whackerPullbackAnchor.y = pullbackPosition[1];
        World.add(engine.world, whackerLevel);
      }

      function isOverlayVisible() {
        var t = document.getElementById('title-screen');
        var e = document.getElementById('ending-screen');
        var titleVisible = t && t.style.display !== 'none';
        var endingVisible = e && e.style.display !== 'none' && e.style.display !== '';
        return titleVisible || endingVisible;
      }

      document.addEventListener('touchstart', function(e) {
        if (isOverlayVisible()) return;
        e.preventDefault();
        startPullback();
      }, { passive: false });

      document.addEventListener('touchend', function(e) {
        if (isOverlayVisible()) return;
        e.preventDefault();
        releasePullback();
      }, { passive: false });

      document.addEventListener('touchcancel', function(e) {
        if (isOverlayVisible()) return;
        releasePullback();
      }, { passive: false });
    }
  })();

}
