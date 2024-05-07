const video = document.getElementById('video')

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("/models"),
]).then(startVideo);

function startVideo() {
    navigator.getUserMedia(
        { video: {} },
        stream => video.srcObject = stream,
        err => console.error(err)
    )
}



const outputImage = document.getElementById('outputImage');
const imgFilter = document.querySelector('.imgFilter');
const fullmoon = document.querySelector('.fullmoon');
let id = null;
let pos = 0;

video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);
    setInterval(async () => {

        // 얼굴 따기
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
        // const resizedDetection = faceapi.resizeResults(detection, displaySize);

        let happiness = 0;


        // 인식되면(값이 있으면) extractFaceFromBox 함수 실행
        if (detection !== undefined) {
            extractFaceFromBox(video, detection.detection.box);
            happiness = detection.expressions.happy;

        } else {
            console.log('인식된 얼굴이 없습니다.');
        }

        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        // 얼굴에 박스 그리기
        // faceapi.draw.drawDetections(canvas, resizedDetections);
        // 랜드마크 그리기
        // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        // faceapi.draw.drawFaceExpressions(canvas, resizedDetections);


        // 웃으면 올라오도록, 
        if (happiness > 0.1) {
            // 웃으면 콘솔에 "웃다"라고 찍힌다
            console.log('웃다');
            if (pos < 140) pos += 8;
        }
        // 안웃으면 내려가도록
        else {
            if (pos > 0) pos -= 2;
        }

        imgFilter.style.bottom = pos + "px";
        outputImage.style.bottom = pos + "px";
        imgFilter.style.width = 150 + pos * 3 + "px";
        imgFilter.style.height = 150 + pos * 3 + "px";
        outputImage.style.width = 150 + pos * 3 + "px";
        outputImage.style.height = 150 + pos * 3 + "px";
    }, 100)
})


// 얼굴인식해서 달 속에 집어넣어주는 함수
async function extractFaceFromBox(inputImage, box) {
    const regionsToExtract = [
        new faceapi.Rect(box.x, box.y, box.width, box.height)
    ]

    let faceImages = await faceapi.extractFaces(inputImage, regionsToExtract)

    if (faceImages.length == 0) {
        console.log('Face not found')
    }
    else {
        faceImages.forEach(cnv => {
            outputImage.style.backgroundImage = `url(${cnv.toDataURL()})`;
            outputImage.style.backgroundBlendMode = 'difference';
        })
    }
}
