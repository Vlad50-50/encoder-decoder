const Jimp = require('jimp');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const imagePath = 'out.png';

// Функция для декодирования массива символов из изображения
async function decodeCharArrayFromImage(imagePath, numChars, pixelInterval) {
    const image = await Jimp.read(imagePath);
    const { width, height } = image.bitmap;

    let charArray = [];
    let charCode = 0;
    let segmentIndex = 0;

    for (let i = 0; i < numChars * 4; i++) {
        const y = Math.floor((i * pixelInterval) / width);
        const x = (i * pixelInterval) % width;
        if (y < height) {
            const pixelColor = image.getPixelColor(x, y);
            const alphaChannel = pixelColor & 0xFF;
            const segment = alphaChannel & 0x03; // Берем только 2 последних бита
            charCode |= segment << (6 - segmentIndex * 2);

            segmentIndex++;
            if (segmentIndex > 3) {
                const char = String.fromCharCode(charCode);
                charArray.push(char);
                charCode = 0;
                segmentIndex = 0;
            }
        } else {
            break;
        }
    }

    return charArray.join('');
}

readline.question('Введите длину зашифрованного сообщения: ', numChars => {
    readline.question('Введите расстояние между пикселями: ', pixelInterval => {
        decodeCharArrayFromImage(imagePath, parseInt(numChars), parseInt(pixelInterval))
            .then(decodedText => {
                console.log('Декодированный текст из изображения:', decodedText);
                readline.close();
            });
    });
});
