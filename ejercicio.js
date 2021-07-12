function build_kernel(divisor, matrix) {
    return matrix.map(row => row.map(v => v / divisor));
}

const KERNELS = {
    'floyd-steinberg': build_kernel(16, [
        [0, 0, 7],
        [3, 5, 1],
    ]),
    'jarvis-judice': build_kernel(48, [
        [0, 0, 0, 7, 5],
        [3, 5, 7, 3, 5],
        [1, 3, 5, 3, 1],
    ])
}

function get_index(image, x, y) {
    return (x + y * image.width) * 4;
}

function update_neighbour(x, y, image, quant_error, coefficient) {
    const index = get_index(image, x, y);
    for (let i = 0; i < 3; i++) {
        image.data[index + i] += quant_error[i] * coefficient;
    }
}

const INTENSITIES = [...new Array(256).keys()];

function generate_palette(factor) {
    return INTENSITIES.map(c => Math.min(255, Math.round(Math.round(c / 255 * factor) / factor * 256)));
}

// La imagen que tienen que modificar viene en el parámetro image y contiene inicialmente los datos originales
// es objeto del tipo ImageData ( más info acá https://mzl.la/3rETTC6  )
// Factor indica la cantidad de intensidades permitidas (sin contar el 0)
function dither(image, factor, algorithm) {
    const kernel = KERNELS[algorithm];
    const palette = generate_palette(parseInt(factor));

    const height = image.height;
    const width = image.width;
    const quant_error = new Array(3);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = get_index(image, x, y);
            for (let i = 0; i < 3; i++) {
                const oldValue = image.data[index + i];
                const newValue = palette[oldValue];
                quant_error[i] = oldValue - newValue;
                image.data[index + i] = newValue;
            }

            const rows = kernel.length;
            const cols = kernel[0].length;
            const offset = Math.floor(cols / 2);
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    update_neighbour(x + j - offset, y + i, image, quant_error, kernel[i][j])
                }
            }
        }
    }
}

// Imágenes a restar (imageA y imageB) y el retorno en result
function substraction(imageA, imageB, result) {
    for (let i = 0; i < imageA.data.length; i++) {
        if ((i + 1) % 4 === 0) continue;
        result.data[i] = Math.abs(imageB.data[i] - imageA.data[i]);
    }
}