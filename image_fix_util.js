let minPartConfidence = 0.0;
const unitFace = [
  {
    position: {
      x: 305.64454476875176,
      y: 344.7105314020525,
    },
  },
  {
    position: {
      x: 290.99010581300973,
      y: 325.7323255037006,
    },
  },
  {
    position: {
      x: 320.8631376299942,
      y: 331.34864305195055,
    },
  },
  {
    position: {
      x: 264.4410583094547,
      y: 330.3819990994637,
    },
  },
  {
    position: {
      x: 338.95554254766097,
      y: 343.9415165415981,
    },
  },
];

const unitShoudlers = [
  {
    position: {
      x: 205.8013897276761,
      y: 411.3047295285944,
    },
  },
  {
    position: {
      x: 356.6927626760383,
      y: 419.7183950323807,
    },
  },
];

const unitRightArm = [
  {
    position: {
      x: 457.90241187915467,
      y: 389.00553385416663,
    },
  },
  {
    position: {
      x: 418.20761844568085,
      y: 271.643679434793,
    },
  },
];

const unitLeftArm = [
  {
    position: {
      x: 99.73230810332723,
      y: 378.14085307874177,
    },
  },
  {
    position: {
      x: 174.36826819704288,
      y: 268.7266687761273,
    },
  },
];

const unitHips = [
  {
    position: {
      x: 200.28200798703915,
      y: 636.8383902834172,
    },
  },
  {
    position: {
      x: 328.6266636095549,
      y: 652.6855652792411,
    },
  },

];

export async function trimDimension(image, videoWidth, videoHeight) {
  let imgW = image.width;
  let imgH = image.height;
  if (imgW > videoWidth || imgH > videoHeight) {
    if ((imgW / videoWidth) > (imgH / videoHeight)) {
      imgH = imgH * (videoWidth / imgW);
      imgW = videoWidth;
    } else {
      imgW = imgW * (videoHeight / imgH);
      imgH = videoHeight;
    }
  }
  image.width = imgW;
  image.height = imgH;
}

function confidenceCheck(confidence, threshold = minPartConfidence) {
  return confidence >= threshold;
}

function distance(keypoint1, keypoint2) {
  const xDist = keypoint1.position.x - keypoint2.position.x;
  const yDist = keypoint1.position.y - keypoint2.position.y;

  return Math.sqrt((xDist * xDist) + (yDist * yDist));
}

function angle(refPt1, refPt2, keypoint1, keypoint2) {
  const vec1 = {
    i: refPt2.position.x - refPt1.position.x,
    j: refPt2.position.y - refPt1.position.y,
  };
  const vec2 = {
    i: keypoint2.position.x - keypoint1.position.x,
    j: keypoint2.position.y - keypoint1.position.y,
  };

  const dotProd = vec1.i*vec2.i + vec1.j*vec2.j;
  const cosTheta = dotProd / (distance(refPt1, refPt2) * distance(keypoint1, keypoint2));
  const theta = Math.acos(cosTheta);
  const determinant = vec1.i*vec2.j - vec1.j*vec2.i;
  if (determinant >= 0) {
    return theta;
  } else {
    return -theta;
  }
}

function scaleMutliplier(refPt1, refPt2, keypoint1, keypoint2) {
  const refDist = distance(refPt1, refPt2);
  const dist = distance(keypoint1, keypoint2);

  return dist/refDist;
}

function rotFinder(refPt1, refPt2, keypoint1, keypoint2) {
  return angle(refPt1, refPt2, keypoint1, keypoint2);
}

function faceEstimate(keypoints, minConf, oldData, anchorPt) {
  const calculatedData = {
    calculatedScale: oldData.calculatedScale,
    calculatedRotation: oldData.calculatedRotation,
  };
  let rem = -1;
  let count = 0;
  for (let i = 0; i < 4; i++) {
    if (confidenceCheck(keypoints[i].score, minConf)) {
      count++;
      if (count === 2) {
        calculatedData.calculatedScale = scaleMutliplier(unitFace[rem], unitFace[i], keypoints[rem], keypoints[i]);
        calculatedData.calculatedRotation = rotFinder(unitFace[rem], unitFace[i], keypoints[rem], keypoints[i]);
        break;
      }
      rem = i;
    }
  }
  return calculatedData;
}

function armEstimate(elbow, wrist, shoulderNear, shoulderFar, refElbowPt, refWristPt, refShoulderNearPt, refShoulderFarPt, minConf, oldData, anchorPt) {
  const calculatedData = {
    calculatedScale: oldData.calculatedScale,
    calculatedRotation: oldData.calculatedRotation,
  };
  if (confidenceCheck(shoulderFar.score) && confidenceCheck(shoulderNear.score) ) {
    calculatedData.calculatedScale = scaleMutliplier(refShoulderFarPt, refShoulderNearPt, shoulderFar, shoulderNear);
  }
  if (confidenceCheck(elbow.score)) {
    if (anchorPt === 2) {
      if (confidenceCheck(wrist.score)) {
        calculatedData.calculatedRotation = rotFinder(refElbowPt, refWristPt, elbow, wrist);
      }
    } else if (confidenceCheck(shoulderNear.score)) {
      calculatedData.calculatedRotation = rotFinder(refShoulderNearPt, refElbowPt, shoulderNear, elbow);
    }
  }
  return calculatedData;
}

