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

  var throwables = {
    // ham: {
    //   label: 'Ham',
    //   width: 30,
    //   height: 90,
    //   density: 0.001,
    //   friction: 0.1,
    //   restitution: 0.1,
    //   sprite: 'assets/ham.png'
    // },
    burger: {
      label: 'Burger',
      width: 70,
      height: 55,
      density: 0.001,
      friction: 0.1,
      restitution: 0.1,
      sprite: 'assets/hamburger.png',
      vertices: [
        { x: -12.8, y: -27.5 }, // Top curve left
        { x:   0.0, y: -27.5 }, // Top center apex
        { x:  12.8, y: -27.5 }, // Top curve right
        { x:  26.0, y: -19.8 }, // Upper bun upper-right edge
        { x:  33.0, y:  -8.4 }, // Upper bun lower-right edge
        { x:  35.0, y:   3.8 }, // Lettuce flare right edge
        { x:  33.4, y:  11.1 }, // Lower patty right edge
        { x:  30.3, y:  24.1 }, // Bottom bun lower-right corner
        { x: -30.3, y:  24.1 }, // Bottom bun lower-left corner
        { x: -33.4, y:  11.1 }, // Lower patty left edge
        { x: -11.3, y:  11.1 }, // Tip of the melting cheese drip (center-left)
        { x: -35.0, y:   3.8 }, // Lettuce flare left edge
        { x: -33.0, y:  -8.4 }, // Upper bun lower-left edge
        { x: -26.0, y: -19.8 }  // Upper bun upper-left edge
      ]
    },
    // bowlingBall: {
    //   label: 'Bowling Ball',
    //   width: 70,
    //   height: 70,
    //   chamfer: 35,
    //   density: 0.01,
    //   friction: 0.05,
    //   restitution: 0.2,
    //   sprite: 'assets/bowling-ball.png'
    // },
    fish: {
      label: 'Fish',
      width: 90,
      height: 60,
      density: 0.0005,
      friction: 0.4,
      restitution: 0.05,
      sprite: 'assets/fish.png',
      vertices: [
        { x:  -5.6, y: -21.1 },
        { x:   4.3, y: -21.3 },
        { x:  15.0, y: -17.6 },
        { x:  33.0, y:  -7.3 },
        { x:  41.3, y:  -6.8 },
        { x:  44.8, y:  -4.1 },
        { x:  45.0, y:   3.1 },
        { x:  41.8, y:   7.6 },
        { x:  32.1, y:   8.7 },
        { x:  15.0, y:  18.3 },
        { x:   6.6, y:  21.3 },
        { x: -12.4, y:  21.3 },
        { x: -34.0, y:  14.0 },
        { x: -45.0, y:   4.9 },
        { x: -44.5, y:  -1.4 },
        { x: -24.2, y: -16.0 }
      ]
    },
    rubberDuck: {
      label: 'Rubber Duck',
      width: 55,
      height: 55,
      density: 0.0002,
      friction: 0.05,
      restitution: 0.15,
      sprite: 'assets/rubber-duck.png',
      vertices: [
        { x:  -5.8, y: -27.5 },
        { x:   2.9, y: -26.1 },
        { x:  10.4, y: -17.8 },
        { x:  10.6, y:  -9.4 },
        { x:  21.1, y:  -7.5 },
        { x:  27.5, y:   0.2 },
        { x:  26.0, y:  19.1 },
        { x:  12.0, y:  27.5 },
        { x: -10.1, y:  27.5 },
        { x: -24.4, y:  18.1 },
        { x: -24.6, y:   9.4 },
        { x: -21.3, y:   3.7 },
        { x: -27.5, y: -10.4 },
        { x: -16.0, y: -24.5 }
      ]
    }
  };

  var selectedThrowable = throwables.burger;

  function spawnHammo() {
    var t = selectedThrowable;
    var opts = {
      angle: 0,
      density: t.density,
      friction: t.friction,
      restitution: t.restitution,
      render: { sprite: { texture: t.sprite } }
    };
    if (t.vertices) {
      var body = Bodies.fromVertices(210, 20, [t.vertices], opts);
      // Matter draws the sprite per sub-part when a concave part of a body exists.
      // Suppress that and draw the sprite once at the parent below.
      if (body.parts.length > 1) {
        body.customSprite = t.sprite;
        for (var i = 1; i < body.parts.length; i++) {
          body.parts[i].render.visible = false;
        }
      }
      return body;
    }
    if (t.chamfer) {
      opts.chamfer = { radius: t.chamfer };
    }
    return Bodies.rectangle(210, 20, t.width, t.height, opts);
  }

  var spriteCache = {};
  function getSpriteImg(src) {
    if (!spriteCache[src]) {
      var img = new Image();
      img.src = src;
      spriteCache[src] = img;
    }
    return spriteCache[src];
  }

  var titleScreen = document.getElementById('title-screen');
  var shotsText = document.getElementsByClassName('shots-text');
  var scoreText = document.getElementsByClassName('score-text');

  var pickingNew = false;
  function choosePickerOption(key) {
    selectedThrowable = throwables[key];
    hammo = spawnHammo();
    hammos = [hammo];
    titleScreen.style.display = 'none';
    shotsText[0].style.display = 'block';
    scoreText[0].style.display = 'block';
    World.add(engine.world, hammo);
    pickingNew = false;
  }

  Array.prototype.forEach.call(titleScreen.querySelectorAll('[data-throwable]'), function(btn) {
    var key = btn.getAttribute('data-throwable');
    btn.addEventListener('click', function() { choosePickerOption(key); });
    btn.addEventListener('touchend', function(e) {
      e.preventDefault();
      choosePickerOption(key);
    }, { passive: false });
  });

  World.add(engine.world, mouseConstraint);

  var ground = Bodies.rectangle(400, 610, 810, 60, {
                              isStatic: true,
                            });

  // var basketVertices = Vertices.fromPath('35 7 19 17 14 38 14 58 25 79 45 85 65 84 65 66 46 67 34 59 30 44 33 29 45 23 66 23 66 7 53 7');
  //
  // var basket = Bodies.fromVertices(520, 230, basketVertices, { isStatic: true });

  var tableTop = Matter.Bodies.rectangle(750, 500, 355, 33, {
                        chamfer: { radius: [20, 20, 20, 20] },
                        render: { sprite: { texture: 'assets/tabletop.png', yScale: 0.75}, lineWidth: 0 }
                    });
  var leftLeg = Matter.Bodies.rectangle(605, 572, 20, 110, {
                        render: { sprite: { texture: 'assets/tableleg.png'}, lineWidth: 0 }
                    });
  var rightLeg = Matter.Bodies.rectangle(895, 572, 20, 130, {
                        render: { sprite: { texture: 'assets/tableleg.png'}, lineWidth: 0 }
                    });
  var landingPad = Matter.Body.create({
                        parts: [tableTop, leftLeg, rightLeg],
                        isStatic: true
                    });

  var whacker = Matter.Bodies.rectangle(200, 380, 190, 40, {
                        render: {
                          sprite: {
                            texture: 'assets/spatula.png',
                            xScale: 1.2,
                            yScale: 1.2,
                            yOffset: 0.12,
                            xOffset: 0.14
                          },
                          lineWidth: 0
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

  var whackerFreezeAnchor = { x: 295, y: 380 };
  var whackerFreeze = Constraint.create({
    pointA: whackerFreezeAnchor,
    bodyB: whacker,
    pointB: { x: 95, y: 0 },
    stiffness: 0.5,
    length: 0,
    render: { visible: false }
  });

  // var horseShoe = Vertices.fromPath('100 0 75 50 100 100 25 100 0 50 25 0');
  //
  // var hammo = Bodies.fromVertices(220, 275, horseShoe);
  var hammo = spawnHammo();
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
    whackerFreeze,
    landingPad
  ]);

  var whackerFrozen = true;
  var armWhackerFreeze = true;


  Engine.run(engine);
  Render.run(render);

  //
  //game functionality
  //

  //pulls back whacker on space bar press
  const pullbackPosition = [whackerPullbackAnchor.x, whackerPullbackAnchor.y];
  document.onkeydown = function (keys) {
    if (keys.keyCode === 32) {
      keys.preventDefault();
      if (whackerFrozen) {
        World.remove(engine.world, whackerFreeze);
        whackerFrozen = false;
        armWhackerFreeze = false;
      }
      if (whackerPullbackAnchor.x > 120) {
        World.remove(engine.world, whackerLevel);
        whackerPullbackAnchor.x -= 8;
        whackerPullbackAnchor.y += 8;
      }
    }
  };
  document.onkeyup = function (keys) {
    if (keys.keyCode === 32) {
      keys.preventDefault();
      World.remove(engine.world, whackerPullback);
      whackerPullbackAnchor.x = pullbackPosition[0];
      whackerPullbackAnchor.y = pullbackPosition[1];
      World.add(engine.world, whackerLevel);
    }
  };

  var shotCount = 5;
  var gameOver = false;
  var shotCountText = document.getElementsByClassName('shots-number');

  var scoreNumberText = document.getElementsByClassName('score-number');

  var highScoreText = document.getElementsByClassName('high-score-number');
  
  // Session high score (persists until window is closed)
  if (typeof window.sessionHighScore === 'undefined') {
    window.sessionHighScore = 0;
  }

  var gameOverScreen = document.getElementById('ending-screen');

  gameOverScreen.addEventListener('click', function () {
    this.style.display = "none";
    World.clear(engine.world, false);
    shotCount = 5;
    shotCountText[0].innerText = shotCount;
    gameOver = false;
    scoreNumberText[0].innerText = 0;
    scoreNumberText[1].innerText = 0;

    hammo = spawnHammo();
    hammos = [hammo];
    allDone = false;
    lastShotTime = null;

    World.add(engine.world, [
      whacker,
      whackerPivot,
      whackerSpringAnchor,
      whackerSpring,
      whackerLevel,
      whackerPullback,
      whackerPullbackAnchor,
      whackerFreeze,
      hammo,
      landingPad
    ]);
    whackerFrozen = true;
    armWhackerFreeze = true;

  });

  // Add touch support for game over screen
  gameOverScreen.addEventListener('touchend', function (e) {
    e.preventDefault();
    this.style.display = "none";
    World.clear(engine.world, false);
    shotCount = 5;
    shotCountText[0].innerText = shotCount;
    gameOver = false;
    scoreNumberText[0].innerText = 0;
    scoreNumberText[1].innerText = 0;

    hammo = spawnHammo();
    hammos = [hammo];
    allDone = false;
    lastShotTime = null;

    World.add(engine.world, [
      whacker,
      whackerPivot,
      whackerSpringAnchor,
      whackerSpring,
      whackerLevel,
      whackerPullback,
      whackerPullbackAnchor,
      whackerFreeze,
      hammo,
      landingPad
    ]);
    whackerFrozen = true;
    armWhackerFreeze = true;

  }, { passive: false });

  var chooseNewObjectBtn = document.getElementById('choose-new-object');
  function chooseNewObject(e) {
    e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    gameOverScreen.style.display = 'none';
    shotsText[0].style.display = 'none';
    scoreText[0].style.display = 'none';
    World.clear(engine.world, false);
    shotCount = 5;
    shotCountText[0].innerText = shotCount;
    gameOver = false;
    scoreNumberText[0].innerText = 0;
    scoreNumberText[1].innerText = 0;
    highScoreText[0].innerText = 0;
    window.sessionHighScore = 0;
    hammos = [];
    allDone = false;
    lastShotTime = null;
    pickingNew = true;
    World.add(engine.world, [
      whacker,
      whackerPivot,
      whackerSpringAnchor,
      whackerSpring,
      whackerLevel,
      whackerPullback,
      whackerPullbackAnchor,
      whackerFreeze,
      landingPad
    ]);
    whackerFrozen = true;
    armWhackerFreeze = true;
    titleScreen.style.display = 'flex';
  }
  chooseNewObjectBtn.addEventListener('click', chooseNewObject);
  chooseNewObjectBtn.addEventListener('touchend', chooseNewObject, { passive: false });

  var scoreBounds = Matter.Bounds.create([{ x: 572, y: 0}, { x: 928, y: 480 }]);

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

  // Draw a single sprite at the parent centroid for compound (concave) hammos.
  Events.on(render, 'afterRender', function() {
    var ctx = render.context;
    for (var i = 0; i < hammos.length; i++) {
      var h = hammos[i];
      if (!h.customSprite) continue;
      var img = getSpriteImg(h.customSprite);
      if (!img.complete || !img.naturalWidth) continue;
      ctx.save();
      ctx.translate(h.position.x, h.position.y);
      ctx.rotate(h.angle);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    }
  });

  //releases hammo after reaching a specified point
  Events.on(engine, "afterUpdate", function() {
    if (gameOver) return;
    if (pickingNew) return;

    var hammoX = hammo.position.x;
    var hammoY = hammo.position.y;

    // spawn next hammo when current one leaves play area
    if ((hammoX > 400 || hammoY > 500) && shotCount > 1) {
      hammo = spawnHammo();
      hammos.push(hammo);
      World.add(engine.world, hammo);
      shotCount -= 1;
      shotCountText[0].innerText = shotCount;
      armWhackerFreeze = true;
    } else if ((hammoX > 400 || hammoY > 700) && shotCount === 1) {
      shotCount -= 1;
      shotCountText[0].innerText = shotCount;
      lastShotTime = Date.now();
    }

    if (Composite.allConstraints(engine.world).length === 3 && whacker.position.y < 400) {
      World.add(engine.world, whackerPullback);
    }

    if (armWhackerFreeze
        && !whackerFrozen
        && Math.abs(whacker.angularVelocity) < 0.001
        && Math.abs(whacker.velocity.x) < 0.01
        && Math.abs(whacker.velocity.y) < 0.01
        && whacker.position.y < 400) {
      World.add(engine.world, whackerFreeze);
      whackerFrozen = true;
    }

    var score = calcScore();
    scoreNumberText[0].innerText = score;
    scoreNumberText[1].innerText = score;

    // game over: last shot is done, but wait at least 1.5s after last shot leaves and all hammos are settled
    if (shotCount === 0 && lastShotTime && (Date.now() - lastShotTime > 1500) && areAllHammosDone()) {
      gameOver = true;
      var finalScore = calcScore();
      scoreNumberText[0].innerText = finalScore;
      scoreNumberText[1].innerText = finalScore;
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
    var header = document.getElementById('info-nav');
    if (!wrapper) return;
    wrapper.appendChild(render.canvas);
    function scale() {
      var headerH = (header && header.offsetHeight) || 0;
      var sW = window.innerWidth / 1050;
      var sH = (window.innerHeight - headerH) / 602;
      var s = Math.min(sW, sH, 1);
      wrapper.style.transform = 'scale(' + s + ')';
      wrapper.style.height = (602 * s) + 'px';
      if (s < 1) {
        var leftover = Math.max(window.innerWidth - 1050 * s, 0);
        wrapper.style.marginLeft = (leftover / 2) + 'px';
      } else {
        wrapper.style.marginLeft = '';
      }
    }
    scale();
    window.addEventListener('resize', scale);
    window.addEventListener('orientationchange', scale);

    // Add touch handlers to wrapper for mobile responsiveness
    if (window.matchMedia('(pointer: coarse)').matches) {
      var touchPullInterval = null;

      wrapper.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (whackerFrozen) {
          World.remove(engine.world, whackerFreeze);
          whackerFrozen = false;
          armWhackerFreeze = false;
        }
        if (touchPullInterval) return;
        touchPullInterval = setInterval(function() {
          if (whackerPullbackAnchor.x > 120) {
            World.remove(engine.world, whackerLevel);
            whackerPullbackAnchor.x -= 4;
            whackerPullbackAnchor.y += 4;
          }
        }, 16);
      }, { passive: false });

      wrapper.addEventListener('touchend', function(e) {
        e.preventDefault();
        if (touchPullInterval) {
          clearInterval(touchPullInterval);
          touchPullInterval = null;
        }
        World.remove(engine.world, whackerPullback);
        whackerPullbackAnchor.x = pullbackPosition[0];
        whackerPullbackAnchor.y = pullbackPosition[1];
        World.add(engine.world, whackerLevel);
      }, { passive: false });
    }
  })();

}
