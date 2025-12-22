import sounddevice as sd
import numpy as np
from openwakeword import Model
from openwakeword.utils import download_models
import time

download_models()
oww = Model()  # built-in wake words

SAMPLE_RATE = 16000
BLOCKSIZE = 1600

def cb(indata, frames, time_info, status):
    audio = indata[:,0].astype(np.float32)
    preds = oww.predict(audio)
    print(preds)  # print every 100ms chunk

with sd.InputStream(
    samplerate=SAMPLE_RATE,
    channels=1,
    blocksize=BLOCKSIZE,
    dtype="float32",
    device=None,  # can set explicit device index if needed
    callback=cb
):
    print("Speak something...")
    while True:
        time.sleep(1)
