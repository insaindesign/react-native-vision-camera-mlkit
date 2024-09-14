package com.visioncameramlkit.plugins

import android.util.Log
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.google.android.gms.tasks.Task
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.common.MlKitException
import com.google.mlkit.vision.pose.Pose
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseDetector
import com.google.mlkit.vision.pose.PoseDetectorOptionsBase
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import com.mrousavy.camera.core.FrameInvalidError
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import com.visioncameramlkit.utils.VisionCameraMLkitUtils.createBoundsMap
import com.visioncameramlkit.utils.VisionCameraMLkitUtils.createInputImageFromFrame
import com.visioncameramlkit.utils.VisionCameraMLkitUtils.createInvertedInputImageFromFrame
import com.visioncameramlkit.utils.VisionCameraMLkitUtils.rotatePosition
import java.util.ArrayList

private const val TAG = "VisionCameraMLkitPoseDetectionPlugin"

/**
 * A plugin for detecting poses in images using ML Kit.
 *
 * @property proxy The VisionCameraProxy instance.
 * @property options The options for the pose detector.
 */
@Suppress("KDocUnresolvedReference")
class VisionCameraMLkitPoseDetectionPlugin(
    @Suppress(
        "UNUSED_PARAMETER"
    ) proxy: VisionCameraProxy,
    options: Map<String, Any>?
) : FrameProcessorPlugin() {
    private var poseDetector: PoseDetector
    private var invertColors: Boolean = false

    init {
        val poseDetectorOptionsBuilder = PoseDetectorOptions.Builder()

        // Live detection and tracking
        poseDetectorOptionsBuilder.setDetectorMode(PoseDetectorOptions.STREAM_MODE)

        this.poseDetector = PoseDetection.getClient(poseDetectorOptionsBuilder.build())
        this.invertColors = options?.get("invertColors") as? Boolean ?: false
    }

    /**
     * Process the frame and return the detected poses.
     *
     * @param frame The frame to process.
     * @param arguments The arguments for the frame processor.
     * @returns An ArrayList of detected poses.
     */
    override fun callback(frame: Frame, arguments: Map<String, Any>?): ArrayList<Any> {
        try {
            val inputImage = if (this.invertColors) {
                createInvertedInputImageFromFrame(frame)
            } else {
                createInputImageFromFrame(frame)
            }
            val task: Task<Pose> = this.poseDetector.process(inputImage)

            val detectedPoses: Pose = Tasks.await(task)
            val array = createPosesArray(frame, detectedPoses)

            return array.toArrayList()
        } catch (e: FrameInvalidError) {
            Log.e(TAG, "FrameInvalidError occurred while processing the frame", e)
        } catch (e: MlKitException) {
            Log.e(TAG, "MlKitException occurred while processing the image with ML Kit", e)
        } catch (@Suppress("TooGenericExceptionCaught") e: Exception) {
            Log.e(TAG, "Unexpected error occurred while detecting poses", e)
        }

        return arrayListOf()
    }

    /**
     * Creates a WritableNativeArray from a list of detected poses.
     *
     * @param detectedPoses The list of detected poses.
     * @return A WritableNativeArray of detected poses.
     */
    private fun createPosesArray(frame: Frame, detectedPoses: Pose): WritableNativeArray {
        return WritableNativeArray().apply {
            detectedPoses.getAllPoseLandmarks().map { detectedPose ->
                var rotatedPosition = rotatePosition(frame, detectedPose.getPosition())
                WritableNativeMap().apply {
                    putInt("timestamp", frame.timestamp.toInt())
                    putInt("type", detectedPose.getLandmarkType())
                    putDouble("x", rotatedPosition.x.toDouble())
                    putDouble("y", rotatedPosition.y.toDouble())
                    putDouble("z", detectedPose.getPosition3D().getZ().toDouble())
                }
            }.forEach { pushMap(it) }
        }
    }
}
