
import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onImageCapture: (image: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onImageCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 480 } } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
        setStream(mediaStream);
        setIsCameraActive(true);
        setHasPermission(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setHasPermission(false);
      toast.error("Camera access denied. Please try using file upload instead.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      console.log("Capturing image...");
      console.log("Video dimensions:", video.videoWidth, video.videoHeight);
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        try {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get data URL from canvas
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          console.log("Image captured successfully");
          setCapturedImage(imageDataUrl);
          
          // Pass the captured image up
          onImageCapture(imageDataUrl);
          
          // Stop the camera
          stopCamera();
        } catch (error) {
          console.error("Error capturing image:", error);
          toast.error("Failed to capture image. Please try again.");
        }
      }
    } else {
      console.error("Video or canvas ref is null");
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file) {
      if (!file.type.match('image.*')) {
        toast.error("Please select an image file.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const imageDataUrl = e.target.result.toString();
          setCapturedImage(imageDataUrl);
          onImageCapture(imageDataUrl);
          
          // If camera is active, stop it
          if (isCameraActive) {
            stopCamera();
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const resetCapture = () => {
    setCapturedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clean up function to stop camera when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="fbi-panel relative">
      <h2 className="text-lg font-semibold mb-3 text-fbi-navy">Subject Identification</h2>
      
      {capturedImage ? (
        <div className="relative">
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full max-h-[400px] object-contain border border-gray-300" 
          />
          <div className="flex justify-between mt-2">
            <Button 
              onClick={resetCapture}
              variant="outline"
              className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
            >
              <RefreshCcw size={16} />
              <span>Retake Photo</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative">
          {isCameraActive ? (
            <>
              <div className="relative">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-[300px] object-cover border border-gray-300 bg-black"
                />
                <div className="scanning-line"></div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white text-center text-sm">
                  Camera is active - position your face in frame
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-3">
                <Button 
                  onClick={captureImage}
                  className="official-btn flex items-center gap-2"
                >
                  <Camera size={18} />
                  <span>Take Photo</span>
                </Button>
                <Button 
                  onClick={stopCamera}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="border border-gray-300 bg-fbi-lightgray h-[300px] flex items-center justify-center flex-col p-4">
              <p className="mb-6 text-center text-fbi-gray">
                Please capture an image or upload a photo to identify the subject
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
                <Button 
                  onClick={startCamera}
                  className="official-btn flex items-center gap-2"
                  disabled={hasPermission === false}
                >
                  <Camera size={18} />
                  <span>Take Photo</span>
                </Button>
                <Button 
                  onClick={handleUploadClick}
                  className="bg-fbi-gray text-white hover:bg-gray-600 flex items-center gap-2"
                >
                  <Upload size={18} />
                  <span>Upload Image</span>
                </Button>
              </div>
              {hasPermission === false && (
                <p className="mt-4 text-sm text-red-600">
                  Camera access denied. Please enable camera permissions or use file upload instead.
                </p>
              )}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}
      
      {/* Hidden canvas for capturing images */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
