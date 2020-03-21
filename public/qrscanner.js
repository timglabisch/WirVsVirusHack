var video = document.createElement("video");
var canvasElement = document.getElementById("canvas");
var canvas = canvasElement.getContext("2d");
var loadingMessage = document.getElementById("loadingMessage");

class QR {
    constructor(video, canvas) {
        this.newData = null;
        this.video = video;
        requestAnimationFrame(this.tick.bind(this));
    }

    onNewData(cb) {
        this.newData = cb;
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
            if (!code) {
                requestAnimationFrame(this.tick.bind(this));
                return;
            }

            if (this.newData) {
                this.newData(code)
            }

            this.drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
            this.drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
            this.drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
            this.drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
        }
        requestAnimationFrame(this.tick.bind(this));
    }

}

// Use facingMode: environment to attemt to get the front camera on phones
navigator.mediaDevices.getUserMedia({video: {facingMode: "environment"}}).then(function (stream) {
    video.srcObject = stream;
    video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
    video.play();
    var q = new QR(video);
    q.onNewData(function (code) {
            $('html, body').animate({
                scrollTop: $("outputforms").offset().top
            }, 0);
        try {
            var codeContents = JSON.parse(code.data);
        } catch (e) {
            if (console) {
                console.log(e);
            }
            return;
        }

        codeContents.forEach(function (item, i) {
            jQuery('#' + (i  + 1)).val(item);
        });
    });
});
