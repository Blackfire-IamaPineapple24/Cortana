import openwakeword
import sounddevice as sd
import numpy as np
import sys
import time
from openwakeword.utils import download_models

# Ensure models are available
download_models()

MODEL_PATH = "Code/Resources/hey_cor_tahnah.onnx"
# Note: openWakeWord uses the filename (without .onnx) as the key
MODEL_NAME = "hey_cor_tahnah"

SAMPLE_RATE = 16000
# openWakeWord works best with 80ms or 100ms chunks (1280 or 1600 samples)
BLOCKSIZE = 1280  
THRESHOLD = 0.5

# Initialize model
oww = openwakeword.Model(
    wakeword_models=[MODEL_PATH],
    inference_framework="onnx"
)

last_trigger = 0

def audio_callback(indata, frames, time_info, status):
    global last_trigger

    if status:
        print(f"Status: {status}", file=sys.stderr)

    # 1. Convert to 1D array
    # 2. Ensure data is int16 (if InputStream is set to int16)
    audio = indata.flatten()

    # Get prediction
    prediction = oww.predict(audio)

    # Get score for our specific model
    # Note: Ensure MODEL_NAME matches the filename exactly
    score = prediction.get(MODEL_NAME, 0.0)

    # Debug output
    print(f"\rScore: {score:.3f}", end="", flush=True)

    if score > THRESHOLD and (time.time() - last_trigger) > 2:
        last_trigger = time.time()
        print("\n*** Wake Word Detected! ***")

# Start the stream
try:
    with sd.InputStream(
        channels=1,
        samplerate=SAMPLE_RATE,
        blocksize=BLOCKSIZE,
        dtype="int16", # Changed from float32
        callback=audio_callback
    ):
        print(f"Listening for 'Hey Cortana'...")
        while True:
            time.sleep(1)
except KeyboardInterrupt:
    print("\nStopped.")

# This is AI code, but I know a decent bit of python. Why? I couldn't be bothered.
# I'll fix it later. This isn't the final version of the script anyway.
# See https://github.com/Blackfire-IamaPineapple24/Cortana/blob/voice-support/Code/wakeword-detector.py