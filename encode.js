const Jimp = require('jimp');
const fs = require('fs');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const imagePath = 'inp.png';
const outputImagePath = 'out.png';
const outputFilePath = 'encodedData.txt';

// Функция для шифрования массива символов в изображении
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
            const segment = (asciiCode >> (6 - segmentIndex * 2)) & 0x03; // Берем сегмент по 2 бита
            const redChannel = (pixelColor >> 24) & 0xFF;
            const greenChannel = (pixelColor >> 16) & 0xFF;
            const blueChannel = (pixelColor >> 8) & 0xFF;
            const alphaChannel = (pixelColor & 0xFC) | segment; // Заменяем 2 последних бита альфа-канала
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

readline.question('Введите текст для шифрования: ', inputText => {
    const charArray = Array.from(inputText);
    readline.question('Введите расстояние между пикселями: ', pixelInterval => {
        encodeCharArrayInImage(imagePath, charArray, outputImagePath, parseInt(pixelInterval))
            .then(() => {
                console.log('Текст был закодирован в изображении.');
                const encodedData = {
                    textLength: charArray.length,
                    pixelInterval: parseInt(pixelInterval)
                };
                fs.writeFileSync(outputFilePath, JSON.stringify(encodedData));
                console.log(`Данные о шифровании были записаны в файл ${outputFilePath}`);
                readline.close();
            });
    });
});
