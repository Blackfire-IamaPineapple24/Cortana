import openwakeword
import sounddevice as sd
import numpy as np
import sys
import time
from openwakeword.utils import download_models

download_models()
print("Models Downloaded")

MODEL_PATH = "hey_cor_tahnah.onnx"
MODEL_NAME = "hey_cor_tahnah"

SAMPLE_RATE = 16000
BLOCKSIZE = 1600   # IMPORTANT: 100ms frames
THRESHOLD = 0.5

oww = openwakeword.Model(
    wakeword_models=[MODEL_PATH],
    inference_framework="onnx"
)

last_trigger = 0

def audio_callback(indata, frames, time_info, status):
    global last_trigger

    if status:
        print(status, file=sys.stderr)

    # Ensure correct format
    audio = indata[:, 0].astype(np.float32)

    prediction = oww.predict(audio)

    score = prediction.get(MODEL_NAME, 0.0)

    # Live debug score (optional)
    print(f"\rScore: {score:.3f}", end="")

    if score > THRESHOLD and time.time() - last_trigger > 2:
        last_trigger = time.time()
        print("\nDetected!")
        sys.stdout.flush()

with sd.InputStream(
    channels=1,
    samplerate=SAMPLE_RATE,
    blocksize=BLOCKSIZE,
    dtype="float32",
    callback=audio_callback
):
    print("\nListening...")
    while True:
        time.sleep(1)
