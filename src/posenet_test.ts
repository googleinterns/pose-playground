/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as tf from '@tensorflow/tfjs';
import {describeWithFlags, NODE_ENVS} from '@tensorflow/tfjs-core/dist/jasmine_util';
import * as posenetModel from './posenet_model';
import * as resnet from './resnet';

describeWithFlags('PoseNet', NODE_ENVS, () => {
  let mobileNet: posenetModel.PoseNet;
  let resNet: posenetModel.PoseNet;
  const inputResolution = 513;
  const outputStride = 32;
  const multiplier = 1.0;
  const outputResolution = (inputResolution - 1) / outputStride + 1;
  const numKeypoints = 17;

  beforeAll((done) => {
    // Mock out the actual load so we don't make network requests in the unit
    // test.
    const resNetConfig = {
      architecture: 'ResNet50',
      outputStride: outputStride,
      inputResolution: inputResolution
    } as posenetModel.ModelConfig;

    const mobileNetConfig = {
      architecture: 'MobileNetV1',
      outputStride: outputStride,
      inputResolution: inputResolution,
      multiplier: multiplier
    } as posenetModel.ModelConfig;

    spyOn(resnet, 'ResNet').and.callFake(() => {
      return {
        inputResolution: inputResolution,
        outputStride: outputStride,
        predict: function(input: tf.Tensor3D) {
          return {
            heatmapScores:
                tf.zeros([outputResolution, outputResolution, numKeypoints]),
            offsets: tf.zeros(
                [outputResolution, outputResolution, 2 * numKeypoints]),
            displacementFwd: tf.zeros(
                [outputResolution, outputResolution, 2 * (numKeypoints - 1)]),
            displacementBwd: tf.zeros(
                [outputResolution, outputResolution, 2 * (numKeypoints - 1)])
          };
        },
        dipose: function() {}
      };
    });

    spyOn(posenetModel.mobilenetLoader, 'load').and.callFake(() => {
      return {
        inputResolution: inputResolution,
        outputStride: outputStride,
        predict: function(input: tf.Tensor3D) {
          return {
            heatmapScores:
                tf.zeros([outputResolution, outputResolution, numKeypoints]),
            offsets: tf.zeros(
                [outputResolution, outputResolution, 2 * numKeypoints]),
            displacementFwd: tf.zeros(
                [outputResolution, outputResolution, 2 * (numKeypoints - 1)]),
            displacementBwd: tf.zeros(
                [outputResolution, outputResolution, 2 * (numKeypoints - 1)])
          };
        },
        dipose: function() {}
      };
    });

    posenetModel.load(resNetConfig)
        .then((posenetInstance: posenetModel.PoseNet) => {
          resNet = posenetInstance;
        })
        .then(() => {return posenetModel.load(mobileNetConfig)})
        .then((posenetInstance: posenetModel.PoseNet) => {
          mobileNet = posenetInstance;
        })
        .then(done)
        .catch(done.fail);
  });

  it('estimatePoses does not leak memory when it is using sinlge-person decoding',
     done => {
       const input =
           tf.zeros([inputResolution, inputResolution, 3]) as tf.Tensor3D;

       const beforeTensors = tf.memory().numTensors;

       resNet
           .estimatePoses(
               input, {flipHorizontal: false, decodingMethod: 'single-person'})
           .then(
               () => {return mobileNet.estimatePoses(
                   input,
                   {flipHorizontal: false, decodingMethod: 'single-person'})})
           .then(() => {
             expect(tf.memory().numTensors).toEqual(beforeTensors);
           })
           .then(done)
           .catch(done.fail);
     });

  it('estimatePoses does not leak memory when it is using multi-person decoding',
     done => {
       const input =
           tf.zeros([inputResolution, inputResolution, 3]) as tf.Tensor3D;

       const beforeTensors = tf.memory().numTensors;
       resNet
           .estimatePoses(input, {
             flipHorizontal: false,
             decodingMethod: 'multi-person',
             maxDetections: 5,
             scoreThreshold: 0.5,
             nmsRadius: 20
           })
           .then(() => {return mobileNet.estimatePoses(input, {
                   flipHorizontal: false,
                   decodingMethod: 'multi-person',
                   maxDetections: 5,
                   scoreThreshold: 0.5,
                   nmsRadius: 20
                 })})
           .then(() => {
             expect(tf.memory().numTensors).toEqual(beforeTensors);
           })
           .then(done)
           .catch(done.fail);
     });
});
