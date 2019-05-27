let ctx;
let canvas;
let train_data = {};
let interval;
let img = new Image();
img.src = '/background.png';

const WIDTH = 1014;
const HEIGHT = 826;

const delay_legenda = {
    red: 6,
    orange: 0
};

function drawLegenda() {
    const legendaWidth = 200;
    const legendaHeight = 100;
    const textHeight = 22;
    let currTextHeight = 0;
    // Print a background
    // We need the save and restore to reset the alpha value
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#c2d6d6";
    ctx.fillRect(WIDTH - legendaWidth, 0, legendaWidth, legendaHeight);
    ctx.restore();

    // Print the legenda text
    ctx.fillStyle = "#000000";
    ctx.font = "bold 18px Arial";
    ctx.fillText("Legenda", WIDTH - legendaWidth + 20, currTextHeight+=textHeight);
    ctx.font = "16px Arial";
    ctx.fillText("Green: No delay", WIDTH - legendaWidth + 20, currTextHeight+=textHeight);
    ctx.fillText("Orange: >" + delay_legenda.orange + " minutes", WIDTH - legendaWidth + 20, currTextHeight+=textHeight);
    ctx.fillText("Red: >" + delay_legenda.red + " minutes", WIDTH - legendaWidth + 20, currTextHeight+=textHeight);
}

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
    clear();
    getTrains();
    interval = setInterval(getTrains, 5000);
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.stroke();
    ctx.drawImage(img, 0, 0);
    drawLegenda();
}

function drawTrain(train) {
    if (train.delay >= delay_legenda.red * 60) {
        ctx.fillStyle = "#FF0000";
    } else if (train.delay > delay_legenda.orange * 60) {
        ctx.fillStyle = "#FF9F00";
    } else {
        ctx.fillStyle = "#00FF00";
    }
    ctx.beginPath();
    let x = remap(train.lon, 2.51357303225, 6.15665815596, 0, WIDTH);
    let y = remap(train.lat, 49.5294835476, 51.4750237087, HEIGHT, 0);
    ctx.arc(x, y, 3, 0, 2 * Math.PI);;
    ctx.fill();
}

function remap(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
