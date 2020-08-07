// To remove white background, a flood-fill algorithm is used.
// We use flood fill from all the points on the four boundaries of the image.
// If we find a point that is white/ fits within the margin of error we make it transparent
// We treat transparent points as white points as well during propagation

function compareColor(pixR, pixG, pixB, opacity, refR, refG, refB, marginOfError) {
  if (opacity == 0) {
    return true;
  }
  if (Math.max(Math.abs(pixR-refR), Math.abs(pixG-refG), Math.abs(pixB - refB)) <= marginOfError) {
    return true;
  }
  return false;
}

function returnNeighbours(index, height, width) {
  let neighbours = [];
  let i = index[0];
  let j = index[1];
  if ((i + 1) < height) {
    let down = {
      rowNum: i+1,
      colNum: j,
      pixArrayValue: (((i+1) * width) + j) * 4,

    };
    neighbours.push(down);
  }
  if ((i - 1) >= 0) {
    let up = {
      rowNum: i-1,
      colNum: j,
      pixArrayValue: (((i-1) * width) + j) * 4,
    };
    neighbours.push(up);
  }
  if ((j + 1) < width) {
    let right = {
      rowNum: i,
      colNum: j+1,
      pixArrayValue: ((i*width) + (j+1)) * 4,
    };
    neighbours.push(right);
  }
  if ((j - 1) >= 0) {
    let left = {
      rowNum: i,
      colNum: j-1,
      pixArrayValue: ((i*width) + (j-1)) * 4,
    };
    neighbours.push(left);
  }
  return neighbours;
}

function floodFillDFS(boundaryData, imageData, red, green, blue, marginOfError) {
  let stack = boundaryData.stack;
  let marked = boundaryData.marked;
  let count = stack.length;
  let pixArray = imageData.data;
  let imgW = imageData.width;
  let imgH = imageData.height;
  while (count > 0) {
    let top = stack.pop();
    count--;
    let transparencyIndex = (top[0] * imgW * 4) + (top[1] * 4) + 3;
    pixArray[transparencyIndex] = 0;
    let neighbours = returnNeighbours(top, imgH, imgW);

    neighbours.forEach(function(value) {
        let row = value.rowNum;
        let col = value.colNum;
        let index = value.pixArrayValue;
        if (marked[row][col] == 0 && (compareColor(
                                        pixArray[index],
                                        pixArray[index+1],
                                        pixArray[index+2],
                                        pixArray[index+3],
                                        red,
                                        green,
                                        blue,
                                        marginOfError
                                      ))) {
          marked[row][col] = 1;
          stack.push([row, col]);
          count++;
        }
    });
  }
  return imageData;
}

function getBoundary(imageData, red, green, blue, marginOfError) {
  let pixArray = imageData.data;
  let stack = [];
  const imgW = imageData.width;
  const imgH = imageData.height;
  let marked = [];
  for (let i = 0; i < imgH; i++) {
    let row = [];
    for (let j = 0; j < imgW; j++) {
      row.push(0);
    }
    marked.push(row);
  }

  for (let i = 0; i < imgH; i++) {
    let index1 = i * imgW * 4;
    let index2 = (i * imgW * 4) + ((imgW - 1) * 4);
    if ((marked[i][0] == 0) && (compareColor(
                                  pixArray[index1],
                                  pixArray[index1+1],
                                  pixArray[index1+2],
                                  pixArray[index1+3],
                                  red,
                                  green,
                                  blue,
                                  marginOfError
                                ))) {
      marked[i][0] = 1;
      stack.push([i, 0]);
    }
    if ((marked[i][imgW - 1] == 0) && (compareColor(
                                        pixArray[index2],
                                        pixArray[index2+1],
                                        pixArray[index2+2],
                                        pixArray[index2+3],
                                        red,
                                        green,
                                        blue,
                                        marginOfError
                                        ))) {
      marked[i][imgW - 1] = 1;
      stack.push([i, imgW - 1]);
    }
  }

  for (let i = 1; i < imgW - 1; i++) {
    let index1 = i * 4;
    let index2 = ((imgH -1) * imgW * 4) + i * 4;
    if ((marked[0][i]==0) && (compareColor(
                                pixArray[index1],
                                pixArray[index1+1],
                                pixArray[index1+2],
                                pixArray[index1+3],
                                red,
                                green,
                                blue,
                                marginOfError
                              ))) {
      marked[0][i] = 1;
      stack.push([0, i]);
    }
    if ((marked[imgH - 1][i]==0) && (compareColor(
                                      pixArray[index2],
                                      pixArray[index2+1],
                                      pixArray[index2+2],
                                      pixArray[index2+3],
                                      red,
                                      green,
                                      blue,
                                      marginOfError
                                    ))) {
      marked[imgH - 1][i] = 1;
      stack.push([imgH - 1, i]);
    }
  }
  return {
    stack: stack,
    marked: marked,
  };
}

function removeBoundaryColor(imageData, red, green, blue, marginOfError) {
  let boundaryData = getBoundary(imageData, red, green, blue, marginOfError);
  return floodFillDFS(boundaryData, imageData, red, green, blue, marginOfError);
}

export async function removeBackground(image, marginOfError) {
  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');
  const imgW = image.width;
  const imgH = image.height;
  canvas.width = imgW;
  canvas.height = imgH;
  ctx.drawImage(image, 0, 0, imgW, imgH);
  let imageData = ctx.getImageData(0, 0, imgW, imgH);
  imageData = removeBoundaryColor(imageData, 255, 255, 255, marginOfError);
  ctx.putImageData(imageData, 0, 0);
  image.src = canvas.toDataURL();
}
