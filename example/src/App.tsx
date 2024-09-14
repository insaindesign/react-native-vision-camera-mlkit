import React, { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import {
  Camera,
  Templates,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useSkiaFrameProcessor,
} from 'react-native-vision-camera';
import * as plugins from 'react-native-vision-camera-mlkit';
import { Skia, PaintStyle } from '@shopify/react-native-skia';

const paint = Skia.Paint();
paint.setStyle(PaintStyle.Fill);
paint.setStrokeWidth(2);
paint.setColor(Skia.Color('red'));

const linePaint = Skia.Paint();
linePaint.setStyle(PaintStyle.Fill);
linePaint.setStrokeWidth(4);
linePaint.setColor(Skia.Color('lime'));

export default function App() {
  const [targetFps] = useState(16);
  const [isForeground, setIsForeground] = useState(
    AppState.currentState === 'active'
  );
  const isActive = isForeground;

  const camera = useRef<Camera>(null);

  const { poseDetector } = plugins.usePoseDetector({});

  const { hasPermission, requestPermission } = useCameraPermission();

  const device = useCameraDevice('back');
  const format = useCameraFormat(device, Templates.FrameProcessing);

  const fps = Math.min(format?.maxFps ?? 1, targetFps);

  useEffect(() => {
    const listener = AppState.addEventListener('change', (state): void => {
      setIsForeground(state === 'active');
    });
    return () => listener.remove();
  }, [setIsForeground]);

  const skiaFrameProcessor = useSkiaFrameProcessor((frame) => {
    'worklet';
    frame.render();

    const poses = poseDetector(frame as any);

    for (const [from, to] of lines) {
      const pointFrom = poses[from];
      const pointTo = poses[to];
      if (pointFrom && pointTo) {
        frame.drawLine(
          pointFrom.x,
          pointFrom.y,
          pointTo.x,
          pointTo.y,
          linePaint
        );
      }
    }

    for (const pose of poses) {
      if (points.includes(pose.type)) {
        frame.drawCircle(pose.x, pose.y, 6, paint);
      }
    }
  }, []);

  useEffect(() => {
    !hasPermission && requestPermission();
  }, [hasPermission, requestPermission]);

  if (!device || !hasPermission) return null;

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        fps={fps}
        zoom={1}
        isActive={isActive}
        pixelFormat="yuv"
        device={device}
        format={format}
        frameProcessor={skiaFrameProcessor}
        style={StyleSheet.absoluteFill}
        onError={console.error}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const lines: [number, number][] = [
  [18, 20],
  [16, 20],
  [16, 18],
  [16, 22],
  [16, 14],
  [12, 14],
  [12, 11],
  [12, 24],
  [23, 24],
  [26, 24],
  [26, 28],
  [32, 28],
  [32, 30],
  [28, 30],
  [25, 23],
  [25, 27],
  [29, 27],
  [29, 31],
  [27, 31],
  [11, 23],
  [11, 13],
  [15, 13],
  [15, 21],
  [15, 19],
  [15, 17],
  [17, 19],
];

const points = [
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  30, 31, 32,
];
