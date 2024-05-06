const video = document.getElementById('video');
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models') 
]).then(startVideo);


async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
    } catch (err) {
        console.error("An error occurred: " + err);
    }
}

video.addEventListener('play', async () => {
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
        const labeledFaceDescriptors = await loadLabeledImage();
        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

        resizedDetections.forEach(detection => {
            const box = detection.detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, { label: faceMatcher.findBestMatch(detection.descriptor).toString() });
            drawBox.draw(canvas);
        });
    }, 100);
});

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
