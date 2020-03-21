var video = document.createElement("video");
var canvasElement = document.getElementById("canvas");
var canvas = canvasElement.getContext("2d");
var loadingMessage = document.getElementById("loadingMessage");
var outputContainer = document.getElementById("output");
var outputMessage = document.getElementById("outputMessage");
var outputData = document.getElementById("outputData");

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

function sendRequest(url, options, jsonCallback) {
    fetch(url, options).then(response => {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.indexOf("application/json") !== -1) {
            response.json().then(jsonCallback)
        }
        else { //display error
            response.text().then(text => {
                document.body.innerHTML += "<p> Error: " + text + "</p>"
            })
        }
    })
}

// Use facingMode: environment to attemt to get the front camera on phones
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
    video.srcObject = stream;
    video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
    video.play();
    var q = new QR(video);
    q.onNewData(function(code) {
        const data = {
            id: code
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }
    
        sendRequest('/readForm', options, data => {
            //TODO: Beuatiful output
            const output = document.createElement("div")
            output.innerHTML += "<p> Firstname: " + data.firstname + "</p>"
            output.innerHTML += "<p> Lastname: " + data.lastname + "</p>"
            for (f of data.files) {
                if (f.type.indexOf("image") != -1)
                    output.innerHTML += '<img src="getFile/' + f.fileID + "/>"
                else {
                    let description = ""
                    if (f.description)
                        description = '<label for="button">' + f.description + '</label>'
                    output.innerHTML += '<form action="getFile/' + f.fileID + '">' + description + '<input type="submit" name="button" value="Download"/></form>'
                }
            }
            document.body.appendChild(output)
        })
    });
});

