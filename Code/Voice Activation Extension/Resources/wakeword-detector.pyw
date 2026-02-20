# Imports. Obviously.
import openwakeword as oww
from openwakeword import Model # This is now a requirement for some reason
import sounddevice as sd
import numpy as np
import sys
import time
import os

# Current Directory
cdir = os.path.dirname(os.path.abspath(__file__))

# Tell the program where the wake word model is.
# hey_cor_tahnah.onnx says listen for "Hey Cortana" instead of "Alexa" or "OK Google".
modelPath = os.path.join(cdir, "hey_cor_tahnah.onnx")
modelName = "hey_cor_tahnah"

# Audio Setup
sampleRate = 16000
blockSize = 1280
threshold = 0.5

# Tell OWW that we're using an ONNX file, and where the file is.
ww = oww.Model(wakeword_models=[modelPath], inference_framework="onnx")

# Stores the UNIX timestamp of the last time the detector triggered
lastTrigger = 0

def AudioCallback(inputData, frames, time_info, status):
    global lastTrigger

    if status:
        print(f"Status: {status}", file=sys.stderr) # Error handling

    # Convert audio data to a 1D array
    audio = inputData.flatten()

    # Get a prediction for when the word is going to end
    prediction = ww.predict(audio)

    # Score is how close the audio is to matching the trained model
    score = prediction.get(modelName, 0.0)

    # Print the score, overwrite previous value
    print(f"\rScore: {score:.3f}", end="", flush=True)

    # This is what happens after the wake word is actually detected
    if score > threshold and (time.time() - lastTrigger) > 2:
        os.system(r'"C:\Program Files\Cortana\Cortana.exe"')
        score = 0
        lastTrigger = time.time() # Update the the lastTrigger variable to the current UNIX time
        print("\n-|- DETECTED -|-")

# Start the stream (Run it)
try:
    with sd.InputStream(
        channels = 1,
        samplerate = sampleRate,
        blocksize = blockSize,
        dtype = "int16",
        callback = AudioCallback
    ):
        print(f"Listening for model {modelName}...")
        while True:
            time.sleep(1)
except KeyboardInterrupt:
    print("\nStopped") # Say "Stopped" when CTRL+C is pressed