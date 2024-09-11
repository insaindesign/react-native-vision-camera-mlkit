import { useMemo } from 'react';
import { VisionCameraProxy, type Frame } from 'react-native-vision-camera';
import type {
  Pose,
  PoseDetectorPlugin,
  PoseDetectorPluginOptions,
} from '../types';

import { LINKING_ERROR } from '../constants/LINKING_ERROR';

/**
 * Create a new instance of the {@link PoseDetectorPlugin}.
 *
 * @param options - The plugin options {@link PoseDetectorPluginOptions}.
 *
 * @returns The plugin instance {@link PoseDetectorPlugin}.
 *
 * @throws Will throw an error if the plugin cannot be initialized.
 */
const createPoseDetectorPlugin = (
  options?: PoseDetectorPluginOptions
): PoseDetectorPlugin => {
  const plugin = VisionCameraProxy.initFrameProcessorPlugin('poseDetector', {
    ...options,
  });

  if (!plugin) throw new Error(LINKING_ERROR);

  return {
    /**
     * Detects objects in a given frame.
     *
     * @param frame - The frame processor {@link Frame}.
     * @returns An array containing the detected {@link Pose} data.
     */
    poseDetector: (frame: Frame): Pose[] => {
      'worklet';
      return plugin.call(frame) as unknown as Pose[];
    },
  };
};

/**
 * Custom hook to use an instance of the {@link PoseDetectorPlugin}.
 *
 * @param options - The plugin options {@link PoseDetectorPluginOptions}.
 *
 * @returns {PoseDetectorPlugin} A memoized plugin instance that will be
 * destroyed once the component using `usePoseDetector()` unmounts.
 *
 * @example
 * ```ts
 * const objectPlugin = usePoseDetector({ enableMultipleObjects: true });
 * const frameProcessor = useFrameProcessor((frame) => {
 *   'worklet';
 *   const objects = objectPlugin.PoseDetector(frame);
 *   console.log(objects);
 * }, [objectPlugin]);
 * ```
 */
export const usePoseDetector = (
  options?: PoseDetectorPluginOptions
): PoseDetectorPlugin => {
  return useMemo(() => createPoseDetectorPlugin(options), [options]);
};
