import os
import tempfile
os.environ["NUMBA_CACHE_DIR"] = os.path.join(tempfile.gettempdir(), "numba_cache")
os.makedirs(os.environ["NUMBA_CACHE_DIR"], exist_ok=True)

from rembg import remove
from PIL import Image

input_path = "Logo.png"
output_path = "Logo_transparent.png"
original_path = "Logo_backup.png"

# Backup original
if not os.path.exists(original_path):
    os.rename(input_path, original_path)

input_image = Image.open(original_path)
output_image = remove(input_image)
output_image.save(input_path)

print("Background removed successfully!")
