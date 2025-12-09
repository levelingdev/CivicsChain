from dotenv import load_dotenv
import os

load_dotenv()

# Email Config
from_email = "noumbiap.anthony@ictuniversity.edu.cm"
app_password = "vrwt uihw cnpg cgop"

# Cloud Storage Limits
MAX_FILE_SIZE = 3 * 1024 * 1024 * 1024  # 3GB Limit
CHUNK_SIZE = 2 * 1024 * 1024     # 2MB Chunks (Better for speed)
MAX_NODES_PER_FILE = 3