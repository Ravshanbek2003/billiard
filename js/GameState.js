import { GameUI } from "./GameUI.js";
import { GameAI } from "./GameAI.js";
import { Vector2, Raycaster } from "../../libs/three137/three.module.js";

class GameState {
  constructor(game) {
    this.game = game;
    this.ui = new GameUI();
    this.ai = new GameAI(this.game);
    this.playerBalls = [];
    this.aiOn = false;
    this.turnTimer = 0;
    this.initGame();
    this.charging = false;
    const btn = document.getElementById("playBtn");
    const aiBtn = document.getElementById("aiBtn");
    aiBtn.addEventListener("click", (evt) => {
      this.aiOn = !this.aiOn;
      aiBtn.innerHTML = this.aiOn ? true : false;
      if (!this.aiOn) {
        this.ai.stopAutoRotate();
      } else {
        if (this.turn == "player2") {
          this.ai.autoRotate();
        }
      }
    });
    btn.onclick = this.startGame.bind(this);
    document.addEventListener("keydown", this.keydown.bind(this));
    document.addEventListener("keyup", this.keyup.bind(this));
    document.addEventListener("click", this.onClick.bind(this));
  }

  showPlayBtn() {
    this.ui.show("playBtn");
  }

  startGame() {
    this.ui.showGameHud(true);
    this.game.reset();
    this.ui.hide("message");
    this.initGame();
    this.startTurn();
  }

  keydown(evt) {
    if (this.state !== "turn") return;
    if (this.aiOn && this.turn == "player2") return;

    if (evt.keyCode == 32) {
      this.ui.strengthBar.visible = true;
    }
  }

  keyup(evt) {
    if (this.state !== "turn") return;
    if (this.aiOn && this.turn == "player2") return;
    if (evt.keyCode == 32) {
      this.ui.strengthBar.visible = false;
      this.hit(this.ui.strengthBar.strength);
    }
  }

  onClick(evt) {
    if (this.aiOn && this.turn == "player2") return;
    if (this.state !== "turn") return;
    const mouse = new Vector2();
    mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;
    const raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, this.game.camera);
    const intersects = raycaster.intersectObjects(
      this.game.scene.children,
      true
    );

    if (intersects.length > 0) {
      if (!this.charging) {
        if (intersects[0].object.name == "ball0") {
          this.ui.strengthBar.visible = true;
          this.charging = true;
        }
      } else {
        this.ui.strengthBar.visible = false;
        this.charging = false;
        this.hit(this.ui.strengthBar.strength);
      }
    }
  }

  playerTargetBallSet(player) {
    if (this.sides[this.turn] == "?") {
      return this.numberedBallsOnTable;
    }

    const ballSet = [];
    if (this.sides[this.turn] == "solid") {
      for (let i = 1; i < 8; i++) {
        if (this.numberedBallsOnTable.includes(i)) {
          ballSet.push(i);
        }
      }
    } else {
      for (let i = 9; i < 16; i++) {
        if (this.numberedBallsOnTable.includes(i)) {
          ballSet.push(i);
        }
      }
    }
    if (ballSet.length == 0) {
      ballSet.push(8);
    }
    return ballSet;
  }

  initGame() {
    this.numberedBallsOnTable = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ];

    this.turn = "player1";

    this.sides = {
      player1: "?",
      player2: "?",
    };

    this.pocketingOccurred = false;

    this.state = "notstarted";

    this.ticker = undefined;
  }

  startTurn() {
    if (this.state == "gameover") return;
    this.timer = 30;
    this.tickTimer();
    this.state = "turn";

    this.ui.updateTurn(this.turn);
    if (this.turn == "player1") {
      this.ai.stopAutoRotate();
    }
    this.ui.updateBalls(this.numberedBallsOnTable, this.sides);
    const str = this.turn == "player1" ? "1-Oyinchi" : "2-Oyinchi";
    this.ui.log(`${str} o'ynayabdi`);

    if (this.turn == "player2") {
      this.ai.state = "aim";
    }
  }

  whiteBallEnteredHole() {
    this.ui.log(
      `Oq shar teshikka tushdi ${
        this.turn == "player1" ? "1-Oyinchi" : "2-Oyinchi"
      }!`
    );
  }

  coloredBallEnteredHole(id) {
    if (id === undefined) return;
    this.playerBalls = this.playerTargetBallSet(this.turn);

    this.numberedBallsOnTable = this.numberedBallsOnTable.filter((num) => {
      return num != id;
    });

    if (id == 0) return;

    if (id == 8) {
      if (this.playerBalls.length > 1) {
        this.ui.log(
          `O'yin tugadi! 8-shar muddatidan oldin teshikka tushdi ${this.turn}`
        );
        this.turn = this.turn == "player1" ? "player2" : "player1";
      }

      this.pocketingOccurred = true;

      this.endGame();
    } else {
      if (this.sides.player1 == "?" || this.sides.player2 == "?") {
        this.sides[this.turn] = id < 8 ? "solid" : "striped";
        this.sides[this.turn == "player1" ? "player2" : "player1"] =
          id > 8 ? "solid" : "striped";
        this.pocketingOccurred = true;
      } else {
        if (
          (this.sides[this.turn] == "solid" && id < 8) ||
          (this.sides[this.turn] == "striped" && id > 8)
        ) {
          this.pocketingOccurred = true;
        } else {
          this.pocketingOccurred = false;
          this.ui.log(`${this.turn} raqib to‘pini urdi!`);
        }
      }
    }
  }

  tickTimer() {
    this.ui.updateTimer(this.timer);
    if (this.timer == 0) {
      this.ui.log(
        `${this.turn == "player1" ? "1-Oyinchi" : "2-Oyinchi"} Vaqt tugadi`
      );
      this.state = "outoftime";
      this.switchSides();
      setTimeout(this.startTurn.bind(this), 1000);
    } else {
      this.timer--;
      this.ticker = setTimeout(this.tickTimer.bind(this), 1000);
    }
  }

  switchSides() {
    this.turn = this.turn == "player1" ? "player2" : "player1";
  }

  endGame() {
    this.state = "gameover";
    const winner = this.turn == "player1" ? "1-Oyinchi" : "2-Oyinchi";
    clearTimeout(this.ticker);
    this.ui.showMessage(`${winner} yutdi`, "");
  }

  hit(strength) {
    this.game.strikeCueball(strength);
    clearTimeout(this.ticker);
    this.state = "turnwaiting";
  }

  checkSleeping(dt) {
    if (!this.game.cueball.isSleeping) return;

    for (let i = 1; i < this.game.balls.length; i++) {
      if (
        !this.game.balls[i].isSleeping &&
        this.numberedBallsOnTable.indexOf(
          Number(game.balls[i].name.split("ball")[0])
        ) > -1
      ) {
        return;
      }
    }
    this.turnTimer += dt;
    if (this.turnTimer > 2) {
      if (!this.pocketingOccurred) this.switchSides();
      this.pocketingOccurred = false;
      setTimeout(this.startTurn.bind(this), 1000);
      this.state = "paused";
      this.turnTimer = 0;
    }
  }

  update(dt) {
    if (this.state == "turnwaiting") this.checkSleeping(dt);
    this.ui.update();

    if (this.aiOn) {
      this.ai.update(dt);
    }
  }
}

export { GameState };
