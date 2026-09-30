const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('faceCanvas'));
const ctx = canvas ? canvas.getContext('2d') : null;

const PIXEL_SIZE = 8;
const GRID_WIDTH = 32;
const GRID_HEIGHT = 32;

if (canvas) {
  canvas.width = GRID_WIDTH * PIXEL_SIZE;
  canvas.height = GRID_HEIGHT * PIXEL_SIZE;
}

let currentExpression = 'happy';
let isTalking = false;
let isBlinking = false;

setInterval(() => {
  if (Math.random() > 0.3) {
    isBlinking = true;
    drawFace();
    setTimeout(() => {
      isBlinking = false;
      drawFace();
    }, 150);
  }
}, 3500);

function drawPixel(x, y, color) {
  if (!ctx) return;
  ctx.fillStyle = color;
  ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
}

function clearCanvas() {
  if (!ctx || !canvas) return;
  ctx.fillStyle = '#11111b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawFace() {
  clearCanvas();
  
  // Sleek dark-slate monochrome palette
  const skinColor = '#313244';   // Dark slate grey
  const eyeColor = '#b4befe';    // Soft muted lavender
  const mouthColor = '#a6adc8';  // Muted light grey

  for (let x = 6; x < 26; x++) {
    for (let y = 6; y < 26; y++) {
      drawPixel(x, y, skinColor);
    }
  }

  if (isBlinking) {
    for (let x = 10; x <= 13; x++) drawPixel(x, 14, eyeColor);
    for (let x = 18; x <= 21; x++) drawPixel(x, 14, eyeColor);
  } else {
    drawEye(10, 12, eyeColor, currentExpression, 'left');
    drawEye(18, 12, eyeColor, currentExpression, 'right');
  }

  drawMouth(currentExpression, isTalking, mouthColor);
}

function drawEye(startX, startY, color, expression, side) {
  if (expression === 'shocked') {
    for (let x = startX; x < startX + 4; x++) {
      for (let y = startY - 1; y < startY + 3; y++) {
        drawPixel(x, y, color);
      }
    }
  } else if (expression === 'sad') {
    for (let x = startX; x < startX + 4; x++) drawPixel(x, startY, color);
    drawPixel(startX + (side === 'left' ? 0 : 3), startY - 1, color);
  } else {
    for (let x = startX; x < startX + 4; x++) {
      for (let y = startY; y < startY + 3; y++) {
        drawPixel(x, y, color);
      }
    }
  }
}

function drawMouth(expression, talking, color) {
  const startY = 20;

  if (talking) {
    for (let x = 13; x <= 18; x++) {
      for (let y = startY; y <= startY + 2; y++) {
        drawPixel(x, y, color);
      }
    }
    return;
  }

  switch (expression) {
    case 'laughing':
    case 'happy':
      for (let x = 12; x <= 19; x++) drawPixel(x, startY + 1, color);
      drawPixel(11, startY, color);
      drawPixel(20, startY, color);
      break;
    case 'sad':
      for (let x = 13; x <= 18; x++) drawPixel(x, startY, color);
      drawPixel(12, startY + 1, color);
      drawPixel(19, startY + 1, color);
      break;
    case 'shocked':
      for (let x = 14; x <= 17; x++) {
        for (let y = startY - 1; y <= startY + 2; y++) {
          drawPixel(x, y, color);
        }
      }
      break;
    case 'thinking':
    default:
      for (let x = 13; x <= 18; x++) drawPixel(x, startY, color);
      break;
  }
}

function speakText(text, expression) {
  currentExpression = expression;
  isTalking = true;

  const talkInterval = setInterval(() => {
    isTalking = !isTalking;
    drawFace();
  }, 180);

  setTimeout(() => {
    clearInterval(talkInterval);
    isTalking = false;
    drawFace();
  }, Math.min(text.length * 50, 4000));
}

window['setTimiExpression'] = (expr) => {
  currentExpression = expr;
  drawFace();
};

window['speakTimiText'] = speakText;

drawFace();