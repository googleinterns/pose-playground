# Pose Playground

Pose Playground is a playful way for users to experiment with different AI pose models and attach arbitary images to model keypoints. The main purpose of it is to enable non-developers to be playful with Machine Learning models.

## Demo gif

<img src="Demo.gif">

## Features 

* Allow users to upload images to be attached to key points in a pose tracked using a live webcam feed.
* Estimates user distance from the camera and have the object scale appropriately based on estimated distance.
* Allow the user to set translation and rotation offsets from keypoints. Offsets are maintained properly based on estimated distance.
* Object List and Property Editor.
* An option to treat white background as transparent.

## Setup

Clone the repository using:
```sh
git clone https://github.com/anindya-bhowmick/posenet_playground
```
Cd into posenet_playground and install dependencies:
```sh
cd posenet_playground
yarn
```
Start the dev demo server:
```sh
yarn watch
```
## References

* This repository was initially cloned from the [Posenet repository](https://github.com/tensorflow/tfjs-models/tree/master/posenet). Posenet has been used to identify the various keypoints where the assets can be attached.
* The assets for the Demo.gif were taken from [Creative Commons](https://creativecommons.org/) and it was recorded using [screencastify](https://www.screencastify.com/).
