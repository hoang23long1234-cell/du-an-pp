import cv2
import os

video_path = r"C:\Users\admin\Downloads\1792897407425_624839249307347119_7117413657222754242.mp4"
output_dir = r"C:\Users\admin\.gemini\antigravity\brain\0921c725-7f46-4040-842b-c3e9f208154e\video_frames"
os.makedirs(output_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = total_frames / fps
print(f"Video loaded: {total_frames} frames, {fps:.1f} FPS, {duration:.1f}s duration")

# Extract 1 frame per second
interval = int(fps)
frame_idx = 0
saved_idx = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    if frame_idx % interval == 0:
        out_name = os.path.join(output_dir, f"frame_{saved_idx:03d}.jpg")
        cv2.imwrite(out_name, frame)
        saved_idx += 1
    frame_idx += 1

cap.release()
print(f"Extracted {saved_idx} frames to {output_dir}")
