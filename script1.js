const imageUpload = document.getElementById('imageUpload')

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('./models')
]).then(start)

async function start() {
    const container = document.createElement('div')
    container.style.position = 'relative'
    document.body.append(container)
    const labeledFaceDescriptors = await loadLabeledImage()
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
    let image
    let canvas
    document.body.append('준비완료')

    imageUpload.addEventListener('change', async () => {
        if (image) image.remove()
        if (canvas) canvas.remove()
        image = await faceapi.bufferToImage(imageUpload.files[0])
        container.append(image)
        canvas = faceapi.createCanvasFromMedia(image)
        container.append(canvas)
        const displaySize = {width: image.width, height: image.height}
        faceapi.matchDimensions(canvas, displaySize)
        const detections = await faceapi.detectAllFaces(image)
                                .withFaceLandmarks()
                                .withFaceDescriptors()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        const result = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
        result.forEach((result, i) => {
            const box = resizedDetections[i].detection.box
            const drawBox = new faceapi.draw.DrawBox(box, {label: result.toString(), boxColor: 'red'})
            drawBox.draw(canvas)
        })
    })
}
async function resizeImage(image, maxWidth, maxHeight) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
    canvas.width = image.width * ratio;
    canvas.height = image.height * ratio;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // 이미지를 data URL로 반환
    return new Promise(resolve => {
        canvas.toBlob(blob => {
            const newImage = new Image();
            newImage.src = URL.createObjectURL(blob);
            newImage.onload = () => resolve(newImage);
        });
    });
}


function loadLabeledImage() {
    const labels = ['백경민', 'Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark']
    return Promise.all(
        labels.map(async label => {
            const description = []
            const img = await faceapi.fetchImage('known/' + label + '.jpg')
            const detections = await faceapi.detectSingleFace(img)
                                .withFaceLandmarks()
                                .withFaceDescriptor()
            description.push(detections.descriptor)
            return new faceapi.LabeledFaceDescriptors(label, description)
        })
    )
}
