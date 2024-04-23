let pixelInterval;

const Jimp = require('jimp');
const fs = require('fs');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

function start() {
    readline.question('Вы хотите кодировать или декодировать? (введите "к" для кодирования, "д" для декодирования): ', function(mode) {
        if (mode.toLowerCase() !== 'к' && mode.toLowerCase() !== 'д') {
            console.log('Неверный режим. Пожалуйста, введите "к" для кодирования или "д" для декодирования.');
            start();
        } else {
            readline.question('Введите имя файла (без расширения): ', function(filename) {
                if (filename.includes('.')) {
                    console.log('Введено неверное имя файла.');
                    start();
                } else {
                    const imagePath = filename + '.png';
                    fs.access(imagePath, fs.constants.F_OK, (err) => {
                        if (err) {
                            console.log('Файл не найден. Пожалуйста, убедитесь, что файл существует.');
                            start();
                        } else {
                            readline.question('Введите растояние между пикселей: ', function(pixelInterval) {
                                if (isNaN(pixelInterval)) {
                                    console.log('Введено неверное значение. Пожалуйста, введите число.');
                                    start();
                                } else {
                                    pixelInterval = Number(pixelInterval);
                                    if (mode.toLowerCase() === 'к') {
                                        readline.question('Введите текст для кодирования: ', function(text) {
                                            const charArray = Array.from(text);
                                            const outputImagePath = 'out.png';
                                            encodeCharArrayInImage(imagePath, charArray, outputImagePath, pixelInterval)
                                                .then(() => {
                                                    console.log('Текст был закодирован в изображении с растоянием в:', pixelInterval);
                                                    console.log('Длина закодированного текста:', charArray.length);
                                                    start();
                                                });
                                        });
                                    } else if (mode.toLowerCase() === 'д') {
                                        readline.question('Введите длину декодируемого текста: ', function(numChars) {
                                            if (isNaN(numChars)) {
                                                console.log('Введено неверное значение для длины текста. Пожалуйста, введите число.');
                                                start();
                                            } else {
                                                numChars = Number(numChars);
                                                decodeCharArrayFromImage(imagePath, numChars, pixelInterval)
                                                    .then(decodedText => {
                                                        console.log('Декодированный текст из изображения:', decodedText);
                                                        start();
                                                    });
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

start();

async function encodeCharArrayInImage(imagePath, charArray, outputImagePath, pixelInterval) {
    const image = await Jimp.read(imagePath);
    const { width, height } = image.bitmap;

    let charIndex = 0;
    let segmentIndex = 0;

    for (let i = 0; i < charArray.length * 4; i++) {
        const y = Math.floor((i * pixelInterval) / width);
        const x = (i * pixelInterval) % width;
        if (y < height) {
            const pixelColor = image.getPixelColor(x, y);
            const asciiCode = charArray[charIndex].charCodeAt(0);
            const segment = (asciiCode >> (6 - segmentIndex * 2)) & 0x03; 
            const redChannel = (pixelColor >> 24) & 0xFF;
            const greenChannel = (pixelColor >> 16) & 0xFF;
            const blueChannel = (pixelColor >> 8) & 0xFF;
            const alphaChannel = (pixelColor & 0xFC) | segment; 
            const newColor = ((redChannel << 24) | (greenChannel << 16) | (blueChannel << 8) | alphaChannel) >>> 0;
            image.setPixelColor(newColor, x, y);

            segmentIndex++;
            if (segmentIndex > 3) {
                segmentIndex = 0;
                charIndex++;
            }
        } else {
            break;
        }
    }

    await image.writeAsync(outputImagePath);
}


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
            const segment = alphaChannel & 0x03; 
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