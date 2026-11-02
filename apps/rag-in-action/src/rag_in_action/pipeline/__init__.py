import os

# faiss, torch and sklearn each ship a libomp; with more than one OpenMP thread they segfault
# on macOS when called from Streamlit's script thread. Must be set before any of them loads.
os.environ.setdefault("OMP_NUM_THREADS", "1")
