const video = document.getElementById('video'); //웹캠 스트림

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("models/"),
    faceapi.nets.faceLandmark68Net.loadFromUri("models/"),
    faceapi.nets.faceRecognitionNet.loadFromUri("models/"),
    faceapi.nets.faceExpressionNet.loadFromUri("models/"),
]).then(startVideo);

function startVideo() {
    navigator.getUserMedia(
        { video: {} },
        stream => video.srcObject = stream,
        err => console.error(err)
    )
}
// 얼굴감지
video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video)
    document.body.append(canvas)
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        faceapi.draw.drawDetections(canvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
    }, 100)
})

async function loadLabeledImage() {
    const labels = ['백경민', 'Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark'];
    return Promise.all(
        labels.map(async label => {
            const description = [];
            const img = await faceapi.fetchImage('known/' + label + '.jpg');
            const detections = await faceapi.detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor();
            description.push(detections.descriptor);
            return new faceapi.LabeledFaceDescriptors(label, description);
        })
    );
}
