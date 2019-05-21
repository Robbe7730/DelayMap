let ctx;
let canvas;
let train_data = {};
let interval;
let img = new Image();
img.src = '/background.png'

const WIDTH = 1014;
const HEIGHT = 826;

function getTrains() {
    return fetch("/trains.json").then((res) => res.json()).then(drawTrains);
}

function drawTrains(trains) {
    clear();
    trains.forEach(drawTrain);
}

function onLoad() {
    canvas = document.getElementById("field");
    ctx = canvas.getContext("2d");
    getTrains();
    interval = setInterval(getTrains, 5000);
}

function clear() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.stroke();
    ctx.drawImage(img, 0,0);
}

function drawTrain(train) {
    if (train.delay >= 300) {
        ctx.fillStyle = "#FF0000";
    } else if (train.delay > 0) {
        ctx.fillStyle = "#FF9F00";
    } else {
        ctx.fillStyle = "#00FF00";
    }
    ctx.beginPath();
    let x = remap(train.lon, 2.51357303225, 6.15665815596, 0, WIDTH)
    let y = remap(train.lat, 49.5294835476, 51.4750237087, HEIGHT, 0)
    ctx.arc(x, y, 3, 0, 2*Math.PI);
    ctx.fill()
}

function remap(x, in_min, in_max, out_min, out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
