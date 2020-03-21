var video = document.createElement("video");
var canvasElement = document.getElementById("canvas");
var canvas = canvasElement.getContext("2d");
var loadingMessage = document.getElementById("loadingMessage");
var outputContainer = document.getElementById("output");
var outputMessage = document.getElementById("outputMessage");
var outputData = document.getElementById("outputData");

class QR {
    constructor(video, canvas) {
        this.onNewData = null;
        this.video = video;
        requestAnimationFrame(this.tick.bind(this));
    }

    onNewData(cb) {
        this.onNewData = cb;
    }

    drawLine(begin, end, color) {
        canvas.beginPath();
        canvas.moveTo(begin.x, begin.y);
        canvas.lineTo(end.x, end.y);
        canvas.lineWidth = 4;
        canvas.strokeStyle = color;
        canvas.stroke();
    }

    tick() {
        // loadingMessage.innerText = "⌛ Loading video...";
        if (this.video.readyState === video.HAVE_ENOUGH_DATA) {
            loadingMessage.hidden = true;

            canvasElement.height = this.video.videoHeight;
            canvasElement.width = this.video.videoWidth;
            canvas.drawImage(this.video, 0, 0, canvasElement.width, canvasElement.height);
            var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            var code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            if (code) {
                console.log('is code...');
                drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
                drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
                drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
                drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
                outputMessage.hidden = true;
                outputData.parentElement.hidden = false;
                outputData.innerText = code.data;
                if(!outputContainer.classList.contains("redbg")) {
                    outputContainer.classList.add("redbg")
                }
            } else {
                console.log('no code...');
                outputMessage.hidden = true;
                outputData.parentElement.hidden = false;
                if(outputContainer.classList.contains("redbg")) {
                    outputContainer.classList.remove("redbg")
                }
            }
        }
        requestAnimationFrame(this.tick.bind(this));
    }

}

// Use facingMode: environment to attemt to get the front camera on phones
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
    video.srcObject = stream;
    video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
    video.play();
    (new QR(video))
});

