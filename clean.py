import shutil
import os

if os.path.exists('esp_h'): shutil.rmtree('esp_h')
if os.path.exists('host'): shutil.rmtree('host')

print('Done')