import os
import sys
import subprocess
import re
import time
import atexit
import threading
import urllib.request
import urllib.error

# --- Configuration (Dynamically resolved!) ---
# Find the absolute directory where this dev.py file is sitting
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Build all other paths relative to BASE_DIR
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
FRONTEND_ENV_FILE = os.path.join(FRONTEND_DIR, ".env")
CLOUDFLARED_EXE = os.path.join(BASE_DIR, "cloudflared", "cloudflared.exe")

LOCAL_URL = "http://localhost:8000"

processes = []

def kill_process_tree(pid):
    try:
        subprocess.call(['taskkill', '/F', '/T', '/PID', str(pid)], 
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

def cleanup():
    print("\nSHUTTING DOWN...")

    if os.path.exists(FRONTEND_ENV_FILE):
        with open(FRONTEND_ENV_FILE, "r", encoding="utf-8") as f:
            env_content = f.readlines()

        updated = False
        for i, line in enumerate(env_content):
            if line.startswith("VITE_BACKEND_URL="):
                env_content[i] = f"VITE_BACKEND_URL={LOCAL_URL}\n"
                updated = True
                break

        if not updated:
            env_content.append(f"\nVITE_BACKEND_URL={LOCAL_URL}\n")

        with open(FRONTEND_ENV_FILE, "w", encoding="utf-8") as f:
            f.writelines(env_content)
        print("Reverted frontend/.env back to localhost.")

    for p in processes:
        kill_process_tree(p.pid)
        
    print("Done!\n")

atexit.register(cleanup)

def consume_stream(stream):
    for _ in stream:
        pass

def wait_for_backend(url, timeout=30):
    print("-> Waiting for Uvicorn to become available...")
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            urllib.request.urlopen(url)
            print("Uvicorn is up and running!")
            return True
        except urllib.error.HTTPError:
            # If the server returns a 404 Not Found, it means the server IS actually running!
            print("Uvicorn is up and running!")
            return True
        except urllib.error.URLError:
            time.sleep(0.5)
            
    print("Uvicorn took too long to start.")
    return False

def main():
    print(r"""
       _               _          
   ___| |__   ___  ___| | ___   _ 
  / __| '_ \ / _ \/ __| |/ / | | |
 | (__| | | |  __/ (__|   <| |_| |
  \___|_| |_|\___|\___|_|\_\\__, |
                            |___/ 
          
    Hệ thống check-in tự động
          """)
    print("\n" + "="*50)
    print("\nStarting Checky selfhost\n\n")

    # 1. Start Backend
    print("* Starting Backend (Uvicorn)...")
    backend_proc = subprocess.Popen("uvicorn main:app --reload", shell=True, cwd=BACKEND_DIR)
    processes.append(backend_proc)
    
    # Wait for backend, and FREEZE if it fails
    if not wait_for_backend(LOCAL_URL):
        input("\nERROR: Uvicorn failed to start.")
        sys.exit(1)

    # 2. Start Cloudflare (Using dynamic path)
    print("* Starting Cloudflare Tunnel...")
    cf_proc = subprocess.Popen(
        f'"{CLOUDFLARED_EXE}" tunnel --url {LOCAL_URL}', 
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        cwd=BACKEND_DIR
    )
    processes.append(cf_proc)

    # 3. Read Cloudflare logs to catch the URL
    tunnel_url = None
    url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")
    
    for line in cf_proc.stderr:
        print(f"[Cloudflare] {line.strip()}") # Print CF logs so we can see if it's failing
        match = url_pattern.search(line)
        if match:
            tunnel_url = match.group(0)
            break

    # FREEZE if Cloudflare fails
    if not tunnel_url:
        print("Failed to find Cloudflare tunnel URL.")
        input("\nERROR: Cloudflare failed.")
        sys.exit(1)

    print(f"\nSUCCESS: Backend is live at: {tunnel_url}\n")
    
    threading.Thread(target=consume_stream, args=(cf_proc.stderr,), daemon=True).start()

    # 4. Update the .env file
    env_content = []
    if os.path.exists(FRONTEND_ENV_FILE):
        with open(FRONTEND_ENV_FILE, "r", encoding="utf-8") as f:
            env_content = f.readlines()

    updated = False
    for i, line in enumerate(env_content):
        if line.startswith("VITE_BACKEND_URL="):
            env_content[i] = f"VITE_BACKEND_URL={tunnel_url}\n"
            updated = True
            break

    if not updated:
        env_content.append(f"\nVITE_BACKEND_URL={tunnel_url}\n")

    with open(FRONTEND_ENV_FILE, "w", encoding="utf-8") as f:
        f.writelines(env_content)
    print("Wired Frontend to the new Tunnel.")

    # 5. Start Frontend
    print("* Starting Frontend (Vite)...")
    frontend_proc = subprocess.Popen("npm run dev", shell=True, cwd=FRONTEND_DIR)
    processes.append(frontend_proc)

    print("\n" + "="*50)
    print("Started!")
    print("Press Ctrl+C to stop")
    print("="*50 + "\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()