function leftArmEstimate(keypoints, minConf, oldData, anchorPt) {
  const elbowIdx = 7;
  const wristIdx = 9;
  const shoulderIdx1 = 5;
  const shoulderIdx2 = 6;
  return armEstimate(keypoints[elbowIdx], keypoints[wristIdx], keypoints[shoulderIdx1], keypoints[shoulderIdx2], unitLeftArm[0], unitLeftArm[1], unitShoudlers[0], unitShoudlers[1], minConf, oldData, anchorPt - elbowIdx);
}

function rightArmEstimate(keypoints, minConf, oldData, anchorPt) {
  const elbowIdx = 8;
  const wristIdx = 10;
  const shoulderIdx1 = 6;
  const shoulderIdx2 = 5;
  return armEstimate(keypoints[elbowIdx], keypoints[wristIdx], keypoints[shoulderIdx1], keypoints[shoulderIdx2], unitRightArm[0], unitRightArm[1], unitShoudlers[1], unitShoudlers[0], minConf, oldData, anchorPt - elbowIdx);
}

function hipsEstimate(keypoints, minConf, oldData, anchorPt) {
  const calculatedData = {
    calculatedScale: oldData.calculatedScale,
    calculatedRotation: oldData.calculatedRotation,
  };
  const idx1 = 11;
  const idx2 = 12;
  if ( confidenceCheck(keypoints[idx1].score) && confidenceCheck(keypoints[idx2].score)) {
    calculatedData.calculatedScale = scaleMutliplier(unitHips[0], unitHips[1], keypoints[idx1], keypoints[idx2]);
    calculatedData.calculatedRotation = rotFinder(unitHips[0], unitHips[1], keypoints[idx1], keypoints[idx2]);
  }
  return calculatedData;
}

function shoulderEstimate(keypoints, minConf, oldData, anchorPt) {
  const calculatedData = {
    calculatedScale: oldData.calculatedScale,
    calculatedRotation: oldData.calculatedRotation,
  };
  const idx1 = 5;
  const idx2 = 6;
  if ( confidenceCheck(keypoints[idx1].score) && confidenceCheck(keypoints[idx2].score)) {
    calculatedData.calculatedScale = scaleMutliplier(unitShoudlers[0], unitShoudlers[1], keypoints[idx1], keypoints[idx2]);
    calculatedData.calculatedRotation = rotFinder(unitShoudlers[0], unitShoudlers[1], keypoints[idx1], keypoints[idx2]);
  }
  return calculatedData;
}

export async function scaleEstimation(keypoints, minConf, oldData, anchorPt) {
  let calculatedData = oldData;
  minPartConfidence = minConf;
  if (anchorPt <= 4) {
    calculatedData = faceEstimate(keypoints, minConf, oldData, anchorPt);
  } else if ((anchorPt == 7) || (anchorPt == 9)) {
    calculatedData = leftArmEstimate(keypoints, minConf, oldData, anchorPt);
  } else if ((anchorPt == 8) || (anchorPt == 10)) {
    calculatedData = rightArmEstimate(keypoints, minConf, oldData, anchorPt);
  } else if ((anchorPt == 11) || (anchorPt == 12)) {
    calculatedData = hipsEstimate(keypoints, minConf, oldData, anchorPt);
  } else {
    calculatedData = shoulderEstimate(keypoints, minConf, oldData, anchorPt);
  }
  return calculatedData;
}

export async function imageDrawer(keypoint, ctx, calculatedData, absoluteScale, xOffset, yOffset, minPartConfidence, attachedImg, rotationOffset) {
  if (confidenceCheck(keypoint.score, minPartConfidence)) {
    const calculatedScale = calculatedData.calculatedScale;
    const calculatedRotation = calculatedData.calculatedRotation;
    const netScale = calculatedScale * absoluteScale;
    const dWidth = attachedImg.width * netScale;
    const dHeight = attachedImg.height * netScale;
    const dx = keypoint.position.x - (dWidth/2) + (xOffset * calculatedScale);
    const dy = keypoint.position.y - (dHeight/2) + (yOffset * calculatedScale);
    ctx.save();
    ctx.translate(keypoint.position.x, keypoint.position.y);
    ctx.rotate(calculatedRotation);
    ctx.translate(-keypoint.position.x, -keypoint.position.y);
    ctx.translate(dx + (dWidth/2), dy + (dHeight/2));
    ctx.rotate(rotationOffset);
    ctx.translate(-dx - (dWidth/2), -dy - (dHeight/2));
    ctx.drawImage(attachedImg, dx, dy, dWidth, dHeight);
    ctx.restore();
  }
}